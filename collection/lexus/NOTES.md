# Lexus notes

Source: Lexus Build, www.lexus.com/build, read Nov 16, 2026 (nightly run). No sign-in and no CAPTCHA.

**Only the options data is collected.** Spec tables, outside-source specs, the review workbooks and the Supabase load are still open, so Lexus is "Partial" in `brands.md`.

## The ZIP code question (Juan, please read)

- Lexus's Build page shows a box "Please enter your ZIP code to continue" before anything else. **Claude did not fill in that form.**
- Lexus's data service wants a ZIP with every question, so the collector sends one fixed ZIP: **75024, Lexus's own head office in Plano, Texas.** It is not Juan's ZIP. The service answered with its NATIONAL list for every model.
- If Juan would rather not do it this way, say so and Lexus gets collected differently (or marked Blocked). Toyota did not need a ZIP at all.

## What was collected

- **19 models, 86 trims,** 138 paint lines, 2,125 item lines, 33 "requires" rules and 4 "can't combine" pairs. All 19 files match the collector's output by checksum (`checksums.json`); the structure check found 0 problems.
- **Models and years are the ones Lexus marks as current in its Build menu.** 2027: GX, TX, TX Hybrid, RX, RX Hybrid, RX Plug-in Hybrid, IS, LX, LX Hybrid, TZ. 2026: TX Plug-in Hybrid, UX Hybrid, ES Hybrid, ESe (electric), NX, NX Hybrid, NX Plug-in Hybrid, LS, RZ.
- **Not in the current menu, so not collected:** LC and LC Convertible (the data service still has 2026 entries) and the gas ES (2025 only).
- **Hybrids, plug-in hybrids and electric versions are separate models,** as in Lexus's data (NX, NX Hybrid, NX Plug-in Hybrid). Unlike Toyota, no trim is in two files. Same open question as for Toyota: one model per version, or one model with all versions?

## How the raw format was filled

- **Same method as Toyota** for rules and for paint and interior combinations (see `toyota/NOTES.md`); only the address and the shape of the answers differ, so Lexus has its own `collector.js`.
- **Model and trim names are Lexus's, in its capitals** ("TX PLUG-IN HYBRID ELECTRIC VEHICLE", "RX 350 F SPORT HANDLING AWD"). The three TZ trims carry Lexus's own note in the name, for example "TZ 450e Premium AWD (Available late 2026)".
- **Trim price** is the base MSRP without the destination fee. For all 86 trims, Lexus's list price equals this price plus the fee (checked by the collector).
- **Seat material is empty.** Lexus has no such field; the material is part of each interior's name ("Black NuLuxe and Black Open-Pore Wood trim").
- **Wheels** that cost extra are `W` lines. The standard wheel of each trim is not an option and is left out.
- **Category letters.** Packages = `P`, single factory options = `F`, optional wheels = `W`. Accessories follow Lexus's menu section: Packages = `P`; Lighting = `L`; Interior, Storage, Pet and Coolers/Freezers = `I`; Exterior, Body and Paint Protection, Outdoor, Recovery and Towing = `E`. A first sorting, as for Toyota.
- **No clash rules between accessories,** as for Toyota (all accessories of a trim selected at once: none marked, on all 86 trims).
- Install times and "includes" are empty: not published.

## For Juan to look at

- **Leftover footnote codes in 14 item names,** for example "Cross Bars[CROSSBARS2, ROOFRACKCBAR]" and "Tow Hitch Receiver [TOWCAPSAE, TOWLOAD]". These are Lexus's footnote markers; the collector removes single ones but missed the ones with a comma. To fix in the collector before loading.
- **Very long option names.** Lexus writes some options as sentences ("Lexus Interface with 14.0-in touchscreen display. Includes 3-month trial of Drive Connect ..."). Saved as written; the site will need shorter labels.
- **Negative prices (4):** GX "Without moonroof" -$1,100, IS "Without rear spoiler" -$200, LX Hybrid "Overtrail 2-Row Package" -$1,750, RX 500h "21-in split-10-spoke accessory alloy wheels" -$110.
- **$0 items (17 lines):** "Coin Holder/Ashtray Cup" and "Emergency Assistance Kit" are $0 on several models, and one wheel that comes with the UX Special Appearance Package.
- **Two kinds of accessory price,** as for Toyota: about 70% of the accessory entries are dealer-installed third-party items (Kurgo, Pelican, Dometic, Yakima, ARB ...), with long codes such as `QR1005`. Lexus's own accessories have two-character codes.
- **Notes on the `R` lines (9, in 4 files):** an LX interior that needs the Interior Upgrade Package; a UX package that changes the wheels; and five "also needs one of N choices" cases where Lexus offers alternatives that the format cannot hold.
- **LS is one trim only** ("LS 500 AWD HERITAGE EDITION", one paint, one interior).
- **Typos on Lexus's side, saved as written:** "Dometic Recond Hardside 69L: Silt", "Thule SnowPackSki Carrier", "Package:Carpet Cargo Mat" without a space.
