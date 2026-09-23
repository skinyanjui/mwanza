# Mwenza Kenya

Mwenza is a responsive services marketplace for Kenyan homes, businesses, government agencies, and institutions. Customers can book laundry, cleaning, cooking, fundi, mobile auto care, home support, pest control, and outdoor care from one platform.

## Product surfaces

- Residential, business, government, and institutional service marketplace
- Four-step booking flow tailored to each customer segment
- Segment-specific detail pages across eight services for home, business, and government
- Business service-plan request and multi-organization client workspace
- Government procurement enquiry and institutional workspace
- Legal center with customer, provider, privacy, safety, accessibility, and public-sector terms
- Firebase email/password and Google account access with customer, provider, business, government, and operations roles
- Role-scoped invoice, procurement, profile, provider, and job-photo vaults
- Provider application and work workspace
- Jobs board with search, filters, and role detail pages
- Franchise opportunities and territory enquiries
- Internal operations workspace and service lifecycle APIs
- Firebase-first `/api/v1` platform with an OpenAPI 3.1 contract, idempotent writes, rate limits, audit logs, and M-Pesa/WhatsApp/CRM webhooks
- Payments, invoices, procurement, managed uploads, reviews, verification, member RBAC, pricing, availability, addresses, and outbound webhook APIs

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Quality checks:

```bash
npm run lint
npm test
npm run test:firebase-rules
```

## Stack

Next.js, React, TypeScript, Vinext, Firebase Authentication, Firebase Admin, Firestore, Cloud Storage, App Check, and Cloudflare Workers.

## Firebase

The Firebase integration activates when the variables in `.env.example` are configured. Browser data flows use Firebase Security Rules; versioned and compatibility HTTP APIs use Firebase Admin with role- and organization-level authorization. Setup, deployment, role bootstrap, TTL, webhook and enforcement steps are in [docs/firebase-setup.md](docs/firebase-setup.md). The API catalog and integration contract are in [docs/api-v1.md](docs/api-v1.md).

## Live site

[Mwenza on ChatGPT Sites](https://safi-laundry-kenya.bigafrica.chatgpt.site)
