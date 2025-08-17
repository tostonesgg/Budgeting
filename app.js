// Categories definition
const categories = {
  nn: {
    title: "Non-Negotiable Bills",
    icon: "shield-alert",
    color: "nn",
    items: [
      { id: "rent", icon: "house", label: "Rent/Mortgage" },
      { id: "hoa", icon: "house", label: "HOA" },
      { id: "electric", icon: "zap", label: "Electricity" },
      { id: "internet", icon: "wifi", label: "Internet" },
      { id: "gas", icon: "cooking-pot", label: "Gas" },
      { id: "water", icon: "droplet", label: "Water" },
      { id: "groceries", icon: "carrot", label: "Groceries" },
      { id: "phone", icon: "phone", label: "Phone" },
      { id: "carins", icon: "car", label: "Car Insurance" },
      { id: "carmaint", icon: "car", label: "Maintenance / Registration" },
      { id: "smeegs", icon: "dog", label: "Smeegs’ food / wipes / pads / vet" },
      { id: "security", icon: "cctv", label: "Security" },
      { id: "transportation", icon: "fuel", label: "Transportation" },
      { id: "health", icon: "stethoscope", label: "Health Insurance" }
    ]
  },
  subs: {
    title: "Subscriptions",
    icon: "badge-dollar-sign",
    color: "subs",
    items: [
      { id: "amazon", icon: "package", label: "Amazon" },
      { id: "netflix", icon: "tv", label: "Netflix" },
      { id: "disney", icon: "tv", label: "Disney Plus" },
      { id: "crunchy", icon: "tv", label: "Crunchyroll" },
      { id: "barkbox", icon: "bone", label: "Barkbox" },
      { id: "chatgpt", icon: "bot", label: "ChatGPT" }
    ]
  },
  dates: {
    title: "Date Nights",
    icon: "wine",
    color: "dates",
    items: [
      { id: "lunches", icon: "wine", label: "Lunches & Dinners" },
      { id: "themeparks", icon: "ticket", label: "Theme Parks" },
      { id: "parking", icon: "parking-meter", label: "Parking" },
      { id: "shopping", icon: "shopping-bag", label: "Shopping" }
    ]
  },
  invest: {
    title: "Investments",
    icon: "coins",
    color: "invest",
    items: [
      { id: "stocks", icon: "candlestick-chart", label: "Stocks" },
      { id: "crypto", icon: "bitcoin", label: "Crypto" },
      { id: "collectibles", icon: "trophy", label: "Collectibles" },
      { id: "savings", icon: "piggy-bank", label: "Savings" },
      { id: "emergency", icon: "siren", label: "Emergency Fund" }
    ]
  },
  oneoff: {
    title: "One-off Purchases",
    icon: "shopping-bag",
    color: "oneoff",
    items: [
      { id: "art", icon: "shopping-bag", label: "Art, Pops, Clothes, etc." },
      { id: "fishing", icon: "ship", label: "Fishing trips" },
      { id: "travel", icon: "map", label: "Travel" },
      { id: "smeegother", icon: "dog", label: "Other Smeeg-related toys, creams" }
    ]
  }
};

// Render categories
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
        <span class="cat-total" id="ttl-${key}">—</span>
      </div>
      ${cat.items.map(item => `
        <div class="bill-row">
          <label for="bill-${item.id}"><i data-lucide="${item.icon}"></i> ${item.label}</label>
          <input class="bill-input" id="bill-${item.id}" type="number" step="0.01" placeholder="Amount / month" />
          <button class="row-btn btn-edit" title="Edit"><i data-lucide="cog"></i></button>
          <button class="row-btn btn-remove" title="Delete"><i data-lucide="x"></i></button>
        </div>
      `).join("")}
      <div class="custom-container" id="custom-${key}"></div>
      <div class="card-actions">
        <button class="btn-add" data-add="${key}"><i data-lucide="plus"></i>Add expense</button>
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
});
