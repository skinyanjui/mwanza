# Mwenza Firebase setup

## 1. Create and connect the project

1. Create a Firebase project and register a Web app.
2. Enable Authentication providers: **Email/Password** and **Google**.
3. Create Firestore in production mode and a Cloud Storage bucket in the same project.
4. Copy `.env.example` to each runtime environment and fill in the public Web app configuration.
5. Add the production and local development domains to Authentication’s authorized domains.

The browser SDK uses Firebase Authentication, direct Security Rules-protected reads/writes, Storage and App Check. The versioned HTTP API uses Firebase Admin and Firestore. All original `/api/*` compatibility routes now delegate to the same Firestore-backed `/api/v1` handlers; D1 is no longer an API data source.

## 2. Configure Firebase Admin

In Google-hosted environments, use Application Default Credentials. On Vercel or Sites, set one of these credential combinations:

- `FIREBASE_SERVICE_ACCOUNT_JSON` containing raw or base64-encoded service-account JSON; or
- `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` together.

Also set `FIREBASE_PROJECT_ID` and `FIREBASE_STORAGE_BUCKET`. Keep all Admin credentials server-only. Never prefix them with `NEXT_PUBLIC_`.

Grant the runtime service account only the Firebase/Google Cloud roles needed for Authentication token verification, Firestore and the selected Storage bucket. Rotate a service-account key immediately if it is ever committed or printed.

Leave `TRUST_CHATGPT_AUTH_HEADERS=false` on ordinary public hosts. Enable it only on a trusted host that removes caller-supplied `oai-authenticated-user-*` headers and injects verified identity headers itself. Firebase bearer tokens remain the default API identity mechanism.

## 3. Deploy the data model

Authenticate the Firebase CLI, select the intended project, then deploy the indexes and rules:

```bash
firebase use <firebase-project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The model uses these collections:

- `accounts`, `organizations`, and `organizations/{orgId}/members` — identity, tenancy and organization RBAC
- `bookings` and `serviceRecords` — service requests and append-only lifecycle history
- `applications`, `providerApplications`, `providerProfiles`, `providerVerifications`, and `availability` — employment/provider workflows
- `businessRequests`, `incidents`, and `notifications` — lead, support and in-app communication workflows
- `payments`, `invoices`, and `procurementRecords` — commerce and institutional records
- `files` and the corresponding Cloud Storage paths — authorized upload metadata
- `reviews`, `servicePricing`, and `addresses` — marketplace experience data
- `outboundWebhooks`, `webhookSecrets`, `webhookDeliveries`, and `inboundWebhookEvents` — integration delivery and deduplication
- `idempotencyKeys`, `rateLimits`, and `auditLogs` — API integrity and accountability

Admin API writes bypass Security Rules by design and are authorized in the API middleware. Direct browser access remains default-deny except for explicitly modeled owner, provider, Operations and organization-member flows.

### Deploy the optional Cloud Functions gateway

The repository includes the same API v1 router as a Node.js 22 HTTPS function in `functions/`. This is the recommended execution path for edge hosts that cannot load the Firebase Admin SDK directly.

```bash
firebase functions:secrets:set API_IP_HASH_SALT
firebase functions:secrets:set MPESA_CALLBACK_TOKEN
firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN
firebase functions:secrets:set WHATSAPP_APP_SECRET
firebase functions:secrets:set CRM_WEBHOOK_SECRET
firebase deploy --only functions:api
```

Set `FIREBASE_FUNCTIONS_API_URL` on the web host to the deployed `api` function URL. The site keeps its `/api/v1/*` URLs and securely forwards the original identity, App Check, idempotency and webhook verification headers to the function. Do not set this proxy variable inside the function itself.

## 4. Configure expiration policies

In Firestore’s **Time-to-live** settings, enable TTL on the `expiresAt` field for:

- `idempotencyKeys`
- `rateLimits`
- `auditLogs`

The API writes `expiresAt` as a Firestore timestamp. Idempotency responses expire after 24 hours, rate-limit buckets shortly after their window, and audit logs after 400 days. Adjust the audit retention period to match Mwenza’s legal and procurement policy before launch.

## 5. Bootstrap roles

Customer, business, and government roles are created through registration. Provider and Operations roles cannot be self-assigned.

To create the first Operations user:

1. Register that person normally in Mwenza.
2. In the Firebase console, open `accounts/{their-auth-uid}`.
3. Add `operations` to the `roles` array, keeping `customer`.

Operations can then approve signed-in provider applications. Approval adds the `provider` role and creates `providerProfiles/{uid}`. Provider verification is a separate document-based review flow.

## 6. Configure App Check

1. Create a reCAPTCHA Enterprise site key and register the Web app with Firebase App Check.
2. Set `NEXT_PUBLIC_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
3. Verify valid requests in App Check metrics before enforcement.
4. Enable enforcement for Authentication, Firestore and Storage in the Firebase console.
5. Set `FIREBASE_APP_CHECK_ENFORCED=true` for Mwenza’s custom write APIs after valid tokens are visible in production.

Use `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG=true` only in local development and register the emitted debug token. Never enable it in production.

## 7. Configure integrations

Set high-entropy secrets for:

- `API_IP_HASH_SALT`
- `MPESA_CALLBACK_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `CRM_WEBHOOK_SECRET`

Register the corresponding `/api/v1/webhooks/*` URLs with Safaricom Daraja, Meta WhatsApp and the chosen CRM. Configure Cloud Storage CORS for the production origins that will upload through resumable URLs. Do not allow wildcard origins for authenticated production uploads.

The API records failed outbound deliveries with a `nextAttemptAt` value. Before high-volume launch, connect a scheduled Cloud Function or task queue to retry those records with exponential backoff and a dead-letter policy.

## 8. Verify locally

The Emulator Suite tests cover role escalation, organization ownership and manager limits, managed-booking tenancy, provider state changes, append-only service records, the new marketplace collections, Storage access and default-deny behavior:

```bash
npm run test:firebase-rules
```

Firebase AI Logic is intentionally not installed or initialized. Add it only when an AI feature has a defined user need, data boundary and evaluation plan.
