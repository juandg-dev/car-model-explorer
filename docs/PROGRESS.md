# Progress Log

Newest entries at the top. Full private notes (accounts, setup details) are kept outside this public repo.

## Overall status

| Milestone | Status |
|---|---|
| 1. Setup (repo, README, CLAUDE.md) | 🟡 In progress |
| 2. Database tables + sample data | ⬜ Not started |
| 3. Backend (FastAPI) | ⬜ Not started |
| 4. Frontend (browse pages) | ⬜ Not started |
| 5. Build links + link checker | ⬜ Not started |
| 6. AI compare | ⬜ Not started |
| 7. AI Q&A | ⬜ Not started |
| 8. More brands | ⬜ Not started |
| 9. Deploy online | ⬜ Not started |

---

## November 13, 2026: Session 1 (setup)

- Set up the project accounts (email, GitHub, Supabase, Claude) with two-factor authentication.
- Created the Supabase project with Row Level Security on by default.
- Created this repo (public, empty).
- Decided: Claude writes the code, Juan directs and reviews; Supabase from day one instead of SQLite.
- **Chose Honda as the first brand.**
- Added `README.md`, `CLAUDE.md` (project rules), `.gitignore`, and this log.

## November 14, 2026: Session 2 (options data, Honda)

- Collected options data for all 13 current Honda models from Honda Build & Price: trims, prices, paints, packages, accessories and their rules.
- Added `collection/`: the Honda collector script, one raw data file per model, checksums, a brand queue (`brands.md`) and a README explaining the format and the process.
- Each saved file was checked against the collector's output by checksum.
- Set up a nightly task to collect two more brands per night, in the order listed in `collection/brands.md`.
- Design work on the options explorer is in progress on a design canvas, not in this repo yet.
