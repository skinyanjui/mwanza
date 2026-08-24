import { and, desc, eq, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { bookings, incidents } from "../../../db/schema";
import { createNotification } from "../_notifications";
import { adminEmail, appCheckGuard, clean, json, optionalUserEmail, recordId } from "../_shared";

export const dynamic = "force-dynamic";

const allowedReporterTypes = new Set(["customer", "business", "government", "provider"]);
const allowedIncidentStatuses = new Set(["Open", "Investigating", "Waiting on customer", "Resolved", "Closed"]);

export async function POST(request: Request) {
  const appCheckError = await appCheckGuard(request); if (appCheckError) return appCheckError;
  const email = await optionalUserEmail();
  if (!email) return json({ error: "Sign in before reporting an issue." }, 401);
  try {
    const body = await request.json() as Record<string, unknown>;
    const reporterType = clean(body.reporterType, 30).toLowerCase();
    const bookingId = clean(body.bookingId, 50) || null;
    const category = clean(body.category, 100);
    const details = clean(body.details, 2400);
    const location = clean(body.location, 240) || null;
    if (!allowedReporterTypes.has(reporterType) || !category || details.length < 10) return json({ error: "Choose an issue type and add a short description." }, 400);

    const db = await getDb();
    if (bookingId) {
      const related = await db.select({ id: bookings.id }).from(bookings).where(and(eq(bookings.id, bookingId), or(eq(bookings.ownerEmail, email), eq(bookings.assignedProviderEmail, email)))).limit(1);
      if (!related.length) return json({ error: "That booking is not connected to your account." }, 403);
    }

    const now = new Date().toISOString();
    const id = recordId("MI");
    const priority = category.toLowerCase().includes("safety") || category.toLowerCase().includes("damage") ? "High" : "Medium";
    await db.insert(incidents).values({ id, ownerEmail: email.toLowerCase(), reporterType, bookingId, location, category, details, priority, status: "Open", assignedTo: null, createdAt: now, updatedAt: now });
    await createNotification({ recipientEmail: email, audience: reporterType === "provider" ? "provider" : reporterType === "government" ? "government" : reporterType === "business" ? "business" : "customer", bookingId, title: `Issue ${id} received`, message: "Mwenza Operations has received your report and will post resolution updates here." });
    return json({ id, status: "Open", priority }, 201);
  } catch (error) {
    console.error("incident_create_failed", error);
    return json({ error: "We could not send the report. Please try again." }, 500);
  }
}

export async function GET() {
  const email = await optionalUserEmail();
  if (!email) return json({ error: "Sign in to view issues." }, 401);
  const db = await getDb();
  const isAdmin = Boolean(await adminEmail());
  const rows = isAdmin
    ? await db.select().from(incidents).orderBy(desc(incidents.createdAt)).limit(80)
    : await db.select().from(incidents).where(eq(incidents.ownerEmail, email.toLowerCase())).orderBy(desc(incidents.createdAt)).limit(40);
  return json({ incidents: rows });
}

export async function PATCH(request: Request) {
  const appCheckError = await appCheckGuard(request); if (appCheckError) return appCheckError;
  if (!await adminEmail()) return json({ error: "Operations access required." }, 403);
  const body = await request.json() as Record<string, unknown>;
  const id = clean(body.id, 50);
  const status = clean(body.status, 60);
  const assignedTo = clean(body.assignedTo, 120) || null;
  if (!id || !allowedIncidentStatuses.has(status)) return json({ error: "Choose a valid incident and status." }, 400);
  const db = await getDb();
  const current = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  if (!current.length) return json({ error: "Incident not found." }, 404);
  await db.update(incidents).set({ status, assignedTo, updatedAt: new Date().toISOString() }).where(eq(incidents.id, id));
  await createNotification({ recipientEmail: current[0].ownerEmail, audience: current[0].reporterType === "provider" ? "provider" : current[0].reporterType === "government" ? "government" : current[0].reporterType === "business" ? "business" : "customer", bookingId: current[0].bookingId, title: `Issue ${id}: ${status}`, message: status === "Resolved" ? "The operations team has marked your report resolved. Contact support if anything remains outstanding." : `Your report is now ${status.toLowerCase()}.` });
  return json({ id, status, updated: true });
}
