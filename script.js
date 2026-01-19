/* ======================================================
   1. APPLICATION STATE & PERSISTENCE
====================================================== */

const appState = {
  theme: "dark",
  budget: 0,
  isBudgetLocked: false,
  isExpenseLocked: false,
  expenses: [],
  selectedPlan: null,
  streak: {
    count: 0,
    lastVisit: null
  }
};

const savedState = localStorage.getItem("spendSenseState");
if (savedState) {
  try {
    Object.assign(appState, JSON.parse(savedState));
  } catch (e) {}
}

function saveState() {
  localStorage.setItem("spendSenseState", JSON.stringify(appState));
}

/* ======================================================
   2. DOM REFERENCES
====================================================== */

/* Theme */
const themeToggleBtn = document.querySelector(".theme-toggle");
const darkIcon = document.querySelector(".dark-icon");
const lightIcon = document.querySelector(".light-icon");

/* Budget */
const budgetInput = document.querySelector(".budget-input input");
const setBudgetBtn = document.querySelector(".set-budget-btn");
const budgetLockBtn = document.querySelector(".budget-lock-btn");
const totalSpentEl = document.querySelector(".budget-info div:first-child strong");
const remainingEl = document.querySelector(".budget-info div:last-child strong");
const lockIcon = document.querySelector(".lock-icon");
const unlockIcon = document.querySelector(".unlock-icon");

/* Expenses */
const expenseForm = document.querySelector(".expense-form");
const expenseAmountInput = expenseForm.querySelector('input[type="number"]');
const expenseCategorySelect = expenseForm.querySelector("select");
const expenseDateInput = expenseForm.querySelector('input[type="date"]');
const expenseNoteInput = expenseForm.querySelector('input[type="text"]');
const expenseListEl = document.querySelector(".expense-list");

const expenseLockBtn = document.querySelector(".expense-lock-btn");
const expenseLockIcon = expenseLockBtn.querySelector(".lock-icon");
const expenseUnlockIcon = expenseLockBtn.querySelector(".unlock-icon");

/* Analytics Canvases */
const monthlyChartCanvas = document.querySelector(
  ".analytics-stack .chart-panel:first-child canvas"
);

const overallChartCanvas = document.querySelector(
  ".analytics-stack .chart-panel:last-child canvas"
);

/* ======================================================
   ANALYTICS CONSTANTS
====================================================== */

const CATEGORY_COLORS = {
  Food: "#2ecc71",
  Travel: "#3498db",
  "Self Improvement": "#1abc9c",
  Entertainment: "#9b59b6",
  Other: "#e74c3c"
};

/* ======================================================
   3. LAYOUT / UI HELPERS
====================================================== */

function syncExpenseHeight() {
  const analytics = document.getElementById("analyticsSection");
  const expenses = document.getElementById("expensesSection");

  if (!analytics || !expenses) return;

  const analyticsRect = analytics.getBoundingClientRect();
  const expensesRect = expenses.getBoundingClientRect();

  const availableHeight =
    analyticsRect.bottom - expensesRect.top;

  if (availableHeight > 0) {
    expenses.style.height = `${availableHeight}px`;
  }
}

/* ======================================================
   4. CORE UI & LOGIC FUNCTIONS
====================================================== */

function applyTheme() {
  if (appState.theme === "light") {
    document.body.classList.add("light");
    darkIcon.classList.remove("visible");
    lightIcon.classList.add("visible");
  } else {
    document.body.classList.remove("light");
    darkIcon.classList.add("visible");
    lightIcon.classList.remove("visible");
  }
}

function calculateTotalSpent() {
  return appState.expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getOverallCategoryTotals() {
  const totals = {};

  appState.expenses.forEach(expense => {
    totals[expense.category] =
      (totals[expense.category] || 0) + expense.amount;
  });

  return totals;
}

function getMonthlyCategoryTotals() {
  const totals = {};
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  appState.expenses.forEach(expense => {
    const [y, m] = expense.date.split("-").map(Number);

    if (y === currentYear && m - 1 === currentMonth) {
      totals[expense.category] =
        (totals[expense.category] || 0) + expense.amount;
    }
  });

  return totals;
}

function drawDonutChart(canvas, dataMap) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Handle high-DPI screens
  const dpr = window.devicePixelRatio || 1;
  const size = 290; // fixed donut size

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const values = Object.values(dataMap);
  const total = values.reduce((sum, v) => sum + v, 0);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = centerX - 16;
  const innerRadius = radius * 0.75;

  // Empty state
  if (total === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.fillStyle = "#8c8c8c";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No data", centerX, centerY);
    return;
  }

  let startAngle = -Math.PI / 2;

  Object.entries(dataMap).forEach(([category, value]) => {
    const sliceAngle = (value / total) * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius,
      startAngle,
      startAngle + sliceAngle
    );
    ctx.strokeStyle = CATEGORY_COLORS[category];
    ctx.lineWidth = radius - innerRadius;
    ctx.stroke();

    startAngle += sliceAngle;
  });

  // Inner hole
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("light")
    ? "#ffffff"
    : "#141414";
  ctx.fill();
}

function updateAnalytics() {
  const monthlyData = getMonthlyCategoryTotals();
  const overallData = getOverallCategoryTotals();

  drawDonutChart(monthlyChartCanvas, monthlyData);
  drawDonutChart(overallChartCanvas, overallData);
}

function updateBudgetUI() {
  const totalSpent = calculateTotalSpent();
  const remaining = appState.budget - totalSpent;

  totalSpentEl.textContent = `₹${totalSpent}`;
  remainingEl.textContent = `₹${remaining < 0 ? 0 : remaining}`;

  const spentPercent =
    appState.budget > 0
      ? Math.min((totalSpent / appState.budget) * 100, 100)
      : 0;

  const remainingPercent =
    appState.budget > 0
      ? Math.max(100 - spentPercent, 0)
      : 0;

  document.querySelector(".progress-spent").style.width = `${spentPercent}%`;
  document.querySelector(".progress-remaining").style.width = `${remainingPercent}%`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}

function createExpenseItem(expense, index) {
  const li = document.createElement("li");
  li.className = "expense-item";

  const categoryClass = expense.category
    .toLowerCase()
    .replace(" ", "-");

  const noteHTML =
    expense.note && expense.note !== expense.date
      ? `<small class="expense-note">${expense.note}</small>`
      : "";

  li.innerHTML = `
    <div class="expense-meta">
      <div class="expense-header">
        <span class="category ${categoryClass}">
          <span class="category-dot ${categoryClass}"></span>
          ${expense.category}
        </span>
        <small class="expense-date">${formatDate(expense.date)}</small>
      </div>
      ${noteHTML}
    </div>
    <div class="expense-actions">
      <strong>₹${expense.amount}</strong>
      <button class="remove-btn" data-index="${index}" title="Remove expense">
        &times;
      </button>
    </div>
  `;

  return li;
}

function renderExpenses() {
  expenseListEl.innerHTML = "";

  appState.expenses.forEach((expense, index) => {
    expenseListEl.appendChild(createExpenseItem(expense, index));
  });

  expenseListEl
    .querySelectorAll(".remove-btn")
    .forEach(btn => btn.disabled = appState.isExpenseLocked);
}

/* ======================================================
   5. EVENT LISTENERS
====================================================== */

window.addEventListener("load", syncExpenseHeight);
window.addEventListener("resize", syncExpenseHeight);

/* Expense Lock */
expenseLockBtn.addEventListener("click", () => {
  appState.isExpenseLocked = !appState.isExpenseLocked;

  expenseLockBtn.classList.toggle("unlocked", !appState.isExpenseLocked);
  expenseLockIcon.classList.toggle("visible", appState.isExpenseLocked);
  expenseUnlockIcon.classList.toggle("visible", !appState.isExpenseLocked);

  renderExpenses();
  saveState();
});

/* Add Expense */
expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const amount = Number(expenseAmountInput.value);
  const category = expenseCategorySelect.value;
  const date =
    expenseDateInput.value ||
    new Date().toISOString().split("T")[0];

  if (!amount || amount <= 0 || !category || !date) return;

  appState.expenses.push({
    amount,
    category,
    date,
    note: expenseNoteInput.value.trim()
  });

  saveState();
  renderExpenses();
  updateBudgetUI();
  syncExpenseHeight();
  updateAnalytics();

  expenseForm.reset();
  expenseDateInput.value = new Date().toISOString().split("T")[0];
});

/* Remove Expense */
expenseListEl.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-btn")) return;
  if (appState.isExpenseLocked) return;

  const index = Number(e.target.dataset.index);
  appState.expenses.splice(index, 1);

  saveState();
  renderExpenses();
  updateBudgetUI();
  syncExpenseHeight();
  updateAnalytics();
});

/* Theme Toggle */
themeToggleBtn.addEventListener("click", () => {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  applyTheme();
  syncExpenseHeight();
  saveState();
});

/* Set Budget */
setBudgetBtn.addEventListener("click", () => {
  const value = Number(budgetInput.value);
  if (!value || value <= 0) return;

  appState.budget = value;
  saveState();
  updateBudgetUI();
});

/* Budget Lock */
budgetLockBtn.addEventListener("click", () => {
  appState.isBudgetLocked = !appState.isBudgetLocked;

  budgetInput.disabled = appState.isBudgetLocked;
  setBudgetBtn.disabled = appState.isBudgetLocked;

  budgetLockBtn.classList.toggle("unlocked", !appState.isBudgetLocked);
  lockIcon.classList.toggle("visible", appState.isBudgetLocked);
  unlockIcon.classList.toggle("visible", !appState.isBudgetLocked);

  saveState();
});

/* ======================================================
   6. APPLICATION BOOTSTRAP
====================================================== */

applyTheme();
renderExpenses();
updateBudgetUI();
syncExpenseHeight();
updateAnalytics();

budgetInput.value = appState.budget || "";
budgetInput.disabled = appState.isBudgetLocked;
setBudgetBtn.disabled = appState.isBudgetLocked;

budgetLockBtn.classList.toggle("unlocked", !appState.isBudgetLocked);
lockIcon.classList.toggle("visible", appState.isBudgetLocked);
unlockIcon.classList.toggle("visible", !appState.isBudgetLocked);

expenseLockBtn.classList.toggle("unlocked", !appState.isExpenseLocked);
expenseLockIcon.classList.toggle("visible", appState.isExpenseLocked);
expenseUnlockIcon.classList.toggle("visible", !appState.isExpenseLocked);

if (!expenseDateInput.value) {
  expenseDateInput.value = new Date().toISOString().split("T")[0];
}