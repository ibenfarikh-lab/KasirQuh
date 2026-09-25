/* KasirQuh Customer V14 — Chat route entry */
(function(){
  function boot(){
    if(window.KQCustomerRouteController) window.KQModulesReady = window.KQCustomerRouteController.activate();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
