/* ========== Tiny error banner so we can see issues on-device ========== */
(function setupErrorBanner(){
  window.addEventListener('error', (e)=>{
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;left:0;right:0;bottom:68px;background:#7f1d1d;color:#fff;padding:8px 12px;font:12px system-ui;z-index:9999';
    banner.textContent = 'Script error: ' + (e.message || 'unknown');
    document.body.appendChild(banner);
    setTimeout(()=>banner.remove(), 5000);
  });
})();

/* ========== Helpers ========== */
const $ = (id) => document.getElementById(id);
const money = (v) => (Number.isFinite(v) ? v : 0).toLocaleString(undefined,{style:'currency',currency:'USD'});
const num = (v) => {
  const s = String(v == null ? '' : v).replace(/[^0-9.\-]/g,'');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

/* Run only after DOM is ready */
document.addEventListener('DOMContentLoaded', () => {
  /* ==== Elements ==== */
  const sections = { setup: $('view-setup'), transactions: $('view-transactions'), pie: $('view-pie') };
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));

  const netIncomeEl = $('net-income');
  const saveNetBtn = $('save-net');
  const netYearlyEl = $('net-yearly');

  const nnTotalEl = $('nn-total');
  const playLeftEl = $('play-left');

  const descEl = $('desc');
  const amountEl = $('amount');
  const typeEl = $('type');
  const categoryEl = $('category');
  const addBtn = $('add');
  const listEl = $('list');
  const searchEl = $('search');
  const clearBtn = $('clear');

  const pieCanvas = $('pie');
  const pieLegend = $('pie-legend');
  const ctx = pieCanvas ? pieCanvas.getContext('2d') : null;

  /* ---- All bill inputs by ID (must exist in index.html) ---- */
  const ids = [
    // Non-Negotiables
    'bill-rent','bill-hoa','bill-electric','bill-internet','bill-gas','bill-water','bill-groceries','bill-phone',
    'bill-carins','bill-carmaint','bill-smeegs','bill-security','bill-transportation','bill-health',
    // Subscriptions
    'bill-amazon','bill-netflix','bill-disney','bill-crunchy','bill-barkbox','bill-chatgpt',
    // Date Nights
    'bill-lunches','bill-themeparks','bill-parking','bill-shopping',
    // Investments
    'bill-stocks','bill-crypto','bill-collectibles','bill-savings','bill-emergency',
    // One-off
    'bill-art','bill-fishing','bill-travel','bill-smeegother'
  ];
  const billEls = Object.fromEntries(ids.map(id => [id.replace(/^bill-/,''), $(id)]));

  /* ========== Storage ========== */
  const KEY_NET='budget:net', KEY_BILLS='budget:bills', KEY_TX='budget:tx';
  function load(k, fb){ try{ return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)); }catch{ return fb; } }
  function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

  let netIncome = load(KEY_NET, 0);
  let bills = load(KEY_BILLS, Object.fromEntries(Object.keys(billEls).map(k=>[k,''])));
  let items = load(KEY_TX, []);

  /* ========== Tabs ========== */
  function initTabs(){
    tabButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tab = btn.dataset.tab;
        tabButtons.forEach(b=>b.classList.toggle('active', b===btn));
        Object.entries(sections).forEach(([k,sec])=> sec && sec.classList.toggle('active', k===tab));
        safeCreateIcons();
        if (tab==='pie') updateIncomeSplit();
      });
    });
  }

  /* ========== Setup ========== */
  function initSetup(){
    if (netIncomeEl && netIncome) netIncomeEl.value = String(netIncome);
    updateYearly();

    if (netIncomeEl) netIncomeEl.addEventListener('input', ()=>{
      netIncome = num(netIncomeEl.value);
      save(KEY_NET, netIncome);
      updateYearly();
      updateMetrics();
      updateIncomeSplit();
    });

    if (saveNetBtn) saveNetBtn.addEventListener('click', ()=>{
      if (!netIncomeEl) return;
      netIncome = num(netIncomeEl.value);
      if (netIncome <= 0) { alert('Please enter a valid monthly net income.'); return; }
      save(KEY_NET, netIncome);
      updateYearly();
      updateMetrics();
      updateIncomeSplit();
    });

    // Wire all bill fields
    Object.entries(billEls).forEach(([k, el])=>{
      if (!el) return;
      el.value = bills[k] ?? '';
      el.addEventListener('input', ()=>{
        bills[k] = el.value;
        save(KEY_BILLS, bills);
        updateMetrics();
        updateIncomeSplit();
      });
    });
  }

  function updateYearly(){
    const m = netIncomeEl ? (num(netIncomeEl.value) || num(netIncome)) : num(netIncome);
    const y = m > 0 ? m * 12 : 0;
    if (netYearlyEl) netYearlyEl.textContent = `Yearly: ${y ? money(y) : '—'}`;
  }

  /* Totals by group */
  const sum = (...keys) => keys.reduce((t,k)=> t + num((billEls[k] && billEls[k].value) || 0), 0);

  function totalNonNegotiables(){
    return sum('rent','hoa','electric','internet','gas','water','groceries','phone',
               'carins','carmaint','smeegs','security','transportation','health');
  }
  function totalSubscriptions(){ return sum('amazon','netflix','disney','crunchy','barkbox','chatgpt'); }
  function totalDateNights(){ return sum('lunches','themeparks','parking','shopping'); }
  function totalInvestments(){ return sum('stocks','crypto','collectibles','savings','emergency'); }
  function totalOneOff(){ return sum('art','fishing','travel','smeegother'); }

  /* Setup metrics card */
  function updateMetrics(){
    const net = netIncomeEl ? (num(netIncomeEl.value) || num(netIncome)) : num(netIncome);

    const nn = totalNonNegotiables();
    const subs = totalSubscriptions();
    const dates = totalDateNights();
    const inv = totalInvestments();
    const oneoff = totalOneOff();

    const allocated = nn + subs + dates + inv + oneoff;

    // If nothing entered yet, show full net income as play money (your request)
    const play = allocated > 0 ? (net - allocated) : net;

    if (nnTotalEl) nnTotalEl.textContent = money(nn);

    if (playLeftEl) {
      playLeftEl.textContent =
        play >= 0
          ? `You’ve got ${money(play)}/mo to play with`
          : `Over by ${money(Math.abs(play))}/mo`;
      playLeftEl.style.background = play >= 0 ? '#166534' : '#7f1d1d';
      playLeftEl.style.color = '#fff';
    }
  }

  /* ========== Transactions (unchanged behavior) ========== */
  function renderTransactions(){
    if (!listEl) return;
    const q = (searchEl && searchEl.value ? searchEl.value : '').toLowerCase();
    const filtered = items.filter(x => !q || String(x.desc).toLowerCase().includes(q));
    listEl.innerHTML = filtered.map(x=>`
      <li>
        <div>
          <div><strong>${x.desc}</strong> <span class="muted">• ${x.category}</span></div>
          <div class="muted">${x.date} • ${x.type}</div>
        </div>
        <div style="text-align:right"><strong>${money(x.amount)}</strong></div>
        <div style="text-align:right"><button data-del="${x.id}" title="Delete"><i data-lucide="trash-2"></i></button></div>
      </li>
    `).join('');

    listEl.querySelectorAll('button[data-del]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-del');
        items = items.filter(x => String(x.id) !== String(id));
        save(KEY_TX, items);
        renderTransactions();
        updateIncomeSplit();
      });
    });

    safeCreateIcons();
  }

  if (addBtn) addBtn.addEventListener('click', ()=>{
    const desc = (descEl && descEl.value || '').trim();
    const amt = num(amountEl && amountEl.value);
    const type = typeEl ? typeEl.value : 'expense';
    const cat  = categoryEl ? categoryEl.value : 'Non-Negotiables';
    if (!desc || amt <= 0) { alert('Enter a description and a valid amount.'); return; }
    const now = new Date();
    items.unshift({ id:Date.now(), date:now.toISOString().slice(0,10), desc, amount:amt, type, category:cat });
    save(KEY_TX, items);
    if (descEl) descEl.value = '';
    if (amountEl) amountEl.value = '';
    renderTransactions();
    updateIncomeSplit();
  });

  if (clearBtn) clearBtn.addEventListener('click', ()=>{
    if (!items.length) return;
    if (confirm('Clear ALL entries? This cannot be undone.')){
      items = [];
      save(KEY_TX, items);
      renderTransactions();
      updateIncomeSplit();
    }
  });

  /* ========== Income Split (pie) ========== */
  function updateIncomeSplit(){
    if (!ctx || !pieLegend) return;

    const income = netIncomeEl ? (num(netIncomeEl.value) || num(netIncome)) : num(netIncome);
    const slices = [
      { label:'Non-Negotiables',   value: totalNonNegotiables(), color:'#ef4444' }, // red
      { label:'Subscriptions',     value: totalSubscriptions(),   color:'#3b82f6' }, // blue
      { label:'Date Nights',       value: totalDateNights(),      color:'#ec4899' }, // pink
      { label:'Investments',       value: totalInvestments(),     color:'#f59e0b' }, // orange
      { label:'One-off Purchases', value: totalOneOff(),          color:'#38bdf8' }, // sky blue
    ];
    const allocated = slices.reduce((t,s)=>t + Math.max(0,s.value), 0);
    const remainder = income - allocated;

    drawPie(slices);
    drawLegendOnCanvas(slices);

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
    if (!ctx) return;
    const total = slices.reduce((t,s)=>t + Math.max(0,s.value), 0);
    ctx.clearRect(0,0,pieCanvas.width,pieCanvas.height);
    if (total <= 0){
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Add amounts to see the split.', 10, 20);
      return;
    }
    const cx = pieCanvas.width/2, cy = pieCanvas.height/2, r = Math.min(cx,cy)-8;
    let start = -Math.PI/2;
    for (const {value,color} of slices){
      const angle = (Math.max(0,value)/total) * Math.PI * 2;
      if (angle <= 0) continue;
      const end = start + angle;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      start = end;
    }
  }

  function drawLegendOnCanvas(slices){
    if (!ctx) return;
    const pad=10, lineH=18, panelW=Math.min(pieCanvas.width-12, 260);
    ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(6,6,panelW,slices.length*lineH+12);
    slices.forEach(({label,value,color},i)=>{
      ctx.fillStyle=color; ctx.fillRect(pad, pad+i*lineH+4, 10, 10);
      ctx.fillStyle='#e5e7eb'; ctx.font='12px system-ui, sans-serif';
      ctx.fillText(`${label}: ${money(value)}`, pad+16, pad+i*lineH+14);
    });
  }

  window.addEventListener('resize', ()=>{ if (sections.pie && sections.pie.classList.contains('active')) updateIncomeSplit(); });

  /* ========== Icons & SW last so they never block core logic ========== */
  function safeCreateIcons(){
    try { if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons(); }
    catch(_) { /* ignore icon errors */ }
  }
  safeCreateIcons();

  if ('serviceWorker' in navigator) {
    try { navigator.serviceWorker.register('sw.js'); } catch(_) {}
  }

  /* ========== Kick everything once ========== */
  try {
    initTabs();
    initSetup();
    updateMetrics();
    renderTransactions();
    updateIncomeSplit();
  } catch (err) {
    console.error(err);
  }
});