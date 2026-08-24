import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { applications, bookings, businessRequests, incidents, providerProfiles } from "../../../db/schema";
import { createNotification, customerNotificationAudience } from "../_notifications";
import { adminEmail, appCheckGuard, clean, json, recordId } from "../_shared";

export const dynamic = "force-dynamic";

const bookingStatuses = new Set(["Confirmed", "Unassigned", "Assigned", "Provider assigned", "En route", "In progress", "Completed", "Cancelled"]);
const leadStatuses = new Set(["New lead", "Site assessment", "Proposal sent", "Won", "Closed"]);

function contactEmail(contact: string) {
  return contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? null;
}

export async function GET() {
  if (!await adminEmail()) return json({ error: "Operations access required." }, 403);
  const db = await getDb();
  const [latestBookings, latestLeads, latestApplications, providers, latestIncidents] = await Promise.all([
    db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(60),
    db.select().from(businessRequests).orderBy(desc(businessRequests.createdAt)).limit(50),
    db.select().from(applications).orderBy(desc(applications.createdAt)).limit(60),
    db.select().from(providerProfiles).orderBy(desc(providerProfiles.createdAt)).limit(80),
    db.select().from(incidents).orderBy(desc(incidents.createdAt)).limit(80),
  ]);
  return json({
    bookings: latestBookings,
    businessRequests: latestLeads,
    applications: latestApplications,
    providers,
    incidents: latestIncidents,
    totals: {
      bookings: latestBookings.length,
      businessLeads: latestLeads.length,
      applications: latestApplications.length,
      activeProviders: providers.filter((item) => item.status === "Active").length,
      openIncidents: latestIncidents.filter((item) => !["Resolved", "Closed"].includes(item.status)).length,
      openWork: latestBookings.filter((item) => !["Completed", "Cancelled"].includes(item.status)).length,
    },
  });
}

export async function PATCH(request: Request) {
  const appCheckError = await appCheckGuard(request); if (appCheckError) return appCheckError;
  if (!await adminEmail()) return json({ error: "Operations access required." }, 403);
  const body = await request.json() as Record<string, unknown>;
  const action = clean(body.action, 40);
  const db = await getDb();
  const now = new Date().toISOString();

  if (action === "assign") {
    const bookingId = clean(body.bookingId, 50);
    const providerId = clean(body.providerId, 50);
    const [bookingRows, providerRows] = await Promise.all([
      db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1),
      db.select().from(providerProfiles).where(eq(providerProfiles.id, providerId)).limit(1),
    ]);
    const booking = bookingRows[0];
    const provider = providerRows[0];
    if (!booking || !provider) return json({ error: "Choose an existing booking and provider." }, 404);
    if (provider.status !== "Active" || !provider.ownerEmail) return json({ error: "This provider must finish account activation before assignment." }, 409);
    if (["Completed", "Cancelled"].includes(booking.status)) return json({ error: "Closed bookings cannot be assigned." }, 409);
    await db.update(bookings).set({ assignedProviderId: provider.id, assignedProviderEmail: provider.ownerEmail, assignedProviderName: provider.fullName, status: "Assigned", updatedAt: now }).where(eq(bookings.id, booking.id));
    await Promise.all([
      createNotification({ recipientEmail: booking.ownerEmail, audience: customerNotificationAudience(booking.customerType), bookingId: booking.id, title: "Professional assigned", message: `${provider.fullName} has been assigned to ${booking.option}.` }),
      createNotification({ recipientEmail: provider.ownerEmail, audience: "provider", bookingId: booking.id, title: "New assignment", message: `Review ${booking.option} in ${booking.address.split(",")[0]} for ${booking.scheduledDay}, ${booking.scheduledTime}.` }),
    ]);
    return json({ bookingId: booking.id, providerId: provider.id, providerName: provider.fullName, status: "Assigned", updated: true });
  }

  if (action === "booking-status") {
    const bookingId = clean(body.bookingId, 50);
    const status = clean(body.status, 60);
    if (!bookingId || !bookingStatuses.has(status)) return json({ error: "Choose a valid booking status." }, 400);
    const rows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    const booking = rows[0];
    if (!booking) return json({ error: "Booking not found." }, 404);
    const timestamps: Record<string, string> = {};
    if (status === "Completed") timestamps.completedAt = now;
    if (status === "Cancelled") timestamps.cancelledAt = now;
    await db.update(bookings).set({ status, updatedAt: now, ...timestamps }).where(eq(bookings.id, bookingId));
    await createNotification({ recipientEmail: booking.ownerEmail, audience: customerNotificationAudience(booking.customerType), bookingId, title: `Booking ${status.toLowerCase()}`, message: `${booking.option} is now marked ${status.toLowerCase()}.` });
    return json({ bookingId, status, updated: true });
  }

  if (action === "approve-provider") {
    const applicationId = clean(body.applicationId, 50);
    const rows = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
    const application = rows[0];
    if (!application || application.applicationType !== "provider") return json({ error: "Provider application not found." }, 404);
    const existing = await db.select().from(providerProfiles).where(eq(providerProfiles.applicationId, application.id)).limit(1);
    const ownerEmail = application.ownerEmail?.toLowerCase() ?? contactEmail(application.contact);
    const status = ownerEmail ? "Active" : "Activation needed";
    let providerId = existing[0]?.id;
    if (existing.length) {
      await db.update(providerProfiles).set({ ownerEmail, fullName: application.fullName, contact: application.contact, location: application.location, services: application.services ?? JSON.stringify(["Cleaning"]), availability: application.availability, status, updatedAt: now }).where(eq(providerProfiles.id, existing[0].id));
    } else {
      providerId = recordId("PR");
      await db.insert(providerProfiles).values({ id: providerId, applicationId: application.id, ownerEmail, fullName: application.fullName, contact: application.contact, location: application.location, services: application.services ?? JSON.stringify(["Cleaning"]), availability: application.availability, status, acceptingWork: 1, rating: 500, completedJobs: 0, createdAt: now, updatedAt: now });
    }
    await db.update(applications).set({ status: ownerEmail ? "Approved" : "Approved · email required", updatedAt: now }).where(eq(applications.id, application.id));
    await createNotification({ recipientEmail: ownerEmail, audience: "provider", title: "Your Mwenza provider profile is active", message: "Open the provider workspace to set availability and review suitable work." });
    return json({ applicationId, providerId, status, ownerEmail, updated: true });
  }

  if (action === "lead-status") {
    const requestId = clean(body.requestId, 50);
    const status = clean(body.status, 60);
    if (!requestId || !leadStatuses.has(status)) return json({ error: "Choose a valid lead status." }, 400);
    await db.update(businessRequests).set({ status, updatedAt: now }).where(eq(businessRequests.id, requestId));
    return json({ requestId, status, updated: true });
  }

  return json({ error: "Choose a valid operations action." }, 400);
}
