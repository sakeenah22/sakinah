/* retrievalService — retrieveRelevantKnowledge(question). Local lexical retrieval over questionVariants + content.
   Later: replace with embeddings / vector DB; keep the return shape [{ item, score, matchedVariant }]. */
(function(SK){
  const N = t => SK.services.understanding.normalizeArabic(t);
  const STOP = new Set(['ما','ماذا','كيف','هل','في','عن','من','الي','الى','علي','على','او','و','ان','هي','هو','كم','لماذا','متي','اين','يا','لو','اذا','بعد','قبل','ثم','لي','انا','ابي','ودي','ابغي','بماذا','how','many','the','in','is','are','what','do','does','a','an','of','after','i','there','to','kaç','ne','bir','ve','mi','mı','nasıl','için','sonra','کیا','میں','ہے','ہیں','کے','کی','کا','کتنی','کیسے','بعد'].map(N));
  const toks = t => N(t).split(' ').map(w => w.replace(/^(و|ف|ب)(?=ال)/,'')).filter(w => w.length > 1 && !STOP.has(w));
  // ordinal words decide WHICH takbeer a question is about; a mismatch must never retrieve another step
  const ORD = [['اولي','الاولي','الاول','first','birinci','birinci','پہلی'],['ثانيه','الثانيه','الثاني','second','ikinci','دوسری'],['ثالثه','الثالثه','الثالث','third','üçüncü','تیسری'],['رابعه','الرابعه','الرابع','fourth','dördüncü','چوتھی']].map(a=>a.map(N));
  const ordOf = ts => { for (let i=0;i<ORD.length;i++) if (ts.some(t => ORD[i].includes(t))) return i+1; return 0; };
  // topic anchors: a funeral-prayer record can only match a question that is about the funeral prayer
  const ANCHORS = { janazah:['funeral','janazah','janaza','takbir','takbirs','takbeer','cenaze','tekbir','tekbirden','جنازہ','جنازے','تکبیر','تکبیریں','میت','التكبيره','تكبيره','التكبيرات','تكبيرات','جنازه','الجنازه','جنايز','الجنايز','ميت','الميت','للميت','الاموات','المتوفي'].map(N) };
  const OTHER_PRAYERS = ['العيد','عيد','الاستسقاء','الكسوف','الخسوف','التراويح','الوتر','الفجر','الظهر','العصر','المغرب','العشاء','الجمعه','الضحي','الاستخاره'].map(N);
  const anchored = (qt, item) => { const a = ANCHORS[item.anchor || 'janazah'] || []; const qs = qt.join(' ');
    return a.some(w => qt.includes(w) || qs.includes(w)) && !qt.some(t => OTHER_PRAYERS.includes(t)); };
  function scoreVariant(qt, variant){
    const vt = toks(variant); if (!vt.length) return 0;
    const qset = new Set(qt);
    const hit = vt.filter(t => qset.has(t) || [...qset].some(q => q.length > 3 && (q.startsWith(t) || t.startsWith(q)))).length;
    const coverage = hit / vt.length, precision = hit / Math.max(1, qt.length);
    let s = 0.7*coverage + 0.3*precision;
    const qo = ordOf(qt), vo = ordOf(vt);
    if (qo && vo && qo !== vo) s = 0;        // "after the second" must not match "after the third"
    return s;
  }
  SK.services.retrievalService = {
    THRESHOLD: 0.6,
    tokens: toks,
    retrieveRelevantKnowledge(question, k=3){
      const qt = toks(question); if (!qt.length) return [];
      return SK.services.knowledgeService.all().map(item => {
        if (item.anchor !== 'none' && !anchored(qt, item)) return { item, score:0, matchedVariant:'' };
        let best = 0, mv = '';
        item.questionVariants.forEach(v => { const s = scoreVariant(qt, v); if (s > best){ best = s; mv = v; } });
        return { item, score: Math.round(best*100)/100, matchedVariant: mv };
      }).filter(r => r.score > 0).sort((a,b) => b.score - a.score).slice(0, k);
    }
  };
})(window.SK);
