# Mwenza Kenya

Mwenza is a responsive services marketplace for Kenyan homes, businesses, government agencies, and institutions. Customers can book laundry, cleaning, cooking, fundi, mobile auto care, home support, pest control, and outdoor care from one platform.

## Product surfaces

- Residential, business, government, and institutional service marketplace
- Four-step booking flow tailored to each customer segment
- Eight service detail pages
- Business service-plan request and client workspace
- Government and institutional procurement enquiry flow
- Legal center with customer, provider, privacy, safety, accessibility, and public-sector terms
- Firebase email/password and Google account access with customer, provider, business, government, and operations roles
- Provider application and work workspace
- Jobs board with search, filters, and role detail pages
- Franchise opportunities and territory enquiries
- Internal operations workspace and service lifecycle APIs

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

Next.js, React, TypeScript, Vinext, Firebase Authentication, Firestore, Cloud Storage, App Check, Cloudflare Workers/D1, and Drizzle ORM.

## Firebase

The Firebase integration activates when the variables in `.env.example` are configured. Until then, the existing ChatGPT/D1 flows remain available. Setup, deployment, role bootstrap, and enforcement steps are in [docs/firebase-setup.md](docs/firebase-setup.md).

## Live site

[Mwenza on ChatGPT Sites](https://safi-laundry-kenya.bigafrica.chatgpt.site)
