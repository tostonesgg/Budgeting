// app.js
document.addEventListener("DOMContentLoaded", () => {

  /* ╔════════════════════════════════════════╗
     ║  DOM references + constants             ║
     ╚════════════════════════════════════════╝ */
  const LS_KEY       = "budget.v1";
  const incomeInput  = document.getElementById("monthly-income");
  const yearlyEl     = document.getElementById("yearly-income");
  const balanceEl    = document.getElementById("balance-remaining");
  const catName      = document.getElementById("cat-name");
  const catIcon      = document.getElementById("cat-icon");
  const addCatBtn    = document.getElementById("add-category");
  const categoriesEl = document.getElementById("categories");
  const shareBtn     = document.getElementById("share-btn");
  const inlineColor  = document.getElementById("inline-color"); // optional, ok if null

  // Color picker references
  const colorBtn    = document.getElementById("cat-color-btn");
  const colorInput  = document.getElementById("cat-color");
  const colorSwatch = colorBtn ? colorBtn.querySelector(".swatch") : null;

  /* ╔════════════════════════════════════════╗
     ║  Helpers (math + formatting)           ║
     ╚════════════════════════════════════════╝ */
  const clamp = (n) => (isFinite(n) ? n : 0);
  const fmt   = (n) => `$${(clamp(n)).toFixed(2)}`;

  /* ╔════════════════════════════════════════╗
     ║  Defaults (starter categories)         ║
     ╚════════════════════════════════════════╝ */
  const defaults = [/* ... unchanged ... */];

  /* ╔════════════════════════════════════════╗
     ║  Load / Save (localStorage + hash)      ║
     ╚════════════════════════════════════════╝ */
  let income = 0;
  let categories = [];

  const tryImportFromHash = () => { /* ... unchanged ... */ };
  const load = () => { /* ... unchanged ... */ };
  const save = () => {
    const payload = JSON.stringify({ income, categories });
    localStorage.setItem(LS_KEY, payload);
  };

  /* ╔════════════════════════════════════════╗
     ║  Color swatch live updates              ║
     ╚════════════════════════════════════════╝ */
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

  /* ╔════════════════════════════════════════╗
     ║  Income updates (input → yearly pill)   ║
     ╚════════════════════════════════════════╝ */
  if (incomeInput) {
    incomeInput.addEventListener("input", () => {
      income = parseFloat(incomeInput.value) || 0;
      if (yearlyEl) yearlyEl.textContent = fmt(income * 12);
      incomeInput.dataset.value = fmt(income); // feeds sticky monthly pill
      updateTotals();
      save();
    });
  }

  /* ╔════════════════════════════════════════╗
     ║  Add new Category                       ║
     ╚════════════════════════════════════════╝ */
  if (addCatBtn) {
    addCatBtn.addEventListener("click", () => {
      const name  = catName.value.trim();
      const icon  = catIcon.value.trim() || "folder";
      const color = (colorInput && colorInput.value) ? colorInput.value : "#3b82f6";
      if (!name) return alert("Please enter a category name");

      categories.push({ name, color, icon, expenses: [] });
      renderCategories();
      catName.value = "";
      catIcon.value = "";
      save();
    });
  }

  /* ╔════════════════════════════════════════╗
     ║  Share template (link via clipboard)    ║
     ╚════════════════════════════════════════╝ */
  if (shareBtn) { /* ... unchanged ... */ }

  /* ╔════════════════════════════════════════╗
     ║  Inline color picker (category footer)  ║
     ╚════════════════════════════════════════╝ */
  let colorPickIndex = null;
  if (inlineColor) { /* ... unchanged ... */ }

  /* ╔════════════════════════════════════════╗
     ║  Render Categories + actions            ║
     ╚════════════════════════════════════════╝ */
  function renderCategories() { /* ... unchanged except updateTotals at end ... */ }

  /* ╔════════════════════════════════════════╗
     ║  Expenses rendering + notes             ║
     ╚════════════════════════════════════════╝ */
  function addExpense(catIndex) { /* ... unchanged ... */ }
  function nextFreq(f) { return f === "mo" ? "qtr" : f === "qtr" ? "yr" : "mo"; }
  function freqLabel(f) { return f === "mo" ? "/mo" : f === "qtr" ? "/3mo" : "/yr"; }
  function monthlyFrom(amount, freq) { /* ... unchanged ... */ }
  function renderExpenses(catIndex) { /* ... unchanged ... */ }
  function renderNotesForCategory(catIndex) { /* ... unchanged ... */ }

  /* ╔════════════════════════════════════════╗
     ║  Totals (per-category + sticky values)  ║
     ╚════════════════════════════════════════╝ */
  function updateTotals() {
    let allExpenses = 0;
    categories.forEach((cat, i) => {
      const total = cat.expenses.reduce(
        (sum, e) => sum + monthlyFrom(parseFloat(e.amount) || 0, e.freq || "mo"),
        0
      );
      allExpenses += total;
      const ttlEl = document.getElementById(`cat-total-${i}`);
      if (ttlEl) ttlEl.textContent = fmt(total);
    });

    const play = income - allExpenses;

    // Step 1 yearly pill
    if (yearlyEl) yearlyEl.textContent = fmt(income * 12);

    // Step 1 balance pill
    if (balanceEl) {
      const clean = `${fmt(play)}/mo`;
      balanceEl.textContent   = clean;
      balanceEl.dataset.value = clean;
    }

    // Sticky play pill
    const stickyPlay = document.getElementById("sticky-play");
    if (stickyPlay) {
      const clean = `${fmt(play)}/mo`;
      stickyPlay.textContent   = clean;
      stickyPlay.dataset.value = clean;
    }
  }

  /* ╔════════════════════════════════════════╗
     ║  Theme toggle (dark ↔ light)            ║
     ╚════════════════════════════════════════╝ */
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) { /* ... unchanged ... */ }

  /* ╔════════════════════════════════════════╗
     ║  Sticky bar setup (independent pills)   ║
     ╚════════════════════════════════════════╝ */
  function setupSticky() {
    const incomeCard    = document.getElementById("income-card");
    const sticky        = document.getElementById("income-sticky");
    const stickyMonthly = document.getElementById("sticky-monthly");
    const stickyYearly  = document.getElementById("sticky-yearly");
    const stickyPlay    = document.getElementById("sticky-play");

    if (!(incomeCard && sticky && stickyMonthly && stickyYearly && stickyPlay && incomeInput && yearlyEl)) {
      console.warn("[sticky] Skipping setup. Missing nodes.");
      return;
    }

    const updateStickyValues = () => {
      stickyMonthly.textContent = incomeInput.dataset.value || (income ? fmt(income) : "—");
      stickyYearly.textContent  = income ? fmt(income * 12) : "—";
    };

    incomeInput.addEventListener("input", updateStickyValues);
    try { new MutationObserver(updateStickyValues).observe(yearlyEl, { childList: true }); } catch {}

    // Show sticky when income card leaves viewport
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

    updateStickyValues();
  }

  /* ╔════════════════════════════════════════╗
     ║  Bootstrap (init page)                  ║
     ╚════════════════════════════════════════╝ */
  if (!load()) {
    income = 0;
    categories = JSON.parse(JSON.stringify(defaults));
  }

  if (incomeInput) {
    incomeInput.value = income ? String(income) : "";
    incomeInput.dataset.value = fmt(parseFloat(incomeInput.value) || 0);
  }
  if (yearlyEl) yearlyEl.textContent = fmt(income * 12);
  if (balanceEl) balanceEl.textContent = `${fmt(income)}/mo`;

  renderCategories();
  updateTotals();
  setupSticky();
});
