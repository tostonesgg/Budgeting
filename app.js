// helpers
const $ = (id) => document.getElementById(id);
const toCurrency = (n) => (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

// tabs
const sections = {
  onboarding: $('view-onboarding'),
  analyze: $('view-analyze'),
  transactions: $('view-transactions'),
  pie: $('view-pie'),
};
const tabButtons = [...document.querySelectorAll('.tab-btn')];

// onboarding elements
const netIncomeEl = $('net-income');
const netNoteEl = $('net-note');
const saveNetBtn = $('save-net');
const nnList = $('nn-list');
const nnAdd = $('nn-add');
const streamList = $('stream-list');
const streamAdd = $('stream-add');
const bigList = $('big-list');
const bigAdd = $('big-add');

// transactions elements
const descEl = $('desc');
const amountEl = $('amount');
const typeEl = $('type');
const categoryEl = $('category');
const addBtn = $('add');
const listEl = $('list');
const searchEl = $('search');
const clearBtn = $('clear');

// analyze + pie
const catTotalsEl = $('cat-totals');
const pieCanvas = $('pie');
const pieLegend = $('pie-legend');
const ctx = pieCanvas.getContext('2d');

const installHelp = $('install-help');

// storage keys
const KEY_TX   = 'budget:minimal:tx';
const KEY_CATS = 'budget:minimal:categories';
const KEY_NET  = 'budget:minimal:net';
const KEY_SETUP = 'budget:minimal:setup'; // all questionnaire data

// data
const DEFAULT_CATEGORIES = ['Necessary', 'Date Nights', 'Emergency Fund'];
let categories = loadJSON(KEY_CATS, []);
let items = loadJSON(KEY_TX, []);
let netIncome = loadJSON(KEY_NET, 0);
let setup = loadJSON(KEY_SETUP, {
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

// init
ensureDefaultCategories();
populateCategorySelect();
initOnboardingUI();
renderAll();
setupTabs();
if (window.lucide?.createIcons) window.lucide.createIcons();

// SW
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// event handlers
installHelp.addEventListener('click', () => {
  alert('Open in Safari → Share → Add to Home Screen to install.');
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
  saveJSON(KEY_TX, items);

  if (category && !categories.includes(category)) {
    categories.push(category);
    saveJSON(KEY_CATS, categories);
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
    saveJSON(KEY_TX, items);
    renderAll();
  }
});

// storage helpers
function loadJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// categories
function ensureDefaultCategories(){
  if (!categories.length) {
    categories = [...DEFAULT_CATEGORIES];
    saveJSON(KEY_CATS, categories);
  }
}
function populateCategorySelect(){
  categoryEl.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

// tabs
function setupTabs(){
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

// onboarding UI
function initOnboardingUI(){
  // net income
  netIncomeEl.value = netIncome || '';
  updateNetNote();
  saveNetBtn.addEventListener('click', () => {
    netIncome = parseFloat(netIncomeEl.value);
    if (!Number.isFinite(netIncome) || netIncome <= 0) {
      alert('Please enter a valid monthly net income.');
      return;
    }
    saveJSON(KEY_NET, netIncome);
    updateNetNote();
  });

  // lists
  renderSetupList(nnList, setup.nonNegotiables, 'red');
  renderSetupList(streamList, setup.streaming, 'blue');
  renderSetupList(bigList, setup.big, 'yellow');

  nnAdd.addEventListener('click', () => {
    setup.nonNegotiables.push({ name:'', amount:'', freq:'monthly' });
    saveJSON(KEY_SETUP, setup);
    renderSetupList(nnList, setup.nonNegotiables, 'red');
  });
  streamAdd.addEventListener('click', () => {
    setup.streaming.push({ name:'', amount:'', freq:'monthly' });
    saveJSON(KEY_SETUP, setup);
    renderSetupList(streamList, setup.streaming, 'blue');
  });
  bigAdd.addEventListener('click', () => {
    setup.big.push({ name:'', amount:'', freq:'yearly' });
    saveJSON(KEY_SETUP, setup);
    renderSetupList(bigList, setup.big, 'yellow');
  });
}

function updateNetNote(){
  netNoteEl.textContent = netIncome ? `Saved net income: ${toCurrency(netIncome)} per month.` : 'Enter your post-tax monthly income.';
}

function renderSetupList(root, arr, color){
  root.innerHTML = arr.map((row, i) => `
    <div class="row" data-idx="${i}">
      <input class="name" placeholder="Name" value="${row.name || ''}">
      <input class="amt" type="number" step="0.01" placeholder="Amount" value="${row.amount || ''}">
      <select class="freq">
        ${['weekly','monthly','bi-monthly','quarterly','yearly'].map(opt => `<option value="${opt}" ${row.freq===opt?'selected':''}>${opt}</option>`).join('')}
      </select>
      <button class="mini-btn" data-action="remove" title="Remove"><i data-lucide="x"></i></button>
    </div>
  `).join('');

  // wire input changes
  root.querySelectorAll('.row').forEach(div => {
    const idx = Number(div.dataset.idx);
    const nameEl = div.querySelector('.name');
    const amtEl  = div.querySelector('.amt');
    const freqEl = div.querySelector('.freq');
    const rmBtn  = div.querySelector('button[data-action="remove"]');

    nameEl.addEventListener('input', () => { rowAt(arr, idx).name = nameEl.value; saveJSON(KEY_SETUP, setup); });
    amtEl.addEventListener('input',  () => { rowAt(arr, idx).amount = amtEl.value;  saveJSON(KEY_SETUP, setup); });
    freqEl.addEventListener('change',() => { rowAt(arr, idx).freq = freqEl.value;   saveJSON(KEY_SETUP, setup); });

    rmBtn.addEventListener('click', () => {
      arr.splice(idx,1);
      saveJSON(KEY_SETUP, setup);
      renderSetupList(root, arr, color);
    });
  });

  if (window.lucide?.createIcons) window.lucide.createIcons();
}
function rowAt(arr, idx){ return arr[idx]; }

// main renders
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
      saveJSON(KEY_TX, items);
      renderAll();
    });
  });

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

function renderCategoryTotals(){
  const expenseByCat = {};
  for (const it of items) {
    if (it.type !== 'expense') continue;
    const cat = it.category || 'Uncategorized';
    expenseByCat[cat] = (expenseByCat[cat] || 0) + it.amount;
  }
  for (const c of categories) if (!(c in expenseByCat)) expenseByCat[c] = 0;
  const entries = Object.entries(expenseByCat).sort((a,b)=>b[1]-a[1]);
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

// pie: income by category
function drawPie(){
  const byCat = {};
  for (const it of items) {
    if (it.type !== 'income') continue;
    const cat = it.category || 'Uncategorized';
    byCat[cat] = (byCat[cat] || 0) + it.amount;
  }
  for (const c of categories) if (!(c in byCat)) byCat[c] = 0;

  const labels = Object.keys(byCat);
  const values = labels.map(k => byCat[k]);
  const total = values.reduce((t,v)=>t+v,0);

  const palette = ['#60a5fa','#34d399','#f472b6','#f59e0b','#22d3ee','#a78bfa','#fb7185','#84cc16','#f97316','#10b981'];
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

// redraw pie on resize when active
window.addEventListener('resize', () => {
  if (sections.pie.classList.contains('active')) drawPie();
});
