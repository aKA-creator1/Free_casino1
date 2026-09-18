window.loadCrash = function(body) {
  let live = false, crashed = false, mult = 1.0, timer = null, bet = 0, cashedOut = false;
  let crashedAt = 0;
  const history = JSON.parse(localStorage.getItem('crash_history') || '[]');

  body.innerHTML = `
    <div class="history-bar" id="ch-bar">${history.slice(-10).map(h =>
      `<span class="history-chip ${h >= 2 ? 'hc-green' : h >= 1.2 ? 'hc-gold' : 'hc-red'}">${h.toFixed(2)}x</span>`
    ).join('')}</div>
    <div class="crash-chart" id="cr-chart">
      <canvas id="cr-canvas" style="width:100%;height:100%"></canvas>
      <div class="crash-mult" id="cr-mult" style="color:var(--green)">1.00x</div>
    </div>
    ${betControls(50)}
    <button class="btn btn-gold" id="cr-start">НАЧАТЬ</button>
    <div class="small" id="cr-out" style="text-align:center;padding:8px;color:var(--text2)">Нажми "Начать" для нового раунда</div>
  `;

  const canvas = $('cr-canvas');
  const ctx = canvas.getContext('2d');
  let points = [];

  function drawChart() {
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    if (points.length < 2) return;
    const maxVal = Math.max(...points, 2);
    ctx.beginPath();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0,255,136,0.3)';
    ctx.shadowBlur = 10;
    points.forEach((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - 1) / (maxVal - 1)) * (h * 0.85) - h * 0.05;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  async function startRound() {
    if (live) return;
    bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }

    // Step 0: deduct bet, get crash point
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'crash', bet, params: { cashout_at: 0, step: 0 } });
    if (r.error) { toast(r.error); return; }
    if (r.balance !== undefined) setBalance(r.balance);

    crashedAt = r.crashed_at || 1.01;
    live = true; crashed = false; cashedOut = false; mult = 1.0; points = [1.0];
    $('cr-start').disabled = true;
    $('cr-start').textContent = 'ИГРАЕМ...';
    $('cr-start').className = 'btn btn-outline';
    $('cr-mult').textContent = '1.00x';
    $('cr-mult').style.color = 'var(--green)';
    $('cr-out').textContent = '';

    timer = setInterval(() => {
      mult += mult * 0.04 + 0.003;
      mult = Math.round(mult * 100) / 100;
      points.push(mult);
      $('cr-mult').textContent = mult.toFixed(2) + 'x';
      drawChart();

      if (mult >= crashedAt) {
        clearInterval(timer);
        crashed = true; live = false;
        $('cr-mult').textContent = crashedAt.toFixed(2) + 'x';
        $('cr-mult').style.color = 'var(--red)';
        $('cr-start').disabled = false;
        $('cr-start').textContent = 'НАЧАТЬ';
        $('cr-start').className = 'btn btn-gold';
        history.push(crashedAt);
        if (history.length > 20) history.shift();
        localStorage.setItem('crash_history', JSON.stringify(history));
        const hBar = $('cr-chart').previousElementSibling;
        if (hBar) hBar.innerHTML = history.slice(-10).map(h =>
          `<span class="history-chip ${h >= 2 ? 'hc-green' : h >= 1.2 ? 'hc-gold' : 'hc-red'}">${h.toFixed(2)}x</span>`
        ).join('');
        if (!cashedOut) {
          $('cr-out').innerHTML = `<span class="result-lose">Краш! −${fmt(bet)} ★</span>`;
          vibrate(30);
        }
      }
    }, 60);
  }

  async function cashout() {
    if (!live || cashedOut || crashed) return;
    cashedOut = true;

    // Step 1: get win (server already deducted bet on step 0)
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'crash', bet: 0, params: { cashout_at: mult, step: 1 } });
    if (r.balance !== undefined) setBalance(r.balance);
    const win = r.win || 0;
    $('cr-out').innerHTML = `<span class="result-win">Забрал: ${fmt(win)} ★ (x${mult.toFixed(2)})</span>`;
    if (win > bet) winModal('+' + fmt(win), `Crash x${mult.toFixed(2)}`);
  }

  $('cr-start').onclick = startRound;
  $('cr-chart').onclick = cashout;
  $('cr-mult').onclick = cashout;
};
