# Project Status

## Current Version

**v0.2.0 — First practical AI booking assistant**

## Current Website State

- Static Kasamatsu restaurant landing page
- Inline SVG umbrella pine logo
- Animated pine needle clusters on desktop hover
- Concept, menu preview, location, reservation, assistant, and footer sections
- Reservation form now hands details to the assistant
- Chat assistant UI is live on the page
- `/api/chat` backend has been added for Vercel
- Supabase setup SQL has been added

## What Works After Deployment Setup

After Supabase and Vercel environment variables are configured, the assistant can:

- Answer basic Kasamatsu restaurant questions
- Ask for missing reservation details
- Check table availability
- Create reservations in Supabase
- Record special requests such as cakes, champagne, surprises, allergies, and preferred tables
- Prevent overlapping reservations on the same table

## Still Needed

- Create Supabase project
- Run `database/supabase-schema.sql`
- Add OpenAI and Supabase keys to Vercel
- Redeploy on Vercel
- Test live reservations

## Next Planned Version

**v0.3.0 — Staff booking dashboard**

Planned focus:

- Private staff view for daily bookings
- Manual booking edits
- Cancel or mark completed reservations
- Email notification to the restaurant team
- More detailed menu, policy, and location knowledge
