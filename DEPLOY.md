# نشر سكينة كـ Live Demo (GitHub → Vercel)

التطبيق موقع ثابت (HTML + JavaScript + ملفات وسائط) + دالة خادم واحدة `api/stt.js` لميزة «ردّد معي» (تحويل تسجيل المستخدم إلى نص).
كل شيء يعمل بدون مفاتيح، ما عدا التحقق الصوتي في «ردّد معي» فيحتاج متغير البيئة أدناه.

## متغيرات البيئة (لميزة «ردّد معي» فقط)
| الاسم | مطلوب | القيمة |
|---|---|---|
| `STT_API_KEY` | نعم | مفتاح خدمة تحويل الصوت إلى نص (OpenAI أو Groq) — يبقى في الخادم ولا يصل للمتصفح |
| `STT_PROVIDER` | لا | `openai` (افتراضي، نموذج whisper-1) أو `groq` (whisper-large-v3) أو `custom` |
| `STT_MODEL` | لا | لتغيير النموذج |
| `STT_BASE_URL` | لـ custom فقط | عنوان خدمة متوافقة مع OpenAI (مثل خادم Whisper ذاتي) |

بدون `STT_API_KEY` يعمل التطبيق كاملًا، ويظهر في «ردّد معي» أن التحقق الصوتي غير مفعّل (لا توجد أي نتيجة وهمية).
اللغات: العربية، الإنجليزية، التركية، الأردية (كلها مدعومة في Whisper). التسجيل لا يُخزَّن.
ملاحظة: نسخة السحب والإفلات (Netlify Drop) لا تشغّل دوال الخادم، لذلك «ردّد معي» يعمل فقط على Vercel.

## التشغيل محليًا
```bash
npm run build      # يجهّز مجلد public/ ويتحقق من وجود كل الصور والفيديو والصوت
npm run preview    # http://localhost:3000
```
(يحتاج Node 18 أو أحدث فقط — لا توجد حزم لتثبيتها.)

## 1) الرفع إلى GitHub
1. افتح https://github.com/new وأنشئ مستودعًا باسم `sakeenah` (Public أو Private)، **بدون** README أو .gitignore.
2. في مجلد المشروع:
```bash
git remote add origin https://github.com/<اسم-حسابك>/sakeenah.git
git branch -M main
git push -u origin main
```
(المستودع مهيأ مسبقًا وفيه أول commit. إن لم يكن مجلد ‎.git موجودًا: `git init && git add . && git commit -m "Sakeenah live demo"` ثم الأوامر أعلاه.)

## 2) النشر على Vercel
1. ادخل https://vercel.com وسجّل الدخول بحساب GitHub.
2. **Add New… → Project** ثم اختر مستودع `sakeenah` واضغط **Import**.
3. الإعدادات تُقرأ تلقائيًا من `vercel.json` — لا تغيّر شيئًا:
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Environment Variables: أضف `STT_API_KEY` (وإن أردت `STT_PROVIDER=groq`) لتفعيل «ردّد معي»
4. اضغط **Deploy** (دقيقة تقريبًا).
5. لاسم الرابط `sakeenah.vercel.app`: Project → **Settings → Domains** → عدّل النطاق إلى `sakeenah.vercel.app` (إن كان الاسم محجوزًا جرّب `sakeenah-app.vercel.app`).
6. للتأكد أن المحكم يفتح الرابط بدون تسجيل دخول: Settings → **Deployment Protection** → اجعل **Vercel Authentication = Disabled** للـ Production.

## روابط مفيدة للمحكمين
- الصفحة الرئيسية: `/`
- شاشات جاهزة للعرض: `/#demo/full-path?lang=ar` · `/#demo/pretest` · `/#demo/learning` · `/#demo/video` · `/#demo/quick-learning` · `/#demo/guide` · `/#demo/results` · `/#demo/card`
  (غيّر `lang=ar` إلى `en` أو `tr` أو `ur`.)
