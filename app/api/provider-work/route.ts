import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { bookings, providerProfiles } from "../../../db/schema";
import { createNotification, customerNotificationAudience } from "../_notifications";
import { appCheckGuard, clean, json, optionalUserEmail } from "../_shared";

export const dynamic = "force-dynamic";

const openStatuses = ["Unassigned", "Confirmed"];
const statusActions = {
  travel: { status: "En route", timestamp: "enRouteAt", allowed: ["Provider assigned", "Assigned"] },
  arrive: { status: "Arrived", timestamp: "updatedAt", allowed: ["En route"] },
  start: { status: "In progress", timestamp: "startedAt", allowed: ["Arrived", "En route"] },
  complete: { status: "Completed", timestamp: "completedAt", allowed: ["In progress"] },
} as const;

function suitable(serviceList: string, service: string, option: string) {
  let skills: string[] = [];
  try { skills = JSON.parse(serviceList); } catch { skills = [serviceList]; }
  const work = `${service} ${option}`.toLowerCase();
  return skills.some((skill) => {
    const words = String(skill).toLowerCase().split(/\s|&/).filter((word) => word.length > 3);
    return words.some((word) => work.includes(word));
  });
}

function serviceArea(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts.at(-2)! : "Nairobi area";
}

export async function GET() {
  const userEmail = await optionalUserEmail();
  if (!userEmail) return json({ error: "Sign in to open the provider workspace." }, 401);
  const email = userEmail.toLowerCase();
  const db = await getDb();
  const profiles = await db.select().from(providerProfiles).where(eq(providerProfiles.ownerEmail, email)).limit(1);
  const profile = profiles[0] ?? null;
  if (!profile) return json({ profile: null, assignedJobs: [], availableJobs: [] });

  const [assignedJobs, candidateJobs] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.assignedProviderEmail, email)).orderBy(desc(bookings.createdAt)).limit(30),
    profile.status === "Active" && profile.acceptingWork
      ? db.select().from(bookings).where(and(isNull(bookings.assignedProviderId), inArray(bookings.status, openStatuses))).orderBy(desc(bookings.createdAt)).limit(30)
      : Promise.resolve([]),
  ]);
  const availableJobs = candidateJobs.filter((item) => suitable(profile.services, item.service, item.option)).map((item) => ({
    id: item.id,
    service: item.service,
    option: item.option,
    area: serviceArea(item.address),
    scope: item.scope,
    scheduledDay: item.scheduledDay,
    scheduledDate: item.scheduledDate,
    scheduledTime: item.scheduledTime,
    total: item.total,
    customerType: item.customerType,
  }));
  return json({ profile, assignedJobs, availableJobs });
}

export async function PATCH(request: Request) {
  const appCheckError = await appCheckGuard(request); if (appCheckError) return appCheckError;
  const userEmail = await optionalUserEmail();
  if (!userEmail) return json({ error: "Sign in to update provider work." }, 401);
  const email = userEmail.toLowerCase();
  const body = await request.json() as Record<string, unknown>;
  const action = clean(body.action, 30);
  const db = await getDb();
  const profiles = await db.select().from(providerProfiles).where(and(eq(providerProfiles.ownerEmail, email), eq(providerProfiles.status, "Active"))).limit(1);
  const profile = profiles[0];
  if (!profile) return json({ error: "An active provider profile is required." }, 403);
  const now = new Date().toISOString();

  if (action === "availability") {
    const acceptingWork = Boolean(body.acceptingWork) ? 1 : 0;
    await db.update(providerProfiles).set({ acceptingWork, updatedAt: now }).where(eq(providerProfiles.id, profile.id));
    return json({ acceptingWork: Boolean(acceptingWork), updated: true });
  }

  const bookingId = clean(body.bookingId, 50);
  if (!bookingId) return json({ error: "Booking ID is required." }, 400);

  if (action === "accept") {
    if (!profile.acceptingWork) return json({ error: "Set yourself available before accepting work." }, 409);
    const candidates = await db.select().from(bookings).where(and(eq(bookings.id, bookingId), isNull(bookings.assignedProviderId), inArray(bookings.status, openStatuses))).limit(1);
    const booking = candidates[0];
    if (!booking || !suitable(profile.services, booking.service, booking.option)) return json({ error: "This job is no longer available." }, 409);
    await db.update(bookings).set({ assignedProviderId: profile.id, assignedProviderEmail: email, assignedProviderName: profile.fullName, status: "Provider assigned", acceptedAt: now, updatedAt: now }).where(and(eq(bookings.id, bookingId), isNull(bookings.assignedProviderId)));
    const assigned = await db.select().from(bookings).where(and(eq(bookings.id, bookingId), eq(bookings.assignedProviderEmail, email))).limit(1);
    if (!assigned.length) return json({ error: "Another provider accepted this job first." }, 409);
    await createNotification({ recipientEmail: booking.ownerEmail, audience: customerNotificationAudience(booking.customerType), bookingId, title: `${profile.fullName} is assigned`, message: `${booking.option} is assigned for ${booking.scheduledDay}, ${booking.scheduledTime}.` });
    return json({ booking: assigned[0], updated: true });
  }

  const transition = statusActions[action as keyof typeof statusActions];
  if (!transition) return json({ error: "Choose a valid work action." }, 400);
  const currentRows = await db.select().from(bookings).where(and(eq(bookings.id, bookingId), eq(bookings.assignedProviderEmail, email))).limit(1);
  const booking = currentRows[0];
  if (!booking) return json({ error: "Assigned booking not found." }, 404);
  if (!(transition.allowed as readonly string[]).includes(booking.status)) return json({ error: `This booking cannot move from ${booking.status} to ${transition.status}.` }, 409);
  const changes: Record<string, string> = { status: transition.status, updatedAt: now, [transition.timestamp]: now };
  await db.update(bookings).set(changes).where(and(eq(bookings.id, bookingId), eq(bookings.assignedProviderEmail, email)));
  if (action === "complete") await db.update(providerProfiles).set({ completedJobs: sql`${providerProfiles.completedJobs} + 1`, updatedAt: now }).where(eq(providerProfiles.id, profile.id));
  const messages = {
    travel: `${profile.fullName} is on the way for your ${booking.option.toLowerCase()}.`,
    arrive: `${profile.fullName} has arrived for your ${booking.option.toLowerCase()}.`,
    start: `${booking.option} is now in progress.`,
    complete: `${booking.option} is complete. You can report an issue from your Mwenza account if anything needs attention.`,
  };
  await createNotification({ recipientEmail: booking.ownerEmail, audience: customerNotificationAudience(booking.customerType), bookingId, title: transition.status, message: messages[action as keyof typeof messages] });
  return json({ bookingId, status: transition.status, updated: true });
}
