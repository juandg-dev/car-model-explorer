# Progress Log

Newest entries at the top. Full private notes (accounts, setup details) are kept outside this public repo.

## Overall status

| Milestone | Status |
|---|---|
| 1. Setup (repo, README, CLAUDE.md) | 🟡 In progress |
| 2. Database tables + sample data | ✅ Done (9 tables; Honda fully loaded: 13 models, 65 trims, options and specs) |
| 3. Backend (FastAPI) | ⬜ Not started |
| 4. Frontend (browse pages) | ⬜ Not started |
| 5. Build links + link checker | ⬜ Not started |
| 6. AI compare | ⬜ Not started |
| 7. AI Q&A | ⬜ Not started |
| 8. More brands | ⬜ Not started (Acura is next) |
| 9. Deploy online | ⬜ Not started |

---

## November 14, 2026 (afternoon): Session 4 (Honda finished: specs in the database)

- Juan finished his review of the Honda options and specs. No changes were needed, so the data went in as collected.
- Added `collection/honda/specs-load.py`. It builds one spec row per trim from Honda's spec tables, the Build & Price trim lines and the outside-source file. Nothing is estimated; a field Honda doesn't list stays empty.
- **Loaded Honda's spec values into Supabase:** 65 `trim_specs` rows (67 fields with data) and assembly plant, generation and warranty for all 13 models. The load was tested on a throwaway local database first, and the rows in Supabase match the rows the script built.
- 0-60 times are one road test per engine, applied to every trim with that engine. Top speed is filled for the Civic Type R only.
- Wrote down how each value was chosen and what was left empty in `collection/honda/NOTES.md`.
- **Honda is done** (all five checks in `collection/brands.md`). Milestone 2 is complete.
- Next: Acura, collected the same way.

## Late night November 13 into November 14, 2026: Session 3 (Honda: outside specs, review, first data in the database)

- Added outside-source specs for all 13 Hondas: NHTSA ratings, EPA fuel cost, IIHS awards, warranty (read on each model's Honda page), assembly plant, generation and a 0-60 road-test time. Top speed is still empty for 12 models.
- Added `collection/review.py`, a checker for a brand's collected data, and wrote its findings into `collection/honda/NOTES.md`.
- Fixed the Honda collector: a menu entry made of several parts (wheels with tires, a hitch with its harness) is now one item priced as the sum of its parts. HR-V, CR-V, Passport and Pilot were collected again; the other models came out identical.
- New migration `add_paints_and_options`: tables `paints`, `trim_paints`, `options`, `trim_options`, `option_rules`, all public read-only.
- **Loaded Honda's options data into Supabase:** 13 models, 65 trims, 89 paints, 620 options and 743 rules. Each file was checked against its fingerprint before loading.
- Started a per-brand news log (`collection/honda/NEWS.md`) for things like model-year changes and discontinued models.
- Decided: Civic Si and Prologue stay on the site with a "final model year" note; one brand is finished completely before the next starts.
- Next: Juan's review of the Honda workbooks, then the spec values and model details go into the database, then Acura.

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
- Collected Honda's spec tables for all 13 models (`collection/honda/specs/`) and added `collection/specs-map.js`, which maps them onto the project's spec fields for review.
- Set up a nightly task for further brands, then paused it: Honda has to be complete first (outside-source specs and Juan's review are still open).
- Design work on the options explorer is in progress on a design canvas, not in this repo yet.
