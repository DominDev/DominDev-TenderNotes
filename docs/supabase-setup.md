# Supabase Setup

## GitHub Integration

Use these values in Supabase:

```text
GitHub Repository: DominDev/DominDev-TenderNotes
Working directory: backend
Deploy to production: on
Production branch name: main
```

Supabase will apply SQL files from:

```text
backend/supabase/migrations
```

## Frontend Config

Open Supabase:

```text
Project Settings -> API
```

Copy:

```text
Project URL
anon public key
```

Paste them into:

```text
frontend/js/config.js
```

Example:

```js
export const SUPABASE_CONFIG = {
  url: "https://your-project-ref.supabase.co",
  anonKey: "your-public-anon-key",
};
```

The anon key is intended for browser use. Access control is handled by Row Level Security policies.

## Authentication Settings

For the easiest first test, use Supabase Auth with email and password. If email confirmation is enabled, new users must confirm their email before signing in.

For GitHub Pages deployment, add the Pages URL in Supabase:

```text
Authentication -> URL Configuration -> Site URL
```

And add it to redirect URLs if email confirmation is used.

