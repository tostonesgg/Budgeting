// --- tiny helpers ---
const $ = (id) => document.getElementById(id);
const toCurrency = (n) => (n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

// --- elements ---
const descEl = $('desc');
const amountEl = $('amount');
const typeEl = $('type');
const addBtn = $('add');
const listEl = $('list');
const balEl = $('bal');
const incEl = $('inc');
const expEl = $('exp');
const searchEl = $('search');
const clearBtn = $('clear');
const installHelp = $('install-help');

// --- storage (localStorage) ---
const KEY = 'budget:minimal:tx';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const save = (items) => localStorage.setItem(KEY, JSON.stringify(items));

// --- state ---
let items = load();

// --- render ---
function render() {
  // filter
  const q = (searchEl.value || '').toLowerCase();
  const filtered = items.filter(x =>
    !q || (x.desc.toLowerCase().includes(q))
  );

  // totals
  const income = filtered.filter(x => x.type === 'income').reduce((t, x) => t + x.amount, 0);
  const expense = filtered.filter(x => x.type === 'expense').reduce((t, x) => t + x.amount, 0);
  incEl.textContent = toCurrency(income);
  expEl.textContent = toCurrency(expense);
  balEl.textContent = toCurrency(income - expense);

  // list
  listEl.innerHTML = filtered.map(x => `
    <li>
      <div>
        <div><strong>${x.desc}</strong></div>
        <div class="muted">${x.date} • ${x.type}</div>
      </div>
      <div style="text-align:right"><strong>${toCurrency(x.amount)}</strong></div>
      <div style="text-align:right">
        <button data-del="${x.id}" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    </li>
  `).join('');

  // hook up deletes
  listEl.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      items = items.filter(x => String(x.id) !== String(id));
      save(items);
      render();
    });
  });

  // refresh Lucide icons after DOM changes
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

// --- actions ---
addBtn.addEventListener('click', () => {
  const desc = descEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const type = typeEl.value;
  if (!desc || !Number.isFinite(amount)) return alert('Enter a description and a valid amount.');
  const now = new Date();
  items.unshift({
    id: Date.now(),
    date: now.toISOString().slice(0, 10),
    desc, amount, type
  });
  save(items);
  descEl.value = '';
  amountEl.value = '';
  render();
});

clearBtn.addEventListener('click', () => {
  if (!items.length) return;
  if (confirm('Clear ALL entries? This cannot be undone.')) {
    items = [];
    save(items);
    render();
  }
});

$('install-help').addEventListener('click', () => {
  alert('Open this site in Safari → Share → Add to Home Screen to install.');
});

// SW registration (relative path for GitHub Pages)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// initial render
render();
