import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { accountProfiles } from "../../../db/schema";
import { clean, json } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ authenticated: false, user: null, profile: null });

  const email = user.email.toLowerCase();
  const rows = await (await getDb()).select().from(accountProfiles).where(eq(accountProfiles.email, email)).limit(1);
  return json({ authenticated: true, user, profile: rows[0] ?? null });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in before creating an account." }, 401);

  const body = await request.json() as Record<string, unknown>;
  const fullName = clean(body.fullName, 120);
  const phone = clean(body.phone, 40);
  const accountType = clean(body.accountType, 20);
  const businessName = clean(body.businessName, 180);
  const serviceArea = clean(body.serviceArea, 100) || "Nairobi";
  if (!fullName || phone.replace(/\D/g, "").length < 9) return json({ error: "Add your name and a valid phone number." }, 400);
  if (!(["Home", "Business"] as string[]).includes(accountType)) return json({ error: "Choose a valid account type." }, 400);
  if (accountType === "Business" && !businessName) return json({ error: "Add your business name." }, 400);

  const email = user.email.toLowerCase();
  const db = await getDb();
  const current = await db.select().from(accountProfiles).where(eq(accountProfiles.email, email)).limit(1);
  const now = new Date().toISOString();
  const profile = { email, fullName, phone, accountType, businessName: accountType === "Business" ? businessName : null, serviceArea, status: "Active", updatedAt: now };

  if (current[0]) await db.update(accountProfiles).set(profile).where(eq(accountProfiles.email, email));
  else await db.insert(accountProfiles).values({ ...profile, createdAt: now });

  return json({ profile: { ...profile, createdAt: current[0]?.createdAt ?? now } });
}
