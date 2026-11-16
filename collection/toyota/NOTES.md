# Toyota notes

Source: Toyota Build & Price, www.toyota.com/configurator, read Nov 16, 2026 (nightly run). The site did not block anything: no sign-in, no CAPTCHA, no form.

**Only the options data is collected.** Spec tables, outside-source specs, the review workbooks and the Supabase load are still open, so Toyota is "Partial" in `brands.md`.

## What was collected

- **31 models, 224 trims,** 280 paint lines, 2,237 item lines, 119 "requires" rules and 108 "can't combine" pairs. All 31 files match the collector's output by checksum (`checksums.json`), and a structure check found 0 problems (every line well formed, every rule points at an item on the same trim, no one-way clashes).
- **Model years are the ones in Toyota's Build menu today.** 22 models are 2027. Nine are still 2026: RAV4, RAV4 Plug-in Hybrid, Highlander, Highlander Hybrid, GR Corolla, Sienna, Mirai, Tacoma, Tacoma i-FORCE MAX.
- **Not in the Build menu, so not collected:** GR Supra (Toyota's data service still has a 2026 entry) and the old bZ4X name (2025 only; it is now "bZ").

## How Toyota's data works (different from Honda and Acura)

- There is no data file per model. The page asks a data service one question per trim (`orchestrator.configurator.toyota.com`; the collector asks the same questions, minus images and descriptions). About 1,500 questions for the whole brand.
- **Region: NATIONAL.** Toyota's accessories depend on where you live. The collector asks for Toyota's national list, with no ZIP code. Checked on the Camry: a Los Angeles ZIP gives the same list as NATIONAL. Texas (Gulf States Toyota) and the Southeast (Southeast Toyota) are separate distributors with their own, different accessory lists and prices. On the Camry LE the trim price, the factory packages, the number of paints and the destination fee were the same in all four; only the accessories differed.
- **Rules are not listed anywhere.** The collector finds them the way the page does: it selects each factory package or option and reads which other items the service then marks "not compatible" (= can't combine), and it asks the service what a blocked item needs (= requires).
- **Toyota has no clash rules between accessories.** Selecting every accessory of a trim at once never marked one as incompatible (checked on all 224 trims), and two tonneau covers or two wheel sets can be selected together. So accessory lines have no rules. The site should not claim they can all be combined; Toyota simply does not say.
- **Install times are not published,** so that field is empty on every line. "Includes" is also empty: Toyota's data has the field but it is never filled.

## How the raw format was filled

- **Hybrids are their own models, as in Toyota's menu, and some trims are in two files.** Toyota lists Corolla Hybrid, Corolla Cross Hybrid, Grand Highlander Hybrid, Highlander Hybrid, 4Runner i-FORCE MAX, Tacoma i-FORCE MAX and Tundra i-FORCE MAX as separate models, but the base model's list also contains those hybrid trims (same trim codes, same prices). The files follow Toyota. **Open question for Juan:** keep the hybrid models separate, or show hybrids only inside the base model? This has to be decided before loading, or the same trim would appear twice.
- **Trim names** are Toyota's grade name, plus whatever differs between trims of the same grade: drive (FWD, AWD, RWD, 4WD), cab and bed, engine, gearbox, seats. Truck names get long ("TRD Sport 4WD Double Cab with 5-ft bed 6-Speed Manual Transmission"). One name is ugly: Tacoma i-FORCE MAX has "Trailhunter 7536" and "Trailhunter" (two bed lengths; in that file Toyota gives no cab-and-bed label, so the collector fell back to the trim code for one of them).
- **Seat material** is Toyota's own material word for the trim's interiors (Fabric, SofTex, Leather, Mixed Media ...), joined with "/" when a trim has more than one.
- **Interior names** on paint lines are Toyota's full names ("Black SofTex trim"). A "/" inside a name was changed to "-" and commas were removed, because the format uses both as separators.
- **Which interior goes with which paint** is read from the interior's side: select the interior, read which paints stay available. `Yes` means the paint is offered on that trim but no interior came back for it (54 trim entries, mostly Tundra and Sequoia paints that need a package).
- **Category letters.** Factory packages are `P`, single factory options are `F`. Accessories follow Toyota's own menu section: Wheels = `W`; Accessory Packages = `P`; Technology and Lighting = `L`; Interior, Storage and Pet Products = `I`; everything else (Protection, Styling, Bed Products, Camping, Roof Racks, Steps, Towing & Recovery, Performance) = `E`. This is a first sorting for the site's groups, not Toyota's wording; Juan may want other groups.
- **Same item, different price by trim** becomes separate lines with separate trim masks, as for Honda and Acura.
- **`body`** in the header only picks the placeholder drawing: sedan for the cars, suv for everything else (trucks and the Sienna included).

## For Juan to look at

- **Two kinds of accessory price.** Toyota marks port-installed accessories as "installed" prices and dealer-installed ones as "parts only" prices. Almost all dealer-installed items are third-party brands (Kurgo, Pelican, Dometic, Yakima, ARB ...). The raw format has no field for this. They can be told apart by the code: Toyota's own accessories have a two-character code (`2T`, `GN`), the dealer-installed ones a longer one (`EI1005`, `AA1575`). Decide whether the site shows the third-party items at all, and how to label "parts only".
- **Grand Highlander and Grand Highlander Hybrid have only 3 items** (factory options) and no accessories. Toyota's national list for the 2027 model is empty today; it will probably be filled later. Collect again before loading.
- **Big numbers that are real:** 4Runner "Overlook Package" $15,451, Tacoma "Outpost Package" $12,114 and "All-Pro Tailgate Package" $5,342, Sequoia "Basecamp Package" $5,463 (dealer-installed bundles of third-party gear).
- **A negative price:** Sienna "Spare tire (removes second-row ottomans)" is -$125. Several factory options cost $0 (Bench Seat, All-Season Tires, Off-Road Front Skid Plate).
- **Rules that the format cannot hold are on each file's `R` line** (110 notes in 8 files; 23 files have none). They are kept for review and not shown on the site:
  - "X not with paint Y" / "X not with interior Y": a package that rules out a color.
  - "interior X needs package Y": an interior that only comes with a package (Land Cruiser, Sequoia, Tacoma, Tundra).
  - "X also needs one of N choices": Toyota offers several ways to make an item fit. What every way has in common is stored as a normal "requires" rule; the rest is only noted, with one example.
  - "Clashes not checked (needs a color change first)": 18 package-and-trim cases where the package cannot be selected without first changing the interior, so its clashes could not be read safely. Almost all on Tundra, Tacoma and Sequoia.
  - "Not selectable, no reason given": Tacoma SR5 "Full-Size Spare Tire" on two trims.
- **Tundra is by far the most tangled model** (30 trims, 57 notes). Worth reviewing first.
- **Typos on Toyota's side, saved as written:** "Emergency Assitance Kit" (Prius), "ARB Pinncacle Table" (Tacoma), "Lower Body and Hood Graphics Package:" with a stray colon (RAV4 Plug-in Hybrid).
