/* Developer Test Mode (hidden): tap the Sakeenah logo 5 times on the start screen, or open with #dev.
   Runs data/testCases.js through the Understanding Engine + retrieval and reports PASS / FAIL. */
(function(SK){
  const h = SK.h, ui = SK.ui, D = SK.data, S = SK.screens;
  const U = () => SK.services.understanding, R = () => SK.services.retrieval;
  const title = id => (D.concept(id)||{title:id}).title;

  function check(tc, r){
    const e = tc.expect, problems = [];
    if (e.intent && r.intent !== e.intent) problems.push(`intent: ${r.intent}`);
    (e.mastered||[]).forEach(id => { if (!r.mastered.includes(id)) problems.push(`not mastered: ${id}`); });
    (e.missing||[]).forEach(id => { if (!r.missing.includes(id)) problems.push(`not missing: ${id}`); });
    (e.confused||[]).forEach(id => { if (!r.confused.some(c=>c.concept_id===id)) problems.push(`not confused: ${id}`); });
    const stateOf = id => r.mastered.includes(id) ? 'mastered' : r.confused.some(c=>c.concept_id===id) ? 'confused' : r.missing.includes(id) ? 'missing' : 'none';
    Object.entries(e.statuses||{}).forEach(([id, st]) => { if (stateOf(id) !== st) problems.push(`${id}: expected ${st}, got ${stateOf(id)}`); });
    if (e.queue){ const q = SK.services.plan.explanationQueue(r); if (JSON.stringify(q) !== JSON.stringify(e.queue)) problems.push(`queue: expected ${JSON.stringify(e.queue)}, got ${JSON.stringify(q)}`); }
    Object.entries(e.evidence||{}).forEach(([id, txt]) => { const ev = r.evidence.find(x=>x.concept_id===id); if (!ev || !ev.evidence.includes(txt)) problems.push(`evidence ${id}: expected «${txt}», got «${ev ? ev.evidence : '—'}»`); });
    if (e.score != null && r.score !== e.score) problems.push(`score: expected ${e.score}, got ${r.score}`);
    (e.no_source||[]).forEach(id => { if (!r.no_source.some(c=>c.topic_id===id)) problems.push(`no NO_SOURCE: ${id}`); });
    const plan = SK.services.plan.build(r, 3);
    if (e.plan_first && (!plan[0] || plan[0].concept_id !== e.plan_first)) problems.push(`plan starts with ${plan[0] ? plan[0].concept_id : 'nothing'}, expected ${e.plan_first}`);
    if (e.question_first){ const q = plan[0] && SK.services.plan.question(plan[0], 0); if (!q || q.id !== e.question_first) problems.push(`first post-test ${q ? q.id : 'none'}, expected ${e.question_first}`); }
    problems.push(...SK.services.plan.verify(r, plan));
    return problems;
  }
  const expectedText = e => [e.intent && `intent=${e.intent}`, e.statuses && Object.entries(e.statuses).map(([k,v])=>`${k}=${v}`).join(', '), e.score!=null && `score=${e.score}`, e.mastered&&`✓ ${e.mastered.join(', ')}`, e.confused&&`✕ ${e.confused.join(', ')}`, e.missing&&`○ ${e.missing.join(', ')}`, e.no_source&&`NO_SOURCE ${e.no_source.join(', ')}`].filter(Boolean).join(' | ');
  const detectedText = r => [`intent=${r.intent}`, r.mastered.length&&`✓ ${r.mastered.join(', ')}`, r.confused.length&&`✕ ${r.confused.map(c=>c.concept_id).join(', ')}`, r.missing.length&&`○ ${r.missing.join(', ')}`, r.no_source.length&&`NO_SOURCE ${r.no_source.map(x=>x.topic_id).join(', ')}`].filter(Boolean).join(' | ');

  S.devtests = () => {
    const sum = h('div',{class:'dev-sum', 'aria-live':'polite'});
    const tbody = h('tbody');
    const logBox = h('pre',{class:'dev-log', dir:'ltr'});
    const custom = h('textarea',{class:'answer', rows:'3', placeholder:'اكتب إجابة لتجربتها…'}); const customOut = h('pre',{class:'dev-log', dir:'ltr'});
    const run = async () => {
      tbody.replaceChildren(); let pass = 0;
      for (const tc of D.testCases){
        const r = await U().analyzeUnderstanding(tc.input);
        const probs = check(tc, r); const ok = !probs.length; if (ok) pass++;
        const plan = SK.services.plan.build(r, 3); const first = plan[0];
        const src = first ? `${first.kb_id || 'NO_SOURCE_FOUND'} → ${(SK.services.plan.question(first,0)||{}).id || 'NO_QUESTION'}` : (r.intent==='out_of_scope' ? 'OUT_OF_SCOPE' : '—');
        tbody.append(h('tr',{class: ok?'':'is-fail'},
          h('td',{dir:'ltr'}, tc.id, tc.regression ? h('div',{class:'pf no', style:'margin-top:4px;display:inline-block'}, 'REGRESSION') : null), h('td',{}, tc.input, tc.note ? h('div',{class:'muted small'}, tc.note) : null), h('td',{dir:'ltr', class:'mono'}, expectedText(tc.expect)), h('td',{dir:'ltr', class:'mono'}, detectedText(r)),
          h('td',{dir:'ltr', class:'mono'}, src), h('td',{dir:'ltr', class:'mono'}, `score ${r.score}`, probs.length ? h('div',{class:'dev-why'}, probs.join('; ')) : null),
          h('td',{}, h('span',{class:'pf '+(ok?'ok':'no')}, ok?'PASS':'FAIL'))));
      }
      sum.replaceChildren(h('b',{}, `${pass} / ${D.testCases.length} PASS`), h('span',{class:'muted'}, ` · engine: ${U().getEngine()} (${U().ENGINE_VERSION}) · cases in data/testCases.js`));
      logBox.textContent = R().log.slice(-20).map(e=>`${e.at.slice(11,19)} ${e.type} ${JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k])=>!['type','at'].includes(k))))}`).join('\n') || '(no events)';
    };
    const tryOne = async () => { const r = await U().analyzeUnderstanding(custom.value); customOut.textContent = JSON.stringify(r, null, 2); };
    // ---- assistant evidence-gate tests (A/B/C) ----
    const asstBox = h('div',{class:'dev-log', dir:'ltr', style:'white-space:pre-wrap'});
    const runAssistant = () => {
      const A = SK.services.assistantService, KS = SK.services.knowledgeService;
      const a = A.ask('كم عدد تكبيرات صلاة الجنازة؟');
      const aPass = a.evidenceStatus==='SUPPORTED' && !!a.answer && a.answer.citations.length>0 && a.answer.citations.every(c=>KS.isVerified(c));
      const b = A.ask('ما حكم صلاة الغائب؟');
      const bPass = b.evidenceStatus==='INSUFFICIENT' && !b.answer;
      KS.addTestRecord({ id:'TEST-PENDING-001', topic:'test_pending', reviewStatus:'pending', questionVariants:['ما حكم الصلاة على الميت في المقبرة'], content:'نص تجريبي غير موثق', source:{ title:'مصدر تجريبي', reference:'غير موثق', url:'' } });
      const c = A.ask('ما حكم الصلاة على الميت في المقبرة؟'); KS.removeTestRecord('TEST-PENDING-001');
      const cPass = c.evidenceStatus!=='SUPPORTED' && !c.answer && c.blocked==='TEST-PENDING-001';
      asstBox.textContent = [
        `Test A: ${aPass?'PASS':'FAIL'}`, `Retrieved Knowledge ID: ${a.retrieved[0] ? a.retrieved[0].id : '-'}`, `Evidence Status: ${a.evidenceStatus}`, `Source displayed: ${a.answer && a.answer.citations[0] ? 'YES' : 'NO'}`, '',
        `Test B: ${bPass?'PASS':'FAIL'}`, `Evidence Status: ${b.evidenceStatus}`, `Generated unsupported answer: ${b.answer ? 'YES' : 'NO'}`, '',
        `Test C: ${cPass?'PASS':'FAIL'}`, `Pending source blocked: ${cPass ? 'YES' : 'NO'}`, '',
        ...(() => { const GC = SK.services.guideContext; const r1 = GC.resolve('وش أسوي بعدها؟', { currentConcept:'first_takbir' }); const a1 = A.ask(r1.query);
          const r3 = GC.resolve('وش أسوي بعدها؟', { currentConcept:'third_takbir' }); const a3 = A.ask(r3.query);
          const ok1 = r1.resolved && a1.evidenceStatus==='SUPPORTED' && a1.retrieved[0].id==='AKB-JAN-011', ok3 = r3.resolved && a3.evidenceStatus==='INSUFFICIENT' && !a3.answer;
          return [`Test D (context first_takbir + «وش أسوي بعدها؟»): ${ok1?'PASS':'FAIL'} → ${r1.query} → ${a1.evidenceStatus} ${a1.retrieved[0] ? a1.retrieved[0].id : ''}`,
                  `Test E (context third_takbir + «وش أسوي بعدها؟»): ${ok3?'PASS':'FAIL'} → ${r3.query} → ${a3.evidenceStatus} (pending source, no answer)`]; })()].join('\n');
    };
    setTimeout(()=>{ run(); runAssistant(); }, 50);
    // screenshot shortcuts (developer mode only): each opens a ready-to-capture screen with sample state
    const presentCb = h('input',{type:'checkbox'}); presentCb.checked = SK.presentation && SK.presentation.isOn(); presentCb.onchange = () => presentCb.checked ? SK.presentation.on() : SK.presentation.off();
    const shots = h('div',{class:'card'}, h('p',{class:'box-title'}, 'شاشات التصوير (Demo Data)'),
      h('label',{class:'row', style:'gap:10px;align-items:center'}, presentCb, h('span',{}, 'وضع العرض: كل صفحة في شاشة واحدة (لتصوير الفيديو)')),
      h('div',{class:'shot-grid'}, ...(SK.demoRoutes ? SK.demoRoutes.list : []).flatMap(r => ['ar','en'].map(l => h('button',{class:'chip-btn', onclick:()=>{ location.hash = '#demo/' + r + '?lang=' + l; }}, `${r} · ${l}`)))));
    // ---- «ردّد معي» developer panel: the SAME service/component used by the learning path and the full explanation ----
    const RAM = SK.services.repeatAfterMe;
    const ramRows = h('tbody'), ramLog = h('div',{class:'dev-ram-log'});
    // comparison tests (typed transcripts → the same evaluate() the recordings go through)
    const CASES = [ ['ar','الله أكبر','الله أكبر','PASS'], ['ar','الله أكبر','الحمد لله','FAIL'], ['ar','الله أكبر','الله','FAIL'], ['ar','الله أكبر','','NO_SPEECH'],
      ['ar','السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ','السلام عليكم ورحمة الله','PASS'], ['ar','السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ','السلام عليكم','FAIL'],
      ['en','peace be upon you','Peace be upon you.','PASS'], ['en','peace be upon you','good morning to you','FAIL'],
      ['tr','Allah en büyüktür','allah en büyüktür','PASS'], ['tr','Allah en büyüktür','Allah büyüktür','FAIL'],
      ['ur','اللہ سب سے بڑا ہے','اللہ سب سے بڑا ہے','PASS'], ['ur','اللہ سب سے بڑا ہے','اللہ بڑا ہے','FAIL'] ];
    const row = (cells, ok) => h('tr',{class: ok ? '' : 'is-fail'}, ...cells.map(c => h('td',{}, c)));
    const runRam = () => { ramRows.replaceChildren(...CASES.map(([lang, exp, said, want]) => { const r = RAM.evaluate(exp, said, lang);
        return row([lang, exp, said || '(صمت)', `${r.status} · ${Math.round((r.score||0)*100)}%${r.threshold!=null ? ' / ≥'+Math.round(r.threshold*100)+'%' : ''}`, h('span',{class:'pf '+(r.status === want ? 'ok' : 'no')}, r.status === want ? 'PASS' : 'FAIL')], r.status === want); }));
      ramLog.replaceChildren(...(RAM.log.length ? RAM.log.slice().reverse().map(r => h('dl',{class:'source-dl dev-attempt'},
        ...[['context', r.context], ['expected text', r.expected], ['recognized text', r.recognized || '—'], ['text language', r.textLanguage + ' (UI: ' + r.uiLanguage + ')'], ['STT provider', r.provider + (r.model ? ' · ' + r.model : '')],
            ['recording', r.durationMs != null ? (r.durationMs/1000).toFixed(1) + ' s' + (r.bytes != null ? ` · ${r.bytes} bytes · ${r.mime} · voiced ${r.voicedMs} ms · peak ${r.peak}` : '') : '—'],
            ['comparison rules', r.rules || RAM.describeRules()], ['score / threshold', r.score != null ? `${Math.round(r.score*100)}%` + (r.threshold!=null ? ` / ≥${Math.round(r.threshold*100)}%` : '') : '—'],
            ['result', r.status], ['error', r.error || r.note || '—']].flatMap(([k, v]) => [h('dt',{dir:'ltr'}, k), h('dd',{}, v)]))) : [h('p',{class:'muted small'}, '(no recording yet)')])); };
    setTimeout(runRam, 60);
    const provLine = h('p',{class:'muted small', dir:'ltr'});
    RAM.ready.then(() => { provLine.textContent = `STT provider: ${RAM.providerLabel()} · languages: ${RAM.languages().join(', ') || 'none'} · ${RAM.describeRules()}`; });
    const PATHS = [['A','learning-path','مسار التعليم'], ['B','full-explanation','الشرح الكامل']];
    const ramLive = h('div',{class:'dev-ram-live'}, ...PATHS.map(([k, ctx, label]) => h('div',{class:'card'}, h('p',{class:'box-title'}, `${k}) ${label} — تسجيل حقيقي بالميكروفون`),
      SK.ui.RepeatAfterMe({ expectedText:'الله أكبر', audio:null, language:'ar', context:ctx }))));
    const ramBox = h('div',{}, provLine,
      h('div',{class:'dev-table-wrap'}, h('table',{class:'dev-table'}, h('thead',{}, h('tr',{}, ...['Lang','Expected','Recognized (typed)','Result · score / threshold','Expected result?'].map(x=>h('th',{},x)))), ramRows)),
      ramLive, ui.button('حدّث سجل التسجيلات',{variant:'ghost', onclick:runRam}), ramLog);
    return ui.screen({ eyebrow:'Developer Test Mode', title:'اختبارات محرك الفهم',
      body:[ shots, h('div',{class:'row-btns'}, ui.button('تشغيل كل الحالات',{onclick:run}), ui.button('الخروج',{variant:'ghost', onclick:()=>SK.router.go('start',{reset:true})})),
        h('label',{class:'row', style:'gap:10px;align-items:center'}, (()=>{ const cb=h('input',{type:'checkbox'}); try{ cb.checked = localStorage.getItem('sk:demo')==='1'; }catch(e){} cb.onchange=()=>{ try{ localStorage.setItem('sk:demo', cb.checked?'1':'0'); }catch(e){} }; return cb; })(), 'إظهار Demo Details داخل مرشد سكينة (للعرض أمام اللجنة)'), sum,
        h('div',{class:'dev-table-wrap'}, h('table',{class:'dev-table'}, h('thead',{}, h('tr',{}, ...['#','Input','Expected Concept','Detected Concept','Source ID → Post-test Q','Result','PASS / FAIL'].map(x=>h('th',{}, x)))), tbody)),
        h('h2',{class:'box-title'}, 'اختبارات «اسأل سكينة» (Evidence Gate)'), asstBox, ui.button('أعد اختبارات المساعد',{variant:'ghost', onclick:()=>runAssistant()}),
        h('h2',{class:'box-title'}, '«ردّد معي» — مسار التعليم والشرح الكامل'), ramBox,
        h('h2',{class:'box-title'}, 'سجل الأحداث (NO_SOURCE_FOUND وغيرها)'), logBox,
        h('h2',{class:'box-title'}, 'جرّب إجابة واحدة (Structured JSON)'), custom, ui.button('حلّل',{variant:'ghost', onclick:tryOne}), customOut ] });
  };
})(window.SK);
