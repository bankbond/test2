const ships = {
  rebels: {
    side: 'Повстанці',
    name: 'X-Wing «Nova»',
    hp: 100,
    maxHp: 100,
    minDamage: 12,
    maxDamage: 28,
    critChance: 0.2,
    evadeChance: 0.18,
  },
  empire: {
    side: 'Імперія',
    name: 'TIE Interceptor «Razor»',
    hp: 100,
    maxHp: 100,
    minDamage: 10,
    maxDamage: 30,
    critChance: 0.22,
    evadeChance: 0.15,
  },
};

const turnButton = document.getElementById('turnButton');
const autoButton = document.getElementById('autoButton');
const resetButton = document.getElementById('resetButton');
const battleLog = document.getElementById('battleLog');
const statusText = document.getElementById('statusText');

const ui = {
  rebels: {
    card: document.getElementById('rebelCard'),
    hpBar: document.getElementById('rebelHp'),
    hpText: document.getElementById('rebelHpText'),
    stats: document.getElementById('rebelStats'),
  },
  empire: {
    card: document.getElementById('empireCard'),
    hpBar: document.getElementById('empireHp'),
    hpText: document.getElementById('empireHpText'),
    stats: document.getElementById('empireStats'),
  },
};

let round = 1;
let battleFinished = false;
let autoTimer = null;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(probability) {
  return Math.random() < probability;
}

function addLog(text) {
  const item = document.createElement('li');
  item.textContent = text;
  battleLog.prepend(item);
}

function updateShipUi(key) {
  const ship = ships[key];
  const block = ui[key];
  block.hpBar.max = ship.maxHp;
  block.hpBar.value = ship.hp;
  block.hpText.textContent = `${ship.hp} / ${ship.maxHp}`;
  block.stats.innerHTML = `
    <li>⚡ Урон: ${ship.minDamage}–${ship.maxDamage}</li>
    <li>🎯 Критичний шанс: ${Math.round(ship.critChance * 100)}%</li>
    <li>🛡️ Шанс ухилення: ${Math.round(ship.evadeChance * 100)}%</li>
  `;

  block.card.classList.toggle('destroyed', ship.hp <= 0);
}

function setCardState(attackerKey, defenderKey) {
  Object.values(ui).forEach((block) => {
    block.card.classList.remove('attacking', 'hit');
  });
  ui[attackerKey].card.classList.add('attacking');
  ui[defenderKey].card.classList.add('hit');
}

function clearCardState() {
  Object.values(ui).forEach((block) => {
    block.card.classList.remove('attacking', 'hit');
  });
}

function attack(attackerKey, defenderKey) {
  const attacker = ships[attackerKey];
  const defender = ships[defenderKey];

  setCardState(attackerKey, defenderKey);

  if (chance(defender.evadeChance)) {
    addLog(`Раунд ${round}: ${defender.name} ухиляється від атаки ${attacker.name}.`);
    return;
  }

  let damage = randomInt(attacker.minDamage, attacker.maxDamage);
  let critical = false;

  if (chance(attacker.critChance)) {
    damage = Math.round(damage * 1.6);
    critical = true;
  }

  defender.hp = Math.max(0, defender.hp - damage);

  const critText = critical ? ' КРИТИЧНЕ влучання!' : '';
  addLog(
    `Раунд ${round}: ${attacker.name} завдає ${damage} шкоди по ${defender.name}.${critText}`,
  );

  updateShipUi(defenderKey);

  if (defender.hp <= 0) {
    battleFinished = true;
    statusText.textContent = `🏆 Перемога: ${attacker.side}! ${defender.name} знищено.`;
    addLog(`БІЙ ЗАВЕРШЕНО: ${attacker.side} перемагають у раунді ${round}.`);
    stopAutoBattle();
    clearCardState();
    turnButton.disabled = true;
    autoButton.disabled = true;
  }
}

function playRound() {
  if (battleFinished) {
    return;
  }

  const attackerKey = Math.random() < 0.5 ? 'rebels' : 'empire';
  const defenderKey = attackerKey === 'rebels' ? 'empire' : 'rebels';

  statusText.textContent = `Раунд ${round}: атакують ${ships[attackerKey].side}.`;
  attack(attackerKey, defenderKey);
  round += 1;
}

function stopAutoBattle() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

function startAutoBattle() {
  if (battleFinished || autoTimer) {
    return;
  }

  autoTimer = setInterval(() => {
    playRound();
    if (battleFinished) {
      stopAutoBattle();
    }
  }, 500);
}

function resetBattle() {
  ships.rebels.hp = ships.rebels.maxHp;
  ships.empire.hp = ships.empire.maxHp;
  round = 1;
  battleFinished = false;
  stopAutoBattle();
  turnButton.disabled = false;
  autoButton.disabled = false;
  battleLog.innerHTML = '';
  statusText.textContent = 'Бій готовий. Хто відкриє вогонь першим?';
  clearCardState();
  updateShipUi('rebels');
  updateShipUi('empire');
  addLog('Системи активовано. Обидва кораблі входять у бій.');
}

turnButton.addEventListener('click', playRound);
autoButton.addEventListener('click', startAutoBattle);
resetButton.addEventListener('click', resetBattle);

resetBattle();
