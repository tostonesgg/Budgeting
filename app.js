// ---------- tiny on-screen error banner ----------
window.addEventListener('error', (e) => {
  const b = document.createElement('div');
  b.style.cssText = 'position:fixed;left:0;right:0;bottom:68px;background:#7f1d1d;color:#fff;padding:6px 10px;font:12px system-ui;z-index:9999';
  b.textContent = 'Script error: ' + (e.message || 'unknown');
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 5000);
});

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const money = (v) => (Number.isFinite(v) ? v : 0).toLocaleString(undefined,{style:'currency',currency:'USD'});
const num = (v) => { const s=String(v??'').replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:0; };

// ---------- storage ----------
const KEY_NET='budget:net', KEY_VALUES='budget:values', KEY_TX='budget:tx', KEY_THEME='budget:theme', KEY_CUSTOM='budget:custom';
const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)); } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ---------- state ----------
let values = load(KEY_VALUES, {}); // inputId -> string value
let netIncome = load(KEY_NET, 0);
let items = load(KEY_TX, []);
let theme = load(KEY_THEME, document.documentElement.getAttribute('data-theme') || 'dark');
// custom: { nn: [{id,label,icon}], subs: [...], dates: [...], invest: [...], oneoff: [...] }
let custom = load(KEY_CUSTOM, { nn:[], subs:[], dates:[], invest:[], oneoff:[] });

// ---------- DOM refs ----------
const sections = { setup:$('view-setup'), transactions:$('view-transactions'), pie:$('view-pie') };
const tabButtons = [...document.querySelectorAll('.tab-btn')];
const themeToggle = $('theme-toggle');

const netIncomeEl = $('net-income'), saveNetBtn = $('save-net'), netYearlyEl = $('net-yearly');
const nnTotalEl = $('nn-total'), playLeftEl = $('play-left');
const headTotals = { nn:$('ttl-nn'), subs:$('ttl-subs'), dates:$('ttl-dates'), invest:$('ttl-invest'), oneoff:$('ttl-oneoff') };

const pieCanvas = $('pie'), pieLegend = $('pie-legend');
const ctx = pieCanvas ? pieCanvas.getContext('2d') : null;

// Icon modal
const modal = $('icon-backdrop'), iconGrid = $('icon-grid'), iconSearch = $('icon-search');
const customLabel = $('custom-label'), iconCancel = $('icon-cancel'), iconSave = $('icon-save');

let modalOpenFor = null;        // 'nn' | 'subs' | ...
let selectedIcon = null;         // string name from lucide
let selectedIconCell = null;

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  applyTheme(theme);
  themeToggle?.addEventListener('click', () => {
    theme = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    applyTheme(theme); save(KEY_THEME, theme);
  });

  // Tabs
  tabButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tab = btn.dataset.tab;
      tabButtons.forEach(b=>b.classList.toggle('active', b===btn));
      Object.entries(sections).forEach(([k,sec])=> sec.classList.toggle('active', k===tab));
      if (tab==='pie') updateIncomeSplit();
      try { window.lucide?.createIcons?.(); } catch {}
    });
  });

  // Restore income
  if (netIncome) netIncomeEl.value = String(netIncome);
  netIncomeEl.addEventListener('input', onIncomeChange);
  saveNetBtn.addEventListener('click', () => {
    netIncome = num(netIncomeEl.value);
    if (netIncome <= 0) return alert('Please enter a valid monthly net income.');
    save(KEY_NET, netIncome); updateAll();
  });

  // Wire static inputs: any input with .bill-input
  document.querySelectorAll('input.bill-input').forEach(el=>{
    if (values[el.id] != null) el.value = values[el.id];
    el.addEventListener('input', onBillInput);
  });

  // Render custom rows from storage for each category
  ['nn','subs','dates','invest','oneoff'].forEach(renderCustomCategory);

  // Add-expense buttons
  document.querySelectorAll('.btn-add[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      modalOpenFor = btn.getAttribute('data-add');
      openIconModal();
    });
  });

  // Modal controls
  iconCancel.addEventListener('click', closeIconModal);
  iconSave.addEventListener('click', handleAddCustom);
  iconSearch.addEventListener('input', renderIconGrid);

  // First paint
  updateAll();

  // SW
  if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js'); } catch {} }
});

// ---------- events ----------
function onIncomeChange(){
  netIncome = num(netIncomeEl.value); save(KEY_NET, netIncome);
  updateAll();
}
function onBillInput(e){
  const el = e.currentTarget;
  values[el.id] = el.value;
  save(KEY_VALUES, values);
  updateAll();
}

// ---------- custom rows ----------
function renderCustomCategory(cat){
  const wrap = $(`custom-${cat}`);
  if (!wrap) return;
  wrap.innerHTML = '';
  const rows = custom[cat] || [];
  rows.forEach(({id,label,icon})=>{
    const inputId = `bill-${cat}-${id}`;
    const row = document.createElement('div');
    row.className = 'bill-row';
    row.innerHTML = `
      <label for="${inputId}"><i data-lucide="${icon}"></i> ${escapeHtml(label)}</label>
      <input class="bill-input" id="${inputId}" type="number" step="0.01" placeholder="Amount / month" />
    `;
    wrap.appendChild(row);

    // restore value + wire
    const input = row.querySelector('input');
    if (values[inputId] != null) input.value = values[inputId];
    input.addEventListener('input', onBillInput);
  });
  try { window.lucide?.createIcons?.(); } catch {}
}

function handleAddCustom(){
  const label = (customLabel.value || '').trim();
  if (!modalOpenFor) return;
  if (!label) { alert('Please enter a name for this expense.'); return; }
  const icon = selectedIcon || 'circle';
  const entry = { id: Date.now(), label, icon };
  custom[modalOpenFor] = custom[modalOpenFor] || [];
  custom[modalOpenFor].push(entry);
  save(KEY_CUSTOM, custom);
  renderCustomCategory(modalOpenFor);
  closeIconModal();
  updateAll();
}

// ---------- modal + icons ----------
function openIconModal(){
  selectedIcon = null; selectedIconCell = null;
  customLabel.value = '';
  iconSearch.value = '';
  renderIconGrid();
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden','false');
}
function closeIconModal(){
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden','true');
}

function renderIconGrid(){
  const all = Object.keys(window.lucide?.icons || {});
  const q = iconSearch.value?.toLowerCase().trim();
  const filtered = q ? all.filter(n => n.includes(q)) : all;
  const top = filtered.slice(0, 240); // keep it light
  iconGrid.innerHTML = top.map(n => `
    <div class="icon-item" data-icon="${n}">
      <i data-lucide="${n}"></i>
      <small class="muted" style="font-size:10px">${n}</small>
    </div>
  `).join('');
  iconGrid.querySelectorAll('.icon-item').forEach(el=>{
    el.addEventListener('click', ()=>{
      if (selectedIconCell) selectedIconCell.classList.remove('active');
      selectedIconCell = el;
      selectedIconCell.classList.add('active');
      selectedIcon = el.getAttribute('data-icon');
      try { window.lucide?.createIcons?.(); } catch {}
    });
  });
  try { window.lucide?.createIcons?.(); } catch {}
}

// ---------- totals ----------
function sectionTotal(sectionId){
  const els = document.querySelectorAll(`#${sectionId} input.bill-input`);
  return Array.from(els).reduce((t,el)=> t + num(el.value), 0);
}
function totalNN(){ return sectionTotal('card-nn'); }
function totalSubs(){ return sectionTotal('card-subs'); }
function totalDates(){ return sectionTotal('card-dates'); }
function totalInvest(){ return sectionTotal('card-invest'); }
function totalOne(){ return sectionTotal('card-oneoff'); }

// ---------- update cluster ----------
function updateAll(){
  updateYearly();
  updateHeaderTotals();
  updateMetrics();
  updateIncomeSplit();
  try { window.lucide?.createIcons?.(); } catch {}
}
function updateYearly(){
  const m = num(netIncomeEl.value) || num(netIncome);
  const y = m > 0 ? m * 12 : 0;
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
  playLeftEl.textContent = play >= 0 ? `You’ve got ${money(play)}/mo to play with`
                                     : `Over by ${money(Math.abs(play))}/mo`;
  playLeftEl.style.background = play >= 0 ? '#166534' : '#7f1d1d';
  playLeftEl.style.color = '#fff';
}

// ---------- pie ----------
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
  if (total <= 0){ ctx.fillStyle='#9ca3af'; ctx.font='14px system-ui'; ctx.fillText('Add amounts to see the split.',10,20); return; }
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

// ---------- theme ----------
function applyTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  try { window.lucide?.createIcons?.(); } catch {}
}

// ---------- utils ----------
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Redraw pie on resize
window.addEventListener('resize', ()=>{ if (sections.pie?.classList.contains('active')) updateIncomeSplit(); });
