# Changelog

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
