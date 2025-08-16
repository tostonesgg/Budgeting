// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const money = (v) => (Number.isFinite(v) ? v : 0).toLocaleString(undefined,{style:'currency',currency:'USD'});
const num = (v) => { const s=String(v??'').replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:0; };

// ---------- elements ----------
const sections = { setup:$('view-setup'), transactions:$('view-transactions'), pie:$('view-pie') };
const tabButtons = [...document.querySelectorAll('.tab-btn')];
const themeToggle = $('theme-toggle');

const netIncomeEl = $('net-income');
const saveNetBtn = $('save-net');
const netYearlyEl = $('net-yearly');

// category header totals
const headTotals = {
  nn: $('ttl-nn'),
  subs: $('ttl-subs'),
  dates: $('ttl-dates'),
  invest: $('ttl-invest'),
  oneoff: $('ttl-oneoff'),
};

// setup metrics
const nnTotalEl = $('nn-total');
const playLeftEl = $('play-left');

// transactions
const descEl = $('desc'); const amountEl = $('amount'); const typeEl = $('type'); const categoryEl = $('category');
const addBtn = $('add'); const listEl = $('list'); const searchEl = $('search'); const clearBtn = $('clear');

// pie
const pieCanvas = $('pie'); const pieLegend = $('pie-legend'); const ctx = pieCanvas.getContext('2d');

// bill inputs (ids must match index.html)
const billIds = [
  // Non-Negotiables
  'rent','hoa','electric','internet','gas','water','groceries','phone','carins','carmaint','smeegs','security','transportation','health',
  // Subscriptions
  'amazon','netflix','disney','crunchy','barkbox','chatgpt',
  // Date Nights
  'lunches','themeparks','parking','shopping',
  // Investments
  'stocks','crypto','collectibles','savings','emergency',
  // One-off
  'art','fishing','travel','smeegother',
];
const billEls = Object.fromEntries(billIds.map(k => [k, $(`bill-${k}`)]));

// ---------- storage ----------
const KEY_NET='budget:net'; const KEY_BILLS='budget:bills'; const KEY_TX='budget:tx'; const KEY_THEME='budget:theme';
function load(k, fb){ try{return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb));}catch{return fb;} }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

let netIncome = load(KEY_NET, 0);
let bills = load(KEY_BILLS, Object.fromEntries(billIds.map(k=>[k,''])));
let items = load(KEY_TX, []);
let theme = load(KEY_THEME, 'dark'); // 'dark' | 'light'

// ---------- theme ----------
applyTheme(theme);
themeToggle?.addEventListener('click', ()=>{
  theme = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
  applyTheme(theme);
  save(KEY_THEME, theme);
});
function applyTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

// ---------- init ----------
initTabs();
initSetup();
updateMetrics();
renderTransactions();
updateIncomeSplit();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

// ---------- tabs ----------
function initTabs(){
  tabButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tab = btn.dataset.tab;
      tabButtons.forEach(b=>b.classList.toggle('active', b===btn));
      Object.entries(sections).forEach(([k,sec])=> sec.classList.toggle('active', k===tab));
      if (tab==='pie') updateIncomeSplit();
      if (window.lucide?.createIcons) window.lucide.createIcons();
    });
  });
}

// ---------- setup ----------
function initSetup(){
  if (netIncome) netIncomeEl.value = netIncome;
  updateYearly();

  netIncomeEl.addEventListener('input', ()=>{
    netIncome = num(netIncomeEl.value); save(KEY_NET, netIncome);
    updateYearly(); updateMetrics(); updateIncomeSplit();
  });
  saveNetBtn.addEventListener('click', ()=>{
    netIncome = num(netIncomeEl.value);
    if (netIncome <= 0) return alert('Please enter a valid monthly net income.');
    save(KEY_NET, netIncome); updateYearly(); updateMetrics(); updateIncomeSplit();
  });

  for (const [k,el] of Object.entries(billEls)){
    if (!el) continue;
    el.value = bills[k] ?? '';
    el.addEventListener('input', ()=>{
      bills[k] = el.value; save(KEY_BILLS, bills);
      updateMetrics(); updateIncomeSplit();
    });
  }
}

function updateYearly(){
  const m = num(netIncomeEl.value) || num(netIncome);
  const y = m>0 ? m*12 : 0;
  netYearlyEl.textContent = `Yearly: ${y ? money(y) : '—'}`;
}

// ---------- totals ----------
const sum = (...keys)=> keys.reduce((t,k)=> t + num(billEls[k]?.value), 0);

function totalNN(){ return sum('rent','hoa','electric','internet','gas','water','groceries','phone','carins','carmaint','smeegs','security','transportation','health'); }
function totalSubs(){ return sum('amazon','netflix','disney','crunchy','barkbox','chatgpt'); }
function totalDates(){ return sum('lunches','themeparks','parking','shopping'); }
function totalInvest(){ return sum('stocks','crypto','collectibles','savings','emergency'); }
function totalOne(){ return sum('art','fishing','travel','smeegother'); }

function updateHeaderTotals(){
  if (headTotals.nn) headTotals.nn.textContent = money(totalNN());
  if (headTotals.subs) headTotals.subs.textContent = money(totalSubs());
  if (headTotals.dates) headTotals.dates.textContent = money(totalDates());
  if (headTotals.invest) headTotals.invest.textContent = money(totalInvest());
  if (headTotals.oneoff) headTotals.oneoff.textContent = money(totalOne());
}

// Setup metrics block
function updateMetrics(){
  const net = num(netIncomeEl.value) || num(netIncome);
  const nn = totalNN(), subs = totalSubs(), dates = totalDates(), inv = totalInvest(), one = totalOne();
  const allocated = nn + subs + dates + inv + one;
  const play = allocated > 0 ? net - allocated : net;

  if (nnTotalEl) nnTotalEl.textContent = money(nn);
  if (playLeftEl){
    playLeftEl.textContent = play >= 0 ? `You’ve got ${money(play)}/mo to play with`
                                       : `Over by ${money(Math.abs(play))}/mo`;
    playLeftEl.style.background = play >= 0 ? '#166534' : '#7f1d1d';
    playLeftEl.style.color = '#fff';
  }
  updateHeaderTotals();
}

// ---------- transactions ----------
addBtn.addEventListener('click', ()=>{
  const desc=(descEl.value||'').trim(); const amt=num(amountEl.value);
  const type=typeEl.value; const cat=categoryEl.value;
  if (!desc || amt<=0) return alert('Enter a description and a valid amount.');
  const now=new Date();
  items.unshift({ id:Date.now(), date:now.toISOString().slice(0,10), desc, amount:amt, type, category:cat });
  save(KEY_TX, items);
  descEl.value=''; amountEl.value='';
  renderTransactions(); updateIncomeSplit();
});
clearBtn.addEventListener('click', ()=>{
  if (!items.length) return;
  if (confirm('Clear ALL entries? This cannot be undone.')){
    items=[]; save(KEY_TX, items);
    renderTransactions(); updateIncomeSplit();
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
      <div style="text-align:right"><strong>${money(x.amount)}</strong></div>
      <div style="text-align:right"><button data-del="${x.id}" title="Delete"><i data-lucide="trash-2"></i></button></div>
    </li>`).join('');
  listEl.querySelectorAll('button[data-del]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.getAttribute('data-del');
      items=items.filter(x=>String(x.id)!==String(id));
      save(KEY_TX, items); renderTransactions(); updateIncomeSplit();
    });
  });
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

// ---------- pie ----------
function updateIncomeSplit(){
  const slices = [
    { label:'Non-Negotiables', value: totalNN(), color:'#ef4444' },
    { label:'Subscriptions',   value: totalSubs(), color:'#3b82f6' },
    { label:'Date Nights',     value: totalDates(), color:'#ec4899' },
    { label:'Investments',     value: totalInvest(), color:'#f59e0b' },
    { label:'One-off Purchases', value: totalOne(), color:'#38bdf8' },
  ];
  drawPie(slices);
  drawLegendOnCanvas(slices);
  const income = num(netIncomeEl.value) || num(netIncome);
  const allocated = slices.reduce((t,s)=>t+s.value,0);
  const remainder = income - allocated;

  pieLegend.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
      ${slices.map(({label,value,color})=>{
        const fg = (color === '#ef4444') ? '#fff' : '#0b1220';
        const dot = fg === '#fff' ? '#fff' : '#0b1220';
        return `<span style="display:inline-flex;align-items:center;gap:8px;background:${color};color:${fg};padding:6px 10px;border-radius:999px;font-weight:700">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${dot}"></span>
          ${label}: ${money(value)}
        </span>`;
      }).join('')}
    </div>
    <div style="margin-top:12px;font-size:16px;font-weight:800">Remainder: ${money(remainder)}</div>
    <div style="margin-top:6px;font-size:14px;">
      ${remainder >= 0
        ? `<span style="color:#22c55e;font-weight:700">Congrats, you're within budget!</span>`
        : `<span style="color:#ef4444;font-weight:700">Uh oh, looks like you need to lower your spending!</span>`}
    </div>
  `;
}

function drawPie(slices){
  const total = slices.reduce((t,s)=>t + Math.max(0,s.value), 0);
  ctx.clearRect(0,0,pieCanvas.width,pieCanvas.height);
  if (total<=0){
    ctx.fillStyle='#9ca3af'; ctx.font='14px system-ui, sans-serif';
    ctx.fillText('Add amounts to see the split.',10,20); return;
  }
  const cx=pieCanvas.width/2, cy=pieCanvas.height/2, r=Math.min(cx,cy)-8;
  let start=-Math.PI/2;
  for (const {value,color} of slices){
    const angle=(Math.max(0,value)/total)*Math.PI*2; if (angle<=0) continue;
    const end=start+angle;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath();
    ctx.fillStyle=color; ctx.fill(); start=end;
  }
}
function drawLegendOnCanvas(slices){
  const pad=10, lineH=18, panelW=Math.min(pieCanvas.width-12, 260);
  ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(6,6,panelW,slices.length*lineH+12);
  slices.forEach(({label,value,color},i)=>{
    ctx.fillStyle=color; ctx.fillRect(pad, pad+i*lineH+4, 10, 10);
    ctx.fillStyle='#e5e7eb'; ctx.font='12px system-ui, sans-serif';
    ctx.fillText(`${label}: ${money(value)}`, pad+16, pad+i*lineH+14);
  });
}
window.addEventListener('resize', ()=>{ if (sections.pie.classList.contains('active')) updateIncomeSplit(); });