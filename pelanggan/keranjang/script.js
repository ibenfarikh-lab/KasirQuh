/* KasirQuh Customer V14 — Keranjang route entry */
(function(){
  function boot(){
    if(window.KQCustomerRouteController) window.KQCustomerRouteController.activate();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
