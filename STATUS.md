# Project Status

## Current Version

**v0.3.0 — Menu intelligence and staff schedule**

## Current Website State

- Static Kasamatsu restaurant landing page
- Inline SVG umbrella pine logo
- Animated pine needle clusters on desktop hover
- Concept, full menu, location, reservation, assistant, and footer sections
- Reservation form now hands details to the assistant
- Chat assistant UI is live on the page
- `/api/chat` backend has been added for Vercel
- Supabase setup SQL has been added
- Assistant now handles normal weekday requests more naturally
- Assistant checks availability before asking for name and email
- Full menu with prices, dietary markers, and allergen information
- Privacy-aware assistant that cannot expose other guests' data
- Confirmation codes for successful reservations
- Password-protected live staff table schedule

## What Works After Deployment Setup

After Supabase and Vercel environment variables are configured, the assistant can:

- Answer basic Kasamatsu restaurant questions
- Ask for missing reservation details
- Check table availability
- Create reservations in Supabase
- Record special requests such as cakes, champagne, surprises, allergies, and preferred tables
- Prevent overlapping reservations on the same table
- Answer database-backed menu and allergy questions
- Show confirmed reservations on the staff floor plan

## Still Needed

- Run the updated `database/supabase-schema.sql` in Supabase
- Add `STAFF_DASHBOARD_PASSWORD` in Vercel
- Upload v0.3.0 to GitHub and wait for Vercel
- Test a live reservation and verify it on `/staff.html`

## Next Planned Version

**v0.4.0 — Staff booking management**

Planned focus:

- Manual booking edits
- Cancel or mark completed reservations
- Email notification to the restaurant team
- More detailed menu, policy, and location knowledge
