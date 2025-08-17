document.addEventListener("DOMContentLoaded", () => {
  const incomeInput = document.getElementById("net-income");
  const yearlyEl = document.getElementById("net-yearly");
  const playEl = document.getElementById("play-left");

  const catName = document.getElementById("cat-name");
  const catIcon = document.getElementById("cat-icon");
  const addCatBtn = document.getElementById("add-category");
  const categoriesEl = document.getElementById("categories");

  // Color picker elements
  const colorBtn   = document.getElementById("cat-color-btn");
  const colorInput = document.getElementById("cat-color");
  const colorSwatch = colorBtn ? colorBtn.querySelector(".swatch") : null;

  let income = 0;

  // Default categories (Essentials)
  let categories = [
    {
      name: "Essentials",
      color: "#ef4444", // red
      icon: "crown",
      expenses: [
        { name: "Mortgage", amount: 0, icon: "house" },
        { name: "HOA", amount: 0, icon: "house" },
        { name: "Property Tax", amount: 0, icon: "banknote" },
        { name: "Electricity", amount: 0, icon: "zap" },
        { name: "Gas", amount: 0, icon: "cooking-pot" },
        { name: "Water", amount: 0, icon: "droplet" },
        { name: "Internet", amount: 0, icon: "wifi" },
        { name: "Phone", amount: 0, icon: "phone" },
        { name: "Home Security", amount: 0, icon: "cctv" },
        { name: "Groceries", amount: 0, icon: "carrot" },
        { name: "Transportation", amount: 0, icon: "fuel" },
        { name: "Car Insurance", amount: 0, icon: "car" },
        { name: "Car Registration", amount: 0, icon: "file-text" },
        { name: "Car Maintenance", amount: 0, icon: "wrench" },
        { name: "Pet Insurance", amount: 0, icon: "dog" },   // ok to change to "paw-print" if you prefer
        { name: "Pet Food", amount: 0, icon: "bone" },       // ok to change to "beef" if you prefer
        { name: "Health Insurance", amount: 0, icon: "stethoscope" }
      ]
    }
  ];

  // ------------------------
  // Color picker wiring (Safari-safe)
  // ------------------------
  if (colorBtn && colorInput) {
    // init swatch from current input value
    if (colorSwatch) colorSwatch.style.background = colorInput.value;

    colorBtn.addEventListener("click", () => {
      if (typeof colorInput.showPicker === "function") {
        colorInput.showPicker();
      } else {
        colorInput.click();
      }
    });

    colorInput.addEventListener("input", () => {
      if (colorSwatch) colorSwatch.style.background = colorInput.value;
      // Optional: outline button with selected color in dark mode only
      if (document.documentElement.dataset.theme === "dark") {
        colorBtn.style.border = `1px solid ${colorInput.value}`;
        colorBtn.style.borderRadius = "8px";
      } else {
        colorBtn.style.border = "";
      }
    });
  }

  // ------------------------
  // Income: update yearly + play money while typing
  // ------------------------
  if (incomeInput) {
    incomeInput.addEventListener("input", () => {
      income = parseFloat(incomeInput.value) || 0;
      if (yearlyEl) yearlyEl.textContent = `Yearly: $${(income * 12).toFixed(2)}`;
      updateTotals();
    });
  }

  // ------------------------
  // Categories
  // ------------------------

  // Add category
  if (addCatBtn) {
    addCatBtn.addEventListener("click", () => {
      const name = catName.value.trim();
      const icon = catIcon.value.trim() || "folder";
      const color = (colorInput && colorInput.value) ? colorInput.value : "#3b82f6";

      if (!name) return alert("Please enter a category name");

      categories.push({ name, color, icon, expenses: [] });
      renderCategories();

      // reset text fields (keep color as last picked)
      catName.value = "";
      catIcon.value = "";
    });
  }

  // Render categories
  function renderCategories() {
    categoriesEl.innerHTML = "";
    categories.forEach((cat, i) => {
      const div = document.createElement("div");
      div.className = "card category";

      // adaptive color
      if (document.documentElement.dataset.theme === "dark") {
        div.style.borderColor = cat.color;
        div.style.background = ""; // transparent in dark
      } else {
        div.style.borderColor = "";
        div.style.background = cat.color + "33"; // ~20% opacity
      }

      div.innerHTML = `
        <div class="category-head">
          <span class="category-title"><i data-lucide="${cat.icon}"></i> ${cat.name}</span>
          <span class="cat-total" id="cat-total-${i}">—</span>
        </div>
        <div class="expenses" id="expenses-${i}"></div>
        <button class="btn-add" data-index="${i}"><i data-lucide="plus"></i> Add expense</button>
      `;
      categoriesEl.appendChild(div);

      // render its expenses immediately
      renderExpenses(i);
    });

    if (window.lucide?.createIcons) window.lucide.createIcons();

    // wire add-expense buttons
    document.querySelectorAll(".btn-add").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = btn.dataset.index;
        addExpense(i);
      });
    });

    updateTotals();
  }

  // Add expense row
  function addExpense(catIndex) {
    const exp = { name: "New Expense", amount: 0, icon: "circle" };
    categories[catIndex].expenses.push(exp);
    renderExpenses(catIndex);
  }

  // Render expenses
  function renderExpenses(catIndex) {
    const expEl = document.getElementById(`expenses-${catIndex}`);
    if (!expEl) return;
    expEl.innerHTML = "";

    categories[catIndex].expenses.forEach((exp, j) => {
      const row = document.createElement("div");
      row.className = "bill-row";
      row.innerHTML = `
        <label><i data-lucide="${exp.icon}"></i> ${exp.name}</label>
        <input type="number" value="${exp.amount}" step="0.01" />
        <button class="btn-icon edit" title="Edit"><i data-lucide="pencil"></i></button>
        <button class="btn-icon del" title="Remove"><i data-lucide="x"></i></button>
      `;
      expEl.appendChild(row);

      // Edit expense
      row.querySelector(".edit").addEventListener("click", () => {
        const newName = prompt("Edit expense name:", exp.name);
        if (newName !== null && newName.trim() !== "") exp.name = newName.trim();
        const newIcon = prompt("Edit icon name (lucide):", exp.icon);
        if (newIcon !== null && newIcon.trim() !== "") exp.icon = newIcon.trim();
        renderExpenses(catIndex);
      });

      // Delete expense
      row.querySelector(".del").addEventListener("click", () => {
        categories[catIndex].expenses.splice(j, 1);
        renderExpenses(catIndex);
      });

      // Update amount
      row.querySelector("input").addEventListener("input", (e) => {
        exp.amount = parseFloat(e.target.value) || 0;
        updateTotals();
      });
    });

    if (window.lucide?.createIcons) window.lucide.createIcons();
    updateTotals();
  }

  // Update totals
  function updateTotals() {
    let allExpenses = 0;
    categories.forEach((cat, i) => {
      const total = cat.expenses.reduce((sum, e) => sum + e.amount, 0);
      allExpenses += total;
      const ttlEl = document.getElementById(`cat-total-${i}`);
      if (ttlEl) ttlEl.textContent = `$${total.toFixed(2)}`;
    });
    const play = income - allExpenses;
    if (playEl) playEl.textContent = `You’ve got $${play.toFixed(2)}/mo to play with`;
  }

  // Theme toggle
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
    renderCategories(); // re-render to apply correct colors
  });

  // ✅ Render defaults on startup
  renderCategories();
});