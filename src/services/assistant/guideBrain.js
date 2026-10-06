/* ===================== Adaptive Personal Learning Guide (chat brain) =====================
   Uses ONLY data that already exists in the learner's journey / Sakeenah card. Adds no religious content.
   Context priority: 1 currentScreen · 2 currentJourney · 3 currentConcept/currentStep · 4 active unfinished journey · 5 saved history · 6 general */
(function(SK){
  const D = SK.data, N = t => SK.services.understanding.normalizeArabic(t);
  const PR = () => SK.services.progress, GC = () => SK.services.guideContext;
  const title = id => (D.concept(id)||{title:''}).title;
  const SCREEN = { explain:'learning', insight:'learning', check:'assessment', pre:'assessment', analyzing:'assessment', result:'result', quick:'review', journey:'journey', worship:'home', welcome:'home', soon:'unavailable_journey', haram:'haram', haramTopics:'haram', haramHelp:'haram', haramLearn:'haram', haramDone:'haram', haramQuiz:'assessment', post:'assessment', ready:'learning' };

  /** learner profile + context as the guide sees it (internal; never shown raw) */
  function loadProfileContext(){
    const st = SK.store.get(); const j = st.journey, route = st.route;
    const saved = PR().saved();
    const src = saved && saved.conceptStates ? saved : null;
    const live = j.analysis ? PR().conceptStates(j) : null;
    const states = src ? src.conceptStates : (live || {});
    const by = s => Object.keys(states).filter(id => states[id] === s);
    const liveRemaining = j.analysis ? SK.services.plan.explanationQueue(j.analysis).filter(id => !(j.results||{})[id]) : [];
    const ctx = GC().current();
    const screen = SCREEN[route] || route;
    const screenJourney = route === 'soon' ? (st.soonWorship || 'unknown') : (['explain','insight','check','pre','analyzing','result','quick','haramHelp','haramLearn'].includes(route) ? 'funeral_prayer' : null);
    const hasJanazah = !!(src || live);
    return {
      cardId: st.session ? st.session.cardId : null,
      currentJourney: screenJourney || (hasJanazah ? 'funeral_prayer' : null),
      savedJourney: hasJanazah ? 'funeral_prayer' : null,
      currentStep: src ? src.currentStep : (liveRemaining[0] || null),
      progressPercent: src ? PR().calculateJourneyProgress(src) : (live ? PR().calculateJourneyProgress(j) : 0),
      masteredConcepts: src ? (src.masteredConcepts||[]) : by('mastered'),
      correctedConcepts: src ? (src.correctedConcepts||[]) : by('corrected'),
      confusedConcepts: src ? (src.confusedConcepts||[]) : (j.analysis ? j.analysis.confused.map(c=>c.concept_id) : []),
      lastCompletedStep: src ? src.lastCompletedStep : (Object.keys(j.results||{}).slice(-1)[0] || null),
      status: src ? src.status : (j.stage==='done' ? 'completed' : (j.analysis ? 'in_progress' : null)),
      states,
      context: { mode: /^haram/.test(route) ? 'haram' : 'normal', priority: /^haram/.test(route) ? 'quick_help' : 'learning', journeyId: screenJourney || (hasJanazah ? 'funeral_prayer' : null), currentConcept: screenJourney==='funeral_prayer' ? ctx.currentConcept : null, currentScreen: screen, route,
        currentStep: src ? src.currentStep : (liveRemaining[0]||null) }
    };
  }

  /* ---------- intent router ---------- */
  const W = list => list.map(N);
  const NAV    = W(['devam et','nerede kaldım','where am i','go on','جاری رکھیں','میں کہاں رکا','کہاں رکا','استمع للشرح','كمل','نكمل','اكمل','خلنا نكمل','وين وقفت','اين وقفت','اين توقفت','وين توقفت','من حيث توقفت','وين انا','اين انا','ارجعني','ارجع للرئيسيه','الرئيسيه','مراجعه سريعه','اختبرني','الرحلات المتاحه','continue','resume','where did i stop']);
  const SOURCE = W(['kaynak','delil','ماخذ','حوالہ','دلیل','مصدر','المصدر','مصدرها','الدليل','ما الدليل','وش الدليل','مرجع','source','evidence']);
  const HELP   = W(['after it','and after','then what','what next','next step','simpler','sonra ne','açıkla','basit','اس کے بعد','وضاحت','سمجھائیں','بعدها','بعده','وضحها','وضح','اشرحها','اشرح','اعد الشرح','عيد الشرح','ما فهمت','مافهمت','نراجع','راجع','ثبت','ابسط','explain','again']);
  const GENERAL= W(['thank you','how do i use','merhaba','teşekkür','yardım','شکریہ','مدد','شكرا','جزاك الله','مرحبا','هلا','السلام عليكم','صباح الخير','مساء الخير','كيف استخدم','ساعدني','وش تقدر','ماذا تستطيع','من انت','hello','thanks','help']);
  const RELIG  = W(['يجوز','اصلي','صليت','مات','توفي','died','pray','funeral','janazah','takbir','takbeer','cenaze','tekbir','fatiha','dua','namaz','جنازہ','تکبیر','نماز','صلاه','الصلاه','تكبير','تكبيره','التكبيرات','جنازه','الجنازه','ميت','للميت','دعاء','الدعاء','حكم','فاتحه','الفاتحه','التسليم','ركوع','سجود','النبي','وضوء','صيام','زكاه','حج','السهو','fatiha','prayer','janaza','takb']);
  const QWORD  = /^(كم|كيف|ما|ماذا|هل|متي|لماذا|ليش|وش|ايش|اين|what|how|is|can|why)\s/;
  const ORD_WORDS = [['الاولي','اولي','الاول'],['الثانيه','ثانيه','الثاني'],['الثالثه','ثالثه','الثالث'],['الرابعه','رابعه','الرابع','الاخيره']].map(W);
  const ordIn = n => { const toks = n.split(' ').map(t => t.replace(/^(و|ف|ب)/,'')); for (let i=0;i<4;i++) if (toks.some(t => ORD_WORDS[i].includes(t))) return i+1; return 0; };
  function classifyIntent(text, memory){
    const n = ' ' + N(text) + ' ';
    if (!n.trim()) return 'UNKNOWN';
    if (GENERAL.some(w => n.includes(' '+w+' ') || n.trim().startsWith(w))) return 'GENERAL_ASSISTANCE';
    if (NAV.some(w => n.includes(' '+w+' ') || n.trim() === w || n.includes(w+' '))) return 'NAVIGATION';
    if (SOURCE.some(w => n.includes(w))) return 'SOURCE_REQUEST';
    if (HELP.some(w => n.includes(w))) return 'LEARNING_HELP';
    if (memory && memory.topic && isFollowUp(text)) return 'RELIGIOUS_QUESTION';
    if (RELIG.some(w => n.includes(w)) || QWORD.test(n.trim()+' ')) return 'RELIGIOUS_QUESTION';
    return 'UNKNOWN';
  }

  /* ---------- conversation memory (session only) ----------
     A short follow-up («وبعد الثانية؟», «والثالثة؟») is rewritten into a full question about the same topic.
     The rewritten question still goes through Retrieval -> Evidence Gate; memory never bypasses it. */
  const ORD_AR = ['','الأولى','الثانية','الثالثة','الرابعة'];
  function isFollowUp(text){ const n = N(text); return n.split(' ').length <= 4 && (/^(و|طيب|طب|ثم|وبعد)/.test(n) || !!ordIn(n)) && !QWORD.test(n+' '); }
  function rewriteFollowUp(text, memory){
    if (!memory || !memory.topic || !isFollowUp(text)) return null;
    const o = ordIn(N(text));
    if (o && ['takbir_steps','takbir_count'].includes(memory.topic)) return { query:`ماذا أفعل بعد التكبيرة ${ORD_AR[o]}`, concept:['first_takbir','second_takbir','third_takbir','fourth_takbir'][o-1] };
    return null;
  }
  const topicOf = concept => !concept ? null : concept === 'takbir_count' ? 'takbir_count' : /takbir$/.test(concept) ? 'takbir_steps' : concept;

  /* ---------- adaptive suggestions: max 3, follow the context priority, no religious facts in labels ---------- */
  const S = (label, intent, extra={}) => ({ label, intent, ...extra });
  function getAdaptiveSuggestions(p, ctx, memory){
    const scr = ctx.currentScreen;
    // 1) the screen decides first
    if (scr === 'assessment') return [S(SK.t('sg.readQ'),'NAVIGATION',{action:'read'})];
    // Haram mode: shorter, more direct
    if (ctx.mode === 'haram'){
      if (ctx.currentConcept) return [S(SK.t('sg.whatNow'),'LEARNING_HELP',{concept:ctx.currentConcept}), S(SK.t('sg.explainIt'),'LEARNING_HELP',{concept:ctx.currentConcept, simple:true}), S(SK.t('sg.showSource'),'SOURCE_REQUEST',{concept:ctx.currentConcept})];
      return [S(SK.t('sg.whatNow'),'NAVIGATION',{action:'haram_help'}), S(SK.t('sg.listenExpl'),'NAVIGATION',{action:'haram_listen'}), S(SK.t('sg.countQ'),'RELIGIOUS_QUESTION',{query:'كم عدد تكبيرات صلاة الجنازة'})];
    }
    if (scr === 'unavailable_journey') return [S(SK.t('sg.available'),'NAVIGATION',{action:'available'}), S(SK.t('sg.home'),'NAVIGATION',{action:'home'}), S(SK.t('sg.howUse'),'GENERAL_ASSISTANCE')];
    const corrected = new Set(p.correctedConcepts||[]);
    const reviewTarget = (p.confusedConcepts||[]).find(id => p.states[id] !== 'mastered' && !corrected.has(id)) || null;
    // 2–3) inside the funeral-prayer journey, on a concept
    if (ctx.journeyId === 'funeral_prayer' && ctx.currentConcept && scr === 'learning')
      return [S(SK.t('sg.whatNext'),'LEARNING_HELP',{concept:ctx.currentConcept}), S(SK.t('sg.explainIt'),'LEARNING_HELP',{concept:ctx.currentConcept}), S(SK.t('sg.sourceQ'),'SOURCE_REQUEST',{concept:ctx.currentConcept})];
    if (ctx.journeyId === 'funeral_prayer' && reviewTarget && ['result','journey','review','learning'].includes(scr))
      return [S(SK.t('sg.reviewMistake'),'NAVIGATION',{action:'review', concept:reviewTarget}), S(SK.t('sg.retest'),'NAVIGATION',{action:'retest', concept:reviewTarget}), S(SK.t('sg.simpler'),'LEARNING_HELP',{concept:reviewTarget, simple:true})];
    // follow-up chips after an answer in this conversation
    if (memory && memory.lastConcept && memory.lastAnswered && memory.route === ctx.route){
      const order = ['takbir_count','first_takbir','second_takbir','third_takbir','fourth_takbir'];
      const k = order.indexOf(memory.lastConcept);
      const nextOrd = k >= 0 && k < 4 ? ORD_AR[k+1] : null;
      const out = []; if (nextOrd) out.push({ label:SK.t('sg.after',{o:SK.t('ord.'+(k+1))}), intent:'FOLLOW_UP', kind:'next', concept:memory.lastConcept });
      out.push(S(SK.t('sg.sourceQ'),'SOURCE_REQUEST',{concept:memory.lastConcept}));
      if (p.status === 'in_progress' && p.currentStep) out.push(S(SK.t('sg.resume'),'NAVIGATION',{action:'resume'}));
      return out.slice(0,3);
    }
    // 4) home with an unfinished journey
    if (['home','journey','review','result'].includes(scr) && p.status === 'in_progress' && p.currentStep)
      return [S(SK.t('sg.resume'),'NAVIGATION',{action:'resume'}), S(SK.t('sg.where'),'NAVIGATION',{action:'where'}), S(SK.t('sg.quick'),'NAVIGATION',{action:'consolidate'})];
    // 5) saved history (completed or corrected points)
    if (p.status === 'completed') return [S(SK.t('sg.consolidate'),'NAVIGATION',{action:'consolidate'}), S(SK.t('sg.next'),'NAVIGATION',{action:'next'}), S(SK.t('sg.howPray'),'RELIGIOUS_QUESTION',{query:'كيف اصلي صلاة الجنازة'})];
    // 6) general — on the home screen only, a journey may be proposed
    return scr === 'home' ? [S(SK.t('sg.startJ'),'NAVIGATION',{action:'start'}), S(SK.t('sg.countQ'),'RELIGIOUS_QUESTION',{query:'كم عدد تكبيرات صلاة الجنازة'}), S(SK.t('sg.howUse'),'GENERAL_ASSISTANCE')]
                          : [S(SK.t('sg.howUse'),'GENERAL_ASSISTANCE'), S(SK.t('sg.home'),'NAVIGATION',{action:'home'})];
  }

  /* ---------- follow-ups under the last message (2–3, from the last turn + context) ---------- */
  function getFollowUps(turn, p, ctx){
    const inJanazah = ctx.journeyId === 'funeral_prayer' || (!ctx.journeyId && p.savedJourney);
    const other = ctx.currentScreen === 'unavailable_journey';
    const c = turn.concept;
    const isStep = !!c && /takbir/.test(c);
    const F = (label, kind, extra={}) => ({ label, kind, intent:'FOLLOW_UP', concept:c, ...extra });
    let out = [];
    if (turn.kind === 'engine' || turn.kind === 'explain_step' || turn.kind === 'source'){ if (!other && (inJanazah || turn.concept || turn.kind === 'engine')) return SK.services.guideEngine.suggest(c).map(x => ({ ...x, intent:'FOLLOW_UP' })); }
    switch (turn.kind){
      case 'explain_step': out = [F(SK.t('sg.nextStep'),'next'), F(SK.t('sg.simpler2'),'simpler'), (D.questions[c]||[]).length ? F(SK.t('sg.quizMe'),'quiz') : null]; break;
      case 'supported':    out = [F(SK.t('sg.sourceQ'),'source'), F(SK.t('sg.more'),'more'), isStep ? F(SK.t('sg.whatAfter'),'next') : null]; break;
      case 'source':       out = [F(SK.t('sg.backExpl'),'back'), isStep ? F(SK.t('sg.nextStep'),'next') : null]; break;
      case 'quiz_wrong':   out = [F(SK.t('sg.explainMistake'),'quiz_explain'), F(SK.t('sg.repeatQ'),'quiz_repeat'), F(SK.t('sg.reviewWithMe'),'review')]; break;
      case 'quiz_right':   out = [F(SK.t('sg.nextQ'),'quiz_next'), F(SK.t('sg.whatLeft'),'remaining')]; break;
      case 'quiz_open':    out = [F(SK.t('sg.repeatQ'),'quiz_repeat'), F(SK.t('sg.whatLeft'),'remaining')]; break;
      case 'nav_where':    out = p.status==='in_progress' ? [{ label:SK.t('sg.resume'), intent:'NAVIGATION', action:'resume' }, { label:SK.t('sg.quick'), intent:'NAVIGATION', action:'consolidate' }] : []; break;
      case 'refused':      out = [isStep ? F(SK.t('sg.nextStep'),'next') : null, p.status==='in_progress' && p.currentStep ? { label:SK.t('sg.resume'), intent:'NAVIGATION', action:'resume' } : null, { label:SK.t('sg.howUse'), intent:'GENERAL_ASSISTANCE' }]; break;
    }
    out = out.filter(Boolean);
    // never point to another journey: outside the funeral prayer, drop journey-step follow-ups
    if (other || !inJanazah) out = out.filter(s => !['next','quiz','quiz_next','review','remaining','quiz_repeat','quiz_explain'].includes(s.kind) && s.action !== 'resume' && s.action !== 'consolidate');
    if (!out.length) return getAdaptiveSuggestions(p, ctx, null);
    if (out.length === 1) out.push(...getAdaptiveSuggestions(p, ctx, null).filter(s => s.label !== out[0].label).slice(0,1));
    return out.slice(0, 3);
  }

  SK.services.guideBrain = { getFollowUps, loadProfileContext, classifyIntent, getAdaptiveSuggestions, rewriteFollowUp, isFollowUp, topicOf, conceptTitle:title };
})(window.SK);
