/* Developer test cases for the Understanding Engine.
   expect: concepts that MUST appear in each list (subset match). intent: 'answer' | 'unknown' | 'out_of_scope'.
   Add more cases here (target: 30). */
(function(SK){
  SK.data.testCases = [
    // ---- regression: the reported 0% bug (must PASS) ----
    { id:'R01', regression:true, input:'أكبر أربع تكبيرات، بعد الأولى أقرأ الفاتحة، وبعد الثانية أصلي على النبي ﷺ، وبعد الثالثة أقرأ الفاتحة، وبعد الرابعة أسلم.', expect:{ intent:'answer', statuses:{ takbir_count:'mastered', first_takbir:'mastered', second_takbir:'mastered', third_takbir:'confused', fourth_takbir:'mastered' }, score:80, queue:['third_takbir'], evidence:{ takbir_count:'أربع تكبيرات', first_takbir:'بعد الأولى أقرأ الفاتحة', second_takbir:'بعد الثانية أصلي على النبي ﷺ', third_takbir:'بعد الثالثة أقرأ الفاتحة', fourth_takbir:'بعد الرابعة أسلم' } } },
    { id:'R01-PF', regression:true, note:'same answer pasted with Arabic presentation forms (PDF/Word copy)', input:'ﺃﻙﺏﺭ ﺃﺭﺏﻉ ﺕﻙﺏﻱﺭﺍﺕ، ﺏﻉﺩ ﺍﻝﺃﻭﻝﻯ ﺃﻕﺭﺃ ﺍﻝﻑﺍﺕﺡﺓ، ﻭﺏﻉﺩ ﺍﻝﺙﺍﻥﻱﺓ ﺃﺹﻝﻱ ﻉﻝﻯ ﺍﻝﻥﺏﻱ ﷺ، ﻭﺏﻉﺩ ﺍﻝﺙﺍﻝﺙﺓ ﺃﻕﺭﺃ ﺍﻝﻑﺍﺕﺡﺓ، ﻭﺏﻉﺩ ﺍﻝﺭﺍﺏﻉﺓ ﺃﺱﻝﻡ.', expect:{ intent:'answer', statuses:{ takbir_count:'mastered', first_takbir:'mastered', second_takbir:'mastered', third_takbir:'confused', fourth_takbir:'mastered' }, score:80 } },
    { id:'R01-NFD', regression:true, note:'same answer with decomposed hamza (some mobile keyboards)', input:'أكبر أربع تكبيرات، بعد الأولى أقرأ الفاتحة، وبعد الثانية أصلي على النبي ﷺ، وبعد الثالثة أقرأ الفاتحة، وبعد الرابعة أسلم.', expect:{ intent:'answer', statuses:{ takbir_count:'mastered', first_takbir:'mastered', second_takbir:'mastered', third_takbir:'confused', fourth_takbir:'mastered' }, score:80 } },
    // ---- count phrasings: every one must give takbir_count = mastered and queue = [third_takbir] ----
    ...['اربع تكبيرات','أربعة تكبيرات','4 تكبيرات','أكبر أربع مرات'].map((head,i) => ({ id:'R02-'+(i+1), regression:true,
      input: head + '، بعد الأولى أقرأ الفاتحة، وبعد الثانية أصلي على النبي ﷺ، وبعد الثالثة أقرأ الفاتحة، وبعد الرابعة أسلم.',
      expect:{ intent:'answer', statuses:{ takbir_count:'mastered', first_takbir:'mastered', second_takbir:'mastered', third_takbir:'confused', fourth_takbir:'mastered' }, score:80, queue:['third_takbir'] } })),
    // ---- Arabic phrasing variants ----
    { id:'A', input:'هي أربع تكبيرات، الأولى فاتحة والثانية صلاة على الرسول وبعد الثالثة الدعاء للميت ثم السلام', expect:{ intent:'answer', statuses:{ takbir_count:'mastered', first_takbir:'mastered', second_takbir:'mastered', third_takbir:'mastered', fourth_takbir:'mastered' }, score:100 } },
    { id:'B', input:'ما أعرف', expect:{ intent:'unknown', statuses:{ takbir_count:'missing', first_takbir:'missing', second_takbir:'missing', third_takbir:'missing', fourth_takbir:'missing' }, score:0 } },
    { id:'C', input:'أكبر وأقرأ الفاتحة، ثم أكبر وأصلي على النبي', expect:{ intent:'answer', statuses:{ first_takbir:'mastered', second_takbir:'mastered', third_takbir:'missing', fourth_takbir:'missing' }, score:40 } },
    { id:'D', input:'أربع تكبيرات، بعد الأولى الفاتحة، بعد الثانية أدعو للميت، بعد الثالثة أصلي على النبي، وبعد الرابعة أسلم', expect:{ intent:'answer', statuses:{ takbir_count:'mastered', first_takbir:'mastered', second_takbir:'confused', third_takbir:'confused', fourth_takbir:'mastered' }, score:60, plan_first:'second_takbir' } },
    { id:'T01', input:'أكبر أربع تكبيرات، بعد الأولى أقرأ الفاتحة، وبعد الثانية أصلي على النبي، وبعد الثالثة أدعو للميت، ثم أسلم', expect:{ intent:'answer', mastered:['takbir_count','first_takbir','second_takbir','third_takbir','fourth_takbir'] } },
    { id:'T02', input:'أكبر أربع مرات، وبعد الثانية أصلي على النبي، وبعد الثالثة أقرأ الفاتحة', expect:{ intent:'answer', mastered:['takbir_count','second_takbir'], confused:['third_takbir'] } },
    { id:'T03', input:'أكبر وأقرأ الفاتحة ثم أكبر وأدعو للميت ثم أكبر وأصلي على النبي ثم أكبر وأسلم', expect:{ intent:'answer', mastered:['first_takbir','fourth_takbir'], confused:['second_takbir','third_takbir'] } },
    { id:'T04', input:'أكبر وأقرأ الفاتحة وبعدين أدعو للميت', expect:{ intent:'answer', mastered:['first_takbir'], missing:['fourth_takbir'] } },
    { id:'T05', input:'لا أعرف', expect:{ intent:'unknown', missing:['takbir_count','first_takbir'] } },
    { id:'T06', input:'ما حكم صيام يوم عرفة؟', expect:{ intent:'out_of_scope' } },
    { id:'T07', input:'أكبر خمس تكبيرات وأقرأ الفاتحة', expect:{ intent:'answer', confused:['takbir_count'], mastered:['first_takbir'] } },
    { id:'T08', input:'أكبر وأقرأ الفاتحة ثم أركع ثم أسجد وأسلم', expect:{ intent:'answer', confused:['posture_standing'] } },
    { id:'T09', input:'Four takbeers. After the first I recite al-Fatiha, after the second I send blessings on the Prophet, after the third I make dua for the deceased, then salam', expect:{ intent:'answer', mastered:['takbir_count','first_takbir','second_takbir','third_takbir','fourth_takbir'] } },
    { id:'T10', input:'مدري والله', expect:{ intent:'unknown' } },
    { id:'T11', input:'بعد التكبيرة الثالثة أقرأ التشهد وبعد الرابعة أسلم', expect:{ intent:'answer', confused:['third_takbir'], mastered:['fourth_takbir'] } },
    { id:'T12', input:'كيف أتوضأ؟', expect:{ intent:'out_of_scope' } },
    { id:'T13', input:'أكبر أربع تكبيرات وأسلم، وهل تجوز صلاة الغائب؟', expect:{ intent:'answer', mastered:['takbir_count','fourth_takbir'], no_source:['absent_prayer'] } }
    ,{ id:'T14', input:'أكبر أربع تكبيرات، بعد الأولى أقرأ الفاتحة، وبعد الثانية أصلي على النبي، وبعد الثالثة أقرأ الفاتحة، وبعد الرابعة أسلم.', expect:{ intent:'answer', mastered:['second_takbir','first_takbir','fourth_takbir'], confused:['third_takbir'], plan_first:'third_takbir', question_first:'Q-JAN-003a' } },
    { id:'T15', input:'أكبر أربع تكبيرات، بعد الأولى الفاتحة، وبعد الثانية أصلي ع النبي، وبعد الثالثة أقرأ التشهد، ثم أسلم', expect:{ intent:'answer', mastered:['second_takbir'], confused:['third_takbir'], plan_first:'third_takbir' } },
    { id:'T16', input:'أكبر وأقرأ الفاتحة ثم أكبر وأدعو للميت ثم أكبر وأصلي على النبي ثم أكبر وأسلم', expect:{ intent:'answer', confused:['second_takbir','third_takbir'], plan_first:'second_takbir' } }
  ];
})(window.SK);
