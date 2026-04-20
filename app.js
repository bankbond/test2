const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const battleLog = document.getElementById('battleLog');
const statusText = document.getElementById('statusText');
const statsContainer = document.getElementById('shipStats');
const toggleSimButton = document.getElementById('toggleSim');
const resetSimButton = document.getElementById('resetSim');

const world = {
  width: 900,
  height: 550,
  depth: 1200,
};

const camera = {
  x: 0,
  y: 40,
  z: -420,
  focalLength: 540,
};

let stars = [];
let lasers = [];
let ships = [];
let running = true;
let lastTime = performance.now();

function createShip(config) {
  return {
    id: config.id,
    team: config.team,
    color: config.color,
    x: config.x,
    y: config.y,
    z: config.z,
    vx: config.vx,
    vy: config.vy,
    vz: config.vz,
    hp: 100,
    radius: 18,
    maxSpeed: 170,
    fireCooldown: 0,
    targetId: null,
  };
}

function resetSimulation() {
  stars = Array.from({ length: 260 }, () => ({
    x: (Math.random() - 0.5) * world.width * 1.8,
    y: (Math.random() - 0.5) * world.height * 1.8,
    z: Math.random() * world.depth,
    size: Math.random() * 1.7 + 0.3,
  }));

  lasers = [];
  ships = [
    createShip({
      id: 'r1',
      team: 'Повстанці',
      color: '#7ec8ff',
      x: -180,
      y: -80,
      z: 180,
      vx: 34,
      vy: 18,
      vz: 52,
    }),
    createShip({
      id: 'r2',
      team: 'Повстанці',
      color: '#53ffe0',
      x: -250,
      y: 100,
      z: 300,
      vx: 30,
      vy: -22,
      vz: 46,
    }),
    createShip({
      id: 'e1',
      team: 'Імперія',
      color: '#ff8ca4',
      x: 190,
      y: 80,
      z: 870,
      vx: -37,
      vy: -16,
      vz: -60,
    }),
    createShip({
      id: 'e2',
      team: 'Імперія',
      color: '#ffcf7a',
      x: 250,
      y: -120,
      z: 760,
      vx: -32,
      vy: 20,
      vz: -56,
    }),
  ];

  battleLog.innerHTML = '';
  addLog('Симуляція перезапущена: ескадрильї займають позиції.');
  statusText.textContent = 'Симуляція активна…';
  renderHud();
}

function addLog(text) {
  const item = document.createElement('li');
  item.textContent = text;
  battleLog.prepend(item);
}

function project(point) {
  const dz = point.z - camera.z;
  if (dz <= 1) {
    return null;
  }

  const scale = camera.focalLength / dz;
  return {
    x: canvas.width / 2 + (point.x - camera.x) * scale,
    y: canvas.height / 2 - (point.y - camera.y) * scale,
    scale,
    depth: dz,
  };
}

function normalize(vec) {
  const len = Math.hypot(vec.x, vec.y, vec.z) || 1;
  return { x: vec.x / len, y: vec.y / len, z: vec.z / len };
}

function clampSpeed(ship) {
  const speed = Math.hypot(ship.vx, ship.vy, ship.vz);
  if (speed <= ship.maxSpeed) {
    return;
  }

  const k = ship.maxSpeed / speed;
  ship.vx *= k;
  ship.vy *= k;
  ship.vz *= k;
}

function seekTarget(ship, dt) {
  const enemies = ships.filter((s) => s.team !== ship.team && s.hp > 0);
  if (!enemies.length) {
    return;
  }

  let target = enemies[0];
  let bestDist = Infinity;

  enemies.forEach((enemy) => {
    const d = Math.hypot(enemy.x - ship.x, enemy.y - ship.y, enemy.z - ship.z);
    if (d < bestDist) {
      bestDist = d;
      target = enemy;
    }
  });

  ship.targetId = target.id;

  const desired = normalize({
    x: target.x - ship.x,
    y: target.y - ship.y,
    z: target.z - ship.z,
  });

  const steer = 95 * dt;
  ship.vx += desired.x * steer;
  ship.vy += desired.y * steer;
  ship.vz += desired.z * steer;

  const noise = 22 * dt;
  ship.vx += (Math.random() - 0.5) * noise;
  ship.vy += (Math.random() - 0.5) * noise;
  ship.vz += (Math.random() - 0.5) * noise;

  clampSpeed(ship);

  if (ship.fireCooldown <= 0 && bestDist < 300) {
    spawnLaser(ship, target);
    ship.fireCooldown = 0.42 + Math.random() * 0.35;
  }
}

function spawnLaser(from, to) {
  const dir = normalize({
    x: to.x - from.x,
    y: to.y - from.y,
    z: to.z - from.z,
  });

  lasers.push({
    team: from.team,
    color: from.color,
    x: from.x,
    y: from.y,
    z: from.z,
    vx: dir.x * 520,
    vy: dir.y * 520,
    vz: dir.z * 520,
    ttl: 1.6,
    damage: 7 + Math.random() * 12,
  });
}

function keepInWorld(ship) {
  const halfW = world.width / 2;
  const halfH = world.height / 2;

  if (ship.x < -halfW || ship.x > halfW) ship.vx *= -1;
  if (ship.y < -halfH || ship.y > halfH) ship.vy *= -1;
  if (ship.z < 20 || ship.z > world.depth) ship.vz *= -1;

  ship.x = Math.max(-halfW, Math.min(halfW, ship.x));
  ship.y = Math.max(-halfH, Math.min(halfH, ship.y));
  ship.z = Math.max(20, Math.min(world.depth, ship.z));
}

function updateShips(dt) {
  ships.forEach((ship) => {
    if (ship.hp <= 0) return;

    ship.fireCooldown = Math.max(0, ship.fireCooldown - dt);
    seekTarget(ship, dt);

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.z += ship.vz * dt;
    keepInWorld(ship);
  });
}

function updateLasers(dt) {
  lasers.forEach((laser) => {
    laser.x += laser.vx * dt;
    laser.y += laser.vy * dt;
    laser.z += laser.vz * dt;
    laser.ttl -= dt;

    ships.forEach((ship) => {
      if (ship.hp <= 0 || ship.team === laser.team) {
        return;
      }

      const dist = Math.hypot(ship.x - laser.x, ship.y - laser.y, ship.z - laser.z);
      if (dist <= ship.radius + 5) {
        ship.hp = Math.max(0, ship.hp - laser.damage);
        laser.ttl = 0;

        const hpLeft = Math.round(ship.hp);
        addLog(`${laser.team} влучили по ${ship.id}. HP: ${hpLeft}`);

        if (ship.hp <= 0) {
          addLog(`💥 ${ship.id} (${ship.team}) знищено.`);
        }
      }
    });
  });

  lasers = lasers.filter((laser) => laser.ttl > 0);
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(100, 145, 230, 0.16)';
  ctx.lineWidth = 1;

  for (let z = 100; z <= world.depth; z += 140) {
    const left = project({ x: -world.width / 2, y: 0, z });
    const right = project({ x: world.width / 2, y: 0, z });
    if (!left || !right) continue;

    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }
}

function drawStars() {
  stars.forEach((star) => {
    const p = project(star);
    if (!p) return;

    const alpha = Math.max(0.15, 1 - p.depth / 1700);
    ctx.fillStyle = `rgba(205, 225, 255, ${alpha})`;
    const size = star.size * p.scale * 3;
    ctx.fillRect(p.x, p.y, size, size);
  });
}

function drawShip(ship) {
  if (ship.hp <= 0) return;
  const p = project(ship);
  if (!p) return;

  const size = Math.max(3, ship.radius * p.scale * 1.9);
  const healthRatio = ship.hp / 100;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(size * 1.2, 0);
  ctx.lineTo(-size, -size * 0.65);
  ctx.lineTo(-size * 0.6, 0);
  ctx.lineTo(-size, size * 0.65);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${0.25 + healthRatio * 0.45})`;
  ctx.fillRect(-size, size + 2, size * 2 * healthRatio, 2);
  ctx.restore();
}

function drawLaser(laser) {
  const p = project(laser);
  if (!p) return;

  const glow = Math.max(1, p.scale * 7);
  ctx.fillStyle = laser.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
  ctx.fill();
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawGrid();

  const renderList = [
    ...ships.map((ship) => ({ kind: 'ship', z: ship.z, data: ship })),
    ...lasers.map((laser) => ({ kind: 'laser', z: laser.z, data: laser })),
  ].sort((a, b) => b.z - a.z);

  renderList.forEach((item) => {
    if (item.kind === 'ship') drawShip(item.data);
    else drawLaser(item.data);
  });
}

function renderHud() {
  statsContainer.innerHTML = ships
    .map((ship) => {
      const speed = Math.round(Math.hypot(ship.vx, ship.vy, ship.vz));
      return `
        <article class="ship-stat">
          <h4>${ship.id} · ${ship.team}</h4>
          <p class="hp">HP: ${Math.round(ship.hp)}</p>
          <p>Позиція: (${ship.x.toFixed(0)}, ${ship.y.toFixed(0)}, ${ship.z.toFixed(0)})</p>
          <p>Швидкість: ${speed} u/s</p>
          <p>Ціль: ${ship.targetId ?? '—'}</p>
        </article>
      `;
    })
    .join('');
}

function checkWinState() {
  const aliveTeams = new Set(ships.filter((s) => s.hp > 0).map((s) => s.team));
  if (aliveTeams.size <= 1) {
    const winner = aliveTeams.values().next().value;
    statusText.textContent = winner ? `Перемога сторони: ${winner}` : 'Нічия';
    running = false;
    toggleSimButton.textContent = 'Продовжити';
    return true;
  }
  return false;
}

function step(now) {
  const dt = Math.min(0.04, (now - lastTime) / 1000);
  lastTime = now;

  if (running) {
    updateShips(dt);
    updateLasers(dt);
    checkWinState();
  }

  drawScene();
  renderHud();
  requestAnimationFrame(step);
}

toggleSimButton.addEventListener('click', () => {
  running = !running;
  toggleSimButton.textContent = running ? 'Пауза' : 'Продовжити';
  statusText.textContent = running ? 'Симуляція активна…' : 'Симуляцію поставлено на паузу.';
});

resetSimButton.addEventListener('click', () => {
  running = true;
  toggleSimButton.textContent = 'Пауза';
  resetSimulation();
});

resetSimulation();
requestAnimationFrame(step);
