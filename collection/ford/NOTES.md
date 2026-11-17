# Ford notes

Source: Ford Build & Price (www.ford.com/build-price and shop.ford.com/showroom), looked at Nov 17, 2026 (nightly run).

**Status: Blocked. Nothing was collected.** No raw files, no collector yet.

## Why it is blocked

- Ford's configurator only opens after a ZIP code is typed into a form ("Find local incentives. Enter your ZIP code"). The box appears when you press "Start your build" or "Select" on a trim, and it has no close button.
- The nightly task may not submit forms, so the run stopped there. It did not try to get around the box.
- No CAPTCHA and no sign-in were seen. The pages before the ZIP box load normally.

## What Juan needs to decide

- **May Claude type a ZIP code into Ford's box?** Ford's own pages already look up ZIP 48120 (Dearborn, Michigan, Ford's head office) in the background, so that would be the natural one to use, the same idea as the head-office ZIP used for Lexus. If yes, the next run can continue from here.

## What was found (so the next run does not start from zero)

- **Model list.** `shop.ford.com/showroom/` holds a list of all models with their trims and starting prices inside the page itself. Current models for private buyers (11): Maverick 2027, Bronco Sport 2027, Mustang 2026, Ranger 2026, Mustang Mach-E 2026, F-150 2027, Explorer 2027, Bronco 2026, Super Duty 2027, Transit (van and wagon) 2027, Expedition 2027. Commercial-only models (E-Series, chassis cabs, F-650/F-750, E-Transit, Transit Chassis) are listed separately and were not counted.
- **Trim page without a ZIP.** `www.ford.com/build-price/<model>/<year>/choose-model/` (for example `broncosport/2027`) loads without the ZIP box and carries the trims and prices as data inside the page. Paints, packages, accessories and rules are only on the build page behind the ZIP box.
- **Ford is a new system** (not like Honda or Toyota): the pages are built on Ford's server and arrive with their data inside, so there is no separate data file per model to read. The collector will have to read each build page.
- **Odd value to check later:** the showroom page says Bronco Sport Big Bend starts at $31,695, the trim page says $32,190. Not collected, only noticed; find out which one is the MSRP before saving prices.
- No F-150 Lightning in today's list.
