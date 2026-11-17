# Brand queue

Status values: **Done**, **Next**, **Queued**, **Blocked** (say why), **Partial** (say what is missing).
**Changes from Juan, Nov 15, 2026:**
- **No step-by-step reports.** Claude does a brand from start to finish and tells Juan when it is done.
- **Load first, review later.** The data goes into Supabase once it passes Claude's checks; Juan reviews the workbooks afterwards. Loading a model again replaces it.
- **Top specs only for now:** horsepower, torque, 0-60, MPG, engine, transmission, drivetrain, seating, cargo volume, towing. The carmaker's full spec tables are still saved, so more can be added later without collecting again. The other outside research (NHTSA, IIHS, EPA cost, plant, generation, warranty) is no longer required for "done"; only 0-60 is.
- **Several brands at once** where their sites allow it. Next: Toyota and Lexus together.

**How we work (Juan, Nov 14, 2026):** one brand at a time. A brand is finished only when every item in the checklist below is done. Only then does Claude suggest the next brand; nothing starts on a new brand before that. The nightly task is switched off.

**A brand is 100% done when:**
1. Options data is collected and checksummed for every current model.
2. The carmaker's spec tables are collected for every current model.
3. Outside-source specs are researched for every model: NHTSA rating, IIHS award, EPA annual fuel cost, 0-60, warranty, assembly plant, generation.
4. Juan has reviewed the options and specs workbooks and his flags are resolved.
5. The data is loaded into Supabase.

| # | Brand | Status | Models | Date | Notes |
|---|---|---|---|---|---|
| 1 | Honda | Done | 13 | 2026-11-14 | All five checks passed. In Supabase: 13 models, 65 trims, 620 options, and a spec row for every trim. Open follow-ups (top speed, 0-60 confirmations, a few fields Honda doesn't list) are in `honda/NOTES.md` and the To-Do sheet. |
| 2 | Acura | Done* | 4 | 2026-11-15 | Collected, checked and in Supabase: 4 models, 24 trims, 254 options, and a spec row for every trim (top specs only). *Juan's workbook review is still open; he chose to load first and review later. Notes in `acura/NOTES.md`. |
| 3 | Toyota | Partial | 31 | 2026-11-16 | Options data collected and checksummed: 31 models, 224 trims. Still missing: spec tables, 0-60, workbooks, Supabase load. Before loading, Juan decides how hybrids are shown (some hybrid trims are in two files). Notes in `toyota/NOTES.md`. |
| 4 | Lexus | Partial | 19 | 2026-11-16 | Options data collected and checksummed: 19 models, 86 trims. Still missing: spec tables, 0-60, workbooks, Supabase load. The collector sends Lexus's head-office ZIP because Lexus's service requires one; Juan to confirm that is fine. Notes in `lexus/NOTES.md`. |
| 5 | Ford | Blocked | 0 of 11 | 2026-11-17 | The configurator only opens after a ZIP code is typed into a form, and the nightly task may not submit forms. Juan to decide whether Claude may enter Ford's head-office ZIP (48120). Notes in `ford/NOTES.md`. |
| 6 | Lincoln | Blocked | 0 of 3 | 2026-11-17 | Same system and same ZIP code box as Ford; waits on the same answer. Notes in `lincoln/NOTES.md`. |
| 7 | Chevrolet | Blocked | 0 of 24 | 2026-11-17 | The site is open and the data source is understood (tested on the Trax), but Claude's own permission check refused the collector's scripted requests to GM's data service. Needs Juan's go-ahead in a chat where he is present. Notes in `chevrolet/NOTES.md`. |
| 8 | GMC | Blocked | 0 of 13 | 2026-11-17 | Same system as Chevrolet; waits on the same decision. Notes in `gmc/NOTES.md`. |
| 9 | Buick | Queued | | | Not opened yet. Probably the same GM system as Chevrolet, so expect the same stop until Juan decides. |
| 10 | Cadillac | Queued | | | Not opened yet. Probably the same GM system as Chevrolet. |
| 11 | Nissan | Queued | | | |
| 12 | Infiniti | Queued | | | |
| 13 | Hyundai | Queued | | | |
| 14 | Genesis | Queued | | | |
| 15 | Kia | Queued | | | |
| 16 | Subaru | Queued | | | |
| 17 | Mazda | Queued | | | |
| 18 | Volkswagen | Queued | | | |
| 19 | Audi | Queued | | | |
| 20 | BMW | Queued | | | |
| 21 | MINI | Queued | | | |
| 22 | Mercedes-Benz | Queued | | | |
| 23 | Jeep | Queued | | | |
| 24 | Ram | Queued | | | |
| 25 | Dodge | Queued | | | |
| 26 | Chrysler | Queued | | | |
| 27 | Tesla | Queued | | | |
| 28 | Volvo | Queued | | | |
| 29 | Mitsubishi | Queued | | | |
| 30 | Porsche | Queued | | | |
| 31 | Land Rover | Queued | | | |
| 32 | Jaguar | Queued | | | |
| 33 | Alfa Romeo | Queued | | | |
| 34 | Fiat | Queued | | | |
| 35 | Rivian | Queued | | | |
| 36 | Lucid | Queued | | | |
| 37 | Polestar | Queued | | | |
| 38 | Maserati | Queued | | | |

## Run log

- 2026-11-14: Honda collected (13 models, 65 trims). Collector verified against the saved files by checksum.
- 2026-11-14: Honda spec tables collected (13 models) through the Downloads file route; checksum matched.
- 2026-11-14: Honda spec values (65 trims) and model details (13 models) loaded into Supabase after Juan's review. Honda is done; Acura is next.
- 2026-11-14: Acura options collected (4 models, 24 trims) from Acura Build & Price. All four files match the collector by checksum.
- 2026-11-14: Acura spec tables collected (4 models) through the Downloads file route; checksum matched (753355309).
- 2026-11-14: Acura outside-source specs researched (NHTSA, IIHS, EPA, 0-60, warranty, plant, generation). `review.py acura`: 0 issues. NOTES.md and NEWS.md written.
- 2026-11-15: Acura loaded into Supabase (options data and top specs) after a test load; seven fingerprints match the test database. Juan reviews afterwards.
- 2026-11-15: Toyota first look (not collected yet). toyota.com and lexus.com are approved in the built-in browser and load without a block. Toyota is a different system from Honda and Acura:
  - Build & Price lives at `www.toyota.com/configurator/`. Its menu lists about 31 series, with hybrids as their own series (`camry`, `rav4`, `rav4pluginhybrid`, `corollahybrid`, `tundrahybrid` ...), model years 2026 and 2027 mixed. Each links to `/configurator/build/step/model/year/<year>/series/<series>/`.
  - The data comes from a GraphQL service, `orchestrator.configurator.toyota.com/graphql`, not from one file per model. The queries still have to be read from the page.
  - Toyota prices and packages depend on the region: the page looked up a ZIP code and a region code (`dealers.prod.webservices.toyota.com/v1/region-code/?zipCode=...`). The collector must use one fixed ZIP, and the files must say which.
  - A model-year list is at `prod2.webservices.toyota.com/v1/vehicle/model-year-list`.
  - Lexus has not been opened yet; check whether it uses the same GraphQL service.
- 2026-11-16: Nightly run. Toyota options collected (31 models, 224 trims) from Toyota Build & Price, and Lexus options collected (19 models, 86 trims) from Lexus Build. All 50 files match the collectors by checksum. Options data only: spec tables, 0-60, workbooks and the Supabase load are still open for both, so both are Partial. New `pack.js` for copying large brands. Next for the nightly run: Ford and Lincoln.
- 2026-11-17: Nightly run. **Nothing collected.** Ford and Lincoln: stopped at a ZIP code form in front of the configurator (the task may not submit forms). Went on to Chevrolet and GMC: the sites are open and Chevrolet's data source was worked out on the Trax, but Claude's permission check refused the collector's scripted requests to GM's data service, so the run stopped without working around it. All four are Blocked until Juan decides (two questions, in `ford/NOTES.md` and `chevrolet/NOTES.md`). Next in the queue: Buick and Cadillac (probably the same GM system), then Nissan and Infiniti.
