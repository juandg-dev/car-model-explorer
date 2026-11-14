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
- **Still to research for all 13 models:** NHTSA rating, IIHS award, EPA annual fuel cost, 0-60, top speed, warranty, assembly plant, generation.

