/* EduNova Studio — accueil vivant et minuteur de concentration */
(() => {
  'use strict';
  if (window.__edunovaStudioLoaded) return;
  window.__edunovaStudioLoaded = true;

  const home = document.getElementById('home');
  const hero = home && home.querySelector('.home-hero');
  if (!home || !hero) return;

  const KEY = 'edunova_focus_studio_v1';
  const today = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  };
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (value && value.date === today() && Number.isInteger(value.sessions) && value.sessions >= 0 && value.sessions < 100) return value;
    } catch (_) {}
    return { date: today(), sessions: 0, minutes: 0, duration: 25, remaining: 25 * 60, endAt: 0, running: false };
  };
  let state = read();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const style = document.createElement('style');
  style.textContent = `
    .eds-card{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(250px,.9fr);gap:18px;margin:0 0 19px;padding:21px;background:linear-gradient(125deg,#101d42,#253f91 68%,#3155b8);border:1px solid #304c9b;border-radius:21px;color:#fff;box-shadow:0 12px 28px #172c681c}
    .eds-card h2{margin:5px 0 7px;font-size:1.25rem;letter-spacing:-.025em;color:#fff}
    .eds-card p{margin:0;color:#d9e3ff;font-size:.86rem;line-height:1.5}
    .eds-kicker{font-size:.68rem;letter-spacing:.13em;font-weight:900;color:#b8c9ff}
    .eds-metrics{display:flex;gap:9px;flex-wrap:wrap;margin-top:17px}
    .eds-metric{padding:9px 12px;background:#ffffff12;border:1px solid #ffffff26;border-radius:12px;font-size:.78rem;color:#e6edff}
    .eds-metric b{color:#fff;font-size:1rem;margin-right:4px}
    .eds-timer{padding:16px;background:#fff;color:#172033;border-radius:16px;display:flex;flex-direction:column;justify-content:center;min-width:0}
    .eds-timer-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
    .eds-timer-head strong{font-size:.88rem}
    .eds-live{font-size:.68rem;font-weight:800;color:#3155b8;background:#eef2ff;padding:5px 8px;border-radius:99px}
    .eds-clock{font-size:clamp(2.2rem,7vw,3rem);font-weight:900;letter-spacing:-.06em;text-align:center;line-height:1.2;margin:12px 0 8px;font-variant-numeric:tabular-nums;color:#1c347c}
    .eds-track{height:7px;background:#e8edf7;border-radius:99px;overflow:hidden}
    .eds-track span{display:block;height:100%;width:0;background:linear-gradient(90deg,#5577e8,#3aa88c);transition:width .3s}
    .eds-durations{display:flex;gap:6px;margin:12px 0 9px}
    .eds-durations button{flex:1;padding:7px 4px;background:#f1f4fa;color:#42516f;border:1px solid #e1e7f1;border-radius:9px;font-size:.75rem}
    .eds-durations button[aria-pressed="true"]{background:#e9efff;color:#2444a5;border-color:#9eaff0}
    .eds-controls{display:flex;gap:7px}
    .eds-controls button{flex:1;padding:10px;border-radius:10px;font-size:.8rem}
    .eds-start{background:#3155c8;color:#fff}
    .eds-reset{background:#f1f4fa;color:#344054}
    .eds-foot{font-size:.72rem!important;color:#64748b!important;margin-top:9px!important}
    @media(max-width:700px){.eds-card{grid-template-columns:1fr;padding:16px;gap:14px}.eds-timer{padding:14px}.eds-clock{margin:8px 0}}
    @media(prefers-reduced-motion:reduce){.eds-track span{transition:none}}
  `;
  document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'eds-card';
  card.setAttribute('aria-label','Espace de concentration');
  card.innerHTML = `
    <div class="eds-intro">
      <span class="eds-kicker">🚀 TON ESPACE POUR RÉUSSIR</span>
      <h2 id="eds-title">Un petit pas aujourd’hui, une grande réussite demain.</h2>
      <p id="eds-copy">Choisis une tâche, lance le minuteur et concentre-toi sur une seule chose à la fois. Tu avances à ton rythme.</p>
      <div class="eds-metrics">
        <div class="eds-metric"><b id="eds-sessions">0</b> séance(s) aujourd’hui</div>
        <div class="eds-metric"><b id="eds-minutes">0</b> minute(s) concentré</div>
        <div class="eds-metric"><b id="eds-goal">0/2</b> objectif du jour</div>
      </div>
    </div>
    <div class="eds-timer">
      <div class="eds-timer-head"><strong>⏱️ Mode concentration</strong><span class="eds-live" id="eds-status">PRÊT À DÉMARRER</span></div>
      <div class="eds-clock" id="eds-clock" role="timer" aria-live="off">25:00</div>
      <div class="eds-track" role="progressbar" aria-label="Progression de la séance" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="eds-progress"><span id="eds-fill"></span></div>
      <div class="eds-durations" aria-label="Durée de la séance">
        <button type="button" data-eds-duration="15" aria-pressed="false">15 min</button>
        <button type="button" data-eds-duration="25" aria-pressed="true">25 min</button>
        <button type="button" data-eds-duration="45" aria-pressed="false">45 min</button>
      </div>
      <div class="eds-controls"><button type="button" class="eds-start" id="eds-toggle">▶ Démarrer</button><button type="button" class="eds-reset" id="eds-reset">↺ Réinitialiser</button></div>
      <p class="eds-foot" id="eds-hint">Pose ton téléphone, ferme les distractions et commence.</p>
    </div>
  `;
  const mission = home.querySelector('.edm-card');
  if (mission) mission.insertAdjacentElement('afterend', card);
  else hero.insertAdjacentElement('afterend', card);

  const $ = id => document.getElementById(id);
  const format = seconds => String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  const updateGreeting = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour ! Prêt à apprendre ? ☀️' : hour < 18 ? 'Bon après-midi ! On progresse ? ✨' : 'Bonsoir ! Une petite séance ? 🌙';
    $('eds-title').textContent = greeting;
    $('eds-copy').textContent = 'Bienvenue sur EduNova. Choisis une tâche, lance le minuteur et concentre-toi sur une seule chose à la fois.';
  };
  const render = () => {
    const total = state.duration * 60;
    const remaining = Math.max(0, state.remaining);
    $('eds-clock').textContent = format(remaining);
    $('eds-sessions').textContent = state.sessions;
    $('eds-minutes').textContent = state.minutes;
    $('eds-goal').textContent = Math.min(state.sessions,2)+'/2';
    $('eds-fill').style.width = Math.min(100,((total-remaining)/total)*100)+'%';
    $('eds-progress').setAttribute('aria-valuenow',String(Math.round((total-remaining)/total*100)));
    $('eds-status').textContent = state.running ? 'EN COURS' : remaining === 0 ? 'TERMINÉ 🎉' : state.remaining !== total ? 'EN PAUSE' : 'PRÊT À DÉMARRER';
    $('eds-toggle').textContent = state.running ? 'Ⅱ Mettre en pause' : remaining === 0 ? '✓ Séance terminée' : state.remaining !== total ? '▶ Reprendre' : '▶ Démarrer';
    $('eds-toggle').disabled = remaining === 0;
    document.querySelectorAll('[data-eds-duration]').forEach(button => {
      button.disabled = state.running || state.remaining !== total;
      button.setAttribute('aria-pressed',String(Number(button.dataset.edsDuration)===state.duration));
    });
  };
  let interval = null;
  const stopTick = () => { if(interval){clearInterval(interval);interval=null;} };
  const complete = () => {
    stopTick();
    state.running = false;
    state.remaining = 0;
    state.sessions += 1;
    state.minutes += state.duration;
    save();
    if(typeof window.awardXP === 'function') window.awardXP(15);
    $('eds-hint').textContent = '🏆 Bravo ! Séance terminée : +15 XP. Fais une petite pause avant de repartir.';
    render();
  };
  const tick = () => {
    if(!state.running) return;
    state.remaining = Math.max(0,Math.ceil((state.endAt-Date.now())/1000));
    if(state.remaining===0){complete();return;}
    save();render();
  };
  const start = () => {
    if(state.remaining<=0) return;
    state.running=true;
    state.endAt=Date.now()+state.remaining*1000;
    $('eds-hint').textContent='Tu es lancé. Une seule tâche à la fois : tu peux le faire !';
    save();render();stopTick();interval=setInterval(tick,1000);
  };
  $('eds-toggle').addEventListener('click',()=>{
    if(state.running){
      state.remaining=Math.max(0,Math.ceil((state.endAt-Date.now())/1000));
      state.running=false;state.endAt=0;stopTick();save();render();
      $('eds-hint').textContent='Séance en pause. Reprends quand tu es prêt.';
    } else start();
  });
  $('eds-reset').addEventListener('click',()=>{
    stopTick();state.running=false;state.endAt=0;state.remaining=state.duration*60;save();render();
    $('eds-hint').textContent='Minuteur réinitialisé. À toi de jouer !';
  });
  document.querySelectorAll('[data-eds-duration]').forEach(button=>button.addEventListener('click',()=>{
    if(state.running||state.remaining!==state.duration*60)return;
    state.duration=Number(button.dataset.edsDuration);state.remaining=state.duration*60;save();render();
  }));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.running)tick();});
  updateGreeting();
  if(state.running){tick();if(state.running)interval=setInterval(tick,1000);}
  render();
  save();
})();
