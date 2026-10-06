/* Guide context: what the learner is doing right now (no personal data), and resolution of
   contextual questions like «وش أسوي بعدها؟» into an explicit question for the SAME evidence-gated pipeline. */
(function(SK){
  const D = SK.data;
  const N = t => SK.services.understanding.normalizeArabic(t);
  // concept -> the explicit question the guide asks the knowledge base
  const CONCEPT_QUERY = {
    takbir_count:'كم عدد تكبيرات صلاة الجنازة',
    first_takbir:'ماذا أفعل بعد التكبيرة الأولى',
    second_takbir:'ماذا أفعل بعد التكبيرة الثانية',
    third_takbir:'ماذا أفعل بعد التكبيرة الثالثة',
    fourth_takbir:'ماذا أفعل بعد التكبيرة الرابعة',
    posture_standing:'هل في صلاة الجنازة ركوع'
  };
  const SCREEN_KIND = { explain:'learning', insight:'learning', check:'assessment', pre:'assessment', analyzing:'assessment', result:'result', quick:'review', journey:'journey', worship:'home', welcome:'home' };
  const AFTER  = ['what next','what do i do next','next step','sonra ne','şimdi ne','اس کے بعد','اب کیا','بعدها','بعده','بعد هذي','بعد هذه','الخطوه التاليه','الخطوه الجايه','وش بعد','ايش بعد','ماذا بعد','وش اسوي','ايش اسوي','ماذا افعل الان','وش اسوي الحين','what next','next step'].map(N);
  const EXPLAIN= ['explain','simpler','açıkla','basit','وضاحت','سمجھائیں','وضحها','وضح','اشرحها','اشرح','اعد الشرح','عيد الشرح','ما فهمت','مافهمت','explain'].map(N);
  const SOURCE = ['source','kaynak','ماخذ','حوالہ','مصدر','المصدر','الدليل','وش الدليل','ما الدليل','source'].map(N);

  SK.services.guideContext = {
    CONCEPT_QUERY,
    /** current context — only the step, progress and concepts needing review; nothing personal */
    current(){
      const st = SK.store.get(), j = st.journey, route = st.route;
      const step = j.plan && j.plan.length ? j.plan[Math.min(j.step, j.plan.length-1)] : null;
      let concept = (['explain','check','insight'].includes(route) && step) ? step.concept_id : null;
      if (route === 'haramHelp' && SK.haram){ const hs = SK.haram.state(); concept = SK.haram.STEPS[hs.step||0]; }
      const saved = SK.services.progress.saved();
      if (!concept && saved && saved.currentStep) concept = saved.currentStep;
      return {
        currentScreen: SCREEN_KIND[route] || route, route,
        currentJourney: j.analysis || saved ? 'funeral_prayer' : null,
        currentConcept: concept,
        userProgress: j.analysis ? SK.services.progress.calculateJourneyProgress(j) : (saved ? SK.services.progress.calculateJourneyProgress(saved) : null),
        needsReview: j.analysis ? SK.services.plan.explanationQueue(j.analysis) : (saved ? saved.needingReview || [] : [])
      };
    },
    /** turn a contextual question into an explicit one; returns { query, resolved:bool, kind } */
    resolve(question, ctx){
      const n = ' ' + N(question) + ' ';
      const c = ctx && ctx.currentConcept;
      const kind = SOURCE.some(w=>n.includes(w)) ? 'source' : AFTER.some(w=>n.includes(w)) ? 'after' : EXPLAIN.some(w=>n.includes(w)) ? 'explain' : null;
      if (!kind || !c || !CONCEPT_QUERY[c]) return { query:question, resolved:false, kind };
      // «بعدها» while on the takbeer count means: what comes after the first takbeer
      const target = (kind==='after' && c==='takbir_count') ? 'first_takbir' : c;
      return { query: CONCEPT_QUERY[target], resolved:true, kind, concept:c };
    },
    conceptTitle: id => (D.concept(id)||{title:''}).title
  };
})(window.SK);
