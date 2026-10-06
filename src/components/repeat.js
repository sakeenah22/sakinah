/* ===================== «ردّد معي» — التحقق من مطابقة العبارة المنطوقة =====================
   ONE shared service (SK.services.repeatAfterMe) + ONE shared component (SK.ui.RepeatAfterMe), used for every
   recitable text: learning path, full explanation, quick learning, step video, full-prayer demonstrator, guide.

   Real path:  microphone (getUserMedia) → MediaRecorder file → POST /api/stt (server function, key stays on the server)
               → Whisper speech-to-text in the TEXT's language → language-specific normalization → word alignment → result.
   Inside the claude.ai viewer the page cannot open the microphone itself (the platform holds it), so there the
   platform's dictation (Anthropic speech-to-text) is used instead — the same comparison and the same UI.
   If neither is available the learner is told so; there is never a made-up result.

   This checks that the spoken PHRASE matches the reference text. It does not judge tajwid, makharij or pronunciation. */
(function(SK){
  const h = SK.h, t = (k, v) => SK.t(k, v);

  /* ---------- language-specific normalization ---------- */
  const PUNCT = /[\p{P}\p{S}﴿﴾٠-٩0-9]/gu;
  const AR_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
  const NORMALIZE = {
    // Arabic: drop tashkil and tatweel, one alef (incl. the Quranic dagger alef «ٰ» → ا, as in مَـٰلِكِ = مالك), word-final ة/ه and ى/ي as spelling variants, no punctuation
    ar: s => s.replace(/\u0670/g, 'ا').replace(AR_MARKS, '').replace(/ـ/g, '').replace(/[أإآٱ]/g, 'ا').replace(PUNCT, ' ')
              .split(/\s+/).map(w => w.replace(/ة$/, 'ه').replace(/ى$/, 'ي')).join(' '),
    // Urdu: drop diacritics, Arabic-codepoint variants → Urdu letters (STT output differs), no punctuation
    ur: s => s.replace(/\u0670/g, '').replace(AR_MARKS, '').replace(/ـ/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ه/g, 'ہ').replace(PUNCT, ' '),
    tr: s => s.toLocaleLowerCase('tr-TR').replace(PUNCT, ' '),
    en: s => s.toLowerCase().replace(/[’']/g, '').replace(PUNCT, ' ')
  };
  const normalize = (s, lang = 'ar') => (NORMALIZE[lang] || NORMALIZE.en)(String(s || '').normalize('NFC')).replace(/\s+/g, ' ').trim();
  const words = (s, lang) => normalize(s, lang).split(' ').filter(Boolean);

  /* ---------- acceptance rules (fixed, tested — not tuned to pass recordings) ---------- */
  const RULES = {
    SHORT_MAX: 4,          // ≤ 4 words = a short phrase
    LONG_COVERAGE: 0.9,    // long text: ≥ 90 % of the reference words heard, in order
    PART_MIN: 0.75,        // long text: every part ≥ 75 % (a whole missing part fails)
    EXTRA_MAX: 0.25,       // long text: extra words ≤ 25 % of the reference
    SHORT_EXTRA: 1         // short phrase: every word required, at most one extra word
  };
  const describeRules = () => `word match = exact after normalization (1 letter tolerance for words ≥5 letters, 2 for ≥8). Short (≤${RULES.SHORT_MAX} words): every word in order, ≤${RULES.SHORT_EXTRA} extra. Long: ≥${RULES.LONG_COVERAGE*100}% in order, each part ≥${RULES.PART_MIN*100}%, extra ≤${RULES.EXTRA_MAX*100}%.`;
  function lev(a, b){ const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n);
    let prev = Array.from({length:n+1}, (_, j) => j);
    for (let i = 1; i <= m; i++){ const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1)); prev = cur; }
    return prev[n]; }
  const same = (a, b) => { if (a === b) return true; const L = Math.min(a.length, b.length); return L >= 5 && lev(a, b) <= (L >= 8 ? 2 : 1); };
  /** split a long reference into short parts (verse markers, punctuation, then ≤ 7 words) */
  function segments(ref, lang = 'ar'){
    const raw = String(ref).replace(/\s*(\.\.\.|…)\s*$/,'').split(/﴿[^﴾]*﴾|[،,؛;.:۔]/).map(s => s.trim()).filter(s => words(s, lang).length);
    const out = [];
    raw.forEach(s => { const w = s.split(/\s+/); if (w.length <= 7) { out.push(s); return; }
      const n = Math.ceil(w.length / 5), size = Math.ceil(w.length / n);
      for (let i = 0; i < w.length; i += size) out.push(w.slice(i, i + size).join(' ')); });
    return out.length ? out : [String(ref)];
  }
  /** compare what was recognized with the reference text → PASS / FAIL / NO_SPEECH (+ the details shown to the learner) */
  function evaluate(expectedText, recognized, lang = 'ar'){
    const parts = segments(expectedText, lang), H = words(recognized, lang);
    const R = []; parts.forEach((p, k) => words(p, lang).forEach(w => R.push({ w, k })));
    const base = { recognized: String(recognized || '').trim(), language: lang, rules: describeRules() };
    if (!H.length) return { ...base, status:'NO_SPEECH', score:0, threshold:null, parts: parts.map(text => ({ text, ratio:0, ok:false })), matched:0 };
    const m = R.length, n = H.length, L = Array.from({length:m+1}, () => new Array(n+1).fill(0));
    for (let i = m-1; i >= 0; i--) for (let j = n-1; j >= 0; j--) L[i][j] = same(R[i].w, H[j]) ? L[i+1][j+1] + 1 : Math.max(L[i+1][j], L[i][j+1]);
    const hit = new Array(m).fill(false); for (let i = 0, j = 0; i < m && j < n;){ if (same(R[i].w, H[j])){ hit[i] = true; i++; j++; } else if (L[i+1][j] >= L[i][j+1]) i++; else j++; }
    const got = hit.filter(Boolean).length, extra = n - got, coverage = m ? got / m : 0;
    const res = parts.map((text, k) => { const idx = R.map((r, i) => r.k === k ? i : -1).filter(i => i >= 0);
      const ratio = idx.length ? idx.filter(i => hit[i]).length / idx.length : 0; return { text, ratio, ok: ratio >= RULES.PART_MIN }; });
    let pass, threshold;
    if (m <= RULES.SHORT_MAX){ threshold = 1; pass = got === m && extra <= RULES.SHORT_EXTRA; }
    else { threshold = RULES.LONG_COVERAGE; pass = coverage >= RULES.LONG_COVERAGE && res.every(p => p.ratio >= RULES.PART_MIN) && extra <= Math.ceil(m * RULES.EXTRA_MAX); }
    return { ...base, status: pass ? 'PASS' : 'FAIL', score: coverage, threshold, parts: res.map(p => ({ ...p, ok: pass ? true : p.ok })), matched: res.filter(p => p.ok).length,
      missingWords: R.filter((r, i) => !hit[i]).map(r => r.w), extraWords: extra };
  }

  /* ---------- speech-to-text providers ---------- */
  let dict = null, server = null;
  try{ if (window.claude && typeof window.claude.use === 'function') window.claude.use('dictation').then(d => { dict = d; }).catch(() => {}); }catch(e){}
  const serverCheck = (async () => { try{
    const r = await fetch('api/stt', { cache:'no-store' });
    if (r.ok && /json/.test(r.headers.get('content-type') || '')){ const j = await r.json(); if (j && j.ok) server = j; }
  }catch(e){} return server; })();
  const provider = () => server && server.configured ? 'server' : (dict ? 'claude-dictation' : (server ? 'server-not-configured' : 'none'));
  const providerLabel = () => provider() === 'server' ? `${server.provider} ${server.model} (via /api/stt)` : provider() === 'claude-dictation' ? 'claude.ai dictation (Anthropic STT)' : provider();
  const languages = () => provider() === 'server' ? (server.languages || []) : provider() === 'claude-dictation' ? ['ar','en','tr','ur'] : [];
  const BCP = { ar:'ar-SA', en:'en-US', tr:'tr-TR', ur:'ur-PK' };
  const MIME = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];

  /* ---------- one attempt at a time, everywhere; cancelled when the screen changes ---------- */
  const log = []; let current = null, generation = 0;
  function cancelAll(){ generation++; if (current){ try{ current.cancel(); }catch(e){} current = null; } }

  /** record with the real microphone → file → server STT. Returns a controller; calls back with UI events. */
  async function recordToServer({ expectedText, lang, onState, onLevel, onDone }){
    const myGen = generation, started = performance.now(); let stream, ctx, rec, chunks = [], raf = 0, voicedMs = 0, peak = 0, last = performance.now(), cancelled = false, timer = 0;
    const cleanup = () => { cancelAnimationFrame(raf); clearTimeout(timer); try{ stream && stream.getTracks().forEach(tr => tr.stop()); }catch(e){} try{ ctx && ctx.close(); }catch(e){} };
    const ctl = { cancel(){ cancelled = true; try{ rec && rec.state !== 'inactive' && rec.stop(); }catch(e){} cleanup(); }, stop(){ try{ rec && rec.state === 'recording' && rec.stop(); }catch(e){} } };
    current = ctl;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true, channelCount:1 } }); }
    catch (e) { cleanup(); return onDone({ status: e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') ? 'NO_MICROPHONE' : 'PERMISSION_DENIED', error: e && e.name }); }
    if (cancelled || myGen !== generation) return cleanup();
    const mime = MIME.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
    try { rec = new MediaRecorder(stream, mime ? { mimeType:mime } : undefined); } catch (e) { cleanup(); return onDone({ status:'ERROR', error:'MediaRecorder: ' + (e && e.name) }); }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const tick = () => { an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v*v; const rms = Math.sqrt(s / buf.length), now = performance.now();
        if (rms > 0.02) voicedMs += now - last; last = now; peak = Math.max(peak, rms); onLevel(Math.min(1, rms * 6), (now - started) / 1000); raf = requestAnimationFrame(tick); };
      tick(); } catch (e) { /* level meter is optional; recording continues */ }
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      const durationMs = Math.round(performance.now() - started); cleanup();
      if (cancelled || myGen !== generation) return;
      const type = (rec.mimeType || mime || 'audio/webm').split(';')[0];
      const blob = new Blob(chunks, { type }); chunks = [];
      const meta = { durationMs, bytes: blob.size, mime: type, voicedMs: Math.round(voicedMs), peak: +peak.toFixed(3) };
      if (!blob.size || voicedMs < 250) return onDone({ status:'NO_SPEECH', ...meta, note:'no voice detected in the recording — not sent' });
      onState('verifying');
      const ab = new AbortController(); const to = setTimeout(() => ab.abort(), 30000);
      let resp; try { resp = await fetch('api/stt?lang=' + encodeURIComponent(lang), { method:'POST', headers:{ 'Content-Type': type }, body: blob, signal: ab.signal }); }
      catch (e) { clearTimeout(to); if (myGen !== generation) return; return onDone({ status: e.name === 'AbortError' ? 'STT_ERROR' : 'NETWORK', error: e.name, ...meta }); }
      clearTimeout(to);
      if (myGen !== generation) return;                                   // the learner moved on: ignore the late result
      let j = {}; try { j = await resp.json(); } catch (e) {}
      if (!resp.ok) return onDone({ status: j.error === 'unsupported_language' ? 'LANGUAGE_UNSUPPORTED' : j.error === 'not_configured' ? 'UNAVAILABLE' : 'STT_ERROR', error: j.error || ('HTTP ' + resp.status), ...meta });
      onDone({ ...evaluate(expectedText, j.text, lang), ...meta, model: j.model });
    };
    rec.start(250); onState('recording');
    timer = setTimeout(() => ctl.stop(), Math.min(60000, 6000 + words(expectedText, lang).length * 1200));   // stops itself; the result still comes from STT
    return ctl;
  }

  /** claude.ai viewer: the platform's dictation (it holds the microphone). Must start inside the tap. */
  function recordWithDictation({ expectedText, lang, onState, onDone }){
    const myGen = generation, started = performance.now(); let finals = '', partial = '', done = false, error = null; const offs = [];
    const end = () => { if (done) return; done = true; offs.forEach(f => f()); if (myGen !== generation) return;
      const meta = { durationMs: Math.round(performance.now() - started) };
      if (error) return onDone({ status:error, ...meta }); onDone({ ...evaluate(expectedText, (finals + ' ' + partial).trim(), lang), ...meta }); };
    offs.push(dict.onFinal(e => { finals += e.text; partial = ''; }));
    offs.push(dict.onPartial(e => { partial = e.text; }));
    offs.push(dict.onState(e => { if (e.state === 'finishing') onState('verifying');
      if (e.state === 'idle'){ const r = e.reason || ''; if (/not_granted|dismissed/.test(r)) error = 'PERMISSION_DENIED'; else if (/unavailable/.test(r)) error = 'UNAVAILABLE'; else if (/upstream_error|rate_limited/.test(r)) error = 'STT_ERROR'; end(); } }));
    dict.start({ language: BCP[lang] || lang }).then(() => onState('recording')).catch(err => { const c = err && err.code;
      error = /not_granted|dismissed/.test(c) ? 'PERMISSION_DENIED' : c === 'unavailable' ? 'UNAVAILABLE' : c === 'stopped' ? null : 'STT_ERROR'; end(); });
    const ctl = { cancel(){ done = true; offs.forEach(f => f()); dict.stop().catch(() => {}); }, stop(){ onState('verifying'); dict.stop().catch(() => {}); } };
    current = ctl; return ctl;
  }

  SK.services.repeatAfterMe = { RULES, describeRules, normalize, words, segments, evaluate, provider, providerLabel, languages, log, cancelAll, ready: serverCheck };

  /* ---------- the shared component ---------- */
  const MUTE_KEY = 'sk:rpMute';
  const isMuted = () => { try{ return localStorage.getItem(MUTE_KEY) === '1'; }catch(e){ return false; } };
  /** <RepeatAfterMe expectedText audio={evidenceId} language="ar" compact context /> — language = language of the TEXT, not of the interface */
  SK.ui.RepeatAfterMe = ({ expectedText, audio, language = 'ar', compact = false, context = '' } = {}) => {
    if (!expectedText) return null;
    const S = SK.services.speech, I = SK.ui.icons, lang = String(language).slice(0, 2);
    const statusEl = h('div',{class:'rp-status', 'aria-live':'polite'});
    const result = h('div',{class:'rp-result', 'aria-live':'polite'});
    let ctl = null, state = 'idle';
    const listenBtn = h('button',{type:'button', class:'chip-btn rp-listen', onclick:() => { cancelAll(); S.speakReligious(audio, expectedText); }}, SK.ui.svg(I.speaker), t('rp.listenAgain'));
    const muteBtn = h('button',{type:'button', class:'rp-mute', 'aria-pressed':String(isMuted()), 'aria-label': t('rp.muteResult'), title: t('rp.muteResult'),
      onclick: e => { const m = !isMuted(); try{ localStorage.setItem(MUTE_KEY, m ? '1' : '0'); }catch(_){} e.currentTarget.setAttribute('aria-pressed', String(m)); e.currentTarget.textContent = m ? '🔇' : '🔈'; }}, isMuted() ? '🔇' : '🔈');
    const micBtn = h('button',{type:'button', class:'rp-mic', onclick:() => state === 'recording' ? ctl && ctl.stop() : start()}, SK.ui.svg(I.mic), h('span',{}, t('rp.start')));
    const cancelBtn = h('button',{type:'button', class:'link-btn rp-cancel', hidden:true, onclick:() => { cancelAll(); setState('idle'); }}, t('rp.cancel'));
    const meter = h('div',{class:'rp-meter', hidden:true, role:'meter', 'aria-label':t('rp.level')}, h('i'));
    const clock = h('span',{class:'rp-clock'});
    function setState(s){ state = s; root.dataset.state = s;
      micBtn.classList.toggle('is-listening', s === 'recording'); micBtn.disabled = s === 'verifying';
      micBtn.lastChild.textContent = s === 'recording' ? t('rp.stopCheck') : (s === 'verifying' ? t('rp.verifying') : (result.childNodes.length ? t('rp.again') : t('rp.start')));
      meter.hidden = s !== 'recording' || provider() !== 'server'; cancelBtn.hidden = s !== 'recording';
      statusEl.replaceChildren(...(s === 'recording' ? [h('span',{class:'rp-dot'}), t('rp.recording'), ' ', clock] : s === 'verifying' ? [h('span',{class:'rp-spin'}), t('rp.verifying')] : []));
    }
    function say(msgKey){ if (!isMuted()) S.speak(t(msgKey), SK.i18n.lang()); }
    function start(){
      if (state !== 'idle') return;
      cancelAll(); S.stop();                                   // no reference audio may be recorded by the microphone
      result.replaceChildren(); clock.textContent = '0:00';
      if (!languages().includes(lang) && provider() !== 'none' && provider() !== 'server-not-configured') return show({ status:'LANGUAGE_UNSUPPORTED' });
      const p = provider();
      if (p === 'none' || p === 'server-not-configured') return show({ status:'UNAVAILABLE', error:p });
      const base = { expectedText, lang, onState: setState,
        onLevel: (v, sec) => { meter.firstChild.style.width = Math.round(v * 100) + '%'; clock.textContent = `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`; },
        onDone: r => { ctl = null; current = null; if (!root.isConnected) return; show(r); } };
      setState('recording');
      if (p === 'claude-dictation') ctl = recordWithDictation(base);
      else recordToServer(base).then(c => { if (c) ctl = c; });
    }
    function show(r){
      const entry = { at:new Date().toISOString(), context, expected:expectedText, textLanguage:lang, uiLanguage:SK.i18n.lang(), provider:providerLabel(), ...r };
      log.push(entry); if (log.length > 40) log.shift();
      root.dataset.result = r.status; setState('idle');
      const msgKey = { PASS:'rp.passMsg', FAIL:'rp.failMsg', NO_SPEECH:'rp.noSpeech', PERMISSION_DENIED:'rp.noMic', NO_MICROPHONE:'rp.noDevice', NETWORK:'rp.network',
                       STT_ERROR:'rp.sttError', UNAVAILABLE:'rp.unavailable', LANGUAGE_UNSUPPORTED:'rp.langUnsupported', ERROR:'rp.sttError' }[r.status] || 'rp.sttError';
      const ok = r.status === 'PASS', compared = r.status === 'PASS' || r.status === 'FAIL';
      result.replaceChildren(...[
        h('p',{class:'rp-verdict ' + (ok ? 'is-pass' : compared ? 'is-fail' : 'is-info')}, h('span',{class:'rp-mark', 'aria-hidden':'true'}, ok ? '✓' : '!'), t(msgKey)),
        compared ? h('dl',{class:'rp-texts'},
          h('dt',{}, t('rp.expected')), h('dd',{lang, dir: lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr'}, expectedText),
          h('dt',{}, t('rp.recognized')), h('dd',{lang, dir: lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr', class:'rp-heard'}, r.recognized || '—')) : null,
        compared && !ok && r.parts && r.parts.length > 1 ? h('ul',{class:'rp-parts'}, r.parts.map(p => h('li',{class:'rp-part ' + (p.ok ? 'is-ok' : 'is-redo')},
          h('span',{class:'rp-mark', 'aria-hidden':'true'}, p.ok ? '✓' : '!'), h('span',{class:'rp-seg', lang, dir: lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr'}, p.text), h('small',{class:'rp-tag'}, p.ok ? t('rp.ok') : t('rp.redo'))))) : null,
        compared ? h('p',{class:'rp-note'}, t('rp.note')) : null].filter(Boolean));
      if (!ok) micBtn.lastChild.textContent = compared || r.status === 'NO_SPEECH' ? t('rp.again') : t('rp.retry');
      say(msgKey);
    }
    const head = h('div',{class:'rp-head'}, h('span',{class:'rp-ico', 'aria-hidden':'true'}, SK.ui.svg(I.mic)),
      h('span',{class:'rp-title'}, h('b',{}, t('rp.title')), h('small',{}, t('rp.sub'))), muteBtn);
    const body = h('div',{class:'rp-body'}, h('div',{class:'rp-actions'}, micBtn, listenBtn, cancelBtn), statusEl, meter, result);
    let root;
    if (!compact) root = h('div',{class:'repeat-practice', 'data-context':context, 'data-lang':lang}, head, body);
    else {
      body.hidden = true;
      const toggle = h('button',{type:'button', class:'ql-act rp-toggle', 'aria-expanded':'false', onclick:() => { body.hidden = !body.hidden; toggle.setAttribute('aria-expanded', String(!body.hidden)); if (body.hidden){ cancelAll(); setState('idle'); } }},
        SK.ui.svg(I.mic), h('span',{}, t('rp.title')));
      root = h('div',{class:'repeat-practice is-compact', 'data-context':context, 'data-lang':lang}, toggle, body);
    }
    root.dataset.state = 'idle';
    return root;
  };
  SK.ui.repeatPractice = ({ text, evidenceId, compact = false, context = '' } = {}) => SK.ui.RepeatAfterMe({ expectedText:text, audio:evidenceId, language:'ar', compact, context });
  SK.services.repeat = SK.services.repeatAfterMe;
})(window.SK);
