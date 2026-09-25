/* KasirQuh V14 Phase 8 — extracted common DOM events + navbar badges */
(function(){
  window.KQModules = window.KQModules || {};
  window.KQModules.common = window.KQModules.common || {name:'common'};

/* ===== EXTRACTED FROM pelanggan.html <script> #9 id=none ===== */

// H-05-A: selective migration of safe ID-based no-argument click handlers.
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('promo-banner-section')?.addEventListener("click", bukaPromoTokoPelanggan);
  document.getElementById('Opsi Developer')?.addEventListener("click", toggleOpsiDeveloper);
  document.getElementById('fab-ai-btn')?.addEventListener("click", toggleAIChatModal);
  document.getElementById('fab-search-btn')?.addEventListener("click", bukaKolomPencarian);
  document.getElementById('fab-cart-btn')?.addEventListener("click", openCartModal);
  document.getElementById('aiSoundToggle')?.addEventListener("click", toggleAISound);
  document.getElementById('aiMicButton')?.addEventListener("click", toggleAISpeechRecognition);
  document.getElementById('btn-detail-add')?.addEventListener("click", tambahDariDetail);
  document.getElementById('scroll-helper-fab')?.addEventListener("click", kembaliKeAtasKatalog);
});



/* ===== EXTRACTED FROM pelanggan.html <script> #10 id=kq-v302-h05c-static-events ===== */

/* KQ-V3.0.2 H-05-C: static customer actions moved out of inline handlers. */
document.addEventListener('DOMContentLoaded', () => {
  const actions = {
    'auth-register': () => gantiFormAuth('register'),
    'auth-login': () => gantiFormAuth('login'),
    'claim-coin': () => klaimKoinHarian(),
    'menu-belanja': () => { switchTabPelanggan('belanja'); toggleMenuModal(); },
    'menu-data-pelanggan': () => { switchTabPelanggan('data-pelanggan'); toggleMenuModal(); },
    'menu-live-chat': () => { switchTabPelanggan('live-chat'); toggleMenuModal(); },
    'menu-pengaturan': () => { switchTabPelanggan('pengaturan'); toggleMenuModal(); },
    'close-search': () => tutupKolomPencarian(),
    'close-promo': () => tutupPromoTokoPelanggan(),
    'promo-prev': () => geserPromoTokoPelanggan(-1),
    'promo-next': () => geserPromoTokoPelanggan(1),
    'category-home': () => pilihKategoriPelanggan('Home'),
    'category-produk': () => pilihKategoriPelanggan('Produk'),
    'category-titipan-warga': () => pilihKategoriPelanggan('Titipan Warga'),
    'category-sembako': () => pilihKategoriPelanggan('Sembako'),
    'category-minuman': () => pilihKategoriPelanggan('Minuman'),
    'category-makanan': () => pilihKategoriPelanggan('Makanan'),
    'category-snack': () => pilihKategoriPelanggan('Snack'),
    'category-bumbu': () => pilihKategoriPelanggan('Bumbu'),
    'category-perawatan': () => pilihKategoriPelanggan('Perawatan'),
    'category-kebutuhan-rumah': () => pilihKategoriPelanggan('Kebutuhan Rumah'),
    'category-lainnya': () => pilihKategoriPelanggan('Lainnya'),
    'view-list': () => gantiViewModePelanggan('list'),
    'view-grid': () => gantiViewModePelanggan('grid'),
    'view-card': () => gantiViewModePelanggan('card')
  };

  document.querySelectorAll('[data-kq-static-action]').forEach((element) => {
    const action = actions[element.dataset.kqStaticAction];
    if (action) element.addEventListener('click', action);
  });
});



/* ===== V14 MULTI-PAGE NAV BADGES ===== */
(function(){
  function sync(){
    const c=document.getElementById('cart-count'), b=document.getElementById('kq-nav-cart-badge');
    if(c&&b){const n=parseInt(c.textContent||'0',10)||0;b.textContent=n;b.style.display=n>0?'block':'none';}
    const c2=document.getElementById('badge-livechat-cust'),b2=document.getElementById('kq-nav-chat-badge');
    if(c2&&b2){const n=parseInt(c2.textContent||'0',10)||0;b2.textContent=n;b2.style.display=n>0?'block':'none';}
  }
  document.addEventListener('DOMContentLoaded',()=>{sync();setInterval(sync,1000);});
})();

  const baseBoot = window.KQModules.common.boot;
  window.KQModules.common.boot = function(){
    document.body?.setAttribute('data-kq-module-common','ready');
    if (typeof baseBoot === 'function') baseBoot();
  };
})();
