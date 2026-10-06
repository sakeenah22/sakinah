/* Minimal router with history and smooth screen transitions */
(function(SK){
  const root = () => document.getElementById('app');
  const NO_NAV = new Set(['start','lang','path','pre','analyzing','insight','explain','check','entry','create','scan','welcome','devtests','ask','haram','haramTopics','haramHelp','haramLearn','haramDone','haramQuiz','demo','post','ready']);
  function paint(dir){
    if (SK.stopCam) SK.stopCam();
    if (SK.services.repeatAfterMe) SK.services.repeatAfterMe.cancelAll();   // leaving a step: stop the microphone, ignore late results
    const st = SK.store.get(); const fn = SK.screens[st.route] || SK.screens.start;
    const node = fn(); node.classList.add('enter', dir==='back'?'from-left':'from-right');
    const wrap = root(); wrap.replaceChildren(node);
    if (!NO_NAV.has(st.route)) wrap.append(SK.ui.bottomNav(fn.nav || (st.route==='journey'?'journey':'home')));
    const d = document.getElementById('sheet'); if (d && d.open) d.close();
    if (SK.i18n) SK.i18n.apply();
    if (st.route !== 'demo' && SK.demoStop) SK.demoStop();
    if (SK.services.speech && paint.lastRoute !== st.route){ SK.services.speech.stop(); paint.lastRoute = st.route; }   // leaving a screen stops its audio and subtitles
    if (SK.guide) SK.guide.mount(st.route);
    document.documentElement.classList.toggle('haram-simple', !!(st.haram && st.haram.simple) && /^haram/.test(st.route));
    requestAnimationFrame(()=>node.classList.remove('enter'));
    const t = node.querySelector('h1'); if (t){ t.setAttribute('tabindex','-1'); t.focus({preventScroll:true}); }
    window.scrollTo({top:0, behavior: SK.reducedMotion()?'auto':'smooth'});
  }
  SK.router = {
    go(route, {replace=false, reset=false}={}){ const st = SK.store.get();
      if (reset) st.history = []; else if (!replace) st.history.push(st.route);
      st.route = route; paint('fwd'); },
    back(){ const st = SK.store.get(); st.route = st.history.pop() || 'start'; paint('back'); },
    start(){ if (location.hash === '#dev') SK.store.get().route = 'devtests'; paint('fwd'); }
  };
})(window.SK);
