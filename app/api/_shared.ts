import { getChatGPTUser } from "../chatgpt-auth";
import { getFirebaseServerRoles, getFirebaseServerUser, verifyFirebaseAppCheck } from "../lib/firebase-server";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

export function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function recordId(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase()}`;
}

export async function optionalUserEmail() {
  return (await getFirebaseServerUser())?.email ?? (await getChatGPTUser())?.email ?? null;
}

export async function appCheckGuard(request: Request) {
  return await verifyFirebaseAppCheck(request) ? null : json({ error: "App verification failed. Refresh the page and try again." }, 401);
}

export async function adminEmail() {
  const firebaseUser = await getFirebaseServerUser();
  if (firebaseUser && (await getFirebaseServerRoles()).includes("operations")) return firebaseUser.email ?? `firebase:${firebaseUser.uid}`;
  const email = (await getChatGPTUser())?.email ?? null;
  const configured = (process.env.MWENZA_ADMIN_EMAILS ?? "").toLowerCase().split(",").map(item => item.trim()).filter(Boolean);
  return email && configured.includes(email.toLowerCase()) ? email : null;
}
