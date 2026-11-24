/* EduNova — tableau de bord personnel et plan d'action */
(() => {
  'use strict';
  if (window.__edunovaDashboardLoaded) return;
  window.__edunovaDashboardLoaded = true;

  const home = document.getElementById('home');
  const hero = home && home.querySelector('.home-hero');
  if (!home || !hero) return;

  const KEY = 'edunova_student_dashboard_v1';
  const read = () => {
    try {
      const x = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        goal: typeof x.goal === 'string' ? x.goal.slice(0,100) : '',
        focus: typeof x.focus === 'string' ? x.focus.slice(0,60) : 'Mathématiques'
      };
    } catch (_) { return { goal:'', focus:'Mathématiques' }; }
  };
  let prefs = read();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (_) {} };
  const style = document.createElement('style');
  style.textContent = `
    .edb-wrap{margin:0 0 20px}
    .edb-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin:0 0 12px}
    .edb-kicker{font-size:.68rem;letter-spacing:.13em;font-weight:900;color:#687dbd}
    .edb-head h2{font-size:1.25rem;margin:4px 0;color:var(--text,#18243b)}
    .edb-head p{font-size:.82rem;margin:0;color:var(--muted,#68758b)}
    .edb-date{font-size:.72rem;color:var(--muted,#68758b);white-space:nowrap}
    .edb-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}
    .edb-stat{padding:13px 14px;background:var(--card,#fff);border:1px solid var(--line,#e5eaf2);border-radius:15px;min-width:0}
    .edb-stat span{display:block;font-size:.72rem;color:var(--muted,#68758b)}
    .edb-stat strong{display:block;font-size:1.35rem;letter-spacing:-.04em;color:var(--text,#18243b);margin-top:4px;overflow-wrap:anywhere}
    .edb-main{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(240px,.85fr);gap:12px}
    .edb-plan,.edb-focus{padding:17px;background:var(--card,#fff);border:1px solid var(--line,#e5eaf2);border-radius:17px;min-width:0}
    .edb-plan h3,.edb-focus h3{font-size:1rem;margin:0 0 8px;color:var(--text,#18243b)}
    .edb-plan p,.edb-focus p{font-size:.82rem;line-height:1.5;color:var(--muted,#68758b);margin:0 0 12px}
    .edb-recommend{padding:12px;background:var(--soft,#f4f6fb);border-radius:12px;font-size:.83rem;line-height:1.5;color:var(--text,#26344d);margin-bottom:11px}
    .edb-actions{display:flex;flex-wrap:wrap;gap:7px}
    .edb-actions button{border:0;border-radius:10px;padding:10px 12px;font-size:.78rem;font-weight:750;cursor:pointer}
    .edb-primary{background:#3155bd;color:#fff}
    .edb-secondary{background:var(--soft,#eef1f7);color:var(--text,#27344d)}
    .edb-focus label{display:block;font-size:.75rem;font-weight:700;color:var(--text,#34415a);margin:10px 0 5px}
    .edb-focus input,.edb-focus select{width:100%;min-width:0;padding:10px;border:1px solid var(--line,#dce3ee);border-radius:10px;background:var(--bg,#fff);color:var(--text,#18243b);font:inherit;font-size:.83rem}
    .edb-foot{font-size:.72rem;color:var(--muted,#68758b);margin:10px 0 0}
    @media(max-width:720px){.edb-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.edb-main{grid-template-columns:1fr}}
    @media(max-width:380px){.edb-head{display:block}.edb-date{display:block;margin-top:5px}}
  `;
  document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'edb-wrap';
  card.setAttribute('aria-label','Tableau de bord personnel');
  card.innerHTML = `
    <div class="edb-head">
      <div><span class="edb-kicker">TON ESPACE PERSONNEL</span><h2 id="edb-greeting">Ton tableau de bord ✨</h2><p id="edb-subtitle">Chaque petit progrès te rapproche de ton objectif.</p></div>
      <span class="edb-date" id="edb-date"></span>
    </div>
    <div class="edb-grid">
      <div class="edb-stat"><span>🏆 Total XP</span><strong id="edb-xp">0</strong></div>
      <div class="edb-stat"><span>🎓 Examens blancs</span><strong id="edb-exams">0</strong></div>
      <div class="edb-stat"><span>⭐ Meilleur score</span><strong id="edb-best">—</strong></div>
      <div class="edb-stat"><span>📝 Tâches restantes</span><strong id="edb-tasks">0</strong></div>
    </div>
    <div class="edb-main">
      <div class="edb-plan">
        <h3>🎯 Ton prochain pas</h3>
        <p>EduNova regarde tes tâches et tes résultats pour te proposer une action utile.</p>
        <div class="edb-recommend" id="edb-recommend" aria-live="polite">Préparation de ton plan de travail…</div>
        <div class="edb-actions">
          <button class="edb-primary" id="edb-start" type="button">Commencer maintenant →</button>
          <button class="edb-secondary" id="edb-refresh" type="button">Actualiser mon bilan</button>
        </div>
      </div>
      <div class="edb-focus">
        <h3>🧭 Mon cap scolaire</h3>
        <p>Définis ce que tu veux améliorer. Ton objectif reste enregistré sur cet appareil.</p>
        <label for="edb-focus-select">Matière à travailler</label>
        <select id="edb-focus-select">
          <option>Mathématiques</option><option>Français</option><option>Histoire-géographie</option><option>Anglais</option><option>Sciences</option><option>Physique-chimie</option><option>Autre matière</option>
        </select>
        <label for="edb-goal-input">Mon objectif</label>
        <input id="edb-goal-input" maxlength="100" placeholder="Ex. Atteindre 14/20 en maths">
        <div class="edb-actions" style="margin-top:11px"><button class="edb-primary" id="edb-save" type="button">Enregistrer mon objectif</button></div>
        <p class="edb-foot" id="edb-saved" role="status">Tes données personnelles restent sur cet appareil, sauf les données déjà synchronisées par ton compte EduNova.</p>
      </div>
    </div>
  `;
  hero.insertAdjacentElement('afterend', card);

  const $ = id => document.getElementById(id);
  $('edb-focus-select').value = prefs.focus;
  $('edb-goal-input').value = prefs.goal;

  const parse = key => {
    try { const x = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(x) ? x : []; }
    catch (_) { return []; }
  };
  const render = () => {
    const xp = Math.max(0, Number(localStorage.getItem('edunova_xp_v1') || 0));
    const exams = parse('edunova_exam_history_v1');
    const tasks = parse('studybot_tasks_v1');
    const pending = tasks.filter(x => x && !x.done);
    const best = exams.length ? Math.max(...exams.map(x => Number(x.score)||0)) : null;
    const average = exams.length ? Math.round(exams.reduce((sum,x)=>sum+(Number(x.score)||0),0)/exams.length) : null;
    $('edb-xp').textContent = xp;
    $('edb-exams').textContent = exams.length;
    $('edb-best').textContent = best === null ? '—' : best+'%';
    $('edb-tasks').textContent = pending.length;
    const hour = new Date().getHours();
    $('edb-greeting').textContent = hour < 12 ? 'Bonjour, prêt à progresser ? ☀️' : hour < 18 ? 'Bon après-midi, on avance ? ✨' : 'Bonsoir, une dernière victoire ? 🌙';
    $('edb-date').textContent = new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    const profileLevel = document.getElementById('profile-level')?.value;
    $('edb-subtitle').textContent = profileLevel ? 'Ton espace de progression • Niveau '+profileLevel : 'Chaque petit progrès te rapproche de ton objectif.';
    let recommendation = '', action = () => window.tab && window.tab('alllevels');
    if (pending.length) {
      recommendation = '📌 Tu as '+pending.length+' tâche(s) en attente. Commence par « '+String(pending[0].text||'ta première tâche').slice(0,100)+' ». Termine une chose avant d’en commencer une autre.';
      action = () => window.tab && window.tab('tools');
    } else if (average !== null && average < 70) {
      const weakest = exams.slice().sort((a,b)=>(Number(a.score)||0)-(Number(b.score)||0))[0];
      recommendation = '🧠 Tes examens blancs affichent '+average+'% en moyenne. Reprends une fiche, révise 15 minutes, puis refais un quiz pour consolider tes acquis.';
      action = () => window.tab && window.tab('alllevels');
    } else if (!exams.length) {
      recommendation = '🚀 Commence par une fiche de '+prefs.focus+', puis teste-toi avec un quiz. Ton premier examen blanc permettra de mesurer tes progrès.';
      action = () => window.tab && window.tab('alllevels');
    } else {
      recommendation = '🌟 Belle progression : '+average+'% de moyenne sur tes examens blancs. Pour aller plus loin, révise une notion difficile et vise un nouveau record.';
      action = () => window.tab && window.tab('alllevels');
    }
    if (prefs.goal) recommendation += ' Ton objectif : '+prefs.goal+'.';
    $('edb-recommend').textContent = recommendation;
    $('edb-start').onclick = action;
  };
  $('edb-save').addEventListener('click',()=>{
    prefs.focus = $('edb-focus-select').value;
    prefs.goal = $('edb-goal-input').value.trim();
    save(); render();
    $('edb-saved').textContent = 'Objectif enregistré sur cet appareil. Continue, tu avances !';
  });
  $('edb-refresh').addEventListener('click',()=>{render();$('edb-saved').textContent='Bilan actualisé à partir de tes données disponibles.';});
  document.addEventListener('click',event=>{
    if(event.target.closest('.tab[data-tab="home"]')) render();
  });
  window.addEventListener('storage',render);
  render();
})();
