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

For GitHub Pages, the preferred setup is to place the values in GitHub Actions settings instead of editing the committed file:

```text
Repository -> Settings -> Secrets and variables -> Actions
```

Add a variable:

```text
SUPABASE_URL
```

Add a secret:

```text
SUPABASE_ANON_KEY
```

The Pages workflow injects these values into `frontend/js/config.js` during deployment.

## Authentication Settings

For the easiest first test, use Supabase Auth with email and password. If email confirmation is enabled, new users must confirm their email before signing in.

For GitHub Pages deployment, add the Pages URL in Supabase:

```text
Authentication -> URL Configuration -> Site URL
```

And add it to redirect URLs if email confirmation is used.
