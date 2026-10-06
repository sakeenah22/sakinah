/* knowledgeService — read access to the assistant knowledge base (swap for a DB / vector store later). */
(function(SK){
  const extra = [];   // records added at runtime (tests)
  SK.services.knowledgeService = {
    all(){ return [...SK.data.assistantKB, ...extra]; },
    byId(id){ return this.all().find(r => r.id === id) || null; },
    /** answerable only when its evidence (TrustedSourcesRegistry) is verified with a checked link */
    isVerified(r){ const ev = r && r.evidenceRefs ? SK.sources.shownEvidence(r.evidenceRefs) : [];
      return !!r && r.reviewStatus === 'verified' && ev.length > 0 && ev.length === r.evidenceRefs.length; },
    /** the registry evidence behind one or more records (no duplicates) */
    evidenceOf(items){ const ids = [...new Set([].concat(...(items||[]).map(r => r.evidenceRefs || [])))]; return SK.sources.shownEvidence(ids); },
    addTestRecord(r){ extra.push(r); return r; },
    removeTestRecord(id){ const i = extra.findIndex(r => r.id === id); if (i >= 0) extra.splice(i,1); }
  };
})(window.SK);
