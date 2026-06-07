# Kasamatsu v0.4.0 Setup

## 1. Update Supabase First

1. Open Supabase.
2. Open the SQL Editor.
3. Create a new query.
4. Paste all contents of `database/supabase-schema.sql`.
5. Click **Run**.

If Supabase previously showed an error while running the v0.4.0 schema, run the
complete corrected schema again. A failed schema run can roll back the
waiting-list table and the other v0.4.0 database additions.

After it succeeds, run `database/verify-v0.4.0.sql`. It should show the
waiting-list table and protected functions as installed, followed by calendar
rows for the next seven days.

This keeps existing reservations and adds:

- Waiting-list entries
- Reservation check-in timestamps and operational statuses
- Monthly staff calendar data
- Protected staff actions for check-in, completion, no-show, and waiting-list assignment

## 2. Upload The Website Files To GitHub

Upload everything inside the v0.4.0 upload folder to the root of the Kasamatsu GitHub repository.

The most important changed files are:

```text
api/chat.js
api/staff.js
database/supabase-schema.sql
staff.html
staff.css
staff.js
README.md
CHANGELOG.md
ROADMAP.md
STATUS.md
VERSION
```

Do not upload `.env`, `.env.local`, real API keys, or passwords.

## 3. Verify The Staff Password

In Vercel Environment Variables, confirm that `STAFF_DASHBOARD_PASSWORD` exists for Production and Preview. Use a long private password.

## 4. Wait For Vercel

The GitHub commit should trigger a Vercel deployment. No new environment variables are required if v0.3.0 was already working.

## 5. Test The Guest Waiting List

Ask for a preferred table or area that is unavailable. The assistant should:

1. Clearly say the preference is unavailable.
2. Offer a suitable alternative when one exists.
3. Offer the optional waiting list for the original preference.
4. Add the guest only after they explicitly agree and provide name and email.

## 6. Test Staff Operations

Open:

```text
https://kasamatsu.vercel.app/staff.html
```

Test:

- **Day**: reservations and free starts per table
- **Calendar**: monthly bookings by date and table
- **Live floor**: check in a guest and confirm elapsed/remaining time appears
- **Waiting list**: mark the original booking as no-show, then assign the newly free table to the first guest waiting for that table or area
