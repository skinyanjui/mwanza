import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { notifications } from "../../../db/schema";
import { appCheckGuard, clean, json, optionalUserEmail } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const email = await optionalUserEmail();
  if (!email) return json({ error: "Sign in to view updates." }, 401);
  const rows = await (await getDb())
    .select()
    .from(notifications)
    .where(eq(notifications.recipientEmail, email.toLowerCase()))
    .orderBy(desc(notifications.createdAt))
    .limit(40);
  return json({ notifications: rows, unread: rows.filter((item) => item.status === "Unread").length });
}

export async function PATCH(request: Request) {
  const appCheckError = await appCheckGuard(request); if (appCheckError) return appCheckError;
  const email = await optionalUserEmail();
  if (!email) return json({ error: "Sign in to update notifications." }, 401);
  const body = await request.json() as Record<string, unknown>;
  const id = clean(body.id, 50);
  const now = new Date().toISOString();
  const db = await getDb();
  if (id) {
    await db.update(notifications).set({ status: "Read", readAt: now }).where(and(eq(notifications.id, id), eq(notifications.recipientEmail, email.toLowerCase())));
  } else {
    await db.update(notifications).set({ status: "Read", readAt: now }).where(and(eq(notifications.recipientEmail, email.toLowerCase()), eq(notifications.status, "Unread")));
  }
  return json({ updated: true });
}
