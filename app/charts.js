'use strict';
/* HomeLedger charts — small inline-SVG bars. Text lives in HTML around
   the SVG so it stays crisp; the SVG draws only the bar itself. Amounts
   are always labelled with words, never by colour alone. */

var HLCharts = (function () {
  var GREEN = '#1d5c33';
  var AMBER = '#b45309';
  var OVER = '#8c2f1b';
  var TRACK = '#e7dfcd';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* One horizontal bar: a track with a fill proportional to value/max.
     state: 'ok' | 'near' (>=85% of the limit) | 'over' (past the limit).
     The state is always written out in words next to the bar as well. */
  function bar(value, max, state) {
    var ratio = max > 0 ? Math.min(value / max, 1) : 0;
    var colour = state === 'over' ? OVER : state === 'near' ? AMBER : GREEN;
    var w = Math.max(ratio * 100, value > 0 ? 1.5 : 0);
    return '<svg class="bar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect x="0" y="0" width="100" height="10" rx="2" fill="' + TRACK + '"/>' +
      '<rect x="0" y="0" width="' + w.toFixed(1) + '" height="10" rx="2" fill="' + colour + '"/>' +
      '</svg>';
  }

  /* Plan-vs-actual row for one category: name, spent of limit, the bar,
     and a right-hand figure (remaining, or the over amount with OVER). */
  function planRow(row) {
    var state = row.over > 0 ? 'over' : row.pctUsed >= 0.85 ? 'near' : 'ok';
    var right = row.over > 0
      ? '<span class="fig over">₫' + fmtNum(row.over) + ' over</span>'
      : '<span class="fig">' + HLStore.fmt(row.limit - row.spent) + ' left</span>';
    var tag = row.over > 0 ? ' <span class="tag over">OVER</span>'
      : row.pctUsed >= 0.9 ? ' <span class="tag near">Near limit</span>' : '';
    return '<div class="plan-row">' +
      '<div class="plan-top"><span class="plan-name">' + esc(row.name) + tag + '</span>' +
      '<span class="plan-nums">' + HLStore.fmt(row.spent) + ' <span class="dim">of ' + HLStore.fmt(row.limit) + '</span></span></div>' +
      '<div class="plan-bar">' + bar(row.spent, row.limit, state) +
      '<span class="plan-pct">' + HLStore.pct(row.pctUsed) + '%</span></div>' +
      '<div class="plan-right">' + right + '</div>' +
      '</div>';
  }

  /* Three month columns (Sep / Oct / Nov) with value labels. November is
     drawn with a hatch pattern note in the caption, never as a full bar. */
  function monthColumns(months) {
    var max = Math.max.apply(null, months.map(function (m) { return m.spent; }));
    var cols = months.map(function (m) {
      var h = max > 0 ? Math.round((m.spent / max) * 120) : 0;
      var fill = m.partial ? 'url(#novhatch)' : GREEN;
      return '<div class="mcol">' +
        '<div class="mcol-val">' + HLStore.fmtCompact(m.spent) + '</div>' +
        '<svg class="mcol-bar" viewBox="0 0 40 120" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs><pattern id="novhatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
        '<rect width="6" height="6" fill="' + GREEN + '"/><rect width="3" height="6" fill="#2e7a45"/></pattern></defs>' +
        '<rect x="4" y="' + (120 - h) + '" width="32" height="' + h + '" rx="3" fill="' + fill + '"/>' +
        '</svg>' +
        '<div class="mcol-name">' + esc(m.short) + (m.partial ? ' *' : '') + '</div>' +
        '<div class="mcol-note">' + (m.partial ? '1–26 Nov' : m.days + ' days') + '</div>' +
        '</div>';
    }).join('');
    return '<div class="month-cols">' + cols + '</div>';
  }

  /* Breakdown row for the reports page: bar + amount + share, summing
     to the period total shown above it. */
  function shareRow(row, total) {
    return '<div class="plan-row">' +
      '<div class="plan-top"><span class="plan-name">' + esc(row.name) + '</span>' +
      '<span class="plan-nums">' + HLStore.fmt(row.amount) + ' <span class="dim">· ' + HLStore.pct(row.share) + '%</span></span></div>' +
      '<div class="plan-bar">' + bar(row.amount, total, 'ok') +
      '<span class="plan-pct">' + HLStore.pct(row.share) + '%</span></div>' +
      '</div>';
  }

  /* Slim progress bar for a goal card. */
  function goalBar(pctUsed) {
    var w = Math.max(Math.min(pctUsed, 1) * 100, pctUsed > 0 ? 2 : 0);
    return '<svg class="bar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect x="0" y="0" width="100" height="10" rx="2" fill="' + TRACK + '"/>' +
      '<rect x="0" y="0" width="' + w.toFixed(1) + '" height="10" rx="2" fill="' + AMBER + '"/>' +
      '</svg>';
  }

  function fmtNum(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return { bar: bar, planRow: planRow, monthColumns: monthColumns, shareRow: shareRow, goalBar: goalBar, esc: esc };
})();
