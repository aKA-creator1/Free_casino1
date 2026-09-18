window.loadBlackjack = function(body) {
  let playerHand = [], dealerHand = [], state = 'idle', initialBet = 0;

  body.innerHTML = `
    ${betControls(50)}
    <div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text2);margin-bottom:4px">ДИЛЕР <span id="bj-d-score"></span></div><div class="bj-hand" id="bj-d"></div></div>
    <div style="margin-bottom:12px"><div style="font-size:11px;color:var(--text2);margin-bottom:4px">ИГРОК <span id="bj-p-score"></span></div><div class="bj-hand" id="bj-p"></div></div>
    <div id="bj-result" style="text-align:center;padding:8px;font-size:16px;font-weight:800"></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-gold" id="bj-deal" style="flex:1">РАЗДАТЬ</button>
      <button class="btn btn-green" id="bj-hit" style="flex:1;display:none">ЕЩЁ</button>
      <button class="btn btn-red" id="bj-stand" style="flex:1;display:none">СТОП</button>
      <button class="btn btn-outline" id="bj-double" style="flex:1;display:none">×2</button>
    </div>
  `;

  function cardHtml(card) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return `<div class="bj-card ${isRed ? 'red' : 'black'}"><div class="bj-card-rank">${card.rank}</div><div class="bj-card-suit">${card.suit}</div></div>`;
  }

  function renderHands(dHidden = false) {
    $('bj-d').innerHTML = dHidden ? '<div class="bj-card bj-card-back"><div class="bj-card-rank">?</div></div>' + cardHtml(dealerHand[0]) : dealerHand.map(cardHtml).join('');
    $('bj-p').innerHTML = playerHand.map(cardHtml).join('');
    $('bj-d-score').textContent = dHidden ? dealerHand[0].value : calcScore(dealerHand);
    $('bj-p-score').textContent = calcScore(playerHand);
  }

  function calcScore(hand) {
    let total = hand.reduce((s, c) => s + c.value, 0);
    let aces = hand.filter(c => c.rank === 'A').length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }

  async function deal() {
    initialBet = getBet();
    if (ME.balance < initialBet) { toast('Мало ★!'); return; }
    state = 'dealing';
    $('bj-result').textContent = '';
    $('bj-deal').style.display = 'none';
    $('bj-hit').style.display = '';
    $('bj-stand').style.display = '';
    $('bj-double').style.display = '';

    // Step 0: deduct bet, deal cards
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'blackjack', bet: initialBet, params: { action: 'deal', step: 0 } });
    if (r.error) { toast(r.error); state = 'idle'; $('bj-deal').style.display = ''; $('bj-hit').style.display = 'none'; $('bj-stand').style.display = 'none'; $('bj-double').style.display = 'none'; return; }
    if (r.balance !== undefined) setBalance(r.balance);
    playerHand = r.player_hand;
    dealerHand = r.dealer_hand;
    renderHands(true);

    if (r.result === 'blackjack') {
      endGame(r);
    } else if (r.result === 'playing') {
      state = 'playing';
    }
  }

  async function hit() {
    // Step 1: no additional deduction
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'blackjack', bet: 0, params: { action: 'hit', player_hand: playerHand, dealer_hand: dealerHand, step: 1 } });
    playerHand = r.player_hand;
    dealerHand = r.dealer_hand;
    renderHands(r.result === 'playing');
    if (r.result !== 'playing') endGame(r);
  }

  async function stand() {
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'blackjack', bet: 0, params: { action: 'stand', player_hand: playerHand, dealer_hand: dealerHand, step: 1 } });
    playerHand = r.player_hand;
    dealerHand = r.dealer_hand;
    renderHands(false);
    endGame(r);
  }

  async function doubleDown() {
    // Double: bet additional amount, but only credit once
    const r = await api('/bet', 'POST', { tg_id: ME.tg_id, game: 'blackjack', bet: initialBet, params: { action: 'double', player_hand: playerHand, dealer_hand: dealerHand, step: 1 } });
    if (r.error) { toast(r.error); return; }
    if (r.balance !== undefined) setBalance(r.balance);
    playerHand = r.player_hand;
    dealerHand = r.dealer_hand;
    renderHands(false);
    endGame(r);
  }

  function endGame(r) {
    state = 'idle';
    $('bj-hit').style.display = 'none';
    $('bj-stand').style.display = 'none';
    $('bj-double').style.display = 'none';
    $('bj-deal').style.display = '';
    if (r.balance !== undefined) setBalance(r.balance);
    const msgs = { blackjack: 'Блекджек!', win: 'Победа!', double_win: 'Дабл! Победа!', push: 'Ничья!', lose: 'Проигрыш', bust: 'Перебор!', dealer_bust: 'Дилер перебрал!' };
    const cls = r.result.includes('win') || r.result === 'blackjack' || r.result === 'dealer_bust' ? 'result-win' : r.result === 'push' ? 'result-push' : 'result-lose';
    $('bj-result').innerHTML = `<span class="${cls}">${msgs[r.result] || r.result}</span>`;
    if (r.win > 0 && r.result !== 'push') winModal('+' + fmt(r.win), msgs[r.result]);
  }

  $('bj-deal').onclick = deal;
  $('bj-hit').onclick = hit;
  $('bj-stand').onclick = stand;
  $('bj-double').onclick = doubleDown;
};
