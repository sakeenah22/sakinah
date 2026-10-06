/* ===================== Retrieval (MVP: local Knowledge Base) =====================
   detected concept -> knowledge item -> TrustedSourcesRegistry (text + verified evidence) -> explanation + source
   Later (real RAG): Query -> Retrieval (vector/keyword) -> relevant chunks -> LLM -> grounded answer -> citation.
   The UI only ever calls explain(conceptId) and search(query), so the backend can change freely. */
(function(SK){
  const D = SK.data; const log = [];
  const norm = s => (s||'').replace(/[\u064B-\u0652\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase();
  SK.services.retrieval = {
    log,
    logEvent(type, data){ const e = { type, ...data, at:new Date().toISOString() }; log.push(e); try{ console.info('[sakeenah]', type, data||''); }catch(_){} return e; },
    /** exact retrieval by concept */
    byConcept(conceptId, lang='ar'){
      const id = D.canon(conceptId);
      const item = D.kb.find(k => k.concept_id === id && k.language === lang);
      if (!item) this.logEvent('NO_SOURCE_FOUND', { concept_id:id });
      return item || null;
    },
    /** keyword retrieval over the KB (placeholder for vector search) */
    search(query, k=3){
      const words = norm(query).split(/\s+/).filter(w=>w.length>2);
      return D.kb.map(item => { const c = SK.sources.forConcept(item.concept_id, 'ar'); const t = norm(item.title+' '+(c.ok ? c.text : '')); return { item, score: words.filter(w=>t.includes(w)).length }; })
        .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,k).map(x=>x.item);
    },
    /** grounded explanation for a concept; never invents text */
    explain(conceptId){
      // one source of truth: the explanation and its evidence come from TrustedSourcesRegistry (verified evidence only)
      const c = SK.sources.forConcept(D.canon(conceptId));
      if (!c.ok){ this.logEvent('NO_SOURCE_FOUND', { concept_id:conceptId }); return { ok:false, message:SK.t('rt.noSource'), advice:SK.t('rt.noSourceAdvice') }; }
      return { ok:true, text:c.text, evidence:c.evidence, recitation:c.recitation, kind:c.kind, id:c.id };
    },
    get NO_SOURCE_TEXT(){ return SK.t('rt.noSource'); },
    get NO_SOURCE_ADVICE(){ return SK.t('rt.noSourceAdvice'); },
    get OUT_OF_SCOPE_TEXT(){ return SK.t('rt.oos'); },
    get OUT_OF_SCOPE_NOTE(){ return SK.t('rt.oosNote'); }
  };
})(window.SK);
