const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const titleEl = document.getElementById('title');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const hudEl = document.getElementById('hud');

let W = 0;
let H = 0;

function resize() {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
  bgGradient = ctx.createLinearGradient(0, 0, W, H);
  bgGradient.addColorStop(0, '#080b12');
  bgGradient.addColorStop(1, '#161a27');
}

window.addEventListener('resize', resize);
resize();

const STATE = { READY: 'READY', PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' };
let state = STATE.READY;

const waves = [
  {
    title: '첫 박동',
    bpm: 72,
    duration: 20,
    events: [
      { t: 1.2, type: 'click' },
      { t: 3.4, type: 'drag' },
      { t: 5.8, type: 'hold', holdGoal: 1.1 },
      { t: 8.6, type: 'pattern', label: '클릭' },
      { t: 12.4, type: 'tempo', bpm: 96, duration: 4, title: '가속' },
      { t: 15.2, type: 'click' }
    ]
  },
  {
    title: '긴장',
    bpm: 96,
    duration: 20,
    events: [
      { t: 1.0, type: 'drag' },
      { t: 2.8, type: 'hold', holdGoal: 1.3 },
      { t: 5.3, type: 'pattern', label: '패턴' },
      { t: 8.4, type: 'click' },
      { t: 11.6, type: 'tempo', bpm: 120, duration: 4, title: '폭주' },
      { t: 14.8, type: 'drag' }
    ]
  },
  {
    title: '최후의 리듬',
    bpm: 118,
    duration: 20,
    events: [
      { t: 1.4, type: 'click' },
      { t: 3.2, type: 'hold', holdGoal: 1.4 },
      { t: 6.2, type: 'pattern', label: '패턴' },
      { t: 9.0, type: 'drag' },
      { t: 12.0, type: 'tempo', bpm: 140, duration: 3.5, title: '폭주' },
      { t: 15.0, type: 'click' }
    ]
  }
];

let waveIndex = 0;
let waveTime = 0;
let eventIndex = 0;
let obstacles = [];
let pointer = { x: W / 2, y: H / 2 };
let player = { x: W / 2, y: H / 2, speed: 260, radius: 16 };

let maxHealth = 3;
let health = maxHealth;
let beatInterval = 60 / waves[0].bpm;
let beatTimer = 0;
let beatActive = false;
let beatStartAt = 0;
let beatWindow = 0.16;
let beatFlash = 0;
let shake = 0;
let activeTempo = null;
let lastTime = 0;
let statusText = '박동 대기';
let rafId = null;
let bgGradient = null;
let checkpointAvailable = false;

function startGame() {
  state = STATE.PLAYING;
  overlay.classList.add('hidden');
  health = maxHealth;
  waveIndex = 0;
  waveTime = 0;
  eventIndex = 0;
  obstacles = [];
  beatInterval = 60 / waves[0].bpm;
  beatTimer = 0.6;
  beatActive = false;
  beatStartAt = 0;
  beatFlash = 0;
  shake = 0;
  activeTempo = null;
  player.x = W / 2;
  player.y = H / 2;
  pointer.x = W / 2;
  pointer.y = H / 2;
  statusText = '박동 시작';
  updateHud();
  lastTime = performance.now();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
  checkpointAvailable = true;
}

function updateHud() {
  const wave = waves[waveIndex];
  const saved = localStorage.getItem('heartbeat-save') ? '저장됨' : '없음';
  const checkpoint = checkpointAvailable ? '가능' : '불가';
  hudEl.innerHTML = `
    <div>웨이브: ${waveIndex + 1} / ${waves.length}</div>
    <div>상태: ${state === STATE.PLAYING ? wave.title : '대기'}</div>
    <div>체력: ${'♥'.repeat(health)}${'♡'.repeat(maxHealth - health)}</div>
    <div>박동: ${statusText}</div>
    <div>저장: ${saved}</div>
    <div>체크포인트: ${checkpoint}</div>
  `;
}

const SAVE_KEY = 'heartbeat-save';

function getSaveObject() {
  return {
    state,
    waveIndex,
    waveTime,
    eventIndex,
    obstacles,
    pointer,
    player,
    health,
    beatInterval,
    beatTimer,
    beatActive,
    beatStartAt,
    activeTempo,
    statusText
  };
}

function showTemporaryMessage(msg) {
  const prev = messageEl.innerHTML;
  messageEl.innerHTML = msg;
  setTimeout(() => { messageEl.innerHTML = prev; }, 1200);
}

function saveGame() {
  if (!checkpointAvailable) { showTemporaryMessage('체크포인트가 아닙니다'); return; }
  try {
    const data = getSaveObject();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    checkpointAvailable = false;
    updateHud();
    showTemporaryMessage('저장 완료');
  } catch (e) {
    showTemporaryMessage('저장 실패');
  }
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) { showTemporaryMessage('저장 없음'); return; }
  try {
    const obj = JSON.parse(raw);
    state = obj.state || STATE.PLAYING;
    waveIndex = obj.waveIndex || 0;
    waveTime = obj.waveTime || 0;
    eventIndex = obj.eventIndex || 0;
    obstacles = obj.obstacles || [];
    pointer = obj.pointer || pointer;
    player = obj.player || player;
    health = typeof obj.health === 'number' ? obj.health : maxHealth;
    beatInterval = obj.beatInterval || beatInterval;
    beatTimer = (typeof obj.beatTimer === 'number') ? obj.beatTimer : 0.6;
    beatActive = !!obj.beatActive;
    beatStartAt = (typeof obj.beatStartAt === 'number') ? obj.beatStartAt : waveTime;
    activeTempo = obj.activeTempo || null;
    statusText = obj.statusText || statusText;
    updateHud();
    if (state === STATE.PLAYING) {
      lastTime = performance.now();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    }
    showTemporaryMessage('불러오기 완료');
  } catch (e) {
    showTemporaryMessage('불러오기 실패');
  }
}

function deleteSave() { localStorage.removeItem(SAVE_KEY); updateHud(); showTemporaryMessage('저장 삭제'); }

function showOverlay(title, message, showRestart = false) {
  titleEl.textContent = title;
  messageEl.innerHTML = message;
  overlay.classList.remove('hidden');
  restartBtn.style.display = showRestart ? 'inline-block' : 'none';
  startBtn.style.display = showRestart ? 'none' : 'inline-block';
}

function endGame() {
  state = STATE.GAMEOVER;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  showOverlay('심장이 멈췄다', '박동을 놓치고 끝이 찾아왔습니다.<br>다시 도전해 보세요.', true);
}

function nextWave() {
  if (waveIndex + 1 >= waves.length) {
    state = STATE.GAMEOVER;
    showOverlay('승리', '모든 박동을 견뎌냈습니다.<br>심장은 아직 살아 있습니다.', true);
    return;
  }

  waveIndex += 1;
  waveTime = 0;
  eventIndex = 0;
  obstacles = [];
  beatInterval = 60 / waves[waveIndex].bpm;
  beatTimer = 0.6;
  beatActive = false;
  beatStartAt = 0;
  activeTempo = null;
  statusText = `${waves[waveIndex].title} 진입`;
  updateHud();
  checkpointAvailable = true;
}

function takeDamage(reason) {
  if (state !== STATE.PLAYING) return;
  health -= 1;
  shake = 0.4;
  statusText = reason;
  updateHud();
  if (health <= 0) {
    endGame();
  }
}

function spawnObstacle(event) {
  const size = 46 + Math.random() * 24;
  const ob = {
    type: event.type,
    x: Math.random() * (W - 140) + 70,
    y: Math.random() * (H - 140) + 70,
    size,
    alive: true,
    holdGoal: event.holdGoal || 1.2,
    progress: 0,
    dragging: false,
    holding: false,
    label: event.label || '',
    age: 0,
    expireTime: 2.8 + Math.random() * 0.7
  };
  obstacles.push(ob);
}

function activateTempo(event) {
  activeTempo = {
    endAt: waveTime + (event.duration || 4),
    bpm: event.bpm,
    title: event.title || '가속'
  };
  beatInterval = 60 / event.bpm;
  beatTimer = Math.max(0.2, beatInterval * 0.45);
  statusText = `${activeTempo.title} (${event.bpm} BPM)`;
  updateHud();
}

function updateWave(dt) {
  if (state !== STATE.PLAYING) return;
  waveTime += dt;

  while (eventIndex < waves[waveIndex].events.length && waves[waveIndex].events[eventIndex].t <= waveTime) {
    const event = waves[waveIndex].events[eventIndex];
    if (event.type === 'tempo') {
      activateTempo(event);
    } else {
      spawnObstacle(event);
    }
    eventIndex += 1;
  }

  if (activeTempo && waveTime > activeTempo.endAt) {
    activeTempo = null;
    beatInterval = 60 / waves[waveIndex].bpm;
    beatTimer = Math.max(0.2, beatInterval * 0.45);
    statusText = waves[waveIndex].title;
    updateHud();
  }

  if (waveTime >= waves[waveIndex].duration) {
    nextWave();
  }
}

function updateHeartbeat(dt) {
  if (state !== STATE.PLAYING) return;

  if (beatActive) {
    const elapsed = waveTime - beatStartAt;
    beatFlash = Math.max(0, 1 - elapsed / beatWindow);
    if (elapsed > beatWindow) {
      beatActive = false;
      takeDamage('박동 실패');
    }
    return;
  }

  beatTimer -= dt;
  if (beatTimer <= 0) {
    beatActive = true;
    beatStartAt = waveTime;
    beatTimer = beatInterval;
    beatFlash = 1;
  }
}

function resolveBeat() {
  if (!beatActive || state !== STATE.PLAYING) return;
  const elapsed = waveTime - beatStartAt;
  const error = Math.abs(elapsed);

  beatActive = false;
  beatFlash = 0;
  beatTimer = Math.max(0.2, beatInterval * 0.8);

  if (error <= beatWindow * 0.25) {
    statusText = 'Perfect';
    shake = 0.1;
  } else if (error <= beatWindow * 0.7) {
    statusText = 'Good';
    shake = 0.06;
  } else {
    takeDamage('박동 미스');
    return;
  }

  updateHud();
}

function updateObstacles(dt) {
  for (const ob of obstacles) {
    if (!ob.alive) continue;

    ob.age += dt;
    if (ob.age >= ob.expireTime) {
      ob.alive = false;
      takeDamage('패턴 놓침');
      continue;
    }

    if (ob.type === 'hold' && ob.holding) {
      ob.progress += dt;
      if (ob.progress >= ob.holdGoal) {
        ob.alive = false;
      }
    }

    if (ob.type === 'drag' && ob.dragging) {
      const dist = Math.hypot(pointer.x - ob.x, pointer.y - ob.y);
      ob.progress += dt * (dist < ob.size * 1.1 ? 1.2 : 0.4);
      if (ob.progress >= 1) {
        ob.alive = false;
      }
    }
  }

  obstacles = obstacles.filter(ob => ob.alive);
}

function movePlayer(dt) {
  if (state !== STATE.PLAYING) return;
  const dx = pointer.x - player.x;
  const dy = pointer.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;
  const vx = dx / dist;
  const vy = dy / dist;
  player.x += vx * player.speed * dt;
  player.y += vy * player.speed * dt;
  player.x = Math.max(player.radius, Math.min(W - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(H - player.radius, player.y));
}

function drawBackground() {
  ctx.fillStyle = bgGradient || '#080b12';
  ctx.fillRect(0, 0, W, H);

  const waveGlow = 20 + (beatActive ? 20 : 0) + shake * 24;
  ctx.save();
  ctx.translate((Math.random() - 0.5) * shake * 16, (Math.random() - 0.5) * shake * 16);
  ctx.fillStyle = 'rgba(255, 77, 79, 0.12)';
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 140 + waveGlow, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeartbeat() {
  const pulse = beatActive ? 1 : 0.4 + Math.max(0, beatFlash);
  const radius = 70 + pulse * 28;
  ctx.save();
  ctx.translate((Math.random() - 0.5) * shake * 10, (Math.random() - 0.5) * shake * 10);
  ctx.strokeStyle = beatActive ? '#ff6b6b' : '#ffe66d';
  ctx.lineWidth = 3 + pulse * 2;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = beatActive ? '#ff6b6b' : '#ff8e8f';
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 34 + pulse * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawObstacles() {
  for (const ob of obstacles) {
    ctx.save();
    ctx.translate(ob.x, ob.y);
    ctx.translate((Math.random() - 0.5) * shake * 6, (Math.random() - 0.5) * shake * 6);

    if (ob.type === 'click' || ob.type === 'pattern') {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, 0, ob.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ob.label || 'CLICK', 0, 4);
    } else if (ob.type === 'drag') {
      ctx.fillStyle = '#9b5de5';
      ctx.fillRect(-ob.size / 2, -ob.size / 2, ob.size, ob.size);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-ob.size / 2 + 6, ob.size / 2 + 6, ob.size * Math.min(1, ob.progress) - 12, 6);
    } else if (ob.type === 'hold') {
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath();
      ctx.arc(0, 0, ob.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#062b3f';
      ctx.fillRect(-ob.size / 2 + 6, ob.size / 2 + 6, ob.size * Math.min(1, ob.progress) - 12, 6);
    }

    ctx.restore();
  }
}

function drawPlayer() {
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(pointer.x, pointer.y);
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  drawBackground();
  drawHeartbeat();
  drawObstacles();
  drawPlayer();
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0.016);
  lastTime = now;

  if (state === STATE.PLAYING) {
    movePlayer(dt);
    updateWave(dt);
    updateHeartbeat(dt);
    updateObstacles(dt);
  }

  draw();
  shake = Math.max(0, shake - dt * 0.4);
  if (state === STATE.PLAYING) {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
  }
}

function handlePointerDown(e) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;

  if (state !== STATE.PLAYING) return;

  for (const ob of obstacles) {
    if (!ob.alive) continue;
    const dx = pointer.x - ob.x;
    const dy = pointer.y - ob.y;
    if (Math.hypot(dx, dy) <= ob.size / 2) {
      if (ob.type === 'click' || ob.type === 'pattern') {
        ob.alive = false;
      } else if (ob.type === 'hold') {
        ob.holding = true;
      } else if (ob.type === 'drag') {
        ob.dragging = true;
      }
    }
  }
}

function handlePointerMove(e) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
}

function handlePointerUp() {
  for (const ob of obstacles) {
    ob.dragging = false;
    ob.holding = false;
  }
}

function handleKeydown(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    if (state === STATE.PLAYING) {
      resolveBeat();
    }
  }
  if (e.code === 'KeyS') {
    e.preventDefault(); saveGame();
  }
  if (e.code === 'KeyL') {
    e.preventDefault(); loadGame();
  }
  if (e.code === 'KeyD') {
    e.preventDefault(); deleteSave();
  }
  if (e.code === 'Enter' && state !== STATE.PLAYING) {
    startGame();
  }
  if (e.code === 'KeyR' && state === STATE.GAMEOVER) {
    startGame();
  }
}

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointerleave', handlePointerUp);
window.addEventListener('keydown', handleKeydown);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

showOverlay('Heartbeat', '마우스로 이동하고<br>박동에 맞춰 Space를 눌러 생존하세요.', false);
updateHud();
// 루프는 게임 시작 시에만 시작합니다.
