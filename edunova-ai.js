(()=> {
 const $=id=>document.getElementById(id);
 const form=$('edai-form'), input=$('assistantQuestion'), chat=$('edai-chat'), status=$('edai-status'), send=$('askAssistant');
 if(!form||!input||!chat||!status||!send)return;
 const SUPABASE_URL='https://aocrfbhgxdrznwqudggi.supabase.co';
 const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmciLCJyZWYiOiJhb2NyZmJoZ3hkcnpud3F1ZGdnaSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzk0Mjc1MjUyLCJleHAiOjIxMDk4NTEyNTJ9.ypPsti6Gg2wmfbQccVN-vs5KewbuV1hrn7vke73zjjg';
 const KEY='edunova_ai_history_v1';
 let history=[];
 const safeHistory=()=>{try{const v=JSON.parse(sessionStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').slice(-12):[]}catch{return []}};
 history=safeHistory();
 function bubble(role,text,extra=''){
  const el=document.createElement('div');el.className='edai-message '+(role==='user'?'edai-user':'edai-assistant')+(extra?' '+extra:'');
  el.textContent=text;chat.appendChild(el);chat.scrollTop=chat.scrollHeight;return el;
 }
 function persist(){try{sessionStorage.setItem(KEY,JSON.stringify(history.slice(-12)))}catch{}}
 function draw(){
  chat.innerHTML='';
  if(!history.length){const w=document.createElement('div');w.className='edai-welcome';w.innerHTML='<b>Bonjour ! Je suis EduNova AI.</b><p>Je peux t\'expliquer un cours, corriger un exercice, t\'interroger ou t\'aider à organiser tes révisions. Que veux-tu travailler aujourd\'hui ?</p><div class="edai-prompts"><button type="button" class="edai-prompt">Explique-moi les fractions simplement</button><button type="button" class="edai-prompt">Aide-moi à préparer un contrôle</button><button type="button" class="edai-prompt">Fais-moi un quiz pour réviser</button></div>';chat.appendChild(w);return}
  history.forEach(m=>bubble(m.role,m.content));
 }
 function setBusy(v){send.disabled=v;send.textContent=v?'Réflexion…':'Envoyer ↗';input.disabled=v}
 chat.addEventListener('click',e=>{const b=e.target.closest('.edai-prompt');if(b){input.value=b.textContent;input.focus()}});
 $('edai-clear')?.addEventListener('click',()=>{history=[];try{sessionStorage.removeItem(KEY)}catch{}draw();status.textContent='Nouvelle conversation prête.';input.focus()});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
 form.addEventListener('submit',async e=>{
  e.preventDefault();const question=input.value.trim();if(!question||send.disabled)return;
  const level=$('assistantLevel')?.value||'Non précisée',subject=$('assistantSubject')?.value||'Toutes matières';
  const userMessage={role:'user',content:question};
  history.push(userMessage);bubble('user',question);input.value='';setBusy(true);status.textContent='EduNova AI prépare une réponse…';
  const pending=bubble('assistant','Je réfléchis…');
  try{
   const response=await fetch(SUPABASE_URL+'/functions/v1/edunova-ai',{
    method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+SUPABASE_ANON_KEY},
    body:JSON.stringify({level,subject,messages:history.slice(-12)}),signal:AbortSignal.timeout(65000)
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||'Le service IA est momentanément indisponible (HTTP '+response.status+').');
   if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('La réponse reçue est vide. Réessaie.');
   pending.textContent=data.reply;history.push({role:'assistant',content:data.reply});history=history.slice(-12);persist();status.textContent='Réponse générée · modèle gratuit selon disponibilité.';
   if(typeof awardXP==='function')awardXP(2);
  }catch(err){
   pending.classList.add('edai-error');pending.textContent=(err.name==='TimeoutError'?'La demande a pris trop de temps. Réessaie.':err.message||'Impossible de joindre EduNova AI.')+'\n\nSi le service vient d’être installé, vérifie que la fonction Supabase est déployée et que la clé OpenRouter est configurée.';
   history.pop();status.textContent='Échec de la demande.';
  }finally{setBusy(false);input.focus();chat.scrollTop=chat.scrollHeight}
 });
 draw();
})();