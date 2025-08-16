// ========= Helpers =========
const $ = (id) => document.getElementById(id);
const money = (v) => (Number.isFinite(v) ? v : 0).toLocaleString(undefined,{style:'currency',currency:'USD'});
const num = (v) => { const s=String(v??'').replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:0; };

// ========= Elements =========
const sections = { setup:$('view-setup'), transactions:$('view-transactions'), pie:$('view-pie') };
const tabButtons = [...document.querySelectorAll('.tab-btn')];

const netIncomeEl = $('net-income');
const saveNetBtn = $('save-net');
const netYearlyEl = $('net-yearly');

// Bills: Non-Negotiables + Subscriptions + Date Nights + Investments + One-off
const billEls = {
  // Non-Negotiables
  rent:$('bill-rent'), hoa:$('bill-hoa'), electric:$('bill-electric'), internet:$('bill-internet'),
  gas:$('bill-gas'), water:$('bill-water'), groceries:$('bill-groceries'), phone:$('bill-phone'),
  carins:$('bill-carins'), carmaint:$('bill-carmaint'), smeegs:$('bill-smeegs'),
  security:$('bill-security'), transportation:$('bill-transportation'), health:$('bill-health'),
  // Subscriptions
  amazon:$('bill-amazon'), netflix:$('bill-netflix'), disney:$('bill-disney'), crunchy:$('bill-crunchy'),
  barkbox:$('bill-barkbox'), chatgpt:$('bill-chatgpt'),
  // Date Nights (consolidated)
  lunches:$('bill-lunches'), themeparks:$('bill-themeparks'), parking:$('bill-parking'), shopping:$('bill-shopping'),
  // Investments
  stocks:$('bill-stocks'), crypto:$('bill-crypto'), collectibles:$('bill-collectibles'),
  savings:$('bill-savings'), emergency:$('bill-emergency'),
  // One-off Purchases
  art:$('bill-art'), fishing:$('bill-fishing'), travel:$('bill-travel'), smeegother:$('bill-smeegother'),
};

// Metrics (Setup tab)
const nnTotalEl = $('nn-total');
const playLeftEl = $('play-left');

// Transactions
const descEl = $('desc'); const amountEl = $('amount'); const typeEl = $('type'); const categoryEl = $('category');
const addBtn = $('add'); const listEl = $('list'); const searchEl = $('search'); const clearBtn = $('clear');

// Income Split
const pieCanvas = $('pie'); const pieLegend = $('pie-legend'); const ctx = pieCanvas.getContext('2d');

// Install hint
$('install-help')?.addEventListener('click', ()=>alert('Open in Safari → Share → Add to Home Screen to install.'));

// ========= Storage =========
const KEY_NET='budget:net'; const KEY_BILLS='budget:bills'; const KEY_TX='budget:tx';
let netIncome = load(KEY_NET, 0);
let bills = load(KEY_BILLS, Object.fromEntries(Object.keys(billEls).map(k=>[k,''])));
let items = load(KEY_TX, []);

// ========= Init =========
initTabs();
initSetup();
updateMetrics();
renderTransactions();
updateIncomeSplit();

if (window.lucide?.createIcons) window.lucide.createIcons();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

// ========= Tabs =========
function initTabs(){
  tabButtons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab = btn.dataset.tab;
      tabButtons.forEach(b=>b.classList.toggle('active', b===btn));
      Object.entries(sections).forEach(([k,sec])=>sec.classList.toggle('active', k===tab));
      if (window.lucide?.createIcons) window.lucide.createIcons();
      if (tab==='pie') updateIncomeSplit();
    });
  });
}

// ========= Setup =========
function initSetup(){
  if (netIncome) netIncomeEl.value = netIncome;
  updateYearly();

  netIncomeEl.addEventListener('input', ()=>{
    updateYearly();
    netIncome = num(netIncomeEl.value); save(KEY_NET, netIncome);
    updateMetrics(); updateIncomeSplit();
  });
  saveNetBtn.addEventListener('click', ()=>{
    netIncome = num(netIncomeEl.value);
    if (netIncome<=0) return alert('Please enter a valid monthly net income.');
    save(KEY_NET, netIncome); updateYearly(); updateMetrics(); updateIncomeSplit();
  });

  for (const [k,el] of Object.entries(billEls)){
    if (!el) continue;
    el.value = bills[k] ?? '';
    el.addEventListener('input', ()=>{
      bills[k]=el.value; save(KEY_BILLS, bills);
      updateMetrics(); updateIncomeSplit();
    });
  }
}

function updateYearly(){
  const m = num(netIncomeEl.value) || num(netIncome);
  const y = m>0 ? m*12 : 0;
  netYearlyEl.textContent = `Yearly: ${y ? money(y) : '—'}`;
}

// === Category totals ===
const sum = (...keys)=> keys.reduce((t,k)=> t + num(billEls[k]?.value), 0);

function totalNonNegotiables(){
  return sum('rent','hoa','electric','internet','gas','water','groceries','phone',
             'carins','carmaint','smeegs','security','transportation','health');
}
function totalSubscriptions(){ return sum('amazon','netflix','disney','crunchy','barkbox','chatgpt'); }
function totalDateNights(){ return sum('lunches','themeparks','parking','shopping'); }
function totalInvestments(){ return sum('stocks','crypto','collectibles','savings','emergency'); }
function totalOneOff(){ return sum('art','fishing','travel','smeegother'); }

// Update Setup metrics (top card)
function updateMetrics(){
  const net = num(netIncomeEl.value) || num(netIncome);
  const nn = totalNonNegotiables();
  const subs = totalSubscriptions();
  const dates = totalDateNights();
  const inv = totalInvestments();
  const oneoff = totalOneOff();
  const allocated = nn + subs + dates + inv + oneoff;
  const play = net - allocated;

  if (nnTotalEl) nnTotalEl.textContent = money(nn);
  if (playLeftEl){
    playLeftEl.textContent = play >= 0
      ? `You’ve got ${money(play)}/mo to play with`
      : `Over by ${money(Math.abs(play))}/mo`;
    playLeftEl.style.background = play >= 0 ? '#166534' : '#7f1d1d';
    playLeftEl.style.color = '#fff';
  }
}

// ========= Transactions =========
addBtn.addEventListener('click', ()=>{
  const desc=(descEl.value||'').trim(); const amt=num(amountEl.value);
  const type=typeEl.value; const cat=categoryEl.value;
  if (!desc || amt<=0) return alert('Enter a description and a valid amount.');
  const now=new Date();
  items.unshift({ id:Date.now(), date:now.toISOString().slice(0,10), desc, amount:amt, type, category:cat });
  save(KEY_TX, items); descEl.value=''; amountEl.value='';
  renderTransactions(); updateIncomeSplit();
});
clearBtn.addEventListener('click', ()=>{
  if (!items.length) return;
  if (confirm('Clear ALL entries? This cannot be undone.')){
    items=[]; save(KEY_TX, items); renderTransactions(); updateIncomeSplit();
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

// ========= Income Split (5 slices) =========
function updateIncomeSplit(){
  const income = num(netIncomeEl.value) || num(netIncome);
  const slices = [
    { label:'Non-Negotiables', value: totalNonNegotiables(), color:'#ef4444' }, // red
    { label:'Subscriptions',   value: totalSubscriptions(),   color:'#3b82f6' }, // blue
    { label:'Date Nights',     value: totalDateNights(),      color:'#ec4899' }, // pink
    { label:'Investments',     value: totalInvestments(),     color:'#f59e0b' }, // orange
    { label:'One-off Purchases', value: totalOneOff(),        color:'#38bdf8' }, // sky blue
  ];
  const allocated = slices.reduce((t,s)=>t+s.value,0);
  const remainder = income - allocated;

  drawCategoryPie(slices);
  drawCanvasLegend(slices);

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

function drawCategoryPie(slices){
  const total = slices.reduce((t,s)=>t + Math.max(0,s.value), 0);
  ctx.clearRect(0,0,pieCanvas.width,pieCanvas.height);
  if (total<=0){
    ctx.fillStyle='#9ca3af'; ctx.font='14px system-ui, sans-serif';
    ctx.fillText('Add amounts to see the split.',10,20); return;
  }
  const cx=pieCanvas.width/2, cy=pieCanvas.height/2, r=Math.min(cx,cy)-8;
  let start=-Math.PI/2;
  for (const {value,color} of slices){
    const angle = (Math.max(0,value)/total)*Math.PI*2;
    const end = start + angle;
    if (angle>0){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath(); ctx.fillStyle=color; ctx.fill(); }
    start=end;
  }
}
function drawCanvasLegend(slices){
  const pad=10, lineH=18;
  const panelW = Math.min(pieCanvas.width-12, 240);
  ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(6,6,panelW,slices.length*lineH+12);
  slices.forEach(({label,value,color},i)=>{
    ctx.fillStyle=color; ctx.fillRect(pad, pad + i*lineH + 4, 10, 10);
    ctx.fillStyle='#e5e7eb'; ctx.font='12px system-ui, sans-serif';
    ctx.fillText(`${label}: ${money(value)}`, pad+16, pad + i*lineH + 14);
  });
}

window.addEventListener('resize', ()=>{ if (sections.pie.classList.contains('active')) updateIncomeSplit(); });

// ========= Storage helpers =========
function load(k, fb){ try{return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb));}catch{return fb;} }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

// Re-run Lucide after DOM ready
document.addEventListener('DOMContentLoaded', ()=>{ if (window.lucide?.createIcons) window.lucide.createIcons(); });