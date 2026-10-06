/* ===================== Storage Service =====================
   One place that reads/writes persistent data. Prototype adapter = localStorage (with in-memory fallback).
   Replace `LocalAdapter` with a database/API adapter (same get/set/keys) without touching the rest of the app.

   Records (both keyed by the permanent cardId = the 6-digit card code):
     sk:card:<cardId>      Card Identity   { cardId, token, displayName, createdAt }
     sk:progress:<cardId>  Learning Progress { cardId, journeys:{ funeral_prayer:{...} }, updatedAt }
     sk:token:<token>      QR token -> cardId (the QR holds only the token) */
(function(SK){
  const mem = {};
  const LocalAdapter = {
    get(k){ try{ const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); }catch(e){} return k in mem ? mem[k] : null; },
    set(k,v){ mem[k] = v; try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
    keys(prefix){ const out = new Set(Object.keys(mem).filter(k=>k.startsWith(prefix))); try{ for (let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if (k && k.startsWith(prefix)) out.add(k); } }catch(e){} return [...out]; }
  };
  let db = LocalAdapter;
  const K = { card:id=>'sk:card:'+id, progress:id=>'sk:progress:'+id, token:t=>'sk:token:'+t, last:'sk:lastToken' };
  const now = () => new Date().toISOString();

  /* ---- migration from the first card prototype (sk:p:<learnerId>, sk:t:<token>, sk:c:<code>) ---- */
  function migrate(cardId){
    const token = db.get('sk:c:'+cardId); if (!token) return null;
    const link = db.get('sk:t:'+token); if (!link) return null;
    const old = db.get('sk:p:'+link.learnerId); if (!old) return null;
    const js = old.journeyState || null;
    const card = { cardId, token, displayName: old.displayName || '', createdAt: old.createdAt || now(), migratedFrom:'v1' };
    db.set(K.card(cardId), card); db.set(K.token(token), cardId);
    const prog = { cardId, journeys:{}, updatedAt: now() };
    if (old.preAssessmentScore != null || js || (old.completedModules||[]).length){
      prog.journeys.funeral_prayer = {
        status: (old.completedModules||[]).includes('janazah') && !js ? 'completed' : 'in_progress',
        progressPercent: old.postAssessmentScore ?? old.preAssessmentScore ?? 0,
        preScore: old.preAssessmentScore ?? null, postScore: old.postAssessmentScore ?? null,
        masteredConcepts: (old.conceptsMastered||[]).map(SK.data.canon), correctedConcepts: js ? Object.keys(js.results||{}) : [],
        confusedConcepts: (old.misconceptions||[]).map(SK.data.canon), needingReview: (old.conceptsNeedingReview||[]).map(SK.data.canon),
        conceptStates: (() => { const st = {}; SK.data.concepts.forEach(c=>st[c.id]='missing'); (old.misconceptions||[]).map(SK.data.canon).forEach(id=>st[id]='confused');
          (old.conceptsMastered||[]).map(SK.data.canon).forEach(id=>st[id]='mastered'); Object.keys((js&&js.results)||{}).map(SK.data.canon).forEach(id=>{ if (st[id]!=='mastered') st[id]='corrected'; }); return st; })(),
        currentStep: ((old.conceptsNeedingReview||[]).map(SK.data.canon))[0] || null, lastCompletedStep: null, state: js, lastUpdatedAt: old.lastActivity || now() };
    }
    db.set(K.progress(cardId), prog);           // old keys are kept, nothing is deleted
    return { card, progress: prog };
  }

  SK.services.storage = {
    useAdapter(a){ db = a; },
    /* identity */
    createCard(card){ db.set(K.card(card.cardId), card); db.set(K.token(card.token), card.cardId); db.set(K.last, card.token); db.set(K.progress(card.cardId), { cardId:card.cardId, journeys:{}, updatedAt:now() }); return card; },
    cardExists(cardId){ return !!db.get(K.card(cardId)) || !!db.get('sk:c:'+cardId); },
    cardIdForToken(token){ return db.get(K.token(token)) || (db.get('sk:t:'+token) || {}).code || null; },
    lastDeviceToken(){ return db.get(K.last); },
    /** loadProfile(cardId) -> { card, journeys } — migrates a prototype-v1 card on first load */
    loadProfile(cardId){
      let card = db.get(K.card(cardId)), progress = db.get(K.progress(cardId));
      if (!card){ const m = migrate(cardId); if (!m) return null; card = m.card; progress = m.progress; }
      if (!progress){ progress = { cardId, journeys:{}, updatedAt:now() }; db.set(K.progress(cardId), progress); }
      return { card, journeys: progress.journeys || {} };
    },
    /** saveProgress(cardId, journeyId, progressData) — merges into the card's progress record */
    saveProgress(cardId, journeyId, data){
      const progress = db.get(K.progress(cardId)) || { cardId, journeys:{} };
      progress.journeys = progress.journeys || {};
      progress.journeys[journeyId] = { ...(progress.journeys[journeyId]||{}), ...data, lastUpdatedAt: now() };
      progress.updatedAt = now();
      const ok = db.set(K.progress(cardId), progress);
      return ok ? progress.journeys[journeyId] : (SK.services.retrieval && SK.services.retrieval.logEvent('STORAGE_FALLBACK_MEMORY',{cardId}), progress.journeys[journeyId]);
    },
    loadJourney(cardId, journeyId){ const p = this.loadProfile(cardId); return p ? (p.journeys[journeyId] || null) : null; }
  };
})(window.SK);
