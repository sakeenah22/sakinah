/* ===================== وضع الحرم — Haram Mode =====================
   Fewest steps, clearest content, fastest access. Turned on MANUALLY by the user (no GPS, no location detection).
   Uses ONLY content that already exists: the journey's knowledge base and the verified assistant records.
   Future enhancement (not built): location-aware activation. */
(function(SK){
  const t = (k,v) => SK.t(k,v);
  const h = SK.h, ui = SK.ui, I = SK.ui.icons, D = SK.data, S = SK.screens;
  const go = (r,o) => SK.router.go(r,o);
  const say = t => SK.services.speech.speak(t);
  const KS = () => SK.services.knowledgeService;
  const st = () => SK.store.get();
  const hm = () => (st().haram = st().haram || { topic:null, step:0, simple: (()=>{ try{ return localStorage.getItem('sk:haramSimple')==='1'; }catch(e){ return false; } })() });

  // topics that really exist in Sakeenah's knowledge base today
  const TOPICS = () => D.worships.filter(w => w.ready).map(w => ({ id:w.id, name:w.name }));
  // quick guidance steps for the funeral prayer — content and sources from TrustedSourcesRegistry only
  const STEP_LABEL_ = () => ({ takbir_count:t('hm.before'), first_takbir:t('concept.first_takbir'), second_takbir:t('concept.second_takbir'), third_takbir:t('concept.third_takbir'), fourth_takbir:t('concept.fourth_takbir') });
  const STEPS = ['takbir_count','first_takbir','second_takbir','third_takbir','fourth_takbir'];
  const stepContent = concept => SK.sources.forConcept(concept);
  SK.haram = { STEPS, stepContent, state: hm };

  /* ---------- shared top bar: voice · language · simple UI ---------- */
  function topBar(){
    const lang = (D.languages.find(l => l.code === st().lang) || D.languages[0]);
    const back = st().history.length ? h('button',{class:'icon-btn hm-back', 'aria-label':t('common.back'), onclick:()=>SK.router.back()}, ui.svg(I.back)) : h('span',{class:'icon-spacer'});
    const langBtn = h('button',{class:'hm-chip', 'aria-label':t('lang.change'), onclick:openLang}, ui.svg(I.globe), h('span',{}, lang.native));
    return h('header',{class:'ql-head'}, h('div',{class:'ql-head-row'}, back, langBtn),
      h('p',{class:'ql-title'}, t('ql.title')), h('p',{class:'ql-sub'}, t('ql.sub')));
  }
  function applySimple(){ document.documentElement.classList.remove('haram-simple'); }
  function openLang(){
    const note = h('p',{class:'hint'});
    ui.sheet(t('lang.title'), h('div',{class:'lang-grid'}, D.languages.map(l => h('button',{class:'lang-card', role:'radio', 'aria-checked':String(l.code===st().lang), lang:l.code, dir:l.dir, onclick:()=>{
      note.textContent = l.ready ? '' : t('hm.langNote'); if (l.ready){ SK.i18n.setLang(l.code); document.getElementById('sheet').close(); SK.router.go(st().route,{replace:true}); }
      else document.querySelectorAll('#sheet .lang-card').forEach(x => x.setAttribute('aria-checked', String(x.getAttribute('lang')===l.code))); }},
      h('span',{class:'lang-badge'}, l.badge), h('span',{class:'lang-name'}, l.native), l.ready ? null : h('span',{class:'lang-soon'}, t('common.soon'))))), note);
  }

  /* ---------- voice first: «قل ما تحتاجه» ---------- */
  function routeSpoken(text){
    const n = SK.services.understanding.normalizeArabic(text);
    if (/جناز|ميت/.test(n) && n.split(' ').length <= 3){ hm().topic='janaza'; hm().step=0; return go('haramHelp'); }
    if (/(كمل|اكمل|نكمل|رحلتي|وين وقفت)/.test(n) && hasJourney()) return resume();
    if (/(تعلم|خلاصه|مراجعه)/.test(n)) return go('haramLearn');
    if (/(مساعده|ساعدني|محتاج)/.test(n) && n.split(' ').length <= 3) return go('haramTopics');
    SK.guide.open(); setTimeout(() => SK.guide.send(text), 120);      // a question goes to the full chat (evidence-gated)
  }
  function voiceCommand(){
    if (SK.services.speech.canListen){
      let heard = '';
      const s = ui.sheet(t('common.listening'), h('p',{class:'muted'}, t('hm.sayHint')));
      SK.services.speech.listen({ onText:t => { heard = t; }, onEnd:() => { const d = document.getElementById('sheet'); if (d && d.open) d.close(); if (heard.trim()) routeSpoken(heard); },
        onError:() => demoVoice() });
      return;
    }
    demoVoice();
  }
  // clear demo fallback when the browser has no speech recognition (e.g. inside the preview)
  function demoVoice(){
    const phrases = [[t('common.janazah'),'صلاة الجنازة'],[t('sg.whatNow'),'وش أسوي الآن؟'],[t('sg.countQ'),'كم عدد تكبيرات صلاة الجنازة؟']];
    ui.sheet(t('hm.demoTitle'), h('p',{class:'muted'}, t('hm.demoText')),
      h('div',{class:'stack'}, phrases.map(([label, value]) => ui.button('🎙 «'+label+'»',{variant:'ghost', onclick:()=>{ document.getElementById('sheet').close(); routeSpoken(value); }}))));
  }

  const savedJourney = () => SK.services.progress.saved();
  const hasJourney = () => { const sj = savedJourney(); if (sj && sj.status === 'in_progress') return true; const j = st().journey; return !!(j.analysis && j.stage !== 'done' && j.stage !== 'idle'); };
  async function resume(){
    if (st().session && savedJourney()){ const r = await SK.services.progress.resume(); return go(r==='explain' ? 'explain' : r==='done' ? 'result' : 'pre', {reset:true}); }
    const j = st().journey; if (j.analysis && j.plan && j.plan.length){ const k = j.plan.findIndex(p => !(j.results||{})[p.concept_id]); if (k >= 0){ SK.store.journey({ step:k }); return go('explain',{reset:true}); } }
    return go('pre');
  }
  const big = (title, sub, icon, onclick, cls='') => h('button',{class:'hm-big '+cls, onclick}, h('span',{class:'hm-big-ico'}, icon), h('span',{}, h('b',{}, title), h('small',{class:'hm-secondary'}, sub)));

  /* ---------- 2. «ماذا تحتاج الآن؟» ---------- */
  S.haram = () => {
    applySimple();
    const sess = st().session; const sj = savedJourney();
    const card = sess ? SK.services.storage.loadProfile(sess.cardId) : null;
    const welcome = sess ? ui.card('hm-welcome', h('p',{class:'hm-welcome-title'}, t('common.welcomeBack') + (card && card.card.displayName ? (SK.i18n.dir()==='rtl' ? '، ' : ', ') + card.card.displayName : '')),
      sj && sj.status === 'in_progress' ? h('div',{}, h('p',{}, t('hm.unfinished')), ui.button(t('hm.continueFrom'),{variant:'ghost', onclick:resume})) : null) : null;
    return h('section',{class:'screen hm-screen'}, topBar(), welcome,
      h('h1',{class:'hm-title', id:'screen-title'}, t('hm.title')),
      h('div',{class:'hm-options'},
        big(t('hm.help'),t('hm.helpSub'), svgHand(), ()=>go('haramTopics'), 'is-primary'),
        big(t('hm.learn'),t('hm.learnSub'), ui.svg(I.bolt), ()=>go('haramTopics')),
        hasJourney() ? big(t('hm.resume'),t('hm.resumeSub'), ui.svg(I.path), resume) : null),
      !sess ? h('button',{class:'link-btn small hm-secondary', onclick:()=>go('scan')}, ui.svg(I.qr), t('hm.haveCard')) : null);
  };
  const svgHand = () => h('span',{class:'ico', html:'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/></svg>'});

  /* ---------- 3. Quick Help: choose a topic that exists ---------- */
  /* ---------- Quick learning: choose a topic that exists ---------- */
  S.haramTopics = () => { applySimple();
    return h('section',{class:'screen hm-screen'}, topBar(), h('h1',{class:'hm-title', id:'screen-title'}, t('ql.chooseTopic')),
      h('div',{class:'hm-options'}, TOPICS().map(tp => big(tp.name, t('hm.stepByStep'), ui.svg(I.book), ()=>{ hm().topic = tp.id; hm().step = 0; go('haramHelp'); }))),
      h('p',{class:'muted center hm-secondary'}, t('hm.topicsNote')));
  };

  const TITLE_KEY = { takbir_count:'concept.takbir_count', first_takbir:'ql.after1', second_takbir:'ql.after2', third_takbir:'ql.after3', fourth_takbir:'ql.after4' };
  // the facts shown in quick learning (one per screen), in order — all taken from the existing knowledge base
  const QUICK_FACTS = { janaza: STEPS };

  /* ---------- explainer video in a simple sheet (play/pause, captions in the interface language) ---------- */
  function openVideo(v){
    const lang = SK.i18n.lang();
    const video = h('video',{class:'ql-video', playsinline:true, preload:'metadata'}, ...(v.sources || [{ src:v.src }]).map(x => h('source',{ src:x.src, type:x.type || null })));
    Object.entries(v.captions || {}).forEach(([l, src]) => { const tr = h('track',{kind:'subtitles', src, srclang:l, label:(D.languages.find(x=>x.code===l)||{native:l}).native}); if (l === lang) tr.default = true; video.append(tr); });
    let subsOn = true;
    const applySubs = () => { [...video.textTracks].forEach(tt => { tt.mode = subsOn && tt.language === lang ? 'showing' : 'hidden'; }); subBtn.setAttribute('aria-pressed', String(subsOn)); subBtn.classList.toggle('is-on', subsOn); };
    const play = h('button',{class:'ql-play', 'aria-label':t('ql.play')}, '▶');
    const playBtn = h('button',{class:'vc-btn'}, '▶ ', h('span',{}, t('ql.play')));
    const sync = () => { const p = video.paused; play.hidden = !p; playBtn.replaceChildren(p ? '▶ ' : '❚❚ ', h('span',{}, t(p ? 'ql.play' : 'ql.pause'))); };
    const toggle = () => { video.paused ? video.play() : video.pause(); };
    play.onclick = toggle; playBtn.onclick = toggle; video.onclick = toggle;
    const replay = h('button',{class:'vc-btn', onclick:()=>{ video.currentTime = 0; video.play(); }}, '↺ ', h('span',{}, t('ql.replay')));
    const subBtn = h('button',{class:'vc-btn', onclick:()=>{ subsOn = !subsOn; applySubs(); }}, 'CC ', h('span',{}, t('ql.subtitles')));
    video.addEventListener('play', sync); video.addEventListener('pause', sync); video.addEventListener('loadedmetadata', applySubs);
    video.addEventListener('ended', () => { sync(); play.textContent = '↺'; play.hidden = false; play.onclick = () => { video.currentTime = 0; video.play(); play.textContent = '▶'; play.onclick = toggle; }; });
    // sources: the real evidence behind every step shown in the video
    const ev = []; (v.facts || []).forEach(id => { const g = SK.sources.guard(id); if (g.ok) g.evidence.forEach(e => { if (!ev.some(x => x.id === e.id)) ev.push(e); }); });
    (v.claims || []).forEach(id => { (SK.sources.CLAIMS[id].evidence || []).forEach(eid => { const e = SK.sources.evidence(eid); if (e && !ev.some(x => x.id === e.id)) ev.push(e); }); });
    const srcBtn = h('button',{class:'ql-act vc-src', onclick:()=>SK.ui.evidenceSheet({ evidence:ev, translation:null })}, ui.svg(I.book), h('span',{}, t('ql.videoSources')));
    ui.sheet(t('ql.watch'), h('div',{class:'ql-player'}, video, play), h('div',{class:'vc-bar'}, playBtn, replay, subBtn),
      h('p',{class:'vc-note'}, t('ql.videoNote')), srcBtn);
    sync(); setTimeout(applySubs, 0);
  }

  /* ---------- quick learning: the whole summary on one screen, readable in 30 seconds ---------- */
  // same cards and wording as the existing «صلاة الجنازة في 30 ثانية» quick review (no new content)
  const SUMMARY = { janaza: [['q.step1','q.step1d'],['q.step2','q.step2d'],['q.step3','q.step3d'],['q.step4','q.step4d']] };
  const SECONDS = 30;
  S.haramHelp = () => { applySimple();
    const topic = hm().topic || 'janaza'; const rows = SUMMARY[topic] || SUMMARY.janaza;
    const name = (D.worships.find(w => w.id === topic) || {}).name || '';
    const R = 26, C = 2 * Math.PI * R;
    const num = h('b',{class:'ql-timer-num', 'aria-hidden':'true'}, String(SECONDS));
    const ring = h('span',{class:'ql-ring', html:`<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="${R}" fill="none" stroke="var(--line)" stroke-width="5"/><circle class="ql-ring-fg" cx="32" cy="32" r="${R}" fill="none" stroke="var(--gold)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 32 32)"/></svg>`});
    const timer = h('div',{class:'ql-timer', role:'timer', 'aria-live':'off'}, ring, num);
    const doneMsg = h('p',{class:'ql-got', 'aria-live':'polite', hidden:true}, t('ql.gotIt'));
    const restart = h('button',{class:'ql-restart'}, t('ql.restart'));
    const section = h('section',{class:'screen ql-sum'});
    let left = SECONDS, handle = null;
    const draw = () => { num.textContent = String(left); const fg = ring.querySelector('.ql-ring-fg'); if (fg) fg.setAttribute('stroke-dashoffset', String(C * (1 - left / SECONDS))); timer.setAttribute('aria-label', String(left)); };
    const stop = () => { if (handle){ clearInterval(handle); handle = null; } };
    const start = () => { stop(); left = SECONDS; doneMsg.hidden = true; draw();
      handle = setInterval(() => {
        if (!document.body.contains(section)){ stop(); return; }          // left the screen: stop quietly
        left = Math.max(0, left - 1); draw();
        if (left === 0){ stop(); doneMsg.hidden = false; }                // no automatic navigation
      }, 1000); };
    restart.onclick = start;
    const video = SK.services.videos.get(topic, 'summary');
    const allText = SK.sources.steps(topic).filter(g=>g.ok).map(g => `${t(g.fact.titleKey)}. ${SK.sources.text(g.fact,'directive')}`).join(' ');
    section.append(
      h('header',{class:'ql-sum-head'},
        h('button',{class:'icon-btn', 'aria-label':t('common.back'), onclick:()=>SK.router.back()}, ui.svg(I.back)),
        h('div',{class:'ql-sum-titles'}, h('span',{class:'eyebrow'}, t('ql.title')), h('h1',{class:'ql-sum-title', id:'screen-title', tabindex:'-1'}, t('ql.inSeconds',{w:name}))),
        timer),
      h('div',{class:'ql-sum-status'}, doneMsg, restart),
      ui.stepCards(topic),
      h('div',{class:'ql-more'}, h('p',{class:'ql-more-q'}, t('ql.moreQ')),
        h('div',{class:'ql-actions'},
          SK.sources.animation(topic).some(a => a.ok) ? h('button',{class:'ql-act', onclick:()=>SK.router.go('demo')}, ui.svg(I.film), t('ql.quickVideo'))
                : h('button',{class:'ql-act is-soon', disabled:true, title:t('ql.noVideo')}, ui.svg(I.film), t('ql.quickVideo'), h('small',{}, t('common.soon'))),
          h('button',{class:'ql-act', onclick:()=>SK.services.speech.speak(allText, SK.i18n.lang())}, ui.svg(I.volume), t('ql.listenSummary')))));
    setTimeout(start, 0);
    return section;
  };

  /* ---------- end of the review (no test here: tests live in «رحلتي») ---------- */
  S.haramDone = () => { applySimple();
    return h('section',{class:'screen ql-focus ql-end'},
      h('header',{class:'ql-bar'}, h('span',{class:'icon-spacer'}), h('div',{class:'ql-bar-mid'}, h('span',{class:'ql-bar-title'}, t('ql.title'))), h('span',{class:'icon-spacer'})),
      h('main',{class:'ql-center'},
        h('span',{class:'result-check', html:'<svg viewBox="0 0 52 52" width="88" height="88"><circle cx="26" cy="26" r="24" fill="currentColor" opacity=".12"/><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}),
        h('h1',{class:'ql-done-title', id:'screen-title'}, t('ql.reviewDone')), h('p',{class:'ql-done-sub'}, t('ql.gotEssentials'))),
      h('footer',{class:'ql-foot stack'}, ui.button(t('ql.quickAgain'),{onclick:()=>{ hm().step = 0; go('haramHelp',{replace:true}); }}),
        ui.button(t('ql.otherWorship'),{variant:'ghost', onclick:()=>go('haramTopics',{replace:true})})));
  };

  /* ---------- quick quiz: one existing question per step (from the journey's question bank) ---------- */
  S.haramQuiz = () => { applySimple();
    const qz = hm().quiz || (hm().quiz = { i:0, score:0 });
    const n = STEPS.length;
    if (qz.i >= n){
      return h('section',{class:'screen hm-screen ql-done'}, topBar(),
        h('div',{class:'result-hero'}, h('span',{class:'result-check', html:'<svg viewBox="0 0 52 52" width="84" height="84"><circle cx="26" cy="26" r="24" fill="currentColor" opacity=".12"/><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}),
          h('h1',{class:'hm-title', id:'screen-title'}, t('ql.finished')), h('p',{class:'lead'}, t('ql.score',{n:qz.score,total:n}))),
        h('div',{class:'stack'}, ui.button(t('ql.home'),{onclick:()=>go('worship',{reset:true})}),
          ui.button(t('ql.again'),{variant:'ghost', onclick:()=>{ hm().step = 0; go('haramHelp',{replace:true}); }})));
    }
    const concept = STEPS[qz.i]; const q = (D.questions[concept] || [])[0];
    const fb = h('div',{class:'feedback', 'aria-live':'polite'});
    const next = ui.button(t('common.next'),{onclick:()=>{ qz.i++; go('haramQuiz',{replace:true}); }}); next.hidden = true;
    let done = false;
    const items = q.options.map(([text, ok], k) => ({ id:String(k), text, correct:!!ok }));
    const opts = ui.options(items, { onPick:(it, btn) => { if (done) return; done = true; opts.classList.add('is-locked');
      if (it.correct){ qz.score++; btn.classList.add('is-right'); fb.replaceChildren(h('div',{class:'success'}, h('p',{}, t('ql.correct')))); }
      else { btn.classList.add('is-wrong'); const right = items.find(x=>x.correct); fb.replaceChildren(h('div',{class:'gentle'}, h('p',{}, t('ql.wrong'), ' ', h('b',{}, right.text)))); }
      next.hidden = false; next.focus(); }});
    return h('section',{class:'screen hm-screen ql-step'}, topBar(),
      h('div',{class:'ql-count'}, h('span',{}, t('ql.qOf',{n:qz.i+1,total:n}))), progressBar(qz.i, n),
      h('h1',{class:'ql-q', id:'screen-title', tabindex:'-1'}, q.q), opts, fb, h('div',{class:'ql-nav'}, next));
  };
  // the old 4-step summary now opens the step-by-step journey
  S.haramLearn = () => { hm().step = 0; if (!hm().topic) hm().topic = 'janaza'; return S.haramTopics(); };
})(window.SK);
