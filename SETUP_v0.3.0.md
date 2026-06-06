# Kasamatsu v0.3.0 Setup

## 1. Update Supabase

1. Open Supabase.
2. Open the SQL Editor.
3. Create a new query.
4. Paste all contents of `database/supabase-schema.sql`.
5. Click Run.

This update is designed to keep existing reservations. It adds the menu, confirmation codes, privacy restrictions, and the staff schedule function.

## 2. Add The Staff Password In Vercel

Open:

```text
Vercel > Kasamatsu > Settings > Environment Variables
```

Add:

```text
Key: STAFF_DASHBOARD_PASSWORD
Value: a long private password
Sensitive: ON
Environment: Production and Preview
```

Do not put this password in GitHub or any website file.

## 3. Upload To GitHub

Open `Kasamatsu-v0.3.0-upload` and upload everything inside it to the root of the Kasamatsu GitHub repository.

Do not upload `.DS_Store`, `.env`, or real keys.

## 4. Wait For Vercel

The GitHub upload should trigger a new Vercel deployment.

## 5. Test The Guest Assistant

Try:

```text
Do you have a table for 3 this Tuesday at 8pm?
```

Then provide a name and email. A successful booking should return a confirmation code.

Try:

```text
Which dishes are vegan and gluten-free?
Does the miso black cod contain gluten?
How many bookings do you have next week?
```

The final question must be refused politely because other guests' booking information is private.

## 6. Verify The Reservation As Staff

Open:

```text
https://kasamatsu.vercel.app/staff.html
```

Enter the staff password, choose the reservation date, and verify that the table, time, guest, and confirmation code appear.
