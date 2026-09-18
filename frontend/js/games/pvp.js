window.loadPVP = function(body, gameType) {
  body.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="font-size:48px;margin-bottom:12px">${gameType === 'rps' ? '✊' : '🃏'}</div>
      <h3 style="color:var(--text);margin-bottom:8px">${gameType === 'rps' ? 'Камень-Ножницы-Бумага' : 'Блекджек 21'}</h3>
      <p style="color:var(--text2);font-size:13px;margin-bottom:16px">Создай комнату или присоединись к существующей</p>
      ${betControls(100)}
      <button class="btn btn-gold" id="pvp-create" style="margin-bottom:8px">СОЗДАТЬ КОМНАТУ</button>
      <button class="btn btn-outline" id="pvp-refresh">ОБНОВИТЬ СПИСОК</button>
      <div id="pvp-rooms" style="margin-top:12px;text-align:left"></div>
    </div>
  `;

  async function loadRooms() {
    const rooms = await api('/pvp/rooms');
    const el = $('pvp-rooms');
    if (!Array.isArray(rooms) || rooms.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text3);padding:16px">Нет активных комнат</div>';
      return;
    }
    el.innerHTML = rooms.map(r => `
      <div class="leader-row" style="cursor:pointer" onclick="joinPVP(${r.id})">
        <div class="leader-rank other">${r.game_type.toUpperCase()}</div>
        <div class="leader-name">${r.p1_name || 'Player 1'}</div>
        <div class="leader-bal">★ ${fmt(r.bet)}</div>
      </div>
    `).join('');
  }

  async function createRoom() {
    const bet = getBet();
    if (ME.balance < bet) { toast('Мало ★!'); return; }
    const r = await api('/pvp/create', 'POST', { tg_id: ME.tg_id, game_type: gameType, bet });
    if (r.error) { toast(r.error); return; }
    toast('Комната создана! Ожидание соперника...');
    loadRooms();
  }

  window.joinPVP = async function(roomId) {
    const r = await api('/pvp/join', 'POST', { tg_id: ME.tg_id, room_id: roomId });
    if (r.error) { toast(r.error); return; }
    toast('Присоединился! Играем...');
    if (gameType === 'rps') playRPS(roomId);
  };

  function playRPS(roomId) {
    body.innerHTML = `
      <div style="text-align:center;padding:20px">
        <h3 style="color:var(--text);margin-bottom:16px">Выбери действие</h3>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="game-card gc-red" style="width:100px;height:100px;flex-direction:column" onclick="rpsAction('${roomId}','rock')">
            <div style="font-size:36px">✊</div><div style="font-size:12px;color:var(--text2)">Камень</div>
          </button>
          <button class="game-card gc-teal" style="width:100px;height:100px;flex-direction:column" onclick="rpsAction('${roomId}','scissors')">
            <div style="font-size:36px">✌</div><div style="font-size:12px;color:var(--text2)">Ножницы</div>
          </button>
          <button class="game-card gc-blue" style="width:100px;height:100px;flex-direction:column" onclick="rpsAction('${roomId}','paper')">
            <div style="font-size:36px">🖐</div><div style="font-size:12px;color:var(--text2)">Бумага</div>
          </button>
        </div>
        <div id="rps-result" style="margin-top:16px;font-size:16px;color:var(--text2)">Ожидание...</div>
      </div>
    `;
  }

  window.rpsAction = async function(roomId, choice) {
    const r = await api('/pvp/action', 'POST', { tg_id: ME.tg_id, room_id: +roomId, action: choice });
    if (r.finished) {
      const msgs = { player1: 'Победа!', player2: 'Проигрыш!', draw: 'Ничья!' };
      $('rps-result').innerHTML = `<span class="${r.result === 'draw' ? 'result-push' : r.result === 'player1' ? 'result-win' : 'result-lose'}">${msgs[r.result]}</span>`;
      if (r.result !== 'draw') winModal(r.result === 'player1' ? 'Победа!' : 'Проигрыш', msgs[r.result]);
    } else {
      $('rps-result').textContent = 'Ожидание соперника...';
    }
  };

  $('pvp-create').onclick = createRoom;
  $('pvp-refresh').onclick = loadRooms;
  loadRooms();
};
