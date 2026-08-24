import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { applications } from "../../../db/schema";
import { adminEmail, clean, json, optionalUserEmail, recordId } from "../_shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const applicationType = clean(body.applicationType, 40); const roleOrTerritory = clean(body.roleOrTerritory, 160); const fullName = clean(body.fullName, 120); const contact = clean(body.contact, 160); const location = clean(body.location, 160); const details = clean(body.details, 2400);
    if (!new Set(["job", "provider", "franchise"]).has(applicationType) || !roleOrTerritory || !fullName || !contact || !location || details.length < 20) return json({ error: "Complete every application field." }, 400);
    const now = new Date().toISOString(); const id = recordId(applicationType === "franchise" ? "MF" : applicationType === "provider" ? "MP" : "MJ");
    await (await getDb()).insert(applications).values({ id, ownerEmail: (await optionalUserEmail())?.toLowerCase() ?? null, applicationType, roleOrTerritory, fullName, contact, location, details, services: Array.isArray(body.services) ? JSON.stringify(body.services.map(item => clean(item, 80)).filter(Boolean)) : null, availability: clean(body.availability, 120) || null, status: "Received", createdAt: now, updatedAt: now });
    return json({ id, status: "Received" }, 201);
  } catch (error) { console.error("application_create_failed", error); return json({ error: "We could not save the application. Please try again." }, 500); }
}

export async function GET() {
  const email = await adminEmail(); if (!email) return json({ error: "Operations access required." }, 403);
  const rows = await (await getDb()).select().from(applications).orderBy(desc(applications.createdAt)).limit(75);
  return json({ applications: rows });
}
