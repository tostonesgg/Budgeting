// app.js
document.addEventListener("DOMContentLoaded", () => {

  /* ╔════════════════════════════════════════╗
     ║  DOM references + constants             ║
     ╚════════════════════════════════════════╝ */
  const LS_KEY       = "budget.v1";
  const incomeInput  = document.getElementById("net-income");
  const yearlyEl     = document.getElementById("net-yearly");
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
  const defaults = [
    {
      name: "Essentials",
      color: "#ef4444",
      icon: "crown",
      expenses: [
        { name: "Mortgage",         amount: 0, icon: "house",       freq: "mo" },
        { name: "HOA",              amount: 0, icon: "house",       freq: "mo" },
        { name: "Electricity",      amount: 0, icon: "zap",         freq: "mo" },
        { name: "Water",            amount: 0, icon: "droplet",     freq: "mo" },
        { name: "Gas",              amount: 0, icon: "cooking-pot", freq: "mo" },
        { name: "Waste",            amount: 0, icon: "trash-2",     freq: "qtr" },
        { name: "Internet",         amount: 0, icon: "wifi",        freq: "mo" },
        { name: "Phone",            amount: 0, icon: "phone",       freq: "mo" },
        { name: "Home Security",    amount: 0, icon: "cctv",        freq: "mo" },
        { name: "Groceries",        amount: 0, icon: "carrot",      freq: "mo" },
        { name: "Transportation",   amount: 0, icon: "fuel",        freq: "mo" },
        { name: "Car Insurance",    amount: 0, icon: "car",         freq: "mo" },
        { name: "Car Registration", amount: 0, icon: "file-text",   freq: "yr" },
        { name: "Car Maintenance",  amount: 0, icon: "wrench",      freq: "qtr" },
        { name: "Pet Insurance",    amount: 0, icon: "paw-print",   freq: "mo" },
        { name: "Pet Food",         amount: 0, icon: "beef",        freq: "qtr" },
        { name: "Health Insurance", amount: 0, icon: "stethoscope", freq: "mo" }
      ]
    }
  ];

  /* ╔════════════════════════════════════════╗
     ║  Load / Save (localStorage + hash)      ║
     ╚════════════════════════════════════════╝ */
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
    } catch (_) { return false; }
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
    } catch (_) { return false; }
  };

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
      if (yearlyEl) yearlyEl.textContent = `Yearly: ${fmt(income * 12)}`;
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
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const obj = { income, categories };
      const enc = encodeURIComponent(btoa(JSON.stringify(obj)));
      const url = `${location.origin}${location.pathname}#share=${enc}`;
      try {
        await navigator.clipboard.writeText(url);
        alert("Share link copied!");
      } catch {
        prompt("Copy this link:", url);
      }
    });
  }

  /* ╔════════════════════════════════════════╗
     ║  Inline color picker (category footer)  ║
     ╚════════════════════════════════════════╝ */
  let colorPickIndex = null;
  if (inlineColor) {
    inlineColor.addEventListener("input", () => {
      if (colorPickIndex == null) return;
      categories[colorPickIndex].color = inlineColor.value;
      colorPickIndex = null;
      renderCategories();
      updateTotals();
      save();
    });
  }

  /* ╔════════════════════════════════════════╗
     ║  Render Categories + actions            ║
     ╚════════════════════════════════════════╝ */
  function renderCategories() {
    if (!categoriesEl) return;
    categoriesEl.innerHTML = "";

    categories.forEach((cat, i) => {
      const div = document.createElement("div");
      div.className = "card category";

      // Adaptive border/background
      if (document.documentElement.dataset.theme === "dark") {
        div.style.borderColor = cat.color;
      } else {
        div.style.background  = cat.color + "33";
      }

      div.innerHTML = `
        <div class="category-head">
          <span class="category-title"><i data-lucide="${cat.icon}"></i> ${cat.name}</span>
          <span class="cat-total" id="cat-total-${i}">—</span>
        </div>
        <div class="expenses" id="expenses-${i}"></div>
        <div class="notes" id="notes-${i}"></div>
        <div class="card-actions">
          <button class="btn-add" data-index="${i}"><i data-lucide="plus"></i> Add expense</button>
          <button class="btn-cat cat-color" data-index="${i}" title="Change color"><i data-lucide="paintbrush-vertical"></i></button>
          <button class="btn-cat cat-edit" data-index="${i}" title="Edit category"><i data-lucide="pencil"></i></button>
          <button class="btn-cat cat-del" data-index="${i}" title="Delete category"><i data-lucide="x"></i></button>
        </div>
      `;
      categoriesEl.appendChild(div);

      // Tint footer buttons
      div.querySelectorAll(".card-actions .btn-add, .card-actions .btn-cat")
        .forEach(btn => { btn.style.borderColor = cat.color; });

      // Color picker for this category
      div.querySelectorAll(".cat-color").forEach(btn => {
        btn.addEventListener("click", () => {
          colorPickIndex = parseInt(btn.dataset.index, 10);
          if (inlineColor) {
            if (typeof inlineColor.showPicker === "function") inlineColor.showPicker();
            else inlineColor.click();
          }
        });
      });

      renderExpenses(i);
    });

    if (window.lucide?.createIcons) window.lucide.createIcons();

    // Wire actions: add, edit, delete
    document.querySelectorAll(".btn-add").forEach(btn => {
      btn.addEventListener("click", () => addExpense(parseInt(btn.dataset.index, 10)));
    });
    document.querySelectorAll(".cat-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index, 10);
        const cat = categories[i];
        const newName = prompt("Edit category name:", cat.name);
        if (newName) cat.name = newName.trim();
        const newIcon = prompt("Edit category icon (lucide):", cat.icon);
        if (newIcon) cat.icon = newIcon.trim();
        renderCategories();
        save();
      });
    });
    document.querySelectorAll(".cat-del").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index, 10);
        if (!confirm(`Delete category "${categories[i].name}"?`)) return;
        categories.splice(i, 1);
        renderCategories();
        updateTotals();
        save();
      });
    });

    updateTotals();
  }

  /* ╔════════════════════════════════════════╗
     ║  Expenses rendering + notes             ║
     ╚════════════════════════════════════════╝ */
  function addExpense(catIndex) {
    categories[catIndex].expenses.push({ name: "New Expense", amount: 0, icon: "circle", freq: "mo" });
    renderExpenses(catIndex);
    save();
  }

  function nextFreq(f) { return f === "mo" ? "qtr" : f === "qtr" ? "yr" : "mo"; }
  function freqLabel(f) { return f === "mo" ? "/mo" : f === "qtr" ? "/3mo" : "/yr"; }
  function monthlyFrom(amount, freq) {
    if (freq === "qtr") return amount / 3;
    if (freq === "yr")  return amount / 12;
    return amount;
  }

  function renderExpenses(catIndex) {
    const expEl   = document.getElementById(`expenses-${catIndex}`);
    const notesEl = document.getElementById(`notes-${catIndex}`);
    if (!expEl) return;
    expEl.innerHTML = "";

    const cat = categories[catIndex];
    const notes = [];

    cat.expenses.forEach((exp, j) => {
      const row = document.createElement("div");
      row.className = "bill-row";
      row.innerHTML = `
        <label><i data-lucide="${exp.icon}"></i> ${exp.name}</label>
        <input type="number" value="${exp.amount}" step="0.01" />
        <button class="btn-freq" title="Change frequency">${freqLabel(exp.freq || "mo")}</button>
        <button class="btn-icon edit" title="Edit expense"><i data-lucide="pencil"></i></button>
        <button class="btn-icon del" title="Remove expense"><i data-lucide="x"></i></button>
      `;
      expEl.appendChild(row);

      row.querySelector(".edit").addEventListener("click", () => {
        const newName = prompt("Edit expense name:", exp.name);
        if (newName) exp.name = newName.trim();
        const newIcon = prompt("Edit icon name (lucide):", exp.icon);
        if (newIcon) exp.icon = newIcon.trim();
        renderExpenses(catIndex);
        save();
      });
      row.querySelector(".del").addEventListener("click", () => {
        cat.expenses.splice(j, 1);
        renderExpenses(catIndex);
        save();
      });
      row.querySelector("input").addEventListener("input", (e) => {
        exp.amount = parseFloat(e.target.value) || 0;
        updateTotals();
        save();
      });

      const freqBtn = row.querySelector(".btn-freq");
      freqBtn.addEventListener("click", () => {
        exp.freq = nextFreq(exp.freq || "mo");
        freqBtn.textContent = freqLabel(exp.freq);
        updateTotals();
        renderNotesForCategory(catIndex);
        save();
      });

      if ((exp.freq || "mo") !== "mo" && exp.amount > 0) {
        const perMo = monthlyFrom(exp.amount, exp.freq || "mo");
        const when  = (exp.freq === "qtr") ? "quarterly" : "yearly";
        notes.push(`${exp.name} occurs ${when}, consider budgeting ${fmt(perMo)} /mo.`);
      }
    });

    if (window.lucide?.createIcons) window.lucide.createIcons();
    if (notesEl) notesEl.innerHTML = notes.length ? notes.map(n => `• ${n}`).join("<br/>") : "";

    updateTotals();
  }

  function renderNotesForCategory(catIndex) {
    const notesEl = document.getElementById(`notes-${catIndex}`);
    if (!notesEl) return;
    const cat = categories[catIndex];
    const notes = [];
    cat.expenses.forEach(exp => {
      if ((exp.freq || "mo") !== "mo" && exp.amount > 0) {
        const perMo = monthlyFrom(exp.amount, exp.freq || "mo");
        const when  = (exp.freq === "qtr") ? "quarterly" : "yearly";
        notes.push(`${exp.name} occurs ${when}, consider budgeting ${fmt(perMo)} /mo.`);
      }
    });
    notesEl.innerHTML = notes.length ? notes.map(n => `• ${n}`).join("<br/>") : "";
  }

  /* ╔════════════════════════════════════════╗
     ║  Totals (per-category + sticky Play)    ║
     ╚════════════════════════════════════════╝ */
  function updateTotals() {
    /**
     * Compute:
     *  1. Per-category monthly totals
     *  2. Global "play money" (income – all expenses)
     * Update DOM:
     *  – Category total labels
     *  – Yearly label under income input
     *  – Sticky Play pill (auto-updates when income/expenses change)
     */
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
    if (yearlyEl) yearlyEl.textContent = `Yearly: ${fmt(income * 12)}`;

    // Update sticky "Play" pill
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
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const html = document.documentElement;
      html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
      renderCategories();
    });
  }

  /* ╔════════════════════════════════════════╗
     ║  Sticky bar setup (independent pills)   ║
     ╚════════════════════════════════════════╝ */
  function setupSticky() {
    const incomeCard    = document.getElementById('income-card');
    const sticky        = document.getElementById('income-sticky');
    const stickyMonthly = document.getElementById('sticky-monthly');
    const stickyYearly  = document.getElementById('sticky-yearly');
    const stickyPlay    = document.getElementById('sticky-play');

    if (!(incomeCard && sticky && stickyMonthly && stickyYearly && stickyPlay && incomeInput && yearlyEl)) {
      console.warn('[sticky] Skipping setup. Missing nodes.');
      return;
    }

    const updateStickyValues = () => {
      stickyMonthly.textContent = incomeInput.dataset.value || (income ? fmt(income) : '—');
      const y = (yearlyEl.textContent || '').replace(/^Yearly:\s*/i, '').trim();
      stickyYearly.textContent  = y || (income ? fmt(income * 12) : '—');
    };

    incomeInput.addEventListener('input', updateStickyValues);
    try { new MutationObserver(updateStickyValues).observe(yearlyEl, { childList: true }); } catch {}

    // Show sticky when income card leaves viewport
    try {
      const io = new IntersectionObserver(([entry]) => {
        sticky.classList.toggle('is-visible', !entry.isIntersecting);
      }, { root: null, threshold: 0 });
      io.observe(incomeCard);
    } catch {
      const onScrollOrResize = () => {
        const r = incomeCard.getBoundingClientRect();
        const isVisible = r.bottom > 0 && r.top < window.innerHeight;
        sticky.classList.toggle('is-visible', !isVisible);
      };
      window.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize);
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
  if (yearlyEl) yearlyEl.textContent = `Yearly: ${fmt(income * 12)}`;

  renderCategories();
  updateTotals();
  setupSticky();
});
