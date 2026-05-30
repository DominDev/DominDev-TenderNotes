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

## Local Preview

```powershell
python -m http.server 8080 -d frontend
```

Then open:

```text
http://localhost:8080
```

