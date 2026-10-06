/* Screens. Each screen is a function returning a DOM node. */
(function(SK){
  const t = (k,v) => SK.t(k,v);
  const h = SK.h, ui = SK.ui, I = SK.ui.icons, D = SK.data;
  const S = SK.screens;
  const J = () => SK.store.get().journey;
  const go = (r,o) => SK.router.go(r,o);

  // ---------- 4. Start ----------
  S.start = () => {
    const title = t('start.title1') + ' ' + t('start.title2');
    const sub = t('start.sub');
    const steps = [t('start.s1'),t('start.s2'),t('start.s3'),t('start.s4')];
    const lang = (D.languages.find(l=>l.code===SK.store.get().lang) || D.languages[0]).native;
    const listen = h('button',{class:'listen-btn', 'aria-label':t('common.listen'), onclick:()=>SK.services.speech.speak(`${title}. ${sub}`)}, ui.svg(I.speaker), h('span',{}, t('common.listen')));
    return h('section',{class:'screen screen-start'},
      h('div',{class:'start-hero'},
        h('div',{class:'start-mark', 'aria-hidden':'true'}),
        (()=>{ const l = ui.logo(); let n=0, t=null; l.addEventListener('click',()=>{ n++; clearTimeout(t); t=setTimeout(()=>n=0,1500); if(n>=5){ n=0; go('devtests'); } }); return l; })(),
        h('h1',{class:'start-title', id:'screen-title'}, t('start.title1'), h('br'), t('start.title2')),
        h('p',{class:'start-sub'}, sub),
        h('div',{class:'journey-ind', role:'img', 'aria-label':t('start.stepsLabel')+': '+steps.join(', ')},
          steps.map((s,i)=>[ i ? h('span',{class:'ji-line', 'aria-hidden':'true'}) : null,
            h('span',{class:'ji-step', 'aria-hidden':'true', style:`--i:${i}`}, h('span',{class:'ji-dot'}), h('span',{class:'ji-label'}, s)) ]))),
      h('div',{class:'start-actions'},
        ui.button(t('start.begin'),{onclick:()=>{ SK.store.set({ afterLang:'path' }); go('lang'); }}),
        ui.button(t('start.scan'),{variant:'ghost', icon:'qr', onclick:()=>go('scan')}),
        h('p',{class:'start-note'}, t('start.note')),
        h('button',{class:'lang-link', onclick:()=>go('lang')}, ui.svg(I.globe), h('span',{}, lang), h('span',{class:'lang-link-sep', 'aria-hidden':'true'}, '·'), h('span',{}, t('lang.change')))));
  };

  // ---------- 5. Language ----------
  S.lang = () => {
    const cur = SK.i18n.lang();
    const note = h('p',{class:'hint', 'aria-live':'polite'});
    const list = h('div',{class:'lang-grid', role:'radiogroup', 'aria-label':t('lang.list')}, D.languages.map(l => {
      const b = h('button',{class:'lang-card'+(l.ready?'':' is-soon'), role:'radio', 'aria-checked':String(l.code===cur), 'aria-disabled':String(!l.ready), lang:l.code, dir:l.dir},
        h('span',{class:'lang-badge'}, l.badge), h('span',{class:'lang-name'}, l.native), l.ready ? null : h('span',{class:'lang-soon'}, t('common.soon')), h('span',{class:'lang-tick'}, ui.svg(I.check)));
      b.onclick = () => {
        if (!l.ready){ note.textContent = t('lang.soonNote'); return; }
        SK.i18n.setLang(l.code);                       // applied immediately, no reload; card / progress / chat untouched
        SK.router.go('lang',{replace:true});
      };
      return b; }));
    return ui.screen({ title:t('lang.title'), body:[list, note], footer:[ ui.button(t('common.continue'),{onclick:()=>{ const nx = SK.store.get().afterLang; SK.store.set({ afterLang:null }); go(nx === 'path' ? 'path' : 'worship'); }}) ] });
  };

  // ---------- «كيف تحب تبدأ؟» — shown right after choosing the language ----------
  S.path = () => {
    const opt = (icon, title, sub, btn, onclick, badge, cls='') => h('div',{class:'path-card '+cls},
      h('div',{class:'path-head'}, h('span',{class:'path-ico', 'aria-hidden':'true', html:icon}), h('h2',{class:'path-title'}, title), badge ? h('span',{class:'path-badge'}, badge) : null),
      h('p',{class:'path-sub'}, sub), ui.button(btn,{ onclick, variant: cls ? 'ghost' : 'primary' }));
    return ui.screen({ title:t('path.title'), body:[
      opt(I.leaf, t('path.personal'), t('path.personalSub'), t('path.personalBtn'), () => go('worship')),
      opt(I.bolt, t('path.quick'), t('path.quickSub'), t('path.quickBtn'), () => { if (SK.haram) SK.haram.state().topic = null; go('haramTopics'); }, t('cd.haramBadge'), 'is-quick'),
      !SK.store.get().session ? h('button',{class:'link-btn path-card-link', onclick:()=>go('create')}, ui.svg(I.card || I.qr), t('path.saveCard')) : null ].filter(Boolean) });
  };

  // ---------- 6. Worship ----------
  S.worship = () => ui.screen({ title:t('home.title'), back:true,
    body:[ h('div',{class:'worship-list'}, D.worships.map(w => h('button',{class:'worship'+(w.ready?'':' is-soon'), 'aria-label': w.ready ? null : w.name + t('home.soonSuffix'),
        onclick:()=>{ if(!w.ready){ SK.store.set({ soonWorship:w.id }); go('soon'); return; } SK.store.resetJourney(); go('pre'); }},
      h('span',{class:'worship-name'}, w.name), h('span',{class:'worship-status'}, w.status)))),
      h('button',{class:'quick-entry', onclick:()=>go('quick')}, ui.svg(I.bolt), h('span',{}, h('b',{},t('common.quickReview')), h('small',{},t('home.quickSub')))) ],
    footer:[] , nav:'home' });
  S.worship.nav = 'home';

  // ---------- 7. Pre-test ----------
  /* ---------- Pre-assessment: one multiple-choice question per screen (same options component as the post-test) ----------
     Questions come from the journey's question bank; their correct answers match the TrustedSourcesRegistry steps.
     Internally: correct → known (mastered) · wrong → confused · «ما أعرف» → missing. Nothing is revealed here. */
  const PRE_TEST = { janaza:[ ['first_takbir','Q-JAN-002a','JAN-STEP-1'], ['second_takbir','Q-JAN-004a','JAN-STEP-2'], ['third_takbir','Q-JAN-003a','JAN-STEP-3'], ['fourth_takbir','Q-JAN-005a','JAN-STEP-4'] ] };
  const preItems = () => (PRE_TEST.janaza).filter(([, , factId]) => SK.sources.guard(factId).ok);   // only steps backed by verified evidence
  function buildPreAnalysis(answers){
    const items = preItems(); const all = D.concepts.map(c=>c.id);
    const res = { intent:'answer', mastered:[], missing:[], confused:[], out_of_scope:[], no_source:[], score:0, priority_concepts:[], evidence:[] };
    items.forEach(([concept, qid]) => { const a = answers[concept];
      if (!a || a.dontKnow){ res.missing.push(concept); return; }
      if (a.correct){ res.mastered.push(concept); res.evidence.push({ concept_id:concept, quote:a.text, evidence:a.text, status:'mastered' }); }
      else { res.confused.push({ concept_id:concept, user_claim:a.text, reason:qid }); res.evidence.push({ concept_id:concept, quote:a.text, evidence:a.text, status:'confused' }); } });
    all.forEach(id => { if (!items.some(([c]) => c === id) && !res.missing.includes(id)) res.missing.push(id); });   // concepts not asked here are taught in the journey
    if (!res.mastered.length && !res.confused.length) res.intent = 'unknown';
    res.priority_concepts = [...res.confused.map(c=>c.concept_id), ...res.missing];
    res.score = SK.services.understanding.computeScore(res);
    res.engine_version = SK.services.understanding.ENGINE_VERSION; res.method = 'mcq';
    return res;
  }
  S.pre = () => {
    const j = J(); const items = preItems();
    if (!j.pre || j.pre.done) SK.store.journey({ pre:{ i:0, answers:{} } });
    const st = J().pre; const n = items.length, i = Math.min(st.i, n-1);
    const [concept, qid] = items[i]; const q = D.question(qid);
    const chosen = st.answers[concept];
    const next = ui.button(i < n-1 ? t('common.next') : t('pre.start'),{ onclick:() => {
      if (!st.answers[concept]) return;
      if (i < n-1){ st.i = i+1; go('pre',{replace:true}); return; }
      const res = buildPreAnalysis(st.answers);
      const used = {}; items.forEach(([c]) => { used[c] = 1; });                 // post-test starts from the other question variant
      const full = SK.services.plan.needsFullPath(res);      // nothing known yet -> Sakeenah switches to the full path
      const plan = full ? SK.services.plan.fullPath() : SK.services.plan.build(res, 99);   // else: only the points that need clarifying
      SK.store.journey({ answer: items.map(([c]) => `${c}:${(st.answers[c]||{}).id||'-'}`).join(' '), analysis:res, plan, fullPath:full, learningPath: full ? 'full' : 'personalized', preSkipped:false, queue:plan.map(p=>p.concept_id), step:0, corrected:[], results:{}, usedQ:used, before:res.score, stage:'insight', pre:{ ...st, done:true } });
      SK.services.progress.persist();
      go('insight',{replace:true}); } });
    next.disabled = !chosen;
    const opts = [...q.options.map(([text, ok], k) => ({ id:String(k), text, correct:!!ok })), { id:'dk', text:t('pre.dontKnow'), dontKnow:true }];
    const group = ui.options(opts, { onPick:(it) => { st.answers[concept] = { id:it.id, text:it.text, correct:!!it.correct, dontKnow:!!it.dontKnow }; next.disabled = false; } });
    if (chosen){ const b = group.querySelector(`[data-id="${chosen.id}"]`); if (b) b.setAttribute('aria-checked','true'); }
    const back = i > 0 ? h('button',{class:'icon-btn', 'aria-label':t('common.back'), onclick:()=>{ st.i = i-1; go('pre',{replace:true}); }}, ui.svg(I.back)) : h('button',{class:'icon-btn', 'aria-label':t('common.back'), onclick:()=>SK.router.back()}, ui.svg(I.back));
    return h('section',{class:'screen pre-mcq'},
      h('header',{class:'ql-bar'}, back, h('div',{class:'ql-bar-mid'}, h('span',{class:'ql-bar-title'}, t('pre.title'))), h('div',{class:'ql-bar-end'}, h('span',{class:'ql-step-count'}, t('ql.nOf',{n:i+1,total:n})), h('button',{class:'ql-guide', 'aria-label':t('gd.open'), onclick:()=>SK.guide.open()}, SK.ui.guideIcon(26)))),
      h('div',{class:'ql-progress', role:'progressbar', 'aria-valuemin':'1', 'aria-valuemax':String(n), 'aria-valuenow':String(i+1)}, h('i',{style:`--w:${Math.round(100*(i+1)/n)}%`})),
      h('h1',{class:'pre-q', id:'screen-title', tabindex:'-1'}, q.q),
      group,
      h('footer',{class:'pre-foot'},
        h('button',{type:'button', class:'pre-skip', onclick:()=>confirmFullPath(st)},
          h('span',{class:'pre-skip-ico'}, ui.svg(I.bookOpen)), h('span',{class:'pre-skip-txt'}, h('b',{}, t('pre.skipTitle')), h('small',{}, t('pre.skipSub')))),
        next));
  };
  /* «ما أعرف عن صلاة الجنازة — علّمني من البداية»: a choice of learning path, not an answer.
     Confirm -> stop the pre-test, record learningPath='full' and that the assessment was not completed. */
  function confirmFullPath(st){
    const close = () => { const d = document.getElementById('sheet'); if (d) d.close(); };
    ui.sheet(t('pre.skipAsk'),
      h('p',{class:'pre-skip-note'}, t('pre.skipNote')),
      h('div',{class:'stack pre-skip-actions'},
        ui.button(t('pre.skipYes'),{onclick:()=>{ close(); startFullFromBeginning(st); }}),
        ui.button(t('pre.skipNo'),{variant:'ghost', onclick:close})));
  }
  function startFullFromBeginning(st){
    const U = SK.services.understanding, P = SK.services.plan;
    // no assessment result: every concept is simply "to learn" — no score is shown as a "before" later
    const a = { intent:'unknown', method:'mcq', mastered:[], confused:[], missing:P.FULL_ORDER.slice(), out_of_scope:[], no_source:[], evidence:[], priority_concepts:P.FULL_ORDER.slice(), preSkipped:true };
    a.score = U.computeScore(a); a.engine_version = U.ENGINE_VERSION;
    const plan = P.fullPath();
    SK.store.journey({ answer:'pre-test skipped: learner asked to start from the beginning', analysis:a, plan, fullPath:true, learningPath:'full', preSkipped:true, preSkipReason:'needs_full_explanation',
      queue:plan.map(p=>p.concept_id), step:0, corrected:[], results:{}, usedQ:{}, before:null, stage:'insight', pre:{ ...st, done:true, skipped:true } });
    SK.services.progress.persist();
    go('insight',{replace:true});
  }

  S.analyzing = () => {
    const line = h('p',{class:'analyzing-line', 'aria-live':'polite'}, t('an.reading'));
    const node = h('section',{class:'screen screen-center'},
      h('div',{class:'pulse', 'aria-hidden':'true'}, h('span'), h('span'), h('span'), h('i',{html:'<svg viewBox="0 0 48 48" width="40" height="40"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="12" y="12" width="24" height="24" rx="2"/><rect x="12" y="12" width="24" height="24" rx="2" transform="rotate(45 24 24)"/></g></svg>'})),
      line);
    const quick = SK.reducedMotion();
    Promise.all([ SK.services.understanding.analyzeUnderstanding(J().answer), new Promise(r=>setTimeout(r, quick?300:1400)) ]).then(([res]) => {
      line.textContent = t('an.identifying');
      const plan = SK.services.plan.build(res, 3); const queue = plan.map(p=>p.concept_id);
      setTimeout(()=>{ SK.store.journey({ analysis:res, plan, queue, step:0, corrected:[], results:{}, usedQ:{}, before:res.score, stage:'insight' });
        if (res.intent !== 'out_of_scope') SK.services.progress.persist();
        go('insight',{replace:true}); }, quick?200:1200);
    });
    return node;
  };

  // ---------- 9. Understanding result ----------
  const cTitle = id => (D.concept(id)||{title:id}).title;
  const shortQuote = q => { const t = String(q||'').replace(/^\s*(و|ثم|بعدين)\s*/,'').trim(); return t.length > 60 ? t.slice(0,58)+'…' : t; };
  function explainability(a){
    const rows = [];
    a.evidence.forEach(e => rows.push(h('li',{class:'ev ev-'+e.status},
      h('span',{class:'ev-said'}, e.quote.startsWith('وصفت') ? t('ins.describedFour') : `«${shortQuote(e.quote)}»`),
      h('span',{class:'ev-arrow', 'aria-hidden':'true'}, SK.i18n.dir()==='rtl' ? '←' : '→'),
      h('span',{}, h('b',{}, cTitle(e.concept_id)), e.status==='mastered' ? ' ✓' : t('ins.needsClarify')))));
    a.missing.forEach(id => rows.push(h('li',{class:'ev ev-missing'}, h('span',{class:'ev-said'}, t('ins.notMentioned')), h('span',{class:'ev-arrow', 'aria-hidden':'true'}, SK.i18n.dir()==='rtl' ? '←' : '→'), h('span',{}, h('b',{}, cTitle(id)), t('ins.suggestReview')))));
    return h('details',{class:'explainability'}, h('summary',{}, t('ins.how')), h('ul',{class:'ev-list'}, rows));
  }
  /* Full Learning Path: shown when the pre-test found no known point — encouraging, never "you failed" */
  const fullPathScreen = () => {
    const plan = (J().plan && J().plan.length) ? J().plan : SK.services.plan.fullPath();
    const steps = ['fp.s1','fp.s2','fp.s3','fp.s4','fp.s5'];
    const skipped = !!J().preSkipped;
    return ui.screen({ eyebrow: skipped ? h('span',{class:'fp-done'}, ui.svg(I.bookOpen), t('fp.chosen')) : h('span',{class:'fp-done'}, ui.svg(I.check), t('fp.done')), title:t('fp.title'),
      body:[
        h('p',{class:'fp-lead'}, skipped ? t('fp.textSkipped') : t('fp.text')),
        ui.card('fp-card', h('h2',{class:'box-title'}, t('fp.journey')),
          h('ol',{class:'fp-steps'}, steps.map((k,i) => h('li',{class:'fp-step'}, h('span',{class:'fp-num'}, String(i+1)), h('span',{class:'fp-label'}, t(k)))))),
        h('p',{class:'calm small center'}, t('fp.note',{n:plan.length})) ],
      footer:[ ui.button(t('fp.start'),{onclick:()=>{ SK.store.journey({stage:'explain', plan, queue:plan.map(p=>p.concept_id), step:0}); SK.services.progress.persist(); go('explain'); }}) ] });
  };
  S.insight = () => {
    const a = J().analysis; if (!a) return S.pre();
    const R = SK.services.retrieval;
    if (a.intent === 'out_of_scope'){
      return ui.screen({ eyebrow:t('ins.oosEyebrow'), title:t('ins.oosTitle'),
        body:[ ui.card('attention', h('p',{class:'big-note'}, R.OUT_OF_SCOPE_TEXT), h('p',{class:'calm'}, R.OUT_OF_SCOPE_NOTE)),
          h('p',{class:'muted center'}, t('ins.oosTry')) ],
        footer:[ ui.button(t('ins.oosBack'),{onclick:()=>SK.router.back()}) ] });
    }
    if (J().fullPath) return fullPathScreen();
    const unknown = a.intent === 'unknown';
    const plan = J().plan || SK.services.plan.build(a, 99);
    const masteredBox = a.mastered.length ? ui.card('good', h('h2',{class:'box-title'}, ui.svg(I.check), t('ins.mastered')),
      h('ul',{class:'chip-list'}, a.mastered.map(id=>h('li',{}, ui.svg(I.check), cTitle(id))))) :
      ui.card('good', h('p',{}, unknown ? t('ins.unknownStart') : t('ins.basics')));
    const needBox = ui.card('attention', h('h2',{class:'box-title'}, h('span',{class:'tri', 'aria-hidden':'true'}, '△'), t('ins.needs')),
      ...a.confused.map(c => h('div',{class:'confusion'},
        h('p',{class:'confusion-label'}, cTitle(c.concept_id)),
        c.user_claim ? h('p',{class:'quote'}, t(a.method==='mcq' ? 'ins.youChose' : 'ins.youSaid'), h('mark',{}, shortQuote(c.user_claim)), t('ins.quoteEnd')) : null,
        h('p',{class:'confusion-note'}, t('ins.confusedNote')))),
      a.missing.length ? h('div',{class:'missing'}, h('p',{class:'confusion-label'}, (unknown || a.method==='mcq') ? t('ins.learnTogether') : t('ins.notInAnswer')), h('ul',{class:'dot-list'}, a.missing.map(id=>h('li',{}, cTitle(id))))) : null,
      plan.length < a.priority_concepts.length ? h('p',{class:'calm small'}, t('ins.topN',{n:plan.length})) : null);
    const noSource = a.no_source.length ? ui.card('nosource', h('h2',{class:'box-title'}, ui.svg(I.book), t('ins.noSourceTitle')),
      h('p',{}, R.NO_SOURCE_TEXT), h('p',{class:'muted'}, R.NO_SOURCE_ADVICE)) : null;
    return ui.screen({ eyebrow:t('ins.level',{n:a.score}), title:t('ins.title'),
      body:[ masteredBox, plan.length ? needBox : ui.card('good', h('p',{}, t('ins.perfect'))), noSource, explainability(a) ],
      footer:[ plan.length ? ui.button(t('ins.explainIt'),{onclick:()=>{ SK.store.journey({stage:'explain', plan, queue:plan.map(p=>p.concept_id)}); SK.services.progress.persist(); go('explain'); }})
        : ui.button(t('ins.showResult'),{onclick:()=>{ SK.store.journey({after:a.score, stage:'done'}); go('result'); }}) ] });
  };

  // ---------- 10. Grounded explanation — content and sources from TrustedSourcesRegistry only ----------
  const saveLater = () => SK.store.get().session ? h('button',{class:'link-btn small save-later', onclick:()=>{ SK.services.progress.persist(); SK.signOut(); SK.router.go('start',{reset:true}); SK.toast(t('ex.saved')); }}, t('ex.saveLater')) : null;
  S.explain = () => {
    const j = J(); const step = currentStep(); const id = step.concept_id;
    const lang = SK.i18n.lang(), R = SK.sources, C = R.forConcept(id, lang);      // the ONE source of truth for this point
    const total = j.plan.length;
    const nextFromNoSource = () => { const k=j.step+1; if (k<j.plan.length){ SK.store.journey({step:k}); go('explain',{replace:true}); } else finishJourney(); };
    if (!C.ok) return ui.screen({ eyebrow: total>1 ? t('ex.pointOf',{n:j.step+1,total}) : t('ex.guided'), title:t('ex.title'),
      body:[ h('p',{class:'concept-name'}, cTitle(id)), ui.card('nosource', h('p',{}, C.message)) ],
      footer:[ ui.button(t('common.continue'),{onclick:nextFromNoSource}) ] });
    const rec = C.recitation, dir = SK.i18n.dir();
    const explainNode = lang !== 'ar' ? h('p',{class:'explain-text', lang, dir}, C.text) : ui.arabic(C.text, 'explain-text');
    const meaning = lang !== 'ar' && rec ? (rec.translation ? h('div',{class:'qc-meaning'}, h('span',{class:'qc-meaning-label'}, t('src.approvedMeaning')), h('p',{class:'qc-meaning-text', lang, dir}, rec.translation.text), h('span',{class:'qc-meaning-src'}, rec.translation.translator))
                                                       : h('p',{class:'qc-no-tr'}, t('src.noApprovedTranslation'))) : null;
    const shown = R.shownEvidence(C.evidence);
    const openSource = () => SK.ui.evidenceSheet({ evidence:C.evidence, translation: rec ? rec.translation : null });
    const sourceLine = h('p',{class:'muted small'}, [...new Set(shown.map(e => R.sourceName(e)))].join(' · '));
    const listenLesson = () => SK.services.speech.speakParts([{ text:C.text, lang, audioKey: C.kind === 'fact' ? C.id : null }]);
    return ui.screen({ eyebrow: total>1 ? t('ex.pointOf',{n:j.step+1,total}) : t('ex.guided'), title:t('ex.title'),
      body:[ h('p',{class:'concept-name'}, cTitle(id), h('span',{class:'reason-tag'+(j.fullPath?' is-stage':'')}, j.fullPath ? t(SK.services.plan.BASICS.includes(id) ? 'fp.s1' : 'fp.s2') : step.reason==='confused' ? t('ex.tagConfused') : t(J().analysis && J().analysis.method==='mcq' ? 'ex.tagNew' : 'ex.tagMissing'))),
        // 1) افهم — the explanation from the registry
        ui.card('explain', explainNode,
          !rec && j.fullPath ? h('div',{class:'recite-foot fp-listen'}, h('span',{}), h('button',{class:'chip-btn', onclick:listenLesson}, ui.svg(I.speaker), t('common.listen'))) : null),
        // 2) شاهد — the step video, when one exists
        SK.stepVideoCard ? SK.stepVideoCard(id, C.text) : null,
        // 3) استمع + 4–6) ردّد معي — the approved text (registry evidence), its recording, and the optional repeat practice
        rec ? ui.card('recite-card', h('p',{class:'rp-label'}, t('rp.refText')),
          h('div',{class:'recite'}, ui.arabic(rec.text, 'recite-text'), meaning, h('div',{class:'recite-foot'},
            h('button',{class:'chip-btn rp-src', onclick:()=>SK.ui.evidenceSheet({ evidence:rec.evidence, translation:rec.translation })}, ui.svg(I.book), h('span',{}, R.reference(rec.evidence[0]))),
            h('button',{class:'chip-btn', onclick:()=>SK.services.speech.speakReligious(rec.evidenceId, rec.text)}, ui.svg(I.speaker), t(lang !== 'ar' ? 'ex.listenArabic' : 'common.listen')))),
          SK.ui.RepeatAfterMe ? SK.ui.RepeatAfterMe({ expectedText:rec.text, audio:rec.evidenceId, language:'ar', context: j.fullPath ? 'full-explanation' : 'learning-path' }) : null) : null,
        // 📖 المصدر
        ui.card('verified', h('div',{class:'verified-row'}, h('span',{class:'verified-badge'}, ui.svg(I.check), t('src.verifiedInSakeenah')),
            h('button',{class:'chip-btn', onclick:openSource}, ui.svg(I.book), t('common.source'))),
          sourceLine),
        h('p',{class:'review-note'}, D.groundingNote) ].filter(Boolean),
      footer:[ ui.button(j.step < total-1 ? t('ex.next') : t('ex.done'),{onclick:()=>{
          if (j.step < total-1){ SK.store.journey({ step:j.step+1 }); SK.services.progress.persist(); go('explain',{replace:true}); }
          else { SK.store.journey({ stage:'ready' }); SK.services.progress.persist(); go('ready',{replace:true}); } }}), saveLater() ].filter(Boolean) });
  };

  // ---------- 11. Adaptive post-test (targets the exact concept) ----------
  function finishJourney(){
    const j = J(); const after = SK.services.progress.calculateJourneyProgress(j);
    SK.store.journey({ after, before: SK.services.progress.calculatePreProgress(j), stage:'done' }); SK.services.progress.persist({completed:true}); go('result',{replace:true});
  }
  /** current plan step (rebuilds the plan if an older saved journey has none) */
  function currentStep(){
    const j = J();
    const stale = !j.plan || !j.plan.length || j.plan.some(p => j.analysis.mastered.includes(p.concept_id));
    if (stale){ j.plan = SK.services.plan.build(j.analysis, 3); j.queue = j.plan.map(p=>p.concept_id); j.step = Math.min(j.step, Math.max(0, j.plan.length-1)); }
    return j.plan[Math.min(j.step, j.plan.length-1)];
  }
  S.check = () => {
    const j = J(); const step = currentStep(); const id = step.concept_id;
    const used = (j.usedQ = j.usedQ || {}); const n = used[id] ?? 0; used[id] = n + 1;
    const qq = SK.services.plan.question(step, n);           // always a question of THIS concept
    const ex = SK.sources.forConcept(id);
    if (!qq){ SK.services.retrieval.logEvent('NO_QUESTION_FOUND', { concept_id:id }); }
    const fb = h('div',{class:'feedback', 'aria-live':'polite'});
    let tries = 0, done = false;
    const next = ui.button(t('common.continue'),{onclick:()=>{ const k = j.step+1; if (k < j.plan.length){ SK.store.journey({step:k}); SK.services.progress.persist(); go('explain',{replace:true}); } else finishJourney(); }}); next.hidden = true;
    const items = (qq ? qq.options : []).map(([text, correct], i) => ({ id:String(i), text, correct:!!correct }));
    const opts = ui.options(items, { onPick:(it, btn) => {
      if (done) return; tries++;
      if (it.correct){ done = true; btn.classList.add('is-right'); opts.classList.add('is-locked');
        j.results = j.results || {}; if (!j.results[id]) j.results[id] = tries===1 ? 'first' : 'retry';
        if (!j.corrected.includes(id)) j.corrected.push(id);
        SK.services.progress.persist();
        fb.replaceChildren(h('div',{class:'success'}, h('span',{class:'success-mark', html:'<svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}), h('p',{}, t('chk.success'))));
        next.hidden = false; next.focus();
      } else { btn.classList.add('is-wrong'); btn.disabled = true;
        fb.replaceChildren(h('div',{class:'gentle'}, h('p',{}, t('chk.remember'), h('b',{lang:SK.i18n.lang(), dir:SK.i18n.dir()}, ex.ok ? ex.text : '')))); }
    }});
    return ui.screen({ eyebrow:t('chk.eyebrow',{c:cTitle(id)}), title:t('chk.title'),
      body:[ h('p',{class:'question', 'data-concept':id, 'data-question':qq ? qq.id : ''}, qq ? qq.q : SK.services.retrieval.NO_SOURCE_TEXT), opts, fb ], footer:[ next, saveLater() ].filter(Boolean) });
  };

  // ---------- 12. Result ----------
  /* ---------- after the last point: one screen, then ONE post-test ---------- */
  S.ready = () => ui.screen({ eyebrow: J().fullPath ? t('fp.s4') : t('rd.eyebrow'), title: J().fullPath ? t('rd.titleFull') : t('rd.title'),
    body:[ h('div',{class:'result-hero'}, h('span',{class:'result-check', html:'<svg viewBox="0 0 52 52" width="76" height="76"><circle cx="26" cy="26" r="24" fill="currentColor" opacity=".12"/><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}),
      h('p',{class:'lead'}, t('rd.q'))), h('ul',{class:'tick-list'}, (J().plan||[]).map(p => h('li',{}, cTitle(p.concept_id)))) ],
    footer:[ ui.button(t('rd.start'),{onclick:()=>{ SK.store.journey({ post:{ i:0, answers:{} }, stage:'post' }); go('post',{replace:true}); }}) ] });
  /** post-test: the concepts that were taught (the wrong / unknown points of the pre-test), one question each, answer revealed at the end */
  S.post = () => {
    const j = J(); const items = (j.plan||[]).filter(p => (p.question_ids||[]).length);
    if (!items.length) { finishJourney(); return h('section',{class:'screen'}); }
    const st = j.post || (j.post = { i:0, answers:{} }); const n = items.length, i = Math.min(st.i, n-1);
    const step = items[i], used = (j.usedQ = j.usedQ || {});
    if (st.qid == null || st.qid[i] == null){ st.qid = st.qid || {}; const q0 = SK.services.plan.question(step, used[step.concept_id] ?? 0); st.qid[i] = q0 ? q0.id : null; }
    const q = D.question(st.qid[i]); const chosen = st.answers[step.concept_id];
    const next = ui.button(i < n-1 ? t('common.next') : t('post.show'),{ onclick:() => {
      if (!st.answers[step.concept_id]) return;
      if (i < n-1){ st.i = i+1; go('post',{replace:true}); return; }
      const results = { ...(j.results||{}) }, review = [];
      items.forEach(p => { const a = st.answers[p.concept_id]; used[p.concept_id] = (used[p.concept_id] ?? 0) + 1;
        if (a && a.correct) results[p.concept_id] = 'first'; else { delete results[p.concept_id]; review.push(p.concept_id); } });
      SK.store.journey({ results, corrected:Object.keys(results), needsReview:review, post:{ ...st, done:true } });
      finishJourney(); } });
    next.disabled = !chosen;
    const opts = q.options.map(([text, ok], k) => ({ id:String(k), text, correct:!!ok }));
    const group = ui.options(opts, { onPick:(it) => { st.answers[step.concept_id] = { id:it.id, correct:it.correct }; next.disabled = false; } });
    if (chosen){ const b = group.querySelector(`[data-id="${chosen.id}"]`); if (b) b.setAttribute('aria-checked','true'); }
    return h('section',{class:'screen pre-mcq'},
      h('header',{class:'ql-bar'}, h('button',{class:'icon-btn', 'aria-label':t('common.back'), onclick:()=>{ if (i > 0){ st.i = i-1; go('post',{replace:true}); } else SK.router.back(); }}, ui.svg(I.back)),
        h('div',{class:'ql-bar-mid'}, h('span',{class:'ql-bar-title'}, t('post.title'))), h('span',{class:'ql-step-count'}, t('ql.nOf',{n:i+1,total:n}))),
      h('div',{class:'ql-progress', role:'progressbar', 'aria-valuemin':'1', 'aria-valuemax':String(n), 'aria-valuenow':String(i+1)}, h('i',{style:`--w:${Math.round(100*(i+1)/n)}%`})),
      h('h1',{class:'pre-q', id:'screen-title', tabindex:'-1', 'data-question':q.id, 'data-concept':step.concept_id}, q.q), group, h('footer',{class:'pre-foot'}, next));
  };
  /** «راجع ما تحتاجه فقط»: re-teach only the points still wrong, then a post-test on those only */
  function reviewOnly(){
    const j = J(); const ids = j.needsReview || []; if (!ids.length) return;
    const plan = ids.map(id => { const m = D.conceptMap[id] || {}; return { concept_id:id, reason:'confused', kb_id:m.kb_id || null, question_ids:m.question_ids || [] }; });
    SK.store.journey({ plan, queue:ids, step:0, stage:'explain', post:null, fullPath:false, learningPath:'review', reviewRound:(j.reviewRound||0)+1 }); SK.services.progress.persist(); go('explain',{reset:true});
  }

  S.result = () => {
    const j = J(); const PRG = SK.services.progress; const before = j.analysis ? PRG.calculatePreProgress(j) : (j.before ?? 0), after = j.analysis ? PRG.calculateJourneyProgress(j) : (j.after ?? before);
    const fixed = (j.corrected||[]).map(cTitle);
    if (SK.store.get().session) SK.services.progress.persist({completed:true});
    const bar = (label, v, cls) => h('div',{class:'compare-row'}, h('div',{class:'compare-head'}, h('span',{}, label), h('b',{}, v+'%')),
      h('div',{class:'meter', role:'img', 'aria-label':`${label} ${v}%`}, h('i',{class:cls, style:`--w:${v}%`})));
    const saved = SK.store.get().session ? h('p',{class:'saved-note'}, ui.svg(I.check), t('res.saved')) : null;
    const review = (j.needsReview || []);
    const improved = Object.keys(j.results||{}).filter(id => !review.includes(id));
    return h('section',{class:'screen'},
      h('div',{class:'result-hero'}, h('span',{class:'result-check', html:'<svg viewBox="0 0 52 52" width="76" height="76"><circle cx="26" cy="26" r="24" fill="currentColor" opacity=".12"/><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}),
        h('h1',{class:'screen-title'}, after>=100 ? t('res.ready') : (after > (j.before||0) ? t('res.wellDone') : t('res.closer'))), j.preSkipped ? null : h('p',{class:'lead'}, after > (j.before||0) ? t('res.improved') : t('res.keepGoing'))),
      j.preSkipped ? ui.card('compare', h('p',{class:'fp-zero'}, ui.svg(I.check), t('res.fromZero')), bar(t('res.postTest'), after, 'after')) :
      ui.card('compare', bar(t(j.fullPath ? 'res.preTest' : 'res.before'), before, 'before'), h('div',{class:'compare-arrow', 'aria-hidden':'true'}, '↓'), bar(t(j.fullPath ? 'res.postTest' : 'res.after'), after, 'after'),
        j.fullPath && after > before ? h('p',{class:'fp-gain'}, t('res.gain'), ' ', h('bdi',{dir:'ltr'}, `${before}% → ${after}%`)) : null),
      saved,
      improved.length ? ui.card('good', h('h2',{class:'box-title'}, ui.svg(I.check), t('res.masteredNow')), h('ul',{class:'tick-list'}, improved.map(id=>h('li',{}, cTitle(id))))) : null,
      review.length ? ui.card('attention', h('h2',{class:'box-title'}, ui.svg(I.replay), t('res.needReview')), h('ul',{class:'dot-list'}, review.map(id=>h('li',{}, cTitle(id)))),
        ui.button(t('res.reviewOnly'),{variant:'ghost', onclick:reviewOnly})) : null,
      h('div',{class:'stack'}, ui.button(t('common.listen'),{variant:'ghost', icon:'speaker', onclick:()=>SK.services.speech.speak((j.preSkipped ? `${t('res.fromZero')}. ${t('res.postTest')} ${j.after}%. ` : `${t('res.before')} ${j.before}%. ${t('res.after')} ${j.after}%. `) + (Object.keys(j.results||{}).filter(id=>!(j.needsReview||[]).includes(id)).length ? `${t('res.masteredNow')}: ${Object.keys(j.results||{}).filter(id=>!(j.needsReview||[]).includes(id)).map(cTitle).join('، ')}. ` : '') + ((j.needsReview||[]).length ? `${t('res.needReview')}: ${(j.needsReview||[]).map(cTitle).join('، ')}.` : ''), SK.i18n.lang())}), SK.services.demoMedia && SK.services.demoMedia.hasVideo('janaza') ? ui.button(t('lv.full'),{variant:'ghost', onclick:()=>{ const d = SK.store.get().demo = SK.store.get().demo || {}; Object.assign(d, { i:0, mode:'full' }); if (SK.haram) SK.haram.state().topic = 'janaza'; go('demo'); }}) : null, ui.button(t('common.quickReview'),{variant:'ghost', icon:'bolt', onclick:()=>go('quick')}), ui.button(t('res.end'),{onclick:()=>go('worship',{reset:true})})));
  };
  S.result.nav = 'journey';

  // ---------- «قريبًا» page for journeys not available yet (no religious content) ----------
  S.soon = () => { const w = D.worships.find(x => x.id === SK.store.get().soonWorship) || D.worships[1];
    return ui.screen({ eyebrow:t('common.soon'), title:w.name, body:[ ui.card('', h('p',{}, t('soon.text')), h('p',{class:'muted'}, t('soon.available'))) ],
      footer:[ ui.button(t('common.backHome'),{onclick:()=>go('worship',{reset:true})}) ] }); };
  S.soon.nav = 'home';

  // ---------- 13. Quick review ----------
  S.quick = () => {
    const steps = SK.sources.steps('janaza').filter(g => g.ok);
    return ui.screen({ eyebrow:t('common.quickReview'), title:t('q.title'),
      body:[ ui.stepCards('janaza'),
        h('p',{class:'calm center'}, t('q.standing')),
        ui.button(t('q.listenAll'),{variant:'ghost', icon:'speaker', onclick:()=>SK.services.speech.speak(steps.map(g=>t(g.fact.titleKey)+'. '+SK.sources.text(g.fact,'directive')).join(' '), SK.i18n.LANGS[SK.i18n.lang()].speech)}) ] });
  };
  S.quick.nav = 'home';

  // ---------- 14. Sakeenah card (placeholder) ----------
  const qrArt = () => { let s=''; let seed=7; const r=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
    for(let y=0;y<21;y++)for(let x=0;x<21;x++){const f=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);if(!f&&r()<.45)s+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
    const fp=(x,y)=>`<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3"/>`;
    return `<svg viewBox="-1 -1 23 23" width="100%" height="100%" aria-hidden="true"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/><g fill="currentColor">${s}${fp(0,0)}${fp(14,0)}${fp(0,14)}</g></svg>`; };
  S.card = () => ui.screen({ title:t('card.title'), back:false,
    body:[ ui.card('sk-card', h('div',{class:'sk-card-top'}, ui.logo(), h('span',{class:'soon-pill'}, t('common.soon'))),
        h('div',{class:'qr-box'}, h('div',{class:'qr-art', html:qrArt()}), h('span',{class:'qr-veil'}, t('card.example'))),
        h('p',{class:'sk-card-main'}, t('card.keeps')),
        h('p',{class:'muted'}, t('card.noLogin'))),
      ui.card('', h('p',{class:'muted small'}, t('card.placeholderInfo'))),
      ui.button(t('card.scanSoon'),{variant:'ghost', icon:'qr', disabled:true}) ] });
  S.card.nav = 'card';

  // ---------- My journey ----------
  S.journey = () => {
    const j = J(); const PRG = SK.services.progress; const saved = PRG.saved();
    // the card's saved record is the truth when a card is active; otherwise the live (guest) journey
    const src = saved && saved.conceptStates ? saved : (j.analysis ? j : null);
    if (src && j.stage==='idle') j.stage = (saved && saved.status==='completed') ? 'done' : 'explain';
    if (src){ j.before = saved && saved.conceptStates ? PRG.calculateJourneyProgress({ conceptStates: Object.fromEntries(Object.entries(saved.conceptStates).map(([k,v])=>[k, v==='corrected' ? 'confused' : v])) }) : PRG.calculatePreProgress(j);
              j.after = PRG.calculateJourneyProgress(src); } const stages = [['test',t('jr.s1')],['insight',t('jr.s2')],['explain',t('jr.s3')],['source',t('jr.s4')],['check',t('jr.s5')],['done',t('jr.s6')]];
    const reached = { idle:-1, analyzing:0, insight:1, explain:3, done:5 }[j.stage] ?? -1;
    return ui.screen({ title:t('common.myJourney'), back:false,
      body:[ ui.card('', h('ol',{class:'timeline'}, stages.map(([k,l],i)=>h('li',{class: i<=reached?'is-done':''}, h('span',{class:'tl-dot'}, i<=reached?ui.svg(I.check):String(i+1)), l)))),
        src ? ui.card('compare', h('p',{class:'center'}, (j.preSkipped || (saved && saved.state && saved.state.preSkipped)) ? t('jr.fromZero',{a:j.after}) : t('jr.compare',{b:j.before,a:j.after,arrow: SK.i18n.dir()==='rtl' ? '←' : '→'}))) : h('p',{class:'muted center'}, t('jr.none')),
        ui.button(j.stage==='done' ? t('common.newJourney') : t('start.begin'),{onclick:()=>{ SK.store.resetJourney(); go('pre'); }}) ] });
  };
  S.journey.nav = 'journey';
})(window.SK);
