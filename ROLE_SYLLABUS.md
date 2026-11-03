# Four-exam study update — 3 November 2026

## Delivered

- DMH policy/planning analyst: 100 original practice questions (10 per supplied syllabus topic).
- DRR general administration officer: 100 original practice questions (20 per supplied syllabus topic).
- Full practice score: 100 × 2 = 200 points. Partial/retry sessions score 2 points per question. Allocation is for practice, not an assertion of the official per-topic distribution or exam duration.
- `exam-tutor.html`: 30 substantive lessons across Energy (7), Revenue/procurement (7), DMH (8), DRR (8). Each has an explanation, worked example, pitfall and primary-source reading links. An isolated checklist persists on this browser.
- Entry points on all four catalog cards and practice pages. All four remain active preparation targets.
- DMH catalog total 178 includes 78 legacy questions; DRR total 100. Energy and Revenue banks remain unchanged.

## Evidence and limits

DMH/DRR topic lists follow the user's notice screenshots. DMH explicitly includes draft Plan 14 (2571–2575), not Plan 13. The guide separates plan targets from measured outcomes, including the DMH mid-plan update for 2569–2570.

Research includes official recruitment pages, statutory text and amendments, government plans, Microsoft/EIA/UNFCCC documentation, public training examples and commercial syllabus/sample listings. Commercial claims and unmatched exam experiences are not evidence of actual exam questions or frequency. Paid material was not obtained/copied. Source categories and links are visible in the guide. No verified actual paper for these exact current rounds was found.

Energy's 30 October applicant-list page was found through search; its attachment could not be read through the redirect. No exam date was invented. Revenue's 30 October listing concerns different positions; it was not used to mark procurement as completed. Some DMH PDF URLs return a moved-page response on fresh access despite indexed full text; the official plan-list page is included as a fallback.

This update does not claim a fresh audit of every question in the legacy Energy/Revenue banks. The new guide adds researched explanations and source navigation, while preserving the existing banks.

## Compatibility and verification

The original 50 questions in each expanded bank are unchanged, including IDs, choices, correct-answer indices, explanations and references. Their storage keys and version remain unchanged. Old 50-question sessions stay 50-question sessions and can resume; starting a new full session uses 100. All legacy banks and the shared core are untouched.

- `node --test tests/*.test.js`: 54 passing tests, including old-50-session acceptance by the expanded banks.
- `NODE_PATH=/path/to/node_modules node tests/role-syllabus.dom.js`: actual HTML/data/engine flows, both complete 100-question exams, 99/100 = 198/200 points, hidden exam explanations, reload/resume with fixed choice order, bookmark, cancellation, retry, blocked storage, missing bank and unrelated stored data.
- `NODE_PATH=/path/to/node_modules node tests/exam-tutor.dom.js`: four sections, 30 lessons, internal file/fragment links, persisted checklist and blocked-storage behavior.
- Original question objects compared against the prior commit; all 100 unchanged. `git diff --check` passes.

These are DOM and data checks; they do not establish visual mobile/browser verification.
