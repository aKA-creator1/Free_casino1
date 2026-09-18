window.API = '';
window.ME = { tg_id: 0, balance: 0, username: '' };

const $ = s => document.getElementById(s);
const fmt = v => v % 1 === 0 ? v.toLocaleString('ru-RU') : v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const vibrate = ms => { try { navigator.vibrate(ms); } catch(e) {} };

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function showModal(title, body) {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = body;
  $('modal-overlay').style.display = 'flex';
}

function hideModal() {
  $('modal-overlay').style.display = 'none';
}
$('modal-close').onclick = hideModal;

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(API + '/api' + path, opts);
    return await r.json();
  } catch (e) {
    console.error('API error:', e);
    return { error: 'network' };
  }
}

function setBalance(v) {
  ME.balance = v;
  $('bal-amount').textContent = fmt(v);
  $('game-balance').textContent = '★ ' + fmt(v);
}

// Tab navigation
let currentTab = 'home';
let currentGame = null;

function switchTab(tab) {
  currentTab = tab;
  currentGame = null;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const screen = $('screen-' + tab);
  if (screen) screen.classList.add('active');
  const tabEl = document.querySelector(`[data-tab="${tab}"]`);
  if (tabEl) tabEl.classList.add('active');
  if (tab === 'cases') loadCases();
  if (tab === 'leaders') loadLeaders();
  if (tab === 'profile') loadProfile();
}

document.querySelectorAll('.tab').forEach(t => {
  t.onclick = () => switchTab(t.dataset.tab);
});

function openGame(gameId) {
  currentGame = gameId;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('screen-game').classList.add('active');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const name = gameId.replace('slots-classic', 'Классические слоты').replace('slots-video', 'Видео-слоты').replace('pvp-rps', 'КНБ').replace('pvp-bj', 'Блекджек 21');
  $('game-title').textContent = name.charAt(0).toUpperCase() + name.slice(1);
  $('game-balance').textContent = '★ ' + fmt(ME.balance);
  loadGame(gameId);
}

$('back-btn').onclick = () => switchTab('home');

document.querySelectorAll('.game-card').forEach(card => {
  card.onclick = () => openGame(card.dataset.game);
});

// Tap
let tapBusy = false;
$('tap-coin').onclick = async () => {
  if (tapBusy) return;
  tapBusy = true;
  vibrate(15);
  const r = await api('/tap', 'POST', { tg_id: ME.tg_id });
  tapBusy = false;
  if (r.error === 'limit') { toast('Лимит тапов на сегодня'); return; }
  if (r.balance !== undefined) {
    setBalance(r.balance);
    $('taps-today').textContent = r.taps_today;
    if (r.mult !== 'x1') {
      toast(`${r.mult}! +${fmt(r.reward)} ★`);
    }
  }
};

async function loadCases() {
  const cases = await api('/cases/list');
  if (!Array.isArray(cases)) return;
  $('cases-grid').innerHTML = cases.map(c => `
    <div class="case-card" onclick="openCaseModal(${c.id},${c.price})">
      <div class="case-icon">📦</div>
      <div class="case-name">${c.name}</div>
      <div class="case-price">★ ${fmt(c.price)}</div>
    </div>
  `).join('');
}

async function openCaseModal(caseId, price) {
  if (ME.balance < price) { toast('Мало ★!'); return; }
  const r = await api('/cases/open', 'POST', { tg_id: ME.tg_id, case_id: caseId });
  if (r.error) { toast(r.error); return; }
  setBalance(r.balance);
  const rarityColor = { common: '#aaa', uncommon: '#44aaff', rare: '#aa55ff', epic: '#ff8800', legendary: '#FFD700' };
  showModal('📦 ' + r.item.name, `
    <div style="font-size:48px;margin:12px 0">${r.item.name}</div>
    <div style="color:${rarityColor[r.item.rarity] || '#fff'};font-weight:700;text-transform:uppercase;font-size:12px">${r.item.rarity}</div>
    <div style="margin-top:8px;color:${r.profit >= 0 ? 'var(--green)' : 'var(--red)'};font-size:16px;font-weight:700">${r.profit >= 0 ? '+' : ''}${fmt(r.profit)} ★</div>
  `);
}

async function loadLeaders() {
  const top = await api('/top');
  if (!Array.isArray(top)) return;
  $('leaders-list').innerHTML = top.map((u, i) => {
    const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : 'other';
    return `<div class="leader-row">
      <div class="leader-rank ${rankClass}">${i + 1}</div>
      <div class="leader-name">${u.username || u.first_name || 'User'}</div>
      <div class="leader-bal">★ ${fmt(u.balance)}</div>
    </div>`;
  }).join('');
}

async function loadProfile() {
  const p = await api('/profile', 'POST', { tg_id: ME.tg_id });
  if (p.error) return;
  $('profile-name').textContent = p.username || p.first_name || 'Guest';
  $('profile-id').textContent = 'ID: ' + p.tg_id;
  $('profile-stats').innerHTML = `
    <div class="stat-card"><div class="stat-value">★ ${fmt(p.balance)}</div><div class="stat-label">Баланс</div></div>
    <div class="stat-card"><div class="stat-value">${p.total_taps.toLocaleString()}</div><div class="stat-label">Тапов</div></div>
    <div class="stat-card"><div class="stat-value result-win">+${fmt(p.total_won)}</div><div class="stat-label">Выиграно</div></div>
    <div class="stat-card"><div class="stat-value result-lose">-${fmt(p.total_lost)}</div><div class="stat-label">Проиграно</div></div>
  `;
}

function loadGame(gameId) {
  const body = $('game-body');
  body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">Загрузка...</div>';
  const loaders = {
    'crash': () => window.loadCrash && window.loadCrash(body),
    'mines': () => window.loadMines && window.loadMines(body),
    'plinko': () => window.loadPlinko && window.loadPlinko(body),
    'tower': () => window.loadTower && window.loadTower(body),
    'slots-classic': () => window.loadSlots && window.loadSlots(body, 'classic'),
    'slots-video': () => window.loadSlots && window.loadSlots(body, 'video'),
    'roulette': () => window.loadRoulette && window.loadRoulette(body),
    'blackjack': () => window.loadBlackjack && window.loadBlackjack(body),
    'dice': () => window.loadDice && window.loadDice(body),
    'upgrader': () => window.loadUpgrader && window.loadUpgrader(body),
    'pvp-rps': () => window.loadPVP && window.loadPVP(body, 'rps'),
    'pvp-bj': () => window.loadPVP && window.loadPVP(body, 'blackjack21'),
    'cases': () => loadCasesInGame(body),
  };
  setTimeout(() => { if (loaders[gameId]) loaders[gameId](); }, 50);
}

async function loadCasesInGame(body) {
  const cases = await api('/cases/list');
  if (!Array.isArray(cases)) return;
  body.innerHTML = cases.map(c => `
    <div class="case-card" style="margin-bottom:10px" onclick="openCaseModal(${c.id},${c.price})">
      <div class="case-icon">📦</div>
      <div class="case-name">${c.name}</div>
      <div class="case-price">★ ${fmt(c.price)}</div>
    </div>
  `).join('');
}

// Bet helpers
function betControls(defaultBet = 50) {
  return `<div class="bet-panel">
    <div class="bet-label">СТАВКА</div>
    <div class="bet-row">
      <div class="bet-input-wrap">
        <input class="bet-input" id="g-bet" type="number" value="${defaultBet}" min="1">
        <span class="bet-star">★</span>
      </div>
    </div>
    <div class="bet-chips">
      <button class="chip" onclick="setBet(10)">10</button>
      <button class="chip hot" onclick="setBet(${defaultBet})">${defaultBet}</button>
      <button class="chip" onclick="setBet(100)">100</button>
      <button class="chip" onclick="setBet(500)">500</button>
      <button class="chip" onclick="setBet('half')">½</button>
      <button class="chip" onclick="setBet('max')">MAX</button>
    </div>
  </div>`;
}

function setBet(v) {
  const inp = $('g-bet');
  if (!inp) return;
  if (v === 'half') inp.value = Math.max(1, Math.floor(ME.balance / 2));
  else if (v === 'max') inp.value = Math.floor(ME.balance);
  else inp.value = v;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('hot'));
}

function getBet() {
  return Math.max(1, parseInt($('g-bet')?.value || 50));
}

function winModal(amount, text) {
  showModal('🎉 ПОБЕДА!', `<div class="result-big result-win">${amount} ★</div><div>${text}</div>`);
  vibrate(50);
}

// Init
(async function init() {
  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    const initData = Telegram.WebApp.initDataUnsafe;
    if (initData && initData.user) {
      ME.tg_id = initData.user.id;
      ME.username = initData.user.username || '';
    }
  }
  if (!ME.tg_id) ME.tg_id = 12345;

  const u = await api('/user/init', 'POST', { tg_id: ME.tg_id, username: ME.username, first_name: '' });
  if (u.balance !== undefined) {
    ME.balance = u.balance;
    ME.tg_id = u.tg_id;
    setBalance(u.balance);
    $('taps-today').textContent = u.daily_taps || 0;
  }
})();
