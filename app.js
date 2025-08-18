  // Totals (per-category normalized monthly + play money)
  function updateTotals() {
    let allExpenses = 0;
    categories.forEach((cat, i) => {
      const total = cat.expenses.reduce((sum, e) => {
        const amt = parseFloat(e.amount) || 0;
        return sum + monthlyFrom(amt, e.freq || "mo");
      }, 0);
      allExpenses += total;
      const ttlEl = document.getElementById(`cat-total-${i}`);
      if (ttlEl) ttlEl.textContent = fmt(total);
    });

    const play = income - allExpenses;

    if (yearlyEl) yearlyEl.textContent = `Yearly: ${fmt(income * 12)}`;

    if (playEl) {
      const clean = `${fmt(play)}/mo`;   // clean version for sticky
      playEl.textContent = `You’ve got ${clean} to play with`;
      playEl.dataset.value = clean;      // <-- NEW: store clean value here
    }
  }
