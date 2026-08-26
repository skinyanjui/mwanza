import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { verifyApiAppCheck } from "./app-check";
import { getFirebaseAdmin, type FirebaseAdminServices } from "./firebase-admin";

export type ApiActor = {
  uid: string | null;
  email: string | null;
  roles: string[];
  organizationIds: string[];
  authType: "firebase" | "chatgpt" | "webhook" | "anonymous";
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export type ApiContext = {
  request: Request;
  requestId: string;
  segments: string[];
  actor: ApiActor;
  admin: FirebaseAdminServices;
  ipHash: string;
};

type SecurityOptions = {
  allowAnonymous?: boolean;
  requireAppCheck?: boolean;
  requireIdempotency?: boolean;
  rateLimit?: { scope: string; limit: number; windowMs: number };
};

type IdempotencyLease = {
  id: string;
  replay?: Response;
};

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function apiJson(data: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(data, { status, headers: { ...jsonHeaders, ...headers } });
}

export function parseLimit(request: Request, fallback = 50, maximum = 100) {
  const value = Number(new URL(request.url).searchParams.get("limit"));
  return Number.isFinite(value) ? Math.max(1, Math.min(maximum, Math.floor(value))) : fallback;
}

export function cleanString(value: unknown, maximum = 500) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function requiredString(value: unknown, field: string, maximum = 500) {
  const result = cleanString(value, maximum);
  if (!result) throw new ApiError(400, "invalid_request", `${field} is required.`);
  return result;
}

export async function readJson(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) throw new ApiError(415, "unsupported_media_type", "Use application/json.");
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 256 * 1024) throw new ApiError(413, "payload_too_large", "JSON requests must be 256 KB or smaller.");
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 256 * 1024) throw new ApiError(413, "payload_too_large", "JSON requests must be 256 KB or smaller.");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (reason) {
    if (reason instanceof ApiError) throw reason;
    if (declaredLength > 256 * 1024) throw new ApiError(413, "payload_too_large", "JSON requests must be 256 KB or smaller.");
    throw new ApiError(400, "invalid_json", "The request body is not valid JSON.");
  }
}

export function recordId(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 9).toUpperCase()}`;
}

export function normalizeDocument(id: string, data: DocumentData | undefined): Record<string, unknown> {
  const normalize = (value: unknown): unknown => {
    if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") return (value as { toDate: () => Date }).toDate().toISOString();
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, normalize(child)]));
    return value;
  };
  return normalize({ id, ...(data ?? {}) }) as Record<string, unknown>;
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function bearer(request: Request) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

async function resolveActor(request: Request, admin: FirebaseAdminServices, allowAnonymous = false): Promise<ApiActor> {
  const token = bearer(request);
  if (token) {
    try {
      const decoded = await admin.auth.verifyIdToken(token, true);
      const account = await admin.db.collection("accounts").doc(decoded.uid).get();
      const data = account.data() ?? {};
      return {
        uid: decoded.uid,
        email: decoded.email?.toLowerCase() ?? null,
        roles: Array.isArray(data.roles) ? data.roles.map(String) : ["customer"],
        organizationIds: Array.isArray(data.organizationIds) ? data.organizationIds.map(String) : [],
        authType: "firebase",
      };
    } catch {
      throw new ApiError(401, "invalid_token", "The Firebase identity token is invalid or expired.");
    }
  }

  const chatGptEmail = process.env.TRUST_CHATGPT_AUTH_HEADERS === "true" ? request.headers.get("oai-authenticated-user-email")?.toLowerCase() ?? null : null;
  if (chatGptEmail) {
    const operationsEmails = (process.env.MWENZA_ADMIN_EMAILS ?? "").toLowerCase().split(",").map(value => value.trim()).filter(Boolean);
    return { uid: `chatgpt:${await digest(chatGptEmail)}`, email: chatGptEmail, roles: operationsEmails.includes(chatGptEmail) ? ["operations"] : ["customer"], organizationIds: [], authType: "chatgpt" };
  }
  if (allowAnonymous) return { uid: null, email: null, roles: [], organizationIds: [], authType: "anonymous" };
  throw new ApiError(401, "authentication_required", "Sign in before using this endpoint.");
}

export function requireRole(actor: ApiActor, ...roles: string[]) {
  if (!roles.some(role => actor.roles.includes(role))) throw new ApiError(403, "insufficient_role", `This action requires ${roles.join(" or ")} access.`);
}

export async function requireOrganizationRole(db: Firestore, actor: ApiActor, organizationId: string, allowed = ["owner", "manager", "billing", "viewer"]) {
  if (actor.roles.includes("operations")) return "operations";
  if (!actor.uid) throw new ApiError(401, "authentication_required", "Sign in to access this organization.");
  const membership = await db.collection("organizations").doc(organizationId).collection("members").doc(actor.uid).get();
  const role = String(membership.data()?.role ?? "");
  if (!membership.exists || !allowed.includes(role)) throw new ApiError(403, "organization_access_denied", "You do not have the required organization access.");
  return role;
}

async function enforceRateLimit(db: Firestore, actorKey: string, policy: NonNullable<SecurityOptions["rateLimit"]>) {
  const bucket = Math.floor(Date.now() / policy.windowMs);
  const id = await digest(`${policy.scope}:${actorKey}:${bucket}`);
  const ref = db.collection("rateLimits").doc(id);
  const resetAt = new Date((bucket + 1) * policy.windowMs).toISOString();
  const used = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const count = Number(snapshot.data()?.count ?? 0);
    if (count >= policy.limit) throw new ApiError(429, "rate_limit_exceeded", `Try again after ${resetAt}.`, { limit: policy.limit, remaining: 0, resetAt });
    transaction.set(ref, { scope: policy.scope, actorKey, count: count + 1, resetAt, updatedAt: new Date().toISOString(), expiresAt: new Date((bucket + 2) * policy.windowMs) }, { merge: true });
    return count + 1;
  });
  return { limit: policy.limit, remaining: Math.max(0, policy.limit - used), resetAt };
}

function setRateLimitHeaders(response: Response, state: { limit: number; remaining: number; resetAt: string } | null) {
  if (!state) return;
  response.headers.set("ratelimit-limit", String(state.limit));
  response.headers.set("ratelimit-remaining", String(state.remaining));
  response.headers.set("ratelimit-reset", state.resetAt);
}

async function acquireIdempotency(db: Firestore, request: Request, actor: ApiActor, requestId: string, required: boolean): Promise<IdempotencyLease | null> {
  const key = cleanString(request.headers.get("idempotency-key"), 180);
  if (!key) {
    if (required) throw new ApiError(400, "idempotency_key_required", "Send an Idempotency-Key header for this write.");
    return null;
  }
  const actorKey = actor.uid ?? actor.email ?? "anonymous";
  const id = await digest(`${request.method}:${new URL(request.url).pathname}:${actorKey}:${key}`);
  const ref = db.collection("idempotencyKeys").doc(id);
  try {
    await ref.create({ requestId, actorKey, method: request.method, path: new URL(request.url).pathname, keyHash: await digest(key), state: "processing", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    return { id };
  } catch (reason) {
    const code = String((reason as { code?: unknown }).code ?? "");
    if (!code.includes("already-exists") && code !== "6") throw reason;
    const existing = await ref.get();
    const data = existing.data();
    if (data?.state === "completed" || data?.state === "failed") return { id, replay: apiJson(data.responseBody ?? {}, Number(data.responseStatus ?? 200), { "idempotent-replay": "true" }) };
    throw new ApiError(409, "request_in_progress", "A request with this idempotency key is already processing.");
  }
}

async function completeIdempotency(db: Firestore, lease: IdempotencyLease | null, response: Response) {
  if (!lease || lease.replay) return;
  let responseBody: unknown = {};
  try { responseBody = JSON.parse(await response.clone().text()); } catch { responseBody = {}; }
  await db.collection("idempotencyKeys").doc(lease.id).set({ state: "completed", responseStatus: response.status, responseBody, completedAt: new Date().toISOString() }, { merge: true });
}

async function failIdempotency(db: Firestore, lease: IdempotencyLease | null, response: Response) {
  if (!lease || lease.replay) return;
  let responseBody: unknown = {};
  try { responseBody = JSON.parse(await response.clone().text()); } catch { responseBody = {}; }
  await db.collection("idempotencyKeys").doc(lease.id).set({ state: "failed", responseStatus: response.status, responseBody, failedAt: new Date().toISOString() }, { merge: true });
}

async function writeAudit(db: Firestore, context: ApiContext, response: Response, durationMs: number, errorCode?: string) {
  const resource = context.segments.slice(0, 2).join("/") || "api";
  await db.collection("auditLogs").doc(context.requestId).set({
    requestId: context.requestId,
    actorUid: context.actor.uid,
    actorEmail: context.actor.email,
    actorRoles: context.actor.roles,
    authType: context.actor.authType,
    method: context.request.method,
    path: new URL(context.request.url).pathname,
    resource,
    status: response.status,
    outcome: response.ok ? "success" : "error",
    errorCode: errorCode ?? null,
    ipHash: context.ipHash,
    userAgent: cleanString(context.request.headers.get("user-agent"), 240),
    durationMs,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000),
  });
}

export async function secureApiRoute(request: Request, segments: string[], handler: (context: ApiContext) => Promise<Response>, options: SecurityOptions = {}) {
  const started = Date.now();
  const suppliedRequestId = cleanString(request.headers.get("x-request-id"), 80);
  const requestId = /^[a-zA-Z0-9_-]{8,80}$/.test(suppliedRequestId) ? suppliedRequestId : crypto.randomUUID();
  let context: ApiContext | null = null;
  let lease: IdempotencyLease | null = null;
  let rateLimitState: { limit: number; remaining: number; resetAt: string } | null = null;
  let errorCode: string | undefined;
  try {
    const admin = await getFirebaseAdmin();
    const actor = await resolveActor(request, admin, options.allowAnonymous);
    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("cf-connecting-ip") || "unknown";
    const ipHash = await digest(`${process.env.API_IP_HASH_SALT || "mwenza"}:${forwardedIp}`);
    context = { request, requestId, segments, actor, admin, ipHash };
    if (options.requireAppCheck && !await verifyApiAppCheck(request)) throw new ApiError(401, "app_check_failed", "App verification failed. Refresh and try again.");
    if (options.rateLimit) rateLimitState = await enforceRateLimit(admin.db, actor.uid ?? actor.email ?? ipHash, options.rateLimit);
    lease = ["GET", "HEAD"].includes(request.method) ? null : await acquireIdempotency(admin.db, request, actor, requestId, Boolean(options.requireIdempotency));
    if (lease?.replay) {
      lease.replay.headers.set("x-request-id", requestId);
      setRateLimitHeaders(lease.replay, rateLimitState);
      if (request.method !== "GET") {
        try { await writeAudit(admin.db, context, lease.replay, Date.now() - started); } catch (reason) { console.error("api_v1_audit_failed", { requestId, reason }); }
      }
      return lease.replay;
    }
    const response = await handler(context);
    await completeIdempotency(admin.db, lease, response);
    if (request.method !== "GET") {
      try { await writeAudit(admin.db, context, response, Date.now() - started); } catch (reason) { console.error("api_v1_audit_failed", { requestId, reason }); }
    }
    response.headers.set("x-request-id", requestId);
    setRateLimitHeaders(response, rateLimitState);
    return response;
  } catch (reason) {
    const error = reason instanceof ApiError ? reason : new ApiError(500, "internal_error", "The API could not complete this request.");
    errorCode = error.code;
    const response = apiJson({ error: { code: error.code, message: error.message, details: error.details }, requestId }, error.status, { "x-request-id": requestId });
    if (error.status === 429 && error.details && typeof error.details === "object") {
      const details = error.details as { limit?: number; remaining?: number; resetAt?: string };
      if (details.limit !== undefined && details.remaining !== undefined && details.resetAt) rateLimitState = { limit: details.limit, remaining: details.remaining, resetAt: details.resetAt };
    }
    setRateLimitHeaders(response, rateLimitState);
    if (context && request.method !== "GET") {
      try { await failIdempotency(context.admin.db, lease, response); } catch (idempotencyReason) { console.error("api_v1_idempotency_failure_record_failed", { requestId, reason: idempotencyReason }); }
      try { await writeAudit(context.admin.db, context, response, Date.now() - started, errorCode); } catch { /* Preserve the primary API error. */ }
    }
    if (!(reason instanceof ApiError)) console.error("api_v1_unhandled", { requestId, reason });
    return response;
  }
}

export async function markAuditEvent(db: Firestore, input: Record<string, unknown>) {
  await db.collection("auditLogs").add({ ...input, source: "system", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000) });
}
