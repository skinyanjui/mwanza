import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { routeV1 } from "../../app/api/v1/_lib/router";

const apiIpHashSalt = defineSecret("API_IP_HASH_SALT");
const mpesaCallbackToken = defineSecret("MPESA_CALLBACK_TOKEN");
const whatsAppVerifyToken = defineSecret("WHATSAPP_VERIFY_TOKEN");
const whatsAppAppSecret = defineSecret("WHATSAPP_APP_SECRET");
const crmWebhookSecret = defineSecret("CRM_WEBHOOK_SECRET");

function requestHeaders(input: Record<string, string | string[] | undefined>) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(input)) {
    if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  headers.set("x-mwenza-function-proxy", "1");
  return headers;
}

export const api = onRequest({
  region: "africa-south1",
  timeoutSeconds: 60,
  memory: "512MiB",
  invoker: "public",
  secrets: [apiIpHashSalt, mpesaCallbackToken, whatsAppVerifyToken, whatsAppAppSecret, crmWebhookSecret],
}, async (request, response) => {
  const originalUrl = request.originalUrl || request.url || "/";
  const url = new URL(originalUrl, `https://${request.headers.host || "mwenza-api.local"}`);
  const marker = "/api/v1";
  const markerIndex = url.pathname.indexOf(marker);
  const routePath = markerIndex >= 0 ? url.pathname.slice(markerIndex + marker.length) : url.pathname;
  const segments = routePath.split("/").filter(Boolean).map(segment => decodeURIComponent(segment));
  const method = request.method.toUpperCase();
  const body = ["GET", "HEAD"].includes(method) ? undefined : Uint8Array.from(request.rawBody);
  const webRequest = new Request(url, { method, headers: requestHeaders(request.headers), body });
  const result = await routeV1(webRequest, segments);
  response.status(result.status);
  result.headers.forEach((value, name) => response.setHeader(name, value));
  response.send(Buffer.from(await result.arrayBuffer()));
});
