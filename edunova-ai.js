(()=> {
 const $=id=>document.getElementById(id);
 const form=$('edai-form'), input=$('assistantQuestion'), chat=$('edai-chat'), status=$('edai-status'), send=$('askAssistant');
 const SUPABASE_URL='https://aocrfbhgxdrznwqudggi.supabase.co', SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvY3JmYmhneGRyem53cXVkZ2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNzUyNTIsImV4cCI6MjEwOTg1MTI1Mn0.ypPsti6Gg2wmfbQccVN-vs5KewbuV1hrn7vke73zjjg';
 const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY), BUCKET='edunova-ai-photos';
 if(!form||!input||!chat||!status||!send)return;
 const KEY='edunova_ai_history_v1';

 const photoStyle=document.createElement('style');photoStyle.textContent='.edai-photo-row{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:9px 0}.edai-photo-row input{max-width:230px;font-size:.85rem}.edai-photo-quota{font-size:.78rem;color:var(--muted,#667085)}.edai-photo-list{font-size:.82rem;color:var(--muted,#667085);margin:4px 0 9px}.edai-photo-preview{display:flex;gap:8px;flex-wrap:wrap}.edai-photo-preview img{width:62px;height:62px;object-fit:cover;border-radius:9px;border:1px solid #dce3ef}';document.head.appendChild(photoStyle);
 const photoRow=document.createElement('div');photoRow.className='edai-photo-row';photoRow.innerHTML='<label for="edai-photos" style="margin:0">📷 Joindre des photos</label><input id="edai-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple><span id="edai-photo-quota" class="edai-photo-quota">Connecte-toi pour voir ton quota photo.</span><div id="edai-photo-list" class="edai-photo-list"></div><div id="edai-photo-preview" class="edai-photo-preview"></div>';
 form.insertBefore(photoRow,form.querySelector('.edai-form-bottom'));
 const photoInput=$('edai-photos'),photoQuota=$('edai-photo-quota'),photoList=$('edai-photo-list'),photoPreview=$('edai-photo-preview');
 let currentUser=null,currentPaid=false,photoUsed=0,photoFiles=[];
 async function refreshPhotoQuota(){
  if(!client){photoQuota.textContent='Service de compte indisponible.';return}
  const {data:{session}}=await client.auth.getSession();currentUser=session?.user||null;
  if(!currentUser){photoQuota.textContent='Connecte-toi pour joindre des photos.';return}
  const {data:sub}=await client.from('subscriptions').select('price_id,status,current_period_end').eq('user_id',currentUser.id).maybeSingle();
  currentPaid=!!sub&&['active','trialing'].includes(sub.status)&&(!sub.current_period_end||new Date(sub.current_period_end)>new Date())&&['price_1Uan3IPNbeiIpf4L7eHT5KQD','price_1Uan8bPNbeiIpf4LYXs4Gp5F'].includes(sub.price_id);
  const {data:objects,error}=await client.storage.from(BUCKET).list(currentUser.id,{limit:1000,sortBy:{column:'created_at',order:'desc'}});
  if(error){photoQuota.textContent='Quota photo indisponible. Réessaie après connexion.';return}
  const month=new Date();month.setDate(1);month.setHours(0,0,0,0);
  photoUsed=(objects||[]).filter(x=>x.created_at&&new Date(x.created_at)>=month).length;
  photoQuota.textContent=currentPaid?'Photos IA : sans quota de nombre · 5 maximum par message.':'Photos gratuites : '+Math.max(0,6-photoUsed)+' / 6 restantes ce mois-ci.';
 }
 function renderPhotoSelection(){
  photoPreview.innerHTML='';photoList.textContent=photoFiles.length?photoFiles.length+' photo(s) sélectionnée(s) · 5 maximum par message.':'';
  photoFiles.forEach(file=>{const img=document.createElement('img');img.alt=file.name;const url=URL.createObjectURL(file);img.src=url;img.onload=()=>URL.revokeObjectURL(url);photoPreview.appendChild(img)});
 }
 photoInput.addEventListener('change',()=>{
  photoFiles=Array.from(photoInput.files||[]).slice(0,5);
  if((photoInput.files||[]).length>5)status.textContent='5 photos maximum par message. Les autres n’ont pas été ajoutées.';
  renderPhotoSelection();
 });
 refreshPhotoQuota();
 client?.auth.onAuthStateChange(()=>setTimeout(refreshPhotoQuota,0));
 async function preparePhoto(file,userId){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Format accepté : JPG, PNG ou WebP.');
  if(file.size>12*1024*1024)throw new Error('Chaque photo doit faire moins de 12 Mo avant compression.');
  let blob=file;
  if('createImageBitmap' in window){
   const bitmap=await createImageBitmap(file);const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
  }
  if(!blob)throw new Error('Impossible de préparer une photo.');
  const path=userId+'/'+crypto.randomUUID()+'.jpg';
  const {error}=await client.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false});
  if(error)throw new Error(error.message.includes('row-level security')?'Limite gratuite de 6 photos atteinte ce mois-ci, ou accès refusé.':error.message);
  return path;
 }

 let history=[];
 const safeHistory=()=>{try{const v=JSON.parse(sessionStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').slice(-12):[]}catch{return []}};
 history=safeHistory();
 function addCopyAction(el,text){
  const tools=document.createElement('div');tools.className='edai-message-tools';
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copier la réponse';copy.setAttribute('aria-label','Copier cette réponse');
  copy.addEventListener('click',async()=>{
   try{
    if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(text);
    else{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Copie indisponible');}
    copy.textContent='Copié !';status.textContent='Réponse copiée dans le presse-papiers.';
   }catch{status.textContent='Copie impossible sur ce navigateur.'}
  });
  tools.appendChild(copy);el.appendChild(tools);
 }
 function bubble(role,text,extra='',withCopy=false){
  const el=document.createElement('div');el.className='edai-message '+(role==='user'?'edai-user':'edai-assistant')+(extra?' '+extra:'');
  el.textContent=text;if(withCopy)addCopyAction(el,text);chat.appendChild(el);chat.scrollTop=chat.scrollHeight;return el;
 }
 function persist(){try{sessionStorage.setItem(KEY,JSON.stringify(history.slice(-12)))}catch{}}
 function draw(){
  chat.innerHTML='';
  if(!history.length){const w=document.createElement('div');w.className='edai-welcome';w.innerHTML='<b>Bonjour ! Je suis EduNova AI.</b><p>Je peux t\'expliquer un cours, corriger un exercice, t\'interroger ou t\'aider à organiser tes révisions. Que veux-tu travailler aujourd\'hui ?</p><div class="edai-prompts"><button type="button" class="edai-prompt">Explique-moi les fractions simplement</button><button type="button" class="edai-prompt">Aide-moi à préparer un contrôle</button><button type="button" class="edai-prompt">Fais-moi un quiz pour réviser</button></div>';chat.appendChild(w);return}
  history.forEach(m=>bubble(m.role,m.content,'',m.role==='assistant'));
 }
 function setBusy(v){send.disabled=v;send.textContent=v?'Réflexion…':'Envoyer ↗';input.disabled=v}
 const counter=$('edai-counter');
 function updateCounter(){if(counter)counter.textContent=input.value.length.toLocaleString('fr-FR')+' / 6 000';}
 input.addEventListener('input',updateCounter);updateCounter();
 chat.addEventListener('click',e=>{const b=e.target.closest('.edai-prompt');if(b){input.value=b.textContent;input.focus();updateCounter()}});
 $('edai-clear')?.addEventListener('click',()=>{history=[];try{sessionStorage.removeItem(KEY)}catch{}draw();status.textContent='Nouvelle conversation prête.';input.focus()});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
 form.addEventListener('submit',async e=>{
  e.preventDefault();const question=input.value.trim();if((!question&&!photoFiles.length)||send.disabled)return;
  const level=$('assistantLevel')?.value||'Non précisée',subject=$('assistantSubject')?.value||'Toutes matières';
  const files=photoFiles.slice();photoFiles=[];photoInput.value='';renderPhotoSelection();
  if(!client){status.textContent='Le service de compte est indisponible.';return}
  const {data:{session}}=await client.auth.getSession();
  if(!session?.access_token){status.textContent='Connecte-toi pour utiliser EduNova AI.';return}
  if(files.length>5){status.textContent='5 photos maximum par message.';return}
  if(files.length&&!currentPaid&&photoUsed+files.length>6){status.textContent='Tu as atteint les 6 photos gratuites de ce mois. Les offres Essentiel et Premium+ permettent les envois sans quota de nombre.';return}
  const displayText=question+(files.length?'\n📷 '+files.length+' photo(s) jointe(s)':'');
  history.push({role:'user',content:displayText});bubble('user',displayText);input.value='';setBusy(true);status.textContent='Préparation de ta demande et de tes photos…';
  const pending=bubble('assistant','Je réfléchis…');
  try{
   const imageRefs=[];
   for(const file of files){imageRefs.push(await preparePhoto(file,currentUser.id));}
   const apiHistory=history.slice(-12).map((m,i)=>i===history.slice(-12).length-1&&imageRefs.length?{role:'user',content:[{type:'text',text:question||'Analyse ces photos de cours et aide-moi à les comprendre.'},...imageRefs.map(path=>({type:'image_ref',path}))]}:m);
   status.textContent='EduNova AI analyse ta demande'+(files.length?' et '+files.length+' photo(s)':'')+'…';
   const response=await fetch(SUPABASE_URL+'/functions/v1/edunova-ai',{
    method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+session.access_token},
    body:JSON.stringify({level,subject,messages:apiHistory}),signal:AbortSignal.timeout(65000)
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||'Le service IA est momentanément indisponible (HTTP '+response.status+').');
   if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('La réponse reçue est vide. Réessaie.');
   pending.textContent=data.reply;addCopyAction(pending,data.reply);history.push({role:'assistant',content:data.reply});history=history.slice(-12);persist();status.textContent='Réponse générée par EduNova AI · modèle actif : '+(data.model||'OpenRouter')+'.';if(files.length)await refreshPhotoQuota();
   if(typeof awardXP==='function')awardXP(2);
  }catch(err){
   pending.classList.add('edai-error');pending.textContent=(err.name==='TimeoutError'?'La demande a pris trop de temps. Réessaie.':err.message||'Impossible de joindre EduNova AI.')+'\n\nSi le service vient d’être installé, vérifie que la fonction Supabase est déployée et que la clé OpenRouter est configurée.';
   const retry=document.createElement('button');retry.type='button';retry.className='ghost';retry.textContent='Réessayer';retry.addEventListener('click',()=>{input.value=question;updateCounter();form.requestSubmit()});pending.appendChild(retry);
   history.pop();status.textContent='Échec de la demande.';if(files.length)await refreshPhotoQuota();
  }finally{setBusy(false);input.focus();chat.scrollTop=chat.scrollHeight}
 });
 draw();
})();