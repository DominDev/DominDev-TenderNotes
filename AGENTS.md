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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **DominDev-TenderNotes** (548 symbols, 1109 relationships, 47 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/DominDev-TenderNotes/context` | Codebase overview, check index freshness |
| `gitnexus://repo/DominDev-TenderNotes/clusters` | All functional areas |
| `gitnexus://repo/DominDev-TenderNotes/processes` | All execution flows |
| `gitnexus://repo/DominDev-TenderNotes/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
