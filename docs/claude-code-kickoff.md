# Kickoff prompt for Claude Code (terminal)

Paste the block below as the first message of a Claude Code session started in this repo with `claude --chrome`.
It was written on Nov 15, 2026, after Acura was loaded. Update the brand names when the queue moves on.

```
You are working in the Car Model Explorer repo. I'm Juan, a beginner in Git, Python and SQL. Be direct and concise.

Read these first, in this order, and follow them:
1. CLAUDE.md (project rules)
2. collection/brands.md (the brand queue, my rules of Nov 15, 2026, and the first-look notes on Toyota)
3. collection/README.md (the process and the raw file format)
4. collection/acura/ as the newest worked example: collector.js, specs-collector.js, specs-load.py, load-details.json, NOTES.md, NEWS.md
5. collection/load-options.py, collection/review.py, collection/review-workbooks.py

Goal: collect Toyota and Lexus the way Honda and Acura were collected, using background agents for the research, and stop before anything is pushed or loaded.

How to split the work:
- You (the main session) do everything that needs the carmaker's website in Chrome: find where Build & Price gets its data, write collection/<brand>/collector.js and specs-collector.js, collect every current model, save one raw file per model, and verify every checksum. Use one fixed ZIP code for Toyota and Lexus prices, 78616, and write it into each file's notes.
- Create project subagents in .claude/agents/ and run them in the background, one per brand, for the outside research. Each agent researches ONE thing for every model of its brand: a 0-60 mph time from a trusted road test (Car and Driver first, then MotorTrend, Edmunds, Road & Track), with the model year tested, the trim tested and the link. Each agent saves its findings to collection/<brand>/specs/outside-sources.json in the same shape as collection/acura/specs/outside-sources.json, and writes anything odd to collection/<brand>/NOTES.md. Agents only write files inside their own brand's folder. Agents never push, never touch Supabase, and never ask me questions; they leave open questions in NOTES.md.
- Only these specs matter for now: horsepower, torque, 0-60, MPG (city / highway / combined), engine, transmission, drivetrain, seating, cargo volume, towing. Save the carmaker's full spec tables anyway, so more can be added later without collecting again.

Rules that always apply:
- Facts only. Never copy images or marketing text. Never invent or estimate a value. If the carmaker doesn't publish it, or no road test exists, leave it empty and say so in NOTES.md.
- Every value has a source link. Mark a value "confirm" when it was not read at the original source.
- If a site blocks automated reading, stop that brand, mark it Blocked in collection/brands.md with the reason, and tell me. Do not work around a block.
- Never put secrets in code, commits or chat.

When the collection and the research are finished:
1. Run `python3 review.py <brand>` from the collection folder for each brand and fix real issues.
2. Build the review workbooks with review-workbooks.py and the load statements with load-options.py and a specs-load.py per brand.
3. Test the load on a local throwaway database, not on Supabase.
4. Update collection/brands.md and the brand's NOTES.md and NEWS.md. Commit locally with clear messages.
5. STOP and tell me, in a short list: what was collected per brand (models, trims, options), what is empty and why, anything that looks off, and the exact commands or actions you will take next.

Do not run `git push` and do not write to Supabase until I answer "push it". When I do: push to main, load into Supabase, check that the database matches the files, run Supabase's security check, and report the counts.

While you work, do not report step by step. Only interrupt me if a site blocks you, if you need a permission, or if a decision can't be undone.
```
