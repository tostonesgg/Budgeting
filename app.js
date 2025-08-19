// app.js
document.addEventListener("DOMContentLoaded", () => {
  const LS_KEY_PREFIX = "budget.";
  const EXPENSES_KEY = "expensesByCategory";

  const incomeInput   = document.getElementById("monthly-input"); 
  const yearlyEl      = document.getElementById("step1-yearly");
  const balanceEl     = document.getElementById("step1-balance");
  const catName       = document.getElementById("cat-name");
  const catIcon       = document.getElementById("cat-icon");
  const addCatBtn     = document.getElementById("add-category");
  const categoriesEl  = document.getElementById("categories");
  const inlineColor   = document.getElementById("cat-color");

  const stickyMonthly = document.getElementById("sticky-monthly");
  const stickyYearly  = document.getElementById("sticky-yearly");
  const stickyBalance = document.getElementById("sticky-balance");

  const clamp = (n) => (isFinite(n) ? n : 0);
  const fmt   = (n) =>
    "$" + Number(clamp(n)).toLocaleString(undefined, { maximumFractionDigits: 0 });

  /* ╔════════════════════════════════════════╗
     ║  Totals updater                         ║
     ╚════════════════════════════════════════╝ */
  function updateTotals() {
    const monthlyIncome = parseFloat(incomeInput?.value) || 0;
    let totalExpenses = 0;
    document.querySelectorAll(".expense-input").forEach((el) => {
      totalExpenses += parseFloat(el.value) || 0;
    });

    const netMonthly = monthlyIncome - totalExpenses;
    const netYearly  = monthlyIncome * 12;

    if (yearlyEl) yearlyEl.textContent = fmt(netYearly);
    if (balanceEl) balanceEl.textContent = fmt(netMonthly) + "/mo";

    if (stickyMonthly) stickyMonthly.textContent = fmt(monthlyIncome);
    if (stickyYearly)  stickyYearly.textContent  = yearlyEl?.textContent;
    if (stickyBalance) stickyBalance.textContent = balanceEl?.textContent;
  }

  /* ╔════════════════════════════════════════╗
     ║  Expense rows                          ║
     ╚════════════════════════════════════════╝ */
  function createExpenseRow(categoryId, expenseId, value = 0, color = "#ccc") {
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
    deleteBtn.style.border = `1px solid ${color}`;
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
     ║  Sticky summary                        ║
     ╚════════════════════════════════════════╝ */
  function setupSticky() {
    const sticky = document.getElementById("income-sticky");
    const incomeCard = document.getElementById("income-card");
    if (!(sticky && incomeCard)) return;

    try {
      const io = new IntersectionObserver(([entry]) => {
        sticky.classList.toggle("is-visible", !entry.isIntersecting);
      });
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
     ║  Categories                            ║
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

    // --- Subtle border buttons ---
    const paintBtn = document.createElement("button");
    paintBtn.textContent = "🎨";
    paintBtn.style.border = `1px solid ${color}`;
    paintBtn.addEventListener("click", () => {
      openColorPicker(wrapper.dataset.categoryId);
    });

    const renameBtn = document.createElement("button");
    renameBtn.textContent = "✏️";
    renameBtn.style.border = `1px solid ${color}`;
    renameBtn.addEventListener("click", () => {
      const newName = prompt("Enter a new category name:", name);
      if (newName) {
        const cats = JSON.parse(localStorage.getItem(LS_KEY_PREFIX + "categories")) || [];
        const cat = cats.find(c => c.id === wrapper.dataset.categoryId);
        if (cat) {
          cat.name = newName;
          localStorage.setItem(LS_KEY_PREFIX + "categories", JSON.stringify(cats));
          renderCategories();
        }
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.style.border = `1px solid ${color}`;
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Delete category "${name}"?`)) {
        let cats = JSON.parse(localStorage.getItem(LS_KEY_PREFIX + "categories")) || [];
        cats = cats.filter(c => c.id !== wrapper.dataset.categoryId);
        localStorage.setItem(LS_KEY_PREFIX + "categories", JSON.stringify(cats));
        wrapper.remove();
      }
    });

    const addExpenseBtn = document.createElement("button");
    addExpenseBtn.textContent = "+ Expense";
    addExpenseBtn.style.border = `1px solid ${color}`;
    addExpenseBtn.addEventListener("click", () => {
      const expenseId = "exp-" + Date.now();
      const row = createExpenseRow(wrapper.dataset.categoryId, expenseId, 0, color);
      wrapper.appendChild(row);

      const data = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || {};
      if (!data[wrapper.dataset.categoryId]) data[wrapper.dataset.categoryId] = [];
      data[wrapper.dataset.categoryId].push({ id: expenseId, value: 0 });
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(data));
    });

    header.appendChild(paintBtn);
    header.appendChild(renameBtn);
    header.appendChild(deleteBtn);
    header.appendChild(addExpenseBtn);

    wrapper.appendChild(header);
    categoriesEl.appendChild(wrapper);
    return wrapper;
  }

  function openColorPicker(categoryId) {
    inlineColor.click();
    inlineColor.oninput = (e) => {
      updateCategoryColor(categoryId, e.target.value);
    };
  }

  function updateCategoryColor(categoryId, newColor) {
    const cats = JSON.parse(localStorage.getItem(LS_KEY_PREFIX + "categories")) || [];
    const cat = cats.find(c => c.id === categoryId);
    if (cat) {
      cat.color = newColor;
      localStorage.setItem(LS_KEY_PREFIX + "categories", JSON.stringify(cats));
    }

    const categoryEl = document.querySelector(`[data-category-id="${categoryId}"] .category-header`);
    if (categoryEl) {
      categoryEl.style.borderColor = newColor;
      categoryEl.querySelectorAll("button").forEach(btn => {
        btn.style.border = `1px solid ${newColor}`;
      });
    }
  }

  function loadCategoriesFromStorage() {
    const cats = JSON.parse(localStorage.getItem(LS_KEY_PREFIX + "categories")) || [];
    cats.forEach((c) => {
      const wrapper = createCategoryElement(c.name, c.icon, c.color);
      wrapper.dataset.categoryId = c.id;
      updateCategoryColor(c.id, c.color);

      const data = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || {};
      (data[c.id] || []).forEach(exp => {
        const row = createExpenseRow(c.id, exp.id, exp.value, c.color);
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
      saveCategories();
      catName.value = "";
      catIcon.value = "";
    });
  }

  function saveCategories() {
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

  /* ╔════════════════════════════════════════╗
     ║  Bootstrap                             ║
     ╚════════════════════════════════════════╝ */
  const savedIncome = localStorage.getItem(LS_KEY_PREFIX + "income");
  if (savedIncome !== null && incomeInput) {
    incomeInput.value = savedIncome;
  }
  loadCategoriesFromStorage();

  if (incomeInput) {
    incomeInput.addEventListener("input", () => {
      localStorage.setItem(LS_KEY_PREFIX + "income", incomeInput.value);
      updateTotals();
    });
  }

  updateTotals();
  setupSticky();
});
