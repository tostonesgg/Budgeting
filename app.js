document.addEventListener("DOMContentLoaded", () => {
  const incomeInput = document.getElementById("net-income");
  const yearlyEl = document.getElementById("net-yearly");
  const playEl = document.getElementById("play-left");

  const catName = document.getElementById("cat-name");
  const catColor = document.getElementById("cat-color");
  const catIcon = document.getElementById("cat-icon");
  const addCatBtn = document.getElementById("add-category");
  const categoriesEl = document.getElementById("categories");

  let income = 0;
  let categories = [
  {
    name: "Essentials",
    color: "#ef4444", // Default red (adjust if you want a different base color)
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
      { name: "Groceries", amount: 0, icon: "carrot" },
      { name: "Transportation", amount: 0, icon: "fuel" },
      { name: "Car Insurance", amount: 0, icon: "car" },
      { name: "Car Registration", amount: 0, icon: "file-text" },
      { name: "Car Maintenance", amount: 0, icon: "wrench" },
      { name: "Pet Insurance", amount: 0, icon: "paw-print" },
      { name: "Pet Food", amount: 0, icon: "beef" },
      { name: "Health Insurance", amount: 0, icon: "stethoscope" }
    ]
  }
];


  // Hook up category color button to hidden color input
  const colorBtn = document.getElementById("cat-color-btn");
  const colorInput = document.getElementById("cat-color");
  if (colorBtn && colorInput) {
    colorBtn.addEventListener("click", () => {
      colorInput.click();
    });
  }

  // Update yearly + play money while typing
  incomeInput.addEventListener("input", () => {
    income = parseFloat(incomeInput.value) || 0;
    yearlyEl.textContent = `Yearly: $${(income * 12).toFixed(2)}`;
    updateTotals();
  });

  // ------------------------
  // Categories
  // ------------------------

  // Add category
  addCatBtn.addEventListener("click", () => {
    const name = catName.value.trim();
    const color = catColor.value;
    const icon = catIcon.value.trim() || "folder";

    if (!name) return alert("Please enter a category name");

    const category = { name, color, icon, expenses: [] };
    categories.push(category);
    renderCategories();
    catName.value = "";
    catIcon.value = "";
  });

  // Render categories
function renderCategories() {
  categoriesEl.innerHTML = "";
  categories.forEach((cat, i) => {
    const div = document.createElement("div");
    div.className = "card category";

    // apply adaptive color
    if (document.documentElement.dataset.theme === "dark") {
      div.style.borderColor = cat.color;
      div.style.background = ""; // transparent in dark mode
    } else {
      div.style.borderColor = ""; 
      div.style.background = cat.color + "33"; // 20% opacity of chosen color
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
  });

  if (window.lucide?.createIcons) window.lucide.createIcons();

  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = btn.dataset.index;
      addExpense(i);
    });
  });
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
    expEl.innerHTML = "";

    categories[catIndex].expenses.forEach((exp, j) => {
      const row = document.createElement("div");
      row.className = "bill-row";
      row.innerHTML = `
        <label><i data-lucide="${exp.icon}"></i> ${exp.name}</label>
        <input type="number" value="${exp.amount}" step="0.01" />
        <button class="btn-icon edit"><i data-lucide="pencil"></i></button>
        <button class="btn-icon del"><i data-lucide="x"></i></button>
      `;
      expEl.appendChild(row);

      // Edit expense
      row.querySelector(".edit").addEventListener("click", () => {
        const newName = prompt("Edit expense name:", exp.name);
        if (newName) exp.name = newName;
        const newIcon = prompt("Edit icon name (lucide):", exp.icon);
        if (newIcon) exp.icon = newIcon;
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
    playEl.textContent = `You’ve got $${play.toFixed(2)}/mo to play with`;
  }

// Theme toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
  renderCategories(); // re-render to apply correct colors
});
});
