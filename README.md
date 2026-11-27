# HomeLedger — Household budget site

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/Nia-Le1908/homeledger/rank.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/Nia-Le1908/homeledger/reward.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)

HomeLedger is the Nguyen family's household budget: a working single-page
site that runs entirely from its own files — no network, no build step, no
framework.

## What it does

- **Dashboard** — income vs spending vs saved for the month, remaining
  budget, a category donut, per-category budget bars and recent transactions.
- **Transactions** — the full table with month, category, type and text
  filters; add a transaction, delete one, or edit an amount in place.
  Changes persist in localStorage and update every total on the site.
- **Budgets** — monthly limits per category with editable limits, progress
  bars, over-budget flags and a month comparison.
- **Goals** — three savings goals with progress bars and a working
  "add money" control.
- **Reports** — income vs spending trend (3 or 6 months), category
  breakdown with shares, biggest expenses, and a plain-language insight
  per month.

All figures are the family's own records for September–November 2026
(amounts in Vietnamese dong), and every total is computed from the same
transaction list in `app/data.js`, so the pages can never disagree.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080/
```

Open the page in desktop Chrome or on a phone. The entry program is
`main.ts` (Node 22, standard library only); it copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` with the
vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/index.html` — shell, navigation, script tags
- `app/style.css` — forest green + cream + amber design, responsive
- `app/data.js` — the family's transactions, budgets and goals
- `app/store.js` — state, totals and localStorage persistence
- `app/charts.js` — SVG donut and bar charts
- `app/views.js` — the five page renderers
- `app/main.js` — hash router and control wiring
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged
