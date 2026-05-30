# Deployment

TenderNotes uses two independent deployment paths from the same repository.

## Database

Supabase GitHub Integration applies migrations from:

```text
backend/supabase/migrations
```

after changes are merged into `main`.

## Frontend

GitHub Pages can publish the `frontend/` folder with the included workflow:

```text
.github/workflows/deploy-pages.yml
```

In GitHub, enable Pages from GitHub Actions:

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

Before the Pages workflow can produce a connected app, add these repository settings in GitHub:

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
