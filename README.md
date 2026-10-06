# سكينة | Sakeenah

تجربة تعليمية ذكية لتعلّم العبادات في لحظة الحاجة. النسخة الأولى: **صلاة الجنازة**.

الرحلة الأساسية: اختبار الفهم ← اكتشاف الالتباس ← شرح ما يحتاجه المستخدم فقط ← إظهار المصدر ← إعادة الاختبار ← قياس التحسن.

## التشغيل

### المتطلبات
- Node.js 18 أو أحدث (لا توجد حزم لتثبيتها).
- اختياري لميزة «ردّد معي»: مفتاح خدمة تحويل الصوت إلى نص (OpenAI أو Groq).

### محليًا
```bash
npm run build      # يجهّز مجلد public/ ويتحقق من وجود كل الصور والفيديو والصوت
npm run preview    # http://localhost:3000
```
لتفعيل «ردّد معي» محليًا: انسخ `.env.example` إلى `.env` واملأ `STT_API_KEY`، ثم شغّل المعاينة بعد تحميل المتغيرات
(مثال: `set -a; . ./.env; set +a; npm run preview`). بدون المفتاح يعمل التطبيق كاملًا ويظهر أن التحقق الصوتي غير مفعّل.

### النشر (GitHub → Vercel)
الخطوات الكاملة في `DEPLOY.md`. باختصار: Import المستودع في Vercel، لا تغيّر الإعدادات (تُقرأ من `vercel.json`)،
وأضف `STT_API_KEY` في Environment Variables.

### نسخة الملف الواحد
`python3 build.py` ← `dist/sakeenah.html` (كل الأصول مضمّنة؛ تُستخدم لعرض Claude).

### الخصوصية والأمان
- المفاتيح في متغيرات البيئة على الخادم فقط (`api/stt.js`)، ولا يوجد أي مفتاح في الكود.
- تسجيلات «ردّد معي» تُرسل للتحقق ثم تُهمل؛ لا تُخزَّن.
- تقدّم المتعلم يُحفظ في متصفحه فقط (بطاقة سكينة)، ولا تُرفع بيانات مستخدمين للمستودع.
- سجل المصادر الشرعية: `SOURCES_AUDIT.md`.

## البنية
```
src/
  core.js              مساحة الأسماء SK، دالة h() لبناء العناصر، والمخزن (store)
  router.js            التنقل بين الشاشات والانتقالات
  main.js              نقطة البداية
  styles.css           الهوية البصرية والمكونات
  data/knowledge.js    قاعدة المعرفة (المفاهيم، الشرح، الأسئلة، المصادر) — مسودة للمراجعة الشرعية
  data/i18n.js         اللغات والعبادات
  services/analyzer.js محلّل الفهم (نسخة Demo محلية) — يُستبدل لاحقًا بالذكاء الاصطناعي + RAG
  services/speech.js   الإدخال الصوتي والنطق (من المتصفح)
  services/progress.js حفظ التقدم — يُربط لاحقًا ببطاقة سكينة (QR)
  components/ui.js     المكونات القابلة لإعادة الاستخدام
  screens/screens.js   الشاشات
```

## محرك الفهم (Understanding Engine)
- `src/services/analyzer.js` — `SK.services.understanding.analyzeUnderstanding(answer)` يعيد JSON منظّمًا: mastered, missing, confused, out_of_scope, no_source, score, priority_concepts, evidence. المحرك الحالي `demo` يبني خطًا زمنيًا (أي فعل بعد أي تكبيرة) ولا يكتفي بالكلمات المفتاحية. محوّل `llm` جاهز (prompt + validate) لربط نموذج لغوي لاحقًا.
- `src/data/knowledge.js` — خريطة المفاهيم بمعرّفات ثابتة، وقاعدة المعرفة (KB-JAN-001…006) بحالة `pending_review`، وبنك أسئلة الاختبار البعدي.
- `src/services/retrieval.js` — المفهوم ← عنصر المعرفة ← approved_text ← المصدر. عند غياب المصدر: رسالة عدم المعرفة وحدث `NO_SOURCE_FOUND`.
- `src/data/testCases.js` + `src/screens/dev.js` — وضع اختبار المطوّر: اضغط شعار «سكينة» 5 مرات في شاشة البداية، أو افتح الرابط مع `#dev`.

## بطاقة سكينة والتقدم
- `src/services/storage.js` — خدمة التخزين الوحيدة (محوّل LocalStorage الآن، ويُستبدل بقاعدة بيانات لاحقًا). السجلات مربوطة دائمًا بـ cardId (رمز البطاقة): `sk:card:<cardId>` للهوية، و`sk:progress:<cardId>` للتقدم (`journeys.funeral_prayer`). تتضمن ترحيل بطاقات النسخة الأولى دون حذفها.
- `loadProfile(cardId)` و`saveProgress(cardId, journeyId, data)` — يُستدعى الحفظ بعد التحليل، وعند كل خطوة، وبعد كل إجابة صحيحة، وعند الإنهاء.
- `src/services/progress.js` — `computeProgress()` تعريف واحد للنسبة في كل الشاشات، و`resume()` يكمل من أول مفهوم غير مكتمل.

## «اسأل سكينة» (Trusted AI Assistant)
- `src/data/assistantKnowledge.js` — سجلات المساعد: `id, topic, questionVariants, content, passage, source{title,reference,url}, reviewStatus`.
- `src/services/assistant/knowledgeService.js` · `retrievalService.js` · `evidenceService.js` · `assistantService.js`
- المسار: السؤال ← `normalizeArabic` ← `retrieveRelevantKnowledge` ← `checkEvidence` (SUPPORTED / INSUFFICIENT / CONFLICTING) ← `generateGroundedAnswer` (استخراجي فقط) ← بطاقة المصدر.
- اختبارات A/B/C في وضع اختبار المطوّر.

## مرشد سكينة
- `src/screens/guide.js` — الأيقونة (قوس + فانوس)، الزر العائم، ولوحة المرشد.
- `src/services/assistant/guideContext.js` — سياق الصفحة (الشاشة، المفهوم الحالي، التقدم، نقاط المراجعة) وتحويل «وش أسوي بعدها؟» إلى سؤال صريح يمر عبر نفس Evidence Gate.
- في شاشات الاختبار لا يجيب المرشد عن المحتوى حتى لا يُفسد القياس.

## المرشد المتكيّف
- `src/services/assistant/guideBrain.js` — `loadProfileContext()` (من بطاقة سكينة أو رحلة الضيف)، و`classifyIntent()` (NAVIGATION / LEARNING_HELP / RELIGIOUS_QUESTION / SOURCE_REQUEST / UNKNOWN)، و`getAdaptiveSuggestions(userProgress, currentContext)` (3 اقتراحات كحد أقصى، بلا معلومات دينية).
- NAVIGATION لا يستدعي الاسترجاع؛ RELIGIOUS_QUESTION وLEARNING_HELP يمران عبر Evidence Gate الحالي.
- Demo Details: من وضع اختبار المطوّر فعّل «إظهار Demo Details داخل مرشد سكينة».

## وضع الحرم (Haram Mode)
- `src/screens/haram.js` — تجربة سريعة مستقلة: «ماذا تحتاج الآن؟» ← مساعدة سريعة / تعلّم سريع / أكمل رحلتي، مع «قل ما تحتاجه»، وزر اللغة، و«واجهة مبسطة».
- يستخدم المحتوى الموجود فقط: السجلات الموثقة عندما توجد، وإلا نص الرحلة مع وسم «المصدر قيد التوثيق».
- يُشغَّل يدويًا. لا GPS ولا اكتشاف للموقع (التفعيل حسب الموقع تحسين مستقبلي).

## تعدد اللغات (i18n)
- `src/i18n/translations.js` — قاموس مركزي `{ ar, en, tr, ur }` بمفاتيح مثل `start.begin`، `gd.name`، `card.title`، `hm.title`.
- `src/i18n/i18n.js` — `t("key", vars)`، `setLang()` (تطبيق فوري دون إعادة تحميل)، الاتجاه RTL/LTR، والحفظ في `localStorage` باسم `sakeenah:language`.
- النصوص الشرعية (القرآن، الحديث، الأدعية، نص قاعدة المعرفة) لا تُترجم: تبقى بالعربية مع وسم «Arabic original».
- الإندونيسية والصينية تظهران بوسم «قريبًا» ولا تُفعّلان.

## فيديوهات التعلّم السريع
- `src/data/videos.js` — سجل فارغ عمدًا: فيديو واحد لكل معلومة (`topic` + `concept_id` + `kb_id`)، مع ترجمات WebVTT لكل لغة، ولا يظهر إلا ما حالته `approved`.
- أضف فيديو بـ `SK.services.videos.register({...})` أو من قاعدة بيانات بنفس الشكل؛ يظهر زر «شاهد الشرح» تلقائيًا.

## TrustedSourcesRegistry + Evidence Guard
- `src/data/trustedSources.js` — المصادر (sourceName, sourceType)، والأدلة (referenceId, sourceUrl, evidenceText, language, evidenceStatus)، وخطوات صلاة الجنازة الأربع المبنية عليها.
- `SK.sources.guard(factId)` — لا تُعرض خطوة إلا إذا كان كل دليل تستند إليه موجودًا وموثّقًا؛ وإلا تظهر رسالة الامتناع.
- يستخدمه: التعلّم السريع (30 ثانية) والمراجعة السريعة (بطاقات `SK.ui.stepCards`)، ونصوص الرحلة والمرشد متوافقة معه.
- `approvedInReferenceFile: 'pending'` حتى يُطابَق كل مصدر مع ملف «المرجعية والحزمة العلمية والبيانات».

## محرك مرشد سكينة (guideEngine)
- `src/services/assistant/guideEngine.js`: فهم السؤال (النية + الموضوع + سياق الرحلة والمحادثة) ← توسيع الاستعلام داخليًا ← استرجاع دلالي على «ادعاءات» مفهرسة في TrustedSourcesRegistry ← Evidence Guard ← سلسلة بدائل (الادعاءات المفهرسة → مقاطع الأدلة → مصادر معتمدة عن بُعد [غير متاحة دون خادم] → رفض آمن).
- لا توجد أسئلة مخزنة ولا إجابات ثابتة: كل ادعاء = جملة + الأدلة التي تدعمها + مفردات المفهوم بأربع لغات.
- تشخيص التطوير (detectedIntent, detectedTopic, retrievalQueries, sourcesSearched, evidenceFound, evidenceAccepted, rejectionReason) يظهر فقط في Demo Mode.

## شاشات التصوير (Demo routes)
افتح `dist/sakeenah.html#demo/<الشاشة>` واختياريًا `?lang=en|tr|ur`:
home · language · mode · pretest · learning · video · quick-learning · guide · results · card
أو من وضع المطوّر (5 ضغطات على شعار «سكينة») ← «شاشات التصوير».
البيانات المستخدمة في results/learning هي `DEMO_DATA` في `src/demo/screenshots.js` — بيانات تجريبية للتصوير فقط.

## نقاط الربط لاحقًا
- **الذكاء الاصطناعي:** استبدل جسم `SK.services.analyzer.analyze(text)` باستدعاء الخدمة، مع الحفاظ على شكل النتيجة:
  `{ mastered:[id], needs:[{id, kind:'confused'|'missing', quote, said}], score }`
- **بطاقة سكينة:** الهوية في `services/profiles.js` (learnerId داخلي، والـQR يحمل Token عشوائيًا فقط، ورمز استرجاع من 6 أرقام). التخزين الحالي على الجهاز عبر محوّل `LocalAdapter`؛ استبدله بمحوّل API بنفس الدوال، وبادِل الـToken بجلسة على الخادم.
- **ذاكرة التعلّم:** `services/progress.js` يحوّل الرحلة إلى Learning Profile ويستعيدها.
- **اللغات:** أضف الترجمات واجعل `ready:true` في `data/i18n.js`.

## ملاحظة الموثوقية
محتوى `data/knowledge.js` مسودة، ويجب اعتماده من المرشد الشرعي قبل الإطلاق.
