/* KasirQuh Customer V14 — Phase 15 Navbar + Android Back/Forward */
(function(){
  'use strict';
  const ROUTES = {
    home:'/pelanggan/', produk:'/pelanggan/produk/', keranjang:'/pelanggan/keranjang/',
    chat:'/pelanggan/chat/', akun:'/pelanggan/akun/'
  };
  function normalize(path){ const p=(path||'/').replace(/\/+$/,'') || '/'; return p==='/' ? '/' : p; }
  function currentRoute(){
    const p=normalize(location.pathname);
    for(const [route,url] of Object.entries(ROUTES)){ if(normalize(url)===p) return route; }
    return document.body?.dataset?.kqRoute || 'home';
  }
  function markActive(){
    const route=currentRoute();
    document.querySelectorAll('.kq-nav-item').forEach(a=>{
      const active=a.dataset.route===route;
      a.classList.toggle('kq-active',active);
      if(active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    document.body?.setAttribute('data-kq-nav-route',route);
  }
  function installNav(){
    if(document.body.dataset.kqNavInstalled==='1') return;
    document.body.dataset.kqNavInstalled='1';
    try{ history.scrollRestoration='auto'; }catch(_){}
    document.addEventListener('click',e=>{
      const a=e.target.closest?.('a.kq-nav-item');
      if(!a || e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href=a.getAttribute('href');
      if(!href || !href.startsWith('/pelanggan/')) return;
      // Let the browser perform a real document navigation. This keeps Android
      // Back/Forward semantics correct for the five physical pages.
      markActive();
    },true);
    window.addEventListener('pageshow',()=>{ markActive(); });
    window.addEventListener('popstate',()=>{ markActive(); });
    markActive();
  }
  window.KQCustomerNavigation={routes:ROUTES,currentRoute,markActive,installNav};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installNav,{once:true}); else installNav();
})();
