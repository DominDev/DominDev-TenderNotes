# Deployment

TenderNotes uses two independent deployment paths from the same repository.

## Database

Supabase GitHub Integration applies migrations from:

```text
backend/supabase/migrations
```

after changes are merged into `main`.

## Frontend

The simplest GitHub Pages setup for this repository is:

```text
Settings -> Pages -> Build and deployment
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

The root `index.html` redirects to the app in `frontend/`.

The repository also includes a GitHub Actions workflow for a future Pages-from-Actions setup. If that mode is used later, add these repository settings:

```text
Settings -> Secrets and variables -> Actions -> Variables
SUPABASE_URL = your Supabase Project URL
```

```text
Settings -> Secrets and variables -> Actions -> Secrets
SUPABASE_ANON_KEY = your Supabase anon public key
```

The workflow writes `frontend/js/config.js` during deployment. The committed local file can stay empty.

## Local Preview

```powershell
python -m http.server 8080 -d frontend
```

Then open:

```text
http://localhost:8080
```
