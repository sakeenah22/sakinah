/* Sakeenah card: entry choice, create card, show card, scan card, welcome back */
(function(SK){
  const t = (k,v) => SK.t(k,v);
  const h = SK.h, ui = SK.ui, I = SK.ui.icons, D = SK.data, S = SK.screens;
  const go = (r,o) => SK.router.go(r,o);
  const P = () => SK.services.profiles, PR = () => SK.services.progress;
  const say = t => SK.services.speech.speak(t);
  const listenBtn = text => h('button',{class:'listen-btn', 'aria-label':t('cd.listen'), onclick:()=>say(text)}, ui.svg(I.speaker), h('span',{}, t('common.listen')));

  /** begin a session after create / scan */
  function signIn(res){ SK.store.set({ session:res.session }); }
  SK.signOut = () => { SK.store.set({ session:null, cardInfo:null }); };

  // ---------- QR rendering (built-in offline encoder, components/qr.js) ----------
  function qrNode(text, size){
    const box = h('div',{class:'qr-real', role:'img', 'aria-label':t('cd.qrLabel')});
    try{ box.append(SK.qr.canvas(text, size)); }                     // built-in encoder: works offline, no external library
    catch(e){ box.classList.add('qr-fallback'); box.textContent = t('cd.qrOffline'); }
    return box;
  }

  // ---------- 1. entry: create card or continue as guest ----------
  S.entry = () => ui.screen({ title:t('cd.howStart'),
    body:[
      h('button',{class:'choice is-suggested', onclick:()=>go('create')},
        h('span',{class:'choice-ico'}, ui.svg(I.card)), h('span',{class:'choice-text'}, h('b',{}, t('cd.create')), h('small',{}, t('cd.createSub'))),
        h('span',{class:'choice-tag'}, t('cd.suggested'))),
      h('button',{class:'choice', onclick:()=>{ SK.signOut(); go('haramTopics'); }},          // no card, no sign-in, no code
        h('span',{class:'choice-ico'}, ui.svg(I.bolt)), h('span',{class:'choice-text'}, h('b',{}, t('cd.quick')), h('small',{}, t('cd.quickSub'))),
        h('span',{class:'choice-tag is-alt'}, t('cd.haramBadge'))) ] });

  // ---------- 2. create (one step, name optional) ----------
  S.create = () => {
    const input = h('input',{type:'text', class:'big-input', id:'nick', maxlength:'30', autocomplete:'off', placeholder:t('common.optional'), 'aria-describedby':'nick-hint'});
    const make = () => { const res = P().create({ name:input.value }); signIn(P().resolve(res.qr)); SK.store.set({ cardInfo:{ qr:res.qr, code:res.code, name:res.displayName } }); go('mycard',{replace:true}); };
    return ui.screen({ title:t('cd.createTitle'),
      body:[ h('div',{class:'start-bar'}, listenBtn(t('cd.createListen'))),
        h('label',{for:'nick', class:'big-label'}, t('cd.nick')), input,
        h('p',{id:'nick-hint', class:'hint'}, t('cd.noData')) ],
      footer:[ ui.button(t('cd.createBtn'),{onclick:make}) ] });
  };

  // ---------- 3. the card ----------
  function cardFace(info, {size=236}={}){
    return h('div',{class:'sk-card2 print-card'},
      h('div',{class:'sk-card2-top'}, ui.logo(), info.name ? h('span',{class:'sk-name'}, info.name) : null),
      h('div',{class:'qr-wrap'}, qrNode(info.qr, size)),
      h('div',{class:'code-box'}, h('span',{class:'code-label'}, t('common.cardCode')), h('span',{class:'code-digits', dir:'ltr'}, info.code.replace(/(\d{3})(\d{3})/,'$1 $2'))),
      h('p',{class:'card-key'}, t('cd.key')),
      h('p',{class:'card-key-sub'}, t('cd.keySub')),
      h('p',{class:'card-privacy'}, ui.svg(I.check), t('cd.privacy')));
  }
  function cardImage(info){
    const c = document.createElement('canvas'); const W=900,H=1200; c.width=W; c.height=H; const x = c.getContext('2d');
    x.fillStyle='#F7F7F2'; x.fillRect(0,0,W,H); x.fillStyle='#fff'; x.strokeStyle='#C9A45C'; x.lineWidth=6;
    x.beginPath(); x.roundRect ? x.roundRect(40,40,W-80,H-80,48) : x.rect(40,40,W-80,H-80); x.fill(); x.stroke();
    x.direction=SK.i18n.dir(); x.textAlign='center'; x.fillStyle='#063F3A'; x.font='700 96px Amiri, serif'; x.fillText(t('common.brand'), W/2, 190);
    if (info.name){ x.font='600 40px "IBM Plex Sans Arabic", sans-serif'; x.fillText(info.name, W/2, 250); }
    const q = document.querySelector('.qr-real canvas') || document.querySelector('.qr-real img'); if (q) x.drawImage(q, W/2-260, 290, 520, 520);
    x.font='600 36px "IBM Plex Sans Arabic", sans-serif'; x.fillStyle='#4f5f5c'; x.fillText(t('common.cardCode'), W/2, 880);
    x.direction='ltr'; x.font='700 84px "IBM Plex Sans Arabic", monospace'; x.fillStyle='#063F3A'; x.fillText(info.code.replace(/(\d{3})(\d{3})/,'$1 $2'), W/2, 980);
    x.direction=SK.i18n.dir(); x.font='600 40px "IBM Plex Sans Arabic", sans-serif'; x.fillText(t('cd.key'), W/2, 1070);
    x.font='400 28px "IBM Plex Sans Arabic", sans-serif'; x.fillStyle='#4f5f5c'; x.fillText(t('cd.privacy'), W/2, 1120);
    return c.toDataURL('image/png');
  }
  S.mycard = () => {
    const info = SK.store.get().cardInfo;
    if (!info) return S.card();
    const save = () => { const url = cardImage(info);
      const a = h('a',{href:url, download:'sakeenah-card.png'}); document.body.append(a); try{ a.click(); }catch(e){} a.remove();
      ui.sheet(t('cd.saveTitle'), h('p',{class:'muted'}, t('cd.saveHint')), h('img',{src:url, alt:t('card.title'), class:'card-img'})); };
    return h('section',{class:'screen'},
      
      h('h1',{class:'screen-title', id:'screen-title'}, t('card.title')),
      cardFace(info),
      (() => { // saved progress on this card (from storage — nothing invented)
        const sess = SK.store.get().session, prof = sess && SK.services.storage.loadProfile(sess.cardId), fp = prof && prof.journeys && prof.journeys[PR().JOURNEY];
        if (!fp) return null; const pct = fp.conceptStates ? PR().calculateJourneyProgress(fp) : (fp.progressPercent || 0);
        return h('div',{class:'card-progress'}, h('div',{class:'cp-row'}, h('b',{}, t('common.janazah')), h('span',{class:'cp-pct'}, pct + '%')),
          h('div',{class:'bar'}, h('i',{style:`width:${pct}%`}))); })(),
      h('p',{class:'keep'}, t('cd.keep')),
      h('div',{class:'stack'}, (() => { const sess = SK.store.get().session, prof = sess && SK.services.storage.loadProfile(sess.cardId);
          const has = prof && prof.journeys && prof.journeys[PR().JOURNEY];
          return has ? ui.button(t('cd.continueJourney'),{onclick:async()=>{ const ok = await PR().resume(); if (ok === 'explain') go('explain',{reset:true}); else if (ok === 'done') go('result',{reset:true}); else go('worship'); }})
                     : ui.button(t('cd.startLearning'),{onclick:()=>go('worship')}); })(),
        ui.button(t('cd.saveJourney'),{variant:'ghost', onclick:save})));
  };
  S.mycard.nav = 'card';

  // bottom-nav "بطاقتي"
  S.card = () => {
    if (SK.store.get().session && SK.store.get().cardInfo) return S.mycard();
    return ui.screen({ title:t('card.title'), back:false,
      body:[ ui.card('sk-card', h('div',{class:'sk-card-top'}, ui.logo()),
          h('p',{class:'sk-card-main'}, t('card.keeps')), h('p',{class:'muted'}, t('card.noLogin'))),
        ui.button(t('cd.create'),{onclick:()=>go('create')}),
        ui.button(t('start.scan'),{variant:'ghost', icon:'qr', onclick:()=>go('scan')}) ] });
  };
  S.card.nav = 'card';

  // ---------- 5. scan / enter code ----------
  let stream = null, loop = null;
  function stopCam(){ if (loop) cancelAnimationFrame(loop); loop=null; if (stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } }
  SK.stopCam = stopCam;
  function loadJsQR(){ return new Promise((res,rej)=>{ if (window.jsQR) return res(); const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'; s.onload=res; s.onerror=rej; document.head.append(s); }); }
  function arrive(input){
    const res = P().resolve(input);
    if (!res) return false;
    stopCam(); signIn(res);
    SK.store.set({ cardInfo:{ qr:P().QR_PREFIX+res.session.token, code:res.session.code, name:res.card.displayName } });
    go('welcome',{replace:true}); return true;
  }
  S.scan = () => {
    const status = h('p',{class:'hint center', 'aria-live':'polite'});
    const video = h('video',{class:'cam', playsinline:true, muted:true, autoplay:true, 'aria-hidden':'true'});
    const finder = h('div',{class:'finder'}, video, h('span',{class:'finder-corners', 'aria-hidden':'true'}), h('span',{class:'finder-line', 'aria-hidden':'true'}),
      h('span',{class:'finder-idle'}, ui.svg(I.qr)));
    const startCam = async () => {
      status.textContent = t('cd.camStarting');
      try{
        stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } });
        video.srcObject = stream; await video.play(); finder.classList.add('is-live'); status.textContent = t('cd.camPoint');
        const det = ('BarcodeDetector' in window) ? new BarcodeDetector({ formats:['qr_code'] }) : null;
        if (!det) await loadJsQR();
        const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently:true });
        const tick = async () => {
          if (!stream) return;
          try{
            let text = null;
            if (det){ const r = await det.detect(video); if (r[0]) text = r[0].rawValue; }
            else if (video.videoWidth){ cv.width=video.videoWidth; cv.height=video.videoHeight; cx.drawImage(video,0,0); const d=cx.getImageData(0,0,cv.width,cv.height); const r=window.jsQR(d.data,d.width,d.height); if (r) text=r.data; }
            if (text && !arrive(text)){ status.textContent = t('cd.badCode'); }
          }catch(e){}
          loop = requestAnimationFrame(tick);
        };
        tick();
      }catch(e){ status.textContent = t('cd.camNA'); }
    };
    const code = h('input',{type:'text', inputmode:'numeric', pattern:'[0-9]*', maxlength:'6', class:'code-input', dir:'ltr', autocomplete:'one-time-code', 'aria-label':t('cd.codeLabel'), placeholder:'••••••'});
    const err = h('p',{class:'hint', 'aria-live':'polite'});
    code.addEventListener('input', () => { code.value = code.value.replace(/\D/g,'').slice(0,6); err.textContent=''; });
    const submit = () => { if (code.value.length!==6){ err.textContent=t('cd.code6'); return; } if (!arrive(code.value)) err.textContent=t('cd.notFound'); };
    const demo = () => { const tok = P().lastDeviceToken(); if (!tok){ status.textContent=t('cd.noDeviceCard'); return; }
      finder.classList.add('is-demo'); status.textContent=t('cd.reading'); setTimeout(()=>arrive(P().QR_PREFIX+tok), SK.reducedMotion()?100:1300); };
    return ui.screen({ title:t('cd.scanTitle'),
      body:[ h('div',{class:'start-bar'}, listenBtn(t('cd.scanListen'))),
        h('p',{class:'scan-ins'}, t('cd.scanIns')), finder, status,
        h('div',{class:'two'}, ui.button(t('cd.camOn'),{variant:'ghost', icon:'qr', onclick:startCam}), ui.button(t('cd.demoScan'),{variant:'ghost', onclick:demo})),
        ui.card('code-card', h('p',{class:'code-q'}, t('cd.cantScan')), h('label',{class:'big-label', for:'cardcode'}, t('cd.enterCode')),
          (code.id='cardcode', code), err, ui.button(t('common.continue'),{onclick:submit})) ] });
  };

  // ---------- 6 + 8. welcome back with learning memory ----------
  S.welcome = () => {
    const sess = SK.store.get().session; if (!sess) return S.start();
    const prof = SK.services.storage.loadProfile(sess.cardId) || { card:{}, journeys:{} };
    const fp = prof.journeys[PR().JOURNEY] || null;                 // saved progress for this card — never a default when data exists
    const name = prof.card.displayName ? `${SK.i18n.dir()==='rtl' ? '،' : ','} ${prof.card.displayName}` : '';
    const known = fp ? (fp.conceptStates ? Object.keys(fp.conceptStates).filter(id=>['mastered','corrected'].includes(fp.conceptStates[id])) : [...(fp.masteredConcepts||[]), ...(fp.correctedConcepts||[])]) : [];
    const focus = fp ? fp.currentStep : null;
    const tk = PR().takbeerStatus(known, focus);
    const mark = { done:'✓', current:'●', todo:'○' };
    const finished = !!fp && fp.status === 'completed';
    const pct = fp ? (fp.conceptStates ? PR().calculateJourneyProgress(fp) : (fp.progressPercent || 0)) : 0;
    const p = { misconceptions: fp ? fp.confusedConcepts : [], conceptsNeedingReview: fp ? fp.needingReview : [] };
    const js = fp && fp.state ? { queue: fp.currentStep ? [fp.currentStep] : [], step:0 } : null;

    // learning memory: review a past misconception (prefer one already explained, to test retention)
    const pending = (js ? js.queue.slice(js.step) : (p.conceptsNeedingReview||[])).map(D.canon);
    const miscs = (p.misconceptions||[]).map(D.canon).filter(id => D.concept(id) && (D.questions[id]||[]).length);
    const memId = miscs.find(id => !pending.includes(id)) || miscs[0] || null;
    let memory = null;
    if (memId){
      const c = D.concept(memId); const qq = D.questions[memId][D.questions[memId].length-1];
      const ex = SK.services.retrieval.explain(memId);
      const fb = h('div',{class:'feedback', 'aria-live':'polite'}); let done = false;
      const items = qq.options.map(([text, correct], i) => ({ id:String(i), text, correct:!!correct }));
      const opts = ui.options(items, { onPick:(it,btn)=>{ if (done) return;
        if (it.correct){ done=true; btn.classList.add('is-right'); opts.classList.add('is-locked'); fb.replaceChildren(h('div',{class:'success'}, h('p',{}, t('wb.remembered'))));
          SK.services.storage.saveProgress(sess.cardId, PR().JOURNEY, { lastReview:{ id:memId, ok:true, at:new Date().toISOString() } }); }
        else { btn.classList.add('is-wrong'); btn.disabled=true; fb.replaceChildren(h('div',{class:'gentle'}, h('p',{}, t('wb.reminder'), h('b',{lang:SK.i18n.lang(), dir:SK.i18n.dir()}, ex.ok ? ex.text : '')))); SK.services.storage.saveProgress(sess.cardId, PR().JOURNEY, { lastReview:{ id:memId, ok:false, at:new Date().toISOString() } }); } } });
      memory = ui.card('memory', h('span',{class:'eyebrow'}, t('wb.forYou')),
        h('p',{class:'memory-text'}, t('wb.prevNeeded'), h('b',{}, '«'+c.title+'»'), '.'), h('p',{class:'memory-q'}, t('wb.rememberNow')),
        h('p',{class:'question small-q'}, qq.q), opts, fb);
    }
    const resume = async () => { const ok = await PR().resume(); if (ok === 'explain') go('explain',{reset:true}); else if (ok === 'done') go('result',{reset:true}); else { SK.store.resetJourney(); go('pre',{reset:true}); } };
    return ui.screen({ back:false, title:t('common.welcomeBack') + name,
      body:[ h('div',{class:'start-bar'}, listenBtn(t('wb.listen',{pct}))),
        h('p',{class:'lead'}, finished ? t('wb.doneBefore') : t('wb.continueQ')),
        ui.card('last', h('div',{class:'last-head'}, h('b',{}, t('common.janazah')), h('span',{class:'pct'}, t('wb.pctDone',{pct}))),
          h('div',{class:'meter'}, h('i',{class:'after', style:`--w:${pct}%`})),
          h('ul',{class:'tk-list'}, tk.map(x=>h('li',{class:'tk-'+x.state}, h('span',{class:'tk-mark', 'aria-hidden':'true'}, mark[x.state]), [t('concept.first_takbir'),t('concept.second_takbir'),t('concept.third_takbir'),t('concept.fourth_takbir')][x.n-1],
            h('span',{class:'sr'}, x.state==='done'?t('wb.stDone'):x.state==='current'?t('wb.stCurrent'):t('wb.stTodo')))))),
        memory ],
      footer:[ h('div',{class:'stack'}, ui.button(finished?t('common.newJourney'):t('common.continueJourney'),{onclick: finished ? ()=>{ SK.store.resetJourney(); go('pre',{reset:true}); } : resume}),
        ui.button(t('common.quickReview'),{variant:'ghost', icon:'bolt', onclick:()=>go('quick')})) ] });
  };
})(window.SK);
