import type { Firestore } from "firebase-admin/firestore";
import { ApiError, cleanString, normalizeDocument, recordId } from "./security";

async function hmac(secret: string, content: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(content));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function verifyHmacSignature(body: string, header: string | null, secret: string, prefix = "sha256=") {
  if (!header || !secret) return false;
  const supplied = header.startsWith(prefix) ? header.slice(prefix.length) : header;
  return constantTimeEqual(supplied.toLowerCase(), await hmac(secret, body));
}

export async function dispatchOutboundWebhooks(db: Firestore, input: { event: string; data: Record<string, unknown>; organizationId?: string | null }) {
  try {
    if (!input.organizationId) return [];
    const snapshot = await db.collection("outboundWebhooks").where("organizationId", "==", input.organizationId).where("active", "==", true).limit(100).get();
    const subscriptions = snapshot.docs.filter(document => {
      const value = document.data();
      const events = Array.isArray(value.events) ? value.events.map(String) : [];
      return events.includes(input.event);
    });
    if (!subscriptions.length) return [];

    const eventId = recordId("MWE");
    const payload = JSON.stringify({ id: eventId, type: input.event, createdAt: new Date().toISOString(), data: input.data });
    return await Promise.all(subscriptions.map(async subscription => {
      const config = subscription.data();
      const deliveryId = recordId("MWD");
      const secretSnapshot = await db.collection("webhookSecrets").doc(subscription.id).get();
      const secret = cleanString(secretSnapshot.data()?.secret, 300);
      const deliveryRef = db.collection("webhookDeliveries").doc(deliveryId);
      await deliveryRef.set({ id: deliveryId, eventId, webhookId: subscription.id, organizationId: config.organizationId ?? null, event: input.event, url: config.url, status: "Sending", attempts: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      try {
        const response = await fetch(String(config.url), {
          method: "POST",
          headers: { "content-type": "application/json", "user-agent": "Mwenza-Webhooks/1.0", "x-mwenza-event": input.event, "x-mwenza-event-id": eventId, "x-mwenza-signature": `sha256=${await hmac(secret, payload)}` },
          body: payload,
          signal: AbortSignal.timeout(7000),
        });
        const responseText = (await response.text()).slice(0, 1200);
        await deliveryRef.set({ status: response.ok ? "Delivered" : "Failed", responseStatus: response.status, responseBody: responseText, deliveredAt: response.ok ? new Date().toISOString() : null, nextAttemptAt: response.ok ? null : new Date(Date.now() + 5 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
        return { deliveryId, delivered: response.ok, status: response.status };
      } catch (reason) {
        await deliveryRef.set({ status: "Failed", responseBody: reason instanceof Error ? reason.message.slice(0, 1200) : "Delivery failed", nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
        return { deliveryId, delivered: false, status: 0 };
      }
    }));
  } catch (reason) {
    console.error("outbound_webhook_dispatch_failed", { event: input.event, organizationId: input.organizationId, reason });
    return [];
  }
}

export async function storeInboundEvent(db: Firestore, input: { provider: string; eventId: string; eventType: string; payload: unknown }) {
  const ref = db.collection("inboundWebhookEvents").doc(`${input.provider}-${input.eventId}`.replaceAll(/[^a-zA-Z0-9_-]/g, "_").slice(0, 220));
  try {
    await ref.create({ id: ref.id, provider: input.provider, externalEventId: input.eventId, eventType: input.eventType, payload: input.payload, status: "Received", receivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return { duplicate: false, event: normalizeDocument(ref.id, (await ref.get()).data()) };
  } catch (reason) {
    const code = String((reason as { code?: unknown }).code ?? "");
    if (code.includes("already-exists") || code === "6") return { duplicate: true, event: normalizeDocument(ref.id, (await ref.get()).data()) };
    throw reason;
  }
}

export function requireWebhookSecret(request: Request, environmentName: string) {
  const expected = process.env[environmentName] ?? "";
  const supplied = request.headers.get("x-mwenza-webhook-secret") || new URL(request.url).searchParams.get("token") || "";
  if (!expected || !constantTimeEqual(expected, supplied)) throw new ApiError(401, "invalid_webhook_signature", "Webhook authentication failed.");
}
