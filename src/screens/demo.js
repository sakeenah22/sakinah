/* «شاهد الشرح» — evidence-bound demonstrator of the funeral prayer.
   One animation for every language; only the explanation, subtitles and helper text change. No autoplay. */
(function(SK){
  const t = (k,v) => SK.t(k,v);
  const h = SK.h, ui = SK.ui, I = SK.ui.icons, S = SK.screens;
  const st = () => (SK.store.get().demo = SK.store.get().demo || { i:0, mode:'full', sound:true, cc:true, raiseAll:true, salamBoth:false });
  let fig = null, cancel = null, playing = false, holdTimer = 0;

  S.demo = () => {
    const topic = (SK.haram && SK.haram.state().topic) || 'janaza';
    const steps = SK.sources.animation(topic).filter(a => a.ok);
    const lang = SK.i18n.lang(), dir = SK.i18n.dir(), L = SK.i18n.LANGS[lang];
    const s = st(); s.i = Math.min(s.i, steps.length-1);
    const M = SK.services.demoMedia, media = M.get(topic), useVideo = M.hasVideo(topic);
    const canvas = h('canvas',{class:'demo-canvas', 'aria-label':t('demo.canvasLabel'), hidden:useVideo});
    const video = useVideo ? h('video',{class:'demo-video', playsinline:true, preload:'metadata', poster:media.video.poster || null},
      ...media.video.sources.map(x => h('source',{ src:x.src, type:x.type })), ...Object.entries(media.subtitles||{}).map(([l,src]) => h('track',{kind:'subtitles', src, srclang:l, default: l===lang}))) : null;
    const tempTag = h('span',{class:'demo-temp'}, useVideo ? '' : t('demo.tempFigure'));
    if (!tempTag.textContent) tempTag.hidden = true;
    const cc = SK.ui.subtitleBox(); cc.classList.add('demo-subs'); if (!s.cc) cc.style.display = 'none';
    const bubble = h('span',{class:'demo-bubble', 'aria-hidden':'true', lang:'ar', dir:'rtl'}, 'اللهُ أكبر');
    const badge = h('span',{class:'demo-badge', hidden:true}, t('demo.disputed'));
    const qibla = h('span',{class:'demo-qibla'}, '↓ ', t('demo.qibla'));
    const stage = h('div',{class:'demo-stage'+(useVideo?' has-video':'')}, video, canvas, bubble, qibla, cc, tempTag);
    const info = h('div',{class:'demo-info'});
    const dots = h('div',{class:'demo-dots', 'aria-hidden':'true'});
    const playBtn = h('button',{class:'demo-play', 'aria-label':t('ql.play')}); ui.setPlayIcon(playBtn, false);
    if (s.rate == null) s.rate = 1;
    const audio = new Audio(); let lastAudio = null;
    const playFile = (src) => { audio.src = src; audio.playbackRate = s.rate; audio.play().catch(()=>{}); lastAudio = { kind:'file', src }; };
    const say = (text, lng) => { if (!text) return; SK.services.speech.setMuted(!s.sound);
      const a = steps[s.i], file = M.narration(topic, lang, a.stepId);
      if (file) return playFile(file);                                     // recorded natural narration when available
      SK.services.speech.speakParts(text === textFor(a) ? partsFor(a) : [{ text, lang }]);
      lastAudio = { kind:'tts', text, lng }; };
    const recite = () => { const a = steps[s.i], file = M.recitation(topic, a.stepId);
      if (file) return playFile(file);                                     // Arabic reciter recording — never synthesized
      SK.toast(t('demo.noRecitation')); };

    const NA = SK.services.narrationAudio, RA = SK.services.religiousAudio;
    const narrKey = a => a.fact ? a.fact.id : a.stepId;
    const hasNarr = a => !!(NA && NA.get(narrKey(a), lang));
    const relId = a => a.fact ? a.fact.recitation : a.recitation;
    const hasRel = a => !!(relId(a) && RA && RA.get(relId(a)));
    /** on-screen text = exactly what the voice says */
    function textFor(a){
      if (hasNarr(a)) return a.fact ? SK.sources.text(a.fact, 'detail') : (a.say[lang] || a.say.ar);   // the recorded sentence
      if (a.stepId === 'A5-SALAM' && lang === 'ar' && hasRel(a)) return a.recitationText;  // «السلام عليكم ورحمة الله» from the recording
      return a.fact ? SK.sources.text(a.fact,'directive') : (a.say[lang] || a.say.ar);
    }
    /** what plays for a step: recorded narration (or TTS) then the religious recording when one exists */
    function partsFor(a){
      const parts = [];
      if (!(a.stepId === 'A5-SALAM' && lang === 'ar' && hasRel(a))) parts.push({ text:textFor(a), lang, audioKey: narrKey(a) });
      if (hasRel(a) && a.stepId !== 'A4-TAKBIR-4') parts.push({ kind:'religious', evidenceId:relId(a), text:a.recitationText });   // the salam is heard in the salam step
      return parts;
    }
    function render(){
      const a = steps[s.i];
      dots.replaceChildren(...steps.map((_,k) => h('i',{class: k < s.i ? 'done' : k === s.i ? 'now' : ''})));
      const notes = [];
      if (a.disputed && a.disputed.raise) notes.push(t('demo.noteRaise'));
      if (a.disputed && a.disputed.hands && s.i === 1) notes.push(t('demo.noteHands'));
      if (a.disputed && a.disputed.salam) notes.push(t('demo.noteSalam'));
      badge.hidden = !notes.length;
      const rec = a.recitationText;
      info.replaceChildren(...[
        h('p',{class:'demo-step'}, t('ql.nOf',{n:s.i+1,total:steps.length})),
        h('h1',{class:'demo-title', id:'screen-title', tabindex:'-1'}, t(a.titleKey)),
        h('p',{class:'demo-instr', lang, dir}, textFor(a)),
        rec ? ui.arabic(rec, 'demo-rec') : null,
        rec && SK.ui.RepeatAfterMe ? SK.ui.RepeatAfterMe({ expectedText:rec, audio:relId(a), language:'ar', compact:true, context:'full-prayer-demo' }) : null,
        rec && lang !== 'ar' ? (a.translation ? h('div',{class:'qc-meaning'}, h('span',{class:'qc-meaning-label'}, t('src.approvedMeaning')), h('p',{class:'qc-meaning-text', lang, dir}, a.translation.text), h('span',{class:'qc-meaning-src'}, a.translation.translator))
                                              : h('p',{class:'qc-no-tr'}, t('src.noApprovedTranslation'))) : null,
        a.raiseDisputed ? h('label',{class:'demo-opt'}, (() => { const cb = h('input',{type:'checkbox'}); cb.checked = s.raiseAll; cb.onchange = () => { s.raiseAll = cb.checked; replay(); }; return cb; })(), h('span',{}, t('demo.optRaise'))) : null,
        a.stepId === 'A5-SALAM' ? h('label',{class:'demo-opt'}, (() => { const cb = h('input',{type:'checkbox'}); cb.checked = s.salamBoth; cb.onchange = () => { s.salamBoth = cb.checked; replay(); }; return cb; })(), h('span',{}, t('demo.optSalamBoth'))) : null,
        notes.length ? h('ul',{class:'demo-notes', lang, dir}, notes.map(n => h('li',{}, n))) : null].filter(Boolean));
    }
    function seqFor(a){ if (a.stepId === 'A5-SALAM' && s.salamBoth) return a.seqBoth; if (a.raiseDisputed && !s.raiseAll) return a.seqNoRaise; return a.seq; }
    function startPose(k){ const a = steps[k]; return k === 0 ? 'rest' : (a.stepId === 'A1-TAKBIR-1' ? 'rest' : 'fold'); }
    let runId = 0;
    function stop(){ paused = false; runId++; try{ audio.pause(); }catch(e){} if (video) try{ video.pause(); }catch(e){} playing = false; if (cancel){ cancel(); cancel = null; } clearTimeout(holdTimer); ui.setPlayIcon(playBtn, false); playBtn.setAttribute('aria-label', t('ql.play')); SK.services.speech.stop(); }
    function runStep(){
      const a = steps[s.i]; render(); bubble.classList.remove('on');
      if (useVideo){ let ch = media.chapters.find(c => c.stepId === a.stepId); if (!ch) return stop();
        const endOf = c => (c.stepId === 'A5-SALAM' && s.salamBoth && c.endBoth) ? c.endBoth : c.end;
        video.playbackRate = s.rate; video.currentTime = ch.start; video.play().catch(()=>{}); say(textFor(a));
        let waitSince = 0; const myRun = ++runId;
        const speaking = () => SK.services.speech.isSpeaking() || (!audio.paused && !audio.ended);
        const tick = curTick = (now) => { if (!playing || myRun !== runId) return;
          if (video.currentTime >= endOf(ch) - 0.05){
            if (!video.paused) video.pause();
            if (!waitSince) waitSince = now;
            if (speaking() || now - waitSince < 1200 / s.rate){ requestAnimationFrame(tick); return; }      // natural pause: let the explanation finish
            if (s.mode === 'full' && s.i < steps.length-1){ const nx = media.chapters.find(c => c.stepId === steps[s.i+1].stepId);
              if (nx){ s.i++; ch = nx; waitSince = 0; render(); video.currentTime = nx.start; video.play().catch(()=>{}); say(textFor(steps[s.i])); requestAnimationFrame(tick); return; } }
            stop(); return; }
          requestAnimationFrame(tick); };
        requestAnimationFrame(tick); return; }
      fig.set(startPose(s.i));
      say(textFor(a));
      const seq = seqFor(a).map(x => x.slice(0,3));
      // show «اللهُ أكبر» exactly when the takbir movement starts
      const tk = seqFor(a).findIndex(x => x[3] === 'takbir'); if (tk >= 0){ const delay = seqFor(a).slice(0,tk).reduce((m,x)=>m+x[1]+(x[2]||0),0); setTimeout(() => { bubble.classList.remove('on'); void bubble.offsetWidth; bubble.classList.add('on'); }, delay); }
      cancel = fig.play(seq, () => {
        cancel = null;
        if (s.mode === 'full' && playing && s.i < steps.length-1){
          const read = Math.min(9000, Math.max(2500, (textFor(a).length + (a.recitationText ? a.recitationText.length*0.35 : 0)) * 45));
          holdTimer = setTimeout(() => { if (!playing) return; s.i++; runStep(); }, read);
        } else stop();
      });
    }
    let paused = false, curTick = null;
    function play(){
      if (useVideo && paused){ paused = false; playing = true; video.play().catch(()=>{}); SK.services.speech.resume(); ui.setPlayIcon(playBtn, true); playBtn.setAttribute('aria-label', t('ql.pause')); if (curTick) requestAnimationFrame(curTick); return; }
      if (useVideo && playing){ paused = true; playing = false; video.pause(); SK.services.speech.pause(); ui.setPlayIcon(playBtn, false); playBtn.setAttribute('aria-label', t('ql.play')); return; }
      if (playing){ stop(); return; } playing = true; ui.setPlayIcon(playBtn, true); playBtn.setAttribute('aria-label', t('ql.pause')); runStep(); }
    function replay(){ stop(); playing = true; ui.setPlayIcon(playBtn, true); runStep(); }
    function go(k){ const was = playing; stop(); s.i = Math.max(0, Math.min(steps.length-1, k)); render(); fig.set(startPose(s.i)); if (useVideo){ const ch = media.chapters.find(c => c.stepId === steps[s.i].stepId); if (ch) video.currentTime = ch.start; } if (was){ playing = true; ui.setPlayIcon(playBtn, true); runStep(); } }
    playBtn.onclick = play;
    const mode = h('div',{class:'demo-modes', role:'tablist'},
      ...[['full','demo.modeFull','play'],['step','demo.modeStep','steps']].map(([m,k,ic]) => h('button',{class:'demo-mode'+(s.mode===m?' is-on':''), role:'tab', 'aria-selected':String(s.mode===m), onclick:(e)=>{ s.mode = m; e.currentTarget.parentNode.querySelectorAll('.demo-mode').forEach(b=>{ const on = b===e.currentTarget; b.classList.toggle('is-on',on); b.setAttribute('aria-selected',String(on)); }); }}, ui.svg(I[ic]), h('span',{}, t(k)))));
    const tool = (icon, label, fn, cls='') => h('button',{class:'demo-tool '+cls, 'aria-label':label, onclick:fn}, h('span',{'aria-hidden':'true', html: I[icon] || icon}), h('small',{}, label));
    const soundBtn = tool('volume', t('demo.sound'), e => { s.sound = !s.sound; e.currentTarget.classList.toggle('is-off', !s.sound); SK.services.speech.setMuted(!s.sound); }, s.sound ? '' : 'is-off');
    const ccBtn = tool('captions', t('ql.subtitles'), e => { s.cc = !s.cc; cc.style.display = s.cc ? '' : 'none'; e.currentTarget.classList.toggle('is-off', !s.cc); }, s.cc ? '' : 'is-off');
    const srcBtn = tool('book', t('common.showSource'), () => SK.ui.evidenceSheet({ evidence: steps[s.i].evidence, translation: steps[s.i].translation }));
    const listenBtn = tool('volume', t('demo.listenExpl'), () => { const was = s.sound; s.sound = true; say(textFor(steps[s.i])); s.sound = was; });
    const againBtn = tool('replay', t('demo.replayAudio'), () => { if (!lastAudio) return; if (lastAudio.kind === 'file') playFile(lastAudio.src); else { const was = s.sound; s.sound = true; say(lastAudio.text, lastAudio.lng); s.sound = was; } });
    const slowBtn = tool('slow', t('demo.slower'), e => { s.rate = s.rate === 1 ? 0.8 : s.rate === 0.8 ? 0.65 : 1; e.currentTarget.querySelector('small').textContent = s.rate === 1 ? t('demo.slower') : `${t('demo.slower')} ×${s.rate}`; if (video) video.playbackRate = s.rate; audio.playbackRate = s.rate; if (fig && fig.setSpeed) fig.setSpeed(s.rate); });
    const reciteBtn = tool('book', t('demo.recitation'), recite);
    const section = h('section',{class:'screen demo'},
      h('header',{class:'ql-bar'}, h('button',{class:'icon-btn', 'aria-label':t('common.back'), onclick:()=>{ stop(); SK.router.back(); }}, ui.svg(I.back)),
        h('div',{class:'ql-bar-mid'}, h('span',{class:'ql-bar-title'}, t('ql.watch')), h('span',{class:'ql-bar-topic'}, (SK.data.worships.find(w=>w.id===topic)||{}).name || '')), h('span',{class:'icon-spacer'})),
      mode, stage,
      h('div',{class:'demo-controls'},
        tool(dir==='rtl' ? 'next' : 'prev', t('demo.prev'), () => go(s.i-1)), playBtn, tool('replay', t('demo.replay'), replay), tool(dir==='rtl' ? 'prev' : 'next', t('demo.next'), () => go(s.i+1))),
      h('div',{class:'demo-row2'}, listenBtn, againBtn, slowBtn, ccBtn, srcBtn), h('div',{class:'demo-row2 demo-row3'}, soundBtn, reciteBtn), dots, info);
    requestAnimationFrame(() => { if (fig) fig.destroy(); fig = useVideo ? { set(){}, play(){ return ()=>{}; }, destroy(){}, resize(){} } : SK.figure.create(canvas); fig.resize(); fig.set(startPose(s.i)); render(); });
    window.addEventListener('resize', () => fig && fig.resize(), { once:true });
    return section;
  };
  /* ---------- per-step video inside the learning journey (same clip, the chapter of this step only) ---------- */
  const CONCEPT_STEP = { first_takbir:'A1-TAKBIR-1', second_takbir:'A2-TAKBIR-2', third_takbir:'A3-TAKBIR-3', fourth_takbir:'A4-TAKBIR-4' };
  const watched = new Set();
  SK.stepVideoCard = (conceptId, lessonText) => {
    const stepId = CONCEPT_STEP[conceptId], M = SK.services.demoMedia;
    if (!stepId || !M.hasVideo('janaza')) return null;
    const media = M.get('janaza'), ch = media.chapters.find(c => c.stepId === stepId);
    const step = SK.sources.animation('janaza').find(a => a.ok && a.stepId === stepId);
    if (!ch || !step) return null;                                   // no chapter or no verified evidence → no card
    const done = h('span',{class:'sv-done', hidden:!watched.has(stepId)}, t('lv.watched'));
    const card = h('button',{class:'sv-card', onclick:() => openStepVideo(stepId, step, ch, media, lessonText, () => { watched.add(stepId); done.hidden = false; })},
      h('span',{class:'sv-thumb', 'aria-hidden':'true'}, h('img',{src:media.video.poster || '', alt:''}), h('span',{class:'sv-play', html:I.play})),
      h('span',{class:'sv-text'}, h('b',{}, t('lv.card')), h('small',{}, t('lv.sub')), done));
    return card;
  };
  function openStepVideo(stepId, step, ch, media, lessonText, onWatched){
    const lang = SK.i18n.lang(), dir = SK.i18n.dir(), L = SK.i18n.LANGS[lang];
    const rec = SK.services.narrationAudio && SK.services.narrationAudio.get(step.fact.id, lang);
    const narr = rec ? SK.sources.text(step.fact, 'detail') : (lang === 'ar' ? lessonText : SK.sources.text(step.fact, 'directive'));
    const relRec = step.fact.recitation && SK.services.religiousAudio.get(step.fact.recitation);
    let sound = true, ccOn = true, endedOnce = false;
    const v = h('video',{class:'sv-video', playsinline:true, preload:'auto', poster:media.video.poster || null}, ...media.video.sources.map(x => h('source',{src:x.src, type:x.type})));
    const cc = SK.ui.subtitleBox();
    const doneMsg = h('p',{class:'sv-watched', hidden:true}, t('lv.watched'));
    const speak = () => { SK.services.speech.setMuted(!sound); SK.services.speech.speakParts([{ text:narr, lang, audioKey: step.fact.id }, relRec ? { kind:'religious', evidenceId:step.fact.recitation, text:step.recitationText } : { text:t('lv.helper'), lang }]); };
    const speaking = () => SK.services.speech.isSpeaking();
    let run = 0;
    const play = () => { svPaused = false; const my = ++run; v.playbackRate = 0.85; v.currentTime = ch.start; v.play().catch(()=>{}); speak(); ui.setPlayIcon(playBtn, true);
      const tick = svTick = () => { if (my !== run || svPaused) return;
        if (v.currentTime >= ch.end - 0.05){ if (!v.paused) v.pause();
          if (speaking()) return requestAnimationFrame(tick);
          ui.setPlayIcon(playBtn, false); if (!endedOnce){ endedOnce = true; doneMsg.hidden = false; onWatched && onWatched(); } return; }
        requestAnimationFrame(tick); };
      requestAnimationFrame(tick); };
    let svPaused = false, svTick = null;
    const pause = () => { svPaused = true; v.pause(); SK.services.speech.pause(); ui.setPlayIcon(playBtn, false); };
    const resume = () => { svPaused = false; v.play().catch(()=>{}); SK.services.speech.resume(); ui.setPlayIcon(playBtn, true); if (svTick) requestAnimationFrame(svTick); };
    const playBtn = h('button',{class:'sv-btn sv-main', 'aria-label':t('ql.play'), onclick:() => (svPaused ? resume() : playBtn.dataset.state === 'playing' ? pause() : play())}); ui.setPlayIcon(playBtn, false);
    const btn = (icon, label, fn) => h('button',{class:'sv-btn', 'aria-label':label, onclick:fn}, h('span',{'aria-hidden':'true', html: I[icon] || icon}), h('small',{}, label));
    const soundBtn = btn('volume', t('demo.sound'), e => { sound = !sound; e.currentTarget.classList.toggle('is-off', !sound); SK.services.speech.setMuted(!sound); });
    const ccBtn = btn('captions', t('ql.subtitles'), e => { ccOn = !ccOn; cc.style.display = ccOn ? '' : 'none'; e.currentTarget.classList.toggle('is-off', !ccOn); });
    const recNote = step.recitationText ? h('p',{class:'sv-note'}, (SK.services.demoMedia.recitation('janaza', stepId) || [].concat(step.evidence || [], step.recitation || []).some(e => { try { return SK.services.religiousAudio && SK.services.religiousAudio.get(e && e.id || e); } catch(_){ return false; } })) ? '' : t('lv.noRecAudio')) : null;
    v.addEventListener('loadedmetadata', () => { v.currentTime = ch.start; });
    const sheetEl = ui.sheet(t('lv.card'), h('div',{class:'sv-stage'}, v, cc, h('span',{class:'sv-tag'}, '')),
      h('div',{class:'sv-controls'}, playBtn, btn('replay', t('demo.replay'), play), soundBtn, ccBtn, btn('book', t('common.showSource'), () => SK.ui.evidenceSheet({ evidence:step.evidence, translation:step.translation }))),
      doneMsg, recNote,
      step.recitationText && SK.ui.RepeatAfterMe ? SK.ui.RepeatAfterMe({ expectedText:step.recitationText, audio:step.fact.recitation, language:'ar', compact:true, context:'step-video' }) : null);
    const dlg = document.getElementById('sheet'); if (dlg) dlg.addEventListener('close', () => { run++; try{ v.pause(); }catch(e){} SK.services.speech.stop(); }, { once:true });
  }

  // stop playback when leaving the screen
  SK.demoStop = () => { playing = false; if (cancel){ cancel(); cancel = null; } clearTimeout(holdTimer); };
})(window.SK);
