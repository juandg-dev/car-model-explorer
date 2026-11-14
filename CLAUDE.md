# CLAUDE.md: Project rules for Car Model Explorer

Read this at the start of every session and follow it.

## Who's who
- **Juan (owner):** directs and reviews. Beginner in Python and Git, on a Mac, knows cars well (ex-CarMax sales consultant). Prefers direct, concise answers.
- **Claude:** writes all code, runs and tests it, commits, and pushes.
- **Keep teaching:** after each step, briefly explain what each file does and why, and point out common beginner mistakes. Now and then, mark a small change for Juan to make himself.
- Work one step at a time, at a slow pace. Write complete files, not fragments. Say where each file goes.

## Tech stack
- Backend: Python + FastAPI
- Database: Supabase (PostgreSQL), project `car-model-explorer`, East US, free tier. Use it from the start (no SQLite).
- Frontend: plain HTML/CSS + light JavaScript or HTMX, served by FastAPI. No React unless decided later.
- AI: Claude API, with the trim's spec data passed in as context.
- Hosting: Render (Milestone 9).

## Database rules
- Automatic RLS is ON and auto-expose of new tables is OFF. **Every table needs explicit access policies.** Car data gets public read-only access; writes only through the service role.
- Every schema change is a migration with a clear name.
- Each trim stores a `build_url`, a flag for whether that link reaches the exact trim or only the model, and the link-checker's status and last-checked date.

## Data rules
- Official, free sources first: NHTSA vPIC, EPA fueleconomy.gov, the manufacturer's spec pages and configurator.
- Store specs as facts with a source URL. **Never copy manufacturer images or marketing text.**
- Never invent a spec. If a value isn't found, leave it empty.
- Build one brand completely before starting the next. **First brand: Honda.**

## AI rules
- Comparisons and Q&A use only the stored spec data. When data is missing, say so instead of guessing.

## Design principles (car interior / HMI inspired)
- Modern and minimal. Few choices per screen, big clear tap targets, information you can read at a glance.
- Consistent layout on every page. Progressive disclosure: simple first, details on tap.
- "Build this car" is a clear, prominent button on every trim page.
- Mobile-friendly.
- **Info icons:** every spec label and technical term gets a small, subtle info icon. Hover (desktop) or tap (phone) shows 1–3 plain-English sentences: what it means, what it's good for, the trade-off. A site-wide toggle hides or shows all icons, remembered per device. Tip text lives in the database (glossary table), not in code; drafts go to Juan for approval first.

## Planning documents (Google Drive)
- **Spec Planning sheet** ("Car Model Explorer - Spec Planning"): the master list of specs (tab "Specs"), the info-tip drafts ("Info tips") and planned features ("Features"). Juan's "Your call" column decides which specs go in the database.

## Security rules (non-negotiable)
- Never put secrets (API keys, the database password, service-role key) in code, commits, or chat.
- Secrets live in `.env`, which is in `.gitignore`. Commit a `.env.example` with empty values instead.
- On Render, secrets go in environment variables.

## Git workflow
- Commit after each step with a clear message, then push to `main`.
- Update `docs/PROGRESS.md` at the end of every session with a dated entry.
- The repo is public: no account, 2FA, or recovery details in any file.
