const categories = {
  nn: {
    title: "Non-Negotiable Bills",
    icon: "shield-alert",
    color: "nn",
    items: [
      { id: "rent", icon: "house", label: "Rent/Mortgage" },
      { id: "electric", icon: "zap", label: "Electricity" }
    ]
  },
  subs: {
    title: "Subscriptions",
    icon: "badge-dollar-sign",
    color: "subs",
    items: [
      { id: "netflix", icon: "tv", label: "Netflix" }
    ]
  }
};

// --- render categories ---
function renderCategories() {
  const container = document.querySelector("#categories");
  container.innerHTML = "";
  Object.entries(categories).forEach(([key, cat]) => {
    const card = document.createElement("div");
    card.className = `card card-${cat.color}`;
    card.id = `card-${key}`;

    card.innerHTML = `
      <div class="card-head">
        <span class="card-title"><i data-lucide="${cat.icon}"></i> ${cat.title}</span>
      </div>
      ${cat.items.map(item => `
        <div class="bill-row" data-id="${item.id}">
          <label><i data-lucide="${item.icon}"></i> <span>${item.label}</span></label>
          <input type="number" step="0.01" placeholder="Amount / month" />
          <button class="row-btn btn-edit" title="Edit"><i data-lucide="cog"></i></button>
          <button class="row-btn btn-remove" title="Delete"><i data-lucide="x"></i></button>
        </div>
      `).join("")}
    `;
    container.appendChild(card);
  });
  if (window.lucide?.createIcons) window.lucide.createIcons();
  bindRowEvents();
}

// --- deletion + editing ---
let currentEditRow = null;

function bindRowEvents() {
  document.querySelectorAll(".btn-remove").forEach(btn => {
    btn.onclick = (e) => {
      e.target.closest(".bill-row").remove();
    };
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
}

// --- modal controls ---
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

// init
document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
});
