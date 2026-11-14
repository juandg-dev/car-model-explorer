# Car Model Explorer

Browse every new car sold in the US, with trim-level specs, AI comparisons, and direct links to build each car.

> Status: early development. First brand: **Honda**.

## What it does

- **Browse:** Brand → Model → Trims.
- **Spec sheet for every trim:** dimensions, cargo volume, seating, curb weight, engine, horsepower, torque, 0–60, transmission, drivetrain, fuel economy, towing, and MSRP.
- **Compare two trims:** an AI summary of the main differences.
- **Ask about a car:** questions like "Can I fit three carry-on suitcases?" are answered **only from stored spec data**, and the answer says when data is missing.
- **Build this car:** every trim links straight to that trim in the manufacturer's official configurator.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Python + FastAPI |
| Database | Supabase (PostgreSQL) |
| Frontend | HTML/CSS + light JavaScript (or HTMX), served by FastAPI |
| AI | Claude API |
| Hosting | Render (planned) |

## Data sources

- NHTSA vPIC API (makes and models)
- EPA fueleconomy.gov API (fuel economy)
- Manufacturers' official spec pages and configurators

Specs are stored as facts. Manufacturer images and marketing text are not copied; the site links to official pages instead.

## Milestones

- [ ] 1. Setup: repo, README, project rules
- [ ] 2. Database: tables in Supabase + sample data for one Honda model
- [ ] 3. Backend: FastAPI endpoints for brands, models, trims, specs
- [ ] 4. Frontend: browse pages with an HMI-inspired design
- [ ] 5. Build links: configurator links for Honda + link-checker script
- [ ] 6. AI compare: two trims → summary of differences
- [ ] 7. AI Q&A: questions answered from spec data only
- [ ] 8. Expand data: more brands, including small manufacturers
- [ ] 9. Deploy online

Progress is logged in [`docs/PROGRESS.md`](docs/PROGRESS.md).
