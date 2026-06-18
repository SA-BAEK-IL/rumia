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
  {bpm:70, length:24, events:[
    {t:2,type:'click'},
    {t:4,type:'drag'},
    {t:6,type:'pattern',pattern:'left-click',text:'왼쪽 클릭으로 뇌를 헷갈리게 하는 패턴이 등장합니다.'},
    {t:8,type:'hold',dur:1.8},
    {t:12,type:'pattern',pattern:'right-click',text:'오른쪽 클릭으로 시선을 흔들며 대응을 요구합니다.'},
    {t:16,type:'tempo',bpm:55,duration:6,title:'심장이 느려짐'},
    {t:20,type:'tempo',bpm:95,duration:4,title:'심장이 빨라짐'}
  ]},
  {bpm:90, length:28, events:[
    {t:1.5,type:'click'},
    {t:3,type:'drag'},
    {t:5,type:'pattern',pattern:'middle-click',text:'휠 클릭 패턴이 나타나 시야를 교란합니다.'},
    {t:9,type:'hold',dur:2},
    {t:14,type:'tempo',bpm:70,duration:5,title:'심장 박동이 느려짐'},
    {t:20,type:'pattern',pattern:'left-click',text:'이제 방향 이동과 클릭 패턴을 동시에 유지해야 합니다.'}
  ]}
];
let currentWave = 0;
let waveStart = 0;
const clueLog = [];
const logBtn = document.getElementById('logBtn');
const logPanel = document.getElementById('logPanel');
const logSearchInput = document.getElementById('logSearch');
const logContent = document.getElementById('logContent');
const closeLogBtn = document.getElementById('closeLogBtn');
const choicePanel = document.getElementById('choicePanel');

let beatInterval = 60/waves[currentWave].bpm;
let nextBeatTime = 0;
const allowedWindow = 0.12; // seconds
let lastBeatHandled = false;
let spaceHeld = false;
let lastSpaceHeldTime = 0;
let movementStopped = false;
let tempoRestore = null;
const player = {x:0,y:0,speed:220,radius:18};

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
    {type:'choice', title:'선택지', text:'어둠 속에서 두 갈래 길이 모습을 드러낸다. 어느 쪽으로 나아갈 것인가?', options:[
      {label:'왼쪽 복도 - 먼지와 이물질', nextIndex:2, clue:{title:'단서: 오래된 혈흔', text:'왼쪽 길에는 오래된 혈흔과 벽에 새겨진 문양이 있다.'}},
      {label:'오른쪽 방 - 기계음과 진동', nextIndex:3, clue:{title:'단서: 기계장치의 잔해', text:'오른쪽 방에는 깨진 기어와 건조한 피 한 방울이 있다.'}}
    ]},
    {title:'단서: 기묘한 잔여물', text:'벽에 묻은 점액은 누군가의 흔적처럼 보인다. 닦아내면 더 많은 흔적이 드러난다.', type:'clue'},
    {title:'경고의 메모', text:'메모가 손에 들린다. "이 심장은 여전히 살아있다. 멈추면 끝이다."'},
    {title:'어둠의 균열', text:'어둠 속에서 잔상이 사라진다. 다시 전투의 순간이 다가온다.'}
  ],
  [
    {title:'심연의 메아리', text:'박동이 빨라질수록 환각은 뚜렷해진다. 하지만 균형을 잃으면 모든 것이 끝난다.'},
    {type:'choice', title:'균열의 음성', text:'귀 안에서 두 목소리가 들린다. 어느 쪽에 귀를 기울일 것인가?', options:[
      {label:'침묵의 목소리', nextIndex:3, clue:{title:'단서: 숨겨진 칼날', text:'말 없는 목소리는 날카로운 칼날과 함께 했다.'}},
      {label:'절규의 목소리', nextIndex:4, clue:{title:'단서: 깨진 거울', text:'절규는 거울 조각 속에서 울려 퍼졌다.'}}
    ]},
    {title:'단서: 깨진 사포', text:'작은 사포 조각이 바닥에 떨어져 있다. 뭔가를 닦아내려 했던 흔적일까.', type:'clue'},
    {title:'피로 물든 벽', text:'벽에는 끝없는 속삭임과 함께 기묘한 문양이 반사된다.'},
    {title:'희미한 빛', text:'희미한 빛이 사라진다. 심장은 멈추지 않고 계속 뛰어야 한다.'}
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
  player.x = W/2;
  player.y = H/2;
  pointer.x = W/2;
  pointer.y = H/2;
  movementStopped = false;
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

function addClueEntry(entry){
  const key = `${entry.wave}|${entry.title}`;
  if(clueLog.some(item=>item.key===key)) return;
  clueLog.push({...entry, key, timestamp: new Date()});
}

function openLog(){
  logPanel.classList.remove('hidden');
  renderLog();
}

function closeLog(){
  logPanel.classList.add('hidden');
}

function formatTimestamp(ts){
  return ts.toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'});
}

function renderLog(){
  const filter = logSearchInput.value.trim().toLowerCase();
  const visible = clueLog.filter(item => {
    const combined = `${item.title} ${item.text}`.toLowerCase();
    return !filter || combined.includes(filter);
  });
  if(visible.length === 0){
    logContent.innerHTML = '<div class="entry"><div class="entry-title">검색 결과 없음</div><div>다른 검색어를 시도하거나, 단서를 더 수집하세요.</div></div>';
    return;
  }
  logContent.innerHTML = visible.map(item => `
    <div class="entry">
      <div class="entry-title">[WAVE ${item.wave + 1}] ${item.title}</div>
      <div class="entry-meta">${formatTimestamp(item.timestamp)}</div>
      <div>${item.text}</div>
    </div>
  `).join('');
}

function resetWave(){
  startWave(currentWave);
}

restartBtn.addEventListener('click', ()=>{
  resetWave();
});
addEventListener('keydown', e=>{
  if(e.code==='KeyR') resetWave();
  if(e.code==='KeyC'){
    movementStopped = !movementStopped;
    if(movementStopped){
      messageEl.textContent = '움직임 정지 - C 키로 재개';
      overlay.classList.remove('hidden');
      overlay.dataset.mode = 'paused';
      restartBtn.style.display = 'none';
    } else {
      overlay.classList.add('hidden');
      overlay.dataset.mode = '';
    }
  }
});

overlay.addEventListener('click', (e)=>{
  if(e.target === restartBtn) return;
  if(e.target === closeLogBtn) return;
  if(e.target === logBtn) return;
  if(e.target.classList.contains('choice-button')) return;
  // overlay click behavior depends on mode
  const mode = overlay.dataset.mode || '';
  if(mode === 'story' && state === STATE.STORY){
    const s = stories[currentWave] || [];
    const node = s[storyIndex];
    if(node.type === 'choice') return;
    storyIndex++;
    if(storyIndex >= s.length){
      // proceed to next wave
      state = STATE.SURVIVAL;
      overlay.dataset.mode = '';
      const next = (currentWave + 1) % waves.length;
      startWave(next);
    } else {
      renderStoryNode(s[storyIndex]);
    }
  }
});

addEventListener('keydown', e=>{
  if(e.code==='Space'){
    spaceHeld = true;
    lastSpaceHeldTime = performance.now()/1000;
    handleSpace(lastSpaceHeldTime);
  }
  if(e.code==='KeyL') openLog();
});
addEventListener('keyup', e=>{
  if(e.code==='Space'){
    spaceHeld = false;
    lastSpaceHeldTime = performance.now()/1000;
  }
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

function spawnOb(event){
  const size = 48 + Math.random()*36;
  const x = event.type === 'pattern' ? W/2 : Math.random()*(W-200)+100;
  const y = event.type === 'pattern' ? 100 + (obstacles.filter(o=>o.type==='pattern').length * 60) : Math.random()*(H-200)+100;
  const ob = {type:event.type || event, x,y,size,alive:true,age:0};
  if(event.type === 'pattern'){
    ob.pattern = event.pattern;
    ob.text = event.text;
    ob.duration = event.duration || 4;
  }
  if(event.type === 'tempo'){
    ob.title = event.title || `BPM ${event.bpm}`;
    ob.duration = event.duration || 5;
    ob.bpm = event.bpm;
  }
  if(ob.type==='drag') ob.dragProgress = 0;
  if(ob.type==='hold') ob.holdStart = 0, ob.holdReq = 1.4 + Math.random()*1.2;
  obstacles.push(ob);
}

function applyTempoEvent(event, t){
  if(!event.bpm) return;
  tempoRestore = {interval: beatInterval, restoreAt: t + (event.duration || 5)};
  beatInterval = 60/event.bpm;
  nextBeatTime = t + beatInterval;
}

function updateObstacles(dt){
  const t = performance.now()/1000;
  for(const ob of obstacles){
    if(!ob.alive) continue;
    if(ob.type==='drag'){
      ob.size *= 0.999;
    }
    if(ob.type==='pattern' || ob.type==='tempo'){
      ob.age += dt;
      if(ob.age >= ob.duration) ob.alive = false;
    }
  }
  if(tempoRestore && t > tempoRestore.restoreAt){
    beatInterval = tempoRestore.interval;
    tempoRestore = null;
    nextBeatTime = t + beatInterval;
  }
  obstacles = obstacles.filter(o=>o.alive);
}

let pointer = {down:false,x:W/2,y:H/2,downAt:0};
canvas.addEventListener('pointerdown', e=>{pointer.down=true; pointer.x=e.clientX; pointer.y=e.clientY; pointer.downAt=performance.now()/1000; handlePointerDown(e);});
canvas.addEventListener('pointermove', e=>{pointer.x=e.clientX; pointer.y=e.clientY; handlePointerMove(e);});
canvas.addEventListener('pointerup', e=>{pointer.down=false; handlePointerUp(e);});
logBtn.addEventListener('click', openLog);
closeLogBtn.addEventListener('click', closeLog);
logSearchInput.addEventListener('input', renderLog);

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
  if(!spaceHeld && t - lastSpaceHeldTime > 0.35){
    fail('심장 멈춤 - Spacebar를 계속 누르고 있어야 합니다');
    return;
  }
  const elapsed = t - waveStart;
  const wd = waves[currentWave];
  while(spawnedIndex < wd.events.length && elapsed >= wd.events[spawnedIndex].t){
    const event = wd.events[spawnedIndex];
    if(event.type === 'tempo') applyTempoEvent(event, t);
    spawnOb(event);
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
    restartBtn.style.display = 'none';
    if(s.length>0){
      renderStoryNode(s[0]);
    } else {
      messageEl.textContent = '휴식 구간 — 클릭하여 다음으로';
    }
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
    } else if(ob.type==='pattern'){
      ctx.fillStyle = '#e67e22';
      ctx.beginPath(); ctx.arc(0,0,ob.size/2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ob.pattern, 0, 5);
    } else if(ob.type==='tempo'){
      ctx.fillStyle = '#8e44ad';
      ctx.beginPath(); ctx.arc(0,0,ob.size/2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ob.title, 0, 5);
    }
    ctx.restore();
  }
  // draw player and target direction
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(pointer.x, pointer.y);
  ctx.stroke();
  ctx.fillStyle = movementStopped ? '#95a5a6' : '#2ecc71';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 6,0,Math.PI*2); ctx.fill();
  // draw player and target direction
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(pointer.x, pointer.y);
  ctx.stroke();
  ctx.fillStyle = movementStopped ? '#95a5a6' : '#2ecc71';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 6,0,Math.PI*2); ctx.fill();
}

function renderStoryNode(node){
  choicePanel.innerHTML = '';
  if(node.type === 'choice'){
    messageEl.innerHTML = `<strong>${node.title}</strong><p style="margin-top:8px">${node.text}</p><small style="display:block;margin-top:8px;opacity:0.8">선택지를 골라 진행하세요</small>`;
    node.options.forEach((option, index)=>{
      const btn = document.createElement('button');
      btn.textContent = option.label;
      btn.className = 'choice-button';
      btn.addEventListener('click', ()=>handleChoice(option));
      choicePanel.appendChild(btn);
    });
  } else {
    if(node.type === 'clue'){
      addClueEntry({wave: currentWave, title: node.title, text: node.text});
    }
    messageEl.innerHTML = `<strong>${node.title}</strong><p style="margin-top:8px">${node.text}</p><small style="display:block;margin-top:8px;opacity:0.8">클릭하여 계속</small>`;
  }
}

function handleChoice(option){
  if(option.clue){
    addClueEntry({wave: currentWave, title: option.clue.title || option.label, text: option.clue.text || ''});
  }
  if(typeof option.nextIndex === 'number'){
    storyIndex = option.nextIndex;
    const s = stories[currentWave] || [];
    if(storyIndex >= s.length){
      state = STATE.SURVIVAL;
      overlay.dataset.mode = '';
      const next = (currentWave + 1) % waves.length;
      startWave(next);
      return;
    }
    renderStoryNode(s[storyIndex]);
  }
}

function movePlayer(dt){
  if(movementStopped) return;
  const dx = pointer.x - player.x;
  const dy = pointer.y - player.y;
  const dist = Math.hypot(dx,dy);
  if(dist < 4) return;
  const vx = dx/dist;
  const vy = dy/dist;
  player.x += vx * player.speed * dt;
  player.y += vy * player.speed * dt;
  player.x = Math.max(player.radius, Math.min(W-player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(H-player.radius, player.y));
}

let last = performance.now();
function loop(now){
  const dt = (now - last)/1000; last = now;
  movePlayer(dt);
  update(dt, now);
  draw(now);
  requestAnimationFrame(loop);
}

startWave(0);
requestAnimationFrame(loop);
