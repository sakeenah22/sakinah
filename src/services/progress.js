/* Learning progress, always tied to the cardId.
   saveProgress(cardId, 'funeral_prayer', data) is called on every step of progress; restore never creates a new journey.
   funeral_prayer = { status, progressPercent, preScore, postScore, masteredConcepts, correctedConcepts, confusedConcepts,
                      needingReview, currentStep, lastCompletedStep, state:{answer, analysis, plan, step, results, stage}, lastUpdatedAt } */
(function(SK){
  const D = SK.data;
  const JOURNEY = 'funeral_prayer';
  const TAKBEER = ['first_takbir','second_takbir','third_takbir','fourth_takbir'];
  const ST = () => SK.services.storage;
  const sess = () => SK.store.get().session;
  const canonList = a => [...new Set((a||[]).map(D.canon))];

  /* ===== Single Source of Truth for progress =====
     Concept states are what we store. The percentage is ALWAYS derived from them by calculateJourneyProgress().
       learning concepts = the essential concepts (takbir_count + the four takbeers) — the same set the analyzer scores
       mastered  = known in the pre-assessment
       corrected = passed the post-test after an explanation (first try or after a retry) -> counts as learned
       confused / missing = not learned yet
     progress = (mastered + corrected) / total learning concepts */
  const LEARNING = () => SK.services.understanding.ESSENTIAL;
  const LEARNED = new Set(['mastered','corrected']);
  /** concept states from a live journey { analysis, results } */
  function conceptStates(j){
    const a = j && j.analysis; if (!a) return {};
    const st = {};
    D.concepts.forEach(c => { st[c.id] = 'missing'; });
    a.confused.forEach(c => { st[c.concept_id] = 'confused'; });
    a.mastered.forEach(id => { st[id] = 'mastered'; });
    Object.keys(j.results||{}).forEach(id => { if (st[id] !== 'mastered') st[id] = 'corrected'; });
    return st;
  }
  /** THE progress function. Accepts a live journey, a saved journey record, or { conceptStates }. */
  function calculateJourneyProgress(journey){
    if (!journey) return 0;
    const st = journey.conceptStates || conceptStates(journey);
    const ids = LEARNING(); if (!ids.length) return 0;
    return Math.round(100 * ids.filter(id => LEARNED.has(st[id])).length / ids.length);
  }
  /** progress before any explanation (pre-assessment only) — same function, no post-test results */
  const calculatePreProgress = j => calculateJourneyProgress({ analysis: j && j.analysis, results:{} });
  const computeProgress = calculateJourneyProgress;   // old name kept for callers

  function takbeerStatus(known, focusId){
    const k = canonList(known), f = focusId ? D.canon(focusId) : null;
    return TAKBEER.map((id,i)=>({ id, n:i+1, state: k.includes(id) ? 'done' : (id===f ? 'current' : 'todo') }));
  }
  /** concepts still to learn, in order: plan steps without a result, then any other priority concepts */
  function remaining(j){
    const a = j.analysis; if (!a) return [];
    const done = new Set([...a.mastered, ...Object.keys(j.results||{})]);
    return SK.services.plan.explanationQueue(a).filter(id => !done.has(id));
  }
  const validJourney = js => !!(js && js.analysis && Array.isArray(js.analysis.priority_concepts));

  SK.services.progress = {
    JOURNEY, TAKBEER, takbeerStatus, computeProgress, validJourney, LEARNING,
    active(){ return !!sess(); },
    /** save the live journey under the active card */
    persist({completed=false}={}){
      const s = sess(); if (!s) return null;
      const j = SK.store.get().journey; const a = j.analysis; if (!a || a.intent==='out_of_scope') return null;
      const results = j.results || {};
      const left = remaining(j);
      const done = completed || j.stage === 'done';
      const corrected = Object.keys(results);
      const lastCompleted = corrected.length ? corrected[corrected.length-1] : null;
      const states = conceptStates(j);
      return ST().saveProgress(s.cardId, JOURNEY, {
        status: done && !left.length ? 'completed' : 'in_progress',
        conceptStates: states,                               // source of truth
        progressPercent: calculateJourneyProgress({ conceptStates: states }), // cached copy, always re-derivable
        preScore: j.preSkipped ? null : calculatePreProgress(j), learningPath: j.learningPath || null, preTestSkipped: !!j.preSkipped, postScore: corrected.length ? calculateJourneyProgress({ conceptStates: states }) : null,
        masteredConcepts: canonList(a.mastered),
        correctedConcepts: canonList(corrected),
        confusedConcepts: canonList(a.confused.map(c=>c.concept_id)),
        needingReview: canonList([...left, ...corrected.filter(id=>results[id]==='retry')]),
        currentStep: left[0] || null,
        lastCompletedStep: lastCompleted,
        state: { answer:j.answer, analysis:a, plan:j.plan, step:j.step, results, before:j.before, stage:j.stage, fullPath:!!j.fullPath, learningPath:j.learningPath || null, preSkipped:!!j.preSkipped, preSkipReason:j.preSkipReason || null, engine_version:a.engine_version }
      });
    },
    /** read the saved journey of the active card */
    saved(){ const s = sess(); return s ? ST().loadJourney(s.cardId, JOURNEY) : null; },
    /** resume from the next incomplete concept — never restarts a saved journey */
    async resume(){
      const s = sess(); const saved = s && ST().loadJourney(s.cardId, JOURNEY);
      const st = saved && saved.state; if (!st || !st.answer) return false;
      let analysis = st.analysis, results = { ...(st.results||{}) };
      if (saved.conceptStates && validJourney(st)){
        // trust the stored concept states: they are what the learner saw before leaving
        const cs = saved.conceptStates;
        analysis = { ...analysis, mastered: Object.keys(cs).filter(id=>cs[id]==='mastered'),
          confused: analysis.confused.filter(c => cs[c.concept_id] !== 'mastered'),
          missing: Object.keys(cs).filter(id=>cs[id]==='missing') };
        Object.keys(cs).forEach(id => { if (cs[id]==='corrected' && !results[id]) results[id] = 'first'; });
      } else {
        // legacy record without concept states: re-analyze the saved answer with the current engine
        const U = SK.services.understanding;
        if (!validJourney(st) || analysis.engine_version !== U.ENGINE_VERSION) analysis = await U.analyzeUnderstanding(st.answer);
        results = Object.fromEntries(Object.entries(results).filter(([id]) => !analysis.mastered.includes(id)));
      }
      const left = remaining({ analysis, results });
      // full learning path still in its explanation stage -> continue the same ordered path at the saved point
      if (st.fullPath && !Object.keys(results).length && st.stage !== 'done'){
        const plan = SK.services.plan.fullPath(); SK.store.resetJourney();
        SK.store.journey({ answer:st.answer, analysis, plan, fullPath:true, learningPath:'full', preSkipped:!!st.preSkipped, preSkipReason:st.preSkipReason || null, queue:plan.map(p=>p.concept_id), step:Math.min(st.step||0, plan.length-1), corrected:[], results:{},
          before: calculatePreProgress({ analysis }), stage:'explain', usedQ:{}, postAnswers:{} });
        return 'explain';
      }
      const plan = SK.services.plan.build({ ...analysis, mastered:[...analysis.mastered, ...Object.keys(results)], confused:analysis.confused.filter(c=>!results[c.concept_id]), missing:analysis.missing.filter(id=>!results[id]) }, 3);
      SK.store.resetJourney();
      SK.store.journey({ answer:st.answer, analysis, plan, queue:plan.map(p=>p.concept_id), step:0, corrected:Object.keys(results), results,
        before: calculatePreProgress({ analysis }), stage: left.length ? 'explain' : 'done', usedQ:{}, postAnswers:{} });
      SK.store.journey({ after: calculateJourneyProgress({ analysis, results }) });
      return left.length ? 'explain' : 'done';
    },
    conceptStates, calculateJourneyProgress, calculatePreProgress
  };
})(window.SK);
