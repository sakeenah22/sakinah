/* Recorded narration (explanations only — never religious text). Keyed by registry fact id + language.
   When a file exists it replaces the device voice for that explanation, everywhere in Sakeenah. */
(function(SK){
  const MAP = {
    // Bassel recording: «قف مستقبلًا القبلة. صلاة الجنازة كلها قيام، ليس فيها ركوع ولا سجود.»
    'A0-STAND': { ar:'assets/media/narr-ar-A0-STAND.mp3' },
    // Bassel recording: «كبّر التكبيرة الأولى، ثم اقرأ سورة الفاتحة سرًّا:» (al-Fatiha itself has no recording yet)
    'JAN-STEP-1': { ar:'assets/media/narr-ar-JAN-STEP-1.mp3' },
    // Bassel (ar-IQ) recording from the team: «كبّر الثانية، ثم صلِّ على النبي ﷺ بالصلاة الإبراهيمية — كما تصلّي عليه في التشهد، دون التحيات:»
    // (the salawat that followed in the same file is NOT used: religious text needs an approved human recording)
    'JAN-STEP-2': { ar:'assets/media/narr-ar-JAN-STEP-2.mp3' },
    // Bassel recording: «كبّر الثالثة، ثم ادعُ للميت، ومن الدعاء المأثور:» (identified from its pauses; the du'a follows separately)
    'JAN-STEP-3': { ar:'assets/media/narr-ar-JAN-STEP-3.mp3' },
    // generated with Supertonic by the team: «كبّر الرابعة، ثم قف قليلًا، ثم سلّم عن يمينك قائلًا:»
    // (the salam phrase recorded in the same take is NOT used: religious wording needs an approved human recording)
    // Bassel recording: «كبّر الرابعة، ثم قف قليلًا، ثم سلّم عن يمينك قائلًا:» (replaces the earlier Supertonic take)
    'JAN-STEP-4': { ar:'assets/media/narr-ar-JAN-STEP-4.mp3' }
  };
  /* Religious audio chosen by the team. The Ibrahimi salawat below is a SYNTHETIC voice (Bassel TTS), used at the
     team's request until an approved human recording exists. It is labelled as such wherever it plays. */
  const RELIGIOUS = { 'BUKHARI-3370':{ src:'assets/media/rec-tts-salawat-JAN-STEP-2.mp3', synthetic:true }, 'KB:KB-JAN-004':{ src:'assets/media/rec-tts-salawat-JAN-STEP-2.mp3', synthetic:true },
    'NASAI-1983':{ src:'assets/media/rec-tts-dua-JAN-STEP-3.mp3', synthetic:true }, 'KB:KB-JAN-003':{ src:'assets/media/rec-tts-dua-JAN-STEP-3.mp3', synthetic:true },
    'ABUDAWUD-996-SALAM':{ src:'assets/media/rec-tts-salam-JAN-STEP-4.mp3', synthetic:true }, 'KB:KB-JAN-005':{ src:'assets/media/rec-tts-salam-JAN-STEP-4.mp3', synthetic:true } };
  SK.services.religiousAudio = { _map:RELIGIOUS, get(id){ return (RELIGIOUS[id] && RELIGIOUS[id].src) || null; }, meta(id){ return RELIGIOUS[id] || null; }, register(id, src, meta={}){ RELIGIOUS[id] = { src, ...meta }; } };
  SK.services.narrationAudio = { get(key, lang){ return (MAP[key] && MAP[key][lang]) || null; }, register(key, lang, src){ (MAP[key] = MAP[key] || {})[lang] = src; } };
})(window.SK);
