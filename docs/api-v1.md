# Mwenza API v1

The canonical API is available under `/api/v1`. The machine-readable OpenAPI 3.1 specification is served at `/api/v1/openapi`. The original unversioned application routes remain as compatibility aliases and now use the same Firestore handlers.

## Request security

- Send `Authorization: Bearer <Firebase ID token>` for account, provider, organization, commerce and Operations routes.
- Send `X-Firebase-AppCheck: <token>` for browser-originated writes when App Check enforcement is enabled.
- Send a unique `Idempotency-Key` for create, workflow and privileged mutations. A completed response can be replayed for 24 hours.
- Every response includes `X-Request-Id`. Mutations create a structured, append-only audit record with actor, route, outcome, latency and a salted IP hash.
- Fixed-window limits are enforced per authenticated actor or salted IP. Responses expose `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`; rejected requests return `429`.

Error responses use this shape:

```json
{
  "error": {
    "code": "organization_access_denied",
    "message": "You do not have the required organization access."
  },
  "requestId": "01H..."
}
```

## Resources

| Route | Methods | Intended integrations |
| --- | --- | --- |
| `/account-profile` | GET, POST | Customer profile and role-aware onboarding |
| `/applications` | GET, POST | Careers, provider onboarding, franchise CRM |
| `/bookings` | GET, POST, PATCH | Web/mobile booking, business and government service requests |
| `/business-requests` | GET, POST | CRM lead capture and institutional quoting |
| `/incidents` | GET, POST, PATCH | Support desk, service recovery and safety workflows |
| `/notifications` | GET, PATCH | In-app inbox and read state |
| `/operations` | GET, PATCH | Assignment, provider approval, lead and booking operations |
| `/audit-logs` | GET | Operations security, support and compliance review |
| `/provider-work` | GET, PATCH | Provider workspace, assignment acceptance and job status |
| `/payments` | GET, POST, PATCH | M-Pesa, card processor, invoice and cash reconciliation adapters |
| `/invoices` | GET, POST, PATCH | Accounting, ERP and organization billing |
| `/procurement-records` | GET, POST, PATCH | Government procurement, tenders and institutional records |
| `/files/upload-session` | POST | Resumable Cloud Storage uploads |
| `/files` | GET, PATCH, DELETE | Upload confirmation, metadata listing and authorized deletion |
| `/reviews` | GET, POST, PATCH | Published ratings and Operations moderation |
| `/provider-verifications` | GET, POST, PATCH | Identity/document verification providers and Operations review |
| `/organizations/{organizationId}/members` | GET, POST, PATCH, DELETE | Business/government team access and RBAC |
| `/service-pricing` | GET, POST, PATCH | Public catalog pricing and Operations-managed rate cards |
| `/availability` | GET, PATCH | Provider scheduling and service-area availability |
| `/addresses` | GET, POST, PATCH, DELETE | Customer and organization service locations |
| `/outbound-webhooks` | GET, POST, PATCH, DELETE | Organization webhook subscriptions and secret rotation |
| `/outbound-webhooks/deliveries` | GET | Delivery status, response codes and retry inspection |

Organization IDs are required for organization-scoped invoices, procurement, members, addresses and outbound webhook subscriptions. The API verifies the caller’s membership on every request; client-supplied organization claims are never trusted by themselves.

The payments API accepts processor references or tokens through an integration adapter. It rejects raw card numbers, expiry values and security codes; those must remain inside a PCI-compliant payment provider.

## File upload flow

1. `POST /api/v1/files/upload-session` with `kind`, `fileName`, `contentType`, `size`, and the required `entityId`.
2. Upload the file bytes with `PUT` to the returned resumable Cloud Storage URL and the returned content-type header.
3. `PATCH /api/v1/files` with the file `id`. Mwenza checks the Storage object and changes the metadata status to `Uploaded`.

Supported kinds are `profile`, `provider`, `job`, `invoice`, and `procurement`. Job photos accept images up to 20 MB; other managed documents accept images, PDF and common Word formats up to 10 MB.

## Inbound webhooks

| Route | Verification | Purpose |
| --- | --- | --- |
| `POST /api/v1/webhooks/mpesa` | `X-Mwenza-Webhook-Secret` or a protected callback token | Deduplicates callbacks and reconciles payment records |
| `GET /api/v1/webhooks/whatsapp` | Meta verification token and challenge | Registers the callback URL |
| `POST /api/v1/webhooks/whatsapp` | `X-Hub-Signature-256` HMAC | Stores message and status events idempotently |
| `POST /api/v1/webhooks/crm` | `X-Mwenza-Signature` HMAC | Stores CRM events and applies supported lead updates |

Inbound event IDs are persisted before processing so provider retries are acknowledged without duplicating work.

## Outbound webhooks

Organization owners and managers can register public HTTPS endpoints and select event types. The signing secret is returned only when the subscription is created or explicitly rotated. Deliveries include:

- `X-Mwenza-Event`
- `X-Mwenza-Event-Id`
- `X-Mwenza-Signature: sha256=<hex digest>`

The signature is an HMAC-SHA256 of the exact request body. Delivery attempts and bounded response details are recorded in `webhookDeliveries` for Operations visibility. Organization data is delivered only to subscriptions owned by that same organization.

## Server configuration

Firebase Admin uses Application Default Credentials in Google-hosted environments. On Vercel or Sites, configure `FIREBASE_SERVICE_ACCOUNT_JSON` as raw or base64-encoded service-account JSON, or configure `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` separately. Also configure the Firebase project and Storage bucket values in `.env.example`.

For an edge host, deploy the included Firebase HTTPS function and set `FIREBASE_FUNCTIONS_API_URL` to its public function URL. The application keeps the same `/api/v1` contract and proxies it to the Node.js function where Firebase Admin runs with Application Default Credentials.

Webhook verification uses `MPESA_CALLBACK_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, and `CRM_WEBHOOK_SECRET`. Set a high-entropy `API_IP_HASH_SALT` before production traffic.
