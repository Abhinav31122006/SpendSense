const appState = {
  theme: "dark",        // "dark" | "light"
  budget: 0,
  isBudgetLocked: false,
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
    const parsed = JSON.parse(savedState);
    Object.assign(appState, parsed);
  } catch (e) {
    console.error("Failed to load saved state");
  }
}

function saveState() {
  localStorage.setItem("spendSenseState", JSON.stringify(appState));
}

const themeToggleBtn = document.querySelector(".theme-toggle");
const darkIcon = document.querySelector(".dark-icon");
const lightIcon = document.querySelector(".light-icon");

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
applyTheme();

themeToggleBtn.addEventListener("click", () => {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  applyTheme();
  saveState();
});

const budgetInput = document.querySelector(".budget-input input");
const setBudgetBtn = document.querySelector(".set-budget-btn");
const budgetLockBtn = document.querySelector(".budget-lock-btn");

const totalSpentEl = document.querySelector(".budget-info div:first-child strong");
const remainingEl = document.querySelector(".budget-info div:last-child strong");
const progressEl = document.querySelector(".progress");

const lockIcon = document.querySelector(".lock-icon");
const unlockIcon = document.querySelector(".unlock-icon");

function calculateTotalSpent() {
  return appState.expenses.reduce((sum, e) => sum + e.amount, 0);
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

setBudgetBtn.addEventListener("click", () => {
  const value = Number(budgetInput.value);

  if (!value || value <= 0) return;

  appState.budget = value;
  saveState();
  updateBudgetUI();
});

budgetLockBtn.addEventListener("click", () => {
  appState.isBudgetLocked = !appState.isBudgetLocked;

  budgetInput.disabled = appState.isBudgetLocked;
  setBudgetBtn.disabled = appState.isBudgetLocked;

  budgetLockBtn.classList.toggle("unlocked", !appState.isBudgetLocked);

  lockIcon.classList.toggle("visible", appState.isBudgetLocked);
  unlockIcon.classList.toggle("visible", !appState.isBudgetLocked);

  saveState();
});

budgetInput.value = appState.budget || "";

budgetInput.disabled = appState.isBudgetLocked;
setBudgetBtn.disabled = appState.isBudgetLocked;

budgetLockBtn.classList.toggle("unlocked", !appState.isBudgetLocked);
lockIcon.classList.toggle("visible", appState.isBudgetLocked);
unlockIcon.classList.toggle("visible", !appState.isBudgetLocked);

updateBudgetUI();