/* ===================== TrustedSourcesRegistry =====================
   One place for the sources Sakeenah may cite, the evidence taken from them, and the facts built on that evidence.
   Every screen that shows a funeral-prayer step reads it from here (quick learning, quick review, guide answers),
   and the central Evidence Guard decides whether it may be shown.

   Source of Truth: statement → EVIDENCE (this file) → SOURCE → sourceUrl. Every screen (full / personalized / quick learning,
   the guide, tests, video and «ردّد معي») reads religious content and its sources ONLY through SK.sources.
   verificationStatus: 'verified'     = the sourceUrl was opened (2026-10-06) and shows the quoted evidence and the details below
                       'needs_review' = the page was opened but something does not line up (grade, numbering, attribution)
                       'unverified'   = not checked yet
   Only 'verified' evidence may back content shown as confirmed; the rest is never displayed as a source.
   NOTE: the challenge's reference file («المرجعية والحزمة العلمية والبيانات») has not been supplied yet, so
   inReferenceAllowlist stays 'pending' until each source is matched against that list. */
(function(SK){
  const SOURCES = {
    'SRC-QURAN':       { sourceName:'القرآن الكريم (Quran.com)', sourceNameI18n:{"en": "The Noble Quran", "tr": "Kur'ân-ı Kerîm", "ur": "قرآنِ کریم"}, sourceType:'quran', inReferenceAllowlist:'pending' },
    'SRC-ABUDAWUD':    { sourceName:'سنن أبي داود', sourceNameI18n:{"en": "Sunan Abi Dawud", "tr": "Sünen-i Ebû Dâvûd", "ur": "سنن ابی داود"}, sourceType:'hadith_collection', inReferenceAllowlist:'pending' },
    'SRC-DORAR-FIQH':  { sourceName:'الموسوعة الفقهية — الدرر السنية', sourceNameI18n:{"en":"Fiqh Encyclopedia — Dorar","tr":"Fıkıh Ansiklopedisi — Dorar","ur":"فقہی انسائیکلوپیڈیا — الدرر السنیہ"}, sourceType:'fiqh_encyclopedia', inReferenceAllowlist:'pending' },
    'SRC-DORAR-HADITH':{ sourceName:'الموسوعة الحديثية — الدرر السنية', sourceNameI18n:{"en":"Hadith Encyclopedia — Dorar","tr":"Hadis Ansiklopedisi — Dorar","ur":"حدیث انسائیکلوپیڈیا — الدرر السنیہ"}, sourceType:'hadith_explanation', inReferenceAllowlist:'pending' },
    'SRC-ISLAMONLINE': { sourceName:'إسلام أون لاين — نقلًا عن الموسوعة الفقهية الكويتية', sourceNameI18n:{"en":"IslamOnline — quoting the Kuwaiti Fiqh Encyclopedia","tr":"IslamOnline — Kuveyt Fıkıh Ansiklopedisi'nden","ur":"اسلام آن لائن — کویتی فقہی انسائیکلوپیڈیا سے"}, sourceType:'fiqh_encyclopedia', inReferenceAllowlist:'pending' },
    'SRC-BUKHARI':     { sourceName:'صحيح البخاري', sourceNameI18n:{"en": "Sahih al-Bukhari", "tr": "Sahîh-i Buhârî", "ur": "صحیح بخاری"}, sourceType:'hadith_collection', inReferenceAllowlist:'pending' },
    'SRC-MUSLIM':      { sourceName:'صحيح مسلم', sourceNameI18n:{"en": "Sahih Muslim", "tr": "Sahîh-i Müslim", "ur": "صحیح مسلم"}, sourceType:'hadith_collection', inReferenceAllowlist:'pending' },
    'SRC-NASAI':       { sourceName:'سنن النسائي', sourceNameI18n:{"en": "Sunan an-Nasa'i", "tr": "Sünen-i Nesâî", "ur": "سنن نسائی"}, sourceType:'hadith_collection', inReferenceAllowlist:'pending' },
    'SRC-IBNMAJAH':    { sourceName:'سنن ابن ماجه', sourceNameI18n:{"en": "Sunan Ibn Majah", "tr": "Sünen-i İbn Mâce", "ur": "سنن ابن ماجہ"}, sourceType:'hadith_collection', inReferenceAllowlist:'pending' },
    'SRC-HADEETHENC':  { sourceName:'موسوعة الأحاديث النبوية (HadeethEnc)', sourceNameI18n:{"en": "Encyclopedia of Translated Prophetic Hadiths (HadeethEnc)", "tr": "Tercümeli Hadis Ansiklopedisi (HadeethEnc)", "ur": "ترجمہ شدہ احادیث کا انسائیکلوپیڈیا (HadeethEnc)"}, sourceType:'hadith_explanation', inReferenceAllowlist:'pending' }
  };
  /* each piece of evidence was opened and matched to its text before being added */
  const EVIDENCE = {
    'BUKHARI-3881': { sourceId:'SRC-BUKHARI', referenceId:'صحيح البخاري 3881 — باب موت النجاشي', sourceUrl:'https://sunnah.com/bukhari/63/106', language:'ar', evidenceStatus:'verified', num:'3881',
      supports:'صلاة الجنازة أربع تكبيرات', supportsI18n:{"en":"The funeral prayer has four takbirs","tr":"Cenaze namazı dört tekbirdir","ur":"نمازِ جنازہ میں چار تکبیریں ہیں"},
      evidenceText:'أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم صَفَّ بِهِمْ فِي الْمُصَلَّى، فَصَلَّى عَلَيْهِ وَكَبَّرَ أَرْبَعًا' },
    'DORAR-FIQH-1958': { sourceId:'SRC-DORAR-FIQH', referenceId:'الموسوعة الفقهية — صفة صلاة الجنازة (نقلًا عن ابن حجر، فتح الباري 3/190)', sourceUrl:'https://dorar.net/feqhia/1958', language:'ar', evidenceStatus:'verified', num:'1958',
      supports:'صلاة الجنازة ليس فيها ركوع ولا سجود، وفيها تكبير وتسليم', supportsI18n:{"en":"The funeral prayer has no bowing or prostration; it has takbirs and the salam","tr":"Cenaze namazında rükû ve secde yoktur; tekbir ve selam vardır","ur":"نمازِ جنازہ میں رکوع اور سجدہ نہیں، اس میں تکبیر اور سلام ہے"},
      evidenceText:'يُشتَرَط فيها ما يُشتَرَط في الصلاة، وإنْ لم يكن فيها ركوعٌ ولا سجودٌ، فإنَّه لا يُتكلَّم فيها، ويُكبَّر فيها، ويُسلَّم منها بالاتِّفاق' },
    'DORAR-SHARH-209419': { sourceId:'SRC-DORAR-HADITH', referenceId:'شرح حديث ابن مسعود: التسليم على الجنازة مثل التسليم في الصلاة (البيهقي 7239)', sourceUrl:'https://dorar.net/hadith/sharh/209419', language:'ar', evidenceStatus:'verified', num:'209419',
      supports:'صفة صلاة الجنازة، والخلاف في عدد التسليم', supportsI18n:{"en":"How the funeral prayer differs, and the difference of opinion on the number of salams","tr":"Cenaze namazının farkı ve selam sayısındaki ihtilaf","ur":"نمازِ جنازہ کا فرق، اور سلام کی تعداد میں اختلاف"},
      evidenceText:'صَلاةٌ ليس فيها رُكوعٌ ولا سُجودٌ، وإنَّما هيَ عَدَدٌ مِنَ التَّكبيراتِ وتسليمتينِ … وفي قَولٍ آخَرَ: أنَّها تسليمةٌ واحِدةٌ، والمَسألةُ فيها خِلافٌ' },
    'DORAR-FIQH-1970': { sourceId:'SRC-DORAR-FIQH', referenceId:'الموسوعة الفقهية — الصلاة على النبي ﷺ في صلاة الجنازة', sourceUrl:'https://dorar.net/feqhia/1970', language:'ar', evidenceStatus:'verified', num:'1970',
      supports:'صيغة الصلاة على النبي ﷺ في الجنازة هي صيغ التشهد', supportsI18n:{"en":"The blessings on the Prophet ﷺ in the funeral prayer use the wordings of the tashahhud","tr":"Cenazede salavat, teşehhütteki lafızlarla getirilir","ur":"جنازے میں درود، تشہد والے الفاظ سے پڑھا جاتا ہے"},
      evidenceText:'الظَّاهِرُ أنَّ الجنازةَ ليس لها صيغةٌ خاصَّةٌ، بل يؤتى فيها بصيغةٍ مِن الصِّيغِ الثابتة في التشهُّد في المكتوبةِ' },
    'DORAR-FIQH-1958-QIBLA': { sourceId:'SRC-DORAR-FIQH', referenceId:'الموسوعة الفقهية — صفة صلاة الجنازة (الإجماع)', sourceUrl:'https://dorar.net/feqhia/1958', language:'ar', evidenceStatus:'verified', num:'1958', supports:'استقبال القبلة في صلاة الجنازة', supportsI18n:{"en": "Facing the qibla in the funeral prayer", "tr": "Cenaze namazında kıbleye dönmek", "ur": "نمازِ جنازہ میں قبلہ رخ ہونا"}, evidenceText:'صَلاةُ الجِنازةِ لها تحريمٌ، وتكبيرٌ، وتحليلٌ، ويُستقبَلُ فيها القِبلةُ، ويُشرَعُ أن تُصلَّى بإمامٍ وصفوفٍ' },
    'DORAR-FIQH-1978-RAISE1': { sourceId:'SRC-DORAR-FIQH', referenceId:'الموسوعة الفقهية — رفع اليدين مع التكبيرة الأولى (الإجماع)', sourceUrl:'https://dorar.net/feqhia/1978', language:'ar', evidenceStatus:'verified', num:'1978', supports:'رفع اليدين مع التكبيرة الأولى (بالإجماع)', supportsI18n:{"en": "Raising the hands with the first takbir (by consensus)", "tr": "Birinci tekbirde elleri kaldırmak (icmâ ile)", "ur": "پہلی تکبیر کے ساتھ ہاتھ اٹھانا (اجماع سے)"}, evidenceText:'أجمَعوا على أنَّ المصلِّي على الجِنازَة يرفع يديه في أوَّل تكبيرة يُكبِّرها' },
    'DORAR-FIQH-1978-RAISEALL': { sourceId:'SRC-DORAR-FIQH', referenceId:'الموسوعة الفقهية — رفع اليدين مع بقية التكبيرات', sourceUrl:'https://dorar.net/feqhia/1978', language:'ar', evidenceStatus:'verified', num:'1978', supports:'رفع اليدين في بقية التكبيرات (مسألة خلافية)', supportsI18n:{"en": "Raising the hands with the other takbirs (a matter of difference)", "tr": "Diğer tekbirlerde elleri kaldırmak (ihtilaflı)", "ur": "باقی تکبیروں میں ہاتھ اٹھانا (اختلافی مسئلہ)"}, evidenceText:'يُسنُّ للمصلِّي على الجِنازة أنْ يَرفعَ يديه في كلِّ تكبيرةٍ، وهو مذهبُ الشافعيَّة' },
    'ISLAMONLINE-HEIGHT': { sourceId:'SRC-ISLAMONLINE', referenceId:'رفع اليدين في صلاة الجنازة — نقلًا عن الموسوعة الفقهية الكويتية', sourceUrl:'https://fiqh.islamonline.net/%d8%b1%d9%81%d8%b9-%d8%a7%d9%84%d9%8a%d8%af%d9%8a%d9%86-%d9%81%d9%8a-%d8%b5%d9%84%d8%a7%d8%a9-%d8%a7%d9%84%d8%ac%d9%86%d8%a7%d8%b2%d8%a9-%d8%a3%d8%b1%d8%a7%d8%a1-%d9%88%d8%aa%d8%b1%d8%ac%d9%8a%d8%ad/', language:'ar', evidenceStatus:'verified', num:'%d8%b1%d9%81', supports:'رفع اليدين حذو المنكبين في التكبيرة الأولى', supportsI18n:{"en": "Raising the hands to shoulder level at the first takbir", "tr": "Birinci tekbirde elleri omuz hizasına kaldırmak", "ur": "پہلی تکبیر میں ہاتھ کندھوں تک اٹھانا"}, evidenceText:'اتفق الفقهاء على أن المصلي صلاة الجنازة يرفع يديه حذو منكبيه في التكبيرة الأولى' },
    'TIRMIDHI-1077-HANDS': { sourceId:'SRC-DORAR-HADITH', referenceId:'حديث أبي هريرة في رفع اليدين ووضع اليمنى على اليسرى في الجنازة (الترمذي 1077)', sourceUrl:'https://dorar.net/h/DcgFlnqH', language:'ar', evidenceStatus:'verified', num:'DcgFlnqH', supports:'وضع اليمنى على اليسرى في صلاة الجنازة', supportsI18n:{"en": "Placing the right hand over the left in the funeral prayer", "tr": "Cenaze namazında sağ eli sol elin üzerine koymak", "ur": "نمازِ جنازہ میں دایاں ہاتھ بائیں پر رکھنا"}, evidenceText:'إذا صلَّى على جنازةٍ، رفعَ يدَيه في أولِ تكبيرةٍ. ثم وضع يدَه اليُمنى على اليُسرى', gradeNote:'في إسناده ضعف (ابن حجر، الدراية)' },
    'DORAR-FIQH-912-HANDS': { sourceId:'SRC-DORAR-FIQH', referenceId:'الموسوعة الفقهية — وضع اليد اليمنى على اليسرى في القيام', sourceUrl:'https://dorar.net/feqhia/912', language:'ar', evidenceStatus:'verified', num:'912', supports:'وضع اليمنى على اليسرى في قيام الصلاة عمومًا', supportsI18n:{"en": "Placing the right hand over the left while standing in prayer (in general)", "tr": "Namazda kıyamda sağ eli sol elin üzerine koymak (genel olarak)", "ur": "نماز کے قیام میں دایاں ہاتھ بائیں پر رکھنا (عمومی طور پر)"}, evidenceText:'يُسن وضع اليد اليمنى على اليسرى في القيام في جميع ركعات الصلاة' },
    'BUKHARI-1335': { sourceId:'SRC-BUKHARI', referenceId:'صحيح البخاري 1335', sourceUrl:'https://www.sunnah.com/bukhari:1335', language:'ar', evidenceStatus:'verified', num:'1335', supports:'قراءة الفاتحة في صلاة الجنازة سنّة', supportsI18n:{"en": "Reciting al-Fatiha in the funeral prayer is Sunnah", "tr": "Cenaze namazında Fâtiha okumak sünnettir", "ur": "نمازِ جنازہ میں فاتحہ پڑھنا سنت ہے"},
      evidenceText:'صَلَّيْتُ خَلْفَ ابْنِ عَبَّاسٍ عَلَى جَنَازَةٍ فَقَرَأَ بِفَاتِحَةِ الْكِتَابِ قَالَ لِيَعْلَمُوا أَنَّهَا سُنَّةٌ' },
    'NASAI-1989':   { sourceId:'SRC-NASAI', referenceId:'سنن النسائي 1989 (صحيح، دار السلام)', sourceUrl:'https://sunnah.com/nasai:1989', language:'ar', evidenceStatus:'verified', num:'1989', supports:'قراءة الفاتحة سرًّا في التكبيرة الأولى، والتسليم بعد التكبيرة الأخيرة', supportsI18n:{"en": "Reciting al-Fatiha quietly after the first takbir, and the salam after the last takbir", "tr": "Birinci tekbirden sonra Fâtiha'yı sessizce okumak ve son tekbirden sonra selam", "ur": "پہلی تکبیر کے بعد آہستہ فاتحہ پڑھنا، اور آخری تکبیر کے بعد سلام"},
      evidenceText:'السُّنَّةُ فِي الصَّلاَةِ عَلَى الْجَنَازَةِ أَنْ يَقْرَأَ فِي التَّكْبِيرَةِ الأُولَى بِأُمِّ الْقُرْآنِ مُخَافَتَةً ثُمَّ يُكَبِّرَ ثَلاَثًا وَالتَّسْلِيمُ عِنْدَ الآخِرَةِ' },
    'QURAN-1':      { sourceId:'SRC-QURAN', referenceId:'سورة الفاتحة (1: 1–7)', sourceUrl:'https://quran.com/al-fatihah', language:'ar', evidenceStatus:'verified', num:'1:1–7',
      translations:{
        en:{ text:'1. In the Name of Allah—the Most Compassionate, Most Merciful. 2. All praise is for Allah—Lord of all worlds, 3. the Most Compassionate, Most Merciful, 4. Master of the Day of Judgment. 5. You ˹alone˺ we worship and You ˹alone˺ we ask for help. 6. Guide us along the Straight Path, 7. the Path of those You have blessed—not those You are displeased with, or those who are astray.', translator:'Dr. Mustafa Khattab, The Clear Quran', url:'https://quranpedia.net/en/translations/1/13661' },
        tr:{ text:'1. Bismillâhirrahmânirrahîm 2. Hamt, âlemlerin Rabbi olan Allah\'a mahsustur. 3. O Rahmân\'dır, Rahîm\'dir. 4. Din/Hesap gününün sahibidir. 5. Yalnız sana ibadet eder ve yalnız senden yardım dileriz. 6. Bizi doğru yola ilet. 7. Nimet verdiğin kimselerin yoluna. Gazaba uğrayanların ve sapanların değil.', translator:'Rowwad Tercüme Merkezi — Kur\'ân-ı Kerîm Meâlleri Ansiklopedisi', url:'https://www.e-quran.com/quran-encyclopedia/translation/turkish_rwwad/1' },
        ur:{ text:'۱۔ شروع الله کا نام لے کر جو بڑا مہربان نہایت رحم والا ہے ۲۔ سب طرح کی تعریف خدا ہی کو (سزاوار) ہے جو تمام مخلوقات کا پروردگار ہے ۳۔ بڑا مہربان نہایت رحم والا ۴۔ انصاف کے دن کا حاکم ۵۔ (اے پروردگار) ہم تیری ہی عبادت کرتے ہیں اور تجھ ہی سے مدد مانگتے ہیں ۶۔ ہم کو سیدھے رستے چلا ۷۔ ان لوگوں کے رستے جن پر تو اپنا فضل وکرم کرتا رہا نہ ان کے جن پر غصے ہوتا رہا اور نہ گمراہوں کے', translator:'ترجمہ: مولانا فتح محمد جالندھری (surah.pk)', url:'https://www.surah.pk/surah-al-faatiha/ayahs/' } },
      supports:'نص سورة الفاتحة كاملًا', supportsI18n:{"en": "The full text of Surat al-Fatiha", "tr": "Fâtiha suresinin tam metni", "ur": "سورۂ فاتحہ کا مکمل متن"},
      evidenceText:'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ﴿١﴾ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ ﴿٢﴾ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ﴿٣﴾ مَـٰلِكِ يَوْمِ ٱلدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ ﴿٦﴾ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ ﴿٧﴾' },
    'BUKHARI-3370': { sourceId:'SRC-BUKHARI', referenceId:'صحيح البخاري 3370 (حديث كعب بن عجرة رضي الله عنه)', sourceUrl:'https://sunnah.com/bukhari:3370', language:'ar', evidenceStatus:'verified', num:'3370',
      translations:{ en:{ text:'O Allah! Send Your Mercy on Muhammad and on the family of Muhammad, as You sent Your Mercy on Abraham and on the family of Abraham, for You are the Most Praise-worthy, the Most Glorious. O Allah! Send Your Blessings on Muhammad and the family of Muhammad, as You sent your Blessings on Abraham and on the family of Abraham, for You are the Most Praise-worthy, the Most Glorious.', translator:'Sahih al-Bukhari 3370 — English translation (sunnah.com)', url:'https://sunnah.com/bukhari:3370' } },
      supports:'نص الصلاة الإبراهيمية كاملًا', supportsI18n:{"en": "The full text of the Ibrahimi blessings", "tr": "İbrahimî salavatın tam metni", "ur": "درودِ ابراہیمی کا مکمل متن"},
      evidenceText:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ، وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ، وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ، وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ' },
    'DORAR-3370':   { sourceId:'SRC-DORAR-HADITH', referenceId:'شرح حديث كعب بن عجرة (صحيح البخاري 3370)', sourceUrl:'https://dorar.net/hadith/sharh/150767', language:'ar', evidenceStatus:'verified', num:'3370',
      supports:'أن هذه هي صفة الصلاة على النبي ﷺ في التشهد', supportsI18n:{"en": "That this is how blessings on the Prophet ﷺ are said in the tashahhud", "tr": "Teşehhütte Peygamber'e ﷺ salavatın bu şekilde olduğu", "ur": "کہ تشہد میں نبی ﷺ پر درود اسی طرح پڑھا جاتا ہے"},
      evidenceText:'كيفَ نُصلِّي علَيْكُم يا أهْلَ بَيتِ النُّبوَّةِ في التَّشهُّدِ في الصَّلاةِ' },
    'ABUDAWUD-996': { sourceId:'SRC-ABUDAWUD', referenceId:'سنن أبي داود 996 (حديث ابن مسعود رضي الله عنه — صفة التسليم في الصلاة)', sourceUrl:'https://sunnah.com/abudawud:996', language:'ar', evidenceStatus:'verified', num:'996',
      supports:'صيغة التسليم', supportsI18n:{"en": "The wording of the salam", "tr": "Selamın lafzı", "ur": "سلام کے الفاظ"},
      evidenceText:'كَانَ يُسَلِّمُ عَنْ يَمِينِهِ وَعَنْ شِمَالِهِ حَتَّى يُرَى بَيَاضُ خَدِّهِ: السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ، السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ' },
    'NASAI-1983':   { sourceId:'SRC-NASAI', referenceId:'سنن النسائي 1983 — كتاب الجنائز', sourceUrl:'https://sunnah.com/nasai:1983', language:'ar', evidenceStatus:'verified', num:'1983',
      translations:{ en:{ text:'O Allah, forgive him and have mercy on him, forgive him and keep him safe and sound, honor the place where he settles and make his entrance wide; wash him with water and snow and hail, and cleanse him of his sin as a white garment is cleansed of dirt.', translator:"Sunan an-Nasa'i 1983 — English (sunnah.com)", url:'https://sunnah.com/nasai:1983' } }, supports:'نص دعاء الميت المأثور كاملًا', supportsI18n:{"en": "The full text of the reported supplication for the deceased", "tr": "Ölü için rivayet edilen duanın tam metni", "ur": "میت کے لیے منقول دعا کا مکمل متن"},
      evidenceText:'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَاعْفُ عَنْهُ وَعَافِهِ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِمَاءٍ وَثَلْجٍ وَبَرَدٍ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا يُنَقَّى الثَّوْبُ الأَبْيَضُ مِنَ الدَّنَسِ' },
    'IBNMAJAH-1503':{ sourceId:'SRC-IBNMAJAH', referenceId:'سنن ابن ماجه 1503 (حديث عبد الله بن أبي أوفى رضي الله عنه)', sourceUrl:'https://sunnah.com/ibnmajah:1503', language:'ar', evidenceStatus:'verified', num:'1503',
      supports:'الوقوف قليلًا بعد التكبيرة الرابعة ثم التسليم', supportsI18n:{"en": "Pausing briefly after the fourth takbir, then the salam", "tr": "Dördüncü tekbirden sonra biraz durmak, sonra selam", "ur": "چوتھی تکبیر کے بعد تھوڑا ٹھہرنا، پھر سلام"}, gradeNote:'مختلف في درجته: ضعّفه دار السلام (sunnah.com)، وحسّنته موسوعة الأحاديث النبوية (HadeethEnc 8872).',
      evidenceText:'كَانَ يُكَبِّرُ أَرْبَعًا ثُمَّ يَمْكُثُ سَاعَةً فَيَقُولُ مَا شَاءَ اللَّهُ أَنْ يَقُولَ ثُمَّ يُسَلِّمُ' },
    'ABUDAWUD-996-SALAM': { sourceId:'SRC-ABUDAWUD', referenceId:'سنن أبي داود 996 — صيغة التسليم', sourceUrl:'https://sunnah.com/abudawud:996', language:'ar', evidenceStatus:'verified', num:'996',
      supports:'صيغة التسليم', supportsI18n:{"en": "The wording of the salam", "tr": "Selamın lafzı", "ur": "سلام کے الفاظ"}, evidenceText:'السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
      translations:{ en:{ text:'Peace be upon you, and mercy of Allah.', translator:'Sunan Abi Dawud 996 — English translation (sunnah.com)', url:'https://sunnah.com/abudawud:996' } } },
    'HADEETHENC-8872-TASLIM':{ sourceId:'SRC-HADEETHENC', referenceId:'شرح حديث عبد الله بن أبي أوفى — رواية أخرى', sourceUrl:'https://hadeethenc.com/en/browse/hadith/8872', language:'en', evidenceStatus:'verified', num:'8872',
      supports:'التسليم عن اليمين وعن الشمال في صلاة الجنازة (في رواية)', supportsI18n:{"en": "Giving the salam to the right and to the left in the funeral prayer (in one narration)", "tr": "Cenaze namazında sağa ve sola selam (bir rivayette)", "ur": "نمازِ جنازہ میں دائیں اور بائیں سلام (ایک روایت میں)"},
      evidenceText:'Then, he made Taslīm to the right and to the left.' },
    'HADEETHENC-8872':{ sourceId:'SRC-HADEETHENC', referenceId:'شرح حديث عبد الله بن أبي أوفى (رواه ابن ماجه والحاكم)', sourceUrl:'https://hadeethenc.com/en/browse/hadith/8872', language:'en', evidenceStatus:'verified', num:'8872', supports:'ترتيب الخطوات: الفاتحة، ثم الصلاة على النبي ﷺ بعد الثانية، ثم الدعاء للميت بعد الثالثة', supportsI18n:{"en": "The order of the steps: al-Fatiha, then blessings on the Prophet ﷺ after the second, then supplication for the deceased after the third", "tr": "Adımların sırası: Fâtiha, ikinciden sonra salavat, üçüncüden sonra ölüye dua", "ur": "مراحل کی ترتیب: فاتحہ، پھر دوسری کے بعد درود، پھر تیسری کے بعد میت کے لیے دعا"},
      evidenceText:'recites Sūrat al-Fātihah, makes a second Takbīr, invokes Allah\'s peace and blessings upon the Prophet, makes a third Takbīr, supplicates for the dead person' }
  };

  /* details read on each opened page (2026-10-06). Fields missing on the page are left out, never filled in. */
  const VERIFIED_ON = '2026-10-06';
  const DETAILS = {
    'BUKHARI-3881':   { narrator:'أبو هريرة رضي الله عنه', number:'3881' },
    'BUKHARI-1335':   { narrator:'طلحة بن عبد الله بن عوف (عن ابن عباس رضي الله عنهما)', number:'1335' },
    'BUKHARI-3370':   { narrator:'كعب بن عجرة رضي الله عنه', number:'3370' },
    'NASAI-1989':     { narrator:'أبو أمامة بن سهل', number:'1989', grade:'صحيح (دار السلام)' },
    'NASAI-1983':     { narrator:'عوف بن مالك رضي الله عنه', number:'1983', grade:'صحيح (دار السلام)' },
    'ABUDAWUD-996':   { narrator:'عبد الله بن مسعود رضي الله عنه', number:'996', grade:'صحيح (الألباني)' },
    'ABUDAWUD-996-SALAM': { narrator:'عبد الله بن مسعود رضي الله عنه', number:'996', grade:'صحيح (الألباني)' },
    'IBNMAJAH-1503':  { narrator:'عبد الله بن أبي أوفى رضي الله عنه', number:'1503', grade:'ضعيف (دار السلام)' },
    'HADEETHENC-8872':{ narrator:'عبد الله بن أبي أوفى رضي الله عنه', grade:'حسن', book:'رواه ابن ماجه والحاكم' },
    'HADEETHENC-8872-TASLIM':{ narrator:'عبد الله بن أبي أوفى رضي الله عنه', grade:'حسن', book:'رواه ابن ماجه والحاكم' },
    'DORAR-SHARH-209419': { narrator:'عبد الله بن مسعود رضي الله عنه', book:'البيهقي 7239', grade:'إسناده جيد (النووي، خلاصة الأحكام 2/982)' },
    'DORAR-3370':     { narrator:'كعب بن عجرة رضي الله عنه', book:'صحيح البخاري 3370' },
    // the page itself grades this chain weak: kept for the record, never shown as confirmed evidence
    'TIRMIDHI-1077-HANDS': { narrator:'أبو هريرة رضي الله عنه', book:'الترمذي 1077', grade:'في إسناده ضعف (ابن حجر، الدراية 1/236)', verificationStatus:'needs_review' }
  };
  Object.entries(EVIDENCE).forEach(([id, e]) => {
    const d = DETAILS[id] || {};
    e.verificationStatus = d.verificationStatus || (e.evidenceStatus === 'verified' && e.sourceUrl ? 'verified' : 'unverified');
    e.verifiedOn = e.verificationStatus === 'verified' ? VERIFIED_ON : null;
    e.topic = e.topic || 'funeral_prayer';
    ['narrator','number','grade','book'].forEach(k => { if (d[k]) e[k] = d[k]; });
    delete e.evidenceStatus;
  });
  /* funeral-prayer steps: one record per step, used everywhere the steps are shown */
  const FACTS = {
    'JAN-STEP-1': { i18n:{"directive": {"en": "Say the takbir, then recite Surat al-Fatiha.", "tr": "Tekbir al, sonra Fâtiha suresini oku.", "ur": "تکبیر کہیں، پھر سورۂ فاتحہ پڑھیں۔"}, "detail": {"en": "Say the first takbir, then recite Surat al-Fatiha quietly:", "tr": "Birinci tekbiri al, sonra Fâtiha suresini sessizce oku:", "ur": "پہلی تکبیر کہیں، پھر آہستہ سورۂ فاتحہ پڑھیں:"}}, concept_id:'first_takbir', titleKey:'q.step1', shortKey:'q.step1d',
      directive:'كبّر، ثم اقرأ سورة الفاتحة.',
      detail:'كبّر التكبيرة الأولى، ثم اقرأ سورة الفاتحة سرًّا:', recitation:'QURAN-1', evidence:['NASAI-1989','BUKHARI-1335','QURAN-1'] },
    'JAN-STEP-2': { i18n:{"directive": {"en": "Say the takbir, then send blessings on the Prophet ﷺ as you do in the final tashahhud.", "tr": "Tekbir al, sonra son teşehhütte olduğu gibi Peygamber'e ﷺ salavat getir.", "ur": "تکبیر کہیں، پھر نبی ﷺ پر اسی طرح درود پڑھیں جیسے آخری تشہد میں پڑھتے ہیں۔"}, "detail": {"en": "Say the second takbir, then send the Ibrahimi blessings on the Prophet ﷺ — as you say them in the tashahhud, without at-tahiyyat:", "tr": "İkinci tekbiri al, sonra Peygamber'e ﷺ İbrahimî salavatı getir — teşehhütte söylediğin gibi, Ettehiyyâtü olmadan:", "ur": "دوسری تکبیر کہیں، پھر نبی ﷺ پر درودِ ابراہیمی پڑھیں — جیسے تشہد میں پڑھتے ہیں، التحیات کے بغیر:"}}, concept_id:'second_takbir', titleKey:'q.step2', shortKey:'q.step2d',
      directive:'كبّر، ثم صلِّ على النبي ﷺ كما تصلّي عليه في التشهد الأخير.',
      detail:'كبّر الثانية، ثم صلِّ على النبي ﷺ بالصلاة الإبراهيمية — كما تصلّي عليه في التشهد، دون التحيات:', recitation:'BUKHARI-3370', evidence:['HADEETHENC-8872','BUKHARI-3370','DORAR-3370','DORAR-FIQH-1970'] },
    'JAN-STEP-3': { i18n:{"directive": {"en": "Say the takbir, then supplicate for the deceased.", "tr": "Tekbir al, sonra ölü için dua et.", "ur": "تکبیر کہیں، پھر میت کے لیے دعا کریں۔"}, "detail": {"en": "Say the third takbir, then supplicate for the deceased. One reported supplication is:", "tr": "Üçüncü tekbiri al, sonra ölü için dua et. Rivayet edilen dualardan biri:", "ur": "تیسری تکبیر کہیں، پھر میت کے لیے دعا کریں۔ منقول دعاؤں میں سے ایک یہ ہے:"}}, concept_id:'third_takbir', titleKey:'q.step3', shortKey:'q.step3d',
      directive:'كبّر، ثم ادعُ للميت.',
      detail:'كبّر الثالثة، ثم ادعُ للميت، ومن الدعاء المأثور:', recitation:'NASAI-1983', evidence:['HADEETHENC-8872','NASAI-1983'] },
    'JAN-STEP-4': { i18n:{"directive": {"en": "Say the takbir, pause briefly, then give the salam to your right.", "tr": "Tekbir al, biraz bekle, sonra sağ tarafına selam ver.", "ur": "تکبیر کہیں، تھوڑا ٹھہریں، پھر دائیں طرف سلام پھیریں۔"}, "detail": {"en": "Say the fourth takbir, pause briefly, then give the salam to your right, saying:", "tr": "Dördüncü tekbiri al, biraz bekle, sonra sağ tarafına şöyle selam ver:", "ur": "چوتھی تکبیر کہیں، تھوڑا ٹھہریں، پھر دائیں طرف یہ کہتے ہوئے سلام پھیریں:"}, "note": {"en": "In one narration of Ibn Abi Awfa's hadith, he gave the salam to his right and to his left.", "tr": "İbn Ebî Evfâ hadisinin bir rivayetinde sağına ve soluna selam verdi.", "ur": "ابن ابی اوفیٰ کی حدیث کی ایک روایت میں ہے کہ آپ نے دائیں اور بائیں سلام پھیرا۔"}}, concept_id:'fourth_takbir', titleKey:'q.step4', shortKey:'q.step4d',
      directive:'كبّر، ثم قف قليلًا، ثم سلّم عن يمينك.',
      detail:'كبّر الرابعة، ثم قف قليلًا، ثم سلّم عن يمينك قائلًا:', recitation:'ABUDAWUD-996-SALAM',
      note:'وفي رواية لحديث ابن أبي أوفى: سلّم عن يمينه وعن شماله.', evidence:['IBNMAJAH-1503','NASAI-1989','ABUDAWUD-996-SALAM','HADEETHENC-8872-TASLIM'] }
  };
  /* Indexed claims for the guide. Each claim = one answerable statement + the evidence that supports it.
     `terms` are concept vocabulary (multilingual) used by semantic retrieval — not stored questions. */
  const CLAIMS = {
    'CL-COUNT':   { topic:'funeral_prayer', concept:'takbir_count', facets:['count','structure','overview'],
      terms:'عدد تكبير تكبيرات تكبيره كم اربع number count how many takbir takbirs kac tekbir sayi کتنی تکبیر تعداد',
      answer:{ ar:'صلاة الجنازة أربع تكبيرات.', en:'The funeral prayer has four takbirs.', tr:'Cenaze namazı dört tekbirdir.', ur:'نمازِ جنازہ میں چار تکبیریں ہیں۔' },
      simple:{ ar:'تكبّر أربع مرات، وبين كل تكبيرة والأخرى قراءة أو دعاء.', en:'You say the takbir four times, with a recitation or supplication in between.', tr:'Dört kez tekbir alırsın; aralarında okuma veya dua vardır.', ur:'آپ چار بار تکبیر کہتے ہیں، اور ان کے درمیان قراءت یا دعا ہوتی ہے۔' },
      evidence:['BUKHARI-3881','HADEETHENC-8872'] },
    'CL-STRUCTURE': { topic:'funeral_prayer', concept:'posture_standing', facets:['ruku','sujud','structure','compare'],
      terms:'ركوع ركع اركع سجود سجد اسجد سجده جلوس تشهد مثل عاديه العاديه المعتاده الفريضه هيئه صفه فرق bow bowing ruku prostrat sujud sajda like normal regular same different ruku rüku secde secde normal namaz gibi fark رکوع سجدہ سجده عام نماز طرح فرق',
      statement:{ ar:'صلاة الجنازة كلها قيام، ليس فيها ركوع ولا سجود.' },   // the lesson sentence (same evidence as the answer)
      answer:{ ar:'لا، ليس في صلاة الجنازة ركوع ولا سجود؛ وإنما فيها تكبير وتسليم.', en:'No. The funeral prayer has no bowing (rukūʿ) and no prostration (sujūd); it consists of takbirs and the salam.', tr:'Hayır. Cenaze namazında rükû ve secde yoktur; tekbirler ve selamdan oluşur.', ur:'نہیں، نمازِ جنازہ میں نہ رکوع ہے نہ سجدہ؛ اس میں تکبیریں اور سلام ہیں۔' },
      simple:{ ar:'تختلف عن الصلاة المعتادة: تكبّر أربع تكبيرات، ثم تسلّم، دون ركوع أو سجود.', en:'It differs from regular prayer: you say four takbirs, then the salam — with no bowing or prostration.', tr:'Normal namazdan farklıdır: dört tekbir alır, sonra selam verirsin; rükû ve secde yoktur.', ur:'یہ عام نماز سے مختلف ہے: چار تکبیریں کہیں، پھر سلام پھیریں — رکوع اور سجدہ نہیں۔' },
      evidence:['DORAR-FIQH-1958','DORAR-SHARH-209419'] },
    'CL-STEP-1': { topic:'funeral_prayer', concept:'first_takbir', facets:['step','say','overview'], ord:1, fact:'JAN-STEP-1',
      terms:'اولي الاول اول تكبيره الاولي فاتحه الفاتحه ام الكتاب اقرا اقرأ قراءه first opening fatiha recite birinci fatiha oku پہلی فاتحہ پڑھ' },
    'CL-STEP-2': { topic:'funeral_prayer', concept:'second_takbir', facets:['step','say','overview'], ord:2, fact:'JAN-STEP-2',
      terms:'ثانيه الثانيه ثاني صلاه علي النبي الابراهيميه صلوات درود اقول second blessings salawat prophet ikinci salavat دوسری درود نبی',
      },
    'CL-STEP-3': { topic:'funeral_prayer', concept:'third_takbir', facets:['step','say','dua','overview'], ord:3, fact:'JAN-STEP-3',
      terms:'ثالثه الثالثه ثالث دعاء الدعاء للميت الميت ادعو ادعي اغفر third supplication dua deceased dead forgive üçüncü dua ölü ölüye تیسری دعا میت',
      },
    'CL-STEP-4': { topic:'funeral_prayer', concept:'fourth_takbir', facets:['step','say','salam','overview'], ord:4, fact:'JAN-STEP-4',
      terms:'رابعه الرابعه رابع اخيره الاخيره سلام السلام التسليم اسلم انهي fourth last salam end finish dördüncü son selam bitir چوتھی آخری سلام',
      },
    'CL-TASLIM-COUNT': { topic:'funeral_prayer', concept:'taslim_count', facets:['salam','disputed'],
      terms:'كم تسليمه تسليمتين تسليمه واحده مره مرتين يمين يسار شمال how many salams once twice right left kaç selam bir iki sağ sol کتنی سلام ایک دو دائیں بائیں',
      answer:{ ar:'في عدد التسليم خلاف بين أهل العلم: فقيل تسليمتان، وقيل تسليمة واحدة.', en:'Scholars differ on the number of salams: some say two, others say one.', tr:'Selam sayısında âlimler arasında ihtilaf vardır: kimi iki, kimi bir selam der.', ur:'سلام کی تعداد میں اہلِ علم کا اختلاف ہے: بعض دو کہتے ہیں اور بعض ایک۔' },
      simple:{ ar:'المسألة فيها خلاف بين أهل العلم، ولا تُعرض بقول واحد قطعي.', en:'This is a matter of scholarly difference, so it is not presented as one definitive view.', tr:'Bu, âlimler arasında ihtilaflı bir meseledir; tek ve kesin bir görüş olarak sunulmaz.', ur:'یہ اہلِ علم کے درمیان اختلافی مسئلہ ہے، اس لیے اسے ایک قطعی رائے کے طور پر پیش نہیں کیا جاتا۔' },
      evidence:['DORAR-SHARH-209419','HADEETHENC-8872-TASLIM'] }
  };
  /* Demonstrator timeline — every body action is bound to evidence. Actions that scholars differ on carry `disputed`. */
  const ANIMATION = { janaza: [
    { stepId:'A0-STAND', titleKey:'demo.t.stand', bodyAction:'stand_facing_qibla', seq:[['rest',600,900]],
      say:{ ar:'قف مستقبلًا القبلة. صلاة الجنازة كلها قيام، ليس فيها ركوع ولا سجود.', en:'Stand facing the qibla. The whole funeral prayer is performed standing, with no bowing or prostration.', tr:'Kıbleye dönerek ayakta dur. Cenaze namazının tamamı ayakta kılınır; rükû ve secde yoktur.', ur:'قبلہ رخ کھڑے ہوں۔ نمازِ جنازہ پوری قیام میں ہے، اس میں رکوع اور سجدہ نہیں۔' },
      evidence:['DORAR-FIQH-1958-QIBLA','DORAR-FIQH-1958'] },
    { stepId:'A1-TAKBIR-1', titleKey:'q.step1', bodyAction:'takbir_raise_then_fold', fact:'JAN-STEP-1', takbir:true,
      seq:[['rest',300,250],['raise',900,700,'takbir'],['fold',900,600]],
      evidence:['DORAR-FIQH-1978-RAISE1','ISLAMONLINE-HEIGHT','DORAR-FIQH-912-HANDS'],   // TIRMIDHI-1077 removed: graded weak on its page
      disputed:{ hands:true } },
    { stepId:'A2-TAKBIR-2', titleKey:'q.step2', bodyAction:'takbir_then_fold', fact:'JAN-STEP-2', takbir:true, raiseDisputed:true,
      seq:[['raise',800,500,'takbir'],['fold',800,600]], seqNoRaise:[['fold',400,900,'takbir']], evidence:['DORAR-FIQH-1978-RAISEALL'], disputed:{ raise:true, hands:true } },
    { stepId:'A3-TAKBIR-3', titleKey:'q.step3', bodyAction:'takbir_then_fold', fact:'JAN-STEP-3', takbir:true, raiseDisputed:true,
      seq:[['raise',800,500,'takbir'],['fold',800,600]], seqNoRaise:[['fold',400,900,'takbir']], evidence:['DORAR-FIQH-1978-RAISEALL'], disputed:{ raise:true, hands:true } },
    { stepId:'A4-TAKBIR-4', titleKey:'q.step4', bodyAction:'takbir_then_pause', fact:'JAN-STEP-4', takbir:true, raiseDisputed:true,
      seq:[['raise',800,500,'takbir'],['fold',800,1600]], seqNoRaise:[['fold',400,1800,'takbir']], evidence:['DORAR-FIQH-1978-RAISEALL'], disputed:{ raise:true, hands:true } },
    { stepId:'A5-SALAM', titleKey:'demo.t.salam', bodyAction:'salam_turn_right', seq:[['salamR',1000,1200],['fold',800,300]], seqBoth:[['salamR',1000,1000],['fold',700,200],['salamL',1000,1000],['fold',700,200]],
      say:{ ar:'سلّم عن يمينك: «السلام عليكم ورحمة الله».', en:'Give the salam to your right: “As-salāmu ʿalaykum wa raḥmatullāh”.', tr:'Sağ tarafına selam ver: “Esselâmü aleyküm ve rahmetullah”.', ur:'دائیں طرف سلام پھیریں: «السلام علیکم ورحمۃ اللہ»۔' },
      recitation:'ABUDAWUD-996-SALAM', evidence:['ABUDAWUD-996-SALAM','HADEETHENC-8872-TASLIM','DORAR-SHARH-209419'], disputed:{ salam:true } }
  ] };
  const JOURNEYS = { janaza:['JAN-STEP-1','JAN-STEP-2','JAN-STEP-3','JAN-STEP-4'] };

  const R = SK.sources = {
    SOURCES, EVIDENCE, FACTS, JOURNEYS, CLAIMS, ANIMATION,
    source: id => SOURCES[id] || null,
    /** one evidence record in the shared schema:
        { id, topic, title, sourceName, reference, evidenceText, sourceUrl, verificationStatus, language, book?, narrator?, number?, grade? } */
    evidence: id => { const e = EVIDENCE[id]; if (!e) return null; const s = SOURCES[e.sourceId] || {};
      return { id, ...e, title:e.supports, reference:e.referenceId, sourceName:s.sourceName, sourceType:s.sourceType, book: e.book || (s.sourceType === 'hadith_collection' ? s.sourceName : undefined) }; },
    /** evidence that may be shown as a confirmed source (verified, with a checked URL) */
    shownEvidence: ids => (ids || []).map(x => typeof x === 'string' ? R.evidence(x) : x).filter(e => e && e.verificationStatus === 'verified' && e.sourceUrl),
    /** ===== the learning content of a concept, from the registry only =====
        { ok, text(lang), evidence[], recitation:{ text, evidenceId, translation } | null } — used by every learning screen */
    forConcept(conceptId, lang = SK.i18n.lang()){
      const FACT_OF = { first_takbir:'JAN-STEP-1', second_takbir:'JAN-STEP-2', third_takbir:'JAN-STEP-3', fourth_takbir:'JAN-STEP-4' };
      const CLAIM_OF = { takbir_count:'CL-COUNT', posture_standing:'CL-STRUCTURE' };
      if (FACT_OF[conceptId]){ const g = R.guard(FACT_OF[conceptId]); if (!g.ok) return { ok:false, message:g.message };
        const recEv = g.fact.recitation ? R.evidence(g.fact.recitation) : null;
        const recitation = recEv ? { text: recEv.evidenceText, evidenceId: recEv.id, translation: g.translation, evidence:[recEv] } : null;
        return { ok:true, kind:'fact', id:g.fact.id, text: R.text(g.fact, 'detail', lang), evidence: g.evidence, recitation,
          // content kinds: only `recitable` is offered for «ردّد معي»
          blocks:[ { type:'instruction', text: R.text(g.fact, 'detail', lang) }, recitation ? { type:'recitable', text: recitation.text, evidenceId: recitation.evidenceId, language:'ar' } : null,
                   { type:'evidence', ids: g.evidence.map(e => e.id) } ].filter(Boolean) }; }
      const c = CLAIM_OF[conceptId] && CLAIMS[CLAIM_OF[conceptId]];
      if (c){ const ev = (c.evidence || []).map(R.evidence);
        if (!ev.length || ev.some(e => !e || e.verificationStatus !== 'verified')) return { ok:false, message:R.REFUSAL };
        const text = (c.statement && c.statement[lang]) || c.answer[lang] || c.answer.ar;
        return { ok:true, kind:'claim', id:CLAIM_OF[conceptId], text, evidence: ev, recitation:null,
          blocks:[ { type:'explanation', text }, { type:'evidence', ids: ev.map(e => e.id) } ] }; }
      return { ok:false, message:R.REFUSAL };
    },
    /** ===== Evidence Guard =====
        A fact may be shown only if every piece of evidence it cites exists in the registry and is verified.
        Otherwise the caller shows the refusal message instead of any content. */
    guard(factId){
      const f = FACTS[factId];
      if (!f) return { ok:false, reason:'NO_FACT', message:R.REFUSAL };
      const ev = (f.evidence || []).map(R.evidence);
      if (!ev.length || ev.some(e => !e || e.verificationStatus !== 'verified')){
        SK.services.retrieval && SK.services.retrieval.logEvent('EVIDENCE_GUARD_BLOCKED', { factId });
        return { ok:false, reason:'NO_VERIFIED_EVIDENCE', message:R.REFUSAL };
      }
      return { ok:true, fact:{ id:factId, ...f, recitationText: f.recitationText || (f.recitation ? (R.evidence(f.recitation)||{}).evidenceText : null) }, evidence:ev,
        translation: f.recitation ? R.translation(f.recitation) : null };
    },
    /** text of a fact field in the interface language (falls back to the Arabic original) */
    text(fact, field, lang = SK.i18n.lang()){ return lang !== 'ar' && fact.i18n && fact.i18n[field] && fact.i18n[field][lang] ? fact.i18n[field][lang] : fact[field]; },
    sourceName(e, lang = SK.i18n.lang()){ const s = SOURCES[e.sourceId] || {}; return lang !== 'ar' && s.sourceNameI18n && s.sourceNameI18n[lang] ? s.sourceNameI18n[lang] : s.sourceName; },
    reference(e, lang = SK.i18n.lang()){ return lang === 'ar' ? e.referenceId : `${R.sourceName(e, lang)} — ${e.num || ''}`.trim(); },
    supports(e, lang = SK.i18n.lang()){ return lang !== 'ar' && e.supportsI18n && e.supportsI18n[lang] ? e.supportsI18n[lang] : e.supports; },
    /** approved translation of a recitation in the interface language, or null (never generated) */
    translation(evId, lang = SK.i18n.lang()){ const e = EVIDENCE[evId]; return lang !== 'ar' && e && e.translations && e.translations[lang] ? e.translations[lang] : null; },
    /** demonstrator steps that pass the guard (a step without verified evidence is not shown) */
    animation(topic){ return (ANIMATION[topic] || []).map(a => {
      const fg = a.fact ? R.guard(a.fact) : null;
      const ev = [...(fg && fg.ok ? fg.evidence : []), ...a.evidence.map(R.evidence)].filter((e,i,arr) => e && arr.findIndex(x => x && x.id === e.id) === i);
      const ok = ev.length && ev.every(e => e.verificationStatus === 'verified') && (!a.fact || (fg && fg.ok));
      return ok ? { ...a, ok:true, fact: fg ? fg.fact : null, translation: fg ? fg.translation : (a.recitation ? R.translation(a.recitation) : null), evidence:ev,
                    recitationText: fg ? fg.fact.recitationText : (a.recitation ? (R.evidence(a.recitation)||{}).evidenceText : null) } : { stepId:a.stepId, ok:false }; }); },
    steps(topic){ return (JOURNEYS[topic] || []).map(id => R.guard(id)); },
    get REFUSAL(){ return SK.t ? SK.t('src.refusal') : 'لم أجد في مصادر سكينة المعتمدة ما يكفي للإجابة عن هذا السؤال.'; }
  };
})(window.SK);
