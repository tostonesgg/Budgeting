document.addEventListener("DOMContentLoaded", () => {
  const LS_KEY = "budget.v1";
  const incomeInput = document.getElementById("net-income");
  const yearlyEl = document.getElementById("net-yearly");
  const playEl = document.getElementById("play-left");

  // NEW: hidden element for sticky-only value
  let playValueEl = document.getElementById("play-value");
  if (!playValueEl) {
    playValueEl = document.createElement("span");
    playValueEl.id = "play-value";
    playValueEl.style.display = "none";
    document.body.appendChild(playValueEl);
  }

  const catName = document.getElementById("cat-name");
  const catIcon = document.getElementById("cat-icon");
  const addCatBtn = document.getElementById("add-category");
  const categoriesEl = document.getElementById("categories");
  const shareBtn = document.getElementById("share-btn");
  const inlineColor = document.getElementById("inline-color");
  let colorPickIndex = null;

  const colorBtn = document.getElementById("cat-color-btn");
  const colorInput = document.getElementById("cat-color");
  const colorSwatch = colorBtn ? colorBtn.querySelector(".swatch") : null;

  const clamp = (n) => (isFinite(n) ? n : 0);
  const fmt = (n) => `$${(clamp(n)).toFixed(2)}`;

  const defaults = [
    {
      name: "Essentials",
      color: "#ef4444",
      icon: "crown",
      expenses: [
        { name: "Mortgage", amount: 0, icon: "house", freq: "mo" },
        { name: "HOA", amount: 0, icon: "house", freq: "mo" },
        { name: "Electricity", amount: 0, icon: "zap", freq: "mo" },
        { name: "Water", amount: 0, icon: "droplet", freq: "mo" },
        { name: "Gas", amount: 0, icon: "cooking-pot", freq: "mo" },
        { name: "Waste", amount: 0, icon: "trash-2", freq: "qtr" },
        { name: "Internet", amount: 0, icon: "wifi", freq: "mo" },
        { name: "Phone", amount: 0, icon: "phone", freq: "mo" },
        { name: "Home Security", amount: 0, icon: "cctv", freq: "mo" },
        { name: "Groceries", amount: 0, icon: "carrot", freq: "mo" },
        { name: "Transportation", amount: 0, icon: "fuel", freq: "mo" },
        { name: "Car Insurance", amount: 0, icon: "car", freq: "mo" },
        { name: "Car Registration", amount: 0, icon: "file-text", freq: "yr" },
        { name: "Car Maintenance", amount: 0, icon: "wrench", freq: "qtr" },
        { name: "Pet Insurance", amount: 0, icon: "paw-print", freq: "mo" },
        { name: "Pet Food", amount: 0, icon: "beef", freq: "qtr" },
        { name: "Health Insurance", amount: 0, icon: "stethoscope", freq: "mo" }
      ]
    }
  ];

  let income = 0;
  let categories = [];

  const tryImportFromHash = () => {
    const h = location.hash;
    if (!h.startsWith("#share=")) return false;
    try {
      const enc = decodeURIComponent(h.slice(7));
      const json = atob(enc);
      const obj = JSON.parse(json);
      if (typeof obj !== "object") return false;
      income = clamp(parseFloat(obj.income) || 0);
      categories = Array.isArray(obj.categories) ? obj.categories : [];
      location.hash = "";
      return true;
    } catch (_) {
      return false;
    }
  };

  const load = () => {
    if (tryImportFromHash()) return true;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    try {
      const obj = JSON.parse(raw);
      income = clamp(parseFloat(obj.income) || 0);
      categories = Array.isArray(obj.categories) ? obj.categories : [];
      return true;
    } catch (_) {
      return false;
    }
  };

  const save = () => {
    const payload = JSON.stringify({ income, categories });
    localStorage.setItem(LS_KEY, payload);
  };

  if (colorSwatch && colorInput) colorSwatch.style.background = colorInput.value;
  if (colorInput) {
    colorInput.addEventListener("input", () => {
      if (colorSwatch) colorSwatch.style.background = colorInput.value;
      if (document.documentElement.dataset.theme === "dark" && colorBtn) {
        colorBtn.style.border = `1px solid ${colorInput.value}`;
        colorBtn.style.borderRadius = "8px";
      } else if (colorBtn) {
        colorBtn.style.border = "";
      }
    });
  }

  if (incomeInput) {
    incomeInput.addEventListener("input", () => {
      income = parseFloat(incomeInput.value) || 0;
      if (yearlyEl) yearlyEl.textContent = `Yearly: ${fmt(income * 12)}`;
      updateTotals();
      save();
    });
  }

  if (addCatBtn) {
    addCatBtn.addEventListener("click", () => {
      const name = catName.value.trim();
      const icon = catIcon.value.trim() || "folder";
      const color = (colorInput && colorInput.value) ? colorInput.value : "#3b82f6";
      if (!name) return alert("Please enter a category name");

      categories.push({ name, color, icon, expenses: [] });
      renderCategories();
      catName.value = "";
      catIcon.value = "";
      save();
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const obj = { income, categories };
      const enc = encodeURIComponent(btoa(JSON.stringify(obj)));
      const url = `${location.origin}${location.pathname}#share=${enc}`;
      try {
        await navigator.clipboard.writeText(url);
        alert("Share link copied! Send it to your wife and opening it will load this template.");
      } catch {
        prompt("Copy this link:", url);
      }
    });
  }

  if (inlineColor) {
    inlineColor.addEventListener("input", () => {
      if (colorPickIndex == null) return;
      const newColor = inlineColor.value;
      categories[colorPickIndex].color = newColor;
      colorPickIndex = null;
      renderCategories();
      updateTotals();
      save && save();
    });
  }

  // --- renderCategories, renderExpenses, etc. remain unchanged ---

  // Totals (per-category normalized monthly + play money)
  function updateTotals() {
    let allExpenses = 0;
    categories.forEach((cat, i) => {
      const total = cat.expenses.reduce((sum, e) => {
        const amt = parseFloat(e.amount) || 0;
        return sum + monthlyFrom(amt, e.freq || "mo");
      }, 0);
      allExpenses += total;
      const ttlEl = document.getElementById(`cat-total-${i}`);
      if (ttlEl) ttlEl.textContent = fmt(total);
    });
    const play = income - allExpenses;

    if (yearlyEl) yearlyEl.textContent = `Yearly: ${fmt(income * 12)}`;
    if (playEl) playEl.textContent = `You’ve got ${fmt(play)}/mo to play with`;

    // NEW: update hidden raw numeric value for sticky pills
    if (playValueEl) playValueEl.textContent = fmt(play);
  }

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
    renderCategories();
  });

  if (!load()) {
    income = 0;
    categories = JSON.parse(JSON.stringify(defaults));
  }

  if (incomeInput) incomeInput.value = income ? String(income) : "";
  if (yearlyEl) yearlyEl.textContent = `Yearly: ${fmt(income * 12)}`;

  renderCategories();
  updateTotals();
});
