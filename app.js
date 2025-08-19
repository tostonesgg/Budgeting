// app.js
document.addEventListener("DOMContentLoaded", () => {
  /* ╔════════════════════════════════════════╗
     ║  DOM references + constants             ║
     ╚════════════════════════════════════════╝ */
  const LS_KEY_PREFIX = "budget.";
  const incomeInput   = document.getElementById("monthly-income");
  const yearlyEl      = document.getElementById("yearly-income");
  const balanceEl     = document.getElementById("balance-remaining");
  const catName       = document.getElementById("cat-name");
  const catIcon       = document.getElementById("cat-icon");
  const addCatBtn     = document.getElementById("add-category");
  const categoriesEl  = document.getElementById("categories");
  const shareBtn      = document.getElementById("share-btn");
  const inlineColor   = document.getElementById("inline-color"); // optional

  // Sticky bar
  const stickyMonthly = document.getElementById("sticky-monthly");
  const stickyYearly  = document.getElementById("sticky-yearly");
  const stickyBalance = document.getElementById("sticky-balance");

  // Helpers
  const clamp = (n) => (isFinite(n) ? n : 0);
  const fmt   = (n) =>
    "$" + Number(clamp(n)).toLocaleString(undefined, { maximumFractionDigits: 0 });

  /* ╔════════════════════════════════════════╗
     ║  Central totals update                  ║
     ╚════════════════════════════════════════╝ */
  function updateTotals() {
    const monthlyIncome = parseFloat(incomeInput.value) || 0;

    // --- Sum expenses
    let totalExpenses = 0;
    document.querySelectorAll(".expense-input").forEach((el) => {
      totalExpenses += parseFloat(el.value) || 0;
    });

    const netMonthly = monthlyIncome - totalExpenses;
    const netYearly  = monthlyIncome * 12;

    // --- Step 1 pills (source of truth) ---
    if (yearlyEl) yearlyEl.textContent = fmt(netYearly);
    if (balanceEl) balanceEl.textContent = fmt(netMonthly) + "/mo";

    // --- Sticky bar mirrors Step 1 ---
    if (stickyMonthly) stickyMonthly.textContent = fmt(monthlyIncome);
    if (stickyYearly)  stickyYearly.textContent  = yearlyEl.textContent;
    if (stickyBalance) stickyBalance.textContent = balanceEl.textContent;
  }

  /* ╔════════════════════════════════════════╗
     ║  Sticky visibility toggle               ║
     ╚════════════════════════════════════════╝ */
  function setupSticky() {
    const sticky = document.getElementById("income-sticky");
    const incomeCard = document.getElementById("income-card");
    if (!(sticky && incomeCard)) return;

    try {
      const io = new IntersectionObserver(([entry]) => {
        sticky.classList.toggle("is-visible", !entry.isIntersecting);
      }, { root: null, threshold: 0 });
      io.observe(incomeCard);
    } catch {
      const onScrollOrResize = () => {
        const r = incomeCard.getBoundingClientRect();
        const isVisible = r.bottom > 0 && r.top < window.innerHeight;
        sticky.classList.toggle("is-visible", !isVisible);
      };
      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize);
      onScrollOrResize();
    }
  }

  /* ╔════════════════════════════════════════╗
     ║  LocalStorage bootstrap & persistence   ║
     ╚════════════════════════════════════════╝ */

  // Restore income
  const savedIncome = localStorage.getItem(LS_KEY_PREFIX + "income");
  if (savedIncome !== null && incomeInput) {
    incomeInput.value = savedIncome;
  }

  // Restore expenses
  document.querySelectorAll(".expense-input").forEach((el) => {
    const saved = localStorage.getItem(LS_KEY_PREFIX + "expense-" + el.id);
    if (saved !== null) el.value = saved;
  });

  // Listeners
  if (incomeInput) {
    incomeInput.addEventListener("input", () => {
      localStorage.setItem(LS_KEY_PREFIX + "income", incomeInput.value);
      updateTotals();
    });
  }

  document.querySelectorAll(".expense-input").forEach((el) => {
    el.addEventListener("input", () => {
      localStorage.setItem(LS_KEY_PREFIX + "expense-" + el.id, el.value);
      updateTotals();
    });
  });

  /* ╔════════════════════════════════════════╗
     ║  Init                                   ║
     ╚════════════════════════════════════════╝ */
  updateTotals();
  setupSticky();
});
