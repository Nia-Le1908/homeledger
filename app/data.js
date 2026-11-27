// HomeLedger — the Nguyen family's household budget data.
// Two adults (Minh & Lan) and one child (An, 8), living in Thanh Xuan, Hanoi.
// Every figure on the site is computed from the transactions below, so the
// dashboard totals, the budget bars and the reports can never disagree.
// Amounts are Vietnamese dong (VND). Rows are [date, description, category,
// amount, type] where type is "income", "expense" or "savings" (a transfer
// into the savings account, counted as saved money, not as spending).

const HOUSEHOLD = {
  name: "The Nguyen family",
  members: "Minh, Lan & An (8 years old)",
  home: "Thanh Xuan, Hanoi",
  currency: "VND",
};

const MONTHS = ["2026-09", "2026-10", "2026-11"];

const MONTH_LABELS = {
  "2026-09": "September 2026",
  "2026-10": "October 2026",
  "2026-11": "November 2026",
};

const CATEGORIES = [
  "Groceries",
  "Rent & utilities",
  "Transport",
  "Dining out",
  "Health",
  "Entertainment",
  "Kids & school",
  "Home",
  "Savings",
];

// Monthly spending limit per category (VND). The same limits apply every
// month; October's dining and November's home repairs are the two months
// where real life pushed a category over its limit.
const BUDGETS = {
  "2026-09": {
    "Groceries": 8000000,
    "Rent & utilities": 12000000,
    "Transport": 3000000,
    "Dining out": 3000000,
    "Health": 2000000,
    "Entertainment": 2500000,
    "Kids & school": 4000000,
    "Home": 2500000,
  },
  "2026-10": {
    "Groceries": 8000000,
    "Rent & utilities": 12000000,
    "Transport": 3000000,
    "Dining out": 3000000,
    "Health": 2000000,
    "Entertainment": 2500000,
    "Kids & school": 4000000,
    "Home": 2500000,
  },
  "2026-11": {
    "Groceries": 8000000,
    "Rent & utilities": 12000000,
    "Transport": 3000000,
    "Dining out": 3000000,
    "Health": 2000000,
    "Entertainment": 2500000,
    "Kids & school": 4000000,
    "Home": 2500000,
  },
};

const RAW_TRANSACTIONS = [
  // ---- September 2026: income 53,400,000; spending 31,650,000 ----
  ["2026-09-01", "Rent — Thanh Xuan apartment", "Rent & utilities", 9500000, "expense"],
  ["2026-09-02", "Electricity bill EVN", "Rent & utilities", 920000, "expense"],
  ["2026-09-03", "Weekly shop at Co.opmart", "Groceries", 1720000, "expense"],
  ["2026-09-03", "Internet FPT", "Rent & utilities", 350000, "expense"],
  ["2026-09-04", "Petrol — Minh's motorbike", "Transport", 420000, "expense"],
  ["2026-09-05", "Salary — Minh (software engineer)", "Income", 28000000, "income"],
  ["2026-09-05", "School lunch fees — An", "Kids & school", 1200000, "expense"],
  ["2026-09-06", "Pharmacy — vitamins & plasters", "Health", 320000, "expense"],
  ["2026-09-07", "Family dinner at Quan An Ngon", "Dining out", 780000, "expense"],
  ["2026-09-08", "Grab rides to work", "Transport", 260000, "expense"],
  ["2026-09-09", "Weekly shop at VinMart", "Groceries", 1800000, "expense"],
  ["2026-09-10", "Salary — Lan (accountant)", "Income", 22000000, "income"],
  ["2026-09-10", "Water bill", "Rent & utilities", 240000, "expense"],
  ["2026-09-11", "English class — An", "Kids & school", 1500000, "expense"],
  ["2026-09-12", "Coffee with friends", "Dining out", 180000, "expense"],
  ["2026-09-13", "Cinema — family movie night", "Entertainment", 420000, "expense"],
  ["2026-09-14", "Petrol — Lan's motorbike", "Transport", 380000, "expense"],
  ["2026-09-15", "Weekly shop at Co.opmart", "Groceries", 1900000, "expense"],
  ["2026-09-16", "Netflix + Spotify", "Entertainment", 320000, "expense"],
  ["2026-09-17", "Market top-up — vegetables & fruit", "Groceries", 450000, "expense"],
  ["2026-09-18", "Dental check-up — Lan", "Health", 650000, "expense"],
  ["2026-09-19", "Bubble tea & snacks — An", "Dining out", 150000, "expense"],
  ["2026-09-20", "Side income — Lan's online shop", "Income", 3400000, "income"],
  ["2026-09-20", "Motorbike service", "Transport", 680000, "expense"],
  ["2026-09-21", "Weekly shop at VinMart", "Groceries", 1650000, "expense"],
  ["2026-09-22", "New school books — An", "Kids & school", 640000, "expense"],
  ["2026-09-23", "Cleaning supplies & detergent", "Home", 420000, "expense"],
  ["2026-09-24", "Dinner at a hotpot restaurant", "Dining out", 950000, "expense"],
  ["2026-09-25", "Phone top-up — both phones", "Rent & utilities", 300000, "expense"],
  ["2026-09-25", "Gym membership — Lan (quarterly)", "Health", 600000, "expense"],
  ["2026-09-26", "New curtains for the living room", "Home", 1150000, "expense"],
  ["2026-09-27", "Day trip to Ba Vi — petrol & food", "Entertainment", 1380000, "expense"],
  ["2026-09-27", "Market top-up — vegetables & fruit", "Groceries", 420000, "expense"],
  ["2026-09-28", "Monthly sweep into savings", "Savings", 21750000, "savings"],

  // ---- October 2026: income 53,700,000; spending 30,710,000 ----
  ["2026-10-01", "Rent — Thanh Xuan apartment", "Rent & utilities", 9500000, "expense"],
  ["2026-10-02", "Electricity bill EVN", "Rent & utilities", 880000, "expense"],
  ["2026-10-03", "Internet FPT", "Rent & utilities", 350000, "expense"],
  ["2026-10-04", "Weekly shop at Co.opmart", "Groceries", 1780000, "expense"],
  ["2026-10-05", "Salary — Minh (software engineer)", "Income", 28000000, "income"],
  ["2026-10-05", "Petrol — Minh's motorbike", "Transport", 430000, "expense"],
  ["2026-10-06", "School lunch fees — An", "Kids & school", 1200000, "expense"],
  ["2026-10-07", "Lan's birthday dinner — family & grandparents", "Dining out", 1250000, "expense"],
  ["2026-10-08", "Pharmacy — cold medicine", "Health", 280000, "expense"],
  ["2026-10-09", "Weekly shop at VinMart", "Groceries", 1860000, "expense"],
  ["2026-10-10", "Salary — Lan (accountant)", "Income", 22000000, "income"],
  ["2026-10-10", "Water bill", "Rent & utilities", 250000, "expense"],
  ["2026-10-11", "English class — An", "Kids & school", 1500000, "expense"],
  ["2026-10-12", "Coffee & cake with friends", "Dining out", 210000, "expense"],
  ["2026-10-13", "Petrol — Lan's motorbike", "Transport", 390000, "expense"],
  ["2026-10-14", "Weekly shop at Co.opmart", "Groceries", 1850000, "expense"],
  ["2026-10-15", "Mid-Autumn festival gifts", "Entertainment", 680000, "expense"],
  ["2026-10-16", "Grab rides to work", "Transport", 240000, "expense"],
  ["2026-10-17", "Hotpot with Lan's colleagues", "Dining out", 720000, "expense"],
  ["2026-10-18", "Market top-up — vegetables & fruit", "Groceries", 430000, "expense"],
  ["2026-10-19", "Annual health check — Minh", "Health", 850000, "expense"],
  ["2026-10-20", "Side income — Lan's online shop", "Income", 3700000, "income"],
  ["2026-10-20", "Weekly shop at VinMart", "Groceries", 1650000, "expense"],
  ["2026-10-21", "New shoes — An", "Kids & school", 780000, "expense"],
  ["2026-10-22", "Netflix + Spotify", "Entertainment", 320000, "expense"],
  ["2026-10-23", "Dinner at a Korean BBQ", "Dining out", 890000, "expense"],
  ["2026-10-24", "Motorbike service", "Transport", 620000, "expense"],
  ["2026-10-25", "Phone top-up — both phones", "Rent & utilities", 300000, "expense"],
  ["2026-10-26", "Toys — An's birthday gift", "Kids & school", 520000, "expense"],
  ["2026-10-27", "Market top-up — vegetables & fruit", "Groceries", 430000, "expense"],
  ["2026-10-28", "Cleaning supplies & detergent", "Home", 380000, "expense"],
  ["2026-10-29", "Bubble tea & snacks — An", "Dining out", 170000, "expense"],
  ["2026-10-30", "Monthly sweep into savings", "Savings", 22990000, "savings"],

  // ---- November 2026: income 53,900,000; spending 30,700,000 ----
  ["2026-11-01", "Rent — Thanh Xuan apartment", "Rent & utilities", 9500000, "expense"],
  ["2026-11-02", "Electricity bill EVN", "Rent & utilities", 960000, "expense"],
  ["2026-11-03", "Internet FPT", "Rent & utilities", 350000, "expense"],
  ["2026-11-04", "Weekly shop at Co.opmart", "Groceries", 1740000, "expense"],
  ["2026-11-05", "Salary — Minh (software engineer)", "Income", 28000000, "income"],
  ["2026-11-05", "Petrol — Minh's motorbike", "Transport", 440000, "expense"],
  ["2026-11-06", "School lunch fees — An", "Kids & school", 1200000, "expense"],
  ["2026-11-07", "Weekly shop at VinMart", "Groceries", 1840000, "expense"],
  ["2026-11-08", "Washing machine repair — new drum", "Home", 2150000, "expense"],
  ["2026-11-09", "Pharmacy — vitamins", "Health", 310000, "expense"],
  ["2026-11-10", "Salary — Lan (accountant)", "Income", 22000000, "income"],
  ["2026-11-10", "Water bill", "Rent & utilities", 260000, "expense"],
  ["2026-11-11", "English class — An", "Kids & school", 1500000, "expense"],
  ["2026-11-12", "Coffee with friends", "Dining out", 190000, "expense"],
  ["2026-11-13", "Petrol — Lan's motorbike", "Transport", 400000, "expense"],
  ["2026-11-14", "Weekly shop at Co.opmart", "Groceries", 1880000, "expense"],
  ["2026-11-15", "Cinema — family movie night", "Entertainment", 450000, "expense"],
  ["2026-11-16", "Grab rides to work", "Transport", 270000, "expense"],
  ["2026-11-17", "Market top-up — vegetables & fruit", "Groceries", 420000, "expense"],
  ["2026-11-18", "Dinner at a Vietnamese restaurant", "Dining out", 820000, "expense"],
  ["2026-11-19", "New winter clothes — An", "Kids & school", 890000, "expense"],
  ["2026-11-20", "Side income — Lan's online shop", "Income", 3900000, "income"],
  ["2026-11-20", "Weekly shop at VinMart", "Groceries", 1730000, "expense"],
  ["2026-11-21", "Dinner at a hotpot restaurant", "Dining out", 880000, "expense"],
  ["2026-11-21", "Netflix + Spotify", "Entertainment", 320000, "expense"],
  ["2026-11-22", "Motorbike service", "Transport", 650000, "expense"],
  ["2026-11-23", "Phone top-up — both phones", "Rent & utilities", 300000, "expense"],
  ["2026-11-24", "Bubble tea & snacks — An", "Dining out", 160000, "expense"],
  ["2026-11-25", "Books — An", "Entertainment", 290000, "expense"],
  ["2026-11-26", "Cleaning supplies & detergent", "Home", 410000, "expense"],
  ["2026-11-27", "Market top-up — vegetables & fruit", "Groceries", 390000, "expense"],
  ["2026-11-28", "Monthly sweep into savings", "Savings", 23200000, "savings"],
];

// Savings goals. "saved" is the balance today; "monthly" is the planned
// contribution each month. The emergency fund is the family's safety net,
// the holiday is the next big treat, and the washing machine is the next
// household purchase — the old one was repaired in November and will be
// replaced in spring.
const GOALS = [
  {
    id: "emergency",
    name: "Emergency fund",
    note: "Six months of expenses, for peace of mind.",
    target: 150000000,
    saved: 84000000,
    monthly: 8000000,
  },
  {
    id: "holiday",
    name: "Family holiday in Da Lat",
    note: "Four days in Da Lat next summer — train, hotel and food.",
    target: 30000000,
    saved: 18500000,
    monthly: 2000000,
  },
  {
    id: "washer",
    name: "New washing machine",
    note: "The old one was repaired in November; we replace it in spring.",
    target: 12000000,
    saved: 8200000,
    monthly: 1500000,
  },
];

// Monthly totals for June–August 2026, kept as totals only (no transaction
// detail). The reports page uses them for its six-month trend view.
const PAST_SUMMARY = {
  "2026-06": { income: 52800000, spending: 31200000 },
  "2026-07": { income: 53100000, spending: 32900000 },
  "2026-08": { income: 53300000, spending: 30800000 },
};

const PAST_MONTHS = ["2026-06", "2026-07", "2026-08"];

const PAST_LABELS = {
  "2026-06": "Jun 2026",
  "2026-07": "Jul 2026",
  "2026-08": "Aug 2026",
};

// One plain-language insight per month, written from the figures above.
const INSIGHTS = {
  "2026-09":
    "September was our calmest month: every category stayed inside its budget, and groceries finished at 99% of the limit.",
  "2026-10":
    "Dining out ran 8% over budget in October — Lan's birthday dinner and two evenings out pushed it to ₫3,240,000 against a ₫3,000,000 limit.",
  "2026-11":
    "The washing machine repair (₫2,150,000) pushed Home 2% over budget in November, but groceries landed exactly on budget.",
};

// Turn the compact rows into objects with stable ids.
function buildTransactions() {
  return RAW_TRANSACTIONS.map(function (row, i) {
    return {
      id: "tx" + (i + 1),
      date: row[0],
      desc: row[1],
      cat: row[2],
      amount: row[3],
      type: row[4],
    };
  });
}

const SEED_TRANSACTIONS = buildTransactions();
