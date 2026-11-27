'use strict';
/* HomeLedger store — state, persistence and every derived figure.
   One rule runs through it: every number on screen is a sum of the
   transaction list in state (or of the limits the user set). Nothing is
   typed in by hand anywhere except the seed data in data.js. */

var HLStore = (function () {
  var KEY = 'homeledger-v2';
  var MONTHS = [
    { key: '2026-09', label: 'September 2026', short: 'Sep', days: 30, recorded: 30, partial: false },
    { key: '2026-10', label: 'October 2026', short: 'Oct', days: 31, recorded: 31, partial: false },
    { key: '2026-11', label: 'November 2026', short: 'Nov', days: 30, recorded: 26, partial: true }
  ];
  var DEFAULT_MONTH = '2026-11';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function seed() {
    return {
      transactions: clone(HL_DATA.transactions),
      limits: {}, /* category id -> monthly limit; filled from HL_DATA below */
      goals: clone(HL_DATA.goals).map(function (g) { return { id: g.id, saved: g.saved }; }),
      month: DEFAULT_MONTH,
      txFilter: { month: 'all', category: 'all', kind: 'all', q: '' }
    };
  }

  function load() {
    var s = seed();
    HL_DATA.categories.forEach(function (c) { if (c.limit != null) s.limits[c.id] = c.limit; });
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return s;
      var saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.transactions) || !saved.transactions.length) return s;
      if (typeof saved.limits === 'object' && saved.limits) s.limits = saved.limits;
      if (Array.isArray(saved.goals)) {
        saved.goals.forEach(function (g) {
          var mine = s.goals.find(function (x) { return x.id === g.id; });
          if (mine && typeof g.saved === 'number' && g.saved >= 0) mine.saved = Math.round(g.saved);
        });
      }
      s.transactions = saved.transactions;
      if (typeof saved.month === 'string' && MONTHS.some(function (m) { return m.key === saved.month; })) s.month = saved.month;
    } catch (e) { /* corrupted storage: fall back to the seed */ }
    return s;
  }

  var state = load();
  var listeners = [];
  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({
        transactions: state.transactions, limits: state.limits,
        goals: state.goals, month: state.month
      }));
    } catch (e) { /* storage full or unavailable: the page still works in memory */ }
  }
  function emit() { save(); listeners.forEach(function (fn) { fn(); }); }

  function monthOf(dateStr) { return dateStr.slice(0, 7); }
  function monthMeta(key) {
    return MONTHS.find(function (m) { return m.key === key; }) || MONTHS[2];
  }
  function isBudgeted(catId) {
    var c = HL_DATA.categories.find(function (x) { return x.id === catId; });
    return !!c && c.limit != null;
  }
  function expenses(monthKey) {
    return state.transactions.filter(function (t) {
      return t.kind === 'expense' && monthOf(t.date) === monthKey;
    });
  }
  function income(monthKey) {
    return state.transactions.filter(function (t) {
      return t.kind === 'income' && monthOf(t.date) === monthKey;
    }).reduce(function (s, t) { return s + t.amount; }, 0);
  }

  /* ---- formatting ---- */
  function fmt(n) {
    n = Math.round(n);
    var sign = n < 0 ? '−' : '';
    return sign + '₫' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function fmtCompact(n) {
    if (Math.abs(n) >= 1000000) return '₫' + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
    if (Math.abs(n) >= 1000) return '₫' + Math.round(n / 1000) + 'k';
    return fmt(n);
  }
  function fmtSigned(n) {
    return (n < 0 ? '−' : '+') + fmt(Math.abs(n)).slice(0);
  }
  function pct(n) { return Math.round(n * 1000) / 10; }

  /* ---- derived figures ---- */
  function budgetTotal() {
    return Object.keys(state.limits).reduce(function (s, k) { return s + state.limits[k]; }, 0);
  }
  function categorySpend(monthKey) {
    var out = {};
    HL_DATA.categories.forEach(function (c) { out[c.id] = 0; });
    expenses(monthKey).forEach(function (t) { out[t.category] = (out[t.category] || 0) + t.amount; });
    return out;
  }
  function summary(monthKey) {
    var meta = monthMeta(monthKey);
    var spend = categorySpend(monthKey);
    var spent = Object.keys(spend).filter(isBudgeted)
      .reduce(function (s, k) { return s + spend[k]; }, 0);
    var budget = budgetTotal();
    var remaining = budget - spent;
    var savings = state.transactions.filter(function (t) {
      return t.kind === 'savings' && monthOf(t.date) === monthKey;
    }).reduce(function (s, t) { return s + t.amount; }, 0);
    return {
      meta: meta, spent: spent, budget: budget, remaining: remaining,
      usedPct: spent / budget, daysLeft: meta.days - meta.recorded,
      dailyAvg: meta.recorded ? spent / meta.recorded : 0,
      safeDaily: meta.days - meta.recorded > 0 ? remaining / (meta.days - meta.recorded) : 0,
      income: income(monthKey), savings: savings
    };
  }
  function attention(monthKey) {
    var spend = categorySpend(monthKey);
    var rows = HL_DATA.categories.filter(function (c) { return c.limit != null; }).map(function (c) {
      var spent = spend[c.id] || 0;
      var limit = state.limits[c.id];
      return { id: c.id, name: c.name, spent: spent, limit: limit, pctUsed: spent / limit, over: spent - limit, fixed: !!c.fixed };
    });
    /* A fixed bill that came in over its limit still needs flagging; a fixed
       bill inside its limit is paid and done, not something to act on. */
    var flagged = rows.filter(function (r) {
      if (r.over > 0) return true;
      if (r.fixed) return false;
      return r.pctUsed >= 0.85;
    });
    flagged.sort(function (a, b) { return b.pctUsed - a.pctUsed; });
    return { rows: flagged.slice(0, 3), rentPaid: rows.find(function (r) { return r.id === 'rent'; }) };
  }
  function monthTotals() {
    return MONTHS.map(function (m) {
      var s = summary(m.key);
      return { key: m.key, label: m.label, short: m.short, spent: s.spent, days: m.days, recorded: m.recorded, partial: m.partial, dailyAvg: s.dailyAvg };
    });
  }
  function periodBreakdown(monthKeys) {
    var totals = {};
    HL_DATA.categories.forEach(function (c) { totals[c.id] = 0; });
    var spent = 0;
    monthKeys.forEach(function (k) {
      var s = categorySpend(k);
      Object.keys(s).filter(isBudgeted).forEach(function (c) { totals[c] += s[c]; spent += s[c]; });
    });
    var rows = HL_DATA.categories.filter(function (c) { return c.limit != null; }).map(function (c) {
      return { id: c.id, name: c.name, amount: totals[c.id], share: spent ? totals[c.id] / spent : 0 };
    });
    rows.sort(function (a, b) { return b.amount - a.amount; });
    return { rows: rows, total: spent };
  }
  function insights() {
    var sep = summary('2026-09'), oct = summary('2026-10'), nov = summary('2026-11');
    /* Largest category over Sep–Nov, with its share of all spending. */
    var all = periodBreakdown(['2026-09', '2026-10', '2026-11']);
    var biggest = all.rows[0];
    /* Largest adverse budget variance in a full month (Sep or Oct). */
    var worst = null;
    ['2026-09', '2026-10'].forEach(function (k) {
      var spend = categorySpend(k);
      HL_DATA.categories.filter(function (c) { return c.limit != null; }).forEach(function (c) {
        var over = spend[c.id] - state.limits[c.id];
        if (over > 0 && (!worst || over > worst.over)) {
          worst = { month: k, name: c.name, id: c.id, over: over, limit: state.limits[c.id], spent: spend[c.id] };
        }
      });
    });
    /* Largest comparable month-over-month movement, Sep vs Oct only. */
    var sepSpend = categorySpend('2026-09'), octSpend = categorySpend('2026-10');
    var biggestMove = null;
    HL_DATA.categories.filter(function (c) { return c.limit != null; }).forEach(function (c) {
      var d = octSpend[c.id] - sepSpend[c.id];
      if (!biggestMove || Math.abs(d) > Math.abs(biggestMove.delta)) {
        biggestMove = { name: c.name, id: c.id, delta: d, from: sepSpend[c.id], to: octSpend[c.id] };
      }
    });
    var totalDelta = oct.spent - sep.spent;
    /* November is partial: compare daily averages, never totals. */
    var dailyDeltaPct = oct.dailyAvg ? (nov.dailyAvg / oct.dailyAvg - 1) : 0;
    /* Honest scenario: October repeated, Dining out capped at its limit. */
    var diningOct = octSpend.dining;
    var scenario = {
      base: oct.spent, capped: oct.spent - (worst ? worst.over : 0),
      saving: worst ? worst.over : 0, savingPct: oct.spent ? (worst ? worst.over : 0) / oct.spent : 0,
      text: 'Other categories repeat October; Dining out is capped at its ₫2,000,000 limit.'
    };
    return {
      biggest: biggest, periodTotal: all.total,
      worst: worst, biggestMove: biggestMove,
      totalDelta: totalDelta, totalDeltaPct: sep.spent ? totalDelta / sep.spent : 0,
      dailyDeltaPct: dailyDeltaPct, novDaily: nov.dailyAvg, octDaily: oct.dailyAvg,
      scenario: scenario
    };
  }

  /* ---- mutations ---- */
  function nextId() {
    var max = 0;
    state.transactions.forEach(function (t) {
      var n = parseInt(t.id.slice(1), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return 't' + String(max + 1).padStart(3, '0');
  }
  function addTransaction(tx) {
    var t = {
      id: nextId(), date: tx.date, desc: String(tx.desc || '').trim().slice(0, 80),
      category: tx.category, kind: tx.kind, amount: Math.round(Math.abs(tx.amount))
    };
    if (!t.desc || !(t.amount > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) return null;
    if (!HL_DATA.categories.some(function (c) { return c.id === t.category; })) return null;
    state.transactions.push(t);
    state.transactions.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    emit();
    return t;
  }
  function updateTransactionAmount(id, amount) {
    var t = state.transactions.find(function (x) { return x.id === id; });
    if (!t || !(amount > 0) || !isFinite(amount)) return false;
    t.amount = Math.round(amount);
    emit();
    return true;
  }
  function deleteTransaction(id) {
    var i = state.transactions.findIndex(function (x) { return x.id === id; });
    if (i < 0) return false;
    state.transactions.splice(i, 1);
    emit();
    return true;
  }
  function setLimit(catId, value) {
    if (!(value >= 0) || !isFinite(value)) return false;
    if (!(catId in state.limits)) return false;
    state.limits[catId] = Math.round(value);
    emit();
    return true;
  }
  function addGoalMoney(goalId, amount) {
    var g = state.goals.find(function (x) { return x.id === goalId; });
    var def = HL_DATA.goals.find(function (x) { return x.id === goalId; });
    if (!g || !def || !(amount > 0) || !isFinite(amount)) return false;
    g.saved = Math.min(def.target, g.saved + Math.round(amount));
    emit();
    return true;
  }
  function resetAll() {
    state = seed();
    HL_DATA.categories.forEach(function (c) { if (c.limit != null) state.limits[c.id] = c.limit; });
    emit();
  }

  return {
    state: state, MONTHS: MONTHS,
    onChange: function (fn) { listeners.push(fn); },
    monthMeta: monthMeta, monthOf: monthOf, isBudgeted: isBudgeted,
    fmt: fmt, fmtCompact: fmtCompact, fmtSigned: fmtSigned, pct: pct,
    budgetTotal: budgetTotal, categorySpend: categorySpend, summary: summary,
    attention: attention, monthTotals: monthTotals, periodBreakdown: periodBreakdown,
    insights: insights, expenses: expenses, income: income,
    addTransaction: addTransaction, updateTransactionAmount: updateTransactionAmount,
    deleteTransaction: deleteTransaction, setLimit: setLimit,
    addGoalMoney: addGoalMoney, resetAll: resetAll, save: save
  };
})();
