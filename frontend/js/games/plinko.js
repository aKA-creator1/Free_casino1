window.loadPlinko = function(body) {
  const ROWS = 12, M = [20,10,4,2,1.2,0.5,0.3,0.5,1.2,2,4,10,20];
  let sessionProfit = 0, sessionCount = 0;

  body.innerHTML = `
    <div class="plinko-board" id="pl-board" style="height:300px"></div>
    <div class="plinko-buckets" id="pl-buckets"></div>
    ${betControls(50)}
    <button class="btn btn-gold" id="pl-drop">ТАП = 1 ШАР</button>
    <div style="text-align:center;padding:8px;color:var(--text2);font-size:12px" id="pl-out">Сессия: 0 шаров • 0 ★</div>
  `;

  const board = $('pl-board');
  let pegs = '';
  for (let i = 0; i < ROWS; i++) for (let j = 0; j <= i; j++)
    pegs += `<div class="plinko-peg" style="left:${50 + (j - i/2) * 7}%;top:${5 + i * 7}%"></div>`;
  board.innerHTML = pegs;

  paintBuckets(-1);

  function paintBuckets(hot) {
    $('pl-buckets').innerHTML = M.map((m, i) =>
      `<div class="plinko-bucket ${i === 0 || i === 12 ? 'hc-red' : i < 4 || i > 8 ? 'hc-gold' : 'hc-green'}${i === hot ? ' hot' : ''}">${m}x</div>`
    ).join('');
  }

  async function dropBall() {
    const bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }
    vibrate(10);

    // Single call: server handles everything
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'plinko', bet, params: { count: 1, step: 0 } });
    if (r.error) { toast(r.error); return; }
    if (r.balance !== undefined) setBalance(r.balance);

    const result = r.results && r.results[0];
    if (!result) return;

    // Animate ball
    const ball = document.createElement('div');
    ball.className = 'plinko-ball';
    ball.style.left = '50%'; ball.style.top = '3%';
    board.appendChild(ball);

    // Calculate path from result slot
    const slot = result.slot;
    let rights = slot;
    const path = [];
    for (let i = 0; i < ROWS; i++) {
      path.push(rights > 0 ? 1 : 0);
      if (rights > 0) rights--;
    }

    for (let i = 0; i < ROWS; i++) {
      const rightsSoFar = path.slice(0, i + 1).reduce((a, x) => a + x, 0);
      ball.style.left = (50 + (rightsSoFar - (i + 1) / 2) * 7) + '%';
      ball.style.top = (5 + (i + 1) * 7) + '%';
      await new Promise(res => setTimeout(res, 80));
    }
    setTimeout(() => ball.remove(), 500);

    paintBuckets(result.slot);
    sessionCount++;
    sessionProfit += r.total_win - bet;
    $('pl-out').textContent = `Сессия: ${sessionCount} шаров • ${sessionProfit >= 0 ? '+' : ''}${fmt(sessionProfit)} ★`;
  }

  $('pl-drop').onclick = dropBall;
  board.onclick = dropBall;
};
