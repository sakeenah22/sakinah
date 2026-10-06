/* سكينة | Sakeenah — core: namespace, tiny DOM helper, store */
window.SK = window.SK || { data:{}, services:{}, ui:{}, screens:{} };
(function(SK){
  /** h(tag, attrs, ...children) — small hyperscript helper; null/false children are skipped */
  SK.h = function h(tag, attrs, ...kids){
    const el = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs||{})){
      if (v===false || v==null) continue;
      if (k==='class') el.className = v;
      else if (k==='html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v===true ? '' : v);
    }
    for (const c of kids.flat(Infinity)){
      if (c==null || c===false) continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  };
  /** Store: one in-memory state object with subscribers. Persistence plugs in later (Sakeenah card). */
  const state = {
    lang:'ar', route:'start', history:[], session:null, cardInfo:null,
    journey:{ answer:'', analysis:null, queue:[], step:0, corrected:[], results:{}, usedQ:{}, postAnswers:{}, before:null, after:null, stage:'idle' }
  };
  const subs = new Set();
  SK.store = {
    get: () => state,
    set(patch){ Object.assign(state, patch); subs.forEach(fn=>fn(state)); },
    journey(patch){ Object.assign(state.journey, patch); subs.forEach(fn=>fn(state)); },
    resetJourney(){ state.journey = { answer:'', analysis:null, queue:[], step:0, corrected:[], results:{}, usedQ:{}, postAnswers:{}, before:null, after:null, stage:'idle' }; },
    subscribe(fn){ subs.add(fn); return ()=>subs.delete(fn); }
  };
  /** short, polite confirmation message */
  SK.toast = (msg) => { let t = document.getElementById('toast'); if (!t){ t = SK.h('div',{id:'toast', class:'toast', role:'status', 'aria-live':'polite'}); document.body.append(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), 3200); };
  SK.reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})(window.SK);
