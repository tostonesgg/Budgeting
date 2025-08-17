// Categories + items
const categories = {
  nn: {
    title: "Non-Negotiable Bills",
    icon: "shield-alert",
    color: "nn",
    items: [
      { id: "rent", icon: "house", label: "Rent/Mortgage" },
      { id: "electric", icon: "zap", label: "Electricity" },
      { id: "internet", icon: "wifi", label: "Internet" }
    ]
  },
  subs: {
    title: "Subscriptions",
    icon: "badge-dollar-sign",
    color: "subs",
    items: [
      { id: "netflix", icon: "tv", label: "Netflix" },
      { id: "chatgpt", icon: "bot", label: "ChatGPT" }
    ]
  },
  dates: {
    title: "Date Nights",
    icon: "wine",
    color: "dates",
    items: [
      { id: "lunches", icon: "wine", label: "Lunches & Dinners" },
      { id: "parks", icon: "ticket", label: "Theme Parks" }
    ]
  },
  invest: {
    title: "Investments",
    icon: "coins",
    color: "invest",
    items: [
      { id: "stocks", icon: "candlestick-chart", label: "Stocks" },
      { id: "savings", icon: "piggy-bank", label: "Savings" }
    ]
  },
  oneoff: {
    title: "One-off Purchases",
    icon: "shopping-bag",
    color: "oneoff",
    items: [
      { id: "art", icon: "shopping-bag", label: "Art / Pops / Clothes" },
      { id: "travel", icon: "map", label: "Travel" }
    ]
  }
};

let currentEditRow = null;

// Render
function renderCategories() {
  const container = document.querySelector("#categories");
  container.innerHTML = "";
  for (const [key, cat] of Object.entries(categories)) {
    const card = document.createElement("div");
    card.className = `card card-${cat.color}`;
    card.innerHTML = `
      <div class="card-head">
        <span class="card-title"><i data-lucide="${cat.icon}"></i> ${cat.title}</span>
        <span class="cat-total" id="ttl-${key}">—</span>
      </div>
      ${cat.items.map(item => `
        <div class="bill-row" data-id="${item.id}" data-cat="${key}">
          <label><i data-lucide="${item.icon}"></i> <span>${item.label}</span></label>
          <input class="bill-input" type="number" step="0.01" placeholder="Amount / month" />
          <button class="row-btn btn-edit" title="Edit"><i data-lucide="cog"></i></button>
          <button class="row-btn btn-remove" title="Delete"><i data-lucide="x"></i></button>
        </div>
      `).join("")}
    `;
    container.appendChild(card);
  }
  if (window.lucide?.createIcons) window.lucide.createIcons();
  bindRowEvents();
}

// Row buttons
function bindRowEvents() {
  document.querySelectorAll(".btn-remove").forEach(btn => {
    btn.onclick = (e) => e.target.closest(".bill-row").remove();
  });
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.onclick = (e) => {
      currentEditRow = e.target.closest(".bill-row");
      const labelSpan = currentEditRow.querySelector("label span");
      const iconEl = currentEditRow.querySelector("label i");
      document.getElementById("edit-label").value = labelSpan.textContent;
      document.getElementById("edit-icon").value = iconEl.getAttribute("data-lucide");
      document.getElementById("edit-backdrop").style.display = "flex";
      if (window.lucide?.createIcons) window.lucide.createIcons();
    };
  });
  document.querySelectorAll(".bill-input").forEach(inp => inp.addEventListener("input", updateTotals));
}

// Modal
document.getElementById("edit-cancel").onclick = () => {
  document.getElementById("edit-backdrop").style.display = "none";
};
document.getElementById("edit-save").onclick = () => {
  if (!currentEditRow) return;
  const newLabel = document.getElementById("edit-label").value.trim();
  const newIcon = document.getElementById("edit-icon").value.trim();
  if (newLabel) currentEditRow.querySelector("label span").textContent = newLabel;
  if (newIcon) {
    currentEditRow.querySelector("label i").setAttribute("data-lucide", newIcon);
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }
  document.getElementById("edit-backdrop").style.display = "none";
};

// Totals + pie
function updateTotals() {
  let playMoney = parseFloat(document.getElementById("net-income")?.value || 0);
  for (const [key] of Object.entries(categories)) {
    let total = 0;
    document.querySelectorAll(`#card-${key} .bill-input`).forEach(inp => {
      total += parseFloat(inp.value) || 0;
    });
    const span = document.getElementById(`ttl-${key}`);
    if (span) span.textContent = `$${total.toFixed(2)}`;
    if (key === "nn") {
      document.getElementById("nn-total").textContent = `$${total.toFixed(2)}`;
      playMoney -= total;
    } else {
      playMoney -= total;
    }
  }
  const playDiv = document.getElementById("play-left");
  if (playDiv) playDiv.textContent = `You’ve got $${playMoney.toFixed(2)}/mo to play with`;
  drawPie();
}

function drawPie() {
  const canvas = document.getElementById("pie");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const cats = Object.keys(categories);
  const totals = cats.map(k => {
    let t=0;
    document.querySelectorAll(`#card-${k} .bill-input`).forEach(inp=>t+=parseFloat(inp.value)||0);
    return t;
  });
  const sum = totals.reduce((a,b)=>a+b,0);
  if (sum===0) return;

  let start = 0;
  const colors = ["#ef4444","#3b82f6","#ec4899","#f59e0b","#38bdf8"];
  cats.forEach((k,i)=>{
    const slice = (totals[i]/sum)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(200,200);
    ctx.arc(200,200,200,start,start+slice);
    ctx.closePath();
    ctx.fillStyle=colors[i];
    ctx.fill();
    start+=slice;
  });
  document.getElementById("pie-legend").textContent = cats.map((k,i)=>`${categories[k].title}: $${totals[i].toFixed(2)}`).join(" | ");
}

// Tabs
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll("main section").forEach(sec=>sec.classList.remove("active"));
    document.getElementById(`view-${btn.dataset.tab}`).classList.add("active");
    if (btn.dataset.tab==="pie") drawPie();
  };
});

// Theme toggle
document.getElementById("theme-toggle").onclick = ()=>{
  const html=document.documentElement;
  html.setAttribute("data-theme", html.getAttribute("data-theme")==="dark"?"light":"dark");
};

// Init
document.addEventListener("DOMContentLoaded",()=>{
  renderCategories();
  updateTotals();
});
