'use strict';
/* HomeLedger views — one renderer per hash route. Every figure is read
   from HLStore at render time, so an edit anywhere updates every view. */

var HLViews = (function () {
  var esc = HLCharts.esc;
  var S = HLStore;

  function monthPills(current, onPick) {
    return '<div class="pills" role="group" aria-label="Month">' +
      S.MONTHS.map(function (m) {
        return '<button type="button" class="pill' + (m.key === current ? ' on' : '') + '" data-month="' + m.key + '">' + m.short + ' ’26</button>';
      }).join('') + '</div>';
  }
  function wirePills(root, onPick) {
    root.querySelectorAll('[data-month]').forEach(function (b) {
      b.addEventListener('click', function () { onPick(b.getAttribute('data-month')); });
    });
  }
  function coverageLine(meta) {
    if (meta.partial) return '<span class="chip warn">Recorded spending, 1–26 Nov — November is a partial month</span>';
    return '<span class="chip">Full month · ' + meta.days + ' days of records</span>';
  }

  /* ---------------- dashboard ---------------- */
  function dashboard() {
    var st = S.state;
    var sum = S.summary(st.month);
    var meta = sum.meta;
    var att = S.attention(st.month);
    var spend = S.categorySpend(st.month);
    var totals = S.monthTotals();
    var latest = st.transactions.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 5);
    var goalRows = HL_DATA.goals.map(function (g) {
      var saved = st.goals.find(function (x) { return x.id === g.id; }).saved;
      var p = saved / g.target;
      return '<div class="goal-mini"><div class="goal-mini-top"><span>' + esc(g.name) + '</span><strong>' + S.fmt(saved) + ' <span class="dim">of ' + S.fmt(g.target) + '</span></strong></div>' +
        HLCharts.goalBar(p) + '<div class="goal-mini-pct">' + S.pct(p) + '% saved</div></div>';
    }).join('');

    var planRows = HL_DATA.categories.filter(function (c) { return c.limit != null; }).map(function (c) {
      var spent = spend[c.id] || 0;
      var limit = st.limits[c.id];
      return HLCharts.planRow({ name: c.name, spent: spent, limit: limit, pctUsed: spent / limit, over: spent - limit });
    }).join('');

    var attRows = att.rows.length ? att.rows.map(function (r) {
      var label = r.over > 0 ? 'over by ' + S.fmt(r.over) + ' (' + S.pct(r.over / r.limit) + '%)'
        : S.fmt(r.limit - r.spent) + ' left · ' + S.pct(r.pctUsed) + '% used';
      return '<li class="att-row"><a href="#/transactions?month=' + st.month + '&category=' + r.id + '">' +
        '<span class="att-name">' + esc(r.name) + '</span>' +
        '<span class="att-nums">' + S.fmt(r.spent) + ' <span class="dim">of ' + S.fmt(r.limit) + '</span></span>' +
        '<span class="att-label' + (r.over > 0 ? ' over' : '') + '">' + label + ' →</span></a></li>';
    }).join('') : '<li class="att-empty">Nothing is near its limit this month.</li>';
    var rentNote = att.rentPaid && att.rentPaid.pctUsed >= 0.85 && att.rentPaid.over <= 0
      ? '<p class="fine">Rent &amp; utilities is paid in full for ' + meta.short + ' — it is a fixed bill, not something to act on.</p>' : '';

    var latestRows = latest.map(function (t) {
      var sign = t.kind === 'income' ? '+' : t.kind === 'savings' ? '→ ' : '−';
      var cls = t.kind === 'income' ? 'inc' : t.kind === 'savings' ? 'sav' : 'exp';
      return '<li><span class="tx-date">' + t.date.slice(5) + '</span><span class="tx-desc">' + esc(t.desc) + '</span><span class="tx-amt ' + cls + '">' + sign + S.fmt(t.amount) + '</span></li>';
    }).join('');

    var verdictState = sum.remaining < 0 ? 'over' : sum.remaining / sum.budget < 0.1 ? 'near' : 'ok';
    var html =
      '<section class="page-head"><div><h1>Nguyen family · ' + meta.label + ' budget</h1>' +
      '<p class="sub">Hanoi · two adults + one child · ' + coverageLine(meta) + '</p></div>' +
      monthPills(st.month) + '</section>' +

      '<section class="verdict ' + verdictState + '" aria-label="Plan versus actual">' +
      '<div class="verdict-nums">' +
      '<div class="vnum"><span>Spent</span><strong>' + S.fmt(sum.spent) + '</strong><em>' + (meta.partial ? '1–26 Nov, recorded' : 'full month') + '</em></div>' +
      '<div class="vnum"><span>Budget</span><strong>' + S.fmt(sum.budget) + '</strong><em>8 categories</em></div>' +
      '<div class="vnum"><span>Remaining</span><strong>' + S.fmt(sum.remaining) + '</strong><em>' +
      (meta.partial ? sum.daysLeft + ' days left · safe to spend ' + S.fmt(sum.safeDaily) + ' a day' : 'month complete') + '</em></div>' +
      '</div>' +
      '<div class="verdict-bar">' + HLCharts.bar(sum.spent, sum.budget, sum.remaining < 0 ? 'over' : sum.usedPct >= 0.85 ? 'near' : 'ok') +
      '<span>' + S.pct(sum.usedPct) + '% of the ' + meta.short + ' budget used</span></div>' +
      '</section>' +

      '<div class="dash-grid">' +
      '<section class="card plan"><h2>Plan vs actual — ' + meta.short + '</h2>' + planRows +
      '<p class="fine">Spent counts the 8 budgeted categories. Savings transfers are not spending — they move money to a goal.</p></section>' +
      '<aside class="dash-side">' +
      '<section class="card"><h2>Needs attention</h2><ul class="att-list">' + attRows + '</ul>' + rentNote + '</section>' +
      '<section class="card"><h2>Family priorities</h2>' + goalRows +
      '<p class="fine"><a href="#/goals">See all goals →</a></p></section>' +
      '</aside></div>' +

      '<section class="card compare"><div class="compare-top"><h2>Spending by month</h2>' +
      '<p class="fine">November covers 1–26 Nov only. Compare daily averages, not totals, across a partial month.</p></div>' +
      HLCharts.monthColumns(totals) +
      '<p class="fine">* November is partial. Sep ₫31,400,000 · Oct ₫32,750,000 · Nov (1–26) ₫29,250,000.</p>' +
      '<h3>Latest transactions</h3><ul class="latest">' + latestRows + '</ul>' +
      '<p class="fine"><a href="#/transactions">All 99 transactions →</a></p></section>';
    return {
      html: html,
      wire: function (root) {
        wirePills(root, function (m) { S.state.month = m; S.save(); HLMain.render(); });
      }
    };
  }

  /* ---------------- transactions ---------------- */
  function transactions(params) {
    var st = S.state;
    var f = st.txFilter;
    if (params.month) f.month = params.month;
    if (params.category) f.category = params.category;
    if (params.kind) f.kind = params.kind;

    var list = st.transactions.filter(function (t) {
      if (f.month !== 'all' && S.monthOf(t.date) !== f.month) return false;
      if (f.category !== 'all' && t.category !== f.category) return false;
      if (f.kind !== 'all' && t.kind !== f.kind) return false;
      if (f.q && t.desc.toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
      return true;
    });
    var expTotal = list.filter(function (t) { return t.kind === 'expense'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var incTotal = list.filter(function (t) { return t.kind === 'income'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var savTotal = list.filter(function (t) { return t.kind === 'savings'; }).reduce(function (s, t) { return s + t.amount; }, 0);

    function sel(name, current, options) {
      return '<select name="' + name + '" aria-label="' + name + '">' + options.map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === current ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      }).join('') + '</select>';
    }
    var catOpts = [['all', 'All categories']].concat(HL_DATA.categories.map(function (c) { return [c.id, c.name]; }));

    var rows = list.map(function (t) {
      var cat = HL_DATA.categories.find(function (c) { return c.id === t.category; });
      var kindLabel = t.kind === 'income' ? 'Income' : t.kind === 'savings' ? 'Savings' : 'Expense';
      var amt = t.kind === 'income' ? '+' + S.fmt(t.amount) : t.kind === 'savings' ? '→ ' + S.fmt(t.amount) : '−' + S.fmt(t.amount);
      return '<tr data-id="' + t.id + '">' +
        '<td class="c-date">' + t.date + '</td>' +
        '<td class="c-desc">' + esc(t.desc) + '</td>' +
        '<td><span class="badge">' + esc(cat ? cat.name : t.category) + '</span></td>' +
        '<td>' + kindLabel + '</td>' +
        '<td class="c-amt ' + t.kind + '" data-amt="' + t.amount + '">' + amt + '</td>' +
        '<td class="c-act"><button type="button" class="mini" data-edit="' + t.id + '">Edit</button> ' +
        '<button type="button" class="mini danger" data-del="' + t.id + '">Delete</button></td></tr>';
    }).join('');

    var html =
      '<section class="page-head"><div><h1>Transactions</h1>' +
      '<p class="sub">Every dong in and out, 1 Sep – 26 Nov 2026. Add, edit or delete — every total updates at once.</p></div></section>' +
      '<section class="card"><form id="tx-filters" class="filters">' +
      sel('month', f.month, [['all', 'All months'], ['2026-09', 'September'], ['2026-10', 'October'], ['2026-11', 'November (1–26)']]) +
      sel('category', f.category, catOpts) +
      sel('kind', f.kind, [['all', 'All types'], ['expense', 'Expenses'], ['income', 'Income'], ['savings', 'Savings transfers']]) +
      '<input type="search" name="q" placeholder="Search descriptions…" value="' + esc(f.q) + '" aria-label="Search">' +
      '<button type="button" class="btn ghost" id="tx-clear">Clear</button></form>' +
      '<p class="totals-line"><strong>' + list.length + ' result' + (list.length === 1 ? '' : 's') + '</strong> · Expenses ' + S.fmt(expTotal) +
      ' · Income ' + S.fmt(incTotal) + ' · To savings ' + S.fmt(savTotal) + '</p>' +
      (list.length ? '<div class="table-wrap"><table class="tx-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th class="r">Amount</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<p class="empty">No transactions match these filters. <button type="button" class="linklike" id="tx-clear2">Clear the filters</button></p>') +
      '</section>' +
      '<section class="card"><h2>Add a transaction</h2>' +
      '<form id="tx-add" class="add-form">' +
      '<label>Date <input type="date" name="date" value="2026-11-26" min="2026-09-01" max="2026-11-26" required></label>' +
      '<label>Description <input type="text" name="desc" maxlength="80" placeholder="e.g. Weekly shop at Co.opmart" required></label>' +
      '<label>Category ' + sel('category', 'groceries', HL_DATA.categories.map(function (c) { return [c.id, c.name]; })) + '</label>' +
      '<label>Type ' + sel('kind', 'expense', [['expense', 'Expense'], ['income', 'Income'], ['savings', 'Savings transfer']]) + '</label>' +
      '<label>Amount (₫) <input type="number" name="amount" min="1000" step="1000" placeholder="500000" required></label>' +
      '<button type="submit" class="btn">Add transaction</button>' +
      '<span class="form-note" id="tx-note" role="status"></span></form></section>';
    return {
      html: html,
      wire: function (root) {
        var form = root.querySelector('#tx-filters');
        form.addEventListener('change', function () {
          f.month = form.month.value; f.category = form.category.value; f.kind = form.kind.value;
          HLMain.render();
        });
        form.q.addEventListener('input', function () { f.q = form.q.value; HLMain.render(true); });
        function clear() { f.month = 'all'; f.category = 'all'; f.kind = 'all'; f.q = ''; HLMain.render(); }
        root.querySelector('#tx-clear').addEventListener('click', clear);
        var c2 = root.querySelector('#tx-clear2');
        if (c2) c2.addEventListener('click', clear);
        root.querySelector('#tx-add').addEventListener('submit', function (e) {
          e.preventDefault();
          var fd = new FormData(e.target);
          var added = S.addTransaction({
            date: fd.get('date'), desc: fd.get('desc'), category: fd.get('category'),
            kind: fd.get('kind'), amount: Number(fd.get('amount'))
          });
          var note = root.querySelector('#tx-note');
          if (added) {
            note.textContent = 'Added — totals updated everywhere.';
            e.target.desc.value = ''; e.target.amount.value = '';
            HLMain.render();
            var n2 = document.querySelector('#tx-note');
            if (n2) n2.textContent = 'Added — totals updated everywhere.';
          } else {
            note.textContent = 'Check the date, description and amount, then try again.';
          }
        });
        root.querySelectorAll('[data-del]').forEach(function (b) {
          b.addEventListener('click', function () {
            var row = b.closest('tr');
            if (window.confirm('Delete "' + row.querySelector('.c-desc').textContent + '"?')) {
              S.deleteTransaction(b.getAttribute('data-del'));
              HLMain.render();
            }
          });
        });
        root.querySelectorAll('[data-edit]').forEach(function (b) {
          b.addEventListener('click', function () {
            var cell = b.closest('tr').querySelector('[data-amt]');
            var current = Number(cell.getAttribute('data-amt'));
            cell.innerHTML = '<input type="number" class="amt-edit" min="1000" step="1000" value="' + current + '" aria-label="New amount"> ' +
              '<button type="button" class="mini" data-save>Save</button> <button type="button" class="mini ghost" data-cancel>Cancel</button>';
            cell.querySelector('[data-save]').addEventListener('click', function () {
              var v = Number(cell.querySelector('.amt-edit').value);
              if (S.updateTransactionAmount(b.getAttribute('data-edit'), v)) HLMain.render();
              else cell.querySelector('.amt-edit').focus();
            });
            cell.querySelector('[data-cancel]').addEventListener('click', function () { HLMain.render(); });
            cell.querySelector('.amt-edit').focus();
          });
        });
      }
    };
  }

  /* ---------------- budgets ---------------- */
  function budgets() {
    var st = S.state;
    var spend = S.categorySpend(st.month);
    var meta = S.monthMeta(st.month);
    var rows = HL_DATA.categories.filter(function (c) { return c.limit != null; }).map(function (c) {
      var spent = spend[c.id] || 0;
      var limit = st.limits[c.id];
      var over = spent - limit;
      var state = over > 0 ? 'over' : spent / limit >= 0.85 ? 'near' : 'ok';
      return '<div class="budget-row"><div class="budget-main">' +
        '<div class="plan-top"><span class="plan-name">' + esc(c.name) + (over > 0 ? ' <span class="tag over">OVER</span>' : '') + '</span>' +
        '<span class="plan-nums">' + S.fmt(spent) + ' <span class="dim">spent</span></span></div>' +
        '<div class="plan-bar">' + HLCharts.bar(spent, limit, state) +
        '<span class="plan-pct">' + S.pct(spent / limit) + '%</span></div></div>' +
        '<label class="limit-edit">Monthly limit (₫) <input type="number" data-limit="' + c.id + '" value="' + limit + '" min="0" step="50000"></label>' +
        '<div class="budget-right">' + (over > 0 ? '<span class="fig over">' + S.fmt(over) + ' over</span>' : '<span class="fig">' + S.fmt(limit - spent) + ' left</span>') + '</div></div>';
    }).join('');

    var compRows = HL_DATA.categories.filter(function (c) { return c.limit != null; }).map(function (c) {
      function cell(m) {
        var s = (S.categorySpend(m)[c.id] || 0);
        var over = s - st.limits[c.id];
        return '<td class="' + (over > 0 ? 'over' : '') + '">' + S.fmtCompact(s) + (over > 0 ? ' ▲' : '') + '</td>';
      }
      return '<tr><td>' + esc(c.name) + '</td>' + cell('2026-09') + cell('2026-10') + cell('2026-11') + '<td>' + S.fmt(st.limits[c.id]) + '</td></tr>';
    }).join('');

    var html =
      '<section class="page-head"><div><h1>Budgets</h1>' +
      '<p class="sub">Monthly limits per category. Change a limit and the dashboard plan updates at once.</p></div>' +
      monthPills(st.month) + '</section>' +
      '<section class="card">' + rows +
      '<p class="fine">Limits apply to every month. Unspent budget does not roll over — each month starts fresh at its limit. ' +
      'November figures cover 1–26 Nov only.</p></section>' +
      '<section class="card"><h2>Month comparison — spent vs the same limit</h2>' +
      '<div class="table-wrap"><table class="tx-table comp"><thead><tr><th>Category</th><th>Sep</th><th>Oct</th><th>Nov (1–26)</th><th>Limit</th></tr></thead>' +
      '<tbody>' + compRows + '</tbody></table></div>' +
      '<p class="fine">▲ marks a month over its limit. October is the only full month with an over-limit category: Dining out, ₫340,000 over.</p></section>';
    return {
      html: html,
      wire: function (root) {
        wirePills(root, function (m) { S.state.month = m; S.save(); HLMain.render(); });
        root.querySelectorAll('[data-limit]').forEach(function (input) {
          input.addEventListener('change', function () {
            var v = Number(input.value);
            if (!S.setLimit(input.getAttribute('data-limit'), v)) input.value = S.state.limits[input.getAttribute('data-limit')];
            HLMain.render();
          });
        });
      }
    };
  }

  /* ---------------- goals ---------------- */
  function goals() {
    var cards = HL_DATA.goals.map(function (g) {
      var saved = S.state.goals.find(function (x) { return x.id === g.id; }).saved;
      var remaining = Math.max(g.target - saved, 0);
      var p = saved / g.target;
      var months = remaining > 0 ? Math.ceil(remaining / g.monthly) : 0;
      return '<article class="card goal-card"><h2>' + esc(g.name) + '</h2>' +
        '<p class="sub">' + esc(g.note) + '</p>' +
        '<div class="goal-nums"><strong>' + S.fmt(saved) + '</strong><span> saved of ' + S.fmt(g.target) + '</span></div>' +
        HLCharts.goalBar(p) +
        '<p class="goal-pct">' + S.pct(p) + '% saved · ' + (remaining > 0 ? S.fmt(remaining) + ' to go' : 'Reached!') + '</p>' +
        '<p class="fine">Usual contribution ' + S.fmt(g.monthly) + ' a month' +
        (remaining > 0 ? ' · about ' + months + ' month' + (months === 1 ? '' : 's') + ' to go at that pace.' : '') + '</p>' +
        '<form class="goal-add" data-goal="' + g.id + '">' +
        '<label>Add money (₫) <input type="number" name="amount" value="' + g.monthly + '" min="1000" step="1000" required></label>' +
        '<button type="submit" class="btn">Add money</button>' +
        '<span class="form-note" role="status"></span></form></article>';
    }).join('');
    return {
      html: '<section class="page-head"><div><h1>Family goals</h1>' +
        '<p class="sub">Three things the family is saving for. Money added here comes out of the monthly budget — it is the savings transfers in the transaction list.</p></div></section>' +
        '<div class="goals-grid">' + cards + '</div>',
      wire: function (root) {
        root.querySelectorAll('.goal-add').forEach(function (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            var v = Number(new FormData(form).get('amount'));
            var note = form.querySelector('.form-note');
            if (S.addGoalMoney(form.getAttribute('data-goal'), v)) {
              note.textContent = 'Added ' + S.fmt(v) + '.';
              HLMain.render();
              var n2 = document.querySelector('.goal-add[data-goal="' + form.getAttribute('data-goal') + '"] .form-note');
              if (n2) n2.textContent = 'Added ' + S.fmt(v) + '.';
            } else {
              note.textContent = 'Enter an amount above ₫0.';
            }
          });
        });
      }
    };
  }

  /* ---------------- reports ---------------- */
  function reports(params) {
    var period = params.period || 'all';
    var keys = period === 'all' ? ['2026-09', '2026-10', '2026-11'] : [period];
    var label = period === 'all' ? 'Sep–Nov 2026' : S.monthMeta(period).label;
    var bd = S.periodBreakdown(keys);
    var ins = S.insights();
    var totals = S.monthTotals();

    var totalCards = totals.map(function (t) {
      return '<div class="total-card"><span>' + t.label + (t.partial ? ' *' : '') + '</span><strong>' + S.fmt(t.spent) + '</strong>' +
        '<em>' + t.recorded + ' days · ' + S.fmt(Math.round(t.dailyAvg)) + ' a day</em></div>';
    }).join('');

    var breakdownRows = bd.rows.map(function (r) { return HLCharts.shareRow(r, bd.total); }).join('');

    var html =
      '<section class="page-head"><div><h1>Reports</h1>' +
      '<p class="sub">Where the money went, with the numbers behind every claim. * November covers 1–26 Nov only.</p></div>' +
      '<div class="pills" role="group" aria-label="Period">' +
      '<button type="button" class="pill' + (period === 'all' ? ' on' : '') + '" data-period="all">Sep–Nov</button>' +
      S.MONTHS.map(function (m) {
        return '<button type="button" class="pill' + (period === m.key ? ' on' : '') + '" data-period="' + m.key + '">' + m.short + '</button>';
      }).join('') + '</div></section>' +

      '<section class="totals-row">' + totalCards + '</section>' +

      '<div class="dash-grid">' +
      '<section class="card"><h2>Category breakdown — ' + label + '</h2>' + breakdownRows +
      '<p class="fine">Total spending ' + label + ': <strong>' + S.fmt(bd.total) + '</strong>. The bars above sum to it. Savings transfers are not spending and are not in this total.</p></section>' +
      '<aside class="dash-side">' +
      '<section class="card"><h2>What the numbers say</h2><ul class="insights">' +
      '<li><strong>Biggest cost: ' + esc(ins.biggest.name) + '.</strong> ' + S.fmt(ins.biggest.amount) + ' over Sep–Nov — ' + S.pct(ins.biggest.share) + '% of all spending. ' +
      '<a href="#/transactions?category=' + ins.biggest.id + '">See its transactions →</a></li>' +
      '<li><strong>October breach: ' + esc(ins.worst.name) + ' ran ' + S.fmt(ins.worst.over) + ' over its limit</strong> (' + S.pct(ins.worst.over / ins.worst.limit) + '% over) in October. ' +
      '<a href="#/transactions?month=2026-10&category=' + ins.worst.id + '">See ' + esc(ins.worst.name) + ' in October →</a> · <a href="#/budgets">Review its budget →</a></li>' +
      '<li><strong>September → October: spending rose ' + S.fmt(ins.totalDelta) + ' (' + S.pct(ins.totalDeltaPct) + '%).</strong> The biggest move was ' + esc(ins.biggestMove.name) + ', up ' + S.fmt(ins.biggestMove.delta) + ' (' + S.pct(ins.biggestMove.delta / ins.biggestMove.from) + '%). ' +
      'November is running at ' + S.fmt(Math.round(ins.novDaily)) + ' a day, ' + S.pct(ins.dailyDeltaPct) + '% above October’s daily pace — daily averages only, never partial-month totals.</li>' +
      '</ul></section>' +
      '<section class="card scenario"><h2>Scenario, not a forecast</h2>' +
      '<p>' + esc(ins.scenario.text) + ' October would have totalled <strong>' + S.fmt(ins.scenario.capped) + '</strong> instead of ' + S.fmt(ins.scenario.base) +
      ' — <strong>' + S.fmt(ins.scenario.saving) + ' (' + S.pct(ins.scenario.savingPct) + ')</strong> less. This is arithmetic on October’s own numbers, not a prediction.</p></section>' +
      '</aside></div>';
    return {
      html: html,
      wire: function (root) {
        root.querySelectorAll('[data-period]').forEach(function (b) {
          b.addEventListener('click', function () { HLMain.render(false, { period: b.getAttribute('data-period') }); });
        });
      }
    };
  }

  return { dashboard: dashboard, transactions: transactions, budgets: budgets, goals: goals, reports: reports };
})();
