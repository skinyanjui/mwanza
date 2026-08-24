# Mwenza Firebase setup

## 1. Create and connect the project

1. Create a Firebase project and register a Web app.
2. Enable Authentication providers: **Email/Password** and **Google**.
3. Create Firestore in production mode and a Cloud Storage bucket in the same project.
4. Copy `.env.example` to the environment used by Sites and fill in the Web app configuration, project ID, numeric project number, and Web app ID.
5. Add the production domain and local development domains to Authentication’s authorized domains.

The app stays on its existing ChatGPT/D1 identity and data paths when the public Firebase variables are absent.

## 2. Deploy the data model

Authenticate the Firebase CLI, select the intended project, then deploy the indexes and rules:

```bash
firebase use <firebase-project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The included model uses these collections and paths:

- `accounts/{uid}` — identity profile, account type, roles, and organization references
- `organizations/{orgId}` and `organizations/{orgId}/members/{uid}` — business/government tenancy
- `bookings/{bookingId}` — customer and organization service requests
- `providerApplications/{applicationId}` and `providerProfiles/{uid}` — provider approval and work access
- `serviceRecords/{recordId}` — append-only booking lifecycle events
- `profiles/{uid}/...` — private profile documents
- `providers/{uid}/...` — private provider documents
- `bookings/{bookingId}/jobs/...` — job photos
- `organizations/{orgId}/invoices/...` — operations-issued invoices
- `organizations/{orgId}/procurement/...` — organization procurement files

## 3. Bootstrap roles

Customer, business, and government roles are created through registration. Provider and operations roles cannot be self-assigned.

To create the first operations user:

1. Register that person normally in Mwenza.
2. In the Firebase console, open `accounts/{their-auth-uid}`.
3. Add `operations` to the `roles` array, keeping `customer`.

An operations user can then approve signed-in provider applications. Approval adds the `provider` role and creates `providerProfiles/{uid}`. Future self-service profile edits preserve privileged roles but cannot add or remove them.

## 4. Turn on App Check safely

1. Create a reCAPTCHA Enterprise site key and register the Web app with Firebase App Check.
2. Set `NEXT_PUBLIC_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
3. Verify valid requests in App Check metrics before enforcement.
4. Enable enforcement for Authentication, Firestore, and Storage in the Firebase console.
5. Set `FIREBASE_APP_CHECK_ENFORCED=true` for Mwenza’s custom write APIs after valid tokens are visible in production.

Use `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG=true` only in local development and register the emitted debug token. Never enable it in production.

## 5. Verify locally

The Emulator Suite test covers role escalation, organization ownership and manager limits, managed-booking tenancy, ordered provider status changes, append-only service records, booking photo access, document-type checks, and default-deny behavior:

```bash
npm run test:firebase-rules
```

Firebase AI Logic is intentionally not installed or initialized. Add it only when an AI feature has a defined user need, data boundary, and evaluation plan.
