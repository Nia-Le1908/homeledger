// HomeLedger views — one renderer per page. Each returns an HTML string
// for #view; main.js wires the controls with delegated events. Every number
// comes from store.js, so the pages can never disagree with each other.

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function monthButtons(current) {
  return MONTHS.map(function (m) {
    const on = m === current ? ' class="on" aria-current="true"' : "";
    return (
      '<button type="button" data-action="pick-month" data-month="' +
      m +
      '"' +
      on +
      ">" +
      shortMonth(m) +
      "</button>"
    );
  }).join("");
}

function txRowHTML(t, withActions) {
  const sign = t.type === "income" ? "+" : t.type === "savings" ? "→" : "−";
  const cls = t.type === "income" ? "income" : t.type === "savings" ? "savings" : "expense";
  let row =
    '<tr><td class="date">' +
    fmtDate(t.date) +
    "</td><td>" +
    esc(t.desc) +
    '</td><td><span class="cat-chip">' +
    esc(t.cat) +
    "</span></td>";
  if (withActions) {
    row +=
      '<td class="amount"><input type="number" min="1000" step="1000" value="' +
      t.amount +
      '" data-edit-amount="' +
      t.id +
      '" aria-label="Edit amount for ' +
      esc(t.desc) +
      '"></td>';
  } else {
    row += '<td class="amount ' + cls + '">' + sign + " " + fmtVND(t.amount) + "</td>";
  }
  if (withActions) {
    row +=
      '<td><button type="button" class="danger" data-action="delete-tx" data-id="' +
      t.id +
      '">Delete</button></td>';
  }
  return row + "</tr>";
}

// ---- Dashboard -------------------------------------------------------

function renderDashboard() {
  const month = store.month;
  const totals = totalsForMonth(month);
  const spent = spentByCategory(month);
  const budgetTotal = totalBudget(month);
  const budgetLeft = budgetTotal - totals.spending;
  const donutParts = CATEGORIES.filter(function (c) {
    return c !== "Savings";
  }).map(function (c) {
    return { label: c, value: spent[c] || 0, color: DONUT_COLORS[c] || "#999" };
  });
  const legend = donutParts
    .map(function (p) {
      const share = totals.spending > 0 ? Math.round((p.value / totals.spending) * 100) : 0;
      return (
        '<li><span class="dot" style="background:' +
        p.color +
        '"></span>' +
        esc(p.label) +
        ' <b>' +
        fmtVND(p.value) +
        "</b> · " +
        share +
        "%</li>"
      );
    })
    .join("");
  const bars = CATEGORIES.filter(function (c) {
    return c !== "Savings";
  })
    .map(function (c) {
      const lim = budgetFor(month, c);
      const sp = spent[c] || 0;
      const pct = lim > 0 ? Math.round((sp / lim) * 100) : 0;
      const over = sp > lim;
      return (
        '<div class="budget-row"><div class="budget-head"><span>' +
        esc(c) +
        "</span><span>" +
        fmtVND(sp) +
        " of " +
        fmtVND(lim) +
        (over ? ' <b class="over-flag">Over by ' + fmtPct(pct - 100) + "</b>" : "") +
        '</span></div><div class="budget-bar">' +
        budgetBarSVG(sp, lim, 260) +
        '</div><span class="budget-pct">' +
        pct +
        "%</span></div>"
      );
    })
    .join("");
  const recent = store.transactions
    .filter(function (t) {
      return monthOf(t) === month;
    })
    .sort(function (a, b) {
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    })
    .slice(0, 8);
  const goalSaved = store.goals.reduce(function (s, g) {
    return s + g.saved;
  }, 0);
  const goalTarget = store.goals.reduce(function (s, g) {
    return s + g.target;
  }, 0);
  const nextGoal = store.goals
    .filter(function (g) {
      return g.saved < g.target;
    })
    .sort(function (a, b) {
      return b.saved / b.target - a.saved / a.target;
    })[0];

  return (
    '<section class="page-head"><div><h1>Dashboard</h1><p class="lede">' +
    esc(HOUSEHOLD.name) +
    " · " +
    esc(HOUSEHOLD.home) +
    '</p></div><div class="month-switch" role="group" aria-label="Choose month">' +
    monthButtons(month) +
    "</div></section>" +
    '<section class="stats" aria-label="This month at a glance">' +
    '<div class="stat"><span class="stat-label">Income</span><strong class="stat-value income">' +
    fmtVND(totals.income) +
    '</strong><span class="stat-note">Salary + side income</span></div>' +
    '<div class="stat"><span class="stat-label">Spending</span><strong class="stat-value">' +
    fmtVND(totals.spending) +
    '</strong><span class="stat-note">Across 8 categories</span></div>' +
    '<div class="stat"><span class="stat-label">Saved</span><strong class="stat-value saved">' +
    fmtVND(totals.saved) +
    '</strong><span class="stat-note">Moved to savings: ' +
    fmtVND(totals.moved) +
    "</span></div>" +
    '<div class="stat"><span class="stat-label">Budget left</span><strong class="stat-value">' +
    fmtVND(budgetLeft) +
    '</strong><span class="stat-note">Of ' +
    fmtVND(budgetTotal) +
    " planned</span></div>" +
    "</section>" +
    '<div class="grid-2">' +
    '<section class="card"><h2>Where the money went</h2><div class="donut-wrap">' +
    donutSVG(donutParts, totals.spending, 220) +
    '<ul class="legend">' +
    legend +
    "</ul></div></section>" +
    '<section class="card"><h2>Budgets — ' +
    MONTH_LABELS[month] +
    "</h2>" +
    bars +
    '<p class="card-link"><a href="#/budgets">Manage all budgets →</a></p></section>' +
    "</div>" +
    '<div class="grid-2">' +
    '<section class="card"><h2>Recent transactions</h2><table class="tx-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="amount">Amount</th></tr></thead><tbody>' +
    recent.map(function (t) {
      return txRowHTML(t, false);
    }).join("") +
    '</tbody></table><p class="card-link"><a href="#/transactions">See all transactions →</a></p></section>' +
    '<section class="card"><h2>Savings goals</h2><p class="big-number">' +
    fmtVND(goalSaved) +
    ' <span>of ' +
    fmtVND(goalTarget) +
    " saved across " +
    store.goals.length +
    " goals</span></p>" +
    (nextGoal
      ? '<p>Closest to done: <b>' +
        esc(nextGoal.name) +
        "</b> — " +
        fmtPct(goalProgress(nextGoal) * 100) +
        " funded, " +
        fmtVND(nextGoal.target - nextGoal.saved) +
        " to go.</p>"
      : "<p>All goals are fully funded.</p>") +
    '<p class="card-link"><a href="#/goals">Open savings goals →</a></p></section>' +
    "</div>"
  );
}

// ---- Transactions ----------------------------------------------------

let txFilter = { month: "2026-11", category: "all", type: "all", search: "" };

function filteredTransactions() {
  const q = txFilter.search.trim().toLowerCase();
  return store.transactions
    .filter(function (t) {
      if (txFilter.month !== "all" && monthOf(t) !== txFilter.month) return false;
      if (txFilter.category !== "all" && t.cat !== txFilter.category) return false;
      if (txFilter.type !== "all" && t.type !== txFilter.type) return false;
      if (q && t.desc.toLowerCase().indexOf(q) === -1 && t.cat.toLowerCase().indexOf(q) === -1) return false;
      return true;
    })
    .sort(function (a, b) {
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });
}

function renderTransactions() {
  const rows = filteredTransactions();
  const monthOpts =
    '<option value="all">All months</option>' +
    MONTHS.map(function (m) {
      return (
        '<option value="' +
        m +
        '"' +
        (txFilter.month === m ? " selected" : "") +
        ">" +
        MONTH_LABELS[m] +
        "</option>"
      );
    }).join("");
  const catOpts =
    '<option value="all">All categories</option>' +
    CATEGORIES.map(function (c) {
      return (
        '<option value="' +
        esc(c) +
        '"' +
        (txFilter.category === c ? " selected" : "") +
        ">" +
        esc(c) +
        "</option>"
      );
    }).join("");
  const typeOpts = ["all", "income", "expense", "savings"]
    .map(function (t) {
      return (
        '<option value="' +
        t +
        '"' +
        (txFilter.type === t ? " selected" : "") +
        ">" +
        (t === "all" ? "Income & spending" : t.charAt(0).toUpperCase() + t.slice(1)) +
        "</option>"
      );
    })
    .join("");
  const body =
    rows.length > 0
      ? rows
          .map(function (t) {
            return txRowHTML(t, true);
          })
          .join("")
      : '<tr><td colspan="5" class="empty">No transactions match these filters. Try clearing the search.</td></tr>';
  return (
    '<section class="page-head"><div><h1>Transactions</h1><p class="lede">Every dong in and out, ' +
    MONTH_LABELS[txFilter.month] +
    ". Edit an amount in place, or delete a row.</p></div></section>" +
    '<section class="card filters"><div class="filter-row">' +
    '<label>Month <select data-filter="month">' +
    monthOpts +
    "</select></label>" +
    '<label>Category <select data-filter="category">' +
    catOpts +
    "</select></label>" +
    '<label>Type <select data-filter="type">' +
    typeOpts +
    "</select></label>" +
    '<label>Search <input type="search" data-filter="search" placeholder="e.g. Co.opmart" value="' +
    esc(txFilter.search) +
    '"></label>' +
    "</div>" +
    '<p class="count">' +
    rows.length +
    " transaction" +
    (rows.length === 1 ? "" : "s") +
    " shown</p>" +
    '<div class="table-scroll scroll-box"><table class="tx-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="amount">Amount (₫)</th><th></th></tr></thead><tbody>' +
    body +
    "</tbody></table></div></section>" +
    '<section class="card"><h2>Add a transaction</h2><form id="add-tx-form" class="form-grid">' +
    '<label>Date <input type="date" name="date" value="2026-11-27" required></label>' +
    '<label>Description <input type="text" name="desc" placeholder="e.g. Weekly shop at Co.opmart" required></label>' +
    '<label>Category <select name="cat">' +
    CATEGORIES.map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + "</option>";
    }).join("") +
    "</select></label>" +
    '<label>Amount (₫) <input type="number" name="amount" min="1000" step="1000" placeholder="850000" required></label>' +
    '<label>Type <select name="type"><option value="expense">Spending</option><option value="income">Income</option><option value="savings">To savings</option></select></label>' +
    '<button type="submit" class="primary">Add transaction</button>' +
    "</form>" +
    '<p id="tx-added" class="added-note" aria-live="polite"></p>' +
    '<p class="hint">Adding a transaction updates the dashboard, the budget bars and the reports at once — they all read the same data.</p></section>'
  );
}

// ---- Budgets ---------------------------------------------------------

function renderBudgets() {
  const month = store.month;
  const spent = spentByCategory(month);
  const prev = MONTHS[MONTHS.indexOf(month) - 1];
  const prevSpent = prev ? spentByCategory(prev) : null;
  const rows = CATEGORIES.filter(function (c) {
    return c !== "Savings";
  })
    .map(function (c) {
      const lim = budgetFor(month, c);
      const sp = spent[c] || 0;
      const pct = lim > 0 ? Math.round((sp / lim) * 100) : 0;
      const over = sp > lim;
      const prevCell = prevSpent
        ? "<td class=\"amount\">" + fmtVND(prevSpent[c] || 0) + "</td>"
        : '<td class="amount muted">—</td>';
      return (
        "<tr><td>" +
        esc(c) +
        "</td>" +
        '<td><input type="number" min="0" step="100000" value="' +
        lim +
        '" data-edit-budget="' +
        esc(c) +
        '" aria-label="Budget limit for ' +
        esc(c) +
        '"></td>' +
        '<td class="amount">' +
        fmtVND(sp) +
        "</td>" +
        prevCell +
        '<td><div class="mini-bar">' +
        budgetBarSVG(sp, lim, 140) +
        '</div></td><td class="' +
        (over ? "over-flag" : "") +
        '">' +
        pct +
        "%" +
        (over ? " · Over" : "") +
        "</td></tr>"
      );
    })
    .join("");
  const totals = totalsForMonth(month);
  const budgetTotal = totalBudget(month);
  return (
    '<section class="page-head"><div><h1>Budgets</h1><p class="lede">Monthly limits for ' +
    MONTH_LABELS[month] +
    '. Edit a limit in place — the bars and the dashboard update at once.</p></div>' +
    '<div class="month-switch" role="group" aria-label="Choose month">' +
    monthButtons(month) +
    "</div></section>" +
    '<section class="card"><div class="table-scroll"><table class="tx-table"><thead><tr><th>Category</th><th>Monthly limit (₫)</th><th class="amount">Spent</th><th class="amount">' +
    (prev ? shortMonth(prev) + " spent" : "Last month") +
    '</th><th>Progress</th><th></th></tr></thead><tbody>' +
    rows +
    "</tbody></table></div>" +
    '<p class="big-number">' +
    fmtVND(totals.spending) +
    " <span>spent of " +
    fmtVND(budgetTotal) +
    " planned (" +
    fmtPct((totals.spending / budgetTotal) * 100) +
    ")</span></p>" +
    '<p class="rollover"><b>Rollover:</b> whatever a category does not spend rolls into savings at the end of the month — that is how the family saved ' +
    fmtVND(totals.saved) +
    " in " +
    MONTH_LABELS[month] +
    ".</p></section>"
  );
}

// ---- Goals -----------------------------------------------------------

function renderGoals() {
  const cards = store.goals
    .map(function (g) {
      const frac = goalProgress(g);
      const left = g.target - g.saved;
      const monthsLeft = g.monthly > 0 ? Math.ceil(left / g.monthly) : 0;
      return (
        '<section class="card goal-card"><h2>' +
        esc(g.name) +
        "</h2><p>" +
        esc(g.note) +
        "</p>" +
        '<p class="big-number">' +
        fmtVND(g.saved) +
        ' <span>of ' +
        fmtVND(g.target) +
        "</span></p>" +
        goalBarSVG(frac, 260) +
        "<p>" +
        fmtPct(frac * 100) +
        " funded · " +
        fmtVND(left) +
        " to go · " +
        fmtVND(g.monthly) +
        " a month · about " +
        monthsLeft +
        (monthsLeft === 1 ? " month" : " months") +
        " left</p>" +
        '<form class="goal-form" data-goal="' +
        g.id +
        '"><label>Add money (₫) <input type="number" name="amount" min="1000" step="1000" placeholder="500000" required></label><button type="submit" class="primary">Add to goal</button></form></section>'
      );
    })
    .join("");
  const totalSaved = store.goals.reduce(function (s, g) {
    return s + g.saved;
  }, 0);
  const totalTarget = store.goals.reduce(function (s, g) {
    return s + g.target;
  }, 0);
  return (
    '<section class="page-head"><div><h1>Savings goals</h1><p class="lede">Three things the family is saving for. Add money to a goal and watch its bar move.</p></div></section>' +
    '<section class="card"><p class="big-number">' +
    fmtVND(totalSaved) +
    ' <span>of ' +
    fmtVND(totalTarget) +
    " across " +
    store.goals.length +
    " goals (" +
    fmtPct((totalSaved / totalTarget) * 100) +
    ")</span></p>" +
    '<p>Each month the family plans to set aside ' +
    fmtVND(
      store.goals.reduce(function (s, g) {
        return s + g.monthly;
      }, 0)
    ) +
    " across these goals, on top of the end-of-month sweep.</p></section>" +
    '<div class="grid-3">' +
    cards +
    "</div>"
  );
}

// ---- Reports ---------------------------------------------------------

let reportRange = "3m";

function trendRows() {
  const rows = [];
  const months = reportRange === "6m" ? PAST_MONTHS.concat(MONTHS) : MONTHS;
  months.forEach(function (m) {
    let income;
    let spending;
    if (PAST_SUMMARY[m]) {
      income = PAST_SUMMARY[m].income;
      spending = PAST_SUMMARY[m].spending;
    } else {
      const t = totalsForMonth(m);
      income = t.income;
      spending = t.spending;
    }
    rows.push({ label: shortMonth(m), income: income, spending: spending });
  });
  return rows;
}

function renderReports() {
  const rows = trendRows();
  const month = store.month;
  const spent = spentByCategory(month);
  const totals = totalsForMonth(month);
  const breakdown = CATEGORIES.filter(function (c) {
    return c !== "Savings";
  })
    .map(function (c) {
      return { cat: c, value: spent[c] || 0 };
    })
    .sort(function (a, b) {
      return b.value - a.value;
    })
    .map(function (r) {
      const share = totals.spending > 0 ? Math.round((r.value / totals.spending) * 100) : 0;
      return (
        "<tr><td>" +
        esc(r.cat) +
        '</td><td class="amount">' +
        fmtVND(r.value) +
        "</td><td>" +
        share +
        "%</td></tr>"
      );
    })
    .join("");
  const biggest = biggestExpenses(month, 5)
    .map(function (t) {
      return (
        "<li>" +
        esc(t.desc) +
        ' <span class="muted">(' +
        fmtDate(t.date) +
        ")</span> <b>" +
        fmtVND(t.amount) +
        "</b></li>"
      );
    })
    .join("");
  const insights = MONTHS.map(function (m) {
    return (
      '<div class="insight"><h3>' +
      MONTH_LABELS[m] +
      "</h3><p>" +
      esc(INSIGHTS[m]) +
      "</p></div>"
    );
  }).join("");
  return (
    '<section class="page-head"><div><h1>Reports</h1><p class="lede">Trends, breakdowns and the biggest spends — all computed from the same transactions as the dashboard.</p></div></section>' +
    '<section class="card"><div class="chart-head"><h2>Income vs spending</h2><div class="month-switch" role="group" aria-label="Trend range"><button type="button" data-action="pick-range" data-range="3m"' +
    (reportRange === "3m" ? ' class="on" aria-current="true"' : "") +
    '>3 months</button><button type="button" data-action="pick-range" data-range="6m"' +
    (reportRange === "6m" ? ' class="on" aria-current="true"' : "") +
    ">6 months</button></div></div>" +
    '<div class="chart-legend"><span><span class="dot" style="background:#1e4d3b"></span>Income</span><span><span class="dot" style="background:#d97706"></span>Spending</span></div>' +
    trendSVG(rows, 640, 260) +
    (reportRange === "6m"
      ? '<p class="hint">June–August are shown as monthly totals; the family started recording every transaction in September.</p>'
      : "") +
    "</section>" +
    '<div class="grid-2">' +
    '<section class="card"><h2>Where November\'s money went</h2><table class="tx-table"><thead><tr><th>Category</th><th class="amount">Spent</th><th>Share</th></tr></thead><tbody>' +
    breakdown +
    "</tbody></table></section>" +
    '<section class="card"><h2>Biggest expenses — ' +
    MONTH_LABELS[month] +
    "</h2><ol class=\"big-list\">" +
    biggest +
    "</ol></section>" +
    "</div>" +
    '<section class="card"><h2>What the numbers say</h2><div class="insights">' +
    insights +
    "</div></section>"
  );
}
