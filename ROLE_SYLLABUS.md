# DMH and DRR syllabus practice — 3 November 2026

- DMH: `dmh-syllabus.html`, 50 new questions, five per each of ten supplied headings.
- DRR: `drr-syllabus.html`, 50 new questions, ten per each of five supplied headings.
- Scope comes from four user-supplied screenshots: DMH policy/planning analyst and DRR general administration officer. No exam date, duration or question allocation is inferred. The notices state 200 points; this practice uses one point per question.
- These are original introductory practice questions, not authenticated past examination papers or exhaustive legal coverage. Policy questions emphasize application; draft Plan 14 remains explicitly a draft. Original DMH content includes Plan 13 and remains available as supplementary material.
- Data: `*-syllabus-data.js`; UI: `role-syllabus.js`; existing pure `role-sprint-core.js` reused unchanged. Each new bank has its own storage key. Existing questions, IDs, answer indices and storage keys are untouched.
- The catalog shows 128 DMH questions (78 existing + 50 new), and 50 DRR questions. The home and DMH pages refresh the catalog asset version.

## Validation

`node --test tests/*.test.js` — 53 passing checks.

`NODE_PATH=/path/to/node_modules node tests/role-syllabus.dom.js` — requires jsdom. Tests both real banks and HTML pages: full 50-question exams, 49/50 scoring, withheld exam explanations, reload/resume with same choice order, bookmarks, cancelled replacement, wrong-answer retry, preservation of legacy storage, blocked storage and missing bank handling.

A local Playwright browser could not launch because Chromium was absent and the downloaded browser archive was invalid. DOM checks do not establish visual browser verification.
