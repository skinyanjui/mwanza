import { handleAccountProfile, handleApplications, handleAuditLogs, handleBookings, handleBusinessRequests, handleIncidents, handleNotifications, handleOperations, handleProviderWork } from "./core-resources";
import { handleInvoices, handlePayments, handleProcurementRecords, handleReviews, handleServicePricing } from "./commerce-resources";
import { handleAddresses, handleAvailability, handleFiles, handleOrganizationMembers, handleOutboundWebhooks, handleProviderVerifications } from "./organization-resources";
import { handleCrmWebhook, handleMpesaWebhook, handleWhatsAppWebhook } from "./inbound-webhooks";
import { ApiError, apiJson, secureApiRoute, type ApiContext } from "./security";

function assertMethod(request: Request, segments: string[]) {
  const [resource, second, third] = segments;
  const key = resource === "organizations" && third === "members" ? "organization-members"
    : resource === "files" && second === "upload-session" ? "file-upload-session"
    : resource === "outbound-webhooks" && second === "deliveries" ? "webhook-deliveries"
    : resource === "webhooks" && second ? `webhook-${second}`
    : resource;
  const methods: Record<string, string[]> = {
    "account-profile": ["GET", "POST"], applications: ["GET", "POST"], bookings: ["GET", "POST", "PATCH"],
    "business-requests": ["GET", "POST"], incidents: ["GET", "POST", "PATCH"], notifications: ["GET", "PATCH"],
    operations: ["GET", "PATCH"], "audit-logs": ["GET"], "provider-work": ["GET", "PATCH"], payments: ["GET", "POST", "PATCH"],
    invoices: ["GET", "POST", "PATCH"], "procurement-records": ["GET", "POST", "PATCH"], reviews: ["GET", "POST", "PATCH"],
    "service-pricing": ["GET", "POST", "PATCH"], "provider-verifications": ["GET", "POST", "PATCH"], availability: ["GET", "PATCH"],
    addresses: ["GET", "POST", "PATCH", "DELETE"], files: ["GET", "PATCH", "DELETE"], "file-upload-session": ["POST"],
    "organization-members": ["GET", "POST", "PATCH", "DELETE"], "outbound-webhooks": ["GET", "POST", "PATCH", "DELETE"],
    "webhook-deliveries": ["GET"], "webhook-mpesa": ["POST"], "webhook-whatsapp": ["GET", "POST"], "webhook-crm": ["POST"],
  };
  const allowed = methods[key];
  if (!allowed || !allowed.includes(request.method)) throw new ApiError(405, "method_not_allowed", "This method is not supported for the requested resource.", { allowed: allowed ?? [] });
}

async function dispatch(context: ApiContext) {
  assertMethod(context.request, context.segments);
  const [resource, second, third] = context.segments;
  if (resource === "account-profile") return handleAccountProfile(context);
  if (resource === "applications") return handleApplications(context);
  if (resource === "bookings") return handleBookings(context);
  if (resource === "business-requests") return handleBusinessRequests(context);
  if (resource === "incidents") return handleIncidents(context);
  if (resource === "notifications") return handleNotifications(context);
  if (resource === "operations") return handleOperations(context);
  if (resource === "audit-logs") return handleAuditLogs(context);
  if (resource === "provider-work") return handleProviderWork(context);
  if (resource === "payments") return handlePayments(context);
  if (resource === "invoices") return handleInvoices(context);
  if (resource === "procurement-records") return handleProcurementRecords(context);
  if (resource === "reviews") return handleReviews(context);
  if (resource === "service-pricing") return handleServicePricing(context);
  if (resource === "provider-verifications") return handleProviderVerifications(context);
  if (resource === "availability") return handleAvailability(context);
  if (resource === "addresses") return handleAddresses(context);
  if (resource === "files") return handleFiles(context, second);
  if (resource === "outbound-webhooks") return handleOutboundWebhooks(context, second);
  if (resource === "organizations" && second && third === "members") return handleOrganizationMembers(context, second);
  if (resource === "webhooks" && second === "mpesa") return handleMpesaWebhook(context);
  if (resource === "webhooks" && second === "whatsapp") return handleWhatsAppWebhook(context);
  if (resource === "webhooks" && second === "crm") return handleCrmWebhook(context);
  throw new ApiError(404, "api_route_not_found", "This API v1 route does not exist.");
}

function securityFor(request: Request, segments: string[]) {
  const [resource, second] = segments; const mutation = request.method !== "GET";
  const webhook = resource === "webhooks";
  const publicRead = request.method === "GET" && (resource === "service-pricing" || resource === "reviews" || webhook && second === "whatsapp");
  const publicWrite = request.method === "POST" && new Set(["applications", "bookings", "business-requests"]).has(resource);
  const criticalWrite = mutation && !webhook && !new Set(["account-profile", "notifications", "availability"]).has(resource);
  const limits: Record<string, { limit: number; windowMs: number }> = { webhooks: { limit: 300, windowMs: 60_000 }, bookings: { limit: 20, windowMs: 10 * 60_000 }, applications: { limit: 10, windowMs: 60 * 60_000 }, "business-requests": { limit: 10, windowMs: 60 * 60_000 }, payments: { limit: 30, windowMs: 10 * 60_000 } };
  const policy = limits[resource] ?? { limit: mutation ? 90 : 300, windowMs: 60_000 };
  return { allowAnonymous: publicRead || publicWrite || webhook, requireAppCheck: mutation && !webhook, requireIdempotency: criticalWrite && !webhook, rateLimit: { scope: `v1:${resource || "root"}`, ...policy } };
}

async function proxyToFirebaseFunction(request: Request, segments: string[]) {
  const configured = process.env.FIREBASE_FUNCTIONS_API_URL?.trim();
  if (!configured || request.headers.get("x-mwenza-function-proxy") === "1") return null;
  let target: URL;
  try { target = new URL(configured); } catch { throw new ApiError(500, "invalid_functions_url", "FIREBASE_FUNCTIONS_API_URL is not a valid URL."); }
  if (target.protocol !== "https:") throw new ApiError(500, "invalid_functions_url", "FIREBASE_FUNCTIONS_API_URL must use HTTPS.");
  target.pathname = `${target.pathname.replace(/\/$/, "")}/api/v1/${segments.map(encodeURIComponent).join("/")}`;
  target.search = new URL(request.url).search;
  const headers = new Headers(request.headers);
  headers.delete("host"); headers.delete("content-length"); headers.set("x-mwenza-function-proxy", "1");
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  return fetch(target, { method: request.method, headers, body, redirect: "manual", signal: request.signal });
}

export async function routeV1(request: Request, segments: string[]) {
  if (!segments.length) return apiJson({ name: "Mwenza API", version: "1.0.0", status: "available", documentation: "/api/v1/openapi", resources: ["account-profile", "applications", "bookings", "business-requests", "incidents", "notifications", "operations", "audit-logs", "provider-work", "payments", "invoices", "procurement-records", "files", "reviews", "provider-verifications", "organizations", "service-pricing", "availability", "addresses", "outbound-webhooks", "webhooks"] });
  const proxied = await proxyToFirebaseFunction(request, segments);
  if (proxied) return proxied;
  return secureApiRoute(request, segments, dispatch, securityFor(request, segments));
}

export async function routeLegacy(request: Request, resource: string) {
  const headers = new Headers(request.headers);
  if (request.method !== "GET" && !headers.has("idempotency-key")) headers.set("idempotency-key", crypto.randomUUID());
  const versioned = new Request(request, { headers });
  const response = await routeV1(versioned, [resource]);
  if (response.ok || !response.headers.get("content-type")?.includes("application/json")) return response;
  try {
    const body = await response.clone().json() as { error?: { code?: string; message?: string }; requestId?: string };
    if (!body.error?.message) return response;
    return apiJson({ error: body.error.message, code: body.error.code, requestId: body.requestId }, response.status, response.headers);
  } catch {
    return response;
  }
}
