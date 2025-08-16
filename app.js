// --- helpers ---
const $ = (id) => document.getElementById(id);
const toCurrency = (n) => (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

// --- elements ---
const installHelp = $('install-help');

// tabs
const sections = {
  analyze: $('view-analyze'),
  transactions: $('view-transactions'),
  pie: $('view-pie'),
};
const tabButtons = [...document.querySelectorAll('.tab-btn')];

// transactions UI
const descEl = $('desc');
const amountEl = $('amount');
const typeEl = $('type');
const categoryEl = $('category');
const addBtn = $('add');
const listEl = $('list');
const searchEl = $('search');
const clearBtn = $('clear');

// analyze UI
const catTotalsEl = $('cat-totals');

// pie UI
const pieCanvas = $('pie');
const pieLegend = $('pie-legend');
const ctx = pieCanvas.getContext('2d');

// --- storage keys ---
const KEY_TX = 'budget:minimal:tx';
const KEY_CATS = 'budget:minimal:categories';

// --- data ---
const DEFAULT_CATEGORIES = ['Necessary', 'Date Nights', 'Emergency Fund'];
let categories = loadCategories();
let items = loadItems();

// --- init ---
ensureDefaultCategories();
populateCategorySelect();
renderAll();
setupTabs();

if (window.lucide?.createIcons) window.lucide.createIcons();

// --- Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// --- handlers ---
installHelp.addEventListener('click', () => {
  alert('Open this site in Safari → Share → Add to Home Screen to install.');
});

addBtn.addEventListener('click', () => {
  const desc = descEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const type = typeEl.value;
  const category = categoryEl.value;

  if (!desc || !Number.isFinite(amount)) return alert('Enter a description and a valid amount.');

  const now = new Date();
  items.unshift({
    id: Date.now(),
    date: now.toISOString().slice(0,10),
    desc, amount, type, category
  });
  saveItems(items);

  // auto-add unseen category if user somehow typed a new one (future-proofing)
  if (category && !categories.includes(category)) {
    categories.push(category);
    saveCategories(categories);
    populateCategorySelect();
  }

  descEl.value = '';
  amountEl.value = '';
  renderAll();
});

clearBtn.addEventListener('click', () => {
  if (!items.length) return;
  if (confirm('Clear ALL entries? This cannot be undone.')) {
    items = [];
    saveItems(items);
    renderAll();
  }
});

// --- functions: storage ---
function loadItems(){
  try { return JSON.parse(localStorage.getItem(KEY_TX) || '[]'); } catch { return []; }
}
function saveItems(arr){
  localStorage.setItem(KEY_TX, JSON.stringify(arr));
}
function loadCategories(){
  try { return JSON.parse(localStorage.getItem(KEY_CATS) || '[]'); } catch { return []; }
}
function saveCategories(arr){
  localStorage.setItem(KEY_CATS, JSON.stringify(arr));
}
function ensureDefaultCategories(){
  if (!categories.length) {
    categories = [...DEFAULT_CATEGORIES];
    saveCategories(categories);
  }
}

// --- functions: UI ---
function setupTabs(){
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab; // 'analyze' | 'transactions' | 'pie'
      // buttons
      tabButtons.forEach(b => b.classList.toggle('active', b === btn));
      // sections
      Object.entries(sections).forEach(([k,sec]) => sec.classList.toggle('active', k === tab));
      // render if needed
      if (window.lucide?.createIcons) window.lucide.createIcons();
      if (tab === 'pie') drawPie();
    });
  });
}

function populateCategorySelect(){
  categoryEl.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderAll(){
  renderTransactions();
  renderCategoryTotals();
  drawPie();
}

function renderTransactions(){
  const q = (searchEl.value || '').toLowerCase();
  const filtered = items.filter(x => !q || x.desc.toLowerCase().includes(q));
  listEl.innerHTML = filtered.map(x => `
    <li>
      <div>
        <div><strong>${x.desc}</strong> <span class="muted">• ${x.category || '—'}</span></div>
        <div class="muted">${x.date} • ${x.type}</div>
      </div>
      <div style="text-align:right"><strong>${toCurrency(x.amount)}</strong></div>
      <div style="text-align:right">
        <button data-del="${x.id}" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    </li>
  `).join('');

  listEl.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      items = items.filter(x => String(x.id) !== String(id));
      saveItems(items);
      renderAll();
    });
  });

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

function renderCategoryTotals(){
  // Expense totals by category
  const expenseByCat = {};
  for (const it of items) {
    if (it.type !== 'expense') continue;
    const cat = it.category || 'Uncategorized';
    expenseByCat[cat] = (expenseByCat[cat] || 0) + it.amount;
  }
  // Include zero rows for categories with no spend to keep them visible
  for (const c of categories) {
    if (!(c in expenseByCat)) expenseByCat[c] = 0;
  }
  const entries = Object.entries(expenseByCat).sort((a,b)=>b[1]-a[1]);
  const max = Math.max(1, ...entries.map(([,v])=>v));

  catTotalsEl.innerHTML = entries.map(([cat, val]) => `
    <div style="margin:10px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong>${cat}</strong>
        <span class="muted">${toCurrency(val)}</span>
      </div>
      <div class="bar"><i style="width:${Math.round((val/max)*100)}%"></i></div>
    </div>
  `).join('');
}

// --- PIE: income by category ---
function drawPie(){
  // Build dataset
  const byCat = {};
  for (const it of items) {
    if (it.type !== 'income') continue;
    const cat = it.category || 'Uncategorized';
    byCat[cat] = (byCat[cat] || 0) + it.amount;
  }
  // Include zero for unused categories (optional: keeps legend stable)
  for (const c of categories) if (!(c in byCat)) byCat[c] = 0;

  const labels = Object.keys(byCat);
  const values = labels.map(k => byCat[k]);
  const total = values.reduce((t,v)=>t+v,0);

  // Colors (deterministic)
  const palette = [
    '#60a5fa','#34d399','#f472b6','#f59e0b','#22d3ee',
    '#a78bfa','#fb7185','#84cc16','#f97316','#10b981'
  ];
  const colors = labels.map((_,i)=>palette[i % palette.length]);

  // Clear
  ctx.clearRect(0,0,pieCanvas.width,pieCanvas.height);

  if (!total) {
    // No income, show empty state
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('No income recorded yet.', 10, 20);
    pieLegend.innerHTML = '<span class="muted">Add income transactions to see the split.</span>';
    return;
  }

  // Draw pie
  const cx = pieCanvas.width/2;
  const cy = pieCanvas.height/2;
  const r = Math.min(cx, cy) - 8;
  let start = -Math.PI/2;

  values.forEach((val, i) => {
    const angle = (val/total) * Math.PI * 2;
    const end = start + angle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    start = end;
  });

  // Legend
  pieLegend.innerHTML = labels.map((lab, i) => {
    const pct = total ? Math.round((values[i]/total)*100) : 0;
    return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
      <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${colors[i]}"></span>
      <span>${lab}</span>
      <span style="margin-left:auto" class="muted">${pct}% • ${toCurrency(values[i])}</span>
    </div>`;
  }).join('');
}
