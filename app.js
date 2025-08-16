// ========= Helpers =========
const $ = (id) => document.getElementById(id);
const money = (v) =>
  (Number.isFinite(v) ? v : 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
const num = (v) => {
  const s = String(v ?? '').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// ========= Elements =========
const sections = { setup: $('view-setup'), transactions: $('view-transactions'), pie: $('view-pie') };
const tabButtons = [...document.querySelectorAll('.tab-btn')];

const netIncomeEl = $('net-income');
const saveNetBtn = $('save-net');
const netYearlyEl = $('net-yearly');

// Bill inputs (including Phone)
const billEls = {
  rent: $('bill-rent'),
  electric: $('bill-electric'),
  internet: $('bill-internet'),
  gas: $('bill-gas'),
  water: $('bill-water'),
  groceries: $('bill-groceries'),
  phone: $('bill-phone'),
};

// Metrics block (added in index.html)
const nnTotalEl = $('nn-total');
const playLeftEl = $('play-left');

// Transactions
const descEl = $('desc');
const amountEl = $('amount');
const typeEl = $('type');
const categoryEl = $('category');
const addBtn = $('add');
const listEl = $('list');
const searchEl = $('search');
const clearBtn = $('clear');

// Pie
const pieCanvas = $('pie');
const pieLegend = $('pie-legend');
const ctx = pieCanvas.getContext('2d');

// Install hint
$('install-help')?.addEventListener('click', () =>
  alert('Open in Safari → Share → Add to Home Screen to install.')
);

// ========= Storage =========
const KEY_NET = 'budget:net';
const KEY_BILLS = 'budget:bills';
const KEY_TX = 'budget:tx';

let netIncome = load(KEY_NET, 0);
let bills = load(KEY_BILLS, {
  rent: '', electric: '', internet: '', gas: '', water: '', groceries: '', phone: ''
});
let items = load(KEY_TX, []);

// ========= Init =========
initTabs();
initSetup();
updateMetrics();          // show numbers on first load
renderTransactions();
drawPie();

// Rehydrate Lucide icons once on load
if (window.lucide?.createIcons) window.lucide.createIcons();

// Register SW (keep your sw.js as-is)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

// ========= Tabs =========
function initTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab; // 'setup' | 'transactions' | 'pie'
      tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      Object.entries(sections).forEach(([k, sec]) => sec.classList.toggle('active', k === tab));
      if (window.lucide?.createIcons) window.lucide.createIcons();
      if (tab === 'pie') drawPie();
    });
  });
}

// ========= Setup =========
function initSetup() {
  // Net income
  if (netIncome) netIncomeEl.value = netIncome;
  updateYearly();

  // Live updates as you type (also persist)
  netIncomeEl.addEventListener('input', () => {
    updateYearly();
    netIncome = num(netIncomeEl.value);
    save(KEY_NET, netIncome);
    updateMetrics();
  });

  saveNetBtn.addEventListener('click', () => {
    netIncome = num(netIncomeEl.value);
    if (netIncome <= 0) return alert('Please enter a valid monthly net income.');
    save(KEY_NET, netIncome);
    updateYearly();
    updateMetrics();
  });

  // Bills: load + wire events
  for (const [k, el] of Object.entries(billEls)) {
    if (!el) continue;
    el.value = bills[k] ?? '';
    el.addEventListener('input', () => {
      bills[k] = el.value;
      save(KEY_BILLS, bills);
      updateMetrics();
    });
  }
}

function updateYearly() {
  const m = num(netIncomeEl.value) || num(netIncome);
  const y = m > 0 ? m * 12 : 0;
  netYearlyEl.textContent = `Yearly: ${y ? money(y) : '—'}`;
}

// Sum the non-negotiable inputs (live)
function totalNonNegotiables() {
  return (
    num(billEls.rent?.value) +
    num(billEls.electric?.value) +
    num(billEls.internet?.value) +
    num(billEls.gas?.value) +
    num(billEls.water?.value) +
    num(billEls.groceries?.value) +
    num(billEls.phone?.value)
  );
}

// Update the two numbers + color of the banner
function updateMetrics() {
  const net = num(netIncomeEl.value) || num(netIncome);
  const nn = totalNonNegotiables();
  const play = net - nn;

  if (nnTotalEl) nnTotalEl.textContent = money(nn);

  if (playLeftEl) {
    playLeftEl.textContent =
      play >= 0
        ? `You’ve got ${money(play)}/mo to play with`
        : `Over by ${money(Math.abs(play))}/mo`;
    playLeftEl.style.background = play >= 0 ? '#166534' : '#7f1d1d'; // green / red
    playLeftEl.style.color = '#fff';
  }
}

// ========= Transactions =========
addBtn.addEventListener('click', () => {
  const desc = (descEl.value || '').trim();
  const amt = num(amountEl.value);
  const type = typeEl.value;
  const cat = categoryEl.value;
  if (!desc || amt <= 0) return alert('Enter a description and a valid amount.');

  const now = new Date();
  items.unshift({
    id: Date.now(),
    date: now.toISOString().slice(0, 10),
    desc,
    amount: amt,
    type,
    category: cat,
  });
  save(KEY_TX, items);

  descEl.value = '';
  amountEl.value = '';
  renderTransactions();
  drawPie();
});

clearBtn.addEventListener('click', () => {
  if (!items.length) return;
  if (confirm('Clear ALL entries? This cannot be undone.')) {
    items = [];
    save(KEY_TX, items);
    renderTransactions();
    drawPie();
  }
});

function renderTransactions() {
  const q = (searchEl.value || '').toLowerCase();
  const filtered = items.filter((x) => !q || x.desc.toLowerCase().includes(q));
  listEl.innerHTML = filtered
    .map(
      (x) => `
    <li>
      <div>
        <div><strong>${x.desc}</strong> <span class="muted">• ${x.category}</span></div>
        <div class="muted">${x.date} • ${x.type}</div>
      </div>
      <div style="text-align:right"><strong>${money(x.amount)}</strong></div>
      <div style="text-align:right">
        <button data-del="${x.id}" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    </li>`
    )
    .join('');

  listEl.querySelectorAll('button[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      items = items.filter((x) => String(x.id) !== String(id));
      save(KEY_TX, items);
      renderTransactions();
      drawPie();
    });
  });

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

// ========= Income Split (Pie): income by category =========
const CATEGORIES = [
  'Non-Negotiables',
  'Streaming',
  'Big Experiences',
  'Date Nights',
  'Pet',
  'Investments',
  'Savings',
  'Work-Expenses',
  'Fun',
];

function drawPie() {
  const byCat = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const it of items) {
    if (it.type !== 'income') continue;
    const cat = CATEGORIES.includes(it.category) ? it.category : 'Non-Negotiables';
    byCat[cat] += it.amount;
  }
  const labels = Object.keys(byCat);
  const values = labels.map((k) => byCat[k]);
  const total = values.reduce((t, v) => t + v, 0);

  const palette = ['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#22d3ee', '#a78bfa', '#fb7185', '#84cc16', '#f97316'];
  const colors = labels.map((_, i) => palette[i % palette.length]);

  ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);
  if (!total) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('No income recorded yet.', 10, 20);
    pieLegend.innerHTML = '<span class="muted">Add income transactions to see the split.</span>';
    return;
  }
  const cx = pieCanvas.width / 2,
    cy = pieCanvas.height / 2,
    r = Math.min(cx, cy) - 8;
  let start = -Math.PI / 2;
  values.forEach((val, i) => {
    const angle = (val / total) * Math.PI * 2;
    const end = start + angle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    start = end;
  });

  pieLegend.innerHTML = labels
    .map((lab, i) => {
      const pct = total ? Math.round((values[i] / total) * 100) : 0;
      return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
        <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${colors[i]}"></span>
        <span>${lab}</span>
        <span style="margin-left:auto" class="muted">${pct}% • ${money(values[i])}</span>
      </div>`;
    })
    .join('');
}

window.addEventListener('resize', () => {
  if (sections.pie.classList.contains('active')) drawPie();
});

// ========= Storage helpers =========
function load(k, fb) {
  try {
    return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb));
  } catch {
    return fb;
  }
}
function save(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}

// ========= Re-run Lucide after any DOM changes just in case =========
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide?.createIcons) window.lucide.createIcons();
});
