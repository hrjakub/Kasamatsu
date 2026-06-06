# Upload This Folder Correctly

This folder is the corrected Kasamatsu upload package.

## What To Do

Open this folder:

```text
Kasamatsu-v0.2.1-upload
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
README.md
CHANGELOG.md
ROADMAP.md
STATUS.md
VERSION
UPLOAD_THIS.md
```

The important backend files must keep these paths:

```text
api/chat.js
database/supabase-schema.sql
assets/logo.png
```

## Do Not Upload Like This

Do not upload the whole folder as one nested folder:

```text
Kasamatsu-v0.2.1-upload/api/chat.js
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
