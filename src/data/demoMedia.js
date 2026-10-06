/* ===================== Demonstrator media manifest =====================
   Where real production media plugs in. Empty on purpose: nothing here is generated or simulated.
   When files exist, put them in assets/media/ and fill the paths — the player switches from the temporary
   figure to the real video automatically, with the same steps, evidence, subtitles and controls.

   Per topic:
   video:      { sources:[{src:'assets/media/janazah-demo.webm',type:'video/webm'},{src:'assets/media/janazah-demo.mp4',type:'video/mp4'}], poster }
   chapters:   [{ stepId:'A0-STAND', start:0.0, end:6.5 }, …]   — one chapter per ANIMATION step (TrustedSourcesRegistry)
   narration:  { ar:{ 'A0-STAND':'assets/media/narr-ar-A0.mp3', … }, en:{…}, tr:{…}, ur:{…} }   — explanation voice
   recitation: { 'A1-TAKBIR-1':'assets/media/rec-fatiha.mp3', … }                            — Arabic reciter, never TTS
   subtitles:  { ar:'assets/media/janazah-demo.ar.vtt', en:…, tr:…, ur:… }
   review:     'pending' | 'approved'   — only 'approved' media replaces the temporary figure (set by the sharia mentor) */
(function(SK){
  const MEDIA = { janaza: {
    /* AI-generated clip supplied by the team (Gemini, 10 s), edited here to match the registry steps:
       cut into one chapter per step, slowed ×1.6 for beginners, near-silent audio removed, and the salam segment
       mirrored so the first salam turns to the RIGHT (the source turned left). The original left turn is kept as
       the optional second salam. Not yet reviewed by the sharia mentor. */
    origin:'ai_generated', review:'pending', showWhilePending:true,
    video:{ sources:[ { src:'assets/media/janazah-demo.webm', type:'video/webm' }, { src:'assets/media/janazah-demo.mp4', type:'video/mp4' } ], poster:'assets/media/janazah-demo-poster.jpg' },
    chapters:[ { stepId:'A0-STAND', start:0, end:1.70 }, { stepId:'A1-TAKBIR-1', start:1.70, end:3.97 }, { stepId:'A2-TAKBIR-2', start:3.97, end:6.23 },
               { stepId:'A3-TAKBIR-3', start:6.23, end:8.50 }, { stepId:'A4-TAKBIR-4', start:8.50, end:11.10 }, { stepId:'A5-SALAM', start:11.10, end:15.23, endBoth:19.36 } ],
    narration:{}, recitation:{}, subtitles:{} } };
  SK.services.demoMedia = {
    get(topic){ return MEDIA[topic] || null; },
    hasVideo(topic){ const m = MEDIA[topic]; return !!(m && (m.review === 'approved' || m.showWhilePending) && m.video && m.video.sources && m.video.sources.length && m.chapters.length); },
    narration(topic, lang, stepId){ const m = MEDIA[topic]; return m && m.narration[lang] && m.narration[lang][stepId] || null; },
    recitation(topic, stepId){ const m = MEDIA[topic]; return m && m.recitation[stepId] || null; },
    register(topic, data){ MEDIA[topic] = { ...(MEDIA[topic]||{}), ...data }; }
  };
})(window.SK);
