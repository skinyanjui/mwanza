import type { Query } from "firebase-admin/firestore";
import { dispatchOutboundWebhooks } from "./events";
import { ApiError, apiJson, cleanString, normalizeDocument, parseLimit, readJson, recordId, requiredString, requireOrganizationRole, requireRole, type ApiContext } from "./security";

function documents(snapshot: FirebaseFirestore.QuerySnapshot) {
  return snapshot.docs.map(document => normalizeDocument(document.id, document.data()));
}

function safeFileName(value: string) {
  const sanitized = value.normalize("NFKD").replaceAll(/[^a-zA-Z0-9._-]/g, "-").replaceAll(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  return sanitized.slice(0, 120) || "upload";
}

function randomSecret() {
  const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

function safeWebhookUrl(value: unknown) {
  let url: URL;
  try { url = new URL(requiredString(value, "url", 500)); } catch { throw new ApiError(400, "invalid_webhook_url", "Add a valid webhook URL."); }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const privateHost = hostname === "localhost"
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || /^(0|10|127)\./.test(hostname)
    || /^169\.254\./.test(hostname)
    || /^192\.168\./.test(hostname)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    || hostname === "::1"
    || hostname.startsWith("fe80:")
    || hostname.startsWith("fc")
    || hostname.startsWith("fd");
  if (url.protocol !== "https:" || url.username || url.password || privateHost) throw new ApiError(400, "unsafe_webhook_url", "Webhook URLs must use public HTTPS endpoints without embedded credentials.");
  return url;
}

export async function handleOrganizationMembers(context: ApiContext, organizationId: string) {
  const { request, actor, admin } = context;
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage organization members.");
  const currentRole = await requireOrganizationRole(admin.db, actor, organizationId);
  const members = admin.db.collection("organizations").doc(organizationId).collection("members");
  if (request.method === "GET") return apiJson({ members: documents(await members.orderBy("createdAt", "asc").limit(parseLimit(request, 100)).get()) });
  if (!actor.roles.includes("operations") && !["owner", "manager"].includes(currentRole)) throw new ApiError(403, "organization_manager_required", "Owner or manager access is required.");
  const body = await readJson(request); let uid = cleanString(body.uid, 128);
  if (!uid) {
    const email = requiredString(body.email, "email", 180).toLowerCase();
    const account = await admin.db.collection("accounts").where("email", "==", email).limit(1).get();
    if (account.empty) throw new ApiError(404, "account_not_found", "Ask this person to create a Mwenza account first.");
    uid = account.docs[0].id;
  }
  const memberAccount = await admin.db.collection("accounts").doc(uid).get();
  if (!memberAccount.exists) throw new ApiError(404, "account_not_found", "Ask this person to create a Mwenza account first.");
  const organization = await admin.db.collection("organizations").doc(organizationId).get();
  if (!organization.exists) throw new ApiError(404, "organization_not_found", "Organization not found.");
  if (request.method === "DELETE") {
    if (uid === organization.data()?.ownerUid) throw new ApiError(409, "owner_cannot_be_removed", "Transfer ownership before removing the owner.");
    const target = await members.doc(uid).get();
    if (!target.exists) throw new ApiError(404, "organization_member_not_found", "Organization member not found.");
    if (!actor.roles.includes("operations") && currentRole === "manager" && target.data()?.role === "manager") throw new ApiError(403, "organization_owner_required", "Only the organization owner can remove another manager.");
    await members.doc(uid).delete();
    await admin.db.collection("accounts").doc(uid).set({ organizationIds: admin.fieldValue.arrayRemove(organizationId), updatedAt: new Date().toISOString() }, { merge: true });
    return apiJson({ uid, removed: true });
  }
  const role = cleanString(body.role, 30) || "viewer";
  if (!new Set(["manager", "billing", "viewer"]).has(role)) throw new ApiError(400, "invalid_membership_role", "Choose manager, billing, or viewer.");
  const existing = await members.doc(uid).get();
  if (!actor.roles.includes("operations") && currentRole === "manager" && (role === "manager" || existing.data()?.role === "manager")) throw new ApiError(403, "organization_owner_required", "Only the organization owner can add or change managers.");
  await members.doc(uid).set({ uid, role, invitedByUid: actor.uid, createdAt: existing.data()?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
  await admin.db.collection("accounts").doc(uid).set({ organizationIds: admin.fieldValue.arrayUnion(organizationId), updatedAt: new Date().toISOString() }, { merge: true });
  await dispatchOutboundWebhooks(admin.db, { event: existing.exists ? "organization.member_updated" : "organization.member_added", organizationId, data: { uid, role } });
  return apiJson({ member: { uid, role } }, existing.exists ? 200 : 201);
}

async function authorizeFileContext(context: ApiContext, kind: string, entityId: string | null) {
  const { actor, admin } = context;
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage files.");
  if (actor.roles.includes("operations")) return;
  if (kind === "profile" || kind === "provider") return;
  if ((kind === "invoice" || kind === "procurement") && entityId) {
    await requireOrganizationRole(admin.db, actor, entityId, kind === "invoice" ? ["owner", "manager", "billing"] : ["owner", "manager"]);
    return;
  }
  if (kind === "job" && entityId) {
    const booking = await admin.db.collection("bookings").doc(entityId).get(); const data = booking.data();
    if (booking.exists && (data?.ownerUid === actor.uid || data?.assignedProviderUid === actor.uid)) return;
  }
  throw new ApiError(403, "file_access_denied", "You cannot manage files in this location.");
}

function storagePath(kind: string, actorUid: string, entityId: string | null, fileId: string, fileName: string) {
  const name = `${fileId}-${safeFileName(fileName)}`;
  if (kind === "profile") return `profiles/${actorUid}/${name}`;
  if (kind === "provider") return `providers/${actorUid}/${name}`;
  if (kind === "job" && entityId) return `bookings/${entityId}/jobs/${name}`;
  if (kind === "invoice" && entityId) return `organizations/${entityId}/invoices/${name}`;
  if (kind === "procurement" && entityId) return `organizations/${entityId}/procurement/${name}`;
  throw new ApiError(400, "invalid_file_context", "Choose profile, provider, job, invoice, or procurement with the required entity ID.");
}

export async function handleFiles(context: ApiContext, action?: string) {
  const { request, actor, admin } = context;
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage files.");
  const collection = admin.db.collection("files");
  if (request.method === "GET") {
    const organizationId = cleanString(new URL(request.url).searchParams.get("organizationId"), 80); const bookingId = cleanString(new URL(request.url).searchParams.get("bookingId"), 80);
    let query: Query;
    if (actor.roles.includes("operations") && !organizationId && !bookingId) query = collection;
    else if (organizationId) { await requireOrganizationRole(admin.db, actor, organizationId); query = collection.where("organizationId", "==", organizationId); }
    else if (bookingId) { await authorizeFileContext(context, "job", bookingId); query = collection.where("bookingId", "==", bookingId); }
    else query = collection.where("ownerUid", "==", actor.uid);
    return apiJson({ files: documents(await query.orderBy("createdAt", "desc").limit(parseLimit(request, 50)).get()) });
  }
  const body = await readJson(request);
  if (request.method === "DELETE") {
    const id = requiredString(body.id, "id", 80); const metadata = await collection.doc(id).get(); if (!metadata.exists) throw new ApiError(404, "file_not_found", "File not found.");
    const data = metadata.data()!;
    if (!actor.roles.includes("operations") && ["profile", "provider"].includes(String(data.kind)) && data.ownerUid !== actor.uid) throw new ApiError(403, "file_access_denied", "You cannot delete this file.");
    await authorizeFileContext(context, String(data.kind), cleanString(data.organizationId || data.bookingId, 80) || null);
    await admin.storage.bucket().file(String(data.storagePath)).delete({ ignoreNotFound: true }); await metadata.ref.delete(); return apiJson({ id, deleted: true });
  }
  if (request.method === "PATCH") {
    const id = requiredString(body.id, "id", 80); const metadata = await collection.doc(id).get(); if (!metadata.exists) throw new ApiError(404, "file_not_found", "File not found.");
    const data = metadata.data()!;
    if (!actor.roles.includes("operations") && ["profile", "provider"].includes(String(data.kind)) && data.ownerUid !== actor.uid) throw new ApiError(403, "file_access_denied", "You cannot confirm this file.");
    await authorizeFileContext(context, String(data.kind), cleanString(data.organizationId || data.bookingId, 80) || null);
    const [remote] = await admin.storage.bucket().file(String(data.storagePath)).getMetadata();
    await metadata.ref.set({ status: "Uploaded", size: Number(remote.size || data.size || 0), contentType: remote.contentType || data.contentType, updatedAt: new Date().toISOString() }, { merge: true });
    return apiJson({ file: normalizeDocument(metadata.id, (await metadata.ref.get()).data()) });
  }
  if (action !== "upload-session") throw new ApiError(404, "api_route_not_found", "File action not found.");
  const kind = requiredString(body.kind, "kind", 30); const entityId = cleanString(body.entityId, 80) || null; await authorizeFileContext(context, kind, entityId);
  const fileName = requiredString(body.fileName, "fileName", 160); const contentType = requiredString(body.contentType, "contentType", 120); const size = Number(body.size);
  if (!Number.isFinite(size) || size <= 0) throw new ApiError(400, "invalid_file_size", "Add the file size in bytes.");
  const maximum = kind === "job" ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
  if (size > maximum) throw new ApiError(413, "file_too_large", `This file must be ${maximum / 1024 / 1024} MB or smaller.`);
  if (kind === "job" ? !contentType.startsWith("image/") : !/^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument)/.test(contentType)) throw new ApiError(415, "unsupported_file_type", "This file type is not supported.");
  const id = recordId("MFILE"); const path = storagePath(kind, actor.uid, entityId, id, fileName); const file = admin.storage.bucket().file(path);
  const [uploadUrl] = await file.createResumableUpload({ metadata: { contentType, metadata: { fileId: id, ownerUid: actor.uid, kind, entityId: entityId ?? "" } } });
  const metadata = { id, ownerUid: actor.uid, organizationId: ["invoice", "procurement"].includes(kind) ? entityId : null, bookingId: kind === "job" ? entityId : null, kind, fileName, contentType, size, storagePath: path, status: "Awaiting upload", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await collection.doc(id).set(metadata); return apiJson({ file: metadata, upload: { method: "PUT", url: uploadUrl, headers: { "content-type": contentType } } }, 201);
}

export async function handleProviderVerifications(context: ApiContext) {
  const { request, actor, admin } = context; if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage provider verification."); const collection = admin.db.collection("providerVerifications");
  if (request.method === "GET") {
    const uid = actor.roles.includes("operations") ? cleanString(new URL(request.url).searchParams.get("uid"), 128) || actor.uid : actor.uid; const snapshot = await collection.doc(uid).get();
    return apiJson({ verification: snapshot.exists ? normalizeDocument(snapshot.id, snapshot.data()) : null });
  }
  const body = await readJson(request);
  if (request.method === "PATCH") {
    requireRole(actor, "operations"); const uid = requiredString(body.uid, "uid", 128); const status = requiredString(body.status, "status", 40); if (!new Set(["Pending", "In review", "Verified", "Rejected", "Expired"]).has(status)) throw new ApiError(400, "invalid_verification_status", "Choose a valid verification status.");
    await collection.doc(uid).set({ status, checks: typeof body.checks === "object" && body.checks ? body.checks : {}, notes: cleanString(body.notes, 1200) || null, reviewedByUid: actor.uid, reviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true }); await admin.db.collection("providerProfiles").doc(uid).set({ verificationStatus: status, updatedAt: new Date().toISOString() }, { merge: true });
    await dispatchOutboundWebhooks(admin.db, { event: "provider.verification_updated", data: { uid, status } }); return apiJson({ uid, status, updated: true });
  }
  const verification = { uid: actor.uid, documentFileIds: Array.isArray(body.documentFileIds) ? body.documentFileIds.map(value => cleanString(value, 80)).filter(Boolean).slice(0, 12) : [], consent: Boolean(body.consent), status: "Pending", submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (!verification.consent || !verification.documentFileIds.length) throw new ApiError(400, "verification_documents_required", "Consent and at least one uploaded verification document are required.");
  const verificationFiles = await Promise.all(verification.documentFileIds.map(id => admin.db.collection("files").doc(id).get()));
  if (verificationFiles.some(file => !file.exists || file.data()?.ownerUid !== actor.uid || file.data()?.kind !== "provider" || file.data()?.status !== "Uploaded")) throw new ApiError(400, "invalid_verification_files", "Use your completed provider document uploads for verification.");
  await collection.doc(actor.uid).set(verification, { merge: true }); return apiJson({ verification }, 201);
}

export async function handleAvailability(context: ApiContext) {
  const { request, actor, admin } = context; if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage availability.");
  const uid = actor.roles.includes("operations") ? cleanString(new URL(request.url).searchParams.get("uid"), 128) || actor.uid : actor.uid; if (uid !== actor.uid) requireRole(actor, "operations"); const ref = admin.db.collection("availability").doc(uid);
  if (request.method === "GET") { const snapshot = await ref.get(); return apiJson({ availability: snapshot.exists ? normalizeDocument(snapshot.id, snapshot.data()) : null }); }
  requireRole(actor, "provider", "operations"); const body = await readJson(request); const days = Array.isArray(body.days) ? body.days.map(value => cleanString(value, 20)).filter(Boolean).slice(0, 7) : []; const windows = Array.isArray(body.windows) ? body.windows.slice(0, 21) : [];
  const availability = { providerUid: uid, acceptingWork: body.acceptingWork !== false, days, windows, serviceAreas: Array.isArray(body.serviceAreas) ? body.serviceAreas.map(value => cleanString(value, 100)).filter(Boolean).slice(0, 20) : [], unavailableUntil: cleanString(body.unavailableUntil, 40) || null, updatedAt: new Date().toISOString() };
  await ref.set(availability, { merge: true }); await admin.db.collection("providerProfiles").doc(uid).set({ acceptingWork: availability.acceptingWork, updatedAt: availability.updatedAt }, { merge: true }); return apiJson({ availability });
}

export async function handleAddresses(context: ApiContext) {
  const { request, actor, admin } = context; if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage addresses."); const collection = admin.db.collection("addresses");
  if (request.method === "GET") {
    const organizationId = cleanString(new URL(request.url).searchParams.get("organizationId"), 80); let query: Query;
    if (organizationId) { await requireOrganizationRole(admin.db, actor, organizationId); query = collection.where("organizationId", "==", organizationId); } else query = collection.where("ownerUid", "==", actor.uid);
    return apiJson({ addresses: documents(await query.orderBy("updatedAt", "desc").limit(parseLimit(request, 50)).get()) });
  }
  const body = await readJson(request);
  const id = request.method === "POST" ? cleanString(body.id, 80) || recordId("MADDR") : requiredString(body.id, "id", 80);
  const ref = collection.doc(id); const existing = await ref.get();
  if (request.method === "POST" && existing.exists) throw new ApiError(409, "address_already_exists", "An address with this ID already exists.");
  if (request.method !== "POST" && !existing.exists) throw new ApiError(404, "address_not_found", "Address not found.");
  const existingOrganizationId = cleanString(existing.data()?.organizationId, 80) || null;
  const requestedOrganizationId = cleanString(body.organizationId, 80) || null;
  const organizationId = existing.exists ? existingOrganizationId : requestedOrganizationId;
  if (existing.exists && requestedOrganizationId !== existingOrganizationId && body.organizationId !== undefined) throw new ApiError(409, "address_organization_immutable", "Create a new address to change its organization.");
  if (organizationId) await requireOrganizationRole(admin.db, actor, organizationId, ["owner", "manager"]);
  if (existing.exists && existing.data()?.ownerUid !== actor.uid && !actor.roles.includes("operations") && !existingOrganizationId) throw new ApiError(403, "address_access_denied", "You cannot change this address.");
  if (request.method === "DELETE") { await ref.delete(); return apiJson({ id, deleted: true }); }
  const address = { id, ownerUid: existing.data()?.ownerUid ?? actor.uid, organizationId, label: requiredString(body.label ?? existing.data()?.label, "label", 80), address: requiredString(body.address ?? existing.data()?.address, "address", 300), latitude: body.latitude === undefined ? existing.data()?.latitude ?? null : Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null, longitude: body.longitude === undefined ? existing.data()?.longitude ?? null : Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null, instructions: body.instructions === undefined ? existing.data()?.instructions ?? null : cleanString(body.instructions, 800) || null, isDefault: body.isDefault === undefined ? Boolean(existing.data()?.isDefault) : Boolean(body.isDefault), createdAt: existing.data()?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() };
  await ref.set(address, { merge: true }); return apiJson({ address }, existing.exists ? 200 : 201);
}

export async function handleOutboundWebhooks(context: ApiContext, action?: string) {
  const { request, actor, admin } = context; if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage webhooks."); const collection = admin.db.collection("outboundWebhooks");
  if (request.method === "GET") {
    const organizationId = requiredString(new URL(request.url).searchParams.get("organizationId"), "organizationId", 80); await requireOrganizationRole(admin.db, actor, organizationId, ["owner", "manager"]);
    if (action === "deliveries") return apiJson({ deliveries: documents(await admin.db.collection("webhookDeliveries").where("organizationId", "==", organizationId).orderBy("createdAt", "desc").limit(parseLimit(request, 50, 100)).get()) });
    if (action) throw new ApiError(404, "api_route_not_found", "Outbound webhook action not found.");
    return apiJson({ webhooks: documents(await collection.where("organizationId", "==", organizationId).orderBy("createdAt", "desc").limit(parseLimit(request, 50)).get()).map(item => ({ ...item, secret: undefined })) });
  }
  if (action) throw new ApiError(405, "method_not_allowed", "This outbound webhook action does not support writes.");
  const body = await readJson(request); const organizationId = requiredString(body.organizationId, "organizationId", 80); await requireOrganizationRole(admin.db, actor, organizationId, ["owner", "manager"]); const id = request.method === "POST" ? cleanString(body.id, 80) || recordId("MWH") : requiredString(body.id, "id", 80); const ref = collection.doc(id); const existing = await ref.get();
  if (request.method !== "POST" && !existing.exists) throw new ApiError(404, "webhook_not_found", "Webhook subscription not found.");
  if (request.method === "POST" && existing.exists) throw new ApiError(409, "webhook_already_exists", "A webhook with this ID already exists.");
  if (existing.exists && existing.data()?.organizationId !== organizationId) throw new ApiError(403, "webhook_access_denied", "This webhook belongs to another organization.");
  if (request.method === "DELETE") { await Promise.all([ref.delete(), admin.db.collection("webhookSecrets").doc(id).delete()]); return apiJson({ id, deleted: true }); }
  const url = safeWebhookUrl(body.url ?? existing.data()?.url);
  const events = Array.isArray(body.events) ? body.events.map(value => cleanString(value, 100)).filter(Boolean).slice(0, 30) : Array.isArray(existing.data()?.events) ? existing.data()!.events.map(String) : []; if (!events.length) throw new ApiError(400, "webhook_events_required", "Choose at least one event.");
  const webhook = { id, organizationId, url: url.toString(), events, active: body.active === undefined ? existing.data()?.active !== false : body.active !== false, description: body.description === undefined ? existing.data()?.description ?? null : cleanString(body.description, 200) || null, createdByUid: existing.data()?.createdByUid ?? actor.uid, createdAt: existing.data()?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() };
  let secret: string | undefined; if (!existing.exists || body.rotateSecret === true) { secret = randomSecret(); await admin.db.collection("webhookSecrets").doc(id).set({ webhookId: id, organizationId, secret, rotatedAt: new Date().toISOString() }); }
  await ref.set(webhook, { merge: true }); return apiJson({ webhook, ...(secret ? { signingSecret: secret } : {}) }, existing.exists ? 200 : 201);
}
