/* KasirQuh Customer V14 Phase 7 — shared route controller + module loader */
(function(){
  function getRoute(){ return document.body?.dataset?.kqRoute || window.KQ_CUSTOMER_PAGE?.route || 'home'; }

  const routeModules = {
    home:['common','auth'],
    produk:['common','auth','products'],
    keranjang:['common','auth','cart','transactions'],
    chat:['common','auth','chat','products'],
    akun:['common','auth','settings','transactions']
  };

  function loadModule(name){
    return new Promise((resolve,reject)=>{
      if(!name) return resolve();
      if(window.KQModules?.[name]) return resolve(window.KQModules[name]);
      const existing=document.querySelector('script[data-kq-module="'+name+'"]');
      if(existing){
        existing.addEventListener('load',()=>resolve(window.KQModules?.[name]),{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const s=document.createElement('script');
      s.src='/pelanggan/_core/modules/'+name+'.js';
      s.dataset.kqModule=name;
      s.onload=()=>resolve(window.KQModules?.[name]);
      s.onerror=reject;
      document.head.appendChild(s);
    });
  }

  async function activate(){
    const route=getRoute();
    const names=routeModules[route] || ['common','auth'];
    // Load route modules in parallel to avoid a sequential network waterfall.
    // Boot order remains deterministic after all modules have finished loading.
    const results = await Promise.all(names.map(async name => {
      try { return await loadModule(name); }
      catch(err){ console.error('[KasirQuh] gagal memuat module:',name,err); return null; }
    }));
    const modules = results.filter(Boolean);

    document.body.dataset.kqCustomerRoute=route;
    document.body.dataset.kqModules=names.join(',');
    document.body.dataset.kqNavigationReady='true';
    document.querySelectorAll('.kq-nav-item').forEach(a=>{
      const active=a.dataset.route===route;
      a.classList.toggle('kq-active',active);
      if(active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });

    // Route-specific presentation is now owned by physical modules.
    modules.filter(Boolean).forEach(mod=>{
      if(typeof mod.boot==='function'){
        try { mod.boot(); } catch(err){ console.error('[KasirQuh] module boot gagal:',mod.name,err); }
      }
    });

    if(route==='produk'){
      window.activeKategoriPelanggan='Produk';
      if(typeof perbaruiTampilanKategori==='function') perbaruiTampilanKategori();
      if(typeof refreshKatalogPelanggan==='function') refreshKatalogPelanggan();
    }
  }

  window.KQCustomerRouteController={activate,getRoute,loadModule,routeModules};
})();
