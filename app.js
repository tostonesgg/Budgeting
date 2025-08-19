document.addEventListener("DOMContentLoaded", () => {
  const incomeInput   = document.getElementById("monthly-input");
  const yearlyEl      = document.getElementById("step1-yearly");
  const balanceEl     = document.getElementById("step1-balance");
  const stickyBalance = document.getElementById("sticky-balance");

  // Simple formatter for currency
  const fmt = (val) =>
    "$" + Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 });

  // Central update function
  function updateTotals() {
    const monthlyIncome = parseFloat(incomeInput.value) || 0;

    // Total all entered expenses
    let totalExpenses = 0;
    document.querySelectorAll(".expense-input").forEach((el) => {
      totalExpenses += parseFloat(el.value) || 0;
    });

    const netMonthly = monthlyIncome - totalExpenses;
    const netYearly = monthlyIncome * 12;

    if (yearlyEl) yearlyEl.textContent = fmt(netYearly);
    if (balanceEl) balanceEl.textContent = fmt(netMonthly) + "/mo";
    if (stickyBalance) stickyBalance.textContent = fmt(netMonthly) + "/mo";
  }

  // Sticky bar only controls visibility now
  function setupSticky() {
    const sticky = document.querySelector(".sticky-bar");
    if (!sticky) return;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        sticky.style.display = "flex";
      } else {
        sticky.style.display = "none";
      }
    });
  }

  // Bootstrap defaults
  const income = parseFloat(localStorage.getItem("monthlyIncome")) || 0;
  if (incomeInput) incomeInput.value = income;

  if (yearlyEl) yearlyEl.textContent = fmt(income * 12);
  // ✅ no more premature balance assignment here

  // Input listeners
  if (incomeInput) {
    incomeInput.addEventListener("input", () => {
      localStorage.setItem("monthlyIncome", incomeInput.value);
      updateTotals();
    });
  }

  document.querySelectorAll(".expense-input").forEach((el) => {
    el.addEventListener("input", updateTotals);
  });

  // Initialize
  updateTotals();
  setupSticky();
});
