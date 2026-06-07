# Project Status

## Current Version

**v0.4.0 — Staff operations and waiting list**

## Current Website State

- Static Kasamatsu restaurant landing page
- Inline SVG umbrella pine logo
- Animated pine needle clusters on desktop hover
- Concept, full menu, location, reservation, assistant, and footer sections
- All reservation calls to action now lead directly to the assistant
- Chat assistant UI is live on the page
- `/api/chat` backend has been added for Vercel
- Supabase setup SQL has been added
- Assistant now handles normal weekday requests more naturally
- Assistant checks availability immediately once date, time, and party size are known
- Assistant cannot claim a preferred table or zone is available before a matching live database result
- Full menu with prices, dietary markers, and allergen information
- Privacy-aware assistant that cannot expose other guests' data
- Confirmation codes for successful reservations
- Password-protected live staff table schedule
- Day, monthly calendar, live floor, and waiting-list staff modes
- Staff check-in, complete, and no-show actions
- Preferred-table waiting list with protected, first-in-line staff assignment

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
- Show free booking starts for every table
- Show bookings by table in a monthly calendar
- Track seated and overtime tables on a top-down floor plan
- Offer and create a preferred-table waiting-list request

## Still Needed

- Run the updated v0.4.0 `database/supabase-schema.sql` in Supabase
- Upload v0.4.0 to GitHub and wait for Vercel
- Test a reservation, waiting-list request, no-show, and staff table assignment

## Next Planned Version

**v0.5.0 — Notifications and stronger staff authentication**

Planned focus:

- Manual booking edits
- Manual reservation edits and cancellation
- Email notification to the restaurant team
- More detailed menu, policy, and location knowledge
