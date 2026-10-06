/* ===================== Sakeenah AI Understanding Engine =====================
   analyzeUnderstanding(answer) -> Promise<Result>  (Structured JSON only)
   Result = {
     intent: 'answer' | 'unknown' | 'out_of_scope',
     mastered: [concept_id],
     missing: [concept_id],
     confused: [{ concept_id, user_claim, reason }],
     out_of_scope: [{ text, topic }],
     no_source: [{ topic_id, text }],          // in-scope topics with no approved source in the KB
     score: 0..100,
     priority_concepts: [concept_id],          // confused first, then missing
     evidence: [{ quote, concept_id, status }] // for "كيف فهمت سكينة إجابتي؟" (evidence mapping, no chain of thought)
   }
   Engines: 'demo' (local semantic parser, default) and 'llm' (adapter stub). Both must return the same shape;
   validate() guards anything coming from an LLM before the UI sees it. */
(function(SK){
  const D = SK.data;

  /* ---------- 1. Arabic normalization (with an index map back to the original text) ----------
     Handles: presentation forms (copied from PDF/Word), decomposed hamza, tashkeel, tatweel,
     invisible marks, alef/yeh/teh-marbuta/kaf variants, Persian letters, Arabic-Indic digits, ﷺ. */
  const STRIP = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/;
  const LETTER = { 'أ':'ا','إ':'ا','آ':'ا','ٱ':'ا','ٲ':'ا','ٳ':'ا','ى':'ي','ی':'ي','ې':'ي','ئ':'ي','ة':'ه','ۀ':'ه','ہ':'ه','ھ':'ه','ک':'ك','ڪ':'ك','ؤ':'و','گ':'ك' };
  const PUNCT = /[\u060C\u061B\u061F\u066B\u066C\u06D4.,;:!?؟،؛"'«»()\[\]{}\-–—…\/\\]/;
  function normalizeWithMap(raw){
    const src = String(raw||''); let out = ''; const map = [];
    for (let i = 0; i < src.length; i++){
      let piece = src[i];
      const code = src.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF && i+1 < src.length){ piece = src[i] + src[i+1]; }
      let t = piece === '\uFDFA' ? ' صلي الله عليه وسلم ' : piece.normalize('NFKD');
      let r = '';
      for (const ch of t){
        if (STRIP.test(ch) || /\p{M}/u.test(ch)) continue;
        let c = LETTER[ch] || ch;
        const d = c.charCodeAt(0);
        if (d >= 0x0660 && d <= 0x0669) c = String(d - 0x0660);
        else if (d >= 0x06F0 && d <= 0x06F9) c = String(d - 0x06F0);
        if (PUNCT.test(c)) c = '|';                 // clause boundary
        r += c.toLowerCase();
      }
      for (const ch of r){ out += ch; map.push(i); }
      if (piece.length === 2) i++;
    }
    // collapse whitespace while keeping the map aligned
    let n = '', m = [];
    for (let k = 0; k < out.length; k++){ const ch = /\s/.test(out[k]) ? ' ' : out[k]; if (ch === ' ' && (n.endsWith(' ') || n === '')) continue; n += ch; m.push(map[k]); }
    return { text:n, map:m, src };
  }
  const normalizeArabic = raw => normalizeWithMap(raw).text.replace(/\|/g,' ').replace(/\s+/g,' ').trim();

  // ---------- 2. lexicon (normalized forms) ----------
  const ACTIONS = {
    fatiha:   ['فاتحه','ام الكتاب','الحمد لله رب','fatiha','fatihah','opening'],
    salawat:  ['علي النبي','علي الرسول','ع النبي','ع الرسول','علي محمد','صلي علي','صلاه علي','الصلاه علي','صلي الله عليه','الابراهيميه','اللهم صل','الصلوات','blessings','salawat','durood','darood','prophet'],
    dua:      ['للميت','للمتوفي','للمتوفى','اغفر له','ارحمه','ادعو له','ادعي له','ادعيله','الدعاء له','ادعو للميت','ادعي للميت','دعاء للميت','الدعاء للميت','بالمغفره','deceased','for the dead','dua for','supplicat'],
    salam:    ['اسلم','نسلم','يسلم','سلم','التسليم','السلام','تسليمه','salam','salaam','taslim','tasleem'],
    tashahhud:['التشهد','التحيات','tashahhud'],
    istiftah: ['الاستفتاح','سبحانك اللهم','istiftah'],
    ruku:     ['اركع','نركع','الركوع','ركوع','ركعه','ruku','bow'],
    sujud:    ['اسجد','نسجد','السجود','سجود','سجده','sujud','prostrat']
  };
  const ACTION_LABEL = { fatiha:'قراءة الفاتحة', salawat:'الصلاة على النبي ﷺ', dua:'الدعاء للميت', salam:'السلام', tashahhud:'التشهد', istiftah:'دعاء الاستفتاح', ruku:'الركوع', sujud:'السجود' };
  // ordinals are matched as whole tokens, after removing a leading و / ف / ب / ل
  const ORD_TOKENS = { 1:['الاولي','اولي','الاول','اول','اولا','first'], 2:['الثانيه','ثانيه','الثاني','ثاني','ثانيا','second'], 3:['الثالثه','ثالثه','الثالث','ثالث','ثالثا','third'], 4:['الرابعه','رابعه','الرابع','رابع','رابعا','الاخيره','اخيره','الاخير','fourth','last'] };
  const COUNT_TOKENS = { 4:['اربع','اربعه','اربعة','4','four'], 3:['ثلاث','ثلاثه','3','three'], 5:['خمس','خمسه','5','five'], 6:['ست','سته','6','six'], 2:['اثنتين','اثنين','مرتين','2','two'] };
  const MARK_TOKENS = ['اكبر','نكبر','يكبر','كبر','تكبير','تكبيره','التكبيره','التكبير','takbir','takbeer','akbar'];
  const COUNT_CTX = ['تكبيرات','تكبيره','تكبير','مرات','مره','takbirs','takbeers','times','تكبيرات'];
  const UNKNOWN = ['لا اعرف','ما اعرف','مااعرف','مدري','ما ادري','لا ادري','مادري','ما اذكر','ما اتذكر','نسيت','لا اعلم','ما اعلم','i dont know',"i don't know",'no idea','dont know'];
  const IN_SCOPE = ['تكبير','كبر','فاتحه','جناز','ميت','سلم','النبي','دعاء','صلاه','takb','janaz','fatiha','salam','deceased','funeral'];
  const OFF_TOPICS = [['fasting',['صيام','صوم','رمضان','عرفه','fasting']],['zakat',['زكاه','zakat']],['hajj',['الحج','حج ','عمره','hajj','umrah']],['wudu',['وضوء','اتوضا','توضا','wudu','ablution']],['family',['طلاق','زواج','ميراث']]];
  const NO_SOURCE_TOPICS = [['absent_prayer',['الغائب','غائب']],['grave_prayer',['علي القبر','المقبره']],['child_janazah',['الطفل','السقط']]];
  // lexicon entries go through the SAME normalization as the learner's text
  const N = w => normalizeArabic(w) || w;
  Object.keys(ACTIONS).forEach(k => ACTIONS[k] = ACTIONS[k].map(N));
  [ORD_TOKENS, COUNT_TOKENS].forEach(T => Object.keys(T).forEach(k => T[k] = T[k].map(N)));
  MARK_TOKENS.splice(0, MARK_TOKENS.length, ...MARK_TOKENS.map(N)); COUNT_CTX.splice(0, COUNT_CTX.length, ...COUNT_CTX.map(N));
  UNKNOWN.splice(0, UNKNOWN.length, ...UNKNOWN.map(N)); IN_SCOPE.splice(0, IN_SCOPE.length, ...IN_SCOPE.map(N));
  OFF_TOPICS.forEach(t => t[1] = t[1].map(w => w.endsWith(' ') ? N(w)+' ' : N(w))); NO_SOURCE_TOPICS.forEach(t => t[1] = t[1].map(N));
  const has = (n, list) => list.some(w => n.includes(w));
  const stripPrefix = tok => tok.replace(/^(و|ف|ب|ل)(?=ال|ا|ث|ر|ت)/,'');
  const tokens = seg => seg.split(' ').filter(Boolean).map(t => [t, stripPrefix(t)]);
  const hasTok = (seg, list) => tokens(seg).some(([a,b]) => list.includes(a) || list.includes(b));
  const findOrd = seg => { for (const n of [1,2,3,4]) if (hasTok(seg, ORD_TOKENS[n])) return n; return null; };
  const findCount = seg => { for (const n of [4,3,5,6,2]) if (hasTok(seg, COUNT_TOKENS[n])) return n; return null; };

  /* ---------- 3. claims: split into clauses, keep original text for evidence ---------- */
  const SPLIT_BEFORE = /\s(?=(?:ثم|بعدين|وبعدين|بعدها|وبعدها|وبعد|بعد|then|after|and then)\s)|\s(?=و(?:ال)?(?:اول|ثاني|ثالث|رابع|اخير))|\s(?=و\s?(?:اقرا|اصلي|ادعو|ادعي|اسلم|نسلم|اكبر|كبر|اركع|اسجد|الدعاء|الصلاه|السلام|الفاتحه|الركوع|السجود))/g;
  function claims(raw){
    const { text, map, src } = normalizeWithMap(raw);
    const cuts = new Set([0, text.length]);
    for (let k = 0; k < text.length; k++) if (text[k] === '|') { cuts.add(k); cuts.add(k+1); }
    let m; SPLIT_BEFORE.lastIndex = 0; while ((m = SPLIT_BEFORE.exec(text))) cuts.add(m.index+1);
    const pts = [...cuts].sort((a,b)=>a-b); const out = [];
    for (let k = 0; k < pts.length-1; k++){
      const s0 = pts[k], e0 = pts[k+1];
      const seg = text.slice(s0, e0).replace(/\|/g,' ').trim(); if (!seg) continue;
      // original evidence slice, trimmed of separators and leading connectors
      let os = map[s0] ?? 0, oe = (map[e0-1] ?? (src.length-1)) + 1;
      let original = src.slice(os, oe).normalize('NFKC').replace(/\u0635\u0644\u0649 \u0627\u0644\u0644\u0647 \u0639\u0644\u064a\u0647 \u0648\u0633\u0644\u0645/g,'ﷺ').replace(/^[\s،,.؛;:]+|[\s،,.؛;:]+$/g,'').replace(/^(و\s?|ثم\s|بعدين\s)/,'').trim();
      out.push({ seg, original });
    }
    return out;
  }

  /* ---------- 4. scoring (separate and testable) ----------
     essential concepts: takbir_count + the four takbeers. mastered = full credit; confused = 0; missing = 0. */
  const ESSENTIAL = ['takbir_count','first_takbir','second_takbir','third_takbir','fourth_takbir'];
  function computeScore(result){
    const got = ESSENTIAL.filter(id => result.mastered.includes(id)).length;
    return Math.round(100 * got / ESSENTIAL.length);
  }

  function analyzeDemo(raw){
    const text = String(raw||'').trim(); const n = normalizeArabic(text);
    const res = { intent:'answer', mastered:[], missing:[], confused:[], out_of_scope:[], no_source:[], score:0, priority_concepts:[], evidence:[] };
    const all = D.concepts.map(c=>c.id);
    const ev = (concept_id, evidence, status) => res.evidence.push({ concept_id, evidence, quote:evidence, status });

    // out of scope
    const off = OFF_TOPICS.find(([,w]) => has(' '+n+' ', w));
    const looksQuestion = /[؟?]/.test(text) || /^(كيف|ما حكم|هل|متي|ليش|لماذا|what|how|is it|can i)\s/.test(n+' ');
    if (off || (looksQuestion && !has(n, IN_SCOPE))){ res.intent = 'out_of_scope'; res.out_of_scope.push({ text, topic: off ? off[0] : 'general' }); return finalize(res, all, true); }
    // "I don't know"
    if (has(n, UNKNOWN) || n.replace(/\s/g,'').length < 3){ res.intent = 'unknown'; res.missing = all.slice(); return finalize(res, all); }
    // in scope, but nothing approved in the KB
    NO_SOURCE_TOPICS.forEach(([id,w]) => { if (has(n,w)){ res.no_source.push({ topic_id:id, text }); SK.services.retrieval.logEvent('NO_SOURCE_FOUND', { topic_id:id }); } });

    // timeline: which action is placed after which takbeer
    const slots = {}; let pos = 0, markers = 0, countClaim = null, countEv = '', moves = null;
    claims(text).forEach(({ seg, original }) => {
      const cnt = findCount(seg), ctx = has(seg, COUNT_CTX);
      const isCount = !!cnt && (ctx || /^(هي|عددها|عدد)/.test(seg));
      if (isCount && countClaim == null){ countClaim = cnt; const m = original.match(/(?:[أاإ]رب[عٌ]|ثلاث|خمس|ست|[0-9٠-٩])[\s\S]*/); countEv = m ? m[0].trim() : original; }
      const ord = findOrd(seg);
      const isMarker = !isCount && hasTok(seg, MARK_TOKENS);
      const acts = Object.keys(ACTIONS).filter(k => has(' '+seg+' ', ACTIONS[k].map(w=>w)));
      if (acts.includes('ruku') || acts.includes('sujud')) moves = moves || original;
      const main = acts.filter(a => a!=='ruku' && a!=='sujud');
      if (ord) pos = ord;
      else if (isMarker){ pos = Math.min(pos+1, 6); markers++; }
      main.slice(0,1).forEach(a => {                       // one action per claim
        let p = pos;
        if (!ord && a==='salam') p = 4;                      // the salam closes the prayer
        else if (!ord && !isMarker && p===0) p = 1;          // first action with no takbeer word
        else if (!ord && !isMarker && slots[p]) p = Math.min(p+1, 6);
        if (!ord) pos = Math.max(pos, p);
        if (!slots[p]) slots[p] = { a, original };
      });
    });

    // takbir count
    if (countClaim === 4){ res.mastered.push('takbir_count'); ev('takbir_count', countEv, 'mastered'); }
    else if (countClaim){ res.confused.push({ concept_id:'takbir_count', user_claim:countEv, reason:'ذكرت عددًا مختلفًا من التكبيرات' }); ev('takbir_count', countEv, 'confused'); }
    else if (markers === 4){ res.mastered.push('takbir_count'); ev('takbir_count', 'وصفت أربع تكبيرات متتالية', 'mastered'); }
    else res.missing.push('takbir_count');

    // MASTERED (mentioned + matches) / CONFUSED (mentioned + wrong content) / MISSING (not mentioned)
    D.concepts.filter(c=>c.expects).forEach(c => {
      const got = slots[c.order];
      if (got && got.a === c.expects){ res.mastered.push(c.id); ev(c.id, got.original, 'mastered'); }
      else if (got){ res.confused.push({ concept_id:c.id, user_claim:got.original, reason:`ذكرت هنا ${ACTION_LABEL[got.a]}` }); ev(c.id, got.original, 'confused'); }
      else res.missing.push(c.id);
    });

    // posture (tracked, not part of the essential score)
    if (moves){ res.confused.push({ concept_id:'posture_standing', user_claim:moves, reason:'ذكرت ركوعًا أو سجودًا' }); ev('posture_standing', moves, 'confused'); }
    else if (Object.keys(slots).length >= 2) res.mastered.push('posture_standing');
    else res.missing.push('posture_standing');

    return finalize(res, all);
  }

  function finalize(res, all, skipScore){
    const order = id => (D.concept(id)||{order:99}).order;
    res.mastered = [...new Set(res.mastered)].sort((a,b)=>order(a)-order(b));
    res.missing = [...new Set(res.missing)].filter(id => !res.mastered.includes(id) && !res.confused.some(c=>c.concept_id===id)).sort((a,b)=>order(a)-order(b));
    res.score = skipScore ? 0 : computeScore(res);
    res.priority_concepts = res.intent==='out_of_scope' ? [] : [...res.confused.map(c=>c.concept_id), ...res.missing];
    return res;
  }

  /** guard for any engine output (especially an LLM): unknown concept IDs are dropped, shape is enforced */
  function validate(r){
    const ids = new Set(D.concepts.map(c=>c.id)); const arr = x => Array.isArray(x) ? x : [];
    const out = { intent: ['answer','unknown','out_of_scope'].includes(r && r.intent) ? r.intent : 'answer',
      mastered: arr(r.mastered).filter(id=>ids.has(id)), missing: arr(r.missing).filter(id=>ids.has(id)),
      confused: arr(r.confused).filter(c=>c && ids.has(c.concept_id)).map(c=>({ concept_id:c.concept_id, user_claim:String(c.user_claim||''), reason:String(c.reason||'') })),
      out_of_scope: arr(r.out_of_scope), no_source: arr(r.no_source), evidence: arr(r.evidence).filter(e=>e && ids.has(e.concept_id)),
      score: 0, priority_concepts: arr(r.priority_concepts).filter(id=>ids.has(id)) };
    if (!out.priority_concepts.length && out.intent!=='out_of_scope') out.priority_concepts = [...out.confused.map(c=>c.concept_id), ...out.missing];
    out.score = out.intent==='out_of_scope' ? 0 : computeScore(out);   // score is always recomputed, never trusted from an engine
    return out;
  }

  /** LLM adapter (not active in the MVP). Plug a provider here; it must return the Result shape as JSON. */
  const llm = {
    buildPrompt(answer){
      return `حلّل وصف المستخدم لصفة صلاة الجنازة. استخدم معرّفات المفاهيم التالية فقط: ${D.concepts.map(c=>`${c.id} (${c.title})`).join('، ')}.
لا تشرح ولا تفتِ. أعد JSON فقط بالشكل: {"intent":"answer|unknown|out_of_scope","mastered":[],"missing":[],"confused":[{"concept_id":"","user_claim":"","reason":""}],"out_of_scope":[],"score":0,"priority_concepts":[],"evidence":[{"quote":"","concept_id":"","status":"mastered|confused"}]}
إجابة المستخدم: """${answer}"""`;
    },
    async analyze(/* answer */){ throw new Error('LLM_NOT_CONFIGURED'); }
  };

  const ENGINE_VERSION = 'demo-2026.10.03-r3';
  let engine = 'demo';
  SK.services.understanding = {
    engines:{ demo:analyzeDemo, llm },
    setEngine(name){ engine = name; },
    getEngine(){ return engine; },
    validate,
    /** the single entry point used by the UI */
    async analyzeUnderstanding(answer){
      if (engine === 'llm'){ try{ const r = validate(await llm.analyze(answer)); r.engine_version = 'llm'; return r; }catch(e){ SK.services.retrieval.logEvent('LLM_FALLBACK_TO_DEMO', { error:String(e.message||e) }); } }
      const r = validate(analyzeDemo(answer)); r.engine_version = ENGINE_VERSION; return r;
    },
    ENGINE_VERSION,
    ACTION_LABEL, normalizeArabic, normalizeWithMap, claims, computeScore, ESSENTIAL
  };
  // backwards-compatible alias for older code
  SK.services.analyzer = { analyze: a => SK.services.understanding.analyzeUnderstanding(a) };
})(window.SK);
