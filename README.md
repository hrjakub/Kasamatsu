# Kasamatsu

Private testing website for Instant Lead, featuring the Kasamatsu Japanese restaurant concept near Ramatuelle and Saint-Tropez.

## Current Version

**v0.2.0 — First practical AI booking assistant**

This version adds the first real infrastructure for an AI restaurant reservation assistant:

- Static Kasamatsu landing page
- Reservation form connected to the assistant flow
- AI-style booking assistant interface on the page
- Vercel backend endpoint at `/api/chat`
- OpenAI Responses API integration through a secure serverless function
- Supabase database schema for 10 restaurant tables and reservations
- Double-booking protection for overlapping reservations
- Placeholder environment variable file for setup

No React, Next.js, npm install, or build step is required.

## How The Project Works

```text
index.html
```

Contains the restaurant landing page, concept, menu preview, location block, reservation form, and booking assistant section.

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

Creates the Supabase tables, seeds 10 restaurant tables, and adds functions for checking availability and creating reservations.

```text
.env.example
```

Shows which environment variables are needed. Do not put real keys in GitHub.

## Step By Step Setup

### 1. Upload The Project To GitHub

Upload these files and folders to the root of the GitHub repository:

- `index.html`
- `style.css`
- `script.js`
- `api/chat.js`
- `database/supabase-schema.sql`
- `.env.example`
- `.gitignore`
- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `STATUS.md`
- `VERSION`
- `assets/logo.png`

Do not upload:

- `.DS_Store`
- `.env`
- `.env.local`
- Any file containing real secret keys

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
- Availability checking
- Reservation creation
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
```

Suggested values:

```text
OPENAI_MODEL=gpt-4.1-mini
RESTAURANT_TIMEZONE=Europe/Paris
```

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
- Try booking the same table/time twice to confirm the database prevents overlap.

## Current Limitations

- No staff dashboard yet.
- No email or SMS confirmations yet.
- No payment/deposit flow yet.
- Opening hours and location are prototype values.
- The assistant creates reservations in Supabase, but restaurant staff still need a future dashboard to review them comfortably.

## Next Build Direction

Next practical version:

- Staff dashboard for today’s bookings
- Manual reservation editing
- Cancel/change reservation flow
- Email notification to the restaurant team
- More detailed menu and policy knowledge
