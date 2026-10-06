(function(SK){
  const boot = () => { if (SK.ui.mountAudioBar) SK.ui.mountAudioBar(); SK.router.start(); };
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot, { once:true });
})(window.SK);
