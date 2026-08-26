import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("legacy HTTP routes delegate to the Firestore v1 router", () => {
  const resources = ["account-profile", "applications", "bookings", "business-requests", "incidents", "notifications", "operations", "provider-work"];
  for (const resource of resources) {
    const source = read(`app/api/${resource}/route.ts`);
    assert.match(source, /routeLegacy/);
    assert.doesNotMatch(source, /drizzle|D1Database|getDb\(/);
  }
});

test("API v1 exposes every required business surface", () => {
  const source = read("app/api/v1/_lib/openapi.ts");
  for (const path of [
    "/payments", "/invoices", "/procurement-records", "/files/upload-session", "/reviews",
    "/provider-verifications", "/organizations/{organizationId}/members", "/service-pricing",
    "/availability", "/addresses", "/outbound-webhooks", "/outbound-webhooks/deliveries", "/webhooks/mpesa",
    "/webhooks/whatsapp", "/webhooks/crm",
  ]) assert.ok(source.includes(`\"${path}\"`), `missing OpenAPI path ${path}`);
});

test("API middleware contains abuse and accountability controls", () => {
  const security = read("app/api/v1/_lib/security.ts");
  assert.match(security, /idempotencyKeys/);
  assert.match(security, /rateLimits/);
  assert.match(security, /auditLogs/);
  assert.match(security, /verifyApiAppCheck/);
  assert.match(security, /verifyIdToken/);
  assert.match(security, /expiresAt: new Date/);
});

test("Firebase AI Logic remains intentionally absent", () => {
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.dependencies?.["@firebase/ai"], undefined);
  assert.doesNotMatch(read("app/lib/firebase-client.ts"), /getAI|firebase\/ai/);
});

test("Cloud Functions and edge proxy share the same v1 router", () => {
  assert.match(read("functions/src/index.ts"), /routeV1/);
  assert.match(read("app/api/v1/_lib/router.ts"), /FIREBASE_FUNCTIONS_API_URL/);
  assert.match(read("firebase.json"), /functions/);
});
