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
    <button
      class="remove-btn"
      data-index="${index}"
      title="Remove expense"
    >
      &times;
    </button>
  </div>
`;

  return li;
}

applyTheme();

function renderExpenses() {
  expenseListEl.innerHTML = "";

  appState.expenses.forEach((expense, index) => {
    expenseListEl.appendChild(
      createExpenseItem(expense, index)
    );
  });
  const removeButtons = expenseListEl.querySelectorAll(".remove-btn");
  removeButtons.forEach((btn) => {
    btn.disabled = appState.isExpenseLocked;
  });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}

expenseLockBtn.addEventListener("click", () => {
  appState.isExpenseLocked = !appState.isExpenseLocked;

  expenseLockBtn.classList.toggle("locked", appState.isExpenseLocked);
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

  expenseForm.reset();
  expenseDateInput.value = new Date().toISOString().split("T")[0];
});

expenseListEl.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-btn")) return;
  if (appState.isExpenseLocked) return;

  const index = Number(e.target.dataset.index);
  appState.expenses.splice(index, 1);

  saveState();
  renderExpenses();
  updateBudgetUI();
});

themeToggleBtn.addEventListener("click", () => {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  applyTheme();
  saveState();
});

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

renderExpenses();
updateBudgetUI();

expenseLockBtn.classList.toggle("unlocked", appState.isExpenseLocked);
expenseLockIcon.classList.toggle("visible", appState.isExpenseLocked);
expenseUnlockIcon.classList.toggle("visible", !appState.isExpenseLocked);

if (!expenseDateInput.value) {
  expenseDateInput.value = new Date().toISOString().split("T")[0];
}
