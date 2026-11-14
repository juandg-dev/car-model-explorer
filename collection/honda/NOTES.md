# Honda notes

Source: Honda Build & Price data, automobiles.honda.com, read Nov 14, 2026.

- **Model years** are what Honda lists today: 2027 for Civic Sedan, Civic Hatchback, Civic Type R, Prelude, HR-V, CR-V, Passport and Odyssey; 2026 for Civic Si, Accord, Pilot, Ridgeline and Prologue.
- **Not found:** the CR-V fuel-cell model (tried the series name `cr-v-fuel-cell`). Civic Sedan Sport-L is not in Build & Price yet.
- **Civic Sedan** was written from Juan's reviewed sheet, so its file has no manufacturer codes and no checksum from the collector.
- **Two-wheel and all-wheel drive** versions are separate trims with their own prices on HR-V, CR-V, Pilot and Prologue.
- **Factory items (`F`)** come from Honda's Manufacturer Packages, Electrical and Charging sections. Most have no install time.
- **Civic Si interior** is a single two-tone color named "Black/Red", not a choice of Black or Red.
- **Left-out entries** (the `R` line in each file) still need Juan's review: 145 across the lineup.
- **Odd values to check:** Pilot and Passport auto-dimming mirror at $488.28; Prologue "Package 1: Home Charging Station" at $0; Ridgeline Adventure Package at $4,473.20.

## Specs

- Source: Honda "Features & Specs" pages, read Nov 14, 2026. One file per model in `specs/`, split from a single download whose checksum matched (416990469).
- Honda's spec pages group 2WD and AWD under one trim, so the trim columns differ from the options files. Values such as curb weight appear as separate 2WD and AWD rows.
- The Civic Sedan mapping was compared with Juan's reviewed sheet: dimensions, weights, fuel tank and MPG match.
- Not on Honda's page for any model: gross vehicle weight rating and payload (except Ridgeline), and for most cars ground clearance or passenger volume. They are left empty.
- **Outside sources collected Nov 14, 2026** (`specs/outside-sources.json`): NHTSA ratings (NHTSA API), EPA annual fuel cost (fueleconomy.gov web service), IIHS 2026 awards, warranty, assembly plant.
- NHTSA and EPA now list the 2027 Civic Sedan (5 stars overall; $1,650 gas, $1,200 hybrid). The reviewed Civic sheet still says "Coming soon" for both and needs updating. The 2027 Civic Sedan Sport has no EPA entry yet.
- Honda News says Civic Si production pauses after the 2026 model year.
- **Road tests, generation, plants added Nov 14, 2026** (`zero_to_60`, `top_speed`, `generation` and two `plant` entries in `specs/outside-sources.json`): a 0-60 time for all 13 models, generation for all 13, Civic Si plant (Alliston) and Prologue plant (GM Ramos Arizpe, Mexico).
- **How good the 0-60 sources are:** Car and Driver's own articles were read for Civic Sedan hybrid, Civic Si, Prelude, Ridgeline and Prologue. The rest are Car and Driver results as reported by another page (named per entry) and should be confirmed on caranddriver.com before publishing. No test was found for the gas Civic Hatchback, the gas Accord or the 2WD Prologue.
- **Still empty:** top speed for 12 models (only the Civic Type R has one, 169 mph, Honda's claim); the Prologue's powertrain warranty term (other sites say 5 years / 60,000 miles; no Honda page read yet); the generation number for the HR-V and Odyssey.
- News found along the way is logged in `NEWS.md`.
- **caranddriver.com cannot be opened** from the built-in browser (blocked, Nov 14, 2026), so top speed and the Car and Driver confirmations cannot be collected by Claude. Options: Juan checks the pages himself, or top speed is shown as "Not available" except where a figure is already sourced.
- **Decisions Nov 14, 2026:** Civic Si and Prologue stay on the site with a "final model year" note. The reviewed Civic Sedan sheet now has the 2027 NHTSA and EPA values.

## Review, Nov 14, 2026 (Claude's check; Juan's review still to come)

Run with `python3 review.py honda` from the `collection` folder.

**Passed:** all 26 checksums; every line of every options file is well formed; every trim on Honda's spec pages matches a trim in Build & Price with the same price and model year; EPA city/highway/combined figures match Honda's spec pages for all 13 models.

**For Juan to look at:**
- **Passport, same name on the same trim:** three "Trailer Hitch with Harness" entries on the RTL ($255, $345, $135); "Protection Package" appears twice at $370 on four trims; "HPD Adventure Package" is $2,950 and $2,850 on the TrailSport Elite.
- **CR-V:** "Trailer Hitch" is $412 on every trim and also $205 on the last trim.
- **Prices with cents:** Odyssey Fender Emblems $124.95, Prologue Home Charging Station $622.25 (plus the three already listed above).
- **18 rules point at an item the trim doesn't offer**, for example CR-V Crossbars require Roof Rails on trims where Roof Rails is not in the menu (probably because rails are standard there). The site must treat "standard on this trim" as satisfied.
- **Prologue range:** Honda's spec page has two range rows, 296 / 281 / 273 miles and 308 / 294 / 283 miles. The EPA lists 308 / 294 / 283 for 2026, so the first row looks like an old one.
- **Prologue warranty link** on Honda's 2026 page points to a 2024 address, and that page lists no powertrain warranty.
- **Ridgeline:** NHTSA's entry is named "FWD and AWD" but the EPA and Honda list AWD only for 2026.
- **Hybrid battery warranty** (8 years / 100,000 miles) is stated on the Accord and Prelude pages but not on the Civic or CR-V pages.
- **Passport** spec data is the 2027 model; its 0-60 tests and IIHS award are for the 2026.
- **Civic Sedan reviewed sheet:** gas 0-60 uses Consumer Reports (9.7 sec); Car and Driver measured 8.9 sec on a 2025 Sport sedan.

## Fix, Nov 14, 2026: menu entries made of several parts

Honda's menu lists seven entries that are really two or three parts sold together. The collector used to treat each part as its own item, so prices were too low or a name showed up three times. Now each is one item whose price is the sum of the parts; the parts are on the `R` line as "Sold together as ...".

| Model | Item | Was | Now |
|---|---|---|---|
| HR-V | 17-Inch HPD Bronze-Finish Alloy Wheels with All-Terrain Tires | $1,428 | $2,077.44 (wheel + tires $649.44) |
| HR-V | 17-Inch Glint Black Alloy Wheels with All-Terrain Tires | $1,428 | $2,077.44 |
| Pilot | 18-Inch Black Alloy Wheels | $1,720 | $1,800 (wheels + center caps $80) |
| Pilot | 20-Inch Machined-Finish Gloss Black Alloy Wheels | $2,160 | $2,240 |
| Pilot | 20-Inch Machined-Finish Matte Black Alloy Wheels | $1,920 | $2,000 |
| Passport | Trailer Hitch with Harness (RTL) | three lines: $345, $255, $135 | one line: $735 |
| CR-V | Trailer Hitch (last trim) | $412 plus a separate $205 line | $617 (hitch + adaptor) |

- The other nine models came out identical when collected again with the new script (same checksums).
- **For Juan:** the summed prices are Honda's part prices added together. Please confirm one of them (for example the HR-V bronze wheels) on Honda's Build & Price page.
- Still open from the review: Passport "Protection Package" appears twice at $370 on four trims, and "HPD Adventure Package" is $2,950 and $2,850 on the TrailSport Elite. Both are two separate entries in Honda's own menu.

## Supabase load: where it stands (Nov 14, 2026)

- The database has nine tables, all empty. The five for paints and options (`paints`, `trim_paints`, `options`, `trim_options`, `option_rules`) were added Nov 14, 2026 by `supabase/migrations/20261114092009_add_paints_and_options.sql`. Supabase's security check reports no problems.
- Order once Juan's review is done: 1) done, 2) load brand, models and trims from the options files, 3) load paints, options and rules, 4) load the spec values Juan marked "Yes" in the Spec Planning sheet into `trim_specs`, 5) run `review.py` and Supabase's security check.
