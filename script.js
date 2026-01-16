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
