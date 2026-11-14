# Options data collection

This folder holds the raw options data for each brand (trims, prices, paints, packages, accessories and their rules) and the small scripts that collect it. It is the input for the options explorer; nothing here is loaded into the database yet.

## Rules (from CLAUDE.md, they apply here in full)

- Facts only: names, prices, install times, availability, rules, paint and interior combinations. **Never copy images or marketing descriptions.**
- **Never invent a value.** If something isn't published, leave it empty.
- Every file names its source and the date it was read.
- Juan reviews each brand's data before it goes on the site.

## What is here

| Path | What it is |
|---|---|
| `brands.md` | The queue: which brands are done, next, or blocked, and why. **Update it every run.** |
| `checksum.js` | Prints the checksum of a raw file, to compare with the number the collector gives in the browser. |
| `<brand>/collector.js` | The script for that brand's configurator. It runs in the browser on the carmaker's own site. |
| `<brand>/raw/<model>.txt` | One file per model, in the raw format below. |
| `<brand>/checksums.json` | Checksum of every raw file as collected. |
| `<brand>/NOTES.md` | Anything odd about the brand: model years, entries left out, open questions for Juan. |

## Raw format (one file per model)

Plain text, one record per line, fields separated by `;`.

```
#id|Model name|model year|configurator series|destination fee|body
T;trim name;MSRP;manufacturer model id;seat material
C;paint name;paint code;paint price;interiors per trim
<letter>;item name;price;install hours;trim mask;can't combine;requires;includes;manufacturer code
R;entries left out // separated by " // "
```

- **`#` header:** `body` is `sedan` or `suv` and only picks the placeholder drawing.
- **`T` trims:** in the carmaker's order. Their position matters: trim 0 is the first `T` line.
- **`C` paints:** the last field has one entry per trim, comma separated. `0` means the paint is not offered on that trim; otherwise the interior colors offered with it, separated by `/` (for example `Black/Gray`).
- **Item lines** start with a category letter: `P` package, `W` wheels, `E` exterior, `I` interior, `L` electronic, `F` factory or port-installed item.
  - `install hours` is empty when the carmaker doesn't list one.
  - `trim mask` is a number whose bits say which trims offer the item: bit 0 = first trim. Example: `5` = first and third trim.
  - `can't combine`, `requires`, `includes` are comma-separated positions of other item lines in the same file (first item line = 0).
- **`R` line:** entries found in the carmaker's data but not in its configurator menu (attachments, duplicate kits, credits). They are kept for review and are not shown on the site.

## How a brand gets collected

1. Open the brand's official build-and-price page in the browser and find where its data comes from (most configurators load a data file per model; the Network list shows it).
2. Write `<brand>/collector.js` that turns that data into the raw format. Start from `honda/collector.js`.
3. Run it for every current model. Use the model year the carmaker lists today.
4. Save each result as `<brand>/raw/<model>.txt`. Check the copy with `node collection/checksum.js <file>` against `checksum(text)` in the browser. They must match.
5. Write `<brand>/NOTES.md` and update `brands.md`.
6. Commit and push to `main` with a message like `Collect options data: Acura (6 models)`.

If a brand's site doesn't expose structured data, or blocks automated reading, **stop, mark it "Blocked" in `brands.md` with the reason, and move to the next brand.** Do not work around a block and do not fill gaps from memory or third-party sites.

## Honda

Source: Honda Build & Price (automobiles.honda.com), read Nov 14, 2026. Thirteen models. The Civic Sedan file was written from Juan's reviewed sheet rather than straight from the collector, so it has no manufacturer codes.
