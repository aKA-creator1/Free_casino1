window.loadSlots = function(body, type) {
  const CLASSIC = ['BAR','7','🔔','🍋','🍒','⭐'];
  const VIDEO = ['A','K','Q','J','10','🃏','💎'];
  let spinning = false;

  body.innerHTML = `
    ${betControls(50)}
    <div class="slot-reels" id="sl-reels">
      <div class="slot-reel">?</div>
      <div class="slot-reel">?</div>
      <div class="slot-reel">?</div>
      ${type === 'video' ? '<div class="slot-reel">?</div><div class="slot-reel">?</div>' : ''}
    </div>
    <div id="sl-result" style="text-align:center;padding:8px;color:var(--text2);font-size:14px"></div>
    <button class="btn btn-gold" id="sl-spin">КРУТИТЬ</button>
  `;

  const reels = $('sl-reels').querySelectorAll('.slot-reel');

  async function spin() {
    if (spinning) return;
    const bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }
    spinning = true;
    $('sl-spin').disabled = true;
    $('sl-result').textContent = '';

    reels.forEach(r => r.classList.add('spinning'));

    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'slots', bet, params: { type } });

    await new Promise(res => setTimeout(res, 800));

    reels.forEach(reel => reel.classList.remove('spinning'));

    if (r.reels) {
      r.reels.forEach((sym, i) => {
        if (reels[i]) reels[i].textContent = sym;
      });
    } else if (r.grid) {
      const flat = r.grid.flat();
      flat.forEach((sym, i) => {
        if (reels[i]) reels[i].textContent = sym;
      });
    }

    if (r.balance !== undefined) setBalance(r.balance);

    if (r.win > 0) {
      $('sl-result').innerHTML = `<span class="result-win">+${fmt(r.win)} ★ (x${r.mult})</span>`;
      winModal('+' + fmt(r.win), `Слоты x${r.mult}`);
    } else {
      $('sl-result').innerHTML = `<span class="result-lose">−${fmt(bet)} ★</span>`;
    }

    spinning = false;
    $('sl-spin').disabled = false;
  }

  $('sl-spin').onclick = spin;
};
