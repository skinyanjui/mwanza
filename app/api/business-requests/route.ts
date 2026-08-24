import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { businessRequests } from "../../../db/schema";
import { adminEmail, appCheckGuard, clean, json, optionalUserEmail, recordId } from "../_shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const appCheckError = await appCheckGuard(request); if (appCheckError) return appCheckError;
  try {
    const body = await request.json() as Record<string, unknown>;
    const businessName = clean(body.businessName, 180); const contact = clean(body.contact, 160);
    const selected = Array.isArray(body.services) ? body.services.map(item => clean(item, 100)).filter(Boolean).slice(0, 12) : [];
    const locationCount = Math.max(1, Math.min(250, Number(body.locationCount) || 1));
    if (!businessName || !contact || !selected.length) return json({ error: "Add your business, contact and at least one service." }, 400);
    const now = new Date().toISOString(); const id = recordId("MB");
    await (await getDb()).insert(businessRequests).values({ id, ownerEmail: (await optionalUserEmail())?.toLowerCase() ?? null, businessName, services: JSON.stringify(selected), frequency: clean(body.frequency, 80) || "Not sure", locationCount, contact, status: "New lead", createdAt: now, updatedAt: now });
    return json({ id, status: "New lead" }, 201);
  } catch (error) { console.error("business_request_failed", error); return json({ error: "We could not save your request. Please try again." }, 500); }
}

export async function GET() {
  const email = await adminEmail(); if (!email) return json({ error: "Operations access required." }, 403);
  const requests = await (await getDb()).select().from(businessRequests).orderBy(desc(businessRequests.createdAt)).limit(50);
  return json({ requests });
}
