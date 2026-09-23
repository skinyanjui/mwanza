const jsonBody = { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } } as const;
const success = { "200": { description: "Successful response", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, "400": { $ref: "#/components/responses/BadRequest" }, "401": { $ref: "#/components/responses/Unauthorized" }, "403": { $ref: "#/components/responses/Forbidden" }, "429": { $ref: "#/components/responses/RateLimited" }, "500": { $ref: "#/components/responses/ServerError" } } as const;
const idempotency = { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", maxLength: 180 }, description: "Unique key used to safely retry this write for 24 hours." } as const;
const organizationId = { name: "organizationId", in: "query", required: true, schema: { type: "string" } } as const;

function get(summary: string, parameters: unknown[] = [], publicAccess = false) {
  return { summary, parameters, security: publicAccess ? [] : [{ firebaseBearer: [] }], responses: success };
}

function write(summary: string, method: "post" | "patch" | "delete" = "post", requiresIdempotency = true, publicAccess = false) {
  return { [method]: { summary, security: publicAccess ? [{ firebaseAppCheck: [] }] : [{ firebaseBearer: [], firebaseAppCheck: [] }], parameters: requiresIdempotency ? [idempotency] : [], requestBody: jsonBody, responses: { ...success, "201": success["200"] } } };
}

export const openApiSpecification = {
  openapi: "3.1.0",
  info: { title: "Mwenza API", version: "1.0.0", description: "Firebase-first API for Mwenza customer, provider, business, government and operations workflows." },
  servers: [{ url: "/api/v1", description: "Current deployment" }],
  tags: ["Accounts", "Bookings", "Organizations", "Commerce", "Providers", "Operations", "Files", "Webhooks"].map(name => ({ name })),
  paths: {
    "/account-profile": { get: get("Get the current account profile"), ...write("Create or update the current account profile", "post", false) },
    "/applications": { get: get("List applications for Operations"), ...write("Submit a job, provider or franchise application", "post", true, true) },
    "/bookings": { get: get("List bookings visible to the current actor"), ...write("Create a booking", "post", true, true), ...write("Reschedule, cancel or administratively update a booking", "patch") },
    "/business-requests": { get: get("List business and institutional leads"), ...write("Create a business or institutional service request", "post", true, true) },
    "/incidents": { get: get("List service incidents"), ...write("Report a service incident"), ...write("Update incident resolution", "patch") },
    "/notifications": { get: get("List account notifications"), ...write("Mark notifications read", "patch", false) },
    "/operations": { get: get("Get the Operations work queue"), ...write("Run an Operations action", "patch") },
    "/audit-logs": { get: get("List recent structured audit logs for Operations") },
    "/provider-work": { get: get("Get provider assignments and suitable work"), ...write("Change availability or booking state", "patch") },
    "/payments": { get: get("List payments"), ...write("Create a payment intent"), ...write("Update a payment lifecycle", "patch") },
    "/invoices": { get: get("List organization invoices", [organizationId]), ...write("Create an invoice"), ...write("Update an invoice", "patch") },
    "/procurement-records": { get: get("List organization procurement records", [organizationId]), ...write("Create a procurement record"), ...write("Update a procurement record", "patch") },
    "/reviews": { get: get("List published reviews", [], true), ...write("Submit a completed-booking review"), ...write("Moderate a review", "patch") },
    "/service-pricing": { get: get("List active service pricing", [], true), ...write("Create a pricing record"), ...write("Update a pricing record", "patch") },
    "/provider-verifications": { get: get("Get provider verification"), ...write("Submit provider verification"), ...write("Review provider verification", "patch") },
    "/availability": { get: get("Get provider availability"), ...write("Update provider availability", "patch", false) },
    "/addresses": { get: get("List saved addresses"), ...write("Create an address"), ...write("Update an address", "patch"), ...write("Delete an address", "delete") },
    "/files": { get: get("List authorized file metadata"), ...write("Confirm an uploaded file", "patch"), ...write("Delete a file", "delete") },
    "/files/upload-session": { ...write("Create a resumable Cloud Storage upload session") },
    "/organizations/{organizationId}/members": { parameters: [{ name: "organizationId", in: "path", required: true, schema: { type: "string" } }], get: get("List organization members"), ...write("Add an organization member"), ...write("Change an organization member role", "patch"), ...write("Remove an organization member", "delete") },
    "/outbound-webhooks": { get: get("List organization webhook subscriptions", [organizationId]), ...write("Create or rotate a webhook subscription"), ...write("Update a webhook subscription", "patch"), ...write("Delete a webhook subscription", "delete") },
    "/outbound-webhooks/deliveries": { get: get("List recent organization webhook deliveries", [organizationId]) },
    "/webhooks/mpesa": { post: { summary: "Receive an authenticated M-Pesa callback", security: [{ mpesaWebhookSecret: [] }], requestBody: jsonBody, responses: success } },
    "/webhooks/whatsapp": { get: { summary: "Verify a WhatsApp webhook subscription", security: [], responses: success }, post: { summary: "Receive a signed WhatsApp event", security: [{ whatsappSignature: [] }], requestBody: jsonBody, responses: success } },
    "/webhooks/crm": { post: { summary: "Receive a signed CRM event", security: [{ crmSignature: [] }], requestBody: jsonBody, responses: success } },
  },
  components: {
    securitySchemes: {
      firebaseBearer: { type: "http", scheme: "bearer", bearerFormat: "Firebase ID token" },
      firebaseAppCheck: { type: "apiKey", in: "header", name: "X-Firebase-AppCheck" },
      mpesaWebhookSecret: { type: "apiKey", in: "header", name: "X-Mwenza-Webhook-Secret" },
      whatsappSignature: { type: "apiKey", in: "header", name: "X-Hub-Signature-256" },
      crmSignature: { type: "apiKey", in: "header", name: "X-Mwenza-Signature" },
    },
    responses: {
      BadRequest: { description: "Invalid request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Unauthorized: { description: "Authentication or App Check failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Forbidden: { description: "Role or organization authorization failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      RateLimited: { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      ServerError: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
    },
    schemas: { Error: { type: "object", required: ["error", "requestId"], properties: { error: { type: "object", required: ["code", "message"], properties: { code: { type: "string" }, message: { type: "string" }, details: {} } }, requestId: { type: "string", format: "uuid" } } } },
  },
} as const;
