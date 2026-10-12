# RD and OPS Energy: 14-day course

Updated 11 October 2026. Entry point: `exam-14.html`, linked from the home page, shared navigation and both existing role libraries.

## Scope

The user's remaining priorities are Revenue Department procurement and OPS Energy. The course uses 3–4 hours daily, with exact 180/240-minute routines over 14 study days (42/56 hours). Day numbers are relative; no examination date is invented.

There are 28 reading lessons, one per role per day. RD covers the eight headings in the recruitment notice. Energy follows the supplied 50-point general / 150-point specific syllabus, including all five named Acts. Energy days 1, 13 and 14 cover general knowledge; days 2–12 cover role-specific material. This is an editorial allocation, not a prediction of question frequency. National strategy and national development-plan study remain outside this urgent course, as requested.

Each lesson includes explanations, a comparison table, a worked case, common confusions, two closed-book recall prompts and primary-source reading links. Agency strategy documents retain their stated plan editions. Numerical exercises state their assumptions. Practice material is original or drawn from the app's existing bank, not represented as authenticated Thammasat examination papers.

## Practice and persistence

- 280 distinct daily questions: 20 per day, 10 per role. Of these, 56 are new lesson-specific questions and 224 are selected from the existing banks.
- The original A/B banks still contain 200 questions per role. Their content, question IDs and storage keys are unchanged.
- 28 writing cases reuse the lessons' worked scenarios, with a model outline and five-point self-review checklist. The checklist is not automatic grading or the examining body's rubric; essays are preparation in case needed.
- Reading markers, day completion, answers, latest mistakes, writing and notes use the new `exam14:rd-energy:v1` localStorage key. They remain local to one browser/device. Blocked storage is reported without disabling study.
- Review links revisit available days at intervals of 1, 3 and 7 days. Incorrect answers can be retried; displayed choice order is deterministic per question.

Completed-agency content and all previous study records remain unchanged. Shared navigation gains a route to the standalone course.

## Files

`exam-14-data.js` defines configuration; `exam-14-rd.js` and `exam-14-energy.js` contain the lessons. `exam-14-capture.js` captures each existing bank after its scripts run. `exam-14-core.js` validates and constructs the schedule and sanitizes state. `exam-14.js` renders the course and saves state; `exam-14.css` supplies its responsive styles.

## Verification

`node --test tests/exam-14.test.js tests/role-research.test.js` passes 11 tests, covering syllabus completeness, source resolution, unique IDs and daily allocation, minute totals, independently computed numerical answers, saved-state validation, missing data and the existing banks.

The Playwright script `tests/exam-14.browser.js` verifies home and legacy entry routes, all 28 lessons, 320/390/1280-pixel layouts, 3/4-hour selection, question scoring/reload/retry, writing and rubric persistence, literal user text, notes, legacy storage preservation, missing-bank handling and blocked storage. It records screenshots when `SCREENSHOT_DIR` is supplied. Serve the repository, provide Playwright through `NODE_PATH` and Chromium through `CHROMIUM_PATH`, and pass the base URL as the optional first argument. `FONT_DIR` optionally supplies local Sarabun fonts for repeatable screenshots.

Desktop and mobile screenshots were visually inspected. This is a static app; no backend, database, external account or new service is required.
