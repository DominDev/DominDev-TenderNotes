# Agent context

## Project overview

TenderNotes is a mobile-first 14-day observation journal for child wellbeing and behavior
patterns. The app is intentionally simple: static frontend, Supabase backend, per-user data
and printable reports.

## Architecture

- `frontend/` - static HTML/CSS/Vanilla JS app for GitHub Pages.
- `backend/supabase/` - Supabase migrations and seed/setup files.
- `docs/` - setup and deployment notes.
- Root `index.html` redirects GitHub Pages visitors to `frontend/`.

## Local workflow

- Local preview: `python -m http.server 8082 -d frontend`.
- Main hosted URL: `https://domindev.github.io/DominDev-TenderNotes/`.
- GitHub Pages setup: source from branch `main`, folder `/ (root)`.
- Supabase GitHub integration uses working directory `backend`.

## Engineering rules

- Keep UI mobile-first.
- Use Vanilla JavaScript and existing module structure; do not introduce a framework unless
  explicitly requested.
- Keep CSS consistent with the existing BEM-style classes.
- Use Supabase anon/public key only in browser config. Never commit service-role keys,
  passwords, session URLs, refresh tokens or other secrets.
- Do not store real child observation data in repo docs, Obsidian memory or test fixtures.
- Treat TenderNotes as a private family/caregiver tool, not a diagnostic or medical app.

## Obsidian project memory

This project has an additional persistent memory source in Obsidian (Markdown files):
- .obsidian-memory/README.md   - stable project overview
- .obsidian-memory/STATUS.md   - current status, next action, blockers, open questions
- .obsidian-memory/progress.md - dated project diary
- .obsidian-memory/decisions.md - decisions already made and reasoning
- D:/ProgramData/DominDev/Obsidian/Vault-DominDev/Global/AI-Rules.md - global rules

Before larger project work, read these files for context. Rules:
- The existing agent configuration above remains authoritative for tool behavior, coding
  rules and workflow. Obsidian memory is additional context only - it does not replace it.
- Do not delete, rename or reorganize .obsidian-memory without explicit approval.
- Append progress entries; do not rewrite history.
- At the end of a meaningful session, propose updates to STATUS.md, progress.md and
  decisions.md (and README.md only if the stable project direction changed).

<!-- GitNexus: managed project-context block -->
## GitNexus code graph

This repository is indexed in GitNexus as DominDev-TenderNotes.

Before broad code exploration, feature work, debugging, refactoring, or impact analysis, use the GitNexus MCP server first:
- Read gitnexus://repo/DominDev-TenderNotes/context to check repository context and index freshness.
- Use query for concepts/features, context for specific symbols, and impact before changing shared code.
- Use detect_changes before finalizing changes that may affect existing flows.
- If the index is stale, ask before re-indexing or run gitnexus analyze "D:\ProgramData\DominDev\DominDev-TenderNotes" --name DominDev-TenderNotes --index-only.

GitNexus is a navigation and impact-analysis layer, not a replacement for reading the source files before editing.
<!-- /GitNexus -->
