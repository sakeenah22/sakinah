/* ===================== Adaptive learning plan =====================
   Pre-assessment -> mastered / confused / missing -> ranked priority_concepts ->
   for each priority concept: explanation (its KB item) -> post-test (a question of THAT concept).
   Invariant: a concept the learner already mastered is never explained or tested. */
(function(SK){
  const D = SK.data;
  SK.services.plan = {
    /** explanationQueue = CONFUSED (in answer order) + MISSING (in prayer order). MASTERED never enters. */
    explanationQueue(analysis){
      if (!analysis || analysis.intent === 'out_of_scope') return [];
      const mastered = new Set(analysis.mastered);
      return [...new Set([...analysis.confused.map(c=>c.concept_id), ...analysis.missing])].filter(id => !mastered.has(id));
    },
    /** build the ordered plan from an analysis result */
    build(analysis, max=3){
      if (!analysis || analysis.intent === 'out_of_scope') return [];
      const ranked = SK.services.plan.explanationQueue(analysis);
      const confused = new Set(analysis.confused.map(c=>c.concept_id));
      return ranked.slice(0, max).map(id => {
        const m = D.conceptMap[id] || {};
        return { concept_id:id, reason: confused.has(id) ? 'confused' : 'missing', kb_id:m.kb_id || null, question_ids:m.question_ids || [] };
      });
    },
    /** FULL LEARNING PATH — decided by Sakeenah, not by the learner:
        the pre-test showed no point already known (nothing mastered) -> teach the whole topic from the basics. */
    needsFullPath(analysis){
      return !!analysis && analysis.intent !== 'out_of_scope' && (analysis.method === 'mcq' || analysis.intent === 'unknown') && analysis.mastered.length === 0;
    },
    /** every concept of the topic in teaching order (basics -> the four takbirs); existing KB items only */
    BASICS: ['takbir_count','posture_standing'],
    FULL_ORDER: ['takbir_count','posture_standing','first_takbir','second_takbir','third_takbir','fourth_takbir'],
    fullPath(){
      return SK.services.plan.FULL_ORDER.filter(id => D.conceptMap[id] && D.conceptMap[id].kb_id).map(id => {
        const m = D.conceptMap[id];
        return { concept_id:id, reason:'missing', kb_id:m.kb_id, question_ids:m.question_ids || [] };
      });
    },
    /** the question for a plan step; the n-th attempt uses the next variant of the SAME concept */
    question(step, n=0){
      const ids = step.question_ids || []; if (!ids.length) return null;
      const q = D.question(ids[n % ids.length]);
      return q && q.concept_id === step.concept_id ? q : null; // hard guard: never cross concepts
    },
    /** self-check used by the developer test mode */
    verify(analysis, plan){
      const problems = [];
      plan.forEach(s => {
        if (analysis.mastered.includes(s.concept_id)) problems.push(`plan tests a mastered concept: ${s.concept_id}`);
        const kb = D.kb.find(k=>k.id===s.kb_id); if (!kb || kb.concept_id!==s.concept_id) problems.push(`explanation mismatch: ${s.concept_id}`);
        const q = SK.services.plan.question(s); if (!q) problems.push(`no question for: ${s.concept_id}`);
      });
      return problems;
    }
  };
})(window.SK);
