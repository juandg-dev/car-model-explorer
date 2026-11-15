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
- Create exactly five project subagents as files in .claude/agents/ and run them in the background. Commit those files so I can reuse them for later brands. None of them uses the browser, pushes, touches Supabase, or asks me questions; each leaves open questions in the brand's NOTES.md and only writes inside the folders named here.
  1. road-test-toyota: for every Toyota model, find a 0-60 mph time from a trusted road test (Car and Driver first, then MotorTrend, Edmunds, Road & Track), with the model year tested, the trim tested and the link. Saves to collection/toyota/specs/outside-sources.json in the same shape as collection/acura/specs/outside-sources.json. Can start right away from the model list.
  2. road-test-lexus: the same for every Lexus model, saving to collection/lexus/specs/outside-sources.json. Can start right away.
  3. spec-mapper: once a brand's spec tables are saved, reads collection/<brand>/specs/*.txt and writes collection/<brand>/specs-load.py for the ten specs below, following collection/acura/specs-load.py. Copies values only; lists every field it had to leave empty and why.
  4. data-reviewer: once a brand's files are saved, runs `python3 review.py <brand>`, reads every raw file for odd values (prices with cents, the same name twice on one trim, rules that point at missing items, empty seat material), and writes the findings to collection/<brand>/NOTES.md. Fixes nothing itself; reports to you.
  5. news-scout: for both brands, finds model news that changes what the site should say (new model years, redesigns, discontinued models, new trims) from the carmaker's own newsroom first, and writes collection/<brand>/NEWS.md in the format of collection/acura/NEWS.md. Can start right away.
  Start agents 1, 2 and 5 at the beginning. Start 3 and 4 for a brand as soon as its files are collected.
  Run all five agents on Opus: put `model: opus` in each agent file's frontmatter, whatever model the main session uses. Give each agent a clear name so I can find it in /tasks.
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
