/* ===================== Assistant Knowledge Base («اسأل سكينة») =====================
   Rules:
   - Sources are NOT stored here: each record points to TrustedSourcesRegistry evidence (evidenceRefs).
   - reviewStatus "verified" = answerable, AND only while every evidenceRef is verified in the registry
     (source verification). Final sharia approval is still tracked separately in shariaReview.
   - reviewStatus "pending"  = no checked source yet. The assistant NEVER presents it as a documented answer.
   - No reference, hadith number or URL here is invented: each verified URL was opened and matched to its text. */
(function(SK){
  SK.data.assistantKB = [
    { id:'AKB-JAN-001', topic:'takbir_count', reviewStatus:'verified', shariaReview:'pending', evidenceRefs:['BUKHARI-3881'],
      questionVariants:['how many takbirs are in the funeral prayer','number of takbirs funeral prayer','cenaze namazında kaç tekbir var','نمازِ جنازہ میں کتنی تکبیریں ہیں','كم عدد تكبيرات صلاة الجنازة','كم تكبيرة في صلاة الجنازة','كم مرة يكبر في صلاة الجنازة','عدد التكبيرات في الجنازة','كم تكبيره الجنازه'],
      short:'صلاة الجنازة أربع تكبيرات.',
      content:'صلاة الجنازة أربع تكبيرات. ففي صحيح البخاري عن أبي هريرة رضي الله عنه أن رسول الله ﷺ صفّ بالناس في المصلّى، فصلّى على النجاشي وكبّر أربعًا.',
      passage:'أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم صَفَّ بِهِمْ فِي الْمُصَلَّى، فَصَلَّى عَلَيْهِ وَكَبَّرَ أَرْبَعًا' },

    { id:'AKB-JAN-002', topic:'fatiha_in_janazah', reviewStatus:'verified', shariaReview:'pending', evidenceRefs:['BUKHARI-1335'],
      questionVariants:['is al-fatiha recited in the funeral prayer','cenaze namazında fatiha okunur mu','کیا نمازِ جنازہ میں فاتحہ پڑھی جاتی ہے','هل تقرأ الفاتحة في صلاة الجنازة','قراءة الفاتحة في صلاة الجنازة','هل اقرا الفاتحه في الجنازه','حكم قراءة الفاتحة على الجنازة','هل في صلاة الجنازة فاتحة'],
      short:'تُقرأ سورة الفاتحة في صلاة الجنازة، وهي سنّة.',
      content:'تُقرأ سورة الفاتحة في صلاة الجنازة. ففي صحيح البخاري عن طلحة بن عبد الله بن عوف قال: صلّيت خلف ابن عباس رضي الله عنهما على جنازة فقرأ بفاتحة الكتاب، وقال: لِيعلموا أنها سنّة.',
      passage:'صَلَّيْتُ خَلْفَ ابْنِ عَبَّاسٍ رضى الله عنهما عَلَى جَنَازَةٍ فَقَرَأَ بِفَاتِحَةِ الْكِتَابِ قَالَ لِيَعْلَمُوا أَنَّهَا سُنَّةٌ' },

    { id:'AKB-JAN-003', topic:'dua_for_deceased', reviewStatus:'verified', shariaReview:'pending', evidenceRefs:['NASAI-1983'],
      questionVariants:['what is the dua for the deceased in the funeral prayer','cenaze namazında ölü için dua','نمازِ جنازہ میں میت کے لیے دعا','ما الدعاء للميت في صلاة الجنازة','ماذا ادعو للميت في صلاة الجنازة','دعاء الميت في الجنازة','بماذا ادعو للميت','ما الدعاء الوارد للميت'],
      short:'من الدعاء للميت: «اللهم اغفر له وارحمه، واعفُ عنه وعافِه…».',
      content:'من الدعاء الوارد للميت في صلاة الجنازة ما رواه عوف بن مالك رضي الله عنه أنه سمع رسول الله ﷺ صلّى على جنازة يقول: «اللهم اغفر له وارحمه، واعفُ عنه وعافِه، وأكرم نُزُله، ووسّع مُدخَله، واغسله بماء وثلج وبَرَد، ونقّه من الخطايا كما يُنقّى الثوب الأبيض من الدنس».',
      passage:'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَاعْفُ عَنْهُ وَعَافِهِ وَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مُدْخَلَهُ وَاغْسِلْهُ بِمَاءٍ وَثَلْجٍ وَبَرَدٍ وَنَقِّهِ مِنَ الْخَطَايَا كَمَا يُنَقَّى الثَّوْبُ الأَبْيَضُ مِنَ الدَّنَسِ' },

    /* ---- content used in the learning journey, still WITHOUT a checked source (needs one before it can be answered) ---- */
    { id:'AKB-JAN-010', topic:'janazah_steps', reviewStatus:'pending', shariaReview:'pending',
      questionVariants:['how do i pray the funeral prayer','cenaze namazı nasıl kılınır','نمازِ جنازہ کیسے پڑھیں','كيف اصلي صلاة الجنازة','صفة صلاة الجنازة','طريقة صلاة الجنازة','خطوات صلاة الجنازة','كيف تصلى الجنازة'],
      content:'ترتيب الصلاة: الفاتحة بعد الأولى، والصلاة على النبي ﷺ بعد الثانية، والدعاء للميت بعد الثالثة، ثم السلام بعد الرابعة.',
      composeFrom:['AKB-JAN-001','AKB-JAN-011','AKB-JAN-012','AKB-JAN-013','AKB-JAN-014'] },
    { id:'AKB-JAN-011', topic:'after_first_takbir', reviewStatus:'verified', shariaReview:'pending', evidenceRefs:['NASAI-1989'],
      questionVariants:['what do i do after the first takbir','birinci tekbirden sonra ne yaparım','پہلی تکبیر کے بعد کیا کروں','ماذا اقول بعد التكبيرة الاولى','ماذا افعل بعد التكبيرة الاولى','ما يقال بعد التكبيرة الاولى','ماذا اقرا في التكبيرة الاولى'],
      short:'بعد التكبيرة الأولى تقرأ سورة الفاتحة سرًّا.',
      content:'بعد التكبيرة الأولى تقرأ سورة الفاتحة سرًّا. فعن أبي أمامة رضي الله عنه قال: السنّة في الصلاة على الجنازة أن يقرأ في التكبيرة الأولى بأم القرآن مخافتةً، ثم يكبّر ثلاثًا، والتسليم عند الآخرة.',
      passage:'السُّنَّةُ فِي الصَّلاَةِ عَلَى الْجَنَازَةِ أَنْ يَقْرَأَ فِي التَّكْبِيرَةِ الأُولَى بِأُمِّ الْقُرْآنِ مُخَافَتَةً ثُمَّ يُكَبِّرَ ثَلاَثًا وَالتَّسْلِيمُ عِنْدَ الآخِرَةِ' },
    { id:'AKB-JAN-012', topic:'after_second_takbir', reviewStatus:'verified', shariaReview:'pending', evidenceRefs:['HADEETHENC-8872','BUKHARI-3370'],
      questionVariants:['what do i do after the second takbir','ikinci tekbirden sonra ne yaparım','دوسری تکبیر کے بعد کیا کروں','ماذا اقول بعد التكبيرة الثانية','ماذا افعل بعد التكبيرة الثانية','ما يقال بعد التكبيرة الثانية'],
      short:'بعد التكبيرة الثانية تصلّي على النبي ﷺ بالصلاة الإبراهيمية، كما تصلّي عليه في التشهد.',
      content:'بعد التكبيرة الثانية تصلّي على النبي ﷺ بالصلاة الإبراهيمية: «اللهم صلّ على محمد وعلى آل محمد، كما صليت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد، اللهم بارك على محمد وعلى آل محمد، كما باركت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد».',
      passage:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ' },
    { id:'AKB-JAN-013', topic:'after_third_takbir', reviewStatus:'verified', shariaReview:'pending', evidenceRefs:['HADEETHENC-8872','NASAI-1983'],
      questionVariants:['what do i do after the third takbir','üçüncü tekbirden sonra ne yaparım','تیسری تکبیر کے بعد کیا کروں','ماذا اقول بعد التكبيرة الثالثة','ماذا افعل بعد التكبيرة الثالثة','ما يقال بعد التكبيرة الثالثة'],
      short:'بعد التكبيرة الثالثة تدعو للميت.',
      content:'بعد التكبيرة الثالثة تدعو للميت، ومن الدعاء المأثور: «اللهم اغفر له وارحمه، واعفُ عنه وعافِه، وأكرم نُزُله، ووسّع مُدخَله، واغسله بماء وثلج وبَرَد، ونقّه من الخطايا كما يُنقّى الثوب الأبيض من الدنس».',
      passage:'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَاعْفُ عَنْهُ وَعَافِهِ' },
    { id:'AKB-JAN-014', topic:'after_fourth_takbir', reviewStatus:'verified', shariaReview:'pending',
      questionVariants:['what do i do after the fourth takbir','dördüncü tekbirden sonra ne yaparım','چوتھی تکبیر کے بعد کیا کروں','ماذا افعل بعد التكبيرة الرابعة','ماذا اقول بعد التكبيرة الرابعة','متى اسلم في صلاة الجنازة','ماذا بعد التكبيرة الاخيرة'],
      short:'بعد التكبيرة الرابعة تقف قليلًا، ثم تسلّم عن يمينك: «السلام عليكم ورحمة الله».', evidenceRefs:['IBNMAJAH-1503','NASAI-1989','ABUDAWUD-996','HADEETHENC-8872-TASLIM'],
      content:'بعد التكبيرة الرابعة تقف قليلًا، ثم تسلّم عن يمينك: «السلام عليكم ورحمة الله» (صيغة التسليم من سنن أبي داود 996، وفي رواية لحديث ابن أبي أوفى: سلّم عن يمينه وعن شماله). ففي حديث عبد الله بن أبي أوفى رضي الله عنه أن النبي ﷺ كان يكبّر أربعًا ثم يمكث ساعة ثم يسلّم (رواه ابن ماجه، وهو مختلف في درجته)، والتسليم عند الآخرة كما في حديث أبي أمامة (النسائي).',
      passage:'كَانَ يُكَبِّرُ أَرْبَعًا ثُمَّ يَمْكُثُ سَاعَةً فَيَقُولُ مَا شَاءَ اللَّهُ أَنْ يَقُولَ ثُمَّ يُسَلِّمُ' },
    { id:'AKB-JAN-016', topic:'taslim_count', reviewStatus:'verified', shariaReview:'pending', evidenceRefs:['DORAR-SHARH-209419'],
      questionVariants:['كم تسليمة في صلاة الجنازة','هل اسلم مرة او مرتين في الجنازة','كيف اسلم من صلاة الجنازة'],
      content:'في عدد التسليمات أكثر من قول.' },
    { id:'AKB-JAN-015', topic:'posture', reviewStatus:'verified', shariaReview:'pending', evidenceRefs:['DORAR-FIQH-1958','DORAR-SHARH-209419'],
      questionVariants:['هل في صلاة الجنازة ركوع','هل في صلاة الجنازة سجود','هل نركع في صلاة الجنازة'],
      content:'صلاة الجنازة قيام بلا ركوع ولا سجود.' }
  ];
})(window.SK);
