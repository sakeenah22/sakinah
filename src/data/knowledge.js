/* ===================== Janazah concept map + Knowledge Base =====================
   - Concept IDs are stable. All learner data (profiles, misconceptions, tests) refers to them.
   - The Knowledge Base is SEPARATE from the code that uses it, so it can be reviewed and approved.
   - Explanations shown to the learner come ONLY from TrustedSourcesRegistry (verified evidence). The AI never writes them. */
(function(SK){
  SK.data.module = { id:'janazah', title:'صلاة الجنازة' };

  SK.data.concepts = [
    { id:'takbir_count',     title:'عدد التكبيرات',            order:0 },
    { id:'first_takbir',     title:'التكبيرة الأولى',           order:1, expects:'fatiha'  },
    { id:'second_takbir',    title:'التكبيرة الثانية',          order:2, expects:'salawat' },
    { id:'third_takbir',     title:'التكبيرة الثالثة',          order:3, expects:'dua'     },
    { id:'fourth_takbir',    title:'التكبيرة الرابعة',          order:4, expects:'salam'   },
    { id:'posture_standing', title:'الصلاة قيامًا بلا ركوع ولا سجود', order:5 }
  ];
  // legacy IDs from the first prototype (saved cards) -> stable IDs
  SK.data.aliases = { count:'takbir_count', start:'first_takbir', after1:'first_takbir', after2:'second_takbir', after3:'third_takbir', after4:'fourth_takbir', noMoves:'posture_standing' };
  SK.data.canon = id => SK.data.aliases[id] || id;
  SK.data.concept = id => SK.data.concepts.find(c => c.id === SK.data.canon(id)) || null;
  SK.data.byId = SK.data.concept; // used by older screens

  /* Each knowledge item is a pointer into TrustedSourcesRegistry (the single source of truth):
     its explanation text, the Arabic religious text and every source are read from SK.sources.forConcept(concept_id).
     Nothing religious is stored here any more, so nothing can be shown without verified evidence. */
  SK.data.kb = [
    { id:'KB-JAN-001', concept_id:'takbir_count', language:'ar', title:'عدد تكبيرات صلاة الجنازة', registry:'CL-COUNT' },
    { id:'KB-JAN-002', concept_id:'first_takbir', language:'ar', title:'ما يُقال بعد التكبيرة الأولى', registry:'JAN-STEP-1' },
    { id:'KB-JAN-003', concept_id:'third_takbir', language:'ar', title:'ما يُقال بعد التكبيرة الثالثة', registry:'JAN-STEP-3' },
    { id:'KB-JAN-004', concept_id:'second_takbir', language:'ar', title:'ما يُقال بعد التكبيرة الثانية', registry:'JAN-STEP-2' },
    { id:'KB-JAN-005', concept_id:'fourth_takbir', language:'ar', title:'ما بعد التكبيرة الرابعة', registry:'JAN-STEP-4' },
    { id:'KB-JAN-006', concept_id:'posture_standing', language:'ar', title:'هيئة صلاة الجنازة', registry:'CL-STRUCTURE' }
  ];

  /* Post-test question bank. Every question has a stable ID and belongs to exactly ONE concept,
     so a post-test can only ever test the concept that was just explained. */
  const Q = (id, concept_id, q, options) => ({ id, concept_id, q, options });
  SK.data.questions = {
    takbir_count:[ Q('Q-JAN-001a','takbir_count','كم عدد التكبيرات في صلاة الجنازة؟',[['ثلاث تكبيرات'],['أربع تكبيرات',true],['خمس تكبيرات']]),
                   Q('Q-JAN-001b','takbir_count','وقفت خلف الإمام لصلاة الجنازة. كم مرة سيكبّر؟',[['مرتين'],['أربع مرات',true],['ست مرات']]) ],
    first_takbir:[ Q('Q-JAN-002a','first_takbir','بعد التكبيرة الأولى، ماذا تفعل؟',[['أقرأ الفاتحة',true],['أصلّي على النبي ﷺ'],['أدعو للميت']]),
                   Q('Q-JAN-002b','first_takbir','كبّر الإمام الأولى. ماذا تقرأ الآن؟',[['التشهد'],['سورة الفاتحة',true],['دعاء الاستفتاح فقط']]) ],
    second_takbir:[ Q('Q-JAN-004a','second_takbir','بعد التكبيرة الثانية، ماذا تفعل؟',[['أدعو للميت'],['أصلّي على النبي ﷺ',true],['أسلّم']]),
                    Q('Q-JAN-004b','second_takbir','كبّر الإمام الثانية. ماذا تقول الآن؟',[['الصلاة الإبراهيمية على النبي ﷺ',true],['الفاتحة مرة أخرى'],['السلام عليكم']]) ],
    third_takbir:[ Q('Q-JAN-003a','third_takbir','بعد التكبيرة الثالثة، ماذا تفعل؟',[['أقرأ الفاتحة'],['أصلّي على النبي ﷺ'],['أدعو للميت',true],['أسلّم']]),
                   Q('Q-JAN-003b','third_takbir','كبّر الإمام الثالثة. ماذا تقول الآن؟',[['أدعو للميت بالمغفرة والرحمة',true],['أقرأ التشهد'],['أصلّي على النبي ﷺ']]) ],
    fourth_takbir:[ Q('Q-JAN-005a','fourth_takbir','بعد التكبيرة الرابعة، ماذا تفعل؟',[['أسجد ثم أسلّم'],['أقف قليلًا ثم أسلّم',true],['أركع ثم أسلّم']]),
                    Q('Q-JAN-005b','fourth_takbir','كبّر الإمام الرابعة. ماذا يأتي بعدها؟',[['تكبيرة خامسة'],['وقفة قصيرة ثم السلام',true],['الدعاء للميت ثم الركوع']]) ],
    posture_standing:[ Q('Q-JAN-006a','posture_standing','هل في صلاة الجنازة ركوع أو سجود؟',[['نعم، فيها ركوع وسجود'],['لا، كلها قيام',true],['فيها سجود فقط']]) ]
  };
  SK.data.question = qid => Object.values(SK.data.questions).flat().find(q => q.id === qid) || null;

  /* Explicit concept map: concept -> explanation (KB item) -> post-test questions.
     e.g. third_takbir -> KB-JAN-003 -> Q-JAN-003a / Q-JAN-003b ; second_takbir -> KB-JAN-004 -> Q-JAN-004a / Q-JAN-004b */
  SK.data.conceptMap = Object.fromEntries(SK.data.concepts.map(c => {
    const kb = SK.data.kb.find(k => k.concept_id === c.id);
    const qs = (SK.data.questions[c.id] || []).filter(q => q.concept_id === c.id);
    if (!kb || !qs.length) try{ console.warn('[sakeenah] concept without KB item or question:', c.id); }catch(e){}
    return [c.id, { concept_id:c.id, kb_id: kb ? kb.id : null, question_ids: qs.map(q=>q.id) }];
  }));

  // interface labels follow the selected language; approved_text / passages stay in their original Arabic
  SK.data.concepts.forEach(c => { const ar = c.title; Object.defineProperty(c, 'title', { get: () => SK.i18n && SK.i18n.has('concept.'+c.id) ? SK.t('concept.'+c.id) : ar }); });
  Object.values(SK.data.questions).flat().forEach(q => { const arQ = q.q, arO = q.options.map(o => o[0]);
    Object.defineProperty(q, 'q', { get: () => SK.i18n && SK.i18n.has('qq.'+q.id) ? SK.t('qq.'+q.id) : arQ });
    q.options.forEach((o, i) => Object.defineProperty(o, 0, { get: () => SK.i18n && SK.i18n.has(`qq.${q.id}.o${i}`) ? SK.t(`qq.${q.id}.o${i}`) : arO[i] })); });
  Object.defineProperty(SK.data, 'groundingNote', { get: () => SK.t('src.grounding') });
  SK.data.demoAnswers = [
    'أكبر أربع مرات، وبعد الثانية أصلي على النبي، وبعد الثالثة أقرأ الفاتحة',
    'أكبر وأقرأ الفاتحة ثم أكبر وأدعو للميت ثم أكبر وأصلي على النبي ثم أكبر وأسلم'
  ];
})(window.SK);
