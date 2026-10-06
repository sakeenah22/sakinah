/* evidenceService — the Evidence Gate. Decides BEFORE any answer is produced.
   SUPPORTED    : the best match is a verified record above threshold  -> answer + source
   INSUFFICIENT : no match, or the best match is not verified          -> refuse, no religious text generated
   CONFLICTING  : verified records for the same topic disagree, or a record is flagged for scholarly review -> no answer */
(function(SK){
  const K = () => SK.services.knowledgeService, R = () => SK.services.retrievalService;
  SK.services.evidenceService = {
    checkEvidence(results){
      const top = results[0];
      if (!top || top.score < R().THRESHOLD) return { status:'INSUFFICIENT', reason:'NO_MATCH', top:top||null };
      const close = results.filter(r => r.score >= R().THRESHOLD && top.score - r.score <= 0.1);
      const verifiedClose = close.filter(r => K().isVerified(r.item));
      const sameTopic = verifiedClose.filter(r => r.item.topic === top.item.topic);
      const positions = new Set(sameTopic.map(r => r.item.position).filter(Boolean));
      if (positions.size > 1 || (K().isVerified(top.item) && top.item.needsScholarlyReview)) return { status:'CONFLICTING', reason:'DISAGREEING_SOURCES', top, items:sameTopic.map(r=>r.item) };
      if (!K().isVerified(top.item)){
        // a composite record may be answered ONLY from its verified parts, never from its own unverified text
        if (top.item.composeFrom){ const parts = top.item.composeFrom.map(id => K().byId(id)).filter(p => K().isVerified(p));
          if (parts.length) return { status:'SUPPORTED', reason:'VERIFIED_PARTS_ONLY', top, items:parts, gap:top.item }; }
        return { status:'INSUFFICIENT', reason:'SOURCE_NOT_VERIFIED', top, blocked:top.item };
      }
      return { status:'SUPPORTED', reason:'VERIFIED_SOURCE', top, items:[top.item] };
    }
  };
})(window.SK);
