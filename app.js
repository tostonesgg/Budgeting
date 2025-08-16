// =========================
// Helpers
// =========================
const $ = (id) => document.getElementById(id);
const toCurrency = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

// Robust number parser: handles $, commas, spaces, etc.
function num(v) {
  const s = String(v ?? '').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// =========================
/* Tabs & Elements */
// =========================
const sections = {
  onboarding: $('view-onboarding'),
  analyze: $('view-analyze'),
  transactions: $('view-transactions'),
  pie: $('view-pie'),
};
const tabButtons = [...document.querySelectorAll('.tab-btn')];

// Setup (onboarding)
const netIncomeEl = $('net-income');
const saveNetBtn = $('save-net');
const netYearlyNote = $('net-yearly-note');
const playAmountEl = $('play-amount');

// Top-level category totals (monthly ballparks)
const totalsInputs = {
  'Non-Negotiables': $('total-nonneg'),
  'Streaming': $('total-streaming'),
  'Big Experiences': $('total-big'),
  'Date Nights': $('total-date-nights'),
  'Pet': $('total-pet'),
  'Investments': $('total-investments'),
  'Savings': $('total-savings'),
  'Work-Expenses': $('total-work'),
  'Fun': $('total-fun'),
};

// Detail lists
const nnList = $('nn-list');
const nnAdd = $('nn-add');
const streamList = $('stream-list');
const streamAdd = $('stream-add');
const bigList = $('big-list');
const bigAdd = $('big-add');

// Transactions
const descEl = $('desc');
const amountEl = $('amount');
const typeEl = $('type');
const categoryEl = $('category');
const addBtn = $('add');
const listEl = $('list');
const searchEl = $('search');
const clearBtn = $('clear');

// Analyze + Pie
const catTotalsEl = $('cat-totals');
const pieCanvas = $('pie');
const pieLegend = $('pie-legend');
const ctx = pieCanvas.getContext('2d');

const installHelp = $('install-help');

// =========================
/* Storage Keys & Categories */
// =========================
const KEY_TX    = 'budget:minimal:tx';
const KEY_NET   = 'budget:minimal:net';
const KEY_SETUP = 'budget:minimal:setup';
const KEY_CATS  = 'budget:minimal:categories';

// Canonical categories (global, used everywhere)
const CATEGORIES = [
  'Non-Negotiables',
  'Streaming',
  'Big Experiences',
  'Date Nights',
  'Pet',
  'Investments',
  'Savings',
  'Work-Expenses',
  'Fun'
];

// =========================
/* Load State */
// =========================
let setup = loadJSON(KEY_SETUP, {
  net: 0,
  totals: {
    'Non-Negotiables': '',
    'Streaming': '',
    'Big Experiences': '',
    'Date Nights': '',
    'Pet': '',
    'Investments': '',
    'Savings': '',
    'Work-Expenses': '',
    'Fun': ''
  },
  nonNegotiables: [
    { name:'Mortgage', amount:'', freq:'monthly' },
    { name:'HOA', amount:'', freq:'monthly' },
    { name:'Gas', amount:'', freq:'monthly' },
    { name:'Water', amount:'', freq:'monthly' },
    { name:'Electric', amount:'', freq:'monthly' },
    { name:'Waste', amount:'', freq:'monthly' },
    { name:'Internet', amount:'', freq:'monthly' },
    { name:'Fast Pass', amount:'', freq:'monthly' },
    { name:'Health Insurance', amount:'', freq:'monthly' },
    { name:'Phone', amount:'', freq:'monthly' },
    { name:'Transportation', amount:'', freq:'monthly' },
  ],
  streaming: [
    { name:'', amount:'', freq:'monthly' },
    { name:'', amount:'', freq:'monthly' },
    { name:'', amount:'', freq:'monthly' },
  ],
  big: [
    { name:'', amount:'', freq:'yearly' }
  ]
});

let items = loadJSON(KEY_TX, []);
saveJSON(KEY_CATS, CATEGORIES); // keep categories centralized

// =========================
/* Init */
// =========================
initTabs();
initSetupUI();
populateCategorySelect();
renderAll();
if (window.lucide?.createIcons) window.lucide.createIcons();

// SW
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// =========================
/* Tabs */
// =========================
function initTabs(){
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.toggle('active', b === btn));
      Object.entries(sections).forEach(([k,sec]) => sec.classList.toggle('active', k === tab));
      if (window.lucide?.createIcons) window.lucide.createIcons();
      if (tab === 'pie') drawPie();
    });
  });
}

// =========================
/* Setup UI */
// =========================
function initSetupUI(){
  // Net income
  if (setup.net) netIncomeEl.value = setup.net;
  updateNetYearly();
  updatePlayAmount();

  // Live recompute as user types
  netIncomeEl.addEventListener('input', () => {
    updateNetYearly();
    updatePlayAmount();
  });

  saveNetBtn.addEventListener('click', () => {
    const val = num(netIncomeEl.value);
    if (val <= 0) return alert('Enter a valid monthly net income.');
    setup.net = val;
    saveJSON(KEY_NET, val);
    saveJSON(KEY_SETUP, setup);
    updateNetYearly();
    updatePlayAmount();
  });

  // Top-level totals inputs (ballparks)
  for (const cat of CATEGORIES) {
    const input = totalsInputs[cat];
    if (!input) continue;
    input.value = setup.totals[cat] ?? '';
    input.addEventListener('input', () => {
      setup.totals[cat] = input.value;
      saveJSON(KEY_SETUP, setup);
      updatePlayAmount();
    });
  }

  // Detail lists
  renderSetupList(nnList, setup.nonNegotiables, 'nonNegotiables');
  nnAdd.addEventListener('click', () => {
    setup.nonNegotiables.push({ name:'', amount:'', freq:'monthly' });
    saveJSON(KEY_SETUP, setup);
    renderSetupList(nnList, setup.nonNegotiables, 'nonNegotiables');
    updatePlayAmount();
  });

  renderSetupList(streamList, setup.streaming, 'streaming');
  streamAdd.addEventListener('click', () => {
    setup.streaming.push({ name:'', amount:'', freq:'monthly' });
    saveJSON(KEY_SETUP, setup);
    renderSetupList(streamList, setup.streaming, 'streaming');
    updatePlayAmount();
  });

  renderSetupList(bigList, setup.big, 'big');
  bigAdd.addEventListener('click', () => {
    setup.big.push({ name:'', amount:'', freq:'yearly' });
    saveJSON(KEY_SETUP, setup);
    renderSetupList(bigList, setup.big, 'big');
    updatePlayAmount();
  });
}

function updateNetYearly(){
  const m = num(netIncomeEl.value);
  const y = m > 0 ? m * 12 : 0;
  netYearlyNote.textContent = `Yearly: ${y ? toCurrency(y) : '—'}`;
}

function renderSetupList(root, arr, key){
  root.innerHTML = arr.map((row, i) => `
    <div class="row" data-idx="${i}">
      <input class="name" placeholder="Name" value="${row.name || ''}">
      <input class="amt" type="number" step="0.01" placeholder="Amount" value="${row.amount || ''}">
      <select class="freq">
        ${['weekly','monthly','bi-monthly','quarterly','yearly'].map(opt => `<option value="${opt}" ${row.freq===opt?'selected':''}>${opt}</option>`).join('')}
      </select>
      <button class="mini-btn" data-remove title="Remove"><i data-lucide="x"></i></button>
    </div>
  `).join('');

  root.querySelectorAll('.row').forEach(div => {
    const idx = Number(div.dataset.idx);
    const nameEl = div.querySelector('.name');
    const amtEl  = div.querySelector('.amt');
    const freqEl = div.querySelector('.freq');
    const rmBtn  = div.querySelector('[data-remove]');

    nameEl.addEventListener('input', () => { arr[idx].name = nameEl.value; saveJSON(KEY_SETUP, setup); });
    amtEl.addEventListener('input',  () => { arr[idx].amount = amtEl.value;  saveJSON(KEY_SETUP, setup); updatePlayAmount(); });
    freqEl.addEventListener('change',() => { arr[idx].freq = freqEl.value;   saveJSON(KEY_SETUP, setup); updatePlayAmount(); });

    rmBtn.addEventListener('click', () => {
      arr.splice(idx, 1);
      saveJSON(KEY_SETUP, setup);
      renderSetupList(root, arr, key);
      updatePlayAmount();
    });
  });

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

// Convert detail-row amount to monthly using frequency
function toMonthly(amount, freq){
  const a = num(amount);
  switch (freq) {
    case 'weekly':      return a * (52/12);
    case 'bi-monthly':  return a * 2;
    case 'quarterly':   return a / 3;
    case 'yearly':      return a / 12;
    case 'monthly':
    default:            return a;
  }
}

// Category monthly: prefer top-level total; else sum details (for supported cats)
function categoryMonthly(cat){
  const top = num(setup.totals[cat]);
  if (top > 0) return top;

  if (cat === 'Non-Negotiables') {
    return setup.nonNegotiables.reduce((t,r)=> t + toMonthly(r.amount, r.freq), 0);
  }
  if (cat === 'Streaming') {
    return setup.streaming.reduce((t,r)=> t + toMonthly(r.amount, r.freq), 0);
  }
  if (cat === 'Big Experiences') {
    return setup.big.reduce((t,r)=> t + toMonthly(r.amount, r.freq), 0);
  }
  return 0; // other categories rely on top-level total only
}

// Compute & show “play money”
function updatePlayAmount(){
  const net = setup.net ? setup.net : num(netIncomeEl.value);
  const totalFixed = CATEGORIES.reduce((sum, cat) => sum + categoryMonthly(cat), 0);
  const play = Math.max(0, net - totalFixed);
  playAmountEl.textContent = `${toCurrency(play)}/mo`;
}

// =========================
/* Transactions */
// =========================
installHelp.addEventListener('click', () => {
  alert('Open this site in Safari → Share → Add to Home Screen to install.');
});

addBtn.addEventListener('click', () => {
  const desc = (descEl.value || '').trim();
  const amount = num(amountEl.value);
  const type = typeEl.value;
  const category = categoryEl.value;

  if (!desc || amount <= 0) return alert('Enter a description and a valid amount.');

  const now = new Date();
  items.unshift({ id: Date.now(), date: now.toISOString().slice(0,10), desc, amount, type, category });
  saveJSON(KEY_TX, items);

  descEl.value = '';
  amountEl.value = '';
  renderAll();
});

clearBtn.addEventListener('click', () => {
  if (!items.length) return;
  if (confirm('Clear ALL entries? This cannot be undone.')) {
    items = [];
    saveJSON(KEY_TX, items);
    renderAll();
  }
});

function populateCategorySelect(){
  categoryEl.innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
}

// =========================
/* Analyze / Pie / List */
// =========================
function renderAll(){
  renderTransactions();
  renderCategoryTotals();
  drawPie();
  if (window.lucide?.createIcons) window.lucide.createIcons();
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
      saveJSON(KEY_TX, items);
      renderAll();
    });
  });
}

function renderCategoryTotals(){
  // Sum EXPENSES by category (zeros for all categories)
  const byCat = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  for (const it of items) {
    if (it.type !== 'expense') continue;
    const c = CATEGORIES.includes(it.category) ? it.category : 'Non-Negotiables';
    byCat[c] += it.amount;
  }

  const entries = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const max = Math.max(1, ...entries.map(([,v])=>v));
  catTotalsEl.innerHTML = entries.map(([cat, val]) => `
    <div style="margin:10px 0">
      <div class="flex-row" style="justify-content:space-between">
        <strong>${cat}</strong>
        <span class="muted">${toCurrency(val)}</span>
      </div>
      <div class="bar"><i style="width:${Math.round((val/max)*100)}%"></i></div>
    </div>
  `).join('');
}

function drawPie(){
  // Income by category
  const byCat = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  for (const it of items) {
    if (it.type !== 'income') continue;
    const c = CATEGORIES.includes(it.category) ? it.category : 'Non-Negotiables';
    byCat[c] += it.amount;
  }
  const labels = Object.keys(byCat);
  const values = labels.map(k => byCat[k]);
  const total = values.reduce((t,v)=>t+v,0);

  const palette = ['#60a5fa','#34d399','#f472b6','#f59e0b','#22d3ee','#a78bfa','#fb7185','#84cc16','#f97316'];
  const colors = labels.map((_,i)=>palette[i % palette.length]);

  ctx.clearRect(0,0,pieCanvas.width,pieCanvas.height);
  if (!total) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('No income recorded yet.', 10, 20);
    pieLegend.innerHTML = '<span class="muted">Add income transactions to see the split.</span>';
    return;
  }

  const cx = pieCanvas.width/2, cy = pieCanvas.height/2, r = Math.min(cx, cy) - 8;
  let start = -Math.PI/2;
  values.forEach((val, i) => {
    const angle = (val/total) * Math.PI * 2;
    const end = start + angle;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
    ctx.fillStyle = colors[i]; ctx.fill(); start = end;
  });

  pieLegend.innerHTML = labels.map((lab, i) => {
    const pct = total ? Math.round((values[i]/total)*100) : 0;
    return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
      <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${colors[i]}"></span>
      <span>${lab}</span>
      <span style="margin-left:auto" class="muted">${pct}% • ${toCurrency(values[i])}</span>
    </div>`;
  }).join('');
}

window.addEventListener('resize', () => {
  if (sections.pie.classList.contains('active')) drawPie();
});

// =========================
/* Storage Helpers */
// =========================
function loadJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
