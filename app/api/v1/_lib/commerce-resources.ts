import type { Query } from "firebase-admin/firestore";
import { dispatchOutboundWebhooks } from "./events";
import { ApiError, apiJson, cleanString, normalizeDocument, parseLimit, readJson, recordId, requiredString, requireOrganizationRole, requireRole, type ApiContext } from "./security";

function documents(snapshot: FirebaseFirestore.QuerySnapshot) {
  return snapshot.docs.map(document => normalizeDocument(document.id, document.data()));
}

function amount(value: unknown, field = "amount") {
  const result = Number(value);
  if (!Number.isFinite(result) || result <= 0) throw new ApiError(400, "invalid_amount", `${field} must be a positive number.`);
  return Math.round(result);
}

function nonNegativeAmount(value: unknown, field: string) {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0) throw new ApiError(400, "invalid_amount", `${field} cannot be negative.`);
  return Math.round(result);
}

export async function handlePayments(context: ApiContext) {
  const { request, actor, admin } = context;
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage payments.");
  const collection = admin.db.collection("payments");
  if (request.method === "GET") {
    const organizationId = cleanString(new URL(request.url).searchParams.get("organizationId"), 80);
    let query: Query;
    if (actor.roles.includes("operations")) query = organizationId ? collection.where("organizationId", "==", organizationId) : collection;
    else if (organizationId) { await requireOrganizationRole(admin.db, actor, organizationId); query = collection.where("organizationId", "==", organizationId); }
    else query = collection.where("ownerUid", "==", actor.uid);
    return apiJson({ payments: documents(await query.orderBy("createdAt", "desc").limit(parseLimit(request, 50)).get()) });
  }
  const body = await readJson(request);
  if (request.method === "PATCH") {
    requireRole(actor, "operations");
    const id = requiredString(body.id, "id", 60); const status = requiredString(body.status, "status", 40);
    if (!new Set(["Pending", "Processing", "Succeeded", "Failed", "Refunded", "Cancelled"]).has(status)) throw new ApiError(400, "invalid_payment_status", "Choose a valid payment status.");
    const ref = collection.doc(id); const snapshot = await ref.get(); if (!snapshot.exists) throw new ApiError(404, "payment_not_found", "Payment not found.");
    await ref.set({ status, providerReference: cleanString(body.providerReference, 160) || snapshot.data()?.providerReference || null, failureReason: cleanString(body.failureReason, 500) || null, updatedAt: new Date().toISOString(), ...(status === "Succeeded" ? { paidAt: new Date().toISOString() } : {}) }, { merge: true });
    await dispatchOutboundWebhooks(admin.db, { event: `payment.${status.toLowerCase()}`, organizationId: snapshot.data()?.organizationId, data: { id, status } });
    return apiJson({ id, status, updated: true });
  }
  const bookingId = requiredString(body.bookingId, "bookingId", 60); const booking = await admin.db.collection("bookings").doc(bookingId).get();
  if (!booking.exists) throw new ApiError(404, "booking_not_found", "Booking not found.");
  const bookingData = booking.data()!;
  if (bookingData.ownerUid !== actor.uid && !actor.roles.includes("operations")) {
    if (!bookingData.organizationId) throw new ApiError(403, "payment_access_denied", "You cannot pay for this booking.");
    await requireOrganizationRole(admin.db, actor, String(bookingData.organizationId), ["owner", "manager", "billing"]);
  }
  const provider = (cleanString(body.provider, 30) || "mpesa").toLowerCase();
  if (!new Set(["mpesa", "card", "invoice", "cash"]).has(provider)) throw new ApiError(400, "invalid_payment_provider", "Choose mpesa, card, invoice, or cash.");
  if (["cardNumber", "pan", "cvc", "cvv", "expiry"].some(field => body[field] !== undefined)) throw new ApiError(400, "raw_card_data_forbidden", "Send a PCI-compliant payment-provider token, never raw card details.");
  const suppliedMetadata = body.metadata && typeof body.metadata === "object" ? body.metadata as Record<string, unknown> : {};
  const metadata = Object.fromEntries(["clientReference", "source", "campaign"].map(key => [key, cleanString(suppliedMetadata[key], 160)]).filter(([, value]) => Boolean(value)));
  const phone = cleanString(body.phone, 40) || null;
  if (provider === "mpesa" && (!phone || phone.replace(/\D/g, "").length < 10)) throw new ApiError(400, "mpesa_phone_required", "Add a valid M-Pesa phone number.");
  const id = recordId("MPY");
  const payment = { id, bookingId, ownerUid: bookingData.ownerUid ?? actor.uid, organizationId: bookingData.organizationId ?? null, provider, amount: amount(body.amount ?? bookingData.total), currency: cleanString(body.currency, 3).toUpperCase() || "KES", phone, status: "Pending", providerReference: null, metadata, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await collection.doc(id).set(payment);
  await dispatchOutboundWebhooks(admin.db, { event: "payment.created", organizationId: payment.organizationId, data: payment });
  return apiJson({ payment }, 201);
}

function invoiceLines(value: unknown) {
  if (!Array.isArray(value) || !value.length) throw new ApiError(400, "invoice_lines_required", "Add at least one invoice line.");
  return value.slice(0, 100).map((item, index) => {
    const line = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const rawQuantity = Number(line.quantity ?? 1);
    if (!Number.isFinite(rawQuantity) || rawQuantity <= 0 || rawQuantity > 10_000) throw new ApiError(400, "invalid_quantity", `lines[${index}].quantity must be between 1 and 10,000.`);
    const quantity = rawQuantity; const unitAmount = amount(line.unitAmount, `lines[${index}].unitAmount`);
    return { description: requiredString(line.description, `lines[${index}].description`, 180), quantity, unitAmount, total: Math.round(quantity * unitAmount) };
  });
}

export async function handleInvoices(context: ApiContext) {
  const { request, actor, admin } = context;
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage invoices.");
  const collection = admin.db.collection("invoices");
  if (request.method === "GET") {
    const organizationId = requiredString(new URL(request.url).searchParams.get("organizationId"), "organizationId", 80);
    await requireOrganizationRole(admin.db, actor, organizationId);
    return apiJson({ invoices: documents(await collection.where("organizationId", "==", organizationId).orderBy("issuedAt", "desc").limit(parseLimit(request, 50)).get()) });
  }
  const body = await readJson(request); const organizationId = requiredString(body.organizationId, "organizationId", 80);
  await requireOrganizationRole(admin.db, actor, organizationId, ["owner", "manager", "billing"]);
  if (request.method === "PATCH") {
    const id = requiredString(body.id, "id", 60); const status = requiredString(body.status, "status", 40);
    if (!new Set(["Draft", "Issued", "Partially paid", "Paid", "Overdue", "Void"]).has(status)) throw new ApiError(400, "invalid_invoice_status", "Choose a valid invoice status.");
    const ref = collection.doc(id); const snapshot = await ref.get(); if (!snapshot.exists || snapshot.data()?.organizationId !== organizationId) throw new ApiError(404, "invoice_not_found", "Invoice not found.");
    await ref.set({ status, updatedAt: new Date().toISOString(), ...(status === "Paid" ? { paidAt: new Date().toISOString() } : {}) }, { merge: true });
    await dispatchOutboundWebhooks(admin.db, { event: "invoice.updated", organizationId, data: { id, status } });
    return apiJson({ id, status, updated: true });
  }
  const lines = invoiceLines(body.lines); const subtotal = lines.reduce((sum, line) => sum + line.total, 0); const tax = nonNegativeAmount(body.tax ?? 0, "tax"); const id = recordId("MINV");
  const status = cleanString(body.status, 30) || "Draft";
  if (!new Set(["Draft", "Issued"]).has(status)) throw new ApiError(400, "invalid_invoice_status", "New invoices must be Draft or Issued.");
  const invoice = { id, organizationId, bookingIds: Array.isArray(body.bookingIds) ? body.bookingIds.map(value => cleanString(value, 60)).filter(Boolean).slice(0, 100) : [], number: cleanString(body.number, 60) || id, lines, subtotal, tax, total: subtotal + tax, currency: cleanString(body.currency, 3).toUpperCase() || "KES", status, dueAt: cleanString(body.dueAt, 40) || null, issuedAt: new Date().toISOString(), createdByUid: actor.uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await collection.doc(id).set(invoice);
  await dispatchOutboundWebhooks(admin.db, { event: "invoice.created", organizationId, data: invoice });
  return apiJson({ invoice }, 201);
}

export async function handleProcurementRecords(context: ApiContext) {
  const { request, actor, admin } = context;
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage procurement records.");
  const collection = admin.db.collection("procurementRecords");
  if (request.method === "GET") {
    const organizationId = requiredString(new URL(request.url).searchParams.get("organizationId"), "organizationId", 80); await requireOrganizationRole(admin.db, actor, organizationId);
    return apiJson({ procurementRecords: documents(await collection.where("organizationId", "==", organizationId).orderBy("updatedAt", "desc").limit(parseLimit(request, 50)).get()) });
  }
  const body = await readJson(request); const organizationId = requiredString(body.organizationId, "organizationId", 80); await requireOrganizationRole(admin.db, actor, organizationId, ["owner", "manager"]);
  if (request.method === "PATCH") {
    const id = requiredString(body.id, "id", 60); const ref = collection.doc(id); const snapshot = await ref.get(); if (!snapshot.exists || snapshot.data()?.organizationId !== organizationId) throw new ApiError(404, "procurement_record_not_found", "Procurement record not found.");
    const changes = { status: cleanString(body.status, 60) || snapshot.data()?.status, procurementReference: cleanString(body.procurementReference, 120) || snapshot.data()?.procurementReference, notes: cleanString(body.notes, 2000) || snapshot.data()?.notes || null, updatedAt: new Date().toISOString() };
    await ref.set(changes, { merge: true }); await dispatchOutboundWebhooks(admin.db, { event: "procurement.updated", organizationId, data: { id, ...changes } });
    return apiJson({ id, ...changes, updated: true });
  }
  const id = recordId("MPR"); const record = { id, organizationId, title: requiredString(body.title, "title", 180), procurementReference: cleanString(body.procurementReference, 120) || null, category: cleanString(body.category, 120) || "Service procurement", serviceIds: Array.isArray(body.serviceIds) ? body.serviceIds.map(value => cleanString(value, 80)).filter(Boolean) : [], estimatedValue: Number.isFinite(Number(body.estimatedValue)) ? amount(body.estimatedValue, "estimatedValue") : null, currency: cleanString(body.currency, 3).toUpperCase() || "KES", status: cleanString(body.status, 60) || "Draft", deadlineAt: cleanString(body.deadlineAt, 40) || null, notes: cleanString(body.notes, 2000) || null, createdByUid: actor.uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await collection.doc(id).set(record); await dispatchOutboundWebhooks(admin.db, { event: "procurement.created", organizationId, data: record });
  return apiJson({ procurementRecord: record }, 201);
}

export async function handleReviews(context: ApiContext) {
  const { request, actor, admin } = context; const collection = admin.db.collection("reviews");
  if (request.method === "GET") {
    const providerUid = cleanString(new URL(request.url).searchParams.get("providerUid"), 100); const service = cleanString(new URL(request.url).searchParams.get("service"), 100);
    let query: Query = collection.where("status", "==", "Published"); if (providerUid) query = query.where("providerUid", "==", providerUid); if (service) query = query.where("service", "==", service);
    return apiJson({ reviews: documents(await query.orderBy("createdAt", "desc").limit(parseLimit(request, 30)).get()) });
  }
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to submit a review."); const body = await readJson(request);
  if (request.method === "PATCH") {
    requireRole(actor, "operations"); const id = requiredString(body.id, "id", 60); const status = requiredString(body.status, "status", 30); if (!new Set(["Pending", "Published", "Rejected"]).has(status)) throw new ApiError(400, "invalid_review_status", "Choose a valid review status.");
    await collection.doc(id).set({ status, moderationNote: cleanString(body.moderationNote, 500) || null, updatedAt: new Date().toISOString() }, { merge: true }); return apiJson({ id, status, updated: true });
  }
  const bookingId = requiredString(body.bookingId, "bookingId", 60); const bookingSnapshot = await admin.db.collection("bookings").doc(bookingId).get(); const booking = bookingSnapshot.data();
  if (!bookingSnapshot.exists || booking?.ownerUid !== actor.uid || booking?.status !== "Completed") throw new ApiError(403, "review_booking_ineligible", "Only the customer can review a completed booking.");
  if (!(await collection.where("bookingId", "==", bookingId).limit(1).get()).empty) throw new ApiError(409, "review_already_exists", "This booking already has a review.");
  const rating = Math.floor(Number(body.rating)); if (rating < 1 || rating > 5) throw new ApiError(400, "invalid_rating", "Rating must be between 1 and 5.");
  const id = `MRV-${bookingId}`; const review = { id, bookingId, ownerUid: actor.uid, providerUid: booking.assignedProviderUid ?? null, organizationId: booking.organizationId ?? null, service: booking.service, rating, title: cleanString(body.title, 120) || null, comment: requiredString(body.comment, "comment", 1200), status: "Pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await admin.db.runTransaction(async transaction => {
    const ref = collection.doc(id); const current = await transaction.get(ref);
    if (current.exists) throw new ApiError(409, "review_already_exists", "This booking already has a review.");
    transaction.create(ref, review);
  });
  await dispatchOutboundWebhooks(admin.db, { event: "review.created", organizationId: review.organizationId, data: review }); return apiJson({ review }, 201);
}

export async function handleServicePricing(context: ApiContext) {
  const { request, actor, admin } = context; const collection = admin.db.collection("servicePricing");
  if (request.method === "GET") {
    const audience = cleanString(new URL(request.url).searchParams.get("audience"), 30); let query: Query = collection.where("active", "==", true); if (audience) query = query.where("audience", "==", audience);
    return apiJson({ servicePricing: documents(await query.orderBy("sortOrder", "asc").limit(parseLimit(request, 100)).get()) }, 200, { "cache-control": "public, max-age=300, stale-while-revalidate=600" });
  }
  requireRole(actor, "operations"); const body = await readJson(request); const id = cleanString(body.id, 80) || requiredString(body.slug, "slug", 80); const ref = collection.doc(id);
  const pricing = { id, slug: cleanString(body.slug, 80) || id, service: requiredString(body.service, "service", 120), audience: cleanString(body.audience, 30) || "home", currency: cleanString(body.currency, 3).toUpperCase() || "KES", pricingModel: cleanString(body.pricingModel, 60) || "starting_from", amount: amount(body.amount), unit: cleanString(body.unit, 60) || "service", minimumAmount: Number.isFinite(Number(body.minimumAmount)) ? amount(body.minimumAmount, "minimumAmount") : null, active: body.active !== false, sortOrder: Math.max(0, Number(body.sortOrder) || 0), updatedAt: new Date().toISOString(), updatedByUid: actor.uid };
  await ref.set({ ...pricing, createdAt: (await ref.get()).data()?.createdAt ?? new Date().toISOString() }, { merge: true }); await dispatchOutboundWebhooks(admin.db, { event: "service_pricing.updated", data: pricing });
  return apiJson({ servicePricing: pricing }, request.method === "POST" ? 201 : 200);
}
