// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const money = (v) => (Number.isFinite(v) ? v : 0)
  .toLocaleString(undefined, { style: 'currency', currency: 'USD' });
const num = (v) => {
  const s = String(v ?? '').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// ---------- storage ----------
const KEY_NET='budget:net', KEY_BILLS='budget:bills', KEY_TX='budget:tx', KEY_THEME='budget:theme';
const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)); } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ---------- main ----------
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
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  // income + metrics
  const netIncomeEl = $('net-income'), saveNetBtn = $('save-net'), netYearlyEl = $('net-yearly');
  const nnTotalEl = $('nn-total'), playLeftEl = $('play-left');

  // header totals (right side of each category card)
  const headTotals = {
    nn: $('ttl-nn'),
    subs: $('ttl-subs'),
    dates: $('ttl-dates'),
    invest: $('ttl-invest'),
    oneoff: $('ttl-oneoff'),
  };

  // pie
  const pieCanvas = $('pie'), pieLegend = $('pie-legend');
  const ctx = pieCanvas.getContext('2d');

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

  // transactions (unchanged UI)
  const descEl = $('desc'), amountEl = $('amount'), typeEl = $('type'), categoryEl = $('category');
  const addBtn = $('add'), listEl = $('list'), searchEl = $('search'), clearBtn = $('clear');

  // state
  let netIncome = load(KEY_NET, 0);
  let bills = load(KEY_BILLS, Object.fromEntries(billIds.map(k=>[k,''])));
  let items = load(KEY_TX, []);

  // init tabs
  tabButtons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab = btn.dataset.tab;
      tabButtons.forEach(b=>b.classList.toggle('active', b===btn));
      Object.entries(sections).forEach(([k,sec])=> sec.classList.toggle('active', k===tab));
      if (tab === 'pie') updateIncomeSplit();
      if (window.lucide?.createIcons) window.lucide.createIcons();
    });
  });

  // init inputs
  if (netIncome) netIncomeEl.value = netIncome;
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
      bills[k] = el.value;
      save(KEY_BILLS, bills);
      updateAll(); // <- ensure totals + play money + pie update as you type
    });
  }

  // first paint
  updateAll();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

  // ---------- totals helpers ----------
  const sum = (...keys)=> keys.reduce((t,k)=> t + num(billEls[k]?.value), 0);
  const totalNN     = () => sum('rent','hoa','electric','internet','gas','water','groceries','phone','carins','carmaint','smeegs','security','transportation','health');
  const totalSubs   = () => sum('amazon','netflix','disney','crunchy','barkbox','chatgpt');
  const totalDates  = () => sum('lunches','themeparks','parking','shopping');
  const totalInvest = () => sum('stocks','crypto','collectibles','savings','emergency');
  const totalOne    = () => sum('art','fishing','travel','smeegother');

  // ---------- update group ----------
  function updateAll(){
    updateYearly();
    updateHeaderTotals();   // <- ensures the header totals never stay "—"
    updateMetrics();
    updateIncomeSplit();
  }

  function updateYearly(){
    const m = num(netIncomeEl.value) || num(netIncome);
    const y = m > 0 ? m * 12 : 0;
    netYearlyEl.textContent = `Yearly: ${y ? money(y) : '—'}`;
  }

  function updateHeaderTotals(){
    // Always write something; show $0.00 when empty
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
    const play = allocated > 0 ? (net - allocated) : net;  // show full net when nothing filled

    nnTotalEl.textContent = money(nn);
    playLeftEl.textContent = play >= 0
      ? `You’ve got ${money(play)}/mo to play with`
      : `Over by ${money(Math.abs(play))}/mo`;
    playLeftEl.style.background = play >= 0 ? '#166534' : '#7f1d1d';
    playLeftEl.style.color = '#fff';
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
      { label:'Non-Negotiables',   value: totalNN(),   color:'#ef4444' },
      { label:'Subscriptions',     value: totalSubs(), color:'#3b82f6' },
      { label:'Date Nights',       value: totalDates(), color:'#ec4899' },
      { label:'Investments',       value: totalInvest(), color:'#f59e0b' },
      { label:'One-off Purchases', value: totalOne(),  color:'#38bdf8' },
    ];
    drawPie(slices);
    drawLegendOnCanvas(slices);

    const income = num(net