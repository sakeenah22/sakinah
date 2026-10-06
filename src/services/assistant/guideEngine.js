/* ===================== Guide engine: "LLM understands — trusted sources answer" =====================
   question (any language, text or voice) → normalize → intent + topic (+ journey/conversation context)
   → query expansion → semantic retrieval over the indexed claims → Evidence Guard (verified evidence must support
   the claim) → fallback chain → short answer in the user's language + the real source.
   Nothing here answers from model memory. If no stage finds supported evidence, it refuses safely.

   Why the old retrieval failed: it matched literal question variants, needed a topic word in the question,
   took only the top-1 record (so «اشرح صلاة الجنازة» returned the takbir count), and the posture record had
   no verified evidence — so «هل يوجد ركوع…» was refused even though approved sources describe it. */
(function(SK){
  const N = t => SK.services.understanding.normalizeArabic(t);
  const R = () => SK.sources;
  const W = a => a.map(N);
  // ---- multilingual feature lexicon (understanding, not answers) ----
  const FEAT = {
    ruku:   W(['ركوع','ركع','اركع','نركع','الركوع','bow','bowing','ruku','rukû','rükû','rüku','رکوع']),
    sujud:  W(['سجود','سجد','اسجد','السجود','سجده','prostrat','sujud','sajda','secde','سجدہ']),
    compare:W(['مثل','عاديه','العاديه','المعتاده','الفريضه','فرق','يختلف','تختلف','like','normal','regular','same','different','gibi','normal namaz','fark','طرح','عام نماز','فرق']),
    count:  W(['كم','عدد','how many','number','kaç','kac','sayı','کتنی','کتنے','تعداد']),
    takbir: W(['تكبير','تكبيره','تكبيرات','كبر','اكبر','takbir','takbirs','takbeer','tekbir','تکبیر','تکبیریں']),
    say:    W(['اقول','نقول','اقرا','اقرأ','نقرا','اسوي','افعل','نسوي','يقال','وش','ماذا','say','recite','read','do','söyle','oku','yap','ne','کیا','پڑھ','کہ']),
    dua:    W(['دعاء','الدعاء','ادعو','ادعي','للميت','الميت','dua','supplicat','deceased','dead','ölü','ölüye','دعا','میت']),
    salam:  W(['سلام','السلام','التسليم','اسلم','تسليمه','salam','salaam','taslim','selam','سلام']),
    salams: W(['تسليمتين','تسليمه واحده','مره','مرتين','يمين','يسار','شمال','once','twice','right','left','kaç selam','sağ','sol','دائیں','بائیں','ایک','دو']),
    overview:W(['اشرح','اشرحها','كيف اصلي','كيفيه','صفه','طريقه','خطوات','باختصار','explain','how do i pray','how to pray','steps','nasıl kılınır','nasıl','anlat','adımlar','کیسے','طریقہ','بتائیں','مختصر']),
    fatiha: W(['فاتحه','الفاتحه','ام الكتاب','fatiha','fâtiha','فاتحہ']),
    salawat:W(['صلاه علي النبي','الصلاه علي','الابراهيميه','صلوات','salawat','blessings','salavat','درود'])
  };
  const ORD = [W(['اولي','الاولي','الاول','اول','اولا','first','1st','birinci','ilk','پہلی','پہلے']), W(['ثانيه','الثانيه','الثاني','ثاني','second','2nd','ikinci','دوسری']),
               W(['ثالثه','الثالثه','الثالث','ثالث','third','3rd','üçüncü','تیسری']), W(['رابعه','الرابعه','الرابع','رابع','اخيره','الاخيره','fourth','4th','last','dördüncü','son','چوتھی','آخری'])];
  const TOPIC = { funeral_prayer: W(['مات','توفي','وفاه','died','passed away','öldü','vefat','فوت','جنازه','الجنازه','جنائز','ميت','الميت','funeral','janazah','janaza','cenaze','جنازہ','جنازے','میت']) };
  const OTHER = W(['زكاه','صيام','صوم','رمضان','حج','عمره','وضوء','طلاق','ميراث','العيد','الاستسقاء','الكسوف','zakat','fasting','hajj','umrah','wudu','eid','oruç','zekat','روزہ','زکوٰۃ','حج']);
  const PERSONAL = W(['يجوز لي','هل علي','هل يلزمني','فاتتني','فاتني','ابوي','امي','ابي','زوجي','زوجتي','حالتي','وضعي','اقدر اصلي','لا استطيع','عندي','can i','am i allowed','my father','my mother','my case','i missed','benim','yapabilir miyim','annem','babam','کیا میں','میرے','میری']);
  const RULING = W(['يجوز','حكم','حرام','حلال','واجب','فتوي','يصح','تصح','باطل','allowed','permissible','ruling','haram','valid','fatwa','caiz','hüküm','جائز','حکم','فتویٰ']);
  const toks = t => N(t).split(' ').filter(Boolean).map(w => w.replace(/^(و|ف|ب|ال)(?=..)/,''));
  const has = (n, list) => list.some(w => (' '+n+' ').includes(' '+w+' ') || (w.length > 3 && n.includes(w)));
  const ordOf = n => { for (let i=0;i<4;i++) if (has(n, ORD[i])) return i+1; return 0; };

  /** 1) understand: features, ordinal, topic (text → journey context → conversation) */
  function understand(text, ctx = {}, memory = {}){
    const n = N(text);
    const f = {}; Object.keys(FEAT).forEach(k => { if (has(n, FEAT[k])) f[k] = 1; });
    const ord = ordOf(n);
    let topic = null, topicFrom = null;
    if (has(n, TOPIC.funeral_prayer)){ topic = 'funeral_prayer'; topicFrom = 'question'; }
    else if (has(n, OTHER)){ topic = 'other'; topicFrom = 'question'; }
    else if (ctx.journeyId === 'funeral_prayer' || ctx.currentTopic === 'funeral_prayer'){ topic = 'funeral_prayer'; topicFrom = 'journey'; }
    else if (memory.topicId === 'funeral_prayer'){ topic = 'funeral_prayer'; topicFrom = 'conversation'; }
    else if (f.takbir || f.ruku || f.sujud || f.salawat || f.fatiha || ord){ topic = 'funeral_prayer'; topicFrom = 'vocabulary'; }   // the only prayer Sakeenah covers today
    const personal = has(n, PERSONAL) && (has(n, RULING) || /^(هل|can|may|is it)/.test(n));
    let intent = 'ask_info';
    if (f.ruku || f.sujud || f.compare) intent = 'ask_structure';
    else if (f.salams || (f.salam && f.count)) intent = 'ask_taslim_count';
    else if (f.count && f.takbir) intent = 'ask_count';
    else if (ord) intent = 'ask_step';
    else if (f.dua) intent = 'ask_dua';
    else if (f.overview) intent = 'ask_how_prayer_is_performed';
    else if (f.salawat || f.fatiha || f.salam) intent = 'ask_step';
    return { n, features:f, ord, topic, topicFrom, intent, personal };
  }
  /** 2) query expansion — internal search queries (never shown to the user) */
  function expand(u){
    const q = ['صفة صلاة الجنازة'];
    if (u.intent === 'ask_structure') q.push('الركوع في صلاة الجنازة','السجود في صلاة الجنازة','هيئة صلاة الجنازة');
    if (u.intent === 'ask_count' || u.intent === 'ask_how_prayer_is_performed') q.push('التكبيرات في صلاة الجنازة','عدد التكبيرات');
    if (u.intent === 'ask_step') q.push(`ما يقال بعد التكبيرة ${['','الأولى','الثانية','الثالثة','الرابعة'][u.ord] || ''}`.trim());
    if (u.intent === 'ask_dua' || u.ord === 3) q.push('الدعاء للميت في صلاة الجنازة','دعاء الميت المأثور');
    if (u.features.salam || u.ord === 4) q.push('التسليم في صلاة الجنازة');
    if (u.intent === 'ask_taslim_count') q.push('عدد التسليم في صلاة الجنازة');
    if (u.intent === 'ask_how_prayer_is_performed') q.push('خطوات صلاة الجنازة','كيفية صلاة الجنازة');
    return q;
  }
  /** 3) semantic retrieval: rank claims by meaning (facets, ordinal, concept vocabulary, query overlap) */
  function retrieve(u, queries){
    const qt = new Set([...toks(u.n), ...queries.flatMap(toks)]);
    return Object.entries(R().CLAIMS).filter(([,c]) => c.topic === u.topic).map(([id, c]) => {
      let s = 0;
      const want = { ask_structure:['ruku','sujud','structure','compare'], ask_count:['count'], ask_step:['step','say'], ask_dua:['dua'], ask_taslim_count:['disputed'], ask_how_prayer_is_performed:['overview'], ask_info:[] }[u.intent] || [];
      s += want.filter(x => c.facets.includes(x)).length * 3;
      if (u.ord){ s += c.ord === u.ord ? 6 : (c.ord ? -4 : 0); }
      const terms = toks(c.terms);
      s += terms.filter(t => qt.has(t)).length * 0.6;
      return { id, claim:c, score:Math.round(s*10)/10 };
    }).filter(r => r.score > 0).sort((a,b) => b.score - a.score);
  }
  /** Evidence Guard: a claim is shown only if every evidence item it cites exists and is verified */
  function guard(c){
    if (c.fact){ const g = R().guard(c.fact); return g.ok ? { ok:true, evidence:g.evidence, fact:g.fact, translation:g.translation } : { ok:false, reason:g.reason }; }
    const ev = (c.evidence || []).map(R().evidence);
    if (!ev.length || ev.some(e => !e || e.verificationStatus !== 'verified')) return { ok:false, reason:'NO_VERIFIED_EVIDENCE' };
    return { ok:true, evidence:ev };
  }
  /** fallback stage 2: indexed evidence passages (search the evidence itself, not curated claims) */
  function searchEvidence(u, queries){
    const GENERIC = new Set(toks('صلاه الجنازه جنازه صفه حكم في من علي ما هل عن مع'));
    const qt = new Set([...toks(u.n), ...queries.flatMap(toks)].filter(t => !GENERIC.has(t)));
    return Object.entries(R().EVIDENCE).map(([id, e]) => ({ id, e, score: toks((e.supports||'') + ' ' + e.evidenceText).filter(t => qt.has(t) && t.length > 2).length }))
      .filter(r => r.score >= 3).sort((a,b) => b.score - a.score);
  }
  /** fallback stage 3: approved remote sources (needs a backend/API — not available in this offline prototype) */
  const remote = { available:false, search(){ return []; } };

  function compose(c, g, lang){
    const L = lang;
    if (c.fact){ const f = g.fact;
      return { answer: R().text(f, 'directive', L), simple: R().text(f, 'detail', L), recitation: f.recitationText || null, translation: g.translation || null, note: f.note ? R().text(f, 'note', L) : null }; }
    return { answer: c.answer[L] || c.answer.ar, simple: c.simple ? (c.simple[L] || c.simple.ar) : null, recitation:null, translation:null, note:null };
  }

  /** the whole pipeline */
  function answer(text, { ctx = {}, memory = {}, lang = SK.i18n.lang(), force } = {}){
    const diag = { question:text, lang, detectedIntent:null, detectedTopic:null, retrievalQueries:[], sourcesSearched:[], evidenceFound:[], evidenceAccepted:null, rejectionReason:null };
    let u = understand(text, ctx, memory);
    if (force && force.claimId){ u = { ...u, topic:'funeral_prayer', intent:'forced' }; }
    diag.detectedIntent = u.intent + (u.personal ? '+personal' : ''); diag.detectedTopic = `${u.topic || '—'} (${u.topicFrom || '—'})`;
    const done = res => { diag.result = res.status; SK.services.retrieval.logEvent('GUIDE_DIAGNOSTICS', diag); return { ...res, diag }; };
    if (u.personal && u.intent === 'ask_info'){ diag.rejectionReason = 'PERSONAL_CASE'; return done({ status:'INSUFFICIENT', personal:true }); }
    if (!u.topic || u.topic === 'other'){ diag.rejectionReason = u.topic === 'other' ? 'TOPIC_NOT_COVERED' : 'NO_TOPIC'; return done({ status:'INSUFFICIENT', personal:u.personal }); }
    const queries = expand(u); diag.retrievalQueries = queries;
    // «how is it performed / explain briefly»: every step that passes the guard, in order
    if (u.intent === 'ask_how_prayer_is_performed' && !(force && force.claimId)){
      const parts = ['CL-COUNT','CL-STEP-1','CL-STEP-2','CL-STEP-3','CL-STEP-4'].map(id => ({ id, c:R().CLAIMS[id] })).map(x => ({ ...x, g:guard(x.c) })).filter(x => x.g.ok);
      if (parts.length){ diag.sourcesSearched.push('local_claims'); diag.evidenceAccepted = parts.map(x => x.id).join(' + ');
        const ev = []; parts.forEach(x => x.g.evidence.forEach(e => { if (!ev.some(y => y.id === e.id)) ev.push(e); }));
        return done({ status:'SUPPORTED', claimId:'OVERVIEW', concept:null, overview: parts.map(x => compose(x.c, x.g, lang).answer), answer:null, evidence:ev, personal:u.personal }); }
    }
    // stage 1 — curated claims (local indexed evidence), with fallback to the next candidate
    diag.sourcesSearched.push('local_claims');
    const ranked = force && force.claimId ? [{ id:force.claimId, claim:R().CLAIMS[force.claimId], score:99 }] : retrieve(u, queries);
    diag.evidenceFound = ranked.slice(0,4).map(r => `${r.id}:${r.score}`);
    for (const r of ranked){
      if (r.score < 2.5) break;
      const g = guard(r.claim);
      if (!g.ok){ diag.rejectionReason = `${r.id}:${g.reason}`; continue; }               // try the next supported candidate
      diag.evidenceAccepted = `${r.id} ← ${g.evidence.map(e => e.id).join(', ')}`;
      return done({ status:'SUPPORTED', claimId:r.id, concept:r.claim.concept, ...compose(r.claim, g, lang), evidence:g.evidence, personal:u.personal, disputed:r.claim.facets.includes('disputed') });
    }
    // stage 2 — indexed evidence passages (only for an understood question, never for a personal case)
    diag.sourcesSearched.push('indexed_evidence');
    const hits = (u.intent !== 'ask_info' && !u.personal) ? searchEvidence(u, queries) : [];
    if (hits.length){ const e = R().evidence(hits[0].id);
      if (e && e.verificationStatus === 'verified'){ diag.evidenceAccepted = `evidence ${hits[0].id}`;
        return done({ status:'SUPPORTED', claimId:null, concept:null, answer: R().supports(e, lang), simple:null, recitation: e.language === 'ar' ? e.evidenceText : null, translation: R().translation(hits[0].id, lang), evidence:[e], personal:u.personal }); } }
    // stage 3 — approved remote sources
    diag.sourcesSearched.push(remote.available ? 'approved_remote' : 'approved_remote (not configured offline)');
    diag.rejectionReason = diag.rejectionReason || 'NO_SUPPORTED_EVIDENCE';
    return done({ status:'INSUFFICIENT', personal:u.personal });
  }
  /** the step that follows a concept («وبعدها؟») */
  const ORDER = ['takbir_count','first_takbir','second_takbir','third_takbir','fourth_takbir'];
  const claimOfConcept = c => Object.keys(R().CLAIMS).find(id => R().CLAIMS[id].concept === c) || null;
  function nextClaim(concept){ const k = ORDER.indexOf(concept); return k >= 0 && k < ORDER.length-1 ? claimOfConcept(ORDER[k+1]) : (concept ? null : claimOfConcept('first_takbir')); }
  /** suggestions only for claims that pass the guard */
  function suggest(lastConcept, lang = SK.i18n.lang()){
    const S = [];
    const nxt = nextClaim(lastConcept); if (nxt && guard(R().CLAIMS[nxt]).ok) S.push({ label:SK.t('sg.whatAfter'), kind:'claim', claimId:nxt, concept:R().CLAIMS[nxt].concept });
    if (lastConcept !== 'third_takbir' && guard(R().CLAIMS['CL-STEP-3']).ok) S.push({ label:SK.t('sg.duaQ'), kind:'claim', claimId:'CL-STEP-3', concept:'third_takbir' });
    S.push({ label:SK.t('sg.stepByStep'), kind:'overview' });
    if (lastConcept) S.push({ label:SK.t('sg.showSource'), kind:'source', concept:lastConcept });
    return S.slice(0,3);
  }
  SK.services.guideEngine = { understand, expand, retrieve, answer, nextClaim, claimOfConcept, suggest, guard };
})(window.SK);
