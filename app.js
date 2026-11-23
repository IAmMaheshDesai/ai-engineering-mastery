(()=>{'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const registry=window.AEM_DATA||{topics:[],lessons:{},cards:{}};const companies=['OpenAI','Anthropic','Meta','Google','NVIDIA'];let screen='home',company='All',search='',slideIndex=0,zoom=100,wide=false,lesson=null,topic=null,review=[],cardIndex=0,revealed=false,reviewSource='catalog',timerStart=Date.now(),pointer=false;
const storage=(key,def)=>{try{return JSON.parse(localStorage.getItem('aem2:'+key))??def}catch{return def}};const save=(key,val)=>{try{localStorage.setItem('aem2:'+key,JSON.stringify(val))}catch(e){console.warn('Progress storage unavailable',e)}};let ratings=storage('ratings',{}),completed=storage('completed',{}),bookmarks=storage('bookmarks',{}),vocabulary=storage('vocabulary',[]),vocabIndex=0,vocabRevealed=false,vocabSource='home',selectedWord='',vocabRatings=storage('vocabRatings',{}),vocabListMode=false;
let resourceSource='presentation',resourceMode='research',resourceTopicId=null;
function safeResourceMarkdown(md){
 const inline=t=>esc(t).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,label,url)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
 let html='',list=false;
 for(const raw of md.split(/\r?\n/)){
  const line=raw.trim();if(!line){if(list){html+='</ul>';list=false}continue}
  const h=line.match(/^(#{1,4})\s+(.+)$/);if(h){if(list){html+='</ul>';list=false}let level=Math.min(h[1].length+1,5);html+=`<h${level}>${inline(h[2])}</h${level}>`;continue}
  if(/^[-*] /.test(line)){if(!list){html+='<ul>';list=true}html+=`<li>${inline(line.slice(2))}</li>`;continue}
  if(list){html+='</ul>';list=false}html+=`<p>${inline(line)}</p>`;
 }
 return html+(list?'</ul>':'');
}
function openTopicResources(mode){
 if(!topic)return;
 resourceTopicId=topic.id;resourceMode=mode;
 resourceSource=!$('presentation').classList.contains('hidden')?'presentation':screen;
 $('presentation').classList.add('hidden');$('resourceOverlay').classList.remove('hidden');document.body.classList.add('presentation-open');
 if(!document.fullscreenElement)enterBrowserFullscreen();renderTopicResources();clock();
}
function closeTopicResources(){
 $('resourceOverlay').classList.add('hidden');
 if(resourceSource==='presentation'&&lesson){$('presentation').classList.remove('hidden');renderSlide()}
 else{document.body.classList.remove('presentation-open');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});if(screen==='architecture')catalog();else home()}
 clock();
}
function addSuggestedWord(i){
 const words=registry.vocabularySuggestions?.[resourceTopicId]||[];const w=words[i];if(!w)return;
 const existing=vocabulary.find(x=>x.word.toLocaleLowerCase()===w.word.toLocaleLowerCase());
 if(existing)return;
 vocabulary.push({id:'word-'+Date.now()+'-'+i,word:w.word,meaning:w.meaning,sentence:w.sentence,topicId:resourceTopicId,createdAt:new Date().toISOString()});
 save('vocabulary',vocabulary);renderTopicResources();
}
function addAllSuggestedWords(){
 const words=registry.vocabularySuggestions?.[resourceTopicId]||[];let n=0;
 for(const [i,w] of words.entries()){
  if(vocabulary.some(x=>x.word.toLocaleLowerCase()===w.word.toLocaleLowerCase()))continue;
  vocabulary.push({id:'word-'+Date.now()+'-'+i,word:w.word,meaning:w.meaning,sentence:w.sentence,topicId:resourceTopicId,createdAt:new Date().toISOString()});n++;
 }
 save('vocabulary',vocabulary);renderTopicResources();
 const status=$('resourceImportStatus');if(status)status.textContent=`${n} new word${n===1?'':'s'} added. Existing words were preserved.`;
}
function renderTopicResources(){
 const title=getTopic(resourceTopicId)?.title||resourceTopicId;
 $('resourceTitle').textContent=resourceMode==='research'?'Research & Sources':'Suggested Vocabulary';
 $('resourceEyebrow').textContent=`${resourceTopicId.toUpperCase()} · ${title}`;
 $('resourceFooter').textContent=resourceMode==='research'?'RESEARCH EVIDENCE':'TOPIC VOCABULARY';
 $('resourceResearch').classList.toggle('active',resourceMode==='research');$('resourceWords').classList.toggle('active',resourceMode==='words');
 if(resourceMode==='research'){
  $('resourceIntro').textContent='Research notes, source links and evidence classifications for this topic. Public engineering evidence is not a guarantee of interview questions.';
  const md=registry.research?.[resourceTopicId];
  $('resourceContent').innerHTML=md?`<div class="resource-markdown">${safeResourceMarkdown(md)}</div>`:'<div class="resource-empty">No research notes yet. Add data/research/'+esc(resourceTopicId)+'.research.md and run python3 build.py.</div>';
 }else{
  const words=registry.vocabularySuggestions?.[resourceTopicId]||[];
  const saved=new Set(vocabulary.map(x=>x.word.toLocaleLowerCase()));
  $('resourceIntro').textContent='Preview curated words for this lesson. Import individual words or add all new words to My Dictionary. Existing personal definitions are never overwritten.';
  $('resourceContent').innerHTML=words.length?`<div class="resource-actions"><button class="btn" id="resourceImportAll">Add All New Words (${words.filter(w=>!saved.has(w.word.toLocaleLowerCase())).length})</button><span id="resourceImportStatus" role="status"></span></div><div class="resource-word-list">${words.map((w,i)=>`<article class="vocab-entry"><div class="vocab-entry-head"><h3>${esc(w.word)}</h3><button class="btn secondary" data-suggest-word="${i}" ${saved.has(w.word.toLocaleLowerCase())?'disabled':''}>${saved.has(w.word.toLocaleLowerCase())?'Already in Dictionary':'＋ Add to Dictionary'}</button></div><p><strong>Meaning:</strong> ${esc(w.meaning)}</p><p><strong>Example:</strong> “${esc(w.sentence)}”</p></article>`).join('')}</div>`:'<div class="resource-empty">No suggested vocabulary yet. Add data/vocabulary/'+esc(resourceTopicId)+'.vocabulary.json and run python3 build.py.</div>';
  $('resourceImportAll')?.addEventListener('click',addAllSuggestedWords);
 }
}
function clock(){const t=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date());document.querySelectorAll('[data-clock]').forEach(e=>e.textContent='San Francisco · '+t);if(!$('presentation').classList.contains('hidden')){let s=Math.floor((Date.now()-timerStart)/1000);$('sessionTime').textContent='SESSION TIME '+[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':')}}setInterval(clock,1000);
function header(){return `<header class="top"><div><div class="brand">AI Engineering Mastery</div><div class="sub">Senior Staff · AI Infrastructure · Distributed Systems</div></div><span class="clock" data-clock></span></header>`}
function home(){screen='home';$('app').innerHTML=header()+`<div class="hero"><div class="eyebrow">Engineering Interview Preparation</div><h1>Master the architecture behind<br>the world's most advanced AI systems.</h1><p>Deep technical lessons, elegant presentations, active recall, and interview-ready explanations.</p><span class="pill">OpenAI</span> <span class="pill">Anthropic</span> <span class="pill">Meta</span> <span class="pill">Google</span> <span class="pill">NVIDIA</span></div><h2>Choose your learning path</h2><div class="tracks"><button class="track" data-action="coding"><strong>⌘ &nbsp;Coding & Algorithms</strong><p>Python, Java, algorithms, concurrency and infrastructure coding.</p><span class="pill">Learning track →</span></button><button class="track" data-action="architecture"><strong>◇ &nbsp;Architecture & System Design</strong><p>60 topics across distributed systems, cloud, AI serving and agent infrastructure.</p><span class="pill">Explore 60 topics →</span></button></div><div class="toolbar"><button class="btn secondary" data-action="review">Review Flashcards</button><button class="btn secondary" data-action="vocabulary">My Dictionary (${vocabulary.length})</button><button class="btn secondary" data-action="export">Export Progress</button><button class="btn secondary" data-action="import">Import Progress</button></div>`;clock()}
function catalog(type='architecture'){screen=type;let all=registry.topics.filter(t=>company==='All'||t.companies.includes(company)).filter(t=>[t.title,t.description,t.category].join(' ').toLowerCase().includes(search.toLowerCase()));let categories=[...new Set(all.map(t=>t.category))];$('app').innerHTML=header()+`<button class="btn secondary back" data-action="home">← Home</button><div class="hero"><div class="eyebrow">${type==='coding'?'Coding & Algorithms':'Architecture & System Design'}</div><h1>${type==='coding'?'Coding & Algorithms':'System Design Mastery'}</h1><p>${type==='coding'?'A structured coding track ready for future JSON lessons.':'60 essential Senior Staff topics, organized into six learning categories.'}</p></div>${type==='coding'?'<div class="empty">Coding topics will appear here when you add their JSON entries.</div>':`<div class="toolbar"><input id="search" placeholder="Search topics, concepts, categories…" value="${esc(search)}" aria-label="Search topics"><button class="btn secondary" data-action="review">Review Flashcards</button><button class="btn secondary" data-action="vocabulary">My Dictionary (${vocabulary.length})</button></div><div class="toolbar">${['All',...companies].map(c=>`<button class="tag ${company===c?'active':''}" data-company="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="topicResults">${renderTopics(all,categories)}</div>`}`;clock();if(type==='architecture')$('search').addEventListener('input',e=>{search=e.target.value;let arr=registry.topics.filter(t=>(company==='All'||t.companies.includes(company))&&[t.title,t.description,t.category].join(' ').toLowerCase().includes(search.toLowerCase()));$('topicResults').innerHTML=renderTopics(arr,[...new Set(arr.map(t=>t.category))])})}
function renderTopics(all,categories){return categories.map(cat=>`<h2 class="group-title">${esc(cat)}</h2>${all.filter(t=>t.category===cat).map(t=>`<button class="topic" data-topic="${esc(t.id)}"><span class="num">${String(t.number).padStart(2,'0')}</span><span class="desc"><strong>${esc(t.title)}</strong><small>${esc(t.companies.join(' · '))} · ${t.status==='available'?'Full lesson available':'Coming soon'}</small></span><span class="go">${t.status==='available'?'Start Lesson →':'Preview →'}</span></button>`).join('')}`).join('')||'<div class="empty">No matching topics.</div>'}
function getTopic(id){return registry.topics.find(t=>t.id===id)}
function openTopic(id){topic=getTopic(id);lesson=registry.lessons[id];if(!lesson){alert('This topic is listed in the catalog. Add data/lessons/'+id+'.json to publish its presentation.');return}slideIndex=storage('lastSlide:'+id,0);slideIndex=Math.min(Math.max(0,slideIndex),lesson.slides.length-1);zoom=100;wide=false;timerStart=Date.now();$('presentation').classList.remove('hidden');document.body.classList.add('presentation-open');enterBrowserFullscreen();$('lessonLabel').textContent=`${String(topic.number).padStart(2,'0')} · ${lesson.title}`;renderSlide();clock()}
function enterBrowserFullscreen(){
  // Must be invoked synchronously during the user's Start Lesson click.
  // Browser fullscreen hides Chrome tabs and address bar, unlike a CSS overlay.
  const el=document.documentElement;
  if(!document.fullscreenElement && el.requestFullscreen){
    try{const result=el.requestFullscreen({navigationUI:'hide'});if(result&&result.catch)result.catch(()=>{showFullscreenHint()})}
    catch(e){showFullscreenHint()}
  }else if(!document.fullscreenElement){showFullscreenHint()}
}
function showFullscreenHint(){const el=$('fullscreenHint');if(el)el.hidden=false}
function renderSlide(){
 if(!lesson)return;
 const s=lesson.slides[slideIndex];
 const para=p=>`<p>${esc(p)}</p>`;
 const list=bs=>bs?.length?`<ul class="teaching-list">${bs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
 const renderBlock=b=>{
   if(b.type==='section')return `<section class="teaching-section"><h2>${esc(b.title)}</h2>${(b.paragraphs||[]).map(para).join('')}${list(b.bullets)}${b.code?`<pre><code>${esc(typeof b.code==='string'?b.code:JSON.stringify(b.code,null,2))}</code></pre>`:''}${b.diagram?`<div class="diagram">${esc(typeof b.diagram==='string'?b.diagram:JSON.stringify(b.diagram,null,2))}</div>`:''}</section>`;
   return '';
 };
 let html=`<div class="breadcrumbs">${esc(s.section||'Architecture')} / ${esc(lesson.title)}</div><h1>${esc(s.title)}</h1>`;
 if(s.lead)html+=`<div class="intro"><p>${esc(s.lead)}</p></div>`;
 if(s.blocks)html+=s.blocks.map(renderBlock).join('');
 else{html+=(s.paragraphs||[]).map(para).join('')+list(s.bullets)}
 html+=`<div class="takeaway"><strong>Practice aloud</strong><br>Summarize this chapter in your own words. State the invariant, describe a failure, and explain the tradeoff before advancing.</div>`;
 $('slide').innerHTML=html;$('slide').style.setProperty('--slide-font',zoom*0.19+'px');$('slide').classList.toggle('wide',wide);
 $('zoom').textContent=zoom+'%';$('pageCount').textContent=(slideIndex+1)+' / '+lesson.slides.length;
 $('slideSection').textContent=s.section||'';$('prev').disabled=slideIndex===0;$('next').disabled=slideIndex===lesson.slides.length-1;
 $('widen').textContent=wide?'Normal Width':'Widen Slide';$('slideScroll').scrollTop=0;save('lastSlide:'+topic.id,slideIndex);
}

function changeSlide(d){if(lesson){slideIndex=Math.max(0,Math.min(lesson.slides.length-1,slideIndex+d));renderSlide()}}
function closePresentation(){$('presentation').classList.add('hidden');document.body.classList.remove('presentation-open');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});pointer=false;$('slideScroll').style.cursor='auto'}
function startReview(id){
 reviewSource=(!$('presentation').classList.contains('hidden'))?'presentation':screen;
 let ids=id?[id]:Object.keys(registry.cards);
 review=ids.flatMap(x=>registry.cards[x]||[]);
 if(!review.length){alert('No flashcards are available for this selection yet.');return}
 cardIndex=0;revealed=false;
 // The overlay is already fullscreen during a lesson. Keep it fullscreen when switching modes.
 $('presentation').classList.add('hidden');
 $('flashOverlay').classList.remove('hidden');
 document.body.classList.add('presentation-open');
 if(!document.fullscreenElement){
  const request=document.documentElement.requestFullscreen;
  if(request){try{const result=request.call(document.documentElement,{navigationUI:'hide'});if(result?.catch)result.catch(()=>{})}catch(e){}}
 }
 renderReview();
}
function closeReview(){
 $('flashOverlay').classList.add('hidden');
 if(reviewSource==='presentation'&&lesson){
  $('presentation').classList.remove('hidden');renderSlide();
 }else{document.body.classList.remove('presentation-open');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
 clock();
}
function renderReview(){
 let c=review[cardIndex];if(!c)return;
 $('flashNumber').textContent=`CARD ${cardIndex+1} / ${review.length}`;
 $('flashCategory').textContent=(c.type||'concept').toUpperCase();
 $('flashProgress').style.width=((cardIndex+1)/review.length*100)+'%';
 $('flashFace').innerHTML=`<div class="flash-face-label">${revealed?'ANSWER':'QUESTION'}</div><div class="flash-question">${esc(revealed?c.back:c.front)}</div>${revealed?'<p class="flash-subtext">How confidently did you recall this answer?</p>':'<p class="flash-subtext">Think through your answer before revealing it.</p>'}<button class="btn ${revealed?'secondary':''}" id="flipCard">${revealed?'Show Question':'Reveal Answer'}</button>`;
 $('flipCard').onclick=()=>{revealed=!revealed;renderReview()};
 $('flashRatings').innerHTML=revealed?['Again','Hard','Good','Easy'].map((r,i)=>`<button class="btn ${i===0?'secondary':''}" data-rating="${r}">${r}</button>`).join(''):'';
 $('flashPrev').disabled=cardIndex===0;$('flashNext').disabled=cardIndex===review.length-1;
 $('flashTopicName').textContent=topic?.title||'Concept Review';
 clock();
}
function rate(r){let c=review[cardIndex],prior=ratings[c.id]||{interval:0,repetitions:0};let interval=r==='Again'?0:r==='Hard'?Math.max(1,Math.round(prior.interval*1.2)):r==='Good'?Math.max(1,prior.interval?Math.round(prior.interval*2.3):1):Math.max(3,prior.interval?Math.round(prior.interval*3.2):4);ratings[c.id]={rating:r,interval,repetitions:r==='Again'?0:prior.repetitions+1,reviewedAt:new Date().toISOString(),dueAt:new Date(Date.now()+interval*86400000).toISOString()};save('ratings',ratings);cardIndex=(cardIndex+1)%review.length;revealed=false;renderReview()}
function exportProgress(){let data={schemaVersion:1,ratings,completed,bookmarks,vocabulary,vocabRatings};let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='ai-engineering-mastery-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importProgress(){let input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{let d=JSON.parse(await input.files[0].text());if(d.schemaVersion!==1||typeof d.ratings!=='object')throw Error('Invalid progress format');if(!confirm('Import progress and replace local progress?'))return;ratings=d.ratings;completed=d.completed||{};bookmarks=d.bookmarks||{};vocabulary=Array.isArray(d.vocabulary)?d.vocabulary:[];vocabRatings=d.vocabRatings||{};save('vocabulary',vocabulary);save('vocabRatings',vocabRatings);save('ratings',ratings);save('completed',completed);save('bookmarks',bookmarks);alert('Progress imported.')}catch(e){alert('Import failed: '+e.message)}};input.click()}

function currentVocabContext(){return topic?.id||'general'}
function openWordEditor(word=''){
 selectedWord=word.trim().slice(0,120);$('vocabWord').value=selectedWord;$('vocabMeaning').value='';$('vocabSentence').value='';$('selectionTools').classList.add('hidden');$('vocabDialog').showModal();$('vocabMeaning').focus();
}
function openVocabulary(listMode=false){
 vocabListMode=listMode;
 if(!vocabulary.length&&!listMode){openWordEditor();return}
 vocabSource=!$('presentation').classList.contains('hidden')?'presentation':(!$('flashOverlay').classList.contains('hidden')?'flash':screen);
 $('presentation').classList.add('hidden');$('flashOverlay').classList.add('hidden');$('vocabOverlay').classList.remove('hidden');document.body.classList.add('presentation-open');vocabIndex=0;vocabRevealed=false;
 if(!document.fullscreenElement)enterBrowserFullscreen();renderVocabulary();clock();
}
function closeVocabulary(){
 $('vocabOverlay').classList.add('hidden');if(vocabSource==='presentation'&&lesson){$('presentation').classList.remove('hidden');renderSlide()}
 else if(vocabSource==='flash'){$('flashOverlay').classList.remove('hidden');renderReview()}
 else{document.body.classList.remove('presentation-open');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
 clock();
}
function renderVocabulary(){
 $('vocabLibrary').classList.toggle('hidden',!vocabListMode);
 $('vocabFace').classList.toggle('hidden',vocabListMode);
 $('vocabRatings').classList.toggle('hidden',vocabListMode);
 $('vocabProgressTrack').classList.toggle('hidden',vocabListMode);
 $('vocabPrev').classList.toggle('hidden',vocabListMode);
 $('vocabNext').classList.toggle('hidden',vocabListMode);
 $('vocabToggle').textContent=vocabListMode?'Review Flashcards':'View All Words';
 if(vocabListMode){renderDictionaryList();return}
 if(!vocabulary.length){$('vocabFace').innerHTML='<div class="vocab-empty">Your dictionary is empty. Select a word in a lesson and choose Add to Dictionary.</div>';return}
 vocabIndex=Math.max(0,Math.min(vocabulary.length-1,vocabIndex));const v=vocabulary[vocabIndex];
 $('vocabCount').textContent=`WORD ${vocabIndex+1} / ${vocabulary.length}`;$('vocabProgress').style.width=((vocabIndex+1)/vocabulary.length*100)+'%';
 $('vocabFace').innerHTML=`<div class="flash-face-label">${vocabRevealed?'MEANING & USAGE':'WORD / PHRASE'}</div><div class="flash-question">${esc(v.word)}</div>${vocabRevealed?`<div class="vocab-definition">${esc(v.meaning)}</div><div class="vocab-example">“${esc(v.sentence)}”</div>`:'<p class="flash-subtext">Explain the meaning and use it in a sentence before revealing.</p>'}<button class="btn ${vocabRevealed?'secondary':''}" id="vocabFlip">${vocabRevealed?'Hide Answer':'Reveal Meaning & Sentence'}</button>`;
 $('vocabFlip').onclick=()=>{vocabRevealed=!vocabRevealed;renderVocabulary()};
 $('vocabRatings').innerHTML=vocabRevealed?['Again','Hard','Good','Easy'].map(x=>`<button class="btn secondary" data-vocab-rating="${x}">${x}</button>`).join(''):'';
 $('vocabPrev').disabled=vocabIndex===0;$('vocabNext').disabled=vocabIndex===vocabulary.length-1;
 $('vocabContext').textContent=v.topicId==='general'?'Personal Vocabulary':`From ${v.topicId}`;
}
function renderDictionaryList(){
 const query=$('vocabSearch').value.trim().toLowerCase();
 const matches=vocabulary.map((v,i)=>({...v,originalIndex:i})).filter(v=>[v.word,v.meaning,v.sentence].some(t=>t.toLowerCase().includes(query)));
 $('vocabCount').textContent=`${vocabulary.length} SAVED WORDS`;
 $('vocabContext').textContent='My Personal Dictionary';
 $('vocabEntries').innerHTML=matches.length?matches.map(v=>`<article class="vocab-entry"><div class="vocab-entry-head"><h3>${esc(v.word)}</h3><div class="vocab-entry-actions"><button class="btn secondary" data-review-word="${v.originalIndex}">Review This Word</button><button class="btn vocab-delete" data-delete-word="${v.originalIndex}" aria-label="Remove ${esc(v.word)} from dictionary">Remove Word</button></div></div><p><strong>Meaning:</strong> ${esc(v.meaning)}</p><p><strong>Example:</strong> “${esc(v.sentence)}”</p></article>`).join(''):'<div class="vocab-empty">No matching words. Select a word in your lesson and choose Add to Dictionary.</div>';
}
function rateVocabulary(r){const v=vocabulary[vocabIndex];vocabRatings[v.id]={rating:r,reviewedAt:new Date().toISOString()};save('vocabRatings',vocabRatings);vocabIndex=(vocabIndex+1)%vocabulary.length;vocabRevealed=false;renderVocabulary()}
$('vocabForm').addEventListener('submit',e=>{e.preventDefault();const word=$('vocabWord').value.trim(),meaning=$('vocabMeaning').value.trim(),sentence=$('vocabSentence').value.trim();if(!word||!meaning||!sentence)return;
 const existing=vocabulary.find(x=>x.word.toLowerCase()===word.toLowerCase());if(existing){if(!confirm('This word exists. Update its meaning and example sentence?'))return;existing.meaning=meaning;existing.sentence=sentence}
 else vocabulary.push({id:'word-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),word,meaning,sentence,topicId:currentVocabContext(),createdAt:new Date().toISOString()});
 save('vocabulary',vocabulary);$('vocabDialog').close();if(!$('vocabOverlay').classList.contains('hidden')){vocabIndex=vocabulary.length-1;vocabRevealed=false;renderVocabulary()}else if(screen==='home')home();else if(screen==='architecture')catalog();
});
$('cancelVocab').onclick=()=>$('vocabDialog').close();
$('addSelectedWord').addEventListener('pointerdown',e=>e.preventDefault());$('addSelectedWord').onclick=()=>openWordEditor(selectedWord||getSelectedLessonWord());
function getSelectedLessonWord(){const sel=window.getSelection();const txt=sel?.toString().trim()||'';const anchor=sel?.anchorNode?.parentElement;return txt.length<=120&&anchor?.closest('#slide')?txt:''}
// Selection can originate from lesson text, catalog or flashcard answer.
document.addEventListener('selectionchange',()=>{if($('vocabDialog').open)return;const sel=window.getSelection();const value=sel?sel.toString().trim():'';const parent=sel?.anchorNode?.parentElement;const eligible=parent?.closest('#slide,#flashFace,#app');if(value&&value.length<=120&&eligible){selectedWord=value;$('selectionTools').classList.remove('hidden')}else $('selectionTools').classList.add('hidden')});
$('researchFromSlide').onclick=()=>openTopicResources('research');$('topicVocabFromSlide').onclick=()=>openTopicResources('words');$('resourceBack').onclick=closeTopicResources;$('resourceClose').onclick=closeTopicResources;$('resourceResearch').onclick=()=>{resourceMode='research';renderTopicResources()};$('resourceWords').onclick=()=>{resourceMode='words';renderTopicResources()};$('resourceContent').addEventListener('click',e=>{const btn=e.target.closest('[data-suggest-word]');if(btn)addSuggestedWord(Number(btn.dataset.suggestWord))});$('viewDictionaryFromSlide').onclick=()=>openVocabulary(true);$('vocabToggle').onclick=()=>{vocabListMode=!vocabListMode;renderVocabulary()};$('vocabSearch').oninput=renderDictionaryList;let pendingWordDeletion=null;
function dismissWordDeletion(){pendingWordDeletion=null;$('deleteWordConfirm').classList.add('hidden')}
$('cancelDeleteWord').onclick=dismissWordDeletion;
$('deleteWordConfirm').addEventListener('click',e=>{if(e.target.id==='deleteWordConfirm')dismissWordDeletion()});
$('confirmDeleteWord').onclick=()=>{
 if(!pendingWordDeletion)return;
 const index=vocabulary.findIndex(v=>v.id===pendingWordDeletion.id);
 if(index>=0){const [removed]=vocabulary.splice(index,1);delete vocabRatings[removed.id];save('vocabulary',vocabulary);save('vocabRatings',vocabRatings);vocabIndex=Math.min(vocabIndex,Math.max(0,vocabulary.length-1));}
 dismissWordDeletion();renderDictionaryList();
};
$('vocabEntries').onclick=e=>{
 const del=e.target.closest('[data-delete-word]');
 if(del){
  const index=Number(del.dataset.deleteWord),entry=vocabulary[index];
  if(!entry)return;
  pendingWordDeletion={id:entry.id};
  $('deleteWordDescription').textContent=`Remove “${entry.word}” from your dictionary? Its vocabulary review history will also be removed.`;
  $('deleteWordConfirm').classList.remove('hidden');
  $('cancelDeleteWord').focus();
  return;
 }
 const b=e.target.closest('[data-review-word]');if(!b)return;
 vocabIndex=Number(b.dataset.reviewWord);vocabRevealed=false;vocabListMode=false;renderVocabulary()
};$('vocabClose').onclick=closeVocabulary;$('vocabBack').onclick=closeVocabulary;$('vocabAdd').onclick=()=>openWordEditor();$('vocabExport').onclick=exportProgress;
$('vocabPrev').onclick=()=>{vocabIndex=Math.max(0,vocabIndex-1);vocabRevealed=false;renderVocabulary()};$('vocabNext').onclick=()=>{vocabIndex=Math.min(vocabulary.length-1,vocabIndex+1);vocabRevealed=false;renderVocabulary()};
$('vocabRatings').addEventListener('click',e=>{const b=e.target.closest('[data-vocab-rating]');if(b)rateVocabulary(b.dataset.vocabRating)});
$('flashRatings').addEventListener('click',e=>{const r=e.target.closest('[data-rating]');if(r)rate(r.dataset.rating)});
$('flashPrev').onclick=()=>{cardIndex=Math.max(0,cardIndex-1);revealed=false;renderReview()};
$('flashNext').onclick=()=>{cardIndex=Math.min(review.length-1,cardIndex+1);revealed=false;renderReview()};
$('flashClose').onclick=closeReview;
$('flashBack').onclick=closeReview;
$('flashFullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.()};
$('flashExport').onclick=exportProgress;
$('app').addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.topic){openTopic(b.dataset.topic);return}if(b.dataset.company){company=b.dataset.company;catalog();return}if(b.dataset.rating){rate(b.dataset.rating);return}switch(b.dataset.action){case'home':home();break;case'coding':catalog('coding');break;case'architecture':catalog();break;case'review':startReview('sd-001');break;case'vocabulary':openVocabulary(true);break;case'flip':revealed=!revealed;renderReview();break;case'cardprev':cardIndex=Math.max(0,cardIndex-1);revealed=false;renderReview();break;case'cardnext':cardIndex=Math.min(review.length-1,cardIndex+1);revealed=false;renderReview();break;case'export':exportProgress();break;case'import':importProgress();break;}});
$('prev').onclick=()=>changeSlide(-1);$('next').onclick=()=>changeSlide(1);$('close').onclick=closePresentation;$('closeTop').onclick=closePresentation;$('larger').onclick=()=>{zoom=Math.min(160,zoom+10);renderSlide()};$('smaller').onclick=()=>{zoom=Math.max(70,zoom-10);renderSlide()};$('widen').onclick=()=>{wide=!wide;renderSlide()};$('full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.()};$('pointer').onclick=()=>{pointer=!pointer;$('slideScroll').style.cursor=pointer?'crosshair':'auto'};$('flashFromSlide').onclick=()=>startReview(topic.id);$('addWordFromSlide').onclick=()=>openWordEditor(selectedWord||getSelectedLessonWord());
document.addEventListener('keydown',e=>{if($('vocabDialog').open)return;if(!$('resourceOverlay').classList.contains('hidden')){if(e.key==='Escape'&&!document.fullscreenElement)closeTopicResources();return;}if(!$('vocabOverlay').classList.contains('hidden')){if(vocabListMode)return;if(e.key==='ArrowRight'){$('vocabNext').click();e.preventDefault()}else if(e.key==='ArrowLeft'){$('vocabPrev').click();e.preventDefault()}else if(e.key===' '){vocabRevealed=!vocabRevealed;renderVocabulary();e.preventDefault()}else if(e.key==='Escape'&&!document.fullscreenElement)closeVocabulary();return;}if(!$('flashOverlay').classList.contains('hidden')){if(e.key==='ArrowRight'){e.preventDefault();$('flashNext').click()}else if(e.key==='ArrowLeft'){e.preventDefault();$('flashPrev').click()}else if(e.key===' '){e.preventDefault();revealed=!revealed;renderReview()}else if(e.key==='Escape'&&!document.fullscreenElement){closeReview()}return;}if($('presentation').classList.contains('hidden'))return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='Escape'){if(!document.fullscreenElement)closePresentation()}else if(e.key==='ArrowRight'){e.preventDefault();changeSlide(1)}else if(e.key==='ArrowLeft'){e.preventDefault();changeSlide(-1)}else if(e.key==='Home'){slideIndex=0;renderSlide()}else if(e.key==='End'){slideIndex=lesson.slides.length-1;renderSlide()}else if(e.key.toLowerCase()==='f'){$('full').click()}else if(e.key==='+'){$('larger').click()}else if(e.key==='-'){$('smaller').click()}});
home();})();
