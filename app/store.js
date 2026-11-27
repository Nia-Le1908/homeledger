// HomeLedger store — the family's budget state, totals and persistence.
// All figures shown anywhere on the site come from these helpers, so the
// dashboard, the budget bars and the reports always agree with each other.
// User edits (added, deleted or edited transactions, budget limits, goal
// contributions) are kept in localStorage; on first visit the store seeds
// itself from the built-in data in data.js.

const STORE_KEY = "homeledger-v1";

const store = {
  month: "2026-11",
  transactions: [],
  budgets: {},
  goals: [],
  loaded: false,
};

// Deep-copy the seed data so edits never mutate the built-in figures.
function cloneSeed() {
  return {
    transactions: SEED_TRANSACTIONS.map(function (t) {
      return { id: t.id, date: t.date, desc: t.desc, cat: t.cat, amount: t.amount, type: t.type };
    }),
    budgets: JSON.parse(JSON.stringify(BUDGETS)),
    goals: GOALS.map(function (g) {
      return { id: g.id, name: g.name, note: g.note, target: g.target, saved: g.saved, monthly: g.monthly };
    }),
  };
}

function loadStore() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
  } catch (e) {
    saved = null;
  }
  const seed = cloneSeed();
  if (saved && Array.isArray(saved.transactions) && saved.transactions.length > 0) {
    store.transactions = saved.transactions;
    store.budgets = saved.budgets || seed.budgets;
    store.goals = saved.goals || seed.goals;
  } else {
    store.transactions = seed.transactions;
    store.budgets = seed.budgets;
    store.goals = seed.goals;
  }
  store.loaded = true;
}

function saveStore() {
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        transactions: store.transactions,
        budgets: store.budgets,
        goals: store.goals,
      })
    );
  } catch (e) {
    // Storage full or unavailable (private mode): the site still works,
    // changes just do not survive a reload.
  }
}

function resetStore() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch (e) {}
  const seed = cloneSeed();
  store.transactions = seed.transactions;
  store.budgets = seed.budgets;
  store.goals = seed.goals;
}

// ---- formatting -------------------------------------------------------

function fmtVND(n) {
  const sign = n < 0 ? "−" : "";
  return sign + "₫" + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtPct(n) {
  return Math.round(n) + "%";
}

function fmtDate(iso) {
  const parts = iso.split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

function shortMonth(isoMonth) {
  const labels = {
    "2026-06": "Jun",
    "2026-07": "Jul",
    "2026-08": "Aug",
    "2026-09": "Sep",
    "2026-10": "Oct",
    "2026-11": "Nov",
  };
  return labels[isoMonth] || isoMonth;
}

// ---- queries ---------------------------------------------------------

function monthOf(tx) {
  return tx.date.slice(0, 7);
}

function txsForMonth(month) {
  return store.transactions.filter(function (t) {
    return monthOf(t) === month;
  });
}

// Income, spending (excluding savings transfers) and saved money for a
// month. "Saved" is income minus spending; it equals the month's savings
// transfer because the family sweeps whatever is left into savings.
function totalsForMonth(month) {
  let income = 0;
  let spending = 0;
  let moved = 0;
  txsForMonth(month).forEach(function (t) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") spending += t.amount;
    else if (t.type === "savings") moved += t.amount;
  });
  return { income: income, spending: spending, saved: income - spending, moved: moved };
}

function spentByCategory(month) {
  const out = {};
  CATEGORIES.forEach(function (c) {
    out[c] = 0;
  });
  txsForMonth(month).forEach(function (t) {
    if (t.type === "expense" && out[t.cat] !== undefined) out[t.cat] += t.amount;
  });
  return out;
}

function budgetFor(month, category) {
  const m = store.budgets[month] || {};
  return m[category] || 0;
}

function totalBudget(month) {
  return Object.keys(store.budgets[month] || {}).reduce(function (s, c) {
    return s + store.budgets[month][c];
  }, 0);
}

// ---- mutations -------------------------------------------------------

let nextId = 1000;

function nextTxId() {
  nextId += 1;
  return "u" + nextId + "-" + Date.now().toString(36);
}

function addTransaction(tx) {
  const row = {
    id: nextTxId(),
    date: tx.date,
    desc: tx.desc,
    cat: tx.cat,
    amount: Math.round(tx.amount),
    type: tx.type,
  };
  store.transactions.push(row);
  saveStore();
  return row;
}

function deleteTransaction(id) {
  store.transactions = store.transactions.filter(function (t) {
    return t.id !== id;
  });
  saveStore();
}

function updateTransactionAmount(id, amount) {
  const tx = store.transactions.find(function (t) {
    return t.id === id;
  });
  if (!tx) return false;
  const n = Math.round(Number(amount));
  if (!isFinite(n) || n <= 0) return false;
  tx.amount = n;
  saveStore();
  return true;
}

function setBudget(month, category, limit) {
  const n = Math.round(Number(limit));
  if (!isFinite(n) || n < 0) return false;
  if (!store.budgets[month]) store.budgets[month] = {};
  store.budgets[month][category] = n;
  saveStore();
  return true;
}

function addToGoal(id, amount) {
  const goal = store.goals.find(function (g) {
    return g.id === id;
  });
  if (!goal) return false;
  const n = Math.round(Number(amount));
  if (!isFinite(n) || n <= 0) return false;
  goal.saved = Math.min(goal.target, goal.saved + n);
  saveStore();
  return true;
}

function goalProgress(goal) {
  return goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
}

// Biggest single expenses of a month, largest first.
function biggestExpenses(month, count) {
  return txsForMonth(month)
    .filter(function (t) {
      return t.type === "expense";
    })
    .sort(function (a, b) {
      return b.amount - a.amount;
    })
    .slice(0, count);
}
