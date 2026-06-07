# Changelog

## v0.4.0 — 2026-06-07

Staff operations dashboard and preferred-table waiting list.

### Added

- Day mode with reservations and every available two-hour start for each table
- Outlook-style monthly calendar showing bookings, guests, tables, and waiting-list totals
- Live top-down restaurant view showing free, upcoming, seated, and overtime tables
- Staff check-in, complete, and no-show actions
- Database-backed preferred-table waiting list
- Staff controls to notify, remove, or assign a genuinely free table to a waiting guest
- First-in-line assignment enforcement for each requested table or area
- Guest assistant waiting-list tool when a preferred table or area is unavailable

### Changed

- Availability results now distinguish requested preferences from alternative tables
- A guest can hold an alternative reservation while waiting for their preferred table
- Staff schedule API now supports calendar loading and protected operational actions

### Fixed

- Staff calendar database query now aggregates reservation and waiting-list totals separately

## v0.3.1 — 2026-06-07

Availability-first booking flow.

### Changed

- The assistant now asks only for the missing party size when a guest initially provides a date and time.
- Live availability is checked immediately once date, time, and party size are known.
- The assistant cannot claim that a time, table, terrace, or preferred zone is available before receiving a matching live availability result.
- Guest names and email addresses are requested only after availability has been clearly confirmed.

## v0.3.0 — 2026-06-06

Menu intelligence, guest privacy, confirmation codes, and staff dashboard.

### Added

- Full guest-facing Japanese dinner menu with prices, dietary markers, and allergens
- Database-backed menu search for AI menu and allergy questions
- Reservation confirmation codes returned only after a successful database booking
- Password-protected staff schedule at `/staff.html`
- Live ten-table floor plan and daily reservation list for staff

### Changed

- Guest assistant responses are shorter and ask only one follow-up question
- Guest assistant can check live availability but cannot reveal other guests' booking data
- Guest-facing technical error messages no longer mention OpenAI, Supabase, keys, or environment variables
- Public database functions are restricted to the server-side service role
- Database schema can be safely rerun when the existing overlap-protection constraint is already present
- Empty allergen lists now use an explicit PostgreSQL text-array type

## v0.2.3 — 2026-06-06

Booking assistant conversation polish.

### Changed

- Added restaurant timezone calendar context to the assistant prompt.
- Improved weekday handling so phrases like "Tuesday at 8pm" are resolved instead of asking for the exact date again.
- Changed the booking flow so the assistant checks availability before asking for guest name and email.

## v0.2.2 — 2026-06-06

Supabase permission fix for live booking availability checks.

### Changed

- Updated the availability lookup function to run with the safe server-side database permissions it needs.
- Added explicit execute grants for the reservation helper functions used by the Vercel API route.

## v0.2.1 — 2026-06-06

GitHub upload structure helper version.

### Added

- Clean upload package with `api/`, `assets/`, and `database/` kept as root folders
- Upload instructions for avoiding flattened files on GitHub

### Changed

- Version marker updated so the corrected upload structure can be identified in GitHub and Vercel

## v0.2.0 — 2026-06-04

First practical AI booking assistant version.

### Added

- AI booking assistant section on the Kasamatsu page
- Reservation form now opens the assistant with the guest request
- Chat UI with suggested prompts for table booking and special occasions
- Vercel serverless endpoint at `/api/chat`
- OpenAI Responses API integration through the backend
- Supabase schema for 10 restaurant tables and reservations
- Database functions for checking availability and creating reservations
- Overlap protection to prevent double-booking the same table
- `.env.example` with required Vercel environment variables

### Changed

- Reservation form now asks for time and phone
- Reservation button changed from local success behavior to assistant handoff
- README now includes full setup steps for GitHub, Supabase, OpenAI, and Vercel

### Not Included Yet

- Staff dashboard
- Email or SMS confirmation
- Reservation cancellation flow
- Final public restaurant address and operating details

## v0.1.1 — 2026-06-03

Hero design correction after first Vercel preview.

### Changed

- Replaced the fragile PNG-based hero logo with an inline SVG umbrella pine mark
- Removed the broken image behavior seen on the deployed site
- Made the tree feel more complete with still trunk/branch strokes and animated needle clusters
- Tightened hero spacing and added a simple top navigation
- Updated hero copy to position this as an Instant Lead private test website

## v0.1.0 — 2026-06-03

Initial private testing version.

### Added

- Static Kasamatsu landing page
- Premium Japanese-Mediterranean visual direction
- Logo-centered hero section
- Subtle animated pine-needle SVG overlay
- Concept section
- Menu preview cards
- Location block
- Reservation request form with local success message
- Footer with English and Japanese restaurant name
- Project documentation for GitHub

### Not Included Yet

- Real reservation handling
- AI chatbot
- Database or lead storage
- Email notifications
- Public production launch
