const canvas = document.getElementById('gameCanvas');
const overlay = document.getElementById('overlay');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;
function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight }
addEventListener('resize', resize); resize();

const STATE = {STORY:'STORY', SURVIVAL:'SURVIVAL'};
let state = STATE.SURVIVAL;

const waves = [
  {bpm:70, length:20, events:[{t:2,type:'click'},{t:4,type:'drag'},{t:8,type:'hold',dur:1.8},{t:12,type:'click'}]},
  {bpm:90, length:25, events:[{t:1.5,type:'click'},{t:3,type:'drag'},{t:5,type:'click'},{t:9,type:'hold',dur:2}]}
];
let currentWave = 0;
let waveStart = 0;

let beatInterval = 60/waves[currentWave].bpm;
let nextBeatTime = 0;
const allowedWindow = 0.12; // seconds
let lastBeatHandled = false;

// Audio (WebAudio) for heartbeat independent of RAF
let audioCtx = null;
let audioScheduled = false;
function ensureAudio(){
  if(audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playBeatAt(time){
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 80;
  g.gain.value = 0.0001;
  osc.connect(g);
  g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  const t = Math.max(now, time);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.14, t + 0.001);
  g.gain.linearRampToValueAtTime(0.0001, t + 0.08);
  osc.start(now);
  osc.stop(t + 0.1);
}
function scheduleAudioLoop(){
  if(!audioCtx) return;
  if(audioScheduled) return;
  audioScheduled = true;
  function tick(){
    if(gameOver || state===STATE.STORY){ audioScheduled = false; return; }
    const now = performance.now()/1000;
    const delta = nextBeatTime - now;
    if(delta <= 0.05){
      // schedule immediate beat
      playBeatAt(audioCtx.currentTime + Math.max(0, delta));
      nextBeatTime += beatInterval;
    }
    setTimeout(tick, 10);
  }
  tick();
}

let obstacles = [];
let spawnedIndex = 0;

let gameOver = false;
let deathReason = '';
// Story nodes per wave (array of pages)
const stories = [
  [
    {title:'Prologue', text:'너의 심장은 멈췄다. 저주는 숨을 거두지 않는다. 그러나 이제 손으로 펌프질해야만 산다.'},
    {title:'단서: 기묘한 잔여물', text:'벽에 묻은 점액은 누군가의 흔적처럼 보인다. 닦아내면 더 많은 흔적이 드러난다.'}
  ],
  [
    {title:'심연의 메아리', text:'박동이 빨라질수록 환각은 뚜렷해진다. 하지만 균형을 잃으면 모든 것이 끝난다.'},
    {title:'단서: 깨진 사포', text:'작은 사포 조각이 바닥에 떨어져 있다. 뭔가를 닦아내려 했던 흔적일까.'}
  ]
];
let storyIndex = 0;

function startWave(index){
  currentWave = index||0;
  waveStart = performance.now()/1000;
  beatInterval = 60/waves[currentWave].bpm;
  nextBeatTime = waveStart + beatInterval;
  spawnedIndex = 0;
  obstacles = [];
  gameOver = false;
  deathReason = '';
  overlay.classList.add('hidden');
  ensureAudio();
  scheduleAudioLoop();
  overlay.dataset.mode = '';
  restartBtn.style.display = 'inline-block';
}

function fail(reason){
  gameOver = true;
  deathReason = reason;
  showGameOver();
}

function showGameOver(){
  messageEl.textContent = deathReason;
  overlay.classList.remove('hidden');
  overlay.dataset.mode = 'gameover';
  restartBtn.style.display = 'inline-block';
}

function resetWave(){
  startWave(currentWave);
}

restartBtn.addEventListener('click', ()=>{
  resetWave();
});
addEventListener('keydown', e=>{
  if(e.code==='KeyR') resetWave();
});

overlay.addEventListener('click', (e)=>{
  // overlay click behavior depends on mode
  const mode = overlay.dataset.mode || '';
  if(mode === 'story' && state === STATE.STORY){
    const s = stories[currentWave] || [];
    storyIndex++;
    if(storyIndex >= s.length){
      // proceed to next wave
      state = STATE.SURVIVAL;
      overlay.dataset.mode = '';
      const next = (currentWave + 1) % waves.length;
      startWave(next);
    } else {
      const node = s[storyIndex];
      messageEl.innerHTML = `<strong>${node.title}</strong><p style="margin-top:8px">${node.text}</p><small style="display:block;margin-top:8px;opacity:0.8">클릭하여 계속</small>`;
    }
  }
});

let spacePressed = false;
addEventListener('keydown', e=>{
  if(e.code==='Space') handleSpace(performance.now()/1000);
});

function handleSpace(t){
  if(gameOver) return;
  const delta = t - nextBeatTime;
  if(Math.abs(delta) <= allowedWindow){
    nextBeatTime += beatInterval;
    lastBeatHandled = true;
  } else {
    fail(delta > 0 ? '정지 - 박자를 놓쳤습니다' : '과부하 - 박자를 너무 빨리 누르셨습니다');
  }
}

function spawnOb(type){
  const size = 48 + Math.random()*36;
  const x = Math.random()*(W-200)+100;
  const y = Math.random()*(H-200)+100;
  const ob = {type,x,y,size,alive:true};
  if(type==='drag') ob.dragProgress = 0;
  if(type==='hold') ob.holdStart = 0, ob.holdReq = 1.4 + Math.random()*1.2;
  obstacles.push(ob);
}

function updateObstacles(dt){
  for(const ob of obstacles){
    if(!ob.alive) continue;
    if(ob.type==='drag'){
      ob.size *= 0.999;
    }
  }
  obstacles = obstacles.filter(o=>o.alive);
}

let pointer = {down:false,x:0,y:0,downAt:0};
canvas.addEventListener('pointerdown', e=>{pointer.down=true; pointer.x=e.clientX; pointer.y=e.clientY; pointer.downAt=performance.now()/1000; handlePointerDown(e);});
canvas.addEventListener('pointermove', e=>{pointer.x=e.clientX; pointer.y=e.clientY; handlePointerMove(e);});
canvas.addEventListener('pointerup', e=>{pointer.down=false; handlePointerUp(e);});

function handlePointerDown(e){
  for(const ob of obstacles){
    const dx = e.clientX - ob.x; const dy = e.clientY - ob.y;
    if(Math.hypot(dx,dy) < ob.size){
      if(ob.type==='click') ob.alive=false;
      if(ob.type==='hold') ob.holdStart = performance.now()/1000;
      if(ob.type==='drag') ob.dragging = true;
      break;
    }
  }
}

function handlePointerMove(e){
  for(const ob of obstacles){
    if(ob.type==='drag' && ob.dragging){
      const dist = Math.hypot(e.clientX - ob.x, e.clientY - ob.y);
      ob.dragProgress += Math.max(0, 1 - dist/300) * 0.02;
      if(ob.dragProgress>=1) ob.alive=false;
    }
  }
}

function handlePointerUp(e){
  for(const ob of obstacles) ob.dragging = false;
}

function update(dt, now){
  if(gameOver) return;
  if(state === STATE.STORY) return;
  const t = now/1000;
  const elapsed = t - waveStart;
  const wd = waves[currentWave];
  while(spawnedIndex < wd.events.length && elapsed >= wd.events[spawnedIndex].t){
    spawnOb(wd.events[spawnedIndex].type);
    spawnedIndex++;
  }
  if(t > nextBeatTime + allowedWindow){
    fail('정지 - 박자를 놓쳤습니다');
  }
  // wave end -> STORY phase
  if(elapsed >= wd.length){
    state = STATE.STORY;
    // prepare story pages for this wave
    const s = stories[currentWave] || [];
    storyIndex = 0;
    overlay.dataset.mode = 'story';
    overlay.classList.remove('hidden');
    if(s.length>0){
      const node = s[0];
      messageEl.innerHTML = `<strong>${node.title}</strong><p style="margin-top:8px">${node.text}</p><small style="display:block;margin-top:8px;opacity:0.8">클릭하여 계속</small>`;
    } else {
      messageEl.textContent = '휴식 구간 — 클릭하여 다음으로';
    }
    restartBtn.style.display = 'none';
  }
  for(const ob of obstacles){
    if(ob.type==='hold' && ob.holdStart){
      const held = Math.max(0, t - ob.holdStart);
      if(held >= ob.holdReq) ob.alive=false;
    }
  }
  updateObstacles(dt);
}

function draw(now){
  ctx.clearRect(0,0,W,H);
  const centerX = W/2, centerY = H/2;
  const t = now/1000;
  const phase = Math.min(1, Math.max(0, 1 - Math.abs(t - nextBeatTime)/allowedWindow));
  // UI degradation based on wave progress
  const wd = waves[currentWave];
  const elapsed = Math.max(0, t - waveStart);
  const progress = Math.min(1, wd ? elapsed / wd.length : 0);
  const jitter = progress * 8;
  const radius = 60 + 40*phase;
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(centerX + (Math.random()-0.5)*jitter,centerY + (Math.random()-0.5)*jitter,120 - progress*30,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff4d4f'; ctx.beginPath(); ctx.arc(centerX + (Math.random()-0.5)*jitter,centerY + (Math.random()-0.5)*jitter,radius - progress*8,0,Math.PI*2); ctx.fill();

  // Guide line (fades/jitters)
  ctx.strokeStyle = `rgba(255,255,255,${Math.max(0.2, 1-progress)})`;
  ctx.lineWidth = 2 + (1-phase)*3;
  ctx.beginPath();
  ctx.moveTo(centerX - 200 + (Math.random()-0.5)*jitter, centerY + 140 + (Math.random()-0.5)*jitter);
  ctx.lineTo(centerX + 200 + (Math.random()-0.5)*jitter, centerY + 140 + (Math.random()-0.5)*jitter);
  ctx.stroke();

  for(const ob of obstacles){
    ctx.save();
    ctx.translate(ob.x, ob.y);
    const shakeX = (Math.random()-0.5)*progress*6;
    const shakeY = (Math.random()-0.5)*progress*6;
    ctx.translate(shakeX, shakeY);
    if(ob.type==='click'){
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(0,0,ob.size/2,0,Math.PI*2); ctx.fill();
    } else if(ob.type==='drag'){
      ctx.fillStyle = '#9b59b6';
      ctx.fillRect(-ob.size/2, -ob.size/2, ob.size, ob.size);
      ctx.fillStyle='#000'; ctx.fillRect(-ob.size/2, ob.size/2 + 6 - ob.dragProgress*ob.size, ob.size*ob.dragProgress, 6);
    } else if(ob.type==='hold'){
      ctx.fillStyle = '#3498db'; ctx.beginPath(); ctx.arc(0,0,ob.size/2,0,Math.PI*2); ctx.fill();
      if(ob.holdStart){
        const held = Math.max(0, t - ob.holdStart);
        const p = Math.min(1, held/ob.holdReq);
        ctx.fillStyle='#000'; ctx.fillRect(-ob.size/2, ob.size/2 + 6, ob.size*p, 6);
      }
    }
    ctx.restore();
  }
}

let last = performance.now();
function loop(now){
  const dt = (now - last)/1000; last = now;
  update(dt, now);
  draw(now);
  requestAnimationFrame(loop);
}

startWave(0);
requestAnimationFrame(loop);
