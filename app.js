// ------------ tiny on-screen error (helps debug on iPad/Safari) ------------
window.addEventListener('error', (e) => {
  const b = document.createElement('div');
  b.style.cssText = 'position:fixed;left:0;right:0;bottom:68px;background:#7f1d1d;color:#fff;padding:6px 10px;font:12px system-ui;z-index:9999';
  b.textContent = 'Script error: ' + (e.message || 'unknown');
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 5000);
});

// ------------ helpers ------------
const $ = (id) => document.getElementById(id);
const money = (v) => (Number.isFinite(v) ? v : 0).toLocaleString(undefined,{style:'currency',currency:'USD'});
const num = (v) => { const s = String(v ?? '').replace(/[^0-9.\-]/g,''); const n = parseFloat(s); return Number.isFinite(n) ? n : 0; };

// ------------ storage ------------
const KEY_NET='budget:net', KEY_BILLS='budget:bills', KEY_TX='budget:tx', KEY_THEME='budget:theme';
const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)); } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ------------ main ------------
document.addEventListener('DOMContentLoaded', () => {
  // sections / tabs
  const sections = { setup:$('view-setup'), transactions:$('view-transactions'), pie:$('view-pie') };
  const tabButtons = [...document.querySelectorAll('.tab-btn')];

  // theme
  const themeToggle = $('theme-toggle');
  let theme = load(KEY_THEME, document.documentElement.getAttribute('data-theme') || 'dark');
  applyTheme(theme);
  themeToggle?.addEventListener('click', () => {
    theme = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    applyTheme(theme);
    save(KEY_THEME, theme);
  });
  function applyTheme(mode){
    document.documentElement.setAttribute('data-theme', mode);
    try { window.lucide?.createIcons?.(); } catch {}
  }

  // income + metrics
  const netIncomeEl = $('net-income'), saveNetBtn = $('save-net'), netYearlyEl = $('net-yearly');
  const nnTotalEl = $('nn-total'), playLeftEl = $('play-left');

  // header totals (right side of each card)
  const headTotals = {
    nn: $('ttl-nn'), subs: $('ttl-subs'), dates: $('ttl-dates'), invest: $('ttl-invest'), oneoff: $('ttl-oneoff')
  };

  // pie
  const pieCanvas = $('pie'), pieLegend = $('pie-legend');
  const ctx = pieCanvas ? pieCanvas.getContext('2d') : null;

  // bills map (ids must match index.html)
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

  // transactions
  const descEl=$('desc'), amountEl=$('amount'), typeEl=$('type'), categoryEl=$('category');
  const addBtn=$('add'), listEl=$('list'), searchEl=$('search'), clearBtn=$('clear');

  // state
  let netIncome = load(KEY_NET, 0);
  let bills = load(KEY_BILLS, Object.fromEntries(billIds.map(k=>[k,''])));
  let items = load(KEY_TX, []);

  // tabs
  tabButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tab = btn.dataset.tab;
      tabButtons.forEach(b=>b.classList.toggle('active', b===btn));
      Object.entries(sections).forEach(([k,sec])=> sec && sec.classList.toggle('active', k===tab));
      if (tab==='pie') updateIncomeSplit();
      try { window.lucide?.createIcons?.(); } catch {}
    });
  });

  // init inputs
  if (netIncome) netIncomeEl.value = String(netIncome);
  netIncomeEl.addEventListener('input', () => { netIncome = num(netIncomeEl.value); save(KEY_NET, netIncome); updateAll(); });
  saveNetBtn.addEventListener('click', () => {
    netIncome = num(netIncomeEl.value);
    if (netIncome <= 0) { alert('Please enter a valid monthly net income.'); return; }
    save(KEY_NET, netIncome); updateAll();
  });

  for (const [k, el] of Object.entries(billEls)) {
    if (!el) continue;
    el.value = bills[k] ?? '';
    el.addEventListener('input', () => {
      bills[k] = el.value; save(KEY_BILLS, bills); updateAll();
    });
  }

  // transactions
  addBtn?.addEventListener('click', ()=>{
    const desc=(descEl.value||'').trim(); const amt=num(amountEl.value);
    const type=typeEl.value; const cat=categoryEl.value;
    if (!desc || amt<=0) return alert('Enter a description and a valid amount.');
    const now=new Date();
    items.unshift({ id:Date.now(), date:now.toISOString().slice(0,10), desc, amount:amt, type, category:cat });
    save(KEY_TX, items); descEl.value=''; amountEl.value='';
    renderTransactions(); updateIncomeSplit();
  });
  clearBtn?.addEventListener('click', ()=>{
    if (!items.length) return;
    if (confirm('Clear ALL entries? This cannot be undone.')){
      items=[]; save(KEY_TX, items); renderTransactions(); updateIncomeSplit();
    }
  });

  function renderTransactions(){
    if (!listEl) return;
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
    try { window.lucide?.createIcons?.(); } catch {}
  }

  // totals helpers
  const sum = (...keys)=> keys.reduce((t,k)=> t + num(billEls[k]?.value), 0);
  const totalNN     = () => sum('rent','hoa','electric','internet','gas','water','groceries','phone','carins','carmaint','smeegs','security','transportation','health');
  const totalSubs   = () => sum('amazon','netflix','disney','crunchy','barkbox','chatgpt');
  const totalDates  = () => sum('lunches','themeparks','parking','shopping');
  const totalInvest = () => sum('stocks','crypto','collectibles','savings','emergency');
  const totalOne    = () => sum('art','fishing','travel','smeegother');

  function updateAll(){ updateYearly(); updateHeaderTotals(); updateMetrics(); updateIncomeSplit(); renderTransactions(); }

  function updateYearly(){
    const m = num(netIncomeEl.value) || num(netIncome);
    const y = m>0 ? m*12 : 0;
    netYearlyEl.textContent = `Yearly: ${y ? money(y) : '—'}`;
  }
  function updateHeaderTotals(){
    headTotals.nn.textContent     = money(totalNN());
    headTotals.subs.textContent   = money(totalSubs());
    headTotals.dates.textContent  = money(totalDates());
    headTotals.invest.textContent = money(totalInvest());
    headTotals.oneoff.textContent = money(totalOne());
  }
  function updateMetrics(){
    const net = num(netIncomeEl.value) || num(netIncome);
    const nn = totalNN(), subs = totalSubs(), dates = totalDates(), inv = totalInvest(), one = totalOne();
    const allocated = nn + subs + dates + inv + one;
    const play = allocated > 0 ? (net - allocated) : net;
    nnTotalEl.textContent = money(nn);
    playLeftEl.textContent = play >= 0 ? `You’ve got ${money(play)}/mo to play with` : `Over by ${money(Math.abs(play))}/mo`;
    playLeftEl.style.background = play >= 0 ? '#166534' : '#7f1d1d';
    playLeftEl.style.color = '#fff';
  }

  function updateIncomeSplit(){
    if (!ctx || !pieLegend) return;
    const slices = [
      { label:'Non-Negotiables',   value: totalNN(),   color:'#ef4444' },
      { label:'Subscriptions',     value: totalSubs(), color:'#3b82f6' },
      { label:'Date Nights',       value: totalDates(), color:'#ec4899' },
      { label:'Investments',       value: totalInvest(), color:'#f59e0b' },
      { label:'One-off Purchases', value: totalOne(),  color:'#38bdf8' },
    ];
    drawPie(slices);
    drawLegend(slices);

    const income = num(netIncomeEl.value) || num(netIncome);
    const allocated = slices.reduce((t,s)=>t+s.value,0);
    const remainder = income - allocated;
    pieLegend.innerHTML += `
      <div style="margin-top:12px;font-size:16px;font-weight:800">Remainder: ${money(remainder)}</div>
      <div style="margin-top:6px;font-size:14px;">
        ${remainder >= 0
          ? `<span style="color:#22c55e;font-weight:700">Congrats, you're within budget!</span>`
          : `<span style="color:#ef4444;font-weight:700">Uh oh, looks like you need to lower your spending!</span>`}
      </div>`;
  }
  function drawPie(slices){
    const total = slices.reduce((t,s)=>t + Math.max(0,s.value), 0);
    ctx.clearRect(0,0,pieCanvas.width,pieCanvas.height);
    if (total<=0){ ctx.fillStyle='#9ca3af'; ctx.font='14px system-ui'; ctx.fillText('Add amounts to see the split.',10,20); return; }
    const cx=pieCanvas.width/2, cy=pieCanvas.height/2, r=Math.min(cx,cy)-8;
    let start=-Math.PI/2;
    for (const {value,color} of slices){
      const angle=(Math.max(0,value)/total)*Math.PI*2; if (angle<=0) continue;
      const end=start+angle;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath();
      ctx.fillStyle=color; ctx.fill(); start=end;
    }
  }
  function drawLegend(slices){
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
      </div>`;
  }

  // initial paint
  updateAll();

  // icons & SW
  try { window.lucide?.createIcons?.(); } catch {}
  if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js'); } catch {} }

  // redraw pie on resize
  window.addEventListener('resize', ()=>{ if (sections.pie?.classList.contains('active')) updateIncomeSplit(); });
});