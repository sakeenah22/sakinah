/* Reusable UI components */
(function(SK){
  const t = (k,v) => SK.t(k,v);
  const h = SK.h;
  const I = SK.ui.icons = {
    play:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/></svg>',
    pause:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.5" y="4.5" width="3.8" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="13.7" y="4.5" width="3.8" height="15" rx="1" fill="currentColor" stroke="none"/></svg>',
    replay:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/></svg>',
    prev:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 20 9 12l10-8z"/><path d="M5 19V5"/></svg>',
    next:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/></svg>',
    volume:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
    captions:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M7 15h4M13 15h4M7 11h2M11 11h6"/></svg>',
    slow:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 14l3.5-3.5"/><path d="M3.3 15a9 9 0 1 1 17.4 0"/><path d="M12 6v1.5M6.3 8.3l1 1M17.7 8.3l-1 1"/></svg>',
    settings:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    film:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
    leaf:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/></svg>',
    steps:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0Z"/></svg>',
    close:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    globe:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    qr:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
    mic:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    keyboard:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>',
    check:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    alert:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></svg>',
    bookOpen:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4.5h6a4 4 0 0 1 4 4V20a3 3 0 0 0-3-3H2z"/><path d="M22 4.5h-6a4 4 0 0 0-4 4V20a3 3 0 0 1 3-3h7z"/></svg>',
    book:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/></svg>',
    home:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z"/></svg>',
    path:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/></svg>',
    card:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><rect x="6" y="8.5" width="5" height="5" rx="1"/><path d="M14 9h4M14 12h3"/></svg>',
    speaker:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    bolt:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/></svg>',
    back:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
  };
  const svg = s => h('span',{class:'ico', html:s});
  SK.ui.svg = svg;

  SK.ui.button = (label, {variant='primary', onclick, icon, disabled, type='button', attrs={}}={}) =>
    h('button',{class:'btn btn-'+variant, type, onclick, disabled, ...attrs}, icon?svg(I[icon]):null, h('span',{},label));

  SK.ui.card = (cls, ...kids) => h('div',{class:'card '+(cls||'')}, ...kids);

  /** screen frame: optional back button + title, content, sticky footer */
  SK.ui.screen = ({title, back=true, eyebrow, body=[], footer=[]}) => h('section',{class:'screen', 'aria-labelledby':'screen-title'},
    h('header',{class:'screen-head'},
      back ? h('button',{class:'icon-btn', 'aria-label':t('common.back'), onclick:()=>SK.router.back()}, svg(I.back)) : h('span',{class:'icon-spacer'}),
      eyebrow ? h('span',{class:'eyebrow'}, eyebrow) : null),
    title ? h('h1',{id:'screen-title', class:'screen-title'}, title) : null,
    h('div',{class:'screen-body'}, ...body),
    footer.length ? h('div',{class:'screen-foot'}, ...footer) : null);

  /** big selectable option list (radio group) */
  SK.ui.options = (items, {onPick}) => {
    const group = h('div',{class:'options', role:'radiogroup'});
    items.forEach(it => {
      const b = h('button',{class:'option', role:'radio', 'aria-checked':'false', 'data-id':it.id},
        h('span',{class:'option-dot', 'aria-hidden':'true'}), h('span',{class:'option-text'}, it.text));
      b.addEventListener('click', () => { group.querySelectorAll('.option').forEach(x=>x.setAttribute('aria-checked','false')); b.setAttribute('aria-checked','true'); onPick && onPick(it, b); });
      group.append(b);
    });
    return group;
  };

  /** bottom sheet */
  SK.ui.sheet = (title, ...kids) => {
    let d = document.getElementById('sheet');
    if (!d){ d = h('dialog',{id:'sheet', class:'sheet'}); document.body.append(d); d.addEventListener('click', e => { if (e.target===d) d.close(); }); }
    if (SK.services.repeatAfterMe) SK.services.repeatAfterMe.cancelAll();
    if (!d.dataset.rpBound){ d.dataset.rpBound = '1'; d.addEventListener('close', () => SK.services.repeatAfterMe && SK.services.repeatAfterMe.cancelAll()); }
    d.replaceChildren(h('div',{class:'sheet-grip', 'aria-hidden':'true'}), h('div',{class:'sheet-head'}, h('h2',{}, title), h('button',{class:'icon-btn', 'aria-label':t('common.close'), onclick:()=>d.close()}, '✕')), ...kids);
    d.showModal();
  };

  /** bottom navigation: Home / My journey / My card */
  SK.ui.bottomNav = (active) => {
    const item = (id, label, icon, route) => h('button',{class:'nav-item'+(active===id?' is-active':''), 'aria-current':active===id?'page':false, onclick:()=>SK.router.go(route,{reset:true})}, svg(I[icon]), h('span',{}, label));
    return h('nav',{class:'bottom-nav', 'aria-label':t('common.navigation')}, item('home',t('common.home'),'home','worship'), item('journey',t('common.myJourney'),'path','journey'), item('card',t('common.myCard'),'card','card'));
  };

  /** original Arabic religious text (never machine-translated); labelled «Arabic original» outside the Arabic UI */
  SK.ui.arabic = (text, cls='', tag='p') => {
    const el = h(tag,{class:cls+' ar-text', lang:'ar', dir:'rtl'}, text);
    if (SK.i18n && SK.i18n.lang() !== 'ar') return h('div',{class:'ar-wrap'}, el, h('span',{class:'ar-orig'}, SK.t('common.arabicOriginal')));
    return el;
  };
  /** «المصدر» sheet — the ONE source view used everywhere (learning, quick learning, guide, video, «ردّد معي»).
      Shows only evidence that is verified in TrustedSourcesRegistry with a checked link; anything else is never shown as a source. */
  SK.ui.evidenceSheet = (g) => { const R = SK.sources, lang = SK.i18n.lang(), dir = SK.i18n.dir(), T = k => SK.t(k);
    const ev = R.shownEvidence((g && g.evidence) || []).filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);
    const excerpt = txt => { const s = String(txt || ''); if (s.length <= 220) return s; const cut = s.slice(0, 220); return cut.slice(0, cut.lastIndexOf(' ')) + ' …'; };
    const row = (label, value, ar) => value ? h('div',{class:'srcx-row'}, h('dt',{}, label), h('dd',{lang: ar ? 'ar' : null, dir: ar ? 'rtl' : null}, value)) : null;
    const isHadith = e => /hadith/.test(e.sourceType || '');
    const card = (e, i) => h('article',{class:'srcx-card', 'data-evidence':e.id},
      ev.length > 1 ? h('span',{class:'srcx-num'}, String(i + 1)) : null,
      h('h3',{class:'srcx-title'}, R.supports(e)),
      h('dl',{class:'srcx-dl'},
        row(T('src.f.name'), R.sourceName(e)),
        row(T('src.f.ref'), R.reference(e), lang === 'ar'),
        isHadith(e) && e.narrator ? row(T('src.f.narrator'), e.narrator, true) : null,
        isHadith(e) && e.number ? row(T('src.f.number'), e.number) : null,
        isHadith(e) && e.grade ? row(T('src.f.grade'), e.grade, true) : null,
        e.gradeNote ? row('', lang === 'ar' ? e.gradeNote : T('src.gradeNote')) : null),
      h('p',{class:'srcx-label'}, T('src.f.evidence')),
      e.language === 'ar' ? SK.ui.arabic('«' + excerpt(e.evidenceText) + '»', 'passage srcx-passage') : h('p',{class:'passage srcx-passage', lang:e.language, dir:'ltr'}, '“' + excerpt(e.evidenceText) + '”'),
      h('a',{class:'srcx-open', href:e.sourceUrl, target:'_blank', rel:'noopener noreferrer'}, h('span',{'aria-hidden':'true'}, '🔗'), T('src.openOriginal')));
    const items = ev.map(card);
    if (g && g.translation && g.translation.url) items.push(h('article',{class:'srcx-card is-translation'},
      h('h3',{class:'srcx-title'}, T('src.translationSource')), h('dl',{class:'srcx-dl'}, row(T('src.f.name'), g.translation.translator)),
      h('a',{class:'srcx-open', href:g.translation.url, target:'_blank', rel:'noopener noreferrer'}, h('span',{'aria-hidden':'true'}, '🔗'), T('src.openOriginal'))));
    const body = ev.length ? items : [h('p',{class:'srcx-none'}, R.REFUSAL)];
    return SK.ui.sheet(ev.length > 1 ? SK.t('src.sourcesN', { n:ev.length }) : T('src.sheetTitle'),
      h('div',{class:'srcx', dir}, ...body, ev.length ? h('p',{class:'srcx-foot'}, SK.ui.svg(I.check), T('src.verifiedInSakeenah')) : null)); };
  /** the funeral-prayer steps — ONE component for every language; content from TrustedSourcesRegistry */
  SK.ui.stepCards = (topic, { openFirst = true } = {}) => {
    const R = SK.sources, lang = SK.i18n.lang(), L = SK.i18n.LANGS[lang], uiDir = L.dir;
    const list = h('ol',{class:'quick-list step-cards'});
    const steps = R.steps(topic);
    const open = k => list.querySelectorAll('.quick-card').forEach((c,j) => { const on = j === k && !c.classList.contains('is-open'); c.classList.toggle('is-open', on); c.querySelector('.qc-head').setAttribute('aria-expanded', String(on)); c.querySelector('.qc-detail').hidden = !on; });
    const txt = (s, cls) => h('p',{class:cls, lang, dir:uiDir}, s);
    steps.forEach((g, i) => {
      if (!g.ok){ list.append(h('li',{class:'quick-card'}, h('span',{class:'quick-num'}, String(i+1)), h('span',{}, h('small',{}, g.message)))); return; }
      const f = g.fact;
      const directive = R.text(f, 'directive'), detailText = R.text(f, 'detail'), note = f.note ? R.text(f, 'note') : null;
      // listen: the instruction in the interface language, then the prayer text in Arabic
      const speakAll = () => SK.services.speech.speakParts([{ text:detailText, lang, audioKey:f.id }, f.recitationText ? { kind:'religious', evidenceId:f.recitation, text:f.recitationText } : null]);
      const meaning = f.recitationText && lang !== 'ar'
        ? (g.translation ? h('div',{class:'qc-meaning'}, h('span',{class:'qc-meaning-label'}, SK.t('src.approvedMeaning')), txt(g.translation.text, 'qc-meaning-text'), h('span',{class:'qc-meaning-src'}, g.translation.translator))
                         : h('p',{class:'qc-no-tr'}, SK.t('src.noApprovedTranslation')))
        : null;
      const detail = h('div',{class:'qc-detail', hidden:true},
        lang === 'ar' ? SK.ui.arabic(detailText, 'qc-detail-text') : txt(detailText, 'qc-detail-text'),
        f.recitationText ? SK.ui.arabic(f.recitationText, 'qc-recite') : null,
        meaning,
        note ? h('p',{class:'qc-note', lang, dir:uiDir}, note) : null,
        f.recitationText && SK.ui.RepeatAfterMe ? SK.ui.RepeatAfterMe({ expectedText:f.recitationText, audio:f.recitation, language:'ar', compact:true, context:'quick-learning' }) : null,
        h('div',{class:'qc-tools'},
          h('button',{class:'ql-act', onclick:speakAll}, SK.ui.svg(I.volume), h('span',{}, SK.t('common.listen'))),
          h('button',{class:'ql-act', onclick:()=>SK.ui.evidenceSheet(g)}, SK.ui.svg(I.book), h('span',{}, SK.t('common.showSource'))),
          i < steps.length-1 ? h('button',{class:'qc-next', onclick:()=>{ open(i+1); const n = list.children[i+1]; if (n) n.scrollIntoView({behavior: SK.reducedMotion()?'auto':'smooth', block:'nearest'}); }}, SK.t('common.next') + ' ' + (i+2) + (uiDir==='rtl' ? ' ←' : ' →')) : null));
      const head = h('button',{class:'qc-head', 'aria-expanded':'false', onclick:()=>open(i)},
        h('span',{class:'quick-num'}, String(i+1)), h('span',{class:'qc-text'}, h('b',{}, SK.t(f.titleKey)), h('small',{class:'qc-directive', lang, dir:uiDir}, directive)), h('span',{class:'qc-chev', 'aria-hidden':'true'}, '⌄'));
      list.append(h('li',{class:'quick-card qc', style:`--i:${i}`}, head, detail));
    });
    if (openFirst && steps[0] && steps[0].ok) open(0);
    return list;
  };
  /** one audio bar for the whole app: appears while Sakeenah is speaking */
  SK.ui.mountAudioBar = () => {
    if (document.getElementById('audio-bar')) return;
    const S = SK.services.speech;
    const rateLbl = h('small',{});
    const bar = h('div',{id:'audio-bar', class:'audio-bar', role:'region', 'aria-label':SK.t('voice.player'), hidden:true},
      h('span',{class:'ab-wave', 'aria-hidden':'true'}, h('i'), h('i'), h('i')),
      h('button',{class:'ab-btn', onclick:()=>S.stop()}, SK.ui.svg(I.pause), h('span',{'data-k':'voice.stop'}, SK.t('voice.stop'))),
      h('button',{class:'ab-btn', onclick:()=>S.replay()}, SK.ui.svg(I.replay), h('span',{'data-k':'voice.replay'}, SK.t('voice.replay'))),
      h('button',{class:'ab-btn', onclick:()=>{ S.slower(); }}, SK.ui.svg(I.slow), h('span',{'data-k':'voice.slower'}, SK.t('voice.slower')), rateLbl),
      h('button',{class:'ab-btn', 'aria-label':SK.t('voice.settings'), onclick:()=>SK.ui.voiceSettings()}, SK.ui.svg(I.settings)));
    const sync = st => { bar.hidden = !st.speaking; rateLbl.textContent = st.rateMul === 1 ? '' : ` ×${st.rateMul}`;
      relabel(); };
    const relabel = () => { bar.querySelectorAll('[data-k]').forEach(el => { el.textContent = SK.t(el.dataset.k); }); bar.setAttribute('aria-label', SK.t('voice.player')); bar.querySelector('.ab-btn:last-child').setAttribute('aria-label', SK.t('voice.settings')); };
    if (SK.store.subscribe) SK.store.subscribe(relabel);
    S.onChange(sync); document.body.append(bar);
  };
  /** choose the clearest voice installed on this device for the current language, and the speed */
  SK.ui.voiceSettings = () => {
    const VM = SK.services.voice, lang = SK.i18n.lang(), vs = VM.voicesFor(lang), cur = VM.getVoiceForLanguage(lang);
    const list = vs.length ? h('div',{class:'vs-list'}, vs.map(v => h('div',{class:'vs-row'+(cur && cur.name === v.name ? ' is-on' : '')},
        h('span',{class:'vs-name'}, v.name.replace(/\s*\(.*\)$/,''), h('small',{}, v.lang)),
        h('button',{class:'chip-btn', onclick:()=>VM.preview(lang, v.name)}, SK.ui.svg(I.play), SK.t('voice.try')),
        h('button',{class:'chip-btn', onclick:(e)=>{ VM.setPreferred(lang, v.name); e.currentTarget.closest('.vs-list').querySelectorAll('.vs-row').forEach(r=>r.classList.remove('is-on')); e.currentTarget.closest('.vs-row').classList.add('is-on'); }}, SK.t('voice.choose')))))
      : h('p',{class:'gap-note'}, SK.t('voice.none'));
    const speeds = h('div',{class:'vs-speeds'}, [[1,'voice.normal'],[0.8,'voice.slower'],[0.65,'voice.slowest']].map(([r,k]) => h('button',{class:'chip-btn'+(SK.services.speech.rate===r?' is-on':''), onclick:(e)=>{ while (SK.services.speech.rate !== r) SK.services.speech.slower(); SK.services.speech.stop(); e.currentTarget.parentNode.querySelectorAll('.chip-btn').forEach(b=>b.classList.remove('is-on')); e.currentTarget.classList.add('is-on'); }}, SK.t(k))));
    const cfg = lang === 'ar' ? VM.configuredVoice('ar') : null;
    const main = lang === 'ar' ? h('div',{class:'vs-main'+(cfg?' ok':'')}, h('b',{}, SK.t('voice.mainVoice')), h('span',{}, SK.config.ARABIC_SAKEENAH_VOICE), h('small',{}, cfg ? SK.t('voice.mainOk') : SK.t('voice.mainFallback', { v: (VM.getVoiceForLanguage('ar')||{name:'—'}).name }))) : null;
    SK.ui.sheet(SK.t('voice.settings'), main, h('p',{class:'muted'}, SK.t('voice.settingsHint')), list, h('p',{class:'vs-label'}, SK.t('voice.speed')), speeds, h('p',{class:'muted small'}, SK.t('voice.tip')));
  };
  /** Sakeenah subtitles: one short phrase at a time, driven by the audio that is actually playing */
  SK.ui.subtitleBox = () => {
    const txt = h('span',{class:'sk-sub-text'}), box = h('div',{class:'sk-sub', 'aria-live':'polite', hidden:true}, txt);
    let un = null;
    const show = c => { if (!box.isConnected && un && box.dataset.mounted){ un(); return; }
      if (!c){ box.classList.remove('is-on'); return; }
      box.hidden = false; box.dataset.mounted = '1'; box.classList.remove('is-on');
      requestAnimationFrame(() => { txt.textContent = c.text; txt.lang = c.lang; txt.dir = c.dir; box.dir = c.dir; box.classList.toggle('is-ar', c.lang === 'ar'); box.classList.add('is-on'); }); };
    un = SK.services.speech.onCue(show);
    return box;
  };
  /** play/pause icon on a button (keeps one icon style everywhere) */
  SK.ui.setPlayIcon = (btn, isPlaying) => { btn.innerHTML = isPlaying ? I.pause : I.play; btn.dataset.state = isPlaying ? 'playing' : 'paused'; };
  SK.ui.logo = () => h('div',{class:'logo'}, h('span',{class:'logo-mark', html:'<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="12" y="12" width="24" height="24" rx="2"/><rect x="12" y="12" width="24" height="24" rx="2" transform="rotate(45 24 24)"/><circle cx="24" cy="24" r="5"/></g></svg>'}), h('span',{class:'logo-word'}, t('common.brand')));
})(window.SK);
