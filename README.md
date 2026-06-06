# Kasamatsu

Private testing website for Instant Lead, featuring the Kasamatsu Japanese restaurant concept near Ramatuelle and Saint-Tropez.

## Current Version

**v0.3.0 — Menu intelligence and staff schedule**

This version connects the guest website, AI assistant, Supabase reservation database, and a separate staff schedule:

- Static Kasamatsu landing page
- Reservation form connected to the assistant flow
- AI-style booking assistant interface on the page
- Vercel backend endpoint at `/api/chat`
- OpenAI Responses API integration through a secure serverless function
- Supabase database schema for 10 restaurant tables and reservations
- Double-booking protection for overlapping reservations
- Better weekday handling for phrases like "Tuesday at 8pm"
- Availability is checked before asking for name and email
- Full menu with prices, dietary markers, and allergens
- Privacy rules preventing disclosure of other guests' booking data
- Reservation confirmation codes
- Password-protected staff floor plan and schedule at `/staff.html`
- Placeholder environment variable file for setup
- Correct root folders for GitHub: `api/`, `assets/`, and `database/`

No React, Next.js, npm install, or build step is required.

## How The Project Works

```text
index.html
```

Contains the restaurant landing page, concept, full menu, location block, reservation form, and booking assistant section.

```text
style.css
```

Controls the full visual design, responsive layout, reservation form, and assistant interface.

```text
script.js
```

Runs the logo animation, reservation form behavior, chat UI, quick prompts, and browser-to-backend calls.

```text
api/chat.js
```

Runs only on Vercel. It keeps the OpenAI API key and Supabase service key private, talks to OpenAI, and lets the AI call reservation tools.

```text
database/supabase-schema.sql
```

Creates the Supabase tables, seeds 10 restaurant tables and the menu, and adds functions for checking availability, creating reservations, searching the menu, and loading the protected staff schedule.

```text
staff.html, staff.css, staff.js
```

Runs the separate staff schedule interface. Staff data is loaded only after the correct Vercel staff password is supplied.

```text
api/staff.js
```

Checks the private staff password on Vercel and loads the live Supabase schedule.

```text
.env.example
```

Shows which environment variables are needed. Do not put real keys in GitHub.

## Step By Step Setup

### 1. Upload The Project To GitHub

Upload these files and folders to the root of the GitHub repository:

- `api/`
- `assets/`
- `database/`
- `index.html`
- `style.css`
- `script.js`
- `staff.html`
- `staff.css`
- `staff.js`
- `.env.example`
- `.gitignore`
- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `STATUS.md`
- `SETUP_v0.3.0.md`
- `UPLOAD_THIS.md`
- `VERSION`

Do not upload:

- `.DS_Store`
- `.env`
- `.env.local`
- Any file containing real secret keys

Your GitHub repository root must show the folders directly like this:

```text
api/chat.js
assets/logo.png
database/supabase-schema.sql
index.html
style.css
script.js
```

Do not upload the project as an extra nested folder like this:

```text
Kasamatsu/api/chat.js
Kasamatsu/index.html
```

### 2. Create A Supabase Project

1. Go to Supabase.
2. Create a new project.
3. Open the SQL Editor.
4. Paste everything from `database/supabase-schema.sql`.
5. Run the SQL.

This creates:

- 10 restaurant tables
- A reservations table
- A restaurant FAQ table
- A menu with prices, ingredients, allergens, and dietary labels
- Availability checking
- Reservation creation
- Confirmation codes
- A protected staff schedule function
- Double-booking protection

### 3. Get Supabase Keys

In Supabase, go to:

```text
Project Settings > API
```

Copy:

- Project URL
- Service role key

The service role key must only be used in Vercel environment variables. Never place it inside browser JavaScript.

### 4. Create An OpenAI API Key

Create an OpenAI API key from the OpenAI platform dashboard.

Keep it private. It belongs in Vercel, not in `script.js`.

### 5. Add Environment Variables In Vercel

In Vercel, open:

```text
Project > Settings > Environment Variables
```

Add:

```text
OPENAI_API_KEY
OPENAI_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESTAURANT_TIMEZONE
STAFF_DASHBOARD_PASSWORD
```

Suggested values:

```text
OPENAI_MODEL=gpt-4.1-mini
RESTAURANT_TIMEZONE=Europe/Paris
```

Set `STAFF_DASHBOARD_PASSWORD` to a long password that is not used anywhere else. Keep it private and enable it only for Production and Preview.

### 6. Redeploy On Vercel

After adding the environment variables:

1. Go to the Vercel Deployments tab.
2. Redeploy the latest GitHub commit.
3. Open the live website.

The assistant will not fully work from `file://` because `/api/chat` only exists after Vercel deploys the backend function.

### 7. Test The Assistant

Try:

- “Book a table for two tomorrow at 20:00.”
- “Can I request the most romantic table with champagne?”
- “Book four people Friday at 19:30 under Jakub, jakub@example.com.”
- “Which dishes are vegan and gluten-free?”
- “Does the miso black cod contain gluten?”
- Try booking the same table/time twice to confirm the database prevents overlap.

After a successful booking, confirm that the guest receives a confirmation code and open:

```text
https://kasamatsu.vercel.app/staff.html
```

Enter the staff password and verify the reservation appears on the selected date and table.

## Current Limitations

- No email or SMS confirmations yet.
- No payment/deposit flow yet.
- Opening hours and location are prototype values.
- The staff dashboard uses a shared password for this prototype. A production version should use individual staff accounts.
- The prototype staff password endpoint does not yet include persistent rate limiting.

## Next Build Direction

Next practical version:

- Manual reservation editing
- Cancel/change reservation flow
- Email notification to the restaurant team
- More detailed menu and policy knowledge
