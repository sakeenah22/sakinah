/* i18n core: t("key", vars), language switching, direction, persistence (localStorage «sakeenah:language»).
   Changing the language never touches the card, progress, journeys or the conversation. */
(function(SK){
  const LANGS = {
    ar:{ dir:'rtl', ready:true,  speech:'ar-SA' },
    en:{ dir:'ltr', ready:true,  speech:'en-US' },
    tr:{ dir:'ltr', ready:true,  speech:'tr-TR' },
    ur:{ dir:'rtl', ready:true,  speech:'ur-PK' },
    id:{ dir:'ltr', ready:false, speech:'id-ID' },
    zh:{ dir:'ltr', ready:false, speech:'zh-CN' }
  };
  const KEY = 'sakeenah:language';
  const I = SK.i18n = SK.i18n || {};
  I.LANGS = LANGS;
  I.lang = () => { const l = SK.store.get().lang; return LANGS[l] && LANGS[l].ready ? l : 'ar'; };
  I.dir = (l = I.lang()) => LANGS[l].dir;
  /** t(key, vars): selected language → Arabic → key */
  SK.t = I.t = (key, vars) => {
    const tr = I.translations || {}; const l = I.lang();
    let s = (tr[l] && tr[l][key] != null) ? tr[l][key] : (tr.ar && tr.ar[key] != null ? tr.ar[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
    return s;
  };
  I.has = key => { const tr = I.translations || {}; return !!(tr[I.lang()] && tr[I.lang()][key] != null); };
  I.apply = () => { const l = I.lang(); document.documentElement.lang = l; document.documentElement.dir = LANGS[l].dir; };
  /** switch language at once (no reload); returns false for languages that are not ready */
  I.setLang = code => {
    if (!LANGS[code] || !LANGS[code].ready) return false;
    const changed = SK.store.get().lang !== code;
    SK.store.set({ lang:code }); try{ localStorage.setItem(KEY, code); }catch(e){}
    I.apply();
    // repaint the current screen at once so every label follows the new language (no reload; progress untouched)
    if (changed && SK.router && document.getElementById('app') && document.getElementById('app').firstChild) SK.router.go(SK.store.get().route, { replace:true });
    return true;
  };
  /** speech language for a text: Arabic-script content is read as Arabic (Urdu in the Urdu UI), otherwise the UI language */
  I.speechLang = text => { const l = I.lang(); return /[\u0600-\u06FF]/.test(text || '') ? (l === 'ur' ? 'ur-PK' : 'ar-SA') : LANGS[l].speech; };
  // restore the saved language
  try{ const saved = localStorage.getItem(KEY); if (saved && LANGS[saved] && LANGS[saved].ready) SK.store.get().lang = saved; }catch(e){}
  I.apply();
})(window.SK);
