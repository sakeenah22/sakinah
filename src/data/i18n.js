/* Interface options. Arabic is complete; other languages are prepared for translation. */
(function(SK){
  SK.data.languages = [
    {code:'ar', native:'العربية', dir:'rtl', ready:true, badge:'ع'},
    {code:'en', native:'English', dir:'ltr', ready:true, badge:'EN'},
    {code:'tr', native:'Türkçe', dir:'ltr', ready:true, badge:'TR'},
    {code:'id', native:'Bahasa Indonesia', dir:'ltr', ready:false, badge:'ID'},
    {code:'ur', native:'اردو', dir:'rtl', ready:true, badge:'UR'},
    {code:'zh', native:'中文', dir:'ltr', ready:false, badge:'中'}
  ];
  SK.data.worships = [
    {id:'janaza', name:'صلاة الجنازة', status:'متاحة الآن', ready:true},
    {id:'tilawa', name:'سجود التلاوة', status:'قريبًا', ready:false},
    {id:'sahw', name:'سجود السهو', status:'قريبًا', ready:false},
    {id:'istikhara', name:'صلاة الاستخارة', status:'قريبًا', ready:false}
  ];
  // names and status follow the interface language
  SK.data.worships.forEach(w => { const ar = { name:w.name, status:w.status };
    Object.defineProperty(w, 'name', { get: () => SK.i18n && SK.i18n.has('worship.'+w.id) ? SK.t('worship.'+w.id) : ar.name });
    Object.defineProperty(w, 'status', { get: () => SK.t(w.ready ? 'worship.available' : 'common.soon') }); });
})(window.SK);
