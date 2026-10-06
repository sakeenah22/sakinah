/* «مرشد سكينة» — floating guide + panel. All religious answers go through assistantService (Evidence Gate). */
(function(SK){
  const t = (k,v) => SK.t(k,v);
  const h = SK.h, ui = SK.ui, I = SK.ui.icons;
  const G = () => SK.services.guideContext, A = () => SK.services.assistantService;

  /* Guide mark: a pointed Islamic arch holding a lantern whose light radiates (guidance · calm · knowledge). */
  SK.ui.guideIcon = (size=40, cls='') => h('span',{class:'guide-mark '+cls, 'aria-hidden':'true', html:
    `<svg viewBox="0 0 48 48" width="${size}" height="${size}">
      <path d="M8 45V22C8 12.5 15.5 6 24 3c8.5 3 16 9.5 16 19v23" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M12.5 45V23.2c0-6.6 4.9-11.4 11.5-14 6.6 2.6 11.5 7.4 11.5 14V45" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".4"/>
      <path d="M24 9.5v4.2" stroke="#C9A45C" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="24" cy="14.6" r="1.1" fill="none" stroke="#C9A45C" stroke-width="1.2"/>
      <path d="M20.6 19.2 24 15.9l3.4 3.3z" fill="#C9A45C"/>
      <path d="M20.2 19.7h7.6l1.6 3v8.4l-1.6 3h-7.6l-1.6-3v-8.4z" fill="#C9A45C"/>
      <path d="M22.1 22.2h3.8v9.4h-3.8z" fill="#FFF8E6"/><path d="M24 22.2v9.4M22.1 26.9h3.8" stroke="#C9A45C" stroke-width=".9"/>
      <path d="M22.6 34.6h2.8L24 37.4z" fill="#C9A45C"/>
      <g class="gm-light" fill="none" stroke="#C9A45C" stroke-width="1.4" stroke-linecap="round" opacity=".85">
        <path d="M15.6 22.6a10.5 10.5 0 0 0 0 9.4"/><path d="M32.4 22.6a10.5 10.5 0 0 1 0 9.4"/>
        <path d="M12.9 20.4a14 14 0 0 0 0 13.8" opacity=".5"/><path d="M35.1 20.4a14 14 0 0 1 0 13.8" opacity=".5"/></g>
    </svg>`});

  const SHOW_ON = new Set(['worship','journey','explain','insight','check','pre','result','quick','welcome','soon','haram','haramTopics','haramHelp','haramLearn','haramDone','haramQuiz']);
  const ASSESS = new Set(['pre','check','analyzing','post']);
  const isDemo = () => { try{ return localStorage.getItem('sk:demo') === '1'; }catch(e){ return false; } };
  const B = () => SK.services.guideBrain;

  function fab(){ return h('button',{class:'guide-fab', 'aria-label':t('gd.open'), onclick:openGuide}, SK.ui.guideIcon(30), h('span',{}, t('gd.name'))); }
  // conversation of this visit only (not stored in the card)
  const session = { messages:[], memory:{ topic:null, lastConcept:null, lastAnswered:false }, size:'medium' };
  // language changed while the guide is open → rebuild its chrome and suggestions in the new language at once
  let guideLang = null;
  SK.store.subscribe(st => { if (guideLang && st.lang !== guideLang){ guideLang = st.lang; relocalize(); if (dlg && dlg.open){ dlg.close(); openGuide(); } } else guideLang = st.lang; });
  SK.guide = { mount(route){ document.querySelectorAll('.guide-fab').forEach(x=>x.remove()); if (SHOW_ON.has(route)) document.body.append(fab()); }, session };

  /* ---------- chat panel ---------- */
  let dlg = null, threadEl = null, chipsEl = null, inputEl = null, statusEl = null, profile = null, ctx = null;
  const SIZES = ['collapsed','medium','full'];
  function setSize(sz){ session.size = sz; if (dlg){ SIZES.forEach(x => dlg.classList.toggle('size-'+x, x===sz)); } }
  function openGuide(){
    if (!dlg){ dlg = h('dialog',{class:'sheet guide-sheet', 'aria-labelledby':'guide-title'}); document.body.append(dlg); dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); }
    profile = B().loadProfileContext(); ctx = profile.context; ctx.progressPercent = profile.progressPercent;
    threadEl = h('div',{class:'g-thread', 'aria-live':'polite'});
    chipsEl = h('div',{class:'g-chips'});
    inputEl = h('textarea',{class:'g-input', rows:'1', placeholder:t('gd.placeholder'), 'aria-label':t('gd.inputLabel')});
    inputEl.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } });
    inputEl.addEventListener('input', () => { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(inputEl.scrollHeight, 96) + 'px'; });
    // composer: [🎤] [input] [➤] — while listening it becomes [■] «جاري الاستماع...»
    let rec = null;
    const mic = h('button',{class:'g-round g-mic', 'aria-label':t('gd.voice')}, ui.svg(I.mic));
    const sendBtn = h('button',{class:'g-round g-send', 'aria-label':t('common.send'), onclick:()=>send()}, '➤');
    const normal = h('div',{class:'g-composer'}, mic, inputEl, sendBtn);
    const stop = h('button',{class:'g-round g-stop', 'aria-label':t('gd.stop'), onclick:()=>{ if (rec) rec.stop(); else setListening(false); }}, h('span',{class:'g-stop-sq', 'aria-hidden':'true'}));
    const listening = h('div',{class:'g-composer g-listening', hidden:true, role:'status'}, stop, h('span',{class:'g-listen-text'}, t('gd.listening')), h('span',{class:'g-wave', 'aria-hidden':'true'}, h('i'), h('i'), h('i')));
    const setListening = on => { normal.hidden = on; listening.hidden = !on; if (!on) inputEl.focus({preventScroll:true}); };
    SK.guide._setListening = setListening;
    mic.onclick = () => {
      if (!SK.services.speech.canListen){ SK.toast(t('gd.noVoice')); inputEl.focus(); return; }
      setListening(true);
      rec = SK.services.speech.listen({ onText:t=>{ inputEl.value=t; }, onEnd:()=>{ rec=null; setListening(false); if (inputEl.value.trim()) send(); }, onError:()=>{ rec=null; setListening(false); SK.toast(t('gd.voiceFail')); } });
    };
    // one-line progress badge instead of the big card
    const knowsBadge = profile.savedJourney && ctx.currentScreen !== 'unavailable_journey'
      ? h('button',{class:'g-knows', onclick:()=>ui.sheet(t('gd.where'), h('p',{}, t('gd.youAreIn'), h('b',{}, t('common.janazah'))), h('p',{}, t('gd.progress'), h('b',{}, profile.progressPercent + '%')),
          h('p',{}, t('gd.lastLearned'), h('b',{}, profile.lastCompletedStep ? B().conceptTitle(profile.lastCompletedStep) : t('gd.noneYet'))))}, h('span',{class:'g-dot', 'aria-hidden':'true'}), t('gd.knows'))
      : null;
    dlg.replaceChildren(
      h('header',{class:'g-header'},
        h('div',{class:'g-id'}, SK.ui.guideIcon(34,'is-glow'), h('div',{class:'g-id-text'}, h('h2',{id:'guide-title'}, t('gd.name')),
          h('p',{class:'g-sub'}, knowsBadge ? knowsBadge : h('span',{}, t('gd.sub'))))),
        h('div',{class:'g-actions'}, h('button',{class:'g-close', 'aria-label':t('voice.settings'), onclick:()=>SK.ui.voiceSettings()}, ui.svg(I.settings)), h('button',{class:'g-close', 'aria-label':t('common.close'), onclick:()=>dlg.close()}, ui.svg(I.close)))),
      threadEl,
      h('div',{class:'g-bottom'}, chipsEl, normal, listening));
    if (!session.messages.length){ const inTest = ASSESS.has(ctx.route); session.messages.push({ role:'bot', node:null, text: inTest ? t('gd.inTest') : greeting(), remake: () => ({ text: inTest ? t('gd.inTest') : greeting(), node:null }) }); }
    renderThread(); renderChips();
    dlg.showModal(); inputEl.focus({preventScroll:true});
    SK.services.retrieval.logEvent('GUIDE_OPENED', { screen:ctx.currentScreen, journey:ctx.journeyId, concept:ctx.currentConcept });
  }
  function greeting(){
    if (ctx.currentScreen === 'unavailable_journey') return t('gd.greetSoon');
    if (ctx.currentConcept) return t('gd.greetAt',{c:B().conceptTitle(ctx.currentConcept)});
    if (profile.status === 'in_progress') return t('gd.greetUnfinished');
    return t('gd.greet');
  }
  function renderChips(){
    const lt = session.lastTurn;
    const sugs = (lt && lt.route === ctx.route) ? B().getFollowUps(lt, profile, ctx) : B().getAdaptiveSuggestions(profile, ctx, session.memory);
    chipsEl.replaceChildren(...sugs.map((sg,i) => h('button',{class:'g-chip'+(i===0?' is-first':''), onclick:()=>send(sg.label, sg)}, sg.label)));
  }
  function bubble(m, i, all){
    if (m.role === 'user') return h('div',{class:'g-msg g-user'}, h('p',{}, m.text));
    const first = i === 0 || all[i-1].role !== 'bot';
    const body = m.node || h('p',{}, m.text);
    return h('div',{class:'g-msg g-bot'+(first?' is-first':'')}, first ? h('span',{class:'g-avatar', 'aria-hidden':'true'}, SK.ui.guideIcon(20)) : h('span',{class:'g-avatar-gap', 'aria-hidden':'true'}),
      h('div',{class:'g-bot-body'}, body, m.demo && isDemo() ? h('pre',{class:'guide-demo', dir:'ltr'}, m.demo) : null));
  }
  function renderThread(){ threadEl.replaceChildren(...session.messages.map(bubble)); requestAnimationFrame(()=>{ threadEl.scrollTop = threadEl.scrollHeight; }); }
  let pendingTurn = null, pendingRemake = null;   // pendingRemake: rebuilds a reply in the current language
  // re-create replies that can be rebuilt (greeting, source-grounded answers) after a language change
  function relocalize(){ session.messages.forEach(m => { if (m.remake){ try{ const r = m.remake(); m.text = r.text; m.node = r.node; }catch(e){} } }); }   // what the reply that is being produced is about (drives the follow-ups)
  function botSay(text, node, demo, turn){
    session.lastTurn = { ...(pendingTurn||{}), ...(turn||{}), route: ctx.route };
    pendingTurn = null;
    const remake = pendingRemake; pendingRemake = null;
    session.messages.push({ role:'bot', text, node, demo, remake }); renderThread(); renderChips(); }

  /* ---------- one message through the intent router ---------- */
  function send(q, sug){
    const text = (q ?? inputEl.value).trim(); if (!text) return; inputEl.value = ''; inputEl.style.height = '';
    session.messages.push({ role:'user', text }); renderThread();
    profile = B().loadProfileContext(); ctx = profile.context;
    const mem = session.memory;
    let intent = sug ? sug.intent : B().classifyIntent(text, mem);
    const demoBase = a => [`Detected Intent: ${intent}`, `Mode: ${ctx.mode||'normal'} · priority: ${ctx.priority||'learning'}`, `Current Screen: ${ctx.currentScreen}`, `Current Journey: ${ctx.journeyId || '—'}`, `Current Concept: ${ctx.currentConcept || profile.currentStep || '—'}`, `Progress Loaded: ${profile.savedJourney ? profile.progressPercent+'%' : '—'} (${profile.cardId ? 'card' : 'guest session'})`, `Suggested Action: ${a}`].join('\n');
    pendingTurn = { userText:text, intent };
    if (sug && sug.kind) return followUp(sug, text, demoBase);
    if (ASSESS.has(ctx.route) && intent !== 'NAVIGATION'){ botSay(t('gd.blocked'), null, demoBase('BLOCKED_DURING_ASSESSMENT')); return; }
    if (intent === 'NAVIGATION') return doNav(sug && sug.action ? sug.action : navAction(text), sug, demoBase);
    if (intent === 'GENERAL_ASSISTANCE') return botSay(t('gd.help'), null, demoBase('HELP_TEXT'));
    if (intent === 'UNKNOWN') return botSay(t('gd.unknown'), null, demoBase('ASK_CLARIFY'));
    // content intents → guide engine (understand → retrieve → evidence guard → answer)
    const E = SK.services.guideEngine, n = SK.services.understanding.normalizeArabic(text);
    // context: the concept of this conversation (same screen) comes first, then the screen's own step
    const convConcept = (mem.route === ctx.route && mem.lastConcept) ? mem.lastConcept : null;
    const prior = convConcept || ctx.currentConcept || profile.currentStep;
    const u = E.understand(text, { ...ctx, currentTopic:ctx.journeyId }, { topicId:mem.topicId });
    const selfContained = u.ord || u.intent !== 'ask_info' || u.topicFrom === 'question';   // the question names what it is about
    if (intent === 'SOURCE_REQUEST' && !(selfContained && !/(مصدر|source|kaynak|ماخذ)/.test(n.split(' ').slice(0,3).join(' ')) && u.ord)){
      const cid = prior && E.claimOfConcept(prior);
      if (!cid) return botSay(t('gd.whichSource'), null, demoBase('ASK_WHICH'));
      return engineReply(text, { force:{ claimId:cid }, sourceOpen:true, kind:'source' }, demoBase);
    }
    const isNext = /(بعدها|بعده|التاليه|الجايه|what next|next|after it|and after|then what|sonra ne|ondan sonra|اس کے بعد|اگلا)/.test(n) && !u.ord;
    const isSimpler = /(ابسط|simpl|basit|آسان)/.test(n);
    if ((intent === 'LEARNING_HELP' || isNext || isSimpler) && !(selfContained && !isNext && !isSimpler)){
      // «بعدها» after an answer in this chat = the next step; on a learning screen with no chat yet = this step's action
      const cid = isNext ? (convConcept ? E.nextClaim(convConcept) : (prior && E.claimOfConcept(prior))) : (prior && E.claimOfConcept(prior));
      if (cid) return engineReply(text, { force:{ claimId:cid }, simple:isSimpler, kind:'explain_step' }, demoBase);
      if (isNext && prior) return botSay(t('gd.lastStep'), null, demoBase('LAST_STEP'), { kind:'general', concept:prior });
    }
    const fu = B().rewriteFollowUp(text, mem);                     // «وبعد الثانية؟» → explicit question (understanding only)
    return engineReply(fu ? fu.query : ((sug && sug.query) || text), { kind:'supported' }, demoBase);
  }
  /** one call to the engine, one reply bubble; conversation memory is used only to understand */
  function engineReply(question, opts, demoBase){
    const mem = session.memory, E = SK.services.guideEngine;
    const res = E.answer(question, { ctx:{ ...ctx, currentTopic: ctx.journeyId }, memory:{ topicId: mem.topicId }, lang: SK.i18n.lang(), force: opts.force });
    if (res.status === 'SUPPORTED'){ if (res.concept) mem.lastConcept = res.concept; mem.topicId = 'funeral_prayer'; mem.topic = B().topicOf(mem.lastConcept) || mem.topic; }
    mem.lastAnswered = res.status === 'SUPPORTED'; mem.route = ctx.route;
    const d = res.diag;
    const demo = demoBase(`ENGINE · ${res.status}`) + `\ndetectedIntent: ${d.detectedIntent}\ndetectedTopic: ${d.detectedTopic}\nretrievalQueries: ${d.retrievalQueries.join(' | ')}\nsourcesSearched: ${d.sourcesSearched.join(' → ')}\nevidenceFound: ${d.evidenceFound.join(', ') || '—'}\nevidenceAccepted: ${d.evidenceAccepted || '—'}\nrejectionReason: ${d.rejectionReason || '—'}`;
    const kind = res.status !== 'SUPPORTED' ? 'refused' : (opts.kind === 'source' ? 'source' : 'engine');
    pendingRemake = () => ({ text:null, node: engineNode(E.answer(question, { ctx:{ ...ctx, currentTopic: ctx.journeyId }, memory:{ topicId:'funeral_prayer' }, lang: SK.i18n.lang(), force: opts.force }), opts) });
    botSay(null, engineNode(res, opts), demo, { kind, concept: res.concept || mem.lastConcept, intent:'RELIGIOUS_QUESTION' });
  }
  function engineNode(res, opts = {}){
    const lang = SK.i18n.lang(), dir = SK.i18n.dir(), wrap = h('div',{class:'g-ans'});
    const say = (s) => h('p',{class:'g-answer', lang, dir}, s);
    if (res.status !== 'SUPPORTED'){
      wrap.append(h('p',{}, t('src.refusal')), h('p',{class:'g-muted'}, res.personal ? t('gd.noFatwa') : t('as.refuse2')));
      return wrap;
    }
    if (res.personal) wrap.append(h('p',{class:'g-muted'}, t('gd.noFatwaGeneral')));
    if (res.overview) wrap.append(h('ol',{class:'ans-points', lang, dir}, res.overview.map(x => h('li',{}, x))));
    else wrap.append(say(res.answer));
    if (res.simple && (opts.simple || !res.recitation)) wrap.append(h('p',{class:'g-muted', lang, dir}, res.simple));
    else if (res.simple && res.recitation) wrap.append(h('p',{class:'g-muted', lang, dir}, res.simple));
    if (res.recitation && !opts.simple){
      wrap.append(SK.ui.arabic(res.recitation, 'qc-recite g-recite'));
      const recEv = (res.evidence || []).find(e => e.evidenceText === res.recitation);
      if (SK.ui.RepeatAfterMe) wrap.append(SK.ui.RepeatAfterMe({ expectedText:res.recitation, audio: recEv && recEv.id, language:'ar', compact:true, context:'guide' }));
      if (lang !== 'ar') wrap.append(res.translation ? h('div',{class:'qc-meaning'}, h('span',{class:'qc-meaning-label'}, t('src.approvedMeaning')), h('p',{class:'qc-meaning-text', lang, dir}, res.translation.text), h('span',{class:'qc-meaning-src'}, res.translation.translator))
                                                     : h('p',{class:'qc-no-tr'}, t('src.noApprovedTranslation')));
    }
    if (res.note) wrap.append(h('p',{class:'qc-note', lang, dir}, res.note));
    const speakText = () => SK.services.speech.speakParts([{ text: res.overview ? res.overview.join(' ') : res.answer, lang }, res.recitation ? { kind:'religious', evidenceId:(res.evidence.find(e => e.evidenceText === res.recitation) || {}).id, text:res.recitation } : null]);
    const openSrc = () => SK.ui.evidenceSheet({ evidence: res.evidence, translation: res.translation });
    wrap.append(h('div',{class:'g-meta'}, h('span',{class:'g-verified'}, ui.svg(I.check), t('common.verified')),
      h('span',{class:'g-links'}, h('button',{class:'g-link', onclick:speakText}, t('common.listen')), h('button',{class:'g-link g-src-btn', onclick:openSrc}, ui.svg(I.book), t('common.showSource')))));
    if (opts.sourceOpen) setTimeout(openSrc, 60);
    return wrap;
  }
  const TOPIC_CONCEPT = { takbir_count:'takbir_count', after_first_takbir:'first_takbir', after_second_takbir:'second_takbir', after_third_takbir:'third_takbir', after_fourth_takbir:'fourth_takbir' };
  function recordConcept(res){ const id = res.retrieved[0] && res.retrieved[0].id; const rec = id && SK.services.knowledgeService.byId(id); return rec ? TOPIC_CONCEPT[rec.topic] || null : null; }
  function navAction(text){ const n = SK.services.understanding.normalizeArabic(text);
    if (/(وين|اين|where)/.test(n)) return 'where'; if (/مراجعه سريعه/.test(n)) return 'consolidate'; if (/اختبرني/.test(n)) return 'retest';
    if (/استمع/.test(n)) return 'haram_listen'; if (/(الرئيسيه|ارجع)/.test(n)) return 'home'; if (/الرحلات المتاحه/.test(n)) return 'available'; return 'resume'; }

  // sources of an assistant answer: the registry evidence its records point to (same sheet as everywhere)
  function sourceSheet(items){ SK.ui.evidenceSheet({ evidence: SK.services.knowledgeService.evidenceOf(items), translation:null }); }
  function answerNode(res, understoodQuery, opts={}){
    const wrap = h('div',{class:'g-ans'});
    if (res.evidenceStatus !== 'SUPPORTED'){
      wrap.append(h('p',{}, res.message[0]), h('p',{class:'g-muted'}, res.message[1])); return wrap;
    }
    const a = res.answer, items = a.citations;
    const short = a.short || a.text;
    const more = h('div',{class:'g-more', hidden:!opts.more}, a.points ? h('ol',{class:'ans-points', lang:'ar', dir:'rtl'}, a.points.map(p=>h('li',{}, p.text))) : ui.arabic(a.text, ''), a.gapNote ? h('p',{class:'g-muted'}, a.gapNote) : null);
    wrap.append(ui.arabic(short, 'g-answer'), more,
      h('div',{class:'g-meta'}, h('span',{class:'g-verified'}, ui.svg(I.check), t('common.verified')),
        h('span',{class:'g-links'}, h('button',{class:'g-link', onclick:()=>SK.services.speech.speak(more.hidden ? short : (a.text || short))}, t('common.listen')),
          h('button',{class:'g-link', onclick:()=>sourceSheet(items)}, t('common.source')), h('button',{class:'g-link', onclick:e=>{ more.hidden = !more.hidden; e.currentTarget.textContent = more.hidden ? t('common.more') : t('common.hide'); }}, opts.more ? t('common.hide') : t('common.more')))));
    if (opts.sourceOpen) setTimeout(() => sourceSheet(items), 60);
    return wrap;
  }

  /* ---------- navigation uses journey data only — no retrieval, no religious text ---------- */
  async function doNav(action, sug, demoBase){
    const demo = demoBase(action);
    const p = profile, j = SK.store.get().journey;
    const go = (route, opts) => { setTimeout(() => { if (dlg && dlg.open) dlg.close(); SK.router.go(route, opts); }, 650); };
    SK.services.retrieval.logEvent('GUIDE_NAVIGATION', { action });
    if (action === 'read'){ const q = document.querySelector('.question, .scenario-ask'); if (q) SK.services.speech.speak(q.textContent); return botSay(t('gd.readQ'), null, demo); }
    if (action === 'where'){
      if (!p.savedJourney) return botSay(t('gd.noJourney'), null, demo);
      const node = h('div',{}, h('p',{class:'guide-short'}, t('gd.inJourney')), h('p',{}, t('gd.progressN',{n:p.progressPercent})),
        p.currentStep ? h('p',{}, t('gd.nextPoint'), h('b',{}, B().conceptTitle(p.currentStep))) : h('p',{}, t('gd.journeyDone')));
      return botSay(null, node, demo, { kind:'nav_where' });
    }
    if (action === 'resume' || action === 'review' || action === 'retest'){
      if (!p.savedJourney){ botSay(t('gd.noSaved'), null, demo); SK.store.resetJourney(); return go('pre'); }
      if (action === 'resume') botSay(p.currentStep ? t('gd.continueFrom',{c:B().conceptTitle(p.currentStep)}) : t('gd.journeyFinished'), null, demo);
      else botSay(action==='retest' ? t('gd.retestIn',{c:B().conceptTitle(sug.concept)}) : t('gd.reviewIn',{c:B().conceptTitle(sug.concept)}), null, demo);
      if (SK.store.get().session && !j.analysis){ const r = await SK.services.progress.resume(); }
      const jj = SK.store.get().journey;
      if (jj.plan && jj.plan.length){
        const target = (action==='resume') ? jj.plan.findIndex(x => !(jj.results||{})[x.concept_id]) : jj.plan.findIndex(x => x.concept_id === (sug && sug.concept));
        if (target >= 0){ SK.store.journey({ step:target }); return go(action==='retest' ? 'check' : 'explain', {reset:true}); }
      }
      return go('result', {reset:true});
    }
    if (action === 'consolidate'){ botSay(t('gd.openQuick'), null, demo); return go('quick'); }
    if (action === 'remaining'){
      const left = (p.states ? Object.keys(p.states).filter(id => ['confused','missing'].includes(p.states[id]) && SK.services.understanding.ESSENTIAL.includes(id)) : []);
      if (!p.savedJourney) return botSay(t('gd.notStarted'), null, demo, { kind:'nav_where' });
      return botSay(null, h('div',{}, left.length ? h('p',{}, t('gd.remaining')) : h('p',{}, t('gd.nothingLeft')),
        left.length ? h('ul',{class:'dot-list'}, left.map(id => h('li',{}, B().conceptTitle(id)))) : null, h('p',{class:'muted'}, t('gd.progressN',{n:p.progressPercent}))), demo, { kind:'nav_where' });
    }
    if (action === 'next' || action === 'home'){ botSay(t('gd.toHome'), null, demo); return go('worship',{reset:true}); }
    if (action === 'haram_help'){ botSay(t('gd.guideNow'), null, demo); if (SK.haram){ SK.haram.state().topic='janaza'; SK.haram.state().step = SK.haram.state().step||0; } return go('haramHelp'); }
    if (action === 'haram_listen'){ const el = document.querySelector('.hm-info-text, .quick-list'); if (el){ SK.services.speech.speak(el.textContent); return botSay(t('gd.readExpl'), null, demo); } return botSay(t('gd.openStep'), null, demo); }
    if (action === 'available'){ return botSay(t('gd.available'), null, demo); }
    if (action === 'start'){ botSay(t('gd.startNow'), null, demo); SK.store.resetJourney(); return go('pre'); }
    return botSay(t('gd.navUnknown'), null, demo);
  }
  /* ---------- follow-up actions ---------- */
  const ORDER = ['takbir_count','first_takbir','second_takbir','third_takbir','fourth_takbir'];
  const nextOf = c => { const k = ORDER.indexOf(c); return k >= 0 && k < ORDER.length-1 ? ORDER[k+1] : null; };
  function followUp(sg, text, demoBase){
    const mem = session.memory, c = sg.concept || mem.lastConcept || ctx.currentConcept || profile.currentStep;
    const demo = demoBase('FOLLOW_UP:'+sg.kind+(c?':'+c:''));
    const askConcept = (concept, opts={}) => {
      const cid = SK.services.guideEngine.claimOfConcept(concept === 'takbir_count' && sg.kind==='next' ? 'first_takbir' : concept);
      if (cid) return engineReply(text, { force:{ claimId:cid }, simple:opts.simple, sourceOpen:opts.sourceOpen, kind: opts.kind === 'source' ? 'source' : 'explain_step' }, demoBase);
      const q = SK.services.guideContext.CONCEPT_QUERY[concept];
      if (!q) return botSay(t('gd.whichPoint2'), null, demo, { kind:'general' });
      const res = SK.services.assistantService.ask(q);
      mem.lastConcept = concept; mem.topic = B().topicOf(concept); mem.lastAnswered = res.evidenceStatus === 'SUPPORTED'; mem.route = ctx.route;
      const kind = res.evidenceStatus !== 'SUPPORTED' ? 'refused' : opts.kind || 'explain_step';
      botSay(null, answerNode(res, q, opts), demoBase(`FOLLOW_UP:${sg.kind} · RETRIEVAL→EVIDENCE_GATE · «${q}» · ${res.evidenceStatus}`), { kind, concept });
    };
    switch (sg.kind){
      case 'claim': return engineReply(text, { force:{ claimId:sg.claimId }, kind:'explain_step' }, demoBase);
      case 'overview': return engineReply('اشرح صلاة الجنازة خطوة بخطوة', { kind:'supported' }, demoBase);
      case 'next': { const n = nextOf(c); if (!n) return botSay(t('gd.lastStep'), null, demo, { kind:'general', concept:c }); return askConcept(n); }
      case 'simpler': return askConcept(c, { simple:true });
      case 'more': return askConcept(c, { more:true, kind:'supported' });
      case 'source': return askConcept(c, { sourceOpen:true, kind:'source' });
      case 'back': return askConcept(c);
      case 'quiz': case 'quiz_repeat': case 'quiz_next': {
        const target = sg.kind === 'quiz_next' ? (nextOf(c) || null) : c;
        const bank = target && SK.data.questions[target];
        if (!bank || !bank.length) return botSay(sg.kind==='quiz_next' ? t('gd.quizDone') : t('gd.noQuestion'), null, demo, { kind:'general', concept:c });
        mem.quizN = (mem.quizN||0) + (sg.kind==='quiz_repeat' ? 0 : 1);
        const q = bank[sg.kind==='quiz_repeat' ? (mem.quizIdx||0) : (mem.quizIdx = (mem.quizN-1) % bank.length)];
        return botSay(null, quizNode(q, target), demo, { kind:'quiz_open', concept:target, question:q.id });
      }
      case 'quiz_explain': return askConcept(c, { kind:'explain_step' });
      case 'review': {
        const jj = SK.store.get().journey; const k = jj.plan ? jj.plan.findIndex(x => x.concept_id === c) : -1;
        if (k >= 0){ botSay(t('gd.reviewInJourney',{c:B().conceptTitle(c)}), null, demo, { kind:'nav' }); SK.store.journey({ step:k }); setTimeout(()=>{ if (dlg && dlg.open) dlg.close(); SK.router.go('explain',{reset:true}); }, 650); return; }
        return askConcept(c);
      }
      case 'remaining': return doNav('remaining', sg, demoBase);
    }
    return botSay(t('gd.notUnderstood'), null, demo, { kind:'general' });
  }
  function quizNode(q, concept){
    const box = h('div',{}, h('p',{class:'guide-short'}, q.q));
    const opts = h('div',{class:'g-quiz'}, q.options.map(([text, ok]) => h('button',{class:'option', onclick:()=>{
      if (opts.dataset.done) return; opts.dataset.done = '1';
      session.messages.push({ role:'user', text }); renderThread();
      pendingTurn = { userText:text, intent:'QUIZ' };
      if (ok) botSay(t('gd.quizRight'), null, null, { kind:'quiz_right', concept });
      else botSay(t('gd.quizWrong'), null, null, { kind:'quiz_wrong', concept, choice:text });
    }}, h('span',{class:'option-dot', 'aria-hidden':'true'}), h('span',{class:'option-text'}, text))));
    box.append(opts); return box;
  }
  SK.guide.open = openGuide; SK.guide.send = (t) => send(t);
})(window.SK);
