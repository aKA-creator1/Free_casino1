window.loadDice = function(body) {
  let target = 50, overUnder = 'over';

  body.innerHTML = `
    ${betControls(50)}
    <div class="dice-bar" id="dice-bar">
      <div class="dice-bar-fill" id="dice-fill" style="width:50%;background:linear-gradient(90deg,var(--green),var(--gold))"></div>
      <div class="dice-pointer" id="dice-pointer" style="left:50%"></div>
      <div class="dice-result" id="dice-result">50</div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button class="chip ${overUnder === 'over' ? 'hot' : ''}" id="dice-over">Больше</button>
      <button class="chip ${overUnder === 'under' ? 'hot' : ''}" id="dice-under">Меньше</button>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
      <button class="chip" onclick="setDiceTarget(25)">25</button>
      <button class="chip hot" onclick="setDiceTarget(50)">50</button>
      <button class="chip" onclick="setDiceTarget(75)">75</button>
      <button class="chip" onclick="setDiceTarget(90)">90</button>
    </div>
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:11px;color:var(--text2)">Шанс: <span id="dice-chance">50%</span> • Множитель: <span id="dice-mult">x1.98</span></div>
    </div>
    <button class="btn btn-gold" id="dice-roll">БРОСИТЬ</button>
    <div id="dice-out" style="text-align:center;padding:8px;font-size:14px"></div>
  `;

  function updateChances() {
    const chance = overUnder === 'over' ? (100 - target) : target;
    const mult = chance > 0 ? (0.99 / (chance / 100)).toFixed(2) : '0';
    $('dice-chance').textContent = chance + '%';
    $('dice-mult').textContent = 'x' + mult;
    $('dice-fill').style.width = target + '%';
    $('dice-pointer').style.left = target + '%';
  }

  window.setDiceTarget = function(t) {
    target = t;
    updateChances();
    document.querySelectorAll('#dice-bar ~ .bet-chips ~ div .chip').forEach(c => c.classList.remove('hot'));
  };

  $('dice-over').onclick = () => { overUnder = 'over'; updateChances(); $('dice-over').classList.add('hot'); $('dice-under').classList.remove('hot'); };
  $('dice-under').onclick = () => { overUnder = 'under'; updateChances(); $('dice-under').classList.add('hot'); $('dice-over').classList.remove('hot'); };

  async function roll() {
    const bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'dice', bet, params: { target, over_under: overUnder } });
    if (r.error) { toast(r.error); return; }
    if (r.balance !== undefined) setBalance(r.balance);
    $('dice-result').textContent = r.number;
    $('dice-pointer').style.left = r.number + '%';
    $('dice-out').innerHTML = r.win > 0
      ? `<span class="result-win">+${fmt(r.win)} ★ (x${r.mult})</span>`
      : `<span class="result-lose">−${fmt(bet)} ★</span>`;
  }

  $('dice-roll').onclick = roll;
  updateChances();
};
