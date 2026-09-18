window.loadTower = function(body) {
  let state = 'idle', bet = 0, currentRow = -1, path = [], mineCol = -1;

  body.innerHTML = `
    ${betControls(50)}
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <div style="flex:1;text-align:center"><div style="font-size:11px;color:var(--text2)">Ряд</div><div id="tw-row" style="font-size:18px;font-weight:800;color:var(--gold)">0/8</div></div>
      <div style="flex:1;text-align:center"><div style="font-size:11px;color:var(--text2)">Множитель</div><div id="tw-mult" style="font-size:18px;font-weight:800;color:var(--gold)">x1.00</div></div>
      <div style="flex:1;text-align:center"><div style="font-size:11px;color:var(--text2)">Выигрыш</div><div id="tw-win" style="font-size:18px;font-weight:800;color:var(--green)">★ 0</div></div>
    </div>
    <div class="tower-grid" id="tw-grid"></div>
    <button class="btn btn-gold" id="tw-start">НАЧАТЬ</button>
  `;

  const mults = [1.0, 1.2, 1.5, 2.0, 3.0, 5.0, 8.0, 12.0, 20.0];

  function renderGrid() {
    const grid = $('tw-grid');
    grid.innerHTML = '';
    for (let row = 7; row >= 0; row--) {
      for (let col = 0; col < 3; col++) {
        const cell = document.createElement('div');
        cell.className = 'tower-cell';
        if (row > currentRow) cell.classList.add('locked');
        else if (row === currentRow) { cell.onclick = () => chooseColumn(col); }
        else if (row < currentRow) {
          if (path[row] !== undefined && path[row] === col) cell.classList.add('safe');
        }
        grid.appendChild(cell);
      }
    }
  }

  async function startGame() {
    bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }

    // Step 0: deduct bet
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'tower', bet, params: { choice: 0, current_row: -1, path: [], step: 0 } });
    if (r.error) { toast(r.error); return; }

    state = 'playing'; currentRow = -1; path = [];
    $('tw-start').className = 'btn btn-green';
    $('tw-start').textContent = 'ЗАБРАТЬ';
    $('tw-start').onclick = cashout;
    nextRow();
  }

  function nextRow() {
    currentRow++;
    $('tw-row').textContent = currentRow + '/8';
    $('tw-mult').textContent = 'x' + mults[currentRow].toFixed(2);
    $('tw-win').textContent = '★ ' + fmt(Math.floor(bet * mults[currentRow]));
    if (currentRow >= 8) { cashout(); return; }
    renderGrid();
  }

  function chooseColumn(col) {
    if (state !== 'playing') return;
    vibrate(10);

    // Generate mine position for this row (client-side)
    const m = Math.floor(Math.random() * 3);

    if (col === m) {
      // Hit mine
      state = 'idle';
      const grid = $('tw-grid');
      const rowIdx = (7 - currentRow) * 3;
      grid.children[rowIdx + col].classList.add('mine-hit');
      grid.children[rowIdx + col].textContent = '💣';
      // Show all mines
      for (let r = currentRow; r < 8; r++) {
        const mc = Math.floor(Math.random() * 3);
        for (let c = 0; c < 3; c++) {
          const cell = grid.children[(7 - r) * 3 + c];
          if (c === mc && !cell.classList.contains('safe')) {
            cell.classList.add('mine-hit');
            cell.textContent = '💣';
          }
        }
      }
      $('tw-start').className = 'btn btn-gold';
      $('tw-start').textContent = 'НАЧАТЬ';
      $('tw-start').onclick = startGame;
      $('tw-mult').textContent = '0';
      toast('Мина!');
      vibrate(50);
    } else {
      path.push(col);
      nextRow();
    }
  }

  async function cashout() {
    if (state !== 'playing') return;
    const win = Math.floor(bet * mults[currentRow]);

    // Step 1: credit win
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'tower', bet: 0, params: { win, step: 1 } });
    if (r.balance !== undefined) setBalance(r.balance);
    else setBalance(ME.balance + win);

    state = 'idle';
    $('tw-start').className = 'btn btn-gold';
    $('tw-start').textContent = 'НАЧАТЬ';
    $('tw-start').onclick = startGame;
    if (win > bet) winModal('+' + fmt(win - bet), `Кирка: ${currentRow} рядов`);
  }

  renderGrid();
  $('tw-start').onclick = startGame;
};
