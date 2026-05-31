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

## Local Preview

```powershell
python -m http.server 8080 -d frontend
```

Then open:

```text
http://localhost:8080
```
