# HomeLedger — round 2 review

## What changed vs round 1
Round 1 lost (rank 3455/4675, 44.1%) with a dashboard of eight equal-weight KPI
cards and no clear budget story. Round 2 recomposes the dashboard as a budget
command center:

- One dominant verdict first: spent / budget / remaining for the selected month,
  with a plan-vs-actual bar and "safe to spend per day" for the days left.
- One plan-vs-actual module (8 categories, bar + % used + "₫X left" on every
  row), then "Needs attention" (top 3 variances, linked to their budget), then
  the 3 savings goals as a "Family priorities" strip, then the Sep/Oct/Nov
  comparison, then the latest 5 transactions.
- November is the selected month (latest), labelled "recorded spending, 1–26
  Nov" — a partial month, never presented as a full month, never a Nov-vs-Oct
  "fall" claim. Daily-rate comparisons say "daily averages only".
- Reports page: 3 monthly totals with coverage, a category breakdown that sums
  to the stated total, 3 computed insights with numbers + links, and an honest
  scenario labelled "Scenario, not a forecast".

## Reconciliation (numbers tie out)
- 99 transactions, 33 per month, 1 Sep – 26 Nov 2026. November spending by
  category: Groceries 6,300,000 + Rent & utilities 12,900,000 + Transport
  2,050,000 + Dining out 1,950,000 + Health 900,000 + Entertainment 850,000 +
  Kids & school 3,100,000 + Home 1,200,000 = **₫29,250,000**.
- Monthly budget total (sum of the 8 limits): **₫32,200,000**. November:
  spent 29,250,000, remaining **₫2,950,000**, **90.8%** used, 4 days left
  (27–30 Nov) → **₫737,500/day** safe to spend.
- October ran over the whole plan: spent 32,750,000 vs budget 32,200,000 =
  **−₫550,000 (101.7%)**, driven by Dining out's ₫340,000 breach
  (2,340,000 vs the 2,000,000 limit, 17% over).
- Sep–Nov breakdown sums to the stated total: Rent & utilities 38,930,000 +
  Groceries 20,270,000 + Kids & school 10,250,000 + Transport 6,850,000 +
  Dining out 6,150,000 + Home 4,250,000 + Health 3,720,000 + Entertainment
  2,980,000 = **₫93,400,000** = 31,400,000 (Sep) + 32,750,000 (Oct) +
  29,250,000 (Nov).
- Edit propagation (verified by the test suite): adding a ₫100,000 Dining out
  lunch on 26 Nov moved November spent 29,250,000 → 29,350,000 on the
  dashboard and survived a reload; editing it to ₫200,000 moved it to
  29,450,000; deleting it restored 29,250,000. Editing Groceries' limit
  7,000,000 → 6,500,000 moved the budget total 32,200,000 → 31,700,000 and
  remaining 2,950,000 → 2,450,000, then restored. Adding ₫1,000,000 to the
  Emergency fund moved it 62,000,000 → 63,000,000 and survived a reload.

## Verification (this session, headless Chromium, fresh profiles)
- Interaction suite `~/workspace/makefun/r2-tools/test.mjs`: **29/29 checks
  passed** — every route renders; month switcher; all filters (month,
  category, type, search) incl. combined filters and the empty state; add /
  edit / delete transaction; edit a budget limit; add money to a goal; reports
  period switch; breakdown sums to the period total; zero console errors;
  no NaN / Infinity / undefined text; no horizontal overflow at 1280px.
- Phone check (390×844, all 5 routes): **5/5 passed** — no horizontal
  overflow, all 5 nav links inside the viewport.
- Packaging: `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice →
  `diff -r` **identical**; app/ 73,269 B in 7 files, index.html 1,996 B;
  dossier.json 551,528 B; zero `http://` / `https://` / fetch / XHR /
  WebSocket / eval / service-worker / cookie references in app/;
  `node --check` clean on main.ts and serve.ts.

## Bugs found and fixed during this session
1. My design note said the monthly budget total was ₫33,200,000 — the 8
   limits actually sum to ₫32,200,000. The app computed the right number all
   along; the README and the test expectations were wrong, not the app.
   (October being over the whole plan by ₫550,000 is the honest consequence.)
2. Phone nav was a horizontally scrolling strip: the Reports link sat past
   the 390px edge and was invisible in the phone screenshot. Changed to
   wrap to two rows so all 5 links are visible.
3. The SVG favicon's `xmlns` contains `http://www.w3.org/...` — a namespace
   string, not a network fetch, but it is the only `http` string in app/.
   Replaced with a PNG favicon (base64 data URI) so app/ has zero `http`
   strings at all. (SVG without xmlns fails to load in Chrome — verified.)

## Screenshots
- `screenshots/1-dashboard.jpg` — 1280×800, 101,201 B, dashboard (#/)
- `screenshots/2-transactions.jpg` — 1280×800, 101,411 B, transactions
- `screenshots/3-reports.jpg` — 1280×800, 111,188 B, reports
- `screenshots/4-phone.jpg` — 390×844, 42,139 B, dashboard on a phone
All four inspected full-size and as thumbnails; zero console errors on every
capture; fresh browser profile per capture; no test residue in any shot.

## Visual verdict
Round 2 is clearly better than round 1 in first impression and in budgeting
clarity: the verdict bar answers "where do we stand?" in one glance, every
plan row shows how much is left (not just a %), and the attention list names
exactly what to do. The reports page shows its arithmetic instead of asserting
it. The one honest caveat: the dashboard below the fold is long (plan rows +
attention + goals + comparison + latest transactions), but the first fold
carries the decision, and the rest is one scroll down.

## Provenance
99 seeded transactions · Sep–Nov 2026 · VND · edits stored only in this browser.
