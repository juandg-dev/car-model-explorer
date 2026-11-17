# Chevrolet notes

Source: Chevrolet Build & Price (www.chevrolet.com/shopping/configurator), looked at Nov 17, 2026 (nightly run).

**Status: Blocked. Nothing was collected.** No raw files, no collector yet.

## Why it is blocked

- The site itself is open: no sign-in, no CAPTCHA, no ZIP box (it fills in ZIP 48243, GM's head office in Detroit, by itself).
- The data source was found and understood on one model (2026 Trax). But when the collector's first scripted requests were sent to GM's data service, **Claude's own permission check for this session refused them** ("unauthorized access"). The run did not try another way around that refusal.
- So this is not Chevrolet blocking us; it is a safety stop on Claude's side that needs Juan's decision.

## What Juan needs to decide

- **Is it OK for the collector to ask GM's data service directly**, the same way the Toyota and Lexus collectors do? If yes, start the Chevrolet collection in a chat where Juan is present and can approve the step. If no, the only other route is clicking through the configurator by hand, which is too slow for a whole brand (about 50 clicks per trim).

## What was found (so the next run does not start from zero)

- **Same system for all four GM brands.** gmc.com uses the same configurator and data service; Buick and Cadillac very likely too. One collector should serve all of them.
- **How the data works** (read from the page's own requests while clicking through the Trax):
  - One request per model returns the trims: name, MSRP, drive (FWD/AWD), engine and gearbox, and a "starting state" for each.
  - One request per trim returns everything the Build page shows: paints, wheels, seat types, interior colors, packages and options, each with a code (GM's RPO code), a name and a price, plus the destination fee (Trax: $1,795).
  - Selecting an item returns the same list with every other item marked "included", "required" or "excluded". That gives all three rule types (includes / requires / can't combine) cleanly. Example: Trax LT "Midnight Edition" ($695) requires "LT Convenience Package" ($595) and excludes "Blackout Package".
  - Packages list what they contain. Some contents have no price of their own (for example "Power sunroof" on the Trax LT is only listed inside the Sunroof Package).
  - Install times are not published.
- **Things the collector must handle:** the same item appears in several menu groups ("Popular" repeats items from other groups); dealer-installed accessories are marked "LPO" in GM's long names; service plans (OnStar, SiriusXM, MobileService+) are listed as options.
- **Models in the Build menu today** (two model years are offered for most; use the newer one): Colorado, Silverado 1500, Silverado 2500 HD, Silverado 3500 HD, Silverado EV, Bolt, Trax, Trailblazer, Trailblazer Limited, Equinox, Equinox EV, Blazer, Blazer EV, Traverse, Tahoe, Suburban, Corvette Stingray, Corvette Z06, Corvette ZR1, Corvette ZR1X, Corvette Grand Sport, Corvette Grand Sport X, Express Cargo, Express Passenger. That is 24; the trucks will be big (many cab, bed and engine choices).
