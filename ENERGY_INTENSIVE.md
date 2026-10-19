# Energy intensive: 5 sets, 500 questions

Entry point: `energy-intensive.html`. Updated 19 October 2026.

## Content

Five 100-question practice sets each cover all 11 headings of the current OPS Energy syllabus, with 25 general and 75 role-specific questions. This is an editorial practice allocation reflecting the official 50/150-point weighting, not an announced question count or duration. The course includes 77 revised existing questions and 423 original practice questions. Each question provides four distinct choices, individual reasons, a reference, source links, skill and provenance.

The source and study-guide tabs distinguish official documents, public practice samples and limited applicant experiences. No authenticated released examination paper was found. Technical references from other countries explain stable principles and are not presented as Thai legal limits. The readable guide is also available at `energy-study-guide.html`.

## State and compatibility

Only `energy-intensive:500:v1` is used for new-course progress, notes, saved sessions and history. Existing Energy/Revenue banks, their IDs and answer indices, and their progress keys remain unchanged. Completed rounds update the new review ledger; unfinished sessions resume with the same randomized choice order. Replacing an unfinished round requires confirmation.

The 18-day plan runs from 20 October to 6 November 2026. The exam date is awaiting the official announcement; 30 October is the announced publication date for further exam details, not the exam date. Existing personal countdown overrides remain stored and are labeled personal. The shared countdown ignores the old 26 October defaults for Energy and Revenue. When an official date is published, verify it before updating the default and `OFFICIAL_PENDING` together.

## Verification

Run `node --test tests/*.test.js` from the repository root. All 49 tests pass: 35 existing tests plus 14 new content/core/DOM/countdown tests. The new content test checks all 500 actual questions, topic allocation, source resolution, answer balance, metadata and scoring. Additional offline-build tests passed in the content preparation workspace.

No package installation is required for these Node tests. The optional existing OPS DOM suite requires jsdom and was skipped because that dependency was unavailable. Local browser automation could not launch in the restricted executor, and the cloud browser could not reach localhost; this is not a claim that local browser-visual tests passed. Public-site smoke verification follows deployment.

`energy-intensive-set-a.json` through `-e.json` and `energy-intensive-sources.json` are the deployed data. The independent legacy validator still requires 200 questions per existing Energy/Revenue bank; do not append the new questions there.
