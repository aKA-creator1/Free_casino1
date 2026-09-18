window.loadUpgrader = function(body) {
  const tiers = [
    { label: 'x1.5', chance: 64, mult: 1.5 },
    { label: 'x2', chance: 48, mult: 2.0 },
    { label: 'x3', chance: 32, mult: 3.0 },
    { label: 'x4', chance: 24, mult: 4.0 },
    { label: 'x6', chance: 16, mult: 6.0 },
    { label: 'x10', chance: 9.6, mult: 10.0 },
  ];
  let selectedTier = 0;

  body.innerHTML = `
    ${betControls(50)}
    <div class="upgrader-wheel" id="upg-wheel">
      <div class="upg-pointer"></div>
      <div style="font-size:32px;font-weight:900;color:var(--gold)" id="upg-label">x1.5</div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">
      ${tiers.map((t, i) => `<button class="chip ${i === 0 ? 'hot' : ''}" data-tier="${i}">${t.label} (${t.chance}%)</button>`).join('')}
    </div>
    <button class="btn btn-gold" id="upg-go">КРУТИТЬ</button>
    <div id="upg-out" style="text-align:center;padding:8px;font-size:14px"></div>
  `;

  document.querySelectorAll('[data-tier]').forEach(btn => {
    btn.onclick = () => {
      selectedTier = +btn.dataset.tier;
      document.querySelectorAll('[data-tier]').forEach(b => b.classList.remove('hot'));
      btn.classList.add('hot');
      $('upg-label').textContent = tiers[selectedTier].label;
    };
  });

  async function go() {
    const bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }
    $('upg-go').disabled = true;

    const wheel = $('upg-wheel');
    wheel.style.transition = 'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)';
    wheel.style.transform = `rotate(${720 + Math.random() * 360}deg)`;

    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'upgrader', bet, params: { tier: selectedTier } });

    await new Promise(res => setTimeout(res, 3000));

    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';

    if (r.balance !== undefined) setBalance(r.balance);

    if (r.won) {
      $('upg-out').innerHTML = `<span class="result-win">+${fmt(r.win)} ★ (roll: ${r.roll} < ${tiers[selectedTier].chance})</span>`;
      winModal('+' + fmt(r.win), `Апгрейдер ${tiers[selectedTier].label}`);
    } else {
      $('upg-out').innerHTML = `<span class="result-lose">−${fmt(bet)} ★ (roll: ${r.roll} ≥ ${tiers[selectedTier].chance})</span>`;
      vibrate(30);
    }

    $('upg-go').disabled = false;
  }

  $('upg-go').onclick = go;
};
