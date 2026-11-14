# Acura notes

Source: Acura Build & Price data, www.acura.com, read Nov 14, 2026. The site did not block anything.

- **Models and years:** four models, all model year 2026 (what Acura lists today): Integra, ADX, RDX, MDX. 24 trims in total. Acura also lists a 2025 RDX under "Previous models"; it is not collected.
- **Type S versions are trims, not models.** Acura's Build & Price page shows six tiles (Integra, ADX, RDX, MDX, Integra Type S, MDX Type S), but its data keeps Integra Type S inside Integra and MDX Type S inside MDX, and so does its spec page. The files follow the data. Open question for Juan: keep it this way, or split Type S out like Civic Si and Civic Type R?
- **Acura calls trims "packages"** (Technology, A-Spec, Advance). Each one is a `T` line.
- **Trim names with a drive or gearbox added:** where two trims share a name, the collector adds Acura's own word for what differs: `FWD`, `AWD` (ADX), `SH-AWD` (MDX), `CVT` or `6MT` (Integra A-Spec with Technology). Honda's files use `2WD` and `AWD`; Acura's own word for two-wheel drive is FWD.
- **One MDX trim is named "A-Spec Advance Packages"** in Acura's data and on its spec page. Kept as written.
- **Two data files per model.** Honda's menu is inside one file; Acura's is in a second file per trim (`.../configurator?modelId=...`). That is why Acura has its own `collector.js`. Install times come from the first file, everything else from the menu file.
- **Menu sections:** Acura's menu has Packages, Exterior and Interior only. Packages > Manufacturer became `F` (Integra and MDX "Function Package", no install time). Exterior items named "... Alloy Wheels" are saved as `W` so the Wheels group is not empty; Acura itself lists them under Exterior > Styling. There are no `L` (electronic) items: remote start and the block heater are under Interior > Convenience in Acura's menu.
- **Seat material** is taken from each trim's standard-feature list, in Acura's words (leatherette, leather, microsuede, ultrasuede). It is empty for MDX "A-Spec Advance Packages" because that list has no seat line.
- **"Sold together" prices (29 entries):** when a menu item needs parts that are never sold alone, Acura shows one set price. The file uses that set price; the parts are on the `R` line. Every set price equals the sum of its parts (checked by the collector), for example RDX Trailer Hitch $815 = hitch $464 + trim cover $121 + harness $230.
- **Left-out entries** (the `R` line): 120 across the four files. Almost all are the hidden parts above, spare-tire kits, and trim-specific duplicates.

## Odd values for Juan to look at

- **MDX Welcome Light:** the menu shows $419; the item's own price in the data is $395, and no parts are listed to explain the $24. The file uses $419 (what a shopper sees).
- **MDX SH-AWD (base) has two "Trailer Hitch" entries:** $1,775 and $1,501. Both names come straight from Acura's menu. The $1,775 one adds the hands-free sensors and the transmission cooler; the $1,501 one adds the harness and the cooler. Across the MDX line the hitch is $701 (FWD trims, no cooler), $1,501, $1,775 and $1,498 (Type S).
- **MDX roof accessories** (crossbars, bike, kayak, ski, roof box and so on) require "Roof Rails, Black" ($609), which is not in the menu; only "Roof Rails (Silver)" is, and only on five trims. The RDX "Crossbars (Silver)" likewise require a hidden "Roof Rails, Silver, for Crossbars" ($609). These are noted on the `R` line as "required part not in menu". Probably because rails are standard on some trims; the site must not show a requirement it cannot satisfy.
- **Prices with cents:** 15 items, all wheel sets (wheel + tire sensor or tire), for example Integra 19-in Glint Black Alloy Wheels with Tires $3,014.56.
- **Long install:** Integra Carbon Fiber Styling Package, 8.1 hours.
- **RDX All-Season Protection Package III** is $305 on the A-Spec Advance and $447 to $490 on the other trims.
- **Same item, different price by trim** is common (Engine Block Heater $87 / $92 on Integra, $92 / $120 on MDX; Car Cover $245 / $393 on Integra). These are separate lines with separate trim masks.

## Specs

- Source: Acura "Specs & Pricing" pages, read Nov 14, 2026. One file per model in `specs/`, split from a single download whose checksum matched (753355309). 807 lines.
- **"Std" means Acura wrote "Yes".** An empty cell is saved as "-". Rows grouped under a heading are saved as "Heading: row" (for example `Max Towing Capacity (lbs): SH-AWD`).
- **Trim names differ slightly from Build & Price** ("Technology Package" vs "Technology", "A-Spec w/Technology Package CVT" vs "A-Spec with Technology CVT"). `review.py` now ignores the words "Package(s)" and "w/" when it matches them. Honda's result did not change.
- **FWD and AWD share a column** on the ADX and MDX pages; values that differ are separate rows (price, MPG, curb weight, towing).
- **Typos on Acura's pages, saved as written:** ADX cargo volume "24.4. / 55.1"; RDX has two rows with the same label "Cargo Volume (cu ft) (Max)" (29.5 (31.1) and 58.9 (79.8)); MDX "Premium Unleaded 91Octane"; ADX wheels "18 x 7JAluminum Alloy".
- Not on Acura's pages: 0-60, top speed, GVWR and payload.

## Outside sources (`specs/outside-sources.json`), collected Nov 14, 2026

- **NHTSA** (NHTSA API): 5 stars overall for Integra, ADX (FWD and AWD), RDX and MDX (FWD and AWD). Integra Type S is not rated overall. NHTSA lists a 2026 RDX FWD, but Acura sells the 2026 RDX with SH-AWD only.
- **EPA** (fueleconomy.gov web service): annual fuel cost for all 11 entries, $2,350 (Integra CVT) to $3,950 (MDX Type S). All premium fuel. City / highway / combined figures match Acura's spec pages for all four models.
- **IIHS:** no Acura is on the 2026 TOP SAFETY PICK list (75 winners when read). The 2025 list names the 2025-26 Integra, ADX and MDX as TOP SAFETY PICK. The RDX is on neither. Honda's rule was "only the 2026 list"; under that rule all four are empty. Juan decides.
- **Warranty** (Acura's spec pages): 4 years / 50,000 miles basic, 6 years / 70,000 miles powertrain, 5 years / unlimited miles rust-through, on all four models.
- **Assembly plant:** Integra, Marysville, Ohio (Acura News). RDX and MDX, East Liberty, Ohio; ADX, Celaya, Mexico. Those three were read from pages that report Acura's statements, so they are marked "confirm".
- **Generation:** Integra 5th (2023, refreshed 2026), ADX 1st (2025), RDX 3rd (2019), MDX 4th (2022, updated 2025).
- **0-60:** a road test for every engine. Read at the source: Integra 1.5 L (7.1 sec CVT, 7.0 sec manual, Car and Driver, 2023 model), Integra Type S (5.8 sec, Edmunds, 2026 model), MDX 3.5 L SH-AWD (6.4 sec) and MDX Type S (5.5 sec, Car and Driver, 2022 models). Secondhand, to confirm: ADX AWD 8.7 sec (Car and Driver), RDX 6.2 sec (Car and Driver, 2022) or 6.7 sec (MotorTrend, 2025), Integra Type S 5.1 sec (Car and Driver). No test found for the ADX FWD or the MDX FWD.
- **Two numbers for one car:** Integra Type S is 5.8 sec (Edmunds, read directly) or 5.1 sec (Car and Driver, secondhand); RDX is 6.2 or 6.7. Juan picks which to show.
- **Top speed:** none found. caranddriver.com still cannot be opened from Claude's browser.
- News found along the way is in `NEWS.md`.

## Review, Nov 14, 2026 (Claude's check; Juan's review still to come)

Run with `python3 review.py acura` from the `collection` folder.

**Passed:** all 8 checksums; every line of every options file is well formed; every trim on Acura's spec pages matches a trim in Build & Price with the same price (both the FWD and the AWD price rows) and model year; no one-way conflicts; no rule points at an item the trim doesn't offer; EPA figures match the spec pages.

**For Juan to look at:** the list under "Odd values" above, the Type S question, the IIHS year question, and the two 0-60 choices.
