# Upload This Folder Correctly

This folder is the corrected Kasamatsu upload package.

## What To Do

Open the latest v0.4.0 upload folder:

```text
Kasamatsu-v0.4.0-upload
```

Select everything inside it and upload those items to the root of your GitHub repository.

The GitHub root should show:

```text
api/
assets/
database/
index.html
style.css
script.js
staff.html
staff.css
staff.js
README.md
CHANGELOG.md
ROADMAP.md
STATUS.md
SETUP_v0.4.0.md
VERSION
UPLOAD_THIS.md
.env.example
.gitignore
```

The important backend files must keep these paths:

```text
api/chat.js
api/staff.js
database/supabase-schema.sql
database/fix-v0.4.0-calendar.sql
database/verify-v0.4.0.sql
assets/logo.png
staff.html
staff.css
staff.js
```

## Do Not Upload Like This

Do not upload the whole folder as one nested folder:

```text
Kasamatsu-v0.4.0-upload/api/chat.js
```

Vercel needs:

```text
api/chat.js
```

at the root.

## After Uploading

1. Commit the GitHub upload.
2. Wait for Vercel to deploy.
3. Open:

```text
https://kasamatsu.vercel.app/api/chat
```

Expected result:

```text
Use POST for the booking assistant.
```

If you see that, the API route exists.

Then test the chatbot on:

```text
https://kasamatsu.vercel.app
```

Finally, test the protected staff schedule on:

```text
https://kasamatsu.vercel.app/staff.html
```
