/* «اسأل سكينة» — source-grounded assistant UI (not a general chatbot). */
(function(SK){
  const t = (k,v) => SK.t(k,v);
  const h = SK.h, ui = SK.ui, I = SK.ui.icons, S = SK.screens;
  const SUGGEST = () => ['sg.countQ','sg.howPray','ask.sugFatiha','ask.sugDua','ask.sugAfter2','ask.sugAfter3'].map(k => t(k));
  const history = [];   // kept for this visit only

  const isDemo = () => { try{ return localStorage.getItem('sk:demo') === '1'; }catch(e){ return false; } };
  function sourceCard(items){
    const ev = SK.services.knowledgeService.evidenceOf(items), R = SK.sources;
    return ui.card('src-card', h('h3',{class:'src-card-title'}, ui.svg(I.book), ev.length > 1 ? t('src.sourcesN',{n:ev.length}) : t('src.sheetTitle')),
      ...ev.map(e => h('div',{class:'src-item'}, h('p',{class:'src-name'}, R.sourceName(e)), h('p',{class:'src-ref'}, R.reference(e)))),
      h('button',{class:'chip-btn src-open', onclick:()=>SK.ui.evidenceSheet({ evidence:ev, translation:null })}, ui.svg(I.book), t('common.source')));
  }
  function evidenceBadge(res, items){
    const d = h('details',{class:'ev-badge'}, h('summary',{}, ui.svg(I.check), t('ask.linked')),
      ...items.map(it => h('dl',{class:'source-dl'},
        isDemo() ? h('dt',{}, 'Knowledge ID') : null, isDemo() ? h('dd',{dir:'ltr', class:'mono'}, it.id) : null,
        h('dt',{}, t('common.source')), h('dd',{}, SK.services.knowledgeService.evidenceOf([it]).map(e => SK.sources.sourceName(e) + ' — ' + SK.sources.reference(e)).join(' · ')),
        h('dt',{}, t('ask.passage')), h('dd',{}, h('span',{class:'passage', lang:'ar'}, it.passage || it.content)),
        h('dt',{}, t('ask.verify')), h('dd',{}, t('src.verifiedInSakeenah')))),
      isDemo() ? h('p',{class:'muted small', dir:'ltr'}, `evidenceStatus: ${res.evidenceStatus} · ${res.reason}`) : null);
    return d;
  }
  function answerNode(res){
    const speak = text => h('button',{class:'chip-btn', onclick:()=>SK.services.speech.speak(text)}, ui.svg(I.speaker), t('common.listen'));
    if (res.evidenceStatus === 'SUPPORTED'){
      const a = res.answer; const items = a.citations;
      const body = a.points
        ? h('div',{}, h('p',{class:'ans-intro'}, a.intro), h('ol',{class:'ans-points'}, a.points.map(p => h('li',{}, p.text))), a.gapNote ? h('p',{class:'gap-note'}, a.gapNote) : null)
        : h('p',{class:'ans-text'}, a.text);
      const plain = a.points ? [a.intro, ...a.points.map(p=>p.text), a.gapNote].join(' ') : a.text;
      return h('div',{class:'msg-bot'}, ui.card('ans', body, h('div',{class:'ans-foot'}, evidenceBadge(res, items), speak(plain))), sourceCard(items));
    }
    const [l1, l2] = res.message;
    return h('div',{class:'msg-bot'}, ui.card(res.evidenceStatus==='CONFLICTING' ? 'attention' : 'nosource',
      h('p',{class:'refuse-1'}, l1), h('p',{class:'muted'}, l2),
      h('details',{class:'ev-badge'}, h('summary',{}, t('ask.whyNot')),
        h('p',{class:'muted small'}, res.evidenceStatus==='CONFLICTING' ? t('ask.conflict')
          : res.blocked ? t('ask.blocked') : t('ask.noMatch')),
        isDemo() ? h('p',{class:'muted small', dir:'ltr'}, `evidenceStatus: ${res.evidenceStatus} · ${res.reason}${res.blocked ? ' · blocked: '+res.blocked : ''}`) : null)));
  }

  S.ask = () => {
    const thread = h('div',{class:'thread', 'aria-live':'polite'});
    const render = () => thread.replaceChildren(...history.flatMap(m => [ h('div',{class:'msg-me'}, h('p',{}, m.q)), answerNode(m.res) ]));
    const input = h('textarea',{class:'ask-input', rows:'2', placeholder:t('ask.placeholder'), 'aria-label':t('ask.inputLabel')});
    const send = (q) => { const text = (q ?? input.value).trim(); if (!text) return; input.value = '';
      history.push({ q:text, res: SK.services.assistantService.ask(text) }); render(); requestAnimationFrame(()=>thread.lastElementChild && thread.lastElementChild.scrollIntoView({behavior: SK.reducedMotion()?'auto':'smooth', block:'start'})); };
    input.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } });
    const status = h('p',{class:'hint', 'aria-live':'polite'});
    let rec = null;
    const mic = h('button',{class:'ask-mic', 'aria-label':t('ask.mic')}, ui.svg(I.mic));
    mic.onclick = () => { if (!SK.services.speech.canListen){ status.textContent=t('ask.noMic'); return; }
      if (rec){ rec.stop(); return; } mic.classList.add('is-listening'); status.textContent=t('common.listening');
      rec = SK.services.speech.listen({ onText:t=>{ input.value=t; }, onEnd:()=>{ rec=null; mic.classList.remove('is-listening'); status.textContent=''; if (input.value.trim()) send(); }, onError:()=>{ status.textContent=t('gd.voiceFail'); } }); };
    const chips = h('div',{class:'suggest'}, SUGGEST().map(s => h('button',{class:'suggest-chip', onclick:()=>send(s)}, s)));
    setTimeout(render, 0);
    return ui.screen({ eyebrow:t('ask.eyebrow'), title:t('ask.title'),
      body:[ h('p',{class:'muted'}, t('ask.intro')), chips, thread ],
      footer:[ h('div',{class:'composer'}, input, mic, h('button',{class:'ask-send', 'aria-label':t('common.send'), onclick:()=>send()}, '➤')), status ] });
  };
})(window.SK);
