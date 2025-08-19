// app.js
document.addEventListener("DOMContentLoaded", () => {
  /* ╔════════════════════════════════════════╗
     ║  DOM references + constants             ║
     ╚════════════════════════════════════════╝ */
  const LS_KEY_PREFIX = "budget.";
  const incomeInput   = document.getElementById("monthly-input"); // fixed id to match index.html
  const yearlyEl      = document.getElementById("step1-yearly");
  const balanceEl     = document.getElementById("step1-balance");
  const catName       = document.getElementById("cat-name");
  const catIcon       = document.getElementById("cat-icon");
  const addCatBtn     = document.getElementById("add-category");
  const categoriesEl  = document.getElementById("categories");
  const inlineColor   = document.getElementById("cat-color");

  // Sticky bar
  const stickyMonthly = document.getElementById("sticky-monthly");
  const stickyYearly  = document.getElementById("sticky-yearly");
  const stickyBalance = document.getElementById("sticky-balance");

  // Helpers
  const clamp = (n) => (isFinite(n) ? n : 0);
  const fmt   = (n) =>
    "$" + Number(clamp(n)).toLocaleString(undefined, { maximumFractionDigits: 0 });

  const EXPENSES_KEY = "expensesByCategory";

  /* ╔════════════════════════════════════════╗
     ║  Central totals update                  ║
     ╚════════════════════════════════════════╝ */
  function updateTotals() {
    const monthlyIncome = parseFloat(incomeInput?.value) || 0;

    // --- Sum all expenses
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
    if (stickyYearly)  stickyYearly.textContent  = yearlyEl?.textContent;
    if (stickyBalance) stickyBalance.textContent = balanceEl?.textContent;
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
      const data = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || {};
      if (!data[categoryId]) data[categoryId] = [];
      const idx = data[categoryId].findIndex(e => e.id === expenseId);
      if (idx >= 0) {
        data[categoryId][idx].value = parseFloat(input.value) || 0;
      } else {
        data[categoryId].push({ id: expenseId, value: parseFloat(input.value) || 0 });
      }
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(data));
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

  function deleteExpenseRow(rowEl) {
    const categoryId = rowEl.closest(".category").dataset.categoryId;
    const expenseId = rowEl.dataset.expenseId;

    const data = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || {};
    if (data[categoryId]) {
      data[categoryId] = data[categoryId].filter(exp => exp.id !== expenseId);
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(data));
    }

    rowEl.remove();
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
    wrapper.dataset.categoryId = "cat-" + Date.now();

    const header = document.createElement("div");
    header.className = "category-header";
    header.style.borderColor = color;

    const iconEl = document.createElement("span");
    iconEl.textContent = icon || "📂";
    header.appendChild(iconEl);

    const nameEl = document.createElement("span");
    nameEl.textContent = name;
    header.appendChild(nameEl);

    // Add expense button
    const addExpenseBtn = document.createElement("button");
    addExpenseBtn.textContent = "+ Expense";
    addExpenseBtn.addEventListener("click", () => {
      const expenseId = "exp-" + Date.now();
      const row = createExpenseRow(wrapper.dataset.categoryId, expenseId);
      wrapper.appendChild(row);

      // persist blank expense
      const data = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || {};
      if (!data[wrapper.dataset.categoryId]) data[wrapper.dataset.categoryId] = [];
      data[wrapper.dataset.categoryId].push({ id: expenseId, value: 0 });
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(data));
    });
    header.appendChild(addExpenseBtn);

    wrapper.appendChild(header);
    categoriesEl.appendChild(wrapper);
    return wrapper;
  }

  function saveCategoriesToStorage() {
    const cats = [];
    categoriesEl.querySelectorAll(".category").forEach((cat) => {
      const hdr = cat.querySelector(".category-header");
      cats.push({
        id: cat.dataset.categoryId,
        icon: hdr.querySelector("span")?.textContent || "📂",
        name: hdr.querySelectorAll("span")[1]?.textContent || "Unnamed",
        color: hdr.style.borderColor || "#ccc"
      });
    });
    localStorage.setItem(LS_KEY_PREFIX + "categories", JSON.stringify(cats));
  }

  function loadCategoriesFromStorage() {
    const cats = JSON.parse(localStorage.getItem(LS_KEY_PREFIX + "categories") || "[]");
    cats.forEach((c) => {
      const wrapper = createCategoryElement(c.name, c.icon, c.color);
      wrapper.dataset.categoryId = c.id; // restore id

      // load expenses inside this category
      const data = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || {};
      (data[c.id] || []).forEach(exp => {
        const row = createExpenseRow(c.id, exp.id, exp.value);
        wrapper.appendChild(row);
      });
    });
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

  // Restore categories & expenses
  loadCategoriesFromStorage();

  // Listeners
  if (incomeInput) {
    incomeInput.addEventListener("input", () => {
      localStorage.setItem(LS_KEY_PREFIX + "income", incomeInput.value);
      updateTotals();
    });
  }

  /* ╔════════════════════════════════════════╗
     ║  Init                                   ║
     ╚════════════════════════════════════════╝ */
  updateTotals();
  setupSticky();
});
