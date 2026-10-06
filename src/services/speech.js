/* ===================== Sakeenah voice system (one for the whole app) =====================
   Technology: the browser's Web Speech API — SpeechSynthesis for output, SpeechRecognition for input.
   • VoiceManager picks the best installed voice for the language of the TEXT (never an Arabic voice for English
     or the reverse); if none exists it says so instead of mispronouncing.
   • Narration (Sakeenah's explanations) may use TTS.
   • Religious audio (Quran, supplications, salawat, salam wording) is NEVER synthesized: it plays an approved
     recording registered in religiousAudio, otherwise the user is told the recording is not available yet. */
(function(SK){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis || null;
  const t = (k,v) => SK.t ? SK.t(k,v) : k;

  /* ---------- central voice setting — change it here and all of Sakeenah follows ---------- */
  const ARABIC_SAKEENAH_VOICE = 'ar-IQ-BasselNeural';          // preferred: «Microsoft Bassel Online (Natural) - Arabic (Iraq)»; if absent, the best Arabic voice on the device
  SK.config = SK.config || {}; SK.config.ARABIC_SAKEENAH_VOICE = ARABIC_SAKEENAH_VOICE;
  const parseVoiceId = id => { const m = /^([a-z]{2}-[A-Z]{2})-(\w+?)(Neural)?$/.exec(id || ''); return m ? { locale:m[1], name:m[2] } : null; };
  const allowFallback = lang => { try{ return localStorage.getItem('sakeenah:voiceFallback:' + lang) === '1'; }catch(e){ return false; } };

  /* ---------- VoiceManager ---------- */
  const LOCALES = { ar:['ar-IQ','ar-SA','ar-AE','ar-EG','ar'], en:['en-US','en-GB','en-AU','en'], tr:['tr-TR','tr'], ur:['ur-PK','ur-IN','ur'] };
  const RATE = { ar:0.85, en:0.9, tr:0.88, ur:0.85 };            // calm, clear pace per language
  const GOOD = /(natural|neural|online|premium|enhanced|siri|wavenet|studio)/i, BAD = /(espeak|compact|robot|novelty|whisper|bells|zarvox)/i;
  let cache = [];
  const loadVoices = () => { try{ cache = synth ? synth.getVoices() : []; }catch(e){ cache = []; } return cache; };
  if (synth){ loadVoices(); try{ synth.addEventListener('voiceschanged', loadVoices); }catch(e){ synth.onvoiceschanged = loadVoices; } }
  function score(v, lang){
    const loc = (v.lang || '').replace('_','-'), pref = LOCALES[lang] || [lang];
    let s = 0; const i = pref.findIndex(p => loc.toLowerCase() === p.toLowerCase()); s += i >= 0 ? 100 - i*10 : 40;   // exact locale first
    if (GOOD.test(v.name)) s += 40; if (/google/i.test(v.name)) s += 20; if (/microsoft/i.test(v.name)) s += 10;
    if (BAD.test(v.name)) s -= 60; if (v.default) s += 2;
    return s;
  }
  /** best installed voice for an app language (ar | en | tr | ur), or null — never a voice of another language */
  const voicesFor = lang => (cache.length ? cache : loadVoices()).filter(v => (v.lang || '').toLowerCase().replace('_','-').split('-')[0] === lang);
  /** the configured Sakeenah voice for a language, if this browser exposes it */
  function configuredVoice(lang){
    const id = lang === 'ar' ? (SK.config.ARABIC_SAKEENAH_VOICE || ARABIC_SAKEENAH_VOICE) : null; const want = parseVoiceId(id);
    if (!want) return null;
    return voicesFor(lang).find(v => (v.voiceURI || '').includes(want.name + 'Neural') || (new RegExp('\\b' + want.name + '\\b','i').test(v.name) && (v.lang || '').replace('_','-').toLowerCase() === want.locale.toLowerCase())) || null;
  }
  function getVoiceForLanguage(lang){
    const vs = voicesFor(lang);
    try{ const pref = localStorage.getItem('sakeenah:voice:' + lang); const pv = pref && vs.find(v => v.name === pref); if (pv) return pv; }catch(e){}   // a voice the user explicitly chose
    if (lang === 'ar' && (SK.config.ARABIC_SAKEENAH_VOICE || ARABIC_SAKEENAH_VOICE)){
      const cv = configuredVoice('ar'); if (cv) return cv;                     // Bassel when the device has it, otherwise the best Arabic voice below
    }
    if (!vs.length) return null;
    return vs.map(v => ({ v, s:score(v, lang) })).sort((a,b) => b.s - a.s)[0].v;
  }
  /** language of a text: Arabic script → ar (or ur when the UI is Urdu); otherwise the UI language */
  function langOfText(text, ui){
    const arab = (text.match(/[\u0600-\u06FF]/g) || []).length, latin = (text.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g) || []).length;
    if (arab > latin) return ui === 'ur' && /[ٹڈڑںےہۓ]/.test(text) ? 'ur' : (ui === 'ur' && !/[ةى]/.test(text) && /[یک]/.test(text) ? 'ur' : 'ar');
    return (ui === 'ar' || ui === 'ur') ? 'en' : ui;
  }
  const appLang = () => (SK.i18n ? SK.i18n.lang() : 'ar');

  /* ---------- playback state (shared audio bar) ---------- */
  const state = { token:0, cue:null, cueKey:null, cueListeners:new Set(), muted:false, paused:false, gapTimer:0, speaking:false, last:null, rateMul: (() => { try{ return parseFloat(localStorage.getItem('sakeenah:voiceRate')) || 1; }catch(e){ return 1; } })(), listeners:new Set(), audio:null };
  const emit = () => state.listeners.forEach(f => { try{ f(state); }catch(e){} });
  const setSpeaking = v => { state.speaking = v; emit(); };
  let notified = {};
  const notify = (key, vars) => { const msg = t(key, vars); if (notified[msg] && Date.now() - notified[msg] < 4000) return; notified[msg] = Date.now(); SK.toast && SK.toast(msg); };

  const SPOKEN_PBUH = { ar:'صلى الله عليه وسلم', en:', peace be upon him,', tr:', sallallahu aleyhi ve sellem,', ur:'صلی اللہ علیہ وسلم' };
  function clean(text, lang){
    return String(text).replace(/ﷺ/g, ' ' + (SPOKEN_PBUH[lang] || '') + ' ').replace(/[«»“”"()\[\]]/g, ' ').replace(/\s+[—–-]\s+/g, (lang === 'ar' || lang === 'ur') ? '، ' : ', ')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').replace(/\s+([,.!?:;،؛۔])/g, '$1').replace(/,\s*,/g, ',').trim();
  }
  const sentences = (text) => text.split(/(?<=[.!?؟؛:。])\s+/).map(x => x.trim()).filter(Boolean);   // pause between sentences; commas stay natural
  const MAXW = 9;
  function chunks(sentence){
    const words = sentence.split(/\s+/); if (words.length <= MAXW) return [sentence];
    const parts = sentence.split(/(?<=[،,;؛])\s+/).map(x => x.trim()).filter(Boolean), out = [];
    for (const p of parts){ const w = p.split(/\s+/); if (w.length <= MAXW){ out.push(p); continue; }
      const n = Math.ceil(w.length / MAXW), size = Math.ceil(w.length / n); for (let i = 0; i < w.length; i += size) out.push(w.slice(i, i+size).join(' ')); }
    return out;
  }
  const dirOf = l => (l === 'ar' || l === 'ur') ? 'rtl' : 'ltr';
  /** timestamps for a recording: [{start,end,text,lang,dir}]. Religious audio in another UI language shows the
      approved translation spread over the same speech span when one exists, otherwise the Arabic words being recited. */
  function cuesFor(key, ui, evidenceId){
    const base = (SK.data && SK.data.subtitleCues && SK.data.subtitleCues[key]) || null; if (!base || !base.length) return null;
    const ar = base.map(c => ({ ...c, lang:'ar', dir:'rtl' }));
    if (!evidenceId || ui === 'ar') return ar;
    const tr = SK.sources && SK.sources.translation(evidenceId, ui); if (!tr) return ar;
    const pieces = sentences(tr.text).flatMap(chunks), L = pieces.map(x => x.length), S = L.reduce((a,b)=>a+b,0);
    const t0 = base[0].start, t1 = base[base.length-1].end; let acc = 0;
    return pieces.map((x, i) => { const a = t0 + (t1-t0)*acc/S; acc += L[i]; return { start:a, end:t0 + (t1-t0)*acc/S, text:x, lang:ui, dir:dirOf(ui) }; });
  }
  function utter(text, lang){
    const voice = getVoiceForLanguage(lang);
    if (!voice){ notify('voice.unavailable', { lang: (SK.data && SK.data.languages.find(l => l.code === lang) || {native:lang}).native }); return null; }
    const u = new SpeechSynthesisUtterance(text); u.voice = voice; u.lang = voice.lang; u.rate = (RATE[lang] || 0.85) * state.rateMul; u.pitch = 1; u.volume = state.muted ? 0 : 1;
    return u;
  }
  /** queue parts in order. Each part: { text, lang? } narration, or { kind:'religious', evidenceId, text } */
  function play(parts, remember = true){
    stop(false);
    if (remember) state.last = parts;
    const queue = [];
    for (const p of parts.filter(Boolean)){
      if (p.kind === 'religious'){
        const rec = SK.services.religiousAudio && SK.services.religiousAudio.get(p.evidenceId);
        if (rec){ queue.push({ audio:rec, onStart:p.onStart, cues:cuesFor(p.evidenceId, appLang(), p.evidenceId) }); } else notify('voice.noRecording');
        continue;
      }
      if (!p.text) continue;
      { const lg = p.lang && p.lang.length === 2 ? p.lang : appLang(); const rec = p.audioKey && SK.services.narrationAudio && SK.services.narrationAudio.get(p.audioKey, lg);
        if (rec){ queue.push({ audio:rec, onStart:p.onStart, cues:cuesFor(p.audioKey + ':' + lg, lg, null) }); queue.push({ gap:200 }); continue; } }        // recorded narration wins over the device voice
      const code = p.lang && p.lang.length === 2 ? p.lang : (p.lang ? p.lang.split('-')[0] : langOfText(p.text, appLang()));
      if (!synth){ notify('voice.unsupported'); return false; }
      const parts2 = sentences(clean(p.text, code));
      parts2.forEach((sn, k) => { const cs = chunks(sn);
        cs.forEach((c, ci) => { const u = utter(c, code); if (!u) return; queue.push({ u, cue:{ text:c, lang:code, dir:dirOf(code) }, onStart: k === 0 && ci === 0 ? p.onStart : null }); queue.push({ gap: ci < cs.length-1 ? 40 : 260 }); }); });
    }
    if (!queue.length) return false;
    let i = 0; const token = ++state.token; setSpeaking(true);
    const next = () => { if (token !== state.token) return; if (i >= queue.length){ setSpeaking(false); return; } const q = queue[i++];
      if (q.gap){ if (q.gap > 100) cue(null); state.gapTimer = setTimeout(next, q.gap / state.rateMul); return; }
      if (q.onStart) try{ q.onStart(); }catch(e){}
      if (q.u){ q.u.onend = next; q.u.onerror = next; cue(q.cue); synth.speak(q.u); }
      else { const a = state.audio = new Audio(q.audio); a.playbackRate = state.rateMul; a.muted = state.muted; a.onended = () => { cue(null); next(); }; a.onerror = next;
        if (q.cues){ const loop = () => { if (token !== state.token || state.audio !== a) return; const t = a.currentTime;
            cue(q.cues.find(c => t >= c.start && t < c.end) || null); if (!a.ended) requestAnimationFrame(loop); }; a.addEventListener('playing', () => requestAnimationFrame(loop)); }
        a.play().catch(next); } };
    setTimeout(next, 80);
    return true;
  }
  function cue(c){ const k = c ? c.text : null; if (state.cueKey === k) return; state.cueKey = k; state.cue = c; state.cueListeners.forEach(f => { try{ f(c); }catch(e){} }); }
  function stop(clear = true){ state.token = (state.token||0) + 1; clearTimeout(state.gapTimer); state.paused = false; try{ synth && synth.resume && synth.resume(); }catch(e){} cue(null); try{ synth && synth.cancel(); }catch(e){} if (state.audio){ try{ state.audio.pause(); }catch(e){} state.audio = null; } if (clear) setSpeaking(false); else state.speaking = false; }

  SK.services.voice = { LOCALES, RATE, getVoiceForLanguage, configuredVoice, langOfText, loadVoices, voicesFor, clean, sentences,
    setFallback(lang, on){ try{ localStorage.setItem('sakeenah:voiceFallback:' + lang, on ? '1' : '0'); }catch(e){} }, allowFallback,
    setPreferred(lang, name){ try{ localStorage.setItem('sakeenah:voice:' + lang, name); }catch(e){} },
    preview(lang, name){ const v = voicesFor(lang).find(x => x.name === name); if (!v || !synth) return; synth.cancel(); const u = new SpeechSynthesisUtterance(SK.t('voice.sample')); u.voice = v; u.lang = v.lang; u.rate = (RATE[lang]||0.85) * state.rateMul; synth.speak(u); },
    report(){ const o = {}; ['ar','en','tr','ur'].forEach(l => { const v = getVoiceForLanguage(l); o[l] = v ? `${v.name} (${v.lang})` : null; }); return o; } };
  SK.services.religiousAudio = SK.services.religiousAudio || {   // replaced by data/narrationAudio.js when loaded
    _map:{}, get(id){ return this._map[id] || null; }, register(id, src){ this._map[id] = src; } };

  SK.services.speech = {
    canListen: !!SR,
    listen({lang, onText, onEnd, onError, continuous=false}){
      lang = lang || (SK.i18n ? SK.i18n.LANGS[SK.i18n.lang()].speech : 'ar-SA');
      if (!SR){ onError && onError('unsupported'); return null; }
      try{
        const r = new SR(); r.lang = lang; r.interimResults = true; r.continuous = !!continuous;
        r.onresult = e => { let s=''; for (const res of e.results) s += res[0].transcript; onText && onText(s); };
        r.onerror = e => onError && onError(e.error||'error'); r.onend = () => onEnd && onEnd(); r.start(); return r;
      }catch(e){ onError && onError('error'); return null; }
    },
    /** narration in the language of the text (old callers pass a BCP-47 code; it is honoured) */
    speak(text, lang){ return play([{ text, lang }]); },
    speakParts(parts){ return play(parts); },
    /** religious text: approved recording only */
    speakReligious(evidenceId, text){ return play([{ kind:'religious', evidenceId, text }]); },
    stop(){ stop(true); },
    /** pause/resume keep the current subtitle in place */
    pause(){ if (!state.speaking) return; state.paused = true; try{ synth && synth.pause(); }catch(e){} if (state.audio) try{ state.audio.pause(); }catch(e){} },
    resume(){ if (!state.paused) return; state.paused = false; try{ synth && synth.resume(); }catch(e){} if (state.audio && !state.audio.ended) state.audio.play().catch(()=>{}); },
    get paused(){ return state.paused; },
    setMuted(m){ state.muted = !!m; if (state.audio) state.audio.muted = state.muted; },
    onCue(f){ state.cueListeners.add(f); f(state.cue); return () => state.cueListeners.delete(f); },
    replay(){ return state.last ? play(state.last, false) : false; },
    /** absolute speaking rate (default ≈ 0.85); per-language fine-tuning keeps its ratio */
    setRate(rate){ const r = Math.max(0.5, Math.min(1.3, Number(rate) || 0.85)); state.rateMul = Math.round((r / 0.85) * 100) / 100; try{ localStorage.setItem('sakeenah:voiceRate', String(state.rateMul)); }catch(e){} emit(); if (state.speaking) this.replay(); return r; },
    getRate(){ return Math.round(0.85 * state.rateMul * 100) / 100; },
    slower(){ state.rateMul = state.rateMul === 1 ? 0.8 : state.rateMul === 0.8 ? 0.65 : 1; try{ localStorage.setItem('sakeenah:voiceRate', String(state.rateMul)); }catch(e){} emit(); if (state.speaking) this.replay(); return state.rateMul; },
    isSpeaking(){ try{ return state.speaking || (synth && synth.speaking) || (state.audio && !state.audio.paused); }catch(e){ return false; } },
    onChange(f){ state.listeners.add(f); return () => state.listeners.delete(f); },
    get rate(){ return state.rateMul; }
  };
})(window.SK);
