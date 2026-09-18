window.loadMines = function(body) {
  let state = 'idle', bet = 0, revealed = [], minePositions = [], mult = 1;

  body.innerHTML = `
    ${betControls(50)}
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <div style="flex:1;text-align:center"><div style="font-size:11px;color:var(--text2)">Множитель</div><div id="m-mult" style="font-size:18px;font-weight:800;color:var(--gold)">x1.00</div></div>
      <div style="flex:1;text-align:center"><div style="font-size:11px;color:var(--text2)">Выигрыш</div><div id="m-win" style="font-size:18px;font-weight:800;color:var(--green)">★ 0</div></div>
    </div>
    <div class="mines-field" id="m-field"></div>
    <button class="btn btn-gold" id="m-start">НАЧАТЬ ИГРУ</button>
  `;

  const field = $('m-field');
  for (let i = 0; i < 30; i++) {
    const cell = document.createElement('div');
    cell.className = 'mines-cell';
    cell.dataset.idx = i;
    cell.onclick = () => revealCell(i);
    field.appendChild(cell);
  }

  async function startGame() {
    bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }

    // Step 0: deduct bet, generate mines
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'mines', bet, params: { rows: 5, cols: 6, mines: 3, revealed: [], step: 0 } });
    if (r.error) { toast(r.error); return; }
    if (r.mine_positions) minePositions = r.mine_positions;
    state = 'playing'; revealed = []; mult = 1;
    $('m-start').className = 'btn btn-green';
    $('m-start').textContent = 'ЗАБРАТЬ ★ 0';
    $('m-start').onclick = cashout;
    $('m-mult').textContent = 'x1.00';
    $('m-win').textContent = '★ 0';
    field.querySelectorAll('.mines-cell').forEach(c => { c.className = 'mines-cell'; c.textContent = ''; });
  }

  function revealCell(idx) {
    if (state !== 'playing' || revealed.includes(idx)) return;
    revealed.push(idx);
    const cell = field.children[idx];
    vibrate(10);

    if (minePositions.includes(idx)) {
      cell.className = 'mines-cell revealed-mine exploded';
      cell.textContent = '💣';
      state = 'exploded';
      minePositions.forEach(i => {
        const c = field.children[i];
        if (!revealed.includes(i)) { c.className = 'mines-cell revealed-mine'; c.textContent = '💣'; }
      });
      $('m-start').className = 'btn btn-gold';
      $('m-start').textContent = 'НАЧАТЬ ИГРУ';
      $('m-start').onclick = startGame;
      $('m-mult').textContent = '0';
      $('m-win').textContent = '★ 0';
      toast('Взрыв!');
      vibrate(50);
    } else {
      cell.className = 'mines-cell revealed-safe';
      cell.textContent = '💎';
      // Calculate multiplier client-side (server knows mines, we just reveal)
      const n = revealed.length;
      const total = 30, mines = minePositions.length;
      mult = 1;
      for (let i = 0; i < n; i++) {
        mult *= (total - i) / (total - mines - i);
      }
      mult = Math.round(mult * 0.97 * 100) / 100; // 3% house edge
      $('m-mult').textContent = 'x' + mult.toFixed(2);
      $('m-win').textContent = '★ ' + fmt(Math.floor(bet * mult));
      $('m-start').textContent = 'ЗАБРАТЬ ★ ' + fmt(Math.floor(bet * mult));
    }
  }

  async function cashout() {
    if (state !== 'playing' || revealed.length === 0) return;
    const win = Math.floor(bet * mult);

    // Step 1: credit win
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'mines', bet: 0, params: { revealed, mine_positions: minePositions, win, step: 1 } });
    if (r.balance !== undefined) setBalance(r.balance);
    else setBalance(ME.balance + win); // fallback

    state = 'idle';
    $('m-start').className = 'btn btn-gold';
    $('m-start').textContent = 'НАЧАТЬ ИГРУ';
    $('m-start').onclick = startGame;
    if (win > bet) winModal('+' + fmt(win - bet), `Мины x${mult.toFixed(2)} • ${revealed.length} ячеек`);
    else toast('Выигрыш: ' + fmt(win) + ' ★');
  }

  $('m-start').onclick = startGame;
};
