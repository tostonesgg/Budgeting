// =========================
// Helpers
// =========================
const $ = (id) => document.getElementById(id);
const toCurrency = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
function num(v){ const s=String(v??'').replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:0; }

// =========================
// Elements
// =========================
const sections = {
  setup: $('view-setup'),
  transactions: $('view-transactions'),
  pie: $('view-pie'),
};
const tabButtons = [...document.querySelectorAll('.tab-btn')];

const installHelp = $('install-help');

// Setup
const netIncomeEl = $('net-income');
const saveNetBtn = $('save-net');
const netYearlyEl = $('net-yearly');

const billInputs = {
  rent: $('bill-rent'),
  electric: $('bill-electric'),
  internet: $('bill-internet'),
  gas: $('bill-gas'),
  water: $('bill-water'),
  groceries: $('bill-groceries'),
};

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

// =========================
// Storage keys & constants
// =========================
const KEY_NET   = 'budget:net';
const KEY_BILLS = 'budget:bills';
const KEY_TX    = 'budget:tx';

const CATEGORIES = [
  'Non-Negotiables','Streaming','Big Experiences','Date Nights','Pet','Investments','Savings','Work-Expenses','Fun'
];

// =========================
// State
// =========================
let netIncome = loadJSON(KEY_NET, 0);
let bills = loadJSON(KEY_BILLS, { rent:'', electric:'', internet:'', gas:'', water:'', groceries:'' });
let items = loadJSON(KEY_TX, []);

// =========================
// Init
// =========================
initTabs();
initSetup();
renderTransactions();
drawPie();
if (window.lucide?.createIcons) window.lucide.createIcons();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

// =========================
// Tabs
// =========================
function initTabs(){
  tabButtons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab = btn.dataset.tab; // 'setup' | 'transactions' | 'pie'
      tabButtons.forEach(b=>b.classList.toggle('active', b===btn));
      Object.entries(sections).forEach(([k,sec])=>sec.classList.toggle('active', k===tab));
      if (window.lucide?.createIcons) window.lucide.createIcons();
      if (tab==='pie') drawPie();
    });
  });
}

// =========================
// Setup tab
// =========================
function initSetup(){
  // Net
  if (netIncome) netIncomeEl.value = netIncome;
  updateYearly();
  netIncomeEl.addEventListener('input', updateYearly);
  saveNetBtn.addEventListener('click', ()=>{
    netIncome = num(netIncomeEl.value);
    if (netIncome<=0) return alert('Please enter a valid monthly net income.');
    saveJSON(KEY_NET, netIncome);
    updateYearly();
  });

  // Bills: load values & wire saving
  for (const [k,input] of Object.entries(billInputs)){
    input.value = bills[k] ?? '';
    input.addEventListener('input', ()=>{
      bills[k] = input.value;
      saveJSON(KEY_BILLS, bills);
    });
  }

  // Install help button
  installHelp.addEventListener('click', ()=>{
    alert('Open in Safari → Share → Add to Home Screen to install.');
  });
}

function updateYearly(){
  const m = num(netIncomeEl.value);
  const base = m>0 ? m : num(netIncome);
  const y = base>0 ? base*12 : 0;
  netYearlyEl.textContent = `Yearly: ${y ? toCurrency(y) : '—'}`;
}

// =========================
// Transactions
// =========================
addBtn.addEventListener('click', ()=>{
  const desc=(descEl.value||'').trim();
  const amt = num(amountEl.value);
  const type= typeEl.value;
  const cat = categoryEl.value;
  if (!desc || amt<=0) return alert('Enter a description and a valid amount.');
  const now=new Date();
  items.unshift({ id:Date.now(), date:now.toISOString().slice(0,10), desc, amount:amt, type, category:cat });
  saveJSON(KEY_TX, items);
  descEl.value=''; amountEl.value='';
  renderTransactions(); drawPie();
});

clearBtn.addEventListener('click', ()=>{
  if (!items.length) return;
  if (confirm('Clear ALL entries? This cannot be undone.')){
    items=[]; saveJSON(KEY_TX, items);
    renderTransactions(); drawPie();
  }
});

function renderTransactions(){
  const q=(searchEl.value||'').toLowerCase();
  const filtered=items.filter(x=>!q || x.desc.toLowerCase().includes(q));
  listEl.innerHTML = filtered.map(x=>`
    <li>
      <div>
        <div><strong>${x.desc}</strong> <span class="muted">• ${x.category}</span></div>
        <div class="muted">${x.date} • ${x.type}</div>
      </div>
      <div style="text-align:right"><strong>${toCurrency(x.amount)}</strong></div>
      <div style="text-align:right">
        <button data-del="${x.id}" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    </li>
  `).join('');
  listEl.querySelectorAll('button[data-del]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.getAttribute('data-del');
      items=items.filter(x=>String(x.id)!==String(id));
      saveJSON(KEY_TX, items);
      renderTransactions(); drawPie();
    });
  });
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

// =========================
// Income Split (Pie) – income by category
// =========================
function drawPie(){
  const byCat = Object.fromEntries(CATEGORIES.map(c=>[c,0]));
  for (const it of items){
    if (it.type !== 'income') continue;
    const cat = CATEGORIES.includes(it.category) ? it.category : 'Non-Negotiables';
    byCat[cat] += it.amount;
  }
  const labels = Object.keys(byCat);
  const values = labels.map(k=>byCat[k]);
  const total = values.reduce((t,v)=>t+v,0);

  const palette=['#60a5fa','#34d399','#f472b6','#f59e0b','#22d3ee','#a78bfa','#fb7185','#84cc16','#f97316'];
  const colors = labels.map((_,i)=>palette[i%palette.length]);

  ctx.clearRect(0,0,pieCanvas.width,pieCanvas.height);
  if (!total){
    ctx.fillStyle='#9ca3af'; ctx.font='14px system-ui, sans-serif';
    ctx.fillText('No income recorded yet.',10,20);
    pieLegend.innerHTML='<span class="muted">Add income transactions to see the split.</span>';
    return;
  }
  const cx=pieCanvas.width/2, cy=pieCanvas.height/2, r=Math.min(cx,cy)-8;
  let start=-Math.PI/2;
  values.forEach((val,i)=>{
    const angle=(val/total)*Math.PI*2, end=start+angle;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath();
    ctx.fillStyle=colors[i]; ctx.fill(); start=end;
  });
  pieLegend.innerHTML = labels.map((lab,i)=>{
    const pct = Math.round((values[i]/total)*100);
    return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
      <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${colors[i]}"></span>
      <span>${lab}</span>
      <span style="margin-left:auto" class="muted">${pct}% • ${toCurrency(values[i])}</span>
    </div>`;
  }).join('');
}

window.addEventListener('resize', ()=>{ if (sections.pie.classList.contains('active')) drawPie(); });

// =========================
// Storage helpers
// =========================
function loadJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
