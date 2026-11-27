// HomeLedger charts — small SVG builders for the donut and the bar charts.
// No chart library: each function takes plain numbers and returns an SVG
// string, so the pictures always match the figures in store.js.

const DONUT_COLORS = {
  "Groceries": "#2e7d5b",
  "Rent & utilities": "#1e4d3b",
  "Transport": "#7fb069",
  "Dining out": "#d97706",
  "Health": "#4f9d8f",
  "Entertainment": "#e9b44c",
  "Kids & school": "#8a6fb8",
  "Home": "#a65d3a",
};

// A donut of how one month's spending splits across categories.
// parts: [{label, value, color}]. Center shows the month's total spending.
function donutSVG(parts, total, size) {
  size = size || 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const inner = r - 30;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = parts
    .filter(function (p) {
      return p.value > 0;
    })
    .map(function (p) {
      const frac = total > 0 ? p.value / total : 0;
      const len = frac * circ;
      const gap = frac > 0 ? 2 : 0;
      const s =
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="' +
        r +
        '" fill="none" stroke="' +
        p.color +
        '" stroke-width="30" stroke-dasharray="' +
        Math.max(0, len - gap).toFixed(1) +
        " " +
        (circ - Math.max(0, len - gap)).toFixed(1) +
        '" stroke-dashoffset="' +
        (-offset).toFixed(1) +
        '" transform="rotate(-90 ' +
        cx +
        " " +
        cy +
        ')"/>';
      offset += len;
      return s;
    })
    .join("");
  const center =
    '<text x="' +
    cx +
    '" y="' +
    (cy - 6) +
    '" text-anchor="middle" class="donut-total">' +
    fmtVND(total) +
    '</text><text x="' +
    cx +
    '" y="' +
    (cy + 18) +
    '" text-anchor="middle" class="donut-label">spent this month</text>';
  return (
    '<svg viewBox="0 0 ' +
    size +
    " " +
    size +
    '" role="img" aria-label="Spending by category donut chart">' +
    '<circle cx="' +
    cx +
    '" cy="' +
    cy +
    '" r="' +
    inner +
    '" fill="none" stroke="#eef2ea" stroke-width="1"/>' +
    arcs +
    center +
    "</svg>"
  );
}

// A horizontal budget bar: spent against the limit. Over-budget bars turn
// amber and carry an "Over" flag.
function budgetBarSVG(spent, limit, width) {
  width = width || 220;
  const ratio = limit > 0 ? spent / limit : 0;
  const fillW = Math.min(width, Math.round((spent / Math.max(limit, 1)) * width));
  const over = ratio > 1;
  const color = over ? "#d97706" : "#2e7d5b";
  return (
    '<svg viewBox="0 0 ' +
    width +
    ' 14" class="bar-svg" role="img" aria-label="Spent ' +
    fmtVND(spent) +
    " of " +
    fmtVND(limit) +
    ' budget"><rect x="0" y="0" width="' +
    width +
    '" height="14" rx="7" fill="#eef2ea"/><rect x="0" y="0" width="' +
    fillW +
    '" height="14" rx="7" fill="' +
    color +
    '"/></svg>'
  );
}

// Grouped vertical bars: income vs spending per month.
// rows: [{label, income, spending}]. Returns an SVG string.
function trendSVG(rows, width, height) {
  width = width || 640;
  height = height || 260;
  const padL = 64;
  const padB = 28;
  const padT = 12;
  const plotW = width - padL - 12;
  const plotH = height - padT - padB;
  const maxV = Math.max.apply(
    null,
    rows.map(function (r) {
      return Math.max(r.income, r.spending);
    })
  );
  const top = Math.ceil(maxV / 10000000) * 10000000;
  const y = function (v) {
    return padT + plotH - (v / top) * plotH;
  };
  const groupW = plotW / rows.length;
  const barW = Math.min(34, (groupW - 24) / 2);
  let grid = "";
  for (let g = 0; g <= 5; g++) {
    const v = (top / 5) * g;
    const gy = y(v);
    grid +=
      '<line x1="' +
      padL +
      '" y1="' +
      gy.toFixed(1) +
      '" x2="' +
      (width - 12) +
      '" y2="' +
      gy.toFixed(1) +
      '" stroke="#e6e9e2" stroke-width="1"/><text x="' +
      (padL - 8) +
      '" y="' +
      (gy + 4).toFixed(1) +
      '" text-anchor="end" class="axis-label">₫' +
      Math.round(v / 1000000) +
      'M</text>';
  }
  let bars = "";
  rows.forEach(function (row, i) {
    const gx = padL + i * groupW + groupW / 2;
    const ih = (row.income / top) * plotH;
    const sh = (row.spending / top) * plotH;
    bars +=
      '<rect x="' +
      (gx - barW - 3).toFixed(1) +
      '" y="' +
      y(row.income).toFixed(1) +
      '" width="' +
      barW +
      '" height="' +
      ih.toFixed(1) +
      '" rx="3" fill="#1e4d3b"><title>Income ' +
      fmtVND(row.income) +
      '</title></rect>';
    bars +=
      '<rect x="' +
      (gx + 3).toFixed(1) +
      '" y="' +
      y(row.spending).toFixed(1) +
      '" width="' +
      barW +
      '" height="' +
      sh.toFixed(1) +
      '" rx="3" fill="#d97706"><title>Spending ' +
      fmtVND(row.spending) +
      '</title></rect>';
    bars +=
      '<text x="' +
      gx.toFixed(1) +
      '" y="' +
      (height - 8) +
      '" text-anchor="middle" class="axis-label">' +
      row.label +
      "</text>";
  });
  return (
    '<svg viewBox="0 0 ' +
    width +
    " " +
    height +
    '" role="img" aria-label="Monthly income versus spending bar chart">' +
    grid +
    bars +
    "</svg>"
  );
}

// A thin progress bar for a savings goal, 0..1 filled.
function goalBarSVG(frac, width) {
  width = width || 260;
  const fillW = Math.round(Math.max(0, Math.min(1, frac)) * width);
  const done = frac >= 1;
  return (
    '<svg viewBox="0 0 ' +
    width +
    ' 12" class="bar-svg" role="img" aria-label="Goal ' +
    Math.round(frac * 100) +
    '% funded"><rect x="0" y="0" width="' +
    width +
    '" height="12" rx="6" fill="#eef2ea"/><rect x="0" y="0" width="' +
    fillW +
    '" height="12" rx="6" fill="' +
    (done ? "#2e7d5b" : "#1e4d3b") +
    '"/></svg>'
  );
}
