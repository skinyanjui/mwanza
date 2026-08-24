import { getChatGPTUser } from "../chatgpt-auth";

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
  return (await getChatGPTUser())?.email ?? null;
}

export async function adminEmail() {
  const email = await optionalUserEmail();
  const configured = (process.env.MWENZA_ADMIN_EMAILS ?? "").toLowerCase().split(",").map(item => item.trim()).filter(Boolean);
  return email && configured.includes(email.toLowerCase()) ? email : null;
}
