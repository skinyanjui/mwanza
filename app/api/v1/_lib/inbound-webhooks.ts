import { ApiError, apiJson, cleanString, type ApiContext } from "./security";
import { dispatchOutboundWebhooks, requireWebhookSecret, storeInboundEvent, verifyHmacSignature } from "./events";

function parsePayload(raw: string) {
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { throw new ApiError(400, "invalid_json", "The webhook payload is not valid JSON."); }
}

async function webhookBody(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 800 * 1024) throw new ApiError(413, "payload_too_large", "Webhook payloads must be 800 KB or smaller.");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 800 * 1024) throw new ApiError(413, "payload_too_large", "Webhook payloads must be 800 KB or smaller.");
  return raw;
}

function eventIdFrom(payload: Record<string, unknown>, provider: string) {
  const direct = payload.id || payload.eventId || payload.event_id || payload.transactionId || payload.transaction_id;
  if (direct) return cleanString(String(direct), 180);
  if (provider === "mpesa") {
    const body = payload.Body as { stkCallback?: Record<string, unknown> } | undefined;
    const callback = body?.stkCallback;
    const callbackId = cleanString(String(callback?.CheckoutRequestID || callback?.MerchantRequestID || ""), 180);
    if (callbackId) return callbackId;
  }
  if (provider === "whatsapp") {
    const entry = Array.isArray(payload.entry) ? payload.entry[0] as Record<string, unknown> | undefined : undefined;
    const change = Array.isArray(entry?.changes) ? entry?.changes[0] as Record<string, unknown> | undefined : undefined;
    const value = change?.value as Record<string, unknown> | undefined;
    const message = Array.isArray(value?.messages) ? value?.messages[0] as Record<string, unknown> | undefined : undefined;
    const status = Array.isArray(value?.statuses) ? value?.statuses[0] as Record<string, unknown> | undefined : undefined;
    const whatsappId = cleanString(String(message?.id || status?.id || ""), 180);
    if (whatsappId) return whatsappId;
  }
  return crypto.randomUUID();
}

function mpesaCallback(payload: Record<string, unknown>) {
  const body = payload.Body as { stkCallback?: Record<string, unknown> } | undefined;
  const callback = body?.stkCallback ?? payload;
  const metadata = (callback.CallbackMetadata as { Item?: Array<{ Name?: string; Value?: unknown }> } | undefined)?.Item ?? [];
  const values = Object.fromEntries(metadata.map(item => [String(item.Name ?? ""), item.Value]));
  return {
    checkoutRequestId: cleanString(String(callback.CheckoutRequestID ?? payload.CheckoutRequestID ?? ""), 180),
    merchantRequestId: cleanString(String(callback.MerchantRequestID ?? payload.MerchantRequestID ?? ""), 180),
    resultCode: Number(callback.ResultCode ?? payload.ResultCode ?? -1),
    resultDescription: cleanString(String(callback.ResultDesc ?? payload.ResultDesc ?? ""), 500),
    receiptNumber: cleanString(String(values.MpesaReceiptNumber ?? payload.MpesaReceiptNumber ?? ""), 120),
    amount: Number(values.Amount ?? payload.Amount ?? 0),
    phone: cleanString(String(values.PhoneNumber ?? payload.PhoneNumber ?? ""), 40),
    transactionDate: cleanString(String(values.TransactionDate ?? payload.TransactionDate ?? ""), 40),
  };
}

export async function handleMpesaWebhook(context: ApiContext) {
  requireWebhookSecret(context.request, "MPESA_CALLBACK_TOKEN");
  const payload = parsePayload(await webhookBody(context.request));
  const callback = mpesaCallback(payload); const externalEventId = eventIdFrom(payload, "mpesa");
  const stored = await storeInboundEvent(context.admin.db, { provider: "mpesa", eventId: externalEventId, eventType: callback.resultCode === 0 ? "payment.succeeded" : "payment.failed", payload });
  if (stored.duplicate) return apiJson({ received: true, duplicate: true });
  let paymentQuery = callback.checkoutRequestId ? context.admin.db.collection("payments").where("checkoutRequestId", "==", callback.checkoutRequestId) : null;
  if (!paymentQuery && callback.merchantRequestId) paymentQuery = context.admin.db.collection("payments").where("merchantRequestId", "==", callback.merchantRequestId);
  if (paymentQuery) {
    const payments = await paymentQuery.limit(1).get();
    if (!payments.empty) {
      const payment = payments.docs[0]; const status = callback.resultCode === 0 ? "Succeeded" : "Failed";
      await payment.ref.set({ status, providerReference: callback.receiptNumber || callback.checkoutRequestId, providerPayload: callback, failureReason: callback.resultCode === 0 ? null : callback.resultDescription, paidAt: callback.resultCode === 0 ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }, { merge: true });
      await dispatchOutboundWebhooks(context.admin.db, { event: `payment.${status.toLowerCase()}`, organizationId: payment.data().organizationId, data: { id: payment.id, status, providerReference: callback.receiptNumber || callback.checkoutRequestId } });
    }
  }
  return apiJson({ received: true });
}

export async function handleWhatsAppWebhook(context: ApiContext) {
  if (context.request.method === "GET") {
    const query = new URL(context.request.url).searchParams; const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
    if (query.get("hub.mode") === "subscribe" && expected && query.get("hub.verify_token") === expected) return new Response(query.get("hub.challenge") ?? "", { status: 200, headers: { "content-type": "text/plain" } });
    throw new ApiError(403, "whatsapp_verification_failed", "WhatsApp verification failed.");
  }
  const raw = await webhookBody(context.request); const secret = process.env.WHATSAPP_APP_SECRET ?? "";
  if (!await verifyHmacSignature(raw, context.request.headers.get("x-hub-signature-256"), secret)) throw new ApiError(401, "invalid_webhook_signature", "WhatsApp signature verification failed.");
  const payload = parsePayload(raw); const externalEventId = eventIdFrom(payload, "whatsapp");
  const stored = await storeInboundEvent(context.admin.db, { provider: "whatsapp", eventId: externalEventId, eventType: "message.received", payload });
  return apiJson({ received: true, duplicate: stored.duplicate });
}

export async function handleCrmWebhook(context: ApiContext) {
  const raw = await webhookBody(context.request); const secret = process.env.CRM_WEBHOOK_SECRET ?? "";
  if (!await verifyHmacSignature(raw, context.request.headers.get("x-mwenza-signature"), secret)) throw new ApiError(401, "invalid_webhook_signature", "CRM signature verification failed.");
  const payload = parsePayload(raw); const externalEventId = eventIdFrom(payload, "crm"); const eventType = cleanString(payload.eventType || payload.type, 120) || "crm.event";
  const stored = await storeInboundEvent(context.admin.db, { provider: "crm", eventId: externalEventId, eventType, payload });
  if (!stored.duplicate && eventType === "lead.updated") {
    const requestId = cleanString(payload.requestId || (payload.data as Record<string, unknown> | undefined)?.requestId, 80); const status = cleanString(payload.status || (payload.data as Record<string, unknown> | undefined)?.status, 60);
    const allowedStatuses = new Set(["New lead", "Site assessment", "Proposal sent", "Won", "Closed"]);
    if (requestId && allowedStatuses.has(status)) {
      const ref = context.admin.db.collection("businessRequests").doc(requestId);
      if ((await ref.get()).exists) await ref.set({ status, crmReference: cleanString(payload.crmReference, 160) || null, updatedAt: new Date().toISOString() }, { merge: true });
    }
  }
  return apiJson({ received: true, duplicate: stored.duplicate });
}
