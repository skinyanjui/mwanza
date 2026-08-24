import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { bookings } from "../../../db/schema";
import { createNotification, customerNotificationAudience } from "../_notifications";
import { appCheckGuard, clean, json, optionalUserEmail, recordId } from "../_shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const appCheckError = await appCheckGuard(request); if (appCheckError) return appCheckError;
  try {
    const body = await request.json() as Record<string, unknown>;
    const customerType = clean(body.customerType, 20);
    const service = clean(body.service, 80);
    const option = clean(body.option, 120);
    const address = clean(body.address, 300);
    const contactName = clean(body.name, 120);
    const contact = clean(body.contact, 160);
    const scheduledDay = clean(body.day, 40);
    const scheduledTime = clean(body.time, 60);
    if (!customerType || !service || !option || !address || !contactName || !contact || !scheduledDay || !scheduledTime) return json({ error: "Complete the required booking details." }, 400);
    const now = new Date().toISOString();
    const id = recordId("MW");
    const ownerEmail = (await optionalUserEmail())?.toLowerCase() ?? null;
    await (await getDb()).insert(bookings).values({
      id, ownerEmail, customerType, company: clean(body.company, 180) || null,
      service, option, address, instructions: clean(body.instructions, 1200) || null, scope: clean(body.scope, 1200) || null,
      frequency: clean(body.frequency, 60) || "One time", locations: Math.max(1, Math.min(100, Number(body.locations) || 1)),
      scheduledDay, scheduledDate: clean(body.date, 40) || null, scheduledTime, contactName, contact,
      payment: clean(body.payment, 40) || "M-Pesa", total: Number.isFinite(Number(body.total)) ? Math.max(0, Number(body.total)) : null,
      status: "Confirmation pending", createdAt: now, updatedAt: now,
    });
    await createNotification({ recipientEmail: ownerEmail, audience: customerNotificationAudience(customerType), bookingId: id, title: "Booking request received", message: `${option} is requested for ${scheduledDay}, ${scheduledTime}. We’ll confirm the team next.` });
    return json({ id, status: "Confirmation pending" }, 201);
  } catch (error) {
    console.error("booking_create_failed", error);
    return json({ error: "We could not save the request. Please try again." }, 500);
  }
}

export async function GET() {
  const email = await optionalUserEmail();
  if (!email) return json({ error: "Sign in to view bookings." }, 401);
  const rows = await (await getDb()).select().from(bookings).where(eq(bookings.ownerEmail, email.toLowerCase())).orderBy(desc(bookings.createdAt)).limit(25);
  return json({ bookings: rows });
}

export async function PATCH(request: Request) {
  const appCheckError = await appCheckGuard(request); if (appCheckError) return appCheckError;
  const email = await optionalUserEmail();
  if (!email) return json({ error: "Sign in to update bookings." }, 401);
  const body = await request.json() as Record<string, unknown>;
  const id = clean(body.id, 40);
  if (!id) return json({ error: "Booking ID is required." }, 400);
  const db = await getDb();
  const emailKey = email.toLowerCase();
  const rows = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.ownerEmail, emailKey))).limit(1);
  const booking = rows[0];
  if (!booking) return json({ error: "Booking not found." }, 404);
  if (["Completed", "Cancelled"].includes(booking.status)) return json({ error: "This booking can no longer be changed." }, 409);
  const changes: { status?: string; scheduledDay?: string; scheduledTime?: string; cancelledAt?: string; updatedAt: string } = { updatedAt: new Date().toISOString() };
  const status = clean(body.status, 80); const day = clean(body.day, 40); const time = clean(body.time, 60);
  if (status && !["Cancelled", "Reschedule requested"].includes(status)) return json({ error: "Customers may only reschedule or cancel a booking here." }, 403);
  if (status) changes.status = status;
  if (status === "Cancelled") changes.cancelledAt = changes.updatedAt;
  if (day) changes.scheduledDay = day;
  if (time) changes.scheduledTime = time;
  if (!status && !day && !time) return json({ error: "Choose a booking change." }, 400);
  await db.update(bookings).set(changes).where(and(eq(bookings.id, id), eq(bookings.ownerEmail, emailKey)));
  await createNotification({ recipientEmail: emailKey, audience: customerNotificationAudience(booking.customerType), bookingId: id, title: status === "Cancelled" ? "Booking cancelled" : "Change request received", message: status === "Cancelled" ? `${booking.option} has been cancelled.` : "Mwenza Operations will confirm the requested arrival window." });
  return json({ id, status: changes.status ?? booking.status, updated: true });
}
