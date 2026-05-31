# TenderNotes

TenderNotes is a mobile-first observation journal for 14 days of daily child wellbeing and behavior notes. The frontend is static HTML/CSS/vanilla JS. Supabase provides authentication, Postgres storage, and row-level access control.

## Architecture

```text
frontend/               Static app for GitHub Pages
backend/supabase/       Supabase migrations and optional seed data
docs/                   Setup and deployment notes
```

## Local Preview

From the repository root:

```powershell
python -m http.server 8080 -d frontend
```

Open:

```text
http://localhost:8080
```

The app needs `frontend/js/config.js` filled with your Supabase project URL and anon key before authentication and database calls can work.

## GitHub Pages

The repository works with GitHub Pages configured as:

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

The root `index.html` redirects to the static app in `frontend/`.

## Supabase GitHub Integration

In Supabase, use:

```text
GitHub Repository: DominDev/DominDev-TenderNotes
Working directory: backend
Production branch name: main
```

Supabase will look for migrations inside `backend/supabase/migrations`.
