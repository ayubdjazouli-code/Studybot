/* EduNova Motivation — missions quotidiennes et régularité */
(() => {
  'use strict';
  if (window.__edunovaMotivationLoaded) return;
  window.__edunovaMotivationLoaded = true;

  const home = document.getElementById('home');
  const hero = home && home.querySelector('.home-hero');
  if (!home || !hero) return;

  const KEY = 'edunova_daily_missions_v1';
  const today = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  };
  const shiftDate = (value, days) => {
    const d = new Date(value + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  };
  const messages = [
    ['Chaque petit progrès compte.','Aujourd’hui, vise le progrès, pas la perfection.'],
    ['Tu peux le faire !','Une séance courte vaut mieux que remettre à demain.'],
    ['Construis ta réussite.','Tu n’as pas besoin de tout savoir aujourd’hui : commence.'],
    ['Ton futur toi te remerciera.','Quelques minutes de révision peuvent faire la différence.'],
    ['On avance ensemble.','Concentre-toi sur une seule chose à la fois.'],
    ['Bravo d’être là !','Le plus dur, c’est souvent de commencer. Tu es déjà lancé.'],
    ['Un jour après l’autre.','Répéter un peu chaque jour aide à mieux retenir.']
  ];
  const tasks = [
    { icon:'📚', title:'Révise une leçon', desc:'Choisis une matière et relis une fiche.', action:() => window.tab && window.tab('alllevels'), button:'Choisir une leçon' },
    { icon:'🎯', title:'Teste tes connaissances', desc:'Fais un quiz pour vérifier ce que tu as retenu.', action:() => { if(window.tab) window.tab('quiz'); if(window.startQuiz) window.startQuiz(); }, button:'Faire un quiz' },
    { icon:'🧠', title:'Entraîne ta mémoire', desc:'Fais quelques cartes mémoire.', action:() => window.tab && window.tab('cards'), button:'Voir mes cartes' }
  ];
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
  if (!state || typeof state !== 'object' || !Array.isArray(state.done)) state = { date:today(), done:[], opened:[], streak:0, lastStreak:'' };
  if (state.date !== today()) {
    state.date = today();
    state.done = [];
  }
  state.done = state.done.filter(n => Number.isInteger(n) && n >= 0 && n < tasks.length);
  if (!Array.isArray(state.opened)) state.opened = [];
  state.opened = state.opened.filter(n => Number.isInteger(n) && n >= 0 && n < tasks.length);
  state.streak = Number.isFinite(state.streak) ? state.streak : 0;
  state.lastStreak = typeof state.lastStreak === 'string' ? state.lastStreak : '';

  const style = document.createElement('style');
  style.textContent = `
    .edm-card{position:relative;overflow:hidden;margin:0 0 18px;padding:21px;background:linear-gradient(120deg,#fff 0%,#f2f5ff 100%);border:1px solid #dfe7fb;border-radius:20px;box-shadow:0 8px 24px #1b36730b}
    .edm-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .edm-kicker{font-size:.7rem;font-weight:900;letter-spacing:.13em;color:#536bb4}
    .edm-card h2{font-size:1.3rem;margin:5px 0}
    .edm-copy{font-size:.88rem;color:#64748b;margin:4px 0}
    .edm-streak{flex:0 0 auto;background:#fff;border:1px solid #e5eaf5;border-radius:13px;padding:9px 12px;text-align:center;font-weight:850;color:#2949ad}
    .edm-streak small{display:block;font-size:.66rem;color:#64748b;font-weight:700}
    .edm-progressline{display:flex;justify-content:space-between;gap:10px;margin:15px 0 7px;font-size:.78rem;font-weight:800;color:#34456e}
    .edm-track{height:9px;background:#e2e8f4;border-radius:99px;overflow:hidden}
    .edm-track span{display:block;height:100%;background:linear-gradient(90deg,#5476df,#37a58c);border-radius:99px;transition:width .2s}
    .edm-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
    .edm-task{display:flex;flex-direction:column;align-items:flex-start;gap:7px;min-width:0;padding:13px;background:#fff;border:1px solid #e4e9f3;border-radius:15px}
    .edm-task.done{background:#f1faf6;border-color:#b9e4d1}
    .edm-icon{font-size:1.35rem}
    .edm-task b{font-size:.9rem;line-height:1.3}
    .edm-task p{font-size:.75rem;line-height:1.4;margin:0;flex:1}
    .edm-task button{width:100%;padding:9px 10px;border-radius:10px;background:#eaf0ff;color:#2949ad;font-size:.78rem;font-weight:850}
    .edm-task.done button{background:#dff3e9;color:#176b4a}
    .edm-note{font-size:.78rem;color:#53627d;margin:12px 0 0}
    @media(max-width:700px){.edm-card{padding:16px}.edm-list{grid-template-columns:1fr}.edm-task{display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center}.edm-icon{grid-row:span 2}.edm-task p{grid-column:2}.edm-task button{grid-column:2;width:auto;justify-self:start}.edm-streak{padding:8px 10px}}
  `;
  document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'edm-card';
  card.setAttribute('aria-labelledby','edm-title');
  card.innerHTML = `
    <div class="edm-top">
      <div><span class="edm-kicker">✨ TON RENDEZ-VOUS DU JOUR</span><h2 id="edm-title">Tes 3 missions pour progresser</h2><p class="edm-copy" id="edm-message"></p></div>
      <div class="edm-streak" aria-label="Série de jours"><span id="edm-streak-number">0</span> 🔥<small>jours de suite</small></div>
    </div>
    <div class="edm-progressline"><span id="edm-progress-label">0 sur 3 missions terminées</span><span id="edm-xp-label">+30 XP à gagner</span></div>
    <div class="edm-track" role="progressbar" aria-label="Missions quotidiennes" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0" id="edm-progress"><span id="edm-progress-fill" style="width:0%"></span></div>
    <div class="edm-list" id="edm-list"></div>
    <p class="edm-note" id="edm-note" aria-live="polite">💡 Fais les missions dans l’ordre que tu veux. Même 10 minutes peuvent être utiles.</p>
  `;
  hero.insertAdjacentElement('afterend', card);

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const render = () => {
    const count = state.done.length;
    const dayIndex = Math.floor(new Date(today() + 'T12:00:00').getTime()/86400000) % messages.length;
    document.getElementById('edm-message').textContent = messages[dayIndex][1];
    document.getElementById('edm-streak-number').textContent = state.streak;
    document.getElementById('edm-progress-label').textContent = count + ' sur 3 missions terminées';
    document.getElementById('edm-xp-label').textContent = count === 3 ? 'Objectif atteint ! 🎉' : '+' + ((3-count)*10) + ' XP à gagner';
    document.getElementById('edm-progress').setAttribute('aria-valuenow', String(count));
    document.getElementById('edm-progress-fill').style.width = (count/3*100) + '%';
    document.getElementById('edm-list').innerHTML = tasks.map((task,index) => {
      const done = state.done.includes(index);
      return '<article class="edm-task '+(done?'done':'')+'"><span class="edm-icon">'+task.icon+'</span><b>'+escapeHTML(task.title)+'</b><p>'+escapeHTML(task.desc)+'</p><button type="button" data-edm-action="'+index+'">'+(done?'✓ Mission terminée':state.opened.includes(index)?'Valider la mission · +10 XP':'Ouvrir la mission →')+'</button></article>';
    }).join('');
    if (count === 3) document.getElementById('edm-note').textContent = '🏆 Bravo ! Tu as terminé tes 3 missions du jour. Reviens demain pour un nouveau défi.';
  };
  document.getElementById('edm-list').addEventListener('click', event => {
    const button = event.target.closest('[data-edm-action]');
    if (!button) return;
    const index = Number(button.dataset.edmAction);
    if (!Number.isInteger(index) || !tasks[index]) return;
    if (!state.done.includes(index) && !state.opened.includes(index)) {
      state.opened.push(index);
      save();
      render();
      document.getElementById('edm-note').textContent = 'Mission ouverte ! Réalise maintenant l’activité, puis reviens ici pour la valider et gagner tes XP.';
      tasks[index].action();
      return;
    }
    if (!state.done.includes(index)) {
      state.done.push(index);
      state.done.sort();
      if (typeof window.awardXP === 'function') window.awardXP(10);
      if (state.done.length === 3 && state.lastStreak !== today()) {
        state.streak = state.lastStreak === shiftDate(today(), -1) ? state.streak + 1 : 1;
        state.lastStreak = today();
      }
      save();
      render();
      document.getElementById('edm-note').textContent = state.done.length === 3
        ? '🎉 Tes trois missions sont terminées. Tu as gagné 30 XP aujourd’hui !'
        : 'Bien joué ! Une mission de plus accomplie. Continue à ton rythme.';
    }
  });
  document.addEventListener('click', event => {
    if (event.target.closest('.tab[data-tab="home"]')) render();
  });
  save();
  render();
})();
