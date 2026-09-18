window.loadRoulette = function(body) {
  let lastResult = null;

  const EURO = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  body.innerHTML = `
    ${betControls(50)}
    <div id="roul-result" style="text-align:center;padding:8px;font-size:16px;font-weight:800;color:var(--text2)">Ставь и крутим!</div>
    <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">
      <button class="chip" style="background:var(--red);color:#fff" onclick="roulBet('red')">Красное</button>
      <button class="chip" style="background:#1a1a2e;color:#fff" onclick="roulBet('black')">Чёрное</button>
      <button class="chip" style="background:#00aa44;color:#fff" onclick="roulBet('green')">0</button>
      <button class="chip" onclick="roulBet('even')">Чёт</button>
      <button class="chip" onclick="roulBet('odd')">Нечет</button>
      <button class="chip" onclick="roulBet('low')">1-18</button>
      <button class="chip" onclick="roulBet('high')">19-36</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:12px" id="roul-numbers"></div>
    <button class="btn btn-gold" id="roul-spin">КРУТИТЬ</button>
  `;

  const numGrid = $('roul-numbers');
  for (let i = 0; i <= 36; i++) {
    const cell = document.createElement('button');
    const color = i === 0 ? 'r-green' : RED.has(i) ? 'r-red' : 'r-black';
    cell.className = `roulette-cell ${color}`;
    cell.textContent = i;
    cell.onclick = () => doSpin('number', i);
    numGrid.appendChild(cell);
  }

  async function doSpin(betType, value) {
    const bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }

    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'roulette', bet, params: { variant: 'european', bet_type: betType, bet_value: value } });
    if (r.error) { toast(r.error); return; }

    lastResult = r;
    const colorMap = { red: 'var(--red)', black: 'var(--text)', green: 'var(--green)' };
    $('roul-result').innerHTML = `<span style="color:${colorMap[r.color]}">${r.number} ${r.color === 'red' ? '●' : r.color === 'black' ? '●' : '●'}</span>`;

    if (r.balance !== undefined) setBalance(r.balance);

    if (r.win > 0) {
      winModal('+' + fmt(r.win), `Рулетка x${r.mult}`);
    } else {
      toast(`−${fmt(bet)} ★`);
    }
  }

  window.roulBet = doSpin;
  $('roul-spin').onclick = () => {
    const types = ['red', 'black', 'odd', 'even', 'low', 'high'];
    doSpin(types[Math.floor(Math.random() * types.length)], 0);
  };
};
