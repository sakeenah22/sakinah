/* assistantService — the full pipeline for «اسأل سكينة».
   question -> normalizeArabic -> retrieveRelevantKnowledge -> checkEvidence -> generateGroundedAnswer -> sources
   generateGroundedAnswer is EXTRACTIVE: it only returns approved record text. No model writes religious content.
   Later an LLM may rephrase, but only from the retrieved passages, behind the same gate. */
(function(SK){
  const MSG = {
    get INSUFFICIENT(){ return [SK.t('as.refuse1'), SK.t('as.refuse2')]; },
    get CONFLICTING(){ return [SK.t('as.conflict1'), SK.t('as.conflict2')]; }
  };
  function generateGroundedAnswer(ev){
    if (ev.status !== 'SUPPORTED') return null;
    if (ev.items.length === 1 && !ev.gap) return { text: ev.items[0].content, short: ev.items[0].short || ev.items[0].content, citations: ev.items };
    return { intro:SK.t('as.intro'), short: ev.items.map(it => it.short || it.content).join(' '), points: ev.items.map(it => ({ text: it.content, short: it.short, citation: it })), citations: ev.items,
      gapNote: '' };
  }
  const log = [];
  SK.services.assistantService = {
    MSG, log,
    ask(question){
      const normalized = SK.services.understanding.normalizeArabic(question);
      const results = SK.services.retrievalService.retrieveRelevantKnowledge(question);
      const evidence = SK.services.evidenceService.checkEvidence(results);
      const answer = generateGroundedAnswer(evidence);
      const out = { question, normalized, evidenceStatus: evidence.status, reason: evidence.reason, retrieved: results.map(r => ({ id:r.item.id, score:r.score, status:r.item.reviewStatus })),
        answer, message: answer ? null : MSG[evidence.status], blocked: evidence.blocked ? evidence.blocked.id : null };
      if (!answer) SK.services.retrieval.logEvent(evidence.status === 'INSUFFICIENT' ? 'NO_SOURCE_FOUND' : 'CONFLICTING_SOURCES', { question, reason:evidence.reason, blocked:out.blocked });
      log.push({ at:new Date().toISOString(), question, status:out.evidenceStatus });
      return out;
    }
  };
})(window.SK);
