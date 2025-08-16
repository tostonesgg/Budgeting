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

// Bill inputs (including all new ones)
const billEls = {
  rent: $('bill-rent'),
  hoa: $('bill-hoa'),
  electric: $('bill-electric'),
  internet: $('bill-internet'),
  gas: $('bill-gas'),
  water: $('bill-water'),
  groceries: $('bill-groceries'),
  phone: $('bill-phone'),
  security: $('bill-security'),
  transportation: $('bill-transportation'),
  health: $('bill-health'),
};

// Metrics block (Setup tab)
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

// Income Split (Pie tab)
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
  rent: '', hoa: '', electric: '', internet: '', gas: '', water: '',
  groceries: '', phone: '', security: '', transportation: '', health: ''
});
let items = load(KEY_TX, []);

// ========= Init =========
initTabs();
initSetup();
updateMetrics();          // show numbers on first load (Setup)
renderTransactions();
updateIncomeSplit();      // render initial Income Split

// Rehydrate Lucide icons once on load
if (window.lucide?.createIcons) window.lucide.createIcons();

// Register SW
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

// ========= Tabs =========
function initTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab; // 'setup' | 'transactions' | 'pie'
      tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      Object.entries(sections).forEach(([k, sec]) => sec.classList.toggle('active', k === tab));
      if (window.lucide?.createIcons) window.lucide.createIcons();
      if (tab === 'pie') updateIncomeSplit();
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
    updateIncomeSplit();
  });

  saveNetBtn.addEventListener('click', () => {
    netIncome = num(netIncomeEl.value);
    if (netIncome <= 0) return alert('Please enter a valid monthly net income.');
    save(KEY_NET, netIncome);
    updateYearly();
    updateMetrics();
    updateIncomeSplit();
  });

  // Bills: load + wire events
  for (const [k, el] of Object.entries(billEls)) {
    if (!el) continue;
    el.value = bills[k] ?? '';
    el.addEventListener('input', () => {
      bills[k] = el.value;
      save(KEY_BILLS, bills);
      updateMetrics();
      updateIncomeSplit();
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
    num(billEls.hoa?.value) +
    num(billEls.electric?.value) +
    num(billEls.internet?.value) +
    num(billEls.gas?.value) +
    num(billEls.water?.value) +
    num(billEls.groceries?.value) +
    num(billEls.phone?.value) +
    num(billEls.security?.value) +
    num(billEls.transportation?.value) +
    num(billEls.health?.value)
  );
}

// Update the two numbers + color of the banner (Setup tab)
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
  updateIncomeSplit();
});

clearBtn.addEventListener('click', () => {
  if (!items.length) return;
  if (confirm('Clear ALL entries? This cannot be undone.')) {
    items = [];
    save(KEY_TX, items);
    renderTransactions();
    updateIncomeSplit();
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
      updateIncomeSplit();
    });
  });

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

// ========= Income Split (NEW): Income (green) vs Non-Negotiables (red) =========
function updateIncomeSplit() {
  const income = num(netIncomeEl.value) || num(netIncome); // from Setup (not transactions)
  const nn = totalNonNegotiables();
  const remainder = income - nn;

  // Draw two-slice pie
  drawIncomeVsNNPie({ income, nn });

  // Build category pills + remainder + message
  const green = '#22c55e'; // Tailwind green-500
  const red   = '#ef4444'; // Tailwind red-500

  const pillsHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
      <span style="display:inline-flex;align-items:center;gap:8px;background:${green};color:#0b1220;padding:6px 10px;border-radius:999px;font-weight:700">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#0b1220"></span>
        Income: ${money(income)}
      </span>
      <span style="display:inline-flex;align-items:center;gap:8px;background:${red};color:#fff;padding:6px 10px;border-radius:999px;font-weight:700">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fff"></span>
        Non-Negotiables: ${money(nn)}
      </span>
    </div>
    <div style="margin-top:12px;font-size:16px;font-weight:800">
      Remainder: ${money(remainder)}
    </div>
    <div style="margin-top:6px;font-size:14px;">
      ${
        remainder >= 0
          ? `<span style="color:${green};font-weight:700">Congrats, you're within budget!</span>`
          : `<span style="color:${red};font-weight:700">Uh oh, looks like you need to lower your spending!</span>`
      }
    </div>
  `;

  pieLegend.innerHTML = pillsHTML;
}

function drawIncomeVsNNPie({ income, nn }) {
  const total = Math.max(0, income) + Math.max(0, nn);
  ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);

  // If both are zero, show hint
  if (total <= 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Add income and bills to see the split.', 10, 20);
    return;
  }

  const green = '#22c55e';
  const red   = '#ef4444';

  const cx = pieCanvas.width / 2;
  const cy = pieCanvas.height / 2;
  const r  = Math.min(cx, cy) - 8;

  let start = -Math.PI / 2;

  // Income slice
  const incAngle = total ? (Math.max(0, income) / total) * Math.PI * 2 : 0;
  let end = start + incAngle;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
  ctx.fillStyle = green; ctx.fill();
  start = end;

  // Non-Negotiables slice
  const nnAngle = total ? (Math.max(0, nn) / total) * Math.PI * 2 : 0;
  end = start + nnAngle;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
  ctx.fillStyle = red; ctx.fill();
}

// Keep canvas responsive
window.addEventListener('resize', () => {
  if (sections.pie.classList.contains('active')) updateIncomeSplit();
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
