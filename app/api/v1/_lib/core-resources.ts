import type { Query } from "firebase-admin/firestore";
import { dispatchOutboundWebhooks } from "./events";
import { ApiError, apiJson, cleanString, normalizeDocument, parseLimit, readJson, recordId, requiredString, requireOrganizationRole, requireRole, type ApiContext } from "./security";

function documents(snapshot: FirebaseFirestore.QuerySnapshot) {
  return snapshot.docs.map(document => normalizeDocument(document.id, document.data()));
}

function contactEmail(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? null;
}

async function createNotification(context: ApiContext, input: { recipientUid?: string | null; recipientEmail?: string | null; audience: string; bookingId?: string | null; title: string; message: string }) {
  if (!input.recipientUid && !input.recipientEmail) return;
  const id = recordId("MN");
  await context.admin.db.collection("notifications").doc(id).set({ id, ...input, recipientEmail: input.recipientEmail?.toLowerCase() ?? null, status: "Unread", createdAt: new Date().toISOString(), readAt: null });
}

export async function handleAccountProfile(context: ApiContext) {
  const { request, actor, admin } = context;
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to manage an account profile.");
  const ref = admin.db.collection("accounts").doc(actor.uid);
  if (request.method === "GET") {
    const snapshot = await ref.get();
    return apiJson({ authenticated: true, user: { uid: actor.uid, email: actor.email }, profile: snapshot.exists ? normalizeDocument(snapshot.id, snapshot.data()) : null });
  }
  const body = await readJson(request);
  const fullName = requiredString(body.fullName, "fullName", 120);
  const phone = requiredString(body.phone, "phone", 40);
  if (phone.replace(/\D/g, "").length < 9) throw new ApiError(400, "invalid_phone", "Add a valid phone number.");
  const accountType = cleanString(body.accountType, 20) || "Home";
  if (!new Set(["Home", "Business", "Government"]).has(accountType)) throw new ApiError(400, "invalid_account_type", "Choose Home, Business, or Government.");
  const current = (await ref.get()).data() ?? {};
  const privilegedRoles = Array.isArray(current.roles) ? current.roles.map(String).filter(role => role === "provider" || role === "operations") : [];
  const roles = Array.from(new Set(["customer", ...(accountType === "Business" ? ["business"] : accountType === "Government" ? ["government"] : []), ...privilegedRoles]));
  const profile = { uid: actor.uid, email: actor.email, fullName, phone, accountType, businessName: accountType === "Home" ? null : requiredString(body.businessName, "businessName", 180), serviceArea: cleanString(body.serviceArea, 100) || "Nairobi", roles, organizationIds: Array.isArray(current.organizationIds) ? current.organizationIds : [], status: current.status ?? "Active", createdAt: current.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() };
  await ref.set(profile, { merge: true });
  return apiJson({ profile });
}

export async function handleApplications(context: ApiContext) {
  const { request, actor, admin } = context;
  const collection = admin.db.collection("applications");
  if (request.method === "GET") {
    requireRole(actor, "operations");
    return apiJson({ applications: documents(await collection.orderBy("createdAt", "desc").limit(parseLimit(request, 75)).get()) });
  }
  const body = await readJson(request);
  const applicationType = requiredString(body.applicationType, "applicationType", 40).toLowerCase();
  if (!new Set(["job", "provider", "franchise"]).has(applicationType)) throw new ApiError(400, "invalid_application_type", "Choose job, provider, or franchise.");
  const details = requiredString(body.details, "details", 2400);
  if (details.length < 20) throw new ApiError(400, "application_details_too_short", "Add at least 20 characters about the application.");
  const id = recordId(applicationType === "franchise" ? "MF" : applicationType === "provider" ? "MP" : "MJ");
  const application = { id, ownerUid: actor.uid, ownerEmail: actor.email, applicationType, roleOrTerritory: requiredString(body.roleOrTerritory, "roleOrTerritory", 160), fullName: requiredString(body.fullName, "fullName", 120), contact: requiredString(body.contact, "contact", 160), location: requiredString(body.location, "location", 160), details, services: Array.isArray(body.services) ? body.services.map(value => cleanString(value, 80)).filter(Boolean).slice(0, 12) : [], availability: cleanString(body.availability, 120) || null, status: "Received", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await collection.doc(id).set(application);
  if (applicationType === "provider") await admin.db.collection("providerApplications").doc(id).set(application);
  await dispatchOutboundWebhooks(admin.db, { event: "application.received", data: application });
  return apiJson({ id, status: application.status }, 201);
}

export async function handleBookings(context: ApiContext) {
  const { request, actor, admin } = context;
  const collection = admin.db.collection("bookings");
  if (request.method === "GET") {
    let query: Query = collection;
    const organizationId = cleanString(new URL(request.url).searchParams.get("organizationId"), 80);
    if (actor.roles.includes("operations")) query = organizationId ? collection.where("organizationId", "==", organizationId) : collection;
    else if (organizationId) {
      if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to view bookings.");
      const membership = await admin.db.collection("organizations").doc(organizationId).collection("members").doc(actor.uid).get();
      if (!membership.exists) throw new ApiError(403, "organization_access_denied", "You cannot view this organization.");
      query = collection.where("organizationId", "==", organizationId);
    } else if (actor.uid) query = collection.where("ownerUid", "==", actor.uid);
    else if (actor.email) query = collection.where("ownerEmail", "==", actor.email);
    else throw new ApiError(401, "authentication_required", "Sign in to view bookings.");
    return apiJson({ bookings: documents(await query.orderBy("createdAt", "desc").limit(parseLimit(request, 25)).get()) });
  }
  const body = await readJson(request);
  if (request.method === "PATCH") {
    const id = requiredString(body.id, "id", 60);
    const ref = collection.doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new ApiError(404, "booking_not_found", "Booking not found.");
    const current = snapshot.data()!;
    let owns = actor.roles.includes("operations") || (actor.uid && current.ownerUid === actor.uid) || (actor.email && current.ownerEmail === actor.email);
    if (!owns && current.organizationId) {
      await requireOrganizationRole(admin.db, actor, String(current.organizationId), ["owner", "manager"]);
      owns = true;
    }
    if (!owns) throw new ApiError(403, "booking_access_denied", "You cannot update this booking.");
    const status = cleanString(body.status, 80);
    const bookingStatuses = new Set(["Confirmation pending", "Confirmed", "Unassigned", "Assigned", "Provider assigned", "En route", "Arrived", "In progress", "Completed", "Cancelled", "Reschedule requested"]);
    if (status && !bookingStatuses.has(status)) throw new ApiError(400, "invalid_booking_status", "Choose a valid booking status.");
    if (!actor.roles.includes("operations") && status && !new Set(["Cancelled", "Reschedule requested"]).has(status)) throw new ApiError(403, "invalid_customer_transition", "Customers may only cancel or request a reschedule.");
    if (new Set(["Completed", "Cancelled"]).has(String(current.status))) throw new ApiError(409, "booking_closed", "This booking can no longer be changed.");
    const changes = { ...(status ? { status } : {}), ...(cleanString(body.day, 40) ? { scheduledDay: cleanString(body.day, 40) } : {}), ...(cleanString(body.time, 60) ? { scheduledTime: cleanString(body.time, 60) } : {}), ...(status === "Cancelled" ? { cancelledAt: new Date().toISOString() } : {}), updatedAt: new Date().toISOString() };
    await ref.set(changes, { merge: true });
    await createNotification(context, { recipientUid: current.ownerUid, recipientEmail: current.ownerEmail, audience: current.customerType ?? "customer", bookingId: id, title: status === "Cancelled" ? "Booking cancelled" : "Booking updated", message: status === "Reschedule requested" ? "Mwenza Operations will confirm the requested arrival window." : `The booking is now ${status || "updated"}.` });
    await dispatchOutboundWebhooks(admin.db, { event: "booking.updated", organizationId: current.organizationId, data: { id, ...changes } });
    return apiJson({ id, status: status || current.status, updated: true });
  }
  const id = recordId("MW");
  const customerType = requiredString(body.customerType, "customerType", 40);
  if (!new Set(["Home", "Business", "Government & Institution"]).has(customerType)) throw new ApiError(400, "invalid_customer_type", "Choose Home, Business, or Government & Institution.");
  const organizationId = cleanString(body.organizationId, 80) || null;
  if (organizationId) await requireOrganizationRole(admin.db, actor, organizationId, ["owner", "manager"]);
  const booking = { id, ownerUid: actor.uid, ownerEmail: actor.email, organizationId, customerType, company: cleanString(body.company, 180) || null, service: requiredString(body.service, "service", 80), option: requiredString(body.option, "option", 120), address: requiredString(body.address, "address", 300), instructions: cleanString(body.instructions, 1200) || null, scope: cleanString(body.scope, 1200) || null, frequency: cleanString(body.frequency, 60) || "One time", locations: Math.max(1, Math.min(250, Number(body.locations) || 1)), scheduledDay: requiredString(body.day, "day", 40), scheduledDate: cleanString(body.date, 40) || null, scheduledTime: requiredString(body.time, "time", 60), contactName: requiredString(body.name, "name", 120), contact: requiredString(body.contact, "contact", 160), payment: cleanString(body.payment, 40) || "M-Pesa", total: Number.isFinite(Number(body.total)) ? Math.max(0, Number(body.total)) : null, assignedProviderUid: null, assignedProviderName: null, status: "Confirmation pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await collection.doc(id).set(booking);
  await admin.db.collection("serviceRecords").doc(recordId("MSR")).set({ bookingId: id, ownerUid: actor.uid, organizationId: booking.organizationId, providerUid: null, event: "Booking requested", status: booking.status, notes: "Created through API v1.", createdAt: new Date().toISOString() });
  await createNotification(context, { recipientUid: actor.uid, recipientEmail: actor.email, audience: customerType, bookingId: id, title: "Booking request received", message: `${booking.option} is requested for ${booking.scheduledDay}, ${booking.scheduledTime}.` });
  await dispatchOutboundWebhooks(admin.db, { event: "booking.created", organizationId: booking.organizationId, data: booking });
  return apiJson({ id, status: booking.status }, 201);
}

export async function handleBusinessRequests(context: ApiContext) {
  const { request, actor, admin } = context;
  const collection = admin.db.collection("businessRequests");
  if (request.method === "GET") {
    requireRole(actor, "operations");
    return apiJson({ requests: documents(await collection.orderBy("createdAt", "desc").limit(parseLimit(request, 50)).get()) });
  }
  const body = await readJson(request);
  const services = Array.isArray(body.services) ? body.services.map(value => cleanString(value, 100)).filter(Boolean).slice(0, 12) : [];
  if (!services.length) throw new ApiError(400, "services_required", "Choose at least one service.");
  const id = recordId("MB");
  const lead = { id, ownerUid: actor.uid, ownerEmail: actor.email, businessName: requiredString(body.businessName, "businessName", 180), services, frequency: cleanString(body.frequency, 80) || "Not sure", locationCount: Math.max(1, Math.min(250, Number(body.locationCount) || 1)), contact: requiredString(body.contact, "contact", 160), status: "New lead", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await collection.doc(id).set(lead);
  await dispatchOutboundWebhooks(admin.db, { event: "business_request.created", data: lead });
  return apiJson({ id, status: lead.status }, 201);
}

export async function handleIncidents(context: ApiContext) {
  const { request, actor, admin } = context;
  if (!actor.uid && !actor.email) throw new ApiError(401, "authentication_required", "Sign in before reporting an issue.");
  const collection = admin.db.collection("incidents");
  if (request.method === "GET") {
    const query = actor.roles.includes("operations") ? collection.orderBy("createdAt", "desc") : actor.uid ? collection.where("ownerUid", "==", actor.uid).orderBy("createdAt", "desc") : collection.where("ownerEmail", "==", actor.email).orderBy("createdAt", "desc");
    return apiJson({ incidents: documents(await query.limit(parseLimit(request, 40, 80)).get()) });
  }
  const body = await readJson(request);
  if (request.method === "PATCH") {
    requireRole(actor, "operations");
    const id = requiredString(body.id, "id", 60);
    const status = requiredString(body.status, "status", 60);
    if (!new Set(["Open", "Investigating", "Waiting on customer", "Resolved", "Closed"]).has(status)) throw new ApiError(400, "invalid_incident_status", "Choose a valid incident status.");
    const ref = collection.doc(id); const snapshot = await ref.get();
    if (!snapshot.exists) throw new ApiError(404, "incident_not_found", "Incident not found.");
    await ref.set({ status, assignedTo: cleanString(body.assignedTo, 120) || null, updatedAt: new Date().toISOString() }, { merge: true });
    const incident = snapshot.data()!;
    await createNotification(context, { recipientUid: incident.ownerUid, recipientEmail: incident.ownerEmail, audience: incident.reporterType, bookingId: incident.bookingId, title: `Issue ${id}: ${status}`, message: `Your report is now ${status.toLowerCase()}.` });
    return apiJson({ id, status, updated: true });
  }
  const category = requiredString(body.category, "category", 100);
  const details = requiredString(body.details, "details", 2400);
  if (details.length < 10) throw new ApiError(400, "incident_details_too_short", "Add a short description.");
  const bookingId = cleanString(body.bookingId, 60) || null;
  const organizationId = cleanString(body.organizationId, 80) || null;
  if (organizationId) await requireOrganizationRole(admin.db, actor, organizationId);
  if (bookingId) {
    const bookingSnapshot = await admin.db.collection("bookings").doc(bookingId).get();
    if (!bookingSnapshot.exists) throw new ApiError(404, "booking_not_found", "Booking not found.");
    const booking = bookingSnapshot.data()!;
    const connected = booking.ownerUid === actor.uid || booking.ownerEmail === actor.email || booking.assignedProviderUid === actor.uid;
    if (!connected) {
      if (!booking.organizationId) throw new ApiError(403, "incident_booking_access_denied", "That booking is not connected to your account.");
      await requireOrganizationRole(admin.db, actor, String(booking.organizationId));
    }
  }
  const id = recordId("MI");
  const incident = { id, ownerUid: actor.uid, ownerEmail: actor.email, organizationId, reporterType: cleanString(body.reporterType, 30) || "customer", bookingId, location: cleanString(body.location, 240) || null, category, details, priority: /safety|damage/i.test(category) ? "High" : "Medium", status: "Open", assignedTo: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await collection.doc(id).set(incident);
  await createNotification(context, { recipientUid: actor.uid, recipientEmail: actor.email, audience: incident.reporterType, bookingId: incident.bookingId, title: `Issue ${id} received`, message: "Mwenza Operations has received your report." });
  await dispatchOutboundWebhooks(admin.db, { event: "incident.created", data: incident });
  return apiJson({ id, status: incident.status, priority: incident.priority }, 201);
}

export async function handleNotifications(context: ApiContext) {
  const { request, actor, admin } = context;
  if (!actor.uid && !actor.email) throw new ApiError(401, "authentication_required", "Sign in to view updates.");
  const collection = admin.db.collection("notifications");
  if (request.method === "GET") {
    const query = actor.uid ? collection.where("recipientUid", "==", actor.uid) : collection.where("recipientEmail", "==", actor.email);
    const items = documents(await query.orderBy("createdAt", "desc").limit(parseLimit(request, 40)).get());
    return apiJson({ notifications: items, unread: items.filter(item => item.status === "Unread").length });
  }
  const body = await readJson(request);
  let query = actor.uid ? collection.where("recipientUid", "==", actor.uid) : collection.where("recipientEmail", "==", actor.email);
  const id = cleanString(body.id, 60);
  if (id) query = query.where("id", "==", id);
  else query = query.where("status", "==", "Unread");
  const snapshot = await query.limit(100).get();
  const batch = admin.db.batch();
  snapshot.docs.forEach(document => batch.set(document.ref, { status: "Read", readAt: new Date().toISOString() }, { merge: true }));
  await batch.commit();
  return apiJson({ updated: true, count: snapshot.size });
}

export async function handleOperations(context: ApiContext) {
  const { request, actor, admin } = context;
  requireRole(actor, "operations");
  const db = admin.db;
  if (request.method === "GET") {
    const [bookingDocs, leadDocs, applicationDocs, providerDocs, incidentDocs] = await Promise.all([
      db.collection("bookings").orderBy("createdAt", "desc").limit(60).get(), db.collection("businessRequests").orderBy("createdAt", "desc").limit(50).get(), db.collection("applications").orderBy("createdAt", "desc").limit(60).get(), db.collection("providerProfiles").orderBy("createdAt", "desc").limit(80).get(), db.collection("incidents").orderBy("createdAt", "desc").limit(80).get(),
    ]);
    const bookings = documents(bookingDocs); const businessRequests = documents(leadDocs); const applications = documents(applicationDocs); const providers = documents(providerDocs); const incidents = documents(incidentDocs);
    return apiJson({ bookings, businessRequests, applications, providers, incidents, totals: { bookings: bookings.length, businessLeads: businessRequests.length, applications: applications.length, activeProviders: providers.filter(item => item.status === "Active").length, openIncidents: incidents.filter(item => !["Resolved", "Closed"].includes(String(item.status))).length, openWork: bookings.filter(item => !["Completed", "Cancelled"].includes(String(item.status))).length } });
  }
  const body = await readJson(request);
  const action = requiredString(body.action, "action", 40);
  if (action === "assign") {
    const bookingId = requiredString(body.bookingId, "bookingId", 60); const providerId = requiredString(body.providerId, "providerId", 60);
    const [bookingSnapshot, providerSnapshot] = await Promise.all([db.collection("bookings").doc(bookingId).get(), db.collection("providerProfiles").doc(providerId).get()]);
    if (!bookingSnapshot.exists || !providerSnapshot.exists) throw new ApiError(404, "assignment_resource_not_found", "Choose an existing booking and provider.");
    const booking = bookingSnapshot.data()!; const provider = providerSnapshot.data()!;
    if (provider.status !== "Active") throw new ApiError(409, "provider_not_active", "The provider must be active before assignment.");
    await bookingSnapshot.ref.set({ assignedProviderUid: providerId, assignedProviderName: provider.fullName, status: "Assigned", updatedAt: new Date().toISOString() }, { merge: true });
    await createNotification(context, { recipientUid: booking.ownerUid, recipientEmail: booking.ownerEmail, audience: booking.customerType, bookingId, title: "Professional assigned", message: `${provider.fullName} has been assigned to ${booking.option}.` });
    await createNotification(context, { recipientUid: providerId, recipientEmail: provider.ownerEmail, audience: "provider", bookingId, title: "New assignment", message: `Review ${booking.option} for ${booking.scheduledDay}, ${booking.scheduledTime}.` });
    await dispatchOutboundWebhooks(db, { event: "booking.assigned", organizationId: booking.organizationId, data: { bookingId, providerId, providerName: provider.fullName } });
    return apiJson({ bookingId, providerId, providerName: provider.fullName, status: "Assigned", updated: true });
  }
  if (action === "booking-status") {
    const bookingId = requiredString(body.bookingId, "bookingId", 60); const status = requiredString(body.status, "status", 60); const ref = db.collection("bookings").doc(bookingId); const snapshot = await ref.get();
    if (!snapshot.exists) throw new ApiError(404, "booking_not_found", "Booking not found.");
    if (!new Set(["Confirmed", "Unassigned", "Assigned", "Provider assigned", "En route", "Arrived", "In progress", "Completed", "Cancelled"]).has(status)) throw new ApiError(400, "invalid_booking_status", "Choose a valid booking status.");
    await ref.set({ status, updatedAt: new Date().toISOString(), ...(status === "Completed" ? { completedAt: new Date().toISOString() } : {}), ...(status === "Cancelled" ? { cancelledAt: new Date().toISOString() } : {}) }, { merge: true });
    await dispatchOutboundWebhooks(db, { event: "booking.status_changed", organizationId: snapshot.data()?.organizationId, data: { bookingId, status } });
    return apiJson({ bookingId, status, updated: true });
  }
  if (action === "approve-provider") {
    const applicationId = requiredString(body.applicationId, "applicationId", 60); const applicationSnapshot = await db.collection("providerApplications").doc(applicationId).get();
    if (!applicationSnapshot.exists) throw new ApiError(404, "provider_application_not_found", "Provider application not found.");
    const application = applicationSnapshot.data()!; const ownerUid = cleanString(application.ownerUid, 100);
    if (!ownerUid) throw new ApiError(409, "provider_identity_required", "The applicant must sign in before activation.");
    const email = cleanString(application.ownerEmail, 160) || contactEmail(String(application.contact ?? ""));
    const profile = { uid: ownerUid, applicationId, ownerUid, ownerEmail: email, fullName: application.fullName, contact: application.contact, location: application.location, services: application.services ?? ["Cleaning"], availability: application.availability ?? null, status: "Active", acceptingWork: true, rating: 5, completedJobs: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.collection("providerProfiles").doc(ownerUid).set(profile, { merge: true });
    await applicationSnapshot.ref.set({ status: "Approved", updatedAt: new Date().toISOString() }, { merge: true });
    await db.collection("accounts").doc(ownerUid).set({ roles: admin.fieldValue.arrayUnion("provider"), updatedAt: new Date().toISOString() }, { merge: true });
    return apiJson({ applicationId, providerId: ownerUid, status: "Active", updated: true });
  }
  if (action === "lead-status") {
    const requestId = requiredString(body.requestId, "requestId", 60); const status = requiredString(body.status, "status", 60);
    if (!new Set(["New lead", "Site assessment", "Proposal sent", "Won", "Closed"]).has(status)) throw new ApiError(400, "invalid_lead_status", "Choose a valid lead status.");
    await db.collection("businessRequests").doc(requestId).set({ status, updatedAt: new Date().toISOString() }, { merge: true });
    return apiJson({ requestId, status, updated: true });
  }
  throw new ApiError(400, "invalid_operations_action", "Choose assign, booking-status, approve-provider, or lead-status.");
}

export async function handleAuditLogs(context: ApiContext) {
  const { request, actor, admin } = context;
  requireRole(actor, "operations");
  if (request.method !== "GET") throw new ApiError(405, "method_not_allowed", "Audit logs are append-only.");
  const snapshot = await admin.db.collection("auditLogs").orderBy("createdAt", "desc").limit(parseLimit(request, 50, 200)).get();
  return apiJson({ auditLogs: documents(snapshot) });
}

export async function handleProviderWork(context: ApiContext) {
  const { request, actor, admin } = context;
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to open the provider workspace.");
  requireRole(actor, "provider", "operations");
  const profileRef = admin.db.collection("providerProfiles").doc(actor.uid);
  const profileSnapshot = await profileRef.get();
  if (!profileSnapshot.exists) return apiJson({ profile: null, assignedJobs: [], availableJobs: [] });
  const profile = profileSnapshot.data()!;
  if (request.method === "GET") {
    const [assigned, available] = await Promise.all([
      admin.db.collection("bookings").where("assignedProviderUid", "==", actor.uid).orderBy("createdAt", "desc").limit(30).get(),
      profile.status === "Active" && profile.acceptingWork ? admin.db.collection("bookings").where("status", "in", ["Unassigned", "Confirmed"]).orderBy("createdAt", "desc").limit(30).get() : Promise.resolve(null),
    ]);
    return apiJson({ profile: normalizeDocument(profileSnapshot.id, profile), assignedJobs: documents(assigned), availableJobs: available ? documents(available) : [] });
  }
  const body = await readJson(request); const action = requiredString(body.action, "action", 30);
  if (action === "availability") {
    const acceptingWork = Boolean(body.acceptingWork); await profileRef.set({ acceptingWork, updatedAt: new Date().toISOString() }, { merge: true });
    await admin.db.collection("availability").doc(actor.uid).set({ providerUid: actor.uid, acceptingWork, updatedAt: new Date().toISOString() }, { merge: true });
    return apiJson({ acceptingWork, updated: true });
  }
  const bookingId = requiredString(body.bookingId, "bookingId", 60); const bookingRef = admin.db.collection("bookings").doc(bookingId); const bookingSnapshot = await bookingRef.get();
  if (!bookingSnapshot.exists) throw new ApiError(404, "booking_not_found", "Booking not found.");
  const booking = bookingSnapshot.data()!;
  if (action === "accept") {
    const acceptedAt = new Date().toISOString();
    await admin.db.runTransaction(async transaction => {
      const latest = await transaction.get(bookingRef);
      const current = latest.data();
      if (!latest.exists || current?.assignedProviderUid || !["Unassigned", "Confirmed", "Confirmation pending"].includes(String(current?.status))) throw new ApiError(409, "booking_unavailable", "This booking is no longer available.");
      transaction.set(bookingRef, { assignedProviderUid: actor.uid, assignedProviderName: profile.fullName, status: "Provider assigned", acceptedAt, updatedAt: acceptedAt }, { merge: true });
    });
    await createNotification(context, { recipientUid: booking.ownerUid, recipientEmail: booking.ownerEmail, audience: booking.customerType, bookingId, title: "Professional assigned", message: `${profile.fullName} has accepted this booking.` });
    await dispatchOutboundWebhooks(admin.db, { event: "booking.assigned", organizationId: booking.organizationId, data: { bookingId, providerUid: actor.uid, providerName: profile.fullName } });
    return apiJson({ bookingId, status: "Provider assigned", updated: true });
  }
  if (booking.assignedProviderUid !== actor.uid) throw new ApiError(403, "provider_booking_access_denied", "This booking is not assigned to you.");
  const transitions: Record<string, { from: string[]; to: string; timestamp: string }> = { travel: { from: ["Assigned", "Provider assigned"], to: "En route", timestamp: "enRouteAt" }, arrive: { from: ["En route"], to: "Arrived", timestamp: "arrivedAt" }, start: { from: ["Arrived", "En route"], to: "In progress", timestamp: "startedAt" }, complete: { from: ["In progress"], to: "Completed", timestamp: "completedAt" } };
  const transition = transitions[action];
  if (!transition || !transition.from.includes(String(booking.status))) throw new ApiError(409, "invalid_provider_transition", `This booking cannot perform ${action} from ${booking.status}.`);
  const now = new Date().toISOString(); await bookingRef.set({ status: transition.to, [transition.timestamp]: now, updatedAt: now }, { merge: true });
  if (action === "complete") {
    await profileRef.set({ completedJobs: admin.fieldValue.increment(1), updatedAt: now }, { merge: true });
  }
  await admin.db.collection("serviceRecords").doc(recordId("MSR")).set({ bookingId, ownerUid: booking.ownerUid, organizationId: booking.organizationId ?? null, providerUid: actor.uid, event: `Provider marked ${transition.to}`, status: transition.to, createdAt: now });
  await dispatchOutboundWebhooks(admin.db, { event: "booking.status_changed", organizationId: booking.organizationId, data: { bookingId, status: transition.to, providerUid: actor.uid } });
  return apiJson({ bookingId, status: transition.to, updated: true });
}
