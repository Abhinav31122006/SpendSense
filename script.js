// ==================================================================
// STATE MANAGEMENT
// ==================================================================
// Keeping all application data in one central object makes it easy
// to save/load everything to localStorage in one operation
// This pattern avoids having data scattered across global variables

const appState = {
  theme: "dark",
  budget: 0,
  isBudgetLocked: false,
  isExpenseLocked: false,
  isPlanLocked: false,
  expenses: [],
  selectedPlan: null,
  streak: {
    count: 0,
    lastVisit: null
  }
};

// ==================================================================
// LOCAL STORAGE - Data Persistence
// ==================================================================
// Load previously saved state from browser storage when page loads
// This allows users to close the tab and return later without losing data

const savedState = localStorage.getItem("spendSenseState");
if (savedState) {
  try {
    Object.assign(appState, JSON.parse(savedState));
  } catch (e) {}
}

// Save current state to localStorage - called after every change
function saveState() {
  localStorage.setItem("spendSenseState", JSON.stringify(appState));
}

// ==================================================================
// SPENDING PLAN CONFIGURATIONS
// ==================================================================
// Three predefined budget templates with different category breakdowns
// Users can select these plans which auto-fill the budget distribution

const SPENDING_PLANS = {
  balanced: {
    name: "Balanced",
    breakdown: {
      Food: 0.30,
      Travel: 0.20,
      "Self Improvement": 0.20,
      Entertainment: 0.20,
      Other: 0.10
    }
  },
  saver: {
    name: "Saver",
    breakdown: {
      Food: 0.35,
      Travel: 0.10,
      "Self Improvement": 0.25,
      Entertainment: 0.10,
      Other: 0.20
    }
  },
  lifestyle: {
    name: "Lifestyle",
    breakdown: {
      Food: 0.25,
      Travel: 0.25,
      "Self Improvement": 0.15,
      Entertainment: 0.30,
      Other: 0.05
    }
  }
};
// ==================================================================
// DOM ELEMENT REFERENCES
// ==================================================================
// Query all needed elements once at startup for better performance
// Avoids repeatedly searching the DOM every time we need an element
// Using querySelector/querySelectorAll to find elements by CSS selectors
const themeToggleBtn = document.querySelector(".theme-toggle");
const darkIcon = document.querySelector(".dark-icon");
const lightIcon = document.querySelector(".light-icon");

const budgetInput = document.querySelector(".budget-input input");
const setBudgetBtn = document.querySelector(".set-budget-btn");
const budgetLockBtn = document.querySelector(".budget-lock-btn");
const totalSpentEl = document.querySelector(".budget-info div:first-child strong");
const remainingEl = document.querySelector(".budget-info div:last-child strong");
const lockIcon = document.querySelector(".lock-icon");
const unlockIcon = document.querySelector(".unlock-icon");

const expenseForm = document.querySelector(".expense-form");
const expenseAmountInput = expenseForm.querySelector('input[type="number"]');
const expenseCategorySelect = expenseForm.querySelector("select");
const expenseDateInput = expenseForm.querySelector('input[type="date"]');
const expenseNoteInput = expenseForm.querySelector('input[type="text"]');
const expenseListEl = document.querySelector(".expense-list");

const expenseLockBtn = document.querySelector(".expense-lock-btn");
const expenseLockIcon = expenseLockBtn.querySelector(".lock-icon");
const expenseUnlockIcon = expenseLockBtn.querySelector(".unlock-icon");

const monthlyChartCanvas = document.querySelector(
  ".analytics-stack .chart-panel:first-child canvas"
);

const overallChartCanvas = document.querySelector(
  ".analytics-stack .chart-panel:last-child canvas"
);

const planCards = document.querySelectorAll(".plan-card");

const spendWarningsEl = document.getElementById("spendWarnings");

const planLockBtn = document.querySelector(".plan-lock-btn");
const planLockIcon = planLockBtn.querySelector(".lock-icon");
const planUnlockIcon = planLockBtn.querySelector(".unlock-icon");

// Category colors used in charts and expense items
const CATEGORY_COLORS = {
  Food: "#FFD700",
  Travel: "#4DA6FF",
  "Self Improvement": "#FF1493",
  Entertainment: "#C77DFF",
  Other: "#FF5C5C"
};

// Show warning when user has spent 80% or more of budget
const WARNING_THRESHOLD = 0.8;

// ==================================================================
// UTILITY FUNCTIONS
// ==================================================================

// Synchronize expense list height to match analytics section
// Uses getBoundingClientRect() to measure actual rendered dimensions
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

function getCategoryBudgets() {
  if (!appState.selectedPlan || !appState.budget) return null;

  const plan = SPENDING_PLANS[appState.selectedPlan];
  if (!plan) return null;

  const budgets = {};

  Object.entries(plan.breakdown).forEach(([category, ratio]) => {
    budgets[category] = Math.round(appState.budget * ratio);
  });

  return budgets;
}

// ==================================================================
// WARNING SYSTEM
// ==================================================================
// Check if user has exceeded or is nearing budget limits for categories
// Display warnings with animations, progress bars, and status badges

function checkCategoryLimits() {
  if (!appState.selectedPlan || !appState.budget) {
    spendWarningsEl.classList.remove("visible");
    spendWarningsEl.innerHTML = "";
    return;
  }

  const budgets = getCategoryBudgets();
  const spending = getCategorySpending();

  const warnings = [];

  Object.keys(budgets).forEach(category => {
    const limit = budgets[category];
    const spent = spending[category] || 0;

    if (spent >= limit) {
      const percentage = Math.round((spent / limit) * 100);
      warnings.push({
        type: 'exceeded',
        category,
        spent,
        limit,
        percentage
      });
    } else if (spent >= limit * WARNING_THRESHOLD) {
      const percentage = Math.round((spent / limit) * 100);
      warnings.push({
        type: 'nearing',
        category,
        spent,
        limit,
        percentage
      });
    }
  });

  if (warnings.length === 0) {
    spendWarningsEl.classList.remove("visible");
    spendWarningsEl.innerHTML = "";
    return;
  }

  const warningItems = warnings.map(w => {
    const icon = w.type === 'exceeded' 
      ? '<span class="warning-icon exceeded">⚠</span>'
      : '<span class="warning-icon nearing">⚡</span>';
    
    const statusClass = w.type === 'exceeded' ? 'status-exceeded' : 'status-nearing';
    const statusText = w.type === 'exceeded' ? 'Limit Exceeded' : 'Near Limit';
    
    return `
      <li class="warning-item ${statusClass}">
        <div class="warning-header">
          ${icon}
          <div class="warning-content">
            <div class="warning-title">
              <strong>${w.category}</strong>
              <span class="warning-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="warning-details">
              <span class="warning-amount">₹${w.spent} / ₹${w.limit}</span>
              <span class="warning-percentage">${w.percentage}%</span>
            </div>
          </div>
        </div>
        <div class="warning-progress">
          <div class="warning-progress-bar" style="width: ${Math.min(w.percentage, 100)}%"></div>
        </div>
      </li>
    `;
  }).join("");

  // Dynamically create warning HTML using template literals
  // classList.add('visible') triggers CSS slide-in animation
  spendWarningsEl.innerHTML = `
    <div class="warnings-header">
      <span class="warnings-title">⚠️ Budget Alerts</span>
      <span class="warnings-count">${warnings.length}</span>
    </div>
    <ul class="warnings-list">
      ${warningItems}
    </ul>
  `;

  spendWarningsEl.classList.add("visible");
}

// ==================================================================
// SPENDING PLAN SELECTION
// ==================================================================
// Handle user clicking on one of the three plan cards
// Apply the selected plan's budget breakdown to categories

function activatePlan(planId) {
  if (appState.isPlanLocked) return;

  if (appState.selectedPlan === planId) {
    appState.selectedPlan = null;
    saveState();
    updateActivePlanUI();
    checkCategoryLimits();
    return;
  }

  if (!appState.budget || appState.budget <= 0) {
    alert("Please set a budget before selecting a plan.");
    return;
  }

  appState.selectedPlan = planId;
  saveState();

  updateActivePlanUI();
  checkCategoryLimits();
}

function updateActivePlanUI() {
  planCards.forEach(card => {
    const planId = card.dataset.plan;
    const isActive = planId === appState.selectedPlan;

    card.classList.toggle("active", isActive);

    const btn = card.querySelector(".plan-btn");
    if (btn) {
      btn.textContent = isActive ? "Selected" : "Select Plan";
    }
  });
}

function updatePlanLockUI() {
  planCards.forEach(card => {
    card.classList.toggle("locked", appState.isPlanLocked);
  });
}

// ==================================================================
// THEME SYSTEM
// ==================================================================
// Toggle between dark and light themes
// Uses classList to add/remove 'light' class on body element

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

// ==================================================================
// EXPENSE CALCULATIONS
// ==================================================================
// Calculate total and per-category spending
// Used for budget tracking and chart generation

function calculateTotalSpent() {
  return appState.expenses.reduce((sum, e) => sum + e.amount, 0);
}

// Calculate spending totals for each category
function getCategorySpending() {
  const totals = {};

  appState.expenses.forEach(expense => {
    totals[expense.category] =
      (totals[expense.category] || 0) + expense.amount;
  });

  return totals;
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

// ==================================================================
// CANVAS CHART RENDERING
// ==================================================================
// Draw custom donut charts using the Canvas API
// Demonstrates arc drawing, colors, and high-DPI rendering

function drawDonutChart(canvas, dataMap) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const panel = canvas.closest(".chart-panel");
  const panelBg = getComputedStyle(panel).backgroundColor;

  const dpr = window.devicePixelRatio || 1;
  const size = 300;

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
  const radius = centerX - 30;
  const innerRadius = radius * 0.75;

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

  // Start drawing from top (12 o'clock position)
  let startAngle = -Math.PI / 2;

  // Draw each category as an arc segment
  // Use ctx.arc() to create circular paths, then fill with category colors
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

    const isLight = document.body.classList.contains("light");

    ctx.shadowColor = CATEGORY_COLORS[category];
    ctx.shadowBlur = isLight ? 6 : 12;

    ctx.strokeStyle = CATEGORY_COLORS[category];
    ctx.lineWidth = radius - innerRadius;
    ctx.stroke();

    ctx.shadowBlur = 0;

    startAngle += sliceAngle;
  });

const isLight = document.body.classList.contains("light");

ctx.beginPath();
ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
ctx.fillStyle = isLight ? "#ffffff" : "#141414";
ctx.fill();
}

// ==================================================================
// ANALYTICS CHART UPDATES
// ==================================================================
// Redraw both donut charts when expenses change
// One chart for this month, one for all-time

function updateAnalytics() {
  const monthlyData = getMonthlyCategoryTotals();
  const overallData = getOverallCategoryTotals();

  drawDonutChart(monthlyChartCanvas, monthlyData);
  drawDonutChart(overallChartCanvas, overallData);
}

// ==================================================================
// BUDGET DISPLAY UPDATE
// ==================================================================
// Update the budget section showing spent/remaining amounts
// Manipulate textContent and style.width for progress bars

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

// ==================================================================
// DATE FORMATTING
// ==================================================================
// Convert YYYY-MM-DD to DD-MM-YYYY for display

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}

// ==================================================================
// EXPENSE LIST RENDERING
// ==================================================================
// Create expense item elements using createElement and innerHTML
// Demonstrates dynamic DOM manipulation and template literals

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

// Clear the expense list and rebuild it from appState.expenses array
// Uses appendChild() to add each expense element to the DOM
function renderExpenses() {
  expenseListEl.innerHTML = "";

  appState.expenses.forEach((expense, index) => {
    expenseListEl.appendChild(createExpenseItem(expense, index));
  });

  // Disable remove buttons if expenses are locked
  expenseListEl
    .querySelectorAll(".remove-btn")
    .forEach(btn => btn.disabled = appState.isExpenseLocked);
}

// ==================================================================
// EVENT LISTENERS
// ==================================================================
// Attach event handlers to respond to user interactions
// Uses addEventListener for click, submit, and window events

// Sync expense list height on page load and window resize
window.addEventListener("load", syncExpenseHeight);
window.addEventListener("resize", syncExpenseHeight);

// Toggle expense lock button
expenseLockBtn.addEventListener("click", () => {
  appState.isExpenseLocked = !appState.isExpenseLocked;

  expenseLockBtn.classList.toggle("unlocked", !appState.isExpenseLocked);
  expenseLockIcon.classList.toggle("visible", appState.isExpenseLocked);
  expenseUnlockIcon.classList.toggle("visible", !appState.isExpenseLocked);

  renderExpenses();
  saveState();
});

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
  checkCategoryLimits();

  expenseForm.reset();
  expenseDateInput.value = new Date().toISOString().split("T")[0];
});

// ==================================================================
// EVENT DELEGATION - Expense Removal
// ==================================================================
// Instead of adding click listener to each remove button individually,
// we attach ONE listener to the parent <ul> and check e.target
// This is more efficient and works even for dynamically added expenses

expenseListEl.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-btn")) return;
  if (appState.isExpenseLocked) return;

  // Get the expense index from data-index attribute
  const index = Number(e.target.dataset.index);
  appState.expenses.splice(index, 1);

  saveState();
  renderExpenses();
  updateBudgetUI();
  syncExpenseHeight();
  updateAnalytics();
  checkCategoryLimits();
});

themeToggleBtn.addEventListener("click", () => {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  applyTheme();

  requestAnimationFrame(() => {
    updateAnalytics();
  });

  syncExpenseHeight();
  saveState();
});

// Budget input button - save new budget value
setBudgetBtn.addEventListener("click", () => {
  const value = Number(budgetInput.value);
  if (!value || value <= 0) return;

  appState.budget = value;
  saveState();
  updateBudgetUI();
  checkCategoryLimits();
});

// Budget lock toggle - prevents changing budget once locked
budgetLockBtn.addEventListener("click", () => {
  appState.isBudgetLocked = !appState.isBudgetLocked;

  budgetInput.disabled = appState.isBudgetLocked;
  setBudgetBtn.disabled = appState.isBudgetLocked;

  budgetLockBtn.classList.toggle("unlocked", !appState.isBudgetLocked);
  lockIcon.classList.toggle("visible", appState.isBudgetLocked);
  unlockIcon.classList.toggle("visible", !appState.isBudgetLocked);

  saveState();
});

planCards.forEach(card => {
  card.addEventListener("click", () => {
    const planId = card.dataset.plan;
    activatePlan(planId);
  });
});

planLockBtn.addEventListener("click", () => {
  appState.isPlanLocked = !appState.isPlanLocked;

  planLockBtn.classList.toggle("unlocked", !appState.isPlanLocked);
  planLockIcon.classList.toggle("visible", appState.isPlanLocked);
  planUnlockIcon.classList.toggle("visible", !appState.isPlanLocked);

  updatePlanLockUI();
  saveState();
});

// ==================================================================
// INITIALIZATION ON PAGE LOAD
// ==================================================================
// Apply saved state and render initial UI
// This runs once when the page loads

applyTheme();
renderExpenses();
updateBudgetUI();
syncExpenseHeight();
updateAnalytics();
updateActivePlanUI();
checkCategoryLimits();
updatePlanLockUI();

// Restore budget input values from saved state
budgetInput.value = appState.budget || "";
budgetInput.disabled = appState.isBudgetLocked;
setBudgetBtn.disabled = appState.isBudgetLocked;

budgetLockBtn.classList.toggle("unlocked", !appState.isBudgetLocked);
lockIcon.classList.toggle("visible", appState.isBudgetLocked);
unlockIcon.classList.toggle("visible", !appState.isBudgetLocked);

expenseLockBtn.classList.toggle("unlocked", !appState.isExpenseLocked);
expenseLockIcon.classList.toggle("visible", appState.isExpenseLocked);
expenseUnlockIcon.classList.toggle("visible", !appState.isExpenseLocked);

planLockBtn.classList.toggle("unlocked", !appState.isPlanLocked);
planLockIcon.classList.toggle("visible", appState.isPlanLocked);
planUnlockIcon.classList.toggle("visible", !appState.isPlanLocked);


if (!expenseDateInput.value) {
  expenseDateInput.value = new Date().toISOString().split("T")[0];
}