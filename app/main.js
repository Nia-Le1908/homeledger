// HomeLedger main — router and control wiring.
// Hash routes: #/ dashboard, #/transactions, #/budgets, #/goals, #/reports.
// All controls are wired once here with delegated events, so a re-render
// never loses a handler. window.__shotReady is false while a page renders
// and true once it is on screen, so screenshot capture knows when to shoot.

window.__shotReady = false;

const ROUTES = {
  "/": renderDashboard,
  "/transactions": renderTransactions,
  "/budgets": renderBudgets,
  "/goals": renderGoals,
  "/reports": renderReports,
};

function currentRoute() {
  const hash = window.location.hash || "#/";
  const path = hash.slice(1).split("?")[0] || "/";
  return ROUTES[path] ? path : "/";
}

function render() {
  window.__shotReady = false;
  const route = currentRoute();
  const view = document.getElementById("view");
  view.innerHTML = ROUTES[route]();
  document.querySelectorAll("nav a").forEach(function (a) {
    const href = a.getAttribute("href") || "";
    if (href.slice(1) === route) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  const TITLES = { "/": "Dashboard", "/transactions": "Transactions", "/budgets": "Budgets", "/goals": "Goals", "/reports": "Reports" };
  document.title = "HomeLedger — " + (TITLES[route] || "Dashboard");
  window.scrollTo(0, 0);
  requestAnimationFrame(function () {
    window.__shotReady = true;
  });
}

function rerender() {
  render();
}

// ---- delegated controls ----------------------------------------------

document.addEventListener("click", function (e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.getAttribute("data-action");
  if (action === "pick-month") {
    store.month = el.getAttribute("data-month");
    rerender();
  } else if (action === "pick-range") {
    reportRange = el.getAttribute("data-range");
    rerender();
  } else if (action === "delete-tx") {
    deleteTransaction(el.getAttribute("data-id"));
    rerender();
  } else if (action === "reset-data") {
    if (window.confirm("Reset HomeLedger to the original demo data? Your changes will be lost.")) {
      resetStore();
      txFilter = { month: "2026-11", category: "all", type: "all", search: "" };
      rerender();
    }
  }
});

document.addEventListener("change", function (e) {
  const el = e.target;
  if (el.hasAttribute("data-edit-amount")) {
    const ok = updateTransactionAmount(el.getAttribute("data-edit-amount"), el.value);
    if (!ok) {
      el.classList.add("invalid");
      el.value = "";
      el.focus();
    } else {
      rerender();
    }
  } else if (el.hasAttribute("data-edit-budget")) {
    const ok = setBudget(store.month, el.getAttribute("data-edit-budget"), el.value);
    if (!ok) {
      el.classList.add("invalid");
    } else {
      rerender();
    }
  } else if (el.hasAttribute("data-filter")) {
    txFilter[el.getAttribute("data-filter")] = el.value;
    rerender();
    const back = document.querySelector('[data-filter="' + el.getAttribute("data-filter") + '"]');
    if (back) back.focus();
  }
});

document.addEventListener("input", function (e) {
  const el = e.target;
  if (el.hasAttribute("data-filter") && el.getAttribute("data-filter") === "search") {
    txFilter.search = el.value;
    // Live-filter without a full re-render so the caret stays put.
    const view = document.getElementById("view");
    const rows = filteredTransactions();
    const tbody = view.querySelector(".tx-table tbody");
    if (tbody) {
      tbody.innerHTML =
        rows.length > 0
          ? rows
              .map(function (t) {
                return txRowHTML(t, true);
              })
              .join("")
          : '<tr><td colspan="5" class="empty">No transactions match these filters. Try clearing the search.</td></tr>';
      const count = view.querySelector(".count");
      if (count) count.textContent = rows.length + " transaction" + (rows.length === 1 ? "" : "s") + " shown";
    }
  }
});

document.addEventListener("submit", function (e) {
  e.preventDefault();
  const form = e.target;
  if (form.id === "add-tx-form") {
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const date = String(data.get("date") || "");
    const desc = String(data.get("desc") || "").trim();
    if (!date || !desc || !isFinite(amount) || amount <= 0) return;
    addTransaction({
      date: date,
      desc: desc,
      cat: String(data.get("cat")),
      amount: amount,
      type: String(data.get("type")),
    });
    txFilter.month = monthOf({ date: date });
    form.reset();
    form.querySelector('[name="date"]').value = "2026-11-27";
    render();
    const note = document.getElementById("tx-added");
    if (note) note.textContent = "Added “" + desc + "” — " + fmtVND(amount) + ".";
  } else if (form.classList.contains("goal-form")) {
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    if (!isFinite(amount) || amount <= 0) return;
    addToGoal(form.getAttribute("data-goal"), amount);
    form.reset();
    render();
  }
});

loadStore();
window.addEventListener("hashchange", render);
render();
