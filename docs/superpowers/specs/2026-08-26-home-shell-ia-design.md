# Home shell IA rethink — design

**Date:** 2026-08-26  
**Status:** Approved to build (user: Approach C, Dedicated Home shell, Book-first hero; booking path default **B · lite detail → book**)

## Goal

Make the residential booking journey the default product surface. Remove Home / Business / Government as peer decisions on Home screens so bookers face fewer choices.

## Decisions

1. **Dedicated Home shell** — `/` and Home service/booking/account chrome are residential-only. Business and Government stay on `/business` and `/government`, linked quietly (footer / mega secondary), not in primary nav.
2. **Book-first hero** — First viewport: brand, headline, one supporting line, one primary CTA to `/book`. Service catalog starts below the fold. No audience toggle or inline 8-service picker in the hero.
3. **Lite detail → book** — Home service pages keep options + primary book CTA; trust / how-it-works / FAQ collapse or shorten. Segment tabs removed on Home detail (Business/Gov reached via their hubs).
4. **Booking wizard** — Default customer type Home. Hide audience selector unless `audience=business|government` (or user is already on a managed path).
5. **Account (Home)** — Nav: Bookings, Updates, Account, Support. Hide empty Addresses/Payments until they have data. Overview folds into Bookings.

## Out of scope (this pass)

- Redesigning Business/Government page length
- Provider / jobs / franchise IA beyond quieter entry points
- Visual rebrand beyond Geist tokens already in use

## Success criteria

- Homepage HTML has no hero audience radiogroup / “Book Laundry” picker bar
- Primary nav has no standalone Business / Government links
- Home booking step 1 has no audience selector by default
- Home service detail has no segment tab switcher
- Existing residential booking still completes through `/book`
