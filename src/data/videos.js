/* ===================== Quick-learning explainer videos =====================
   One short video per fact, linked by topic + concept. Empty on purpose: no video is added until it exists
   and its content is reviewed. A database can later fill the same shape via SK.services.videos.register().

   Entry shape:
   {
     id: 'VID-JAN-001',
     topic: 'janaza',                 // worship id
     concept_id: 'takbir_count',      // the fact it explains (same IDs as the knowledge base)
     kb_id: 'KB-JAN-001',             // the reviewed knowledge item it is based on
     src: 'https://…/janazah-takbir-count.mp4',
     poster: 'https://…/poster.jpg',  // optional
     durationSec: 20,
     captions: { ar:'…/ar.vtt', en:'…/en.vtt', tr:'…/tr.vtt', ur:'…/ur.vtt' },   // WebVTT per interface language
     reviewStatus: 'approved'         // only 'approved' videos are shown
   } */
(function(SK){
  const list = [];   // the former slide video was retired; «شاهد الشرح» now opens the evidence-bound demonstrator (screens/demo.js)
  SK.services.videos = {
    register(entry){ list.push(entry); return entry; },
    all(){ return list.slice(); },
    /** the approved video for a fact, or null */
    get(topic, conceptId){ return list.find(v => v.topic === topic && v.concept_id === conceptId && ['approved','registry'].includes(v.reviewStatus) && (v.src || (v.sources && v.sources.length))) || null; },
    /** caption track for the interface language (falls back to Arabic) */
    captionsFor(video, lang){ const c = video.captions || {}; return c[lang] ? { lang, src:c[lang] } : (c.ar ? { lang:'ar', src:c.ar } : null); }
  };
})(window.SK);
