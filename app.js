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

  function deleteExpenseRow(rowEl) {
  const categoryId = rowEl.closest(".category").dataset.categoryId;
  const expenseId = rowEl.dataset.expenseId;

  // Load storage
  const data = JSON.parse(localStorage.getItem("expensesByCategory")) || {};

  if (data[categoryId]) {
    data[categoryId] = data[categoryId].filter(exp => exp.id !== expenseId);
    localStorage.setItem("expensesByCategory", JSON.stringify(data));
  }

  // Remove from DOM
  rowEl.remove();

  // Update totals
  updateTotals();
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
     ║  Category creation + persistence        ║
     ╚════════════════════════════════════════╝ */
  function createCategoryElement(name, icon, color) {
    const wrapper = document.createElement("div");
    wrapper.className = "category";

    const header = document.createElement("div");
    header.className = "category-header flex items-center gap-2";
    header.style.borderColor = color;

    const iconEl = document.createElement("span");
    iconEl.textContent = icon || "📂";
    header.appendChild(iconEl);

    const nameEl = document.createElement("span");
    nameEl.textContent = name;
    header.appendChild(nameEl);

    wrapper.appendChild(header);

    categoriesEl.appendChild(wrapper);
    return wrapper;
  }

    /* ╔════════════════════════════════════════╗
     ║  Expense row builder + persistence      ║
     ╚════════════════════════════════════════╝ */
  function createExpenseRow(categoryId, expenseId, value = 0) {
    const row = document.createElement("div");
    row.className = "expense-row";
    row.dataset.expenseId = expenseId;

    const input = document.createElement("input");
    input.type = "number";
    input.className = "expense-input";
    input.value = value;

    input.addEventListener("input", () => {
      // save to localStorage
      const data = JSON.parse(localStorage.getItem("expensesByCategory")) || {};
      if (!data[categoryId]) data[categoryId] = [];
      const idx = data[categoryId].findIndex(e => e.id === expenseId);
      if (idx >= 0) {
        data[categoryId][idx].value = parseFloat(input.value) || 0;
      } else {
        data[categoryId].push({ id: expenseId, value: parseFloat(input.value) || 0 });
      }
      localStorage.setItem("expensesByCategory", JSON.stringify(data));
      updateTotals();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", () => {
      deleteExpenseRow(row);
    });

    row.appendChild(input);
    row.appendChild(deleteBtn);
    return row;
  }


  function saveCategoriesToStorage() {
    const cats = [];
    categoriesEl.querySelectorAll(".category-header").forEach((hdr) => {
      cats.push({
        icon: hdr.querySelector("span")?.textContent || "📂",
        name: hdr.querySelectorAll("span")[1]?.textContent || "Unnamed",
        color: hdr.style.borderColor || "#ccc"
      });
    });
    localStorage.setItem(LS_KEY_PREFIX + "categories", JSON.stringify(cats));
  }

  function loadCategoriesFromStorage() {
    const cats = JSON.parse(localStorage.getItem(LS_KEY_PREFIX + "categories") || "[]");
    cats.forEach((c) => createCategoryElement(c.name, c.icon, c.color));
  }

  if (addCatBtn) {
    addCatBtn.addEventListener("click", () => {
      const name  = catName.value.trim();
      const icon  = catIcon.value.trim();
      const color = inlineColor?.value || "#ccc";
      if (!name) return;

      createCategoryElement(name, icon, color);
      saveCategoriesToStorage();

      catName.value = "";
      catIcon.value = "";
    });
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

  // Restore categories
  loadCategoriesFromStorage();

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
