/* ===================== Screenshot / Demo routes (presentation only) =====================
   Open e.g.  sakeenah.html#demo/results  to land on a ready-to-capture screen.
   Production flow is untouched: these routes only run when the URL hash starts with #demo/.
   DEMO_DATA below is ILLUSTRATIVE sample state for screenshots — not study results. */
(function(SK){
  const DEMO_DATA = {
    note: 'بيانات تجريبية للتصوير فقط — ليست نتائج دراسة',
    before: 40, after: 80,                                         // sample percentages for the results screenshot
    mastered: ['first_takbir','fourth_takbir'], corrected: ['second_takbir','takbir_count','posture_standing'], review: ['third_takbir'],
    guideQuestion: { ar:'هل يوجد ركوع في صلاة الجنازة؟', en:'Is there bowing in the funeral prayer?', tr:'Cenaze namazında rükû var mı?', ur:'کیا نمازِ جنازہ میں رکوع ہے؟' }
  };
  const go = (r, o) => SK.router.go(r, o);
  const quiet = () => { try{ localStorage.removeItem('sk:demo'); }catch(e){} SK.services.speech && SK.services.speech.stop(); document.querySelectorAll('dialog[open]').forEach(d => d.close()); };
  const wrongOf = qid => { const q = SK.data.question(qid); const o = q && q.options.find(x => !x[1]); return o ? o[0] : ''; };
  const analysis = () => { const U = SK.services.understanding;
    const res = { intent:'answer', method:'mcq', mastered:DEMO_DATA.mastered.slice(), confused:[{ concept_id:'third_takbir', user_claim:wrongOf('Q-JAN-003a') }, { concept_id:'second_takbir', user_claim:wrongOf('Q-JAN-004a') }],
      missing:['takbir_count','posture_standing'], out_of_scope:[], no_source:[], evidence:[], priority_concepts:['third_takbir','second_takbir','takbir_count','posture_standing'] };
    res.score = U.computeScore(res); res.engine_version = U.ENGINE_VERSION; return res; };
  const SETUP = {
    home(){ SK.signOut(); go('start',{ reset:true }); },
    language(){ go('start',{ reset:true }); SK.store.set({ afterLang:'path' }); go('lang'); },
    mode(){ go('start',{ reset:true }); go('path'); },
    pretest(){ SK.store.resetJourney(); go('worship',{ reset:true }); go('pre'); },
    // DEMO DATA: a pre-test where no point was known yet (all "I don't know") -> Sakeenah chooses the full path
    'full-path'(){ SK.store.resetJourney(); const U = SK.services.understanding;
      const a = { intent:'unknown', method:'mcq', mastered:[], confused:[], missing:SK.services.plan.FULL_ORDER.slice(), out_of_scope:[], no_source:[], evidence:[], priority_concepts:SK.services.plan.FULL_ORDER.slice(), demoData:true };
      a.score = U.computeScore(a); a.engine_version = U.ENGINE_VERSION;
      const plan = SK.services.plan.fullPath();
      SK.store.journey({ analysis:a, plan, fullPath:true, queue:plan.map(p=>p.concept_id), step:0, corrected:[], results:{}, usedQ:{}, before:a.score, stage:'insight', demoData:true });
      go('worship',{ reset:true }); go('insight'); },
    learning(){ SK.store.resetJourney(); const a = analysis(); const plan = SK.services.plan.build(a, 99);
      SK.store.journey({ analysis:a, plan, queue:plan.map(p=>p.concept_id), step:0, results:{}, usedQ:{}, before:a.score, stage:'explain' }); go('worship',{ reset:true }); go('explain'); },
    video(){ if (SK.haram) SK.haram.state().topic = 'janaza'; SK.store.get().demo = { i:2, mode:'step', sound:true, cc:true, raiseAll:true, salamBoth:false };
      go('worship',{ reset:true }); go('demo');
      setTimeout(() => { const v = document.querySelector('.demo-video'); if (v){ const seek = () => { v.currentTime = 4.55; }; v.readyState >= 1 ? seek() : v.addEventListener('loadedmetadata', seek, { once:true }); } }, 200); },
    'quick-learning'(){ if (SK.haram) SK.haram.state().topic = 'janaza'; go('worship',{ reset:true }); go('haramTopics'); go('haramHelp'); },
    guide(){ go('worship',{ reset:true }); setTimeout(() => { SK.guide.open(); setTimeout(() => {
        const inp = document.querySelector('.g-input'), btn = document.querySelector('.g-send'); if (!inp || !btn) return;
        inp.value = DEMO_DATA.guideQuestion[SK.i18n.lang()] || DEMO_DATA.guideQuestion.ar; inp.dispatchEvent(new Event('input')); btn.click(); }, 250); }, 150); },
    results(){ SK.store.resetJourney(); const a = analysis();
      const results = {}; DEMO_DATA.corrected.forEach(id => results[id] = 'first');
      SK.store.journey({ analysis:{ ...a, score:DEMO_DATA.before }, plan:[], results, corrected:Object.keys(results), needsReview:DEMO_DATA.review.slice(),
        before:DEMO_DATA.before, after:DEMO_DATA.after, stage:'done', demoData:true }); go('worship',{ reset:true }); go('result'); },
    card(){ const P = SK.services.profiles;
      if (!SK.store.get().session){ const r = P.create({ name:'' }); SK.store.set({ session: P.resolve(r.qr).session }); SK.store.set({ cardInfo:{ qr:r.qr, code:r.code, name:r.displayName } }); }
      // sample saved progress for the screenshot (DEMO_DATA), stored through the normal progress service
      SK.store.resetJourney(); const a = analysis(); const plan = SK.services.plan.build(a, 99);
      SK.store.journey({ analysis:a, plan, queue:plan.map(p=>p.concept_id), step:1, results:{ third_takbir:'first' }, usedQ:{}, before:a.score, stage:'explain' });
      try{ SK.services.progress.persist(); }catch(e){}
      go('worship',{ reset:true }); go('mycard'); }
  };
  function run(){ const m = /^#demo\/([\w-]+)(?:\?lang=(\w\w))?/.exec(location.hash || ''); if (!m || !SETUP[m[1]]) return;
    quiet(); if (m[2] && SK.i18n.LANGS[m[2]]) SK.i18n.setLang(m[2]); SETUP[m[1]](); }
  /* presentation mode: compact layout so each screen fits one phone screen (for recording the demo video).
     On:  add #present to the URL, or the developer screen switch. Off: #present=off. Content is never changed. */
  const PRESENT_KEY = 'sakeenah:present';
  const isPresent = () => { try{ return localStorage.getItem(PRESENT_KEY) === '1'; }catch(e){ return false; } };
  function setPresent(on){ try{ localStorage.setItem(PRESENT_KEY, on ? '1' : '0'); }catch(e){} document.documentElement.classList.toggle('present', !!on); }
  const CLAMP = '.recite-text, .qc-recite';
  function decorate(root = document){ if (!isPresent()) return;
    root.querySelectorAll(CLAMP).forEach(el => { if (el.dataset.clamp) return; el.dataset.clamp = '1'; el.classList.add('clampable');
      requestAnimationFrame(() => { if (el.scrollHeight <= el.clientHeight + 4) return;
        const more = document.createElement('button'); more.type = 'button'; more.className = 'clamp-more'; more.textContent = SK.t('pres.more');
        const toggle = () => { const open = el.classList.toggle('is-open'); more.textContent = SK.t(open ? 'pres.less' : 'pres.more'); };
        more.onclick = toggle; el.addEventListener('click', toggle); el.after(more); }); }); }
  new MutationObserver(() => decorate()).observe(document.documentElement, { childList:true, subtree:true });
  const fromHash = () => { const h = location.hash || ''; if (/#present=off/.test(h)) setPresent(false); else if (/#present/.test(h) || /^#demo\//.test(h)) setPresent(true); else setPresent(isPresent()); };
  fromHash(); window.addEventListener('hashchange', fromHash);
  SK.presentation = { on:()=>setPresent(true), off:()=>setPresent(false), isOn:isPresent };
  SK.demoRoutes = { DEMO_DATA, list:Object.keys(SETUP), run };
  window.addEventListener('hashchange', run);
  document.addEventListener('DOMContentLoaded', () => setTimeout(run, 60));
  if (document.readyState !== 'loading') setTimeout(run, 60);
})(window.SK);
