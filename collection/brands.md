# Brand queue

Status values: **Done**, **Next**, **Queued**, **Blocked** (say why), **Partial** (say what is missing).
**How we work (Juan, Nov 14, 2026):** one brand at a time. A brand is finished only when every item in the checklist below is done. Only then does Claude suggest the next brand; nothing starts on a new brand before that. The nightly task is switched off.

**A brand is 100% done when:**
1. Options data is collected and checksummed for every current model.
2. The carmaker's spec tables are collected for every current model.
3. Outside-source specs are researched for every model: NHTSA rating, IIHS award, EPA annual fuel cost, 0-60, warranty, assembly plant, generation.
4. Juan has reviewed the options and specs workbooks and his flags are resolved.
5. The data is loaded into Supabase.

| # | Brand | Status | Models | Date | Notes |
|---|---|---|---|---|---|
| 1 | Honda | Partial | 13 | 2026-11-14 | Options, spec tables and outside-source specs collected. Options data is in Supabase (13 models, 65 trims, 620 options). Missing: Juan's review, then the spec values and model details into Supabase. |
| 2 | Acura | Next | | | Likely shares Honda's system. |
| 3 | Toyota | Queued | | | |
| 4 | Lexus | Queued | | | |
| 5 | Ford | Queued | | | |
| 6 | Lincoln | Queued | | | |
| 7 | Chevrolet | Queued | | | |
| 8 | GMC | Queued | | | |
| 9 | Buick | Queued | | | |
| 10 | Cadillac | Queued | | | |
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
