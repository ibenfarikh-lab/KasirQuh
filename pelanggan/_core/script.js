
/* PHASE 20 FINAL FIX: shared runtime bridges must exist before core boot. */
(function(){
  if (typeof window.storeCollection !== 'function') {
    window.storeCollection = function(){
      throw new Error('[KasirQuh] Firebase/Firestore belum siap.');
    };
  }
  if (typeof window.applyThemePelanggan !== 'function') {
    window.applyThemePelanggan = function(theme){
      const safeTheme = ['light','dark','modern'].includes(theme) ? theme : 'modern';
      document.body?.setAttribute('data-theme', safeTheme);
    };
  }
})();
const storeCollection = (...args) => window.storeCollection(...args);


/* ===== EXTRACTED FROM pelanggan.html <script> #4 id=none ===== */

    function getPelangganVercelUrl() {
      let origin = window.location.origin;
      if (!origin || origin.includes("null") || origin.includes("file:")) {
        return "https://kasirquh.vercel.app/pelanggan/"; // Fallback URL Vercel Anda
      }
      if (!window.location.pathname.includes("/pelanggan/")) {
        return origin + "/pelanggan/";
      }
      return window.location.href;
    }

    function bukaModalQRCode() {
      appOpenModal('qrCodeModal');
      const currentUrl = getPelangganVercelUrl();
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
      document.getElementById('qr-code-img').src = qrApiUrl;
      const storeName = pengaturanToko.nama || "KasirQuh";
      document.getElementById('qr-store-name').innerText = storeName;
      document.getElementById('qr-store-subtitle').innerText = "Belanja Harian Makin Praktis - " + storeName + " -";
      document.getElementById('qrCodeModal').classList.add('show');
    }

    function tutupModalQRCode() {
      if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'qrCodeModal') { history.back(); return; }
      document.getElementById('qrCodeModal').classList.remove('show');
    }

    function bagikanAplikasiViaWA() {
      const currentUrl = getPelangganVercelUrl();
      const storeName = pengaturanToko.nama || "KasirQuh";
      const pesan = `Halo! Yuk belanja kebutuhan harian makin praktis di *${storeName}* pakai aplikasi KasirQuh.\n\nKlik tautan Vercel berikut untuk mulai belanja & daftar:\n${currentUrl}\n\nTinggal Pilih Barang • Beres! 🛒✨`;
      window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, '_blank');
    }

    function bagikanBarcodeSebagaiGambar() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 400, 500);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(1, '#7c3aed');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 500);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      const storeName = pengaturanToko.nama || "KasirQuh";
      ctx.fillText(storeName, 200, 65);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText("Belanja Harian Makin Praktis", 200, 90);

      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(80, 120, 240, 240, 16);
        ctx.fill();
      } else {
        ctx.fillRect(80, 120, 240, 240);
      }

      const currentUrl = getPelangganVercelUrl();
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
      
      let img = new Image();
      img.crossOrigin = "anonymous";
      img.src = qrApiUrl;
      img.onload = async function() {
        ctx.drawImage(img, 100, 140, 200, 200);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText("📷 Scan Untuk Daftar / Login", 200, 400);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText("✨ Tinggal Scan • Pilih Barang • Beres!", 200, 435);

        canvas.toBlob(async (blob) => {
          const file = new File([blob], "barcode-kasirquh.png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Barcode ' + storeName,
                text: 'Yuk scan barcode ini atau klik link Vercel untuk mulai belanja di ' + storeName + '!\n' + currentUrl
              });
            } catch (err) {
              console.log(err);
            }
          } else {
            const link = document.createElement('a');
            link.download = 'barcode-kasirquh.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast("📥 Gambar barcode berhasil diunduh! Silakan kirimkan ke WhatsApp.");
          }
        }, 'image/png');
      };
    }
/* PHASE 9: bagikanProdukViaWA extracted to _core/modules/products.js */

/* PHASE 9: renderTeksDanBagikanProduk extracted to _core/modules/products.js */

  

/* ===== EXTRACTED FROM pelanggan.html <script> #5 id=none ===== */

/* PHASE 14: Firebase/Firestore bootstrap moved to _core/firebase.js */

    let databaseProduk = {}; let cart = []; let pengaturanToko = { nama: "", phone: "" };
    let currentCustomerPhone = localStorage.getItem('cust_phone_v13') || ''; let currentCustomerName = 'Pelanggan'; let currentCustomerDocId = ''; let customerSavedRecipes = []; let lastFetchedOrders = []; let catalogViewMode = localStorage.getItem('cust_view_v13') || 'grid';
    // PHASE 11 bridge: expose live core state to the physical Chat module without duplicating state.
    Object.defineProperties(window, {
      databaseProduk: { configurable:true, get:()=>databaseProduk },
      cart: { configurable:true, get:()=>cart },
      pengaturanToko: { configurable:true, get:()=>pengaturanToko },
      currentCustomerPhone: { configurable:true, get:()=>currentCustomerPhone },
      currentCustomerName: { configurable:true, get:()=>currentCustomerName }
    });
    let isProductsLoaded = false; let isTrendingConfigLoaded = false; let trendingLoadToken = 0; let currentPosPage = 1; let itemsPerPagePos = 24;
    // TAHAP 1: jumlah card katalog yang ditampilkan saat awal. Ini TIDAK membatasi databaseProduk/dashboard.
    const CATALOG_INITIAL_VISIBLE = 6;
    let catalogVisibleCount = CATALOG_INITIAL_VISIBLE;
    window.KQChatState = window.KQChatState || { customerChatUnsubscribe:null, chatRumpiUnsubscribe:null };
    let activeKategoriPelanggan = 'Home'; let toastTimeout;
    let adminCustomerRecipes = []; let adminCustomerRecipesEnabled = true;

    // ============================================================
    // NAVIGASI INTERNAL ANDROID BACK
    // Back Android digunakan untuk mundur satu langkah di dalam aplikasi.
    // State awal tetap Home; jika sudah di Home dan tidak ada riwayat internal,
    // Android/browser boleh menangani Back secara normal.
    // ============================================================
    let currentDetailCode = null; let currentDetailQty = 1; let currentDetailStep = 1;
    let appNavRestoring = false;
    let appNavReady = false;

    function appGetState() {
      const modalIds = ['customerLoginModal','dailyCheckinModal','menuToggleModal','promoTokoModal','cartModal','aiChatModal','qrCodeModal','productDetailModal'];
      let modal = null;
      for (const id of modalIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const visible = id === 'customerLoginModal' ? getComputedStyle(el).display !== 'none' : el.classList.contains('show') || getComputedStyle(el).display !== 'none';
        if (visible) { modal = id; break; }
      }
      const searchOpen = document.getElementById('sticky-search-container')?.style.display === 'block';
      return {
        route: window.KQ_CUSTOMER_PAGE?.route || document.body?.dataset?.kqRoute || 'home',
        tab: document.querySelector('.tab-content.active')?.id || 'belanja',
        category: activeKategoriPelanggan || 'Home',
        search: !!searchOpen,
        modal: modal,
        detailCode: modal === 'productDetailModal' ? currentDetailCode : null
      };
    }

    function appNormalizeState(state) {
      const base = { route: window.KQ_CUSTOMER_PAGE?.route || document.body?.dataset?.kqRoute || 'home', tab:'belanja', category:'Home', search:false, modal:null, detailCode:null };
      return Object.assign(base, state || {});
    }

    function appPushState(patch) {
      if (!appNavReady || appNavRestoring) return;
      const next = Object.assign({}, appGetState(), patch || {});
      const current = history.state && history.state.__kasirquhState;
      // Hindari entry duplikat yang sama persis.
      if (current && JSON.stringify(current) === JSON.stringify(next)) return;
      history.pushState({ __kasirquh: true, __kasirquhRoute: next.route, __kasirquhState: next }, '', location.href);
    }
    function appCloseAllOverlays() {
      const ids = ['menuToggleModal','promoTokoModal','cartModal','aiChatModal','qrCodeModal','productDetailModal'];
      ids.forEach(id => document.getElementById(id)?.classList.remove('show'));
      const login = document.getElementById('customerLoginModal'); if (login) login.style.display = 'none';
      const checkin = document.getElementById('dailyCheckinModal'); if (checkin) checkin.style.display = 'none';
    }

    function appRestoreState(rawState) {
      const state = appNormalizeState(rawState);
      appNavRestoring = true;
      try {
        appCloseAllOverlays();
        if (state.tab==='akun'){ if(document.getElementById('data-pelanggan')) document.getElementById('data-pelanggan').style.display='block'; if(document.getElementById('pengaturan')) document.getElementById('pengaturan').style.display='block'; } else if (state.tab && document.getElementById(state.tab)) switchTabPelanggan(state.tab);
        activeKategoriPelanggan = state.category || 'Home';
        document.querySelectorAll('#category-container .chip-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.category === activeKategoriPelanggan));
        currentPosPage = 1;
        // Pulihkan keadaan pencarian secara eksplisit. Sebelumnya state.search=false
        // tidak menutup sticky-search-container, sehingga Back kedua terlihat tidak bereaksi.
        const searchContainer = document.getElementById('sticky-search-container');
        if (state.search) {
          if (searchContainer) searchContainer.style.display = 'block';
          setModePencarianPelanggan(true);
          filterKatalogPelanggan(document.getElementById('inventory-search-input')?.value || '');
        } else {
          const input = document.getElementById('inventory-search-input');
          if (input) input.value = '';
          if (searchContainer) searchContainer.style.display = 'none';
          setModePencarianPelanggan(false);
        }
        perbaruiTampilanKategori();
        refreshKatalogPelanggan();
        if (state.modal === 'productDetailModal' && state.detailCode) openProductDetail(state.detailCode);
        else if (state.modal === 'cartModal') document.getElementById('cartModal')?.classList.add('show');
        else if (state.modal === 'aiChatModal') document.getElementById('aiChatModal')?.classList.add('show');
        else if (state.modal === 'menuToggleModal') document.getElementById('menuToggleModal')?.classList.add('show');
        else if (state.modal === 'qrCodeModal') document.getElementById('qrCodeModal')?.classList.add('show');
        else if (state.modal === 'promoTokoModal') document.getElementById('promoTokoModal')?.classList.add('show');
        else if (state.modal === 'customerLoginModal') document.getElementById('customerLoginModal').style.display = 'flex';
        else if (state.modal === 'dailyCheckinModal') document.getElementById('dailyCheckinModal').style.display = 'flex';
      } finally {
        appNavRestoring = false;
      }
    }

    function initAndroidBackNavigation() {
      const route=window.KQ_CUSTOMER_PAGE?.route || 'home';
      const initialTab=route==='chat'?'live-chat':route==='akun'?'akun':route==='keranjang'?'belanja':'belanja';
      const initial = { route, tab:initialTab, category: route==='produk'?'Produk':'Home', search:false, modal:route==='keranjang'?'cartModal':null, detailCode:null };
      const currentState = history.state && history.state.__kasirquhState;
      if (!currentState || history.state.__kasirquhRoute !== route) {
        history.replaceState({ __kasirquh: true, __kasirquhRoute: route, __kasirquhState: initial }, '', location.href);
      }
      appNavReady = true;
      window.addEventListener('popstate', function(event) {
        const state = event.state && event.state.__kasirquhState;
        // Only restore UI state for entries created by this page. A missing
        // state belongs to the browser/site history and must remain untouched.
        if (state && event.state.__kasirquhRoute === route) appRestoreState(state);
      });
    }

    function appOpenModal(id, detailCode = null) {
      appPushState({ modal:id, detailCode:detailCode });
    }



    const defaultRecipes = [
      { nama: "Sayur Sop Bening", desc: "Praktis, tinggal cemplung. Isian kol, wortel, bumbu kaldu.", keywords: ['kol', 'wortel', 'royco', 'bawang'] },
      { nama: "Nasi Goreng Dadakan", desc: "Bikin malam makin hangat. Butuh kecap, telur, bumbu instan.", keywords: ['kecap', 'telur', 'bumbu nasi goreng'] },
      { nama: "Tumis Kangkung Segar", desc: "Menu rumahan favorit. Kangkung hijau segar dan bumbu pilihan.", keywords: ['kangkung', 'bawang', 'cabe'] },
      { nama: "Mie Instan Telur", desc: "Andalan kala lapar melanda malam hari dengan tambahan telur.", keywords: ['mie instan', 'telur', 'sawi'] },
      { nama: "Es Teh Manis Segar", desc: "Pelepas dahaga di siang hari yang panas dan menyegarkan.", keywords: ['teh', 'gula', 'es'] }
    ];

    window.onload = async function() {
      // Router/module loading is dynamic. Wait for it before touching helpers
      // extracted into route modules. The common module also provides the
      // theme/view compatibility bridge for every route.
      try { if (window.KQModulesReady) await window.KQModulesReady; } catch (err) { console.warn('[KasirQuh] module bootstrap warning:', err); }
      const route = document.body?.dataset?.kqRoute || window.KQ_CUSTOMER_PAGE?.route || 'home';
      // Common boot: theme, Android history, cached store identity and auth UI.
      window.applyThemePelanggan(localStorage.getItem('cust_theme_v13') || 'modern');
      initAndroidBackNavigation();
      const cachedStoreName = localStorage.getItem('cust_store_name_v13'); if (cachedStoreName) { if(document.getElementById('receipt-shop-name')) document.getElementById('receipt-shop-name').innerText = cachedStoreName; if(document.getElementById('customer-home-store-name')) document.getElementById('customer-home-store-name').innerText = cachedStoreName; }

      // Only initialize features that belong to the current route.
      if (route === 'home') {
        muatIdeMasakAdminPelanggan();
        updateCustomerGreeting(); setInterval(updateCustomerGreeting, 60000);
        renderRecipeCards();
      }
      // Chat listeners are bootstrapped by the physical chat module.
      if (route === 'home' || route === 'akun' || route === 'keranjang') renderRecipeCards();

      // Phase 18: Firebase customer data/listeners are NEVER initialized from a cached phone alone.
      // The session must first be validated against Firestore by the auth module.
      const bootAuthenticatedCustomerData = () => {
        if (window.__KQCustomerDataBooted) return;
        window.__KQCustomerDataBooted = true;
        initFirebaseListeners();
        if (route === 'home' || route === 'akun' || route === 'keranjang' || route === 'chat') muatDataPelangganRealtime();
        if (route === 'home' || route === 'akun') muatRiwayatPesananOnlinePelanggan();
        if (route === 'chat') window.initCustomerChatListener?.();
        if (route === 'home' || route === 'akun') { periksaCheckinHarian(); tampilkanKoinDiProfil(); }
      };

      if (window.KQAuthSession) {
        if (window.KQAuthSession.isValidated && window.KQAuthSession.isValidated()) {
          bootAuthenticatedCustomerData();
        } else window.KQAuthSession.validate().then((ok) => {
          if (ok) bootAuthenticatedCustomerData();
        });
      } else {
        // Fail closed if the auth module has not loaded yet. Do not expose customer data.
        document.body.classList.add('kq-session-pending');
        const login = document.getElementById('customerLoginModal');
        if (login) login.style.display = 'flex';
        if (typeof gantiFormAuth === 'function') gantiFormAuth('login');
        console.warn('[KasirQuh Phase 18] Auth module belum siap; data pelanggan ditahan.');
      }
      if (route === 'home') {
        initPromoTokoPelanggan();
        initCustomerHomeInfoListener();
      }
    };

    function updateCustomerGreeting() {
      const el = document.getElementById('customer-home-greeting');
      if (!el) return;
      const hour = Number(new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date()));
      const greeting = hour >= 5 && hour < 11 ? 'Selamat pagi 👋' : hour >= 11 && hour < 15 ? 'Selamat siang ☀️' : hour >= 15 && hour < 18 ? 'Selamat sore 🌤️' : 'Selamat malam 🌙';
      el.textContent = greeting;
    }

    function renderCustomerHomeInfo(cfg) {
      const running=document.getElementById('customer-home-running-text');
      const text = (cfg && typeof cfg.runningText === 'string' && cfg.runningText.trim())
        ? cfg.runningText.trim()
        : ((cfg && typeof cfg.infoText === 'string' && cfg.infoText.trim()) ? cfg.infoText.trim() : 'Selamat datang di toko kami 👋');
      if(running) {
        running.textContent = text;
        running.classList.remove('run-once');
        void running.offsetWidth;
        running.classList.add('run-once');
      }
    }

    function initCustomerHomeInfoListener() {
      storeCollection("pengaturan").doc('beranda_pelanggan_home').onSnapshot(snap => {
        const cfg=snap.exists ? snap.data() : {};
        renderCustomerHomeInfo(cfg);
      }, () => renderCustomerHomeInfo({}));
    }

    let promoTokoPelangganCfg = { enabled: false, codes: [] };

    let promoTokoPelangganIndex = 0;

    function getPromoTokoPelangganCodes() {
      return Array.isArray(promoTokoPelangganCfg.codes) ? promoTokoPelangganCfg.codes.filter(code => databaseProduk[code] && Number(databaseProduk[code].stok || 0) > 0) : [];
    }

    function renderPromoTokoPelanggan() {
      const banner = document.getElementById('promo-banner-section');
      const slider = document.getElementById('promo-toko-slider');
      const codes = getPromoTokoPelangganCodes();
      const active = promoTokoPelangganCfg.enabled !== false && codes.length > 0;
      if (banner) { banner.style.display = active ? 'flex' : 'none'; banner.setAttribute('aria-hidden', active ? 'false' : 'true'); }
      if (!slider) return;
      if (!active) { slider.innerHTML=''; promoTokoPelangganIndex=0; return; }
      if (promoTokoPelangganIndex >= codes.length) promoTokoPelangganIndex = 0;
      slider.innerHTML = '<div class="promo-toko-track">' + codes.map(code => {
        const p=databaseProduk[code];
        const raw=p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
        let harga=typeof raw==='number' ? raw : (parseInt(String(raw).replace(/[^0-9]/g,''),10)||0);
        const satuan=(p.satuan||'Pcs').toLowerCase();
        if(satuan==='kg'||satuan==='kilogram') harga*=10;
        const foto=p.foto||'';
        return `<div class="promo-detail">${foto ? `<img src="${escapeHtml(foto)}" alt="${escapeHtml(String(p.nama||'Produk promo'))}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}<div class="promo-detail-placeholder" style="${foto?'display:none;':''}">🎁</div><div class="promo-detail-name">${escapeHtml(String(p.nama||'Produk'))}</div><div class="promo-detail-price-label">Harga promo hari ini</div><div class="promo-detail-price">Rp ${harga.toLocaleString('id-ID')}</div><div class="promo-detail-stock">Tersedia: ${p.stok||0} ${escapeHtml(String(p.satuan||'Pcs'))}</div><button class="promo-detail-add" type="button" data-promo-code="${escapeHtml(String(code))}">+ Masukkan Keranjang</button></div>`;
      }).join('') + '</div>';
      slider.querySelectorAll('.promo-detail-add').forEach(btn => btn.addEventListener('click', () => beliPromoTokoPelanggan(btn.getAttribute('data-promo-code'))));
      updatePromoTokoSlider();
    }

    function updatePromoTokoSlider() {
      const track=document.querySelector('#promo-toko-slider .promo-toko-track');
      const codes=getPromoTokoPelangganCodes();
      if(track) track.style.transform=`translateX(-${promoTokoPelangganIndex*100}%)`;
      const counter=document.getElementById('promo-counter'); if(counter) counter.textContent=`${codes.length ? promoTokoPelangganIndex+1 : 1} / ${codes.length||1}`;
      const prev=document.getElementById('promo-prev-btn'), next=document.getElementById('promo-next-btn');
      if(prev) prev.disabled=promoTokoPelangganIndex<=0; if(next) next.disabled=promoTokoPelangganIndex>=codes.length-1;
    }

    function geserPromoTokoPelanggan(dir) {
      const codes=getPromoTokoPelangganCodes(); if(!codes.length) return;
      promoTokoPelangganIndex=Math.max(0,Math.min(codes.length-1,promoTokoPelangganIndex+dir)); updatePromoTokoSlider();
    }

    function initPromoTokoPelanggan() {
      try {
        const localCfg = JSON.parse(localStorage.getItem('admin_promo_toko_v1') || '{}');
        if (localCfg && Array.isArray(localCfg.codes)) promoTokoPelangganCfg = { enabled: localCfg.enabled !== false, codes: localCfg.codes };
      } catch(e) {}
      renderPromoTokoPelanggan();
      storeCollection("pengaturan").doc('beranda_pelanggan_promo').onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data() || {};
          promoTokoPelangganCfg = { enabled: data.enabled !== false, codes: Array.isArray(data.codes) ? data.codes : [] };
          localStorage.setItem('admin_promo_toko_v1', JSON.stringify(promoTokoPelangganCfg));
        } else {
          promoTokoPelangganCfg = { enabled: false, codes: [] };
        }
        renderPromoTokoPelanggan();
      }, err => {
        console.warn('Listener promo pelanggan gagal:', err);
        renderPromoTokoPelanggan();
      });
    }

    function bukaPromoTokoPelanggan() {
      appOpenModal('promoTokoModal');
      promoTokoPelangganIndex = 0;
      renderPromoTokoPelanggan();
      const modal = document.getElementById('promoTokoModal');
      const slider = document.getElementById('promo-toko-slider');
      if (slider && !slider.dataset.swipeReady) {
        let sx=0;
        slider.addEventListener('touchstart', e => { sx=e.touches[0].clientX; }, {passive:true});
        slider.addEventListener('touchend', e => { const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>45) geserPromoTokoPelanggan(dx<0?1:-1); }, {passive:true});
        slider.dataset.swipeReady='1';
      }
      if (modal) modal.classList.add('show');
    }

    function tutupPromoTokoPelanggan() {
      if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'promoTokoModal') { history.back(); return; }
      const modal = document.getElementById('promoTokoModal');
      if (modal) modal.classList.remove('show');
    }

    function beliPromoTokoPelanggan(code) {
      if (!databaseProduk[code]) return;
      tambahKeKeranjangDiamDiam(code);
      tutupPromoTokoPelanggan();
      renderCartPelanggan();
      showToast('🛒 Produk promo masuk ke keranjang!');
      openCartModal();
    }

    function periksaCheckinHarian() { if(!currentCustomerPhone) return; if(localStorage.getItem('admin_koin_warga_enabled') === 'false') return; let today = new Date().toLocaleDateString('id-ID'); let lastCheckin = localStorage.getItem('last_checkin_date_' + currentCustomerPhone); if(lastCheckin !== today) { const bonus=Math.max(0, parseInt(localStorage.getItem('admin_koin_warga_daily'),10) || 10); const p=document.querySelector('#dailyCheckinModal p'); if(p) p.innerText='Selamat! Kamu rajin buka aplikasi hari ini. Ini ' + bonus + ' Koin untukmu!'; setTimeout(() => { appOpenModal('dailyCheckinModal'); document.getElementById('dailyCheckinModal').style.display = 'flex'; }, 1500); } }
    function klaimKoinHarian() { let today = new Date().toLocaleDateString('id-ID'); localStorage.setItem('last_checkin_date_' + currentCustomerPhone, today); let bonus=Math.max(0, parseInt(localStorage.getItem('admin_koin_warga_daily'),10) || 10); let currentCoins = parseInt(localStorage.getItem('koin_warga_' + currentCustomerPhone)) || 0; localStorage.setItem('koin_warga_' + currentCustomerPhone, currentCoins + bonus); if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'dailyCheckinModal') history.back(); else document.getElementById('dailyCheckinModal').style.display = 'none'; showToast('🪙 Yey! ' + bonus + ' Koin berhasil ditambahkan ke dompetmu.'); playBeep(); tampilkanKoinDiProfil(); }
    function tampilkanKoinDiProfil() { let coins = localStorage.getItem('koin_warga_' + currentCustomerPhone) || 0; const el = document.getElementById('profile-coins'); if (el) el.innerText = coins; }

    window.__promoRenderHook = renderPromoTokoPelanggan;

    function beliPaketResepByKeywords(namaResep, keywords) {
      if(!isProductsLoaded) return alert("Tunggu katalog dimuat dulu ya kak.");
      let addedCount = 0;
      keywords.forEach(kw => { let foundCode = Object.keys(databaseProduk).find(code => databaseProduk[code].nama.toLowerCase().includes(kw)); if (foundCode) { tambahKeKeranjangDiamDiam(foundCode); addedCount++; } });
      if (addedCount > 0) { showToast(`🥘 Bahan ${namaResep} berhasil dimasukkan!`); renderCartPelanggan(); openCartModal(); } else { alert(`Maaf, bahan untuk ${namaResep} lagi kosong di toko.`); }
    }
    
    function bagikanResepKeywordsKeRumpi(namaResep, keywords) {
      if (!currentCustomerPhone) return alert("Silakan login terlebih dahulu untuk berbagi resep!");
      if(!isProductsLoaded) return alert("Tunggu katalog dimuat dulu ya kak.");
      let foundItemsText = "";
      keywords.forEach(kw => {
        let foundCode = Object.keys(databaseProduk).find(code => databaseProduk[code].nama.toLowerCase().includes(kw));
        if (foundCode) {
          let p = databaseProduk[foundCode];
          foundItemsText += `- ${p.nama}\n`;
        }
      });
      let pesanRumpi = `🍳 *Menu Resep dari ${currentCustomerName || 'Pelanggan'}*\nNama Menu: "${namaResep}"\nBahan-bahan:\n${foundItemsText || '- Sesuai paket resep'}`;
      let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');
      
      storeCollection("db_chat_rumpi").add({
        senderPhone: currentCustomerPhone,
        senderName: currentCustomerName || 'Pelanggan',
        pesan: pesanRumpi,
        waktu: nowStr,
        waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        showToast("📢 Resep berhasil dibagikan ke Chat Rumpi!");
        switchTabPelanggan('live-chat');
        switchSubTabLiveChat('rumpi');
      }).catch(err => {
        alert("Gagal membagikan: " + err.message);
      });
    }

    function beliPaketResepCustom(recipeObj) {
      if(!isProductsLoaded) return alert("Tunggu katalog dimuat dulu ya kak.");
      let addedCount = 0;
      if(recipeObj.items) {
        recipeObj.items.forEach(it => {
          let p = databaseProduk[it.code];
          if(p && (p.stok || 0) >= it.qty) {
            let satuan = (p.satuan || "").toLowerCase().trim();
            let isKg = (satuan === "kg" || satuan === "kilogram");
            let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
            let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
            let valModal = p.hargaModal !== undefined ? p.hargaModal : (p.modal || 0);
            let modalParsed = typeof valModal === 'number' ? valModal : parseInt(valModal.toString().replace(/[^0-9]/g, '')) || 0;
            if (isKg) { hargaParsed *= 10; modalParsed *= 10; }

            let item = cart.find(i => i.code === it.code);
            if (item) {
              item.qty += it.qty; item.qty = parseFloat(item.qty.toFixed(3)); item.subtotal = Math.round(item.qty * hargaParsed);
            } else {
              cart.push({ code: it.code, nama: p.nama, harga: hargaParsed, modal: modalParsed, qty: it.qty, subtotal: Math.round(it.qty * hargaParsed), foto: p.foto });
            }
            addedCount++;
          }
        });
      }
      if (addedCount > 0) { showToast(`🥘 Bahan ${recipeObj.nama} berhasil dimasukkan!`); renderCartPelanggan(); openCartModal(); } else { alert(`Maaf, bahan untuk ${recipeObj.nama} sedang kosong.`); }
    }

    function bagikanResepCustomKeRumpi(recipeObj) {
      if (!currentCustomerPhone) return alert("Silakan login terlebih dahulu untuk berbagi resep!");
      let total = 0;
      let itemListText = "";
      recipeObj.items.forEach(it => {
        let p = databaseProduk[it.code];
        if(p) {
          let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs");
          let isKg = satuan === 'kg' || satuan === 'kilogram';
          let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
          let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
          if (isKg) hargaParsed *= 10;
          total += it.qty * hargaParsed;
          itemListText += `- ${p.nama} (${it.qty} ${satuan})\n`;
        }
      });

      let pesanRumpi = `🍳 *Menu Racikan dari ${currentCustomerName || 'Pelanggan'}*\nNama Menu: "${recipeObj.nama}"\nBahan-bahan:\n${itemListText}Perkiraan Total: Rp ${Math.round(total).toLocaleString('id-ID')}`;
      let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');
      
      storeCollection("db_chat_rumpi").add({
        senderPhone: currentCustomerPhone,
        senderName: currentCustomerName || 'Pelanggan',
        pesan: pesanRumpi,
        waktu: nowStr,
        waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        showToast("📢 Resep berhasil dibagikan ke Chat Rumpi!");
        switchTabPelanggan('live-chat');
        switchSubTabLiveChat('rumpi');
      }).catch(err => {
        alert("Gagal membagikan: " + err.message);
      });
    }

    function tambahKeKeranjangDiamDiam(code) {
      let p = databaseProduk[code]; if (!p || (p.stok || 0) <= 0) return; let satuan = (p.satuan || "").toLowerCase().trim(); let qtyToAdd = (satuan === "kg" || satuan === "kilogram") ? 0.25 : 1;
      let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
      let valModal = p.hargaModal !== undefined ? p.hargaModal : (p.modal || 0); let modalParsed = typeof valModal === 'number' ? valModal : parseInt(valModal.toString().replace(/[^0-9]/g, '')) || 0;
      if (satuan === "kg" || satuan === "kilogram") { hargaParsed *= 10; modalParsed *= 10; }
      let item = cart.find(i => i.code === code);
      if (item) { if (item.qty + qtyToAdd <= p.stok) { item.qty += qtyToAdd; item.qty = parseFloat(item.qty.toFixed(3)); item.subtotal = Math.round(item.qty * hargaParsed); } } 
      else { if (qtyToAdd <= p.stok) { cart.push({ code, nama: p.nama, harga: hargaParsed, modal: modalParsed, qty: qtyToAdd, subtotal: Math.round(qtyToAdd * hargaParsed), foto: p.foto }); } }
    }

    async function muatIdeMasakAdminPelanggan() {
      try {
        const snap = await storeCollection("pengaturan").doc("beranda_pelanggan_resep").get();
        const data = snap.exists ? snap.data() : {};
        adminCustomerRecipesEnabled = data.enabled !== false;
        adminCustomerRecipes = Array.isArray(data.recipes) ? data.recipes : [];
      } catch(e) {
        adminCustomerRecipesEnabled = true;
        adminCustomerRecipes = [];
      }
      renderRecipeCards();
    }

    function renderRecipeCards() {
      const container = document.getElementById('recipe-scroll-container');
      if(!container) return;
      container.innerHTML = "";

      if (adminCustomerRecipesEnabled && adminCustomerRecipes.length) {
        adminCustomerRecipes.forEach(r => {
          const escName=escapeHtml(r.nama||'Menu Warga');
          const escDesc=escapeHtml(r.desc||'Ide masak pilihan toko.');
          const rJson=JSON.stringify(r).replace(/'/g,"&#39;");
          const foto=r.foto ? `<img src="${escapeHtml(r.foto)}" alt="" style="width:100%;height:62px;object-fit:cover;border-radius:7px;margin-bottom:5px;" onerror="this.style.display='none'">` : '';
          container.innerHTML += `<div class="recipe-card">${foto}<div><div style="font-weight:800;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">${escName}</div><div style="font-size:.65rem;opacity:.9;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.2;">${escDesc}</div></div><div style="display:flex;gap:4px;margin-top:auto;"><button type="button" class="recipe-btn-action" style="flex:1;" onclick='beliPaketResepCustom(${rJson})'>+ Masukkan Bahan</button><button type="button" class="recipe-btn-action" style="flex:0 0 30px;padding:5px 0;" title="Bagikan ke Rumpi" onclick='bagikanResepCustomKeRumpi(${rJson})'>📢</button></div></div>`;
        });
      }

      defaultRecipes.forEach(r => {
        let escName = escapeHtml(r.nama);
        let escDesc = escapeHtml(r.desc);
        let kwJson = JSON.stringify(r.keywords).replace(/"/g, '&quot;');
        container.innerHTML += `
          <div class="recipe-card">
            <div>
              <div style="font-weight: 800; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${escName}</div>
              <div style="font-size: 0.65rem; opacity: 0.9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2;">${escDesc}</div>
            </div>
            <div style="display: flex; gap: 4px; margin-top: auto;">
              <button type="button" class="recipe-btn-action" style="flex: 1;" onclick='beliPaketResepByKeywords("${escName}", ${kwJson})'>+ Masukkan Bahan</button>
              <button type="button" class="recipe-btn-action" style="flex: 0 0 30px; padding: 5px 0;" title="Bagikan ke Rumpi" onclick='bagikanResepKeywordsKeRumpi("${escName}", ${kwJson})'>📢</button>
            </div>
          </div>`;
      });

      customerSavedRecipes.forEach((sr, idx) => {
        let escName = escapeHtml(sr.nama);
        let srJson = JSON.stringify(sr).replace(/'/g, "&#39;");
        
        let itemNames = [];
        if(sr.items) {
          sr.items.forEach(it => {
            let p = databaseProduk[it.code];
            if(p) itemNames.push(p.nama);
          });
        }
        let descItemText = itemNames.length > 0 ? itemNames.join(', ') : 'Menu Racikan Toko';

        container.innerHTML += `
          <div class="recipe-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 4px; margin-bottom: 2px;">
                <div style="font-weight: 800; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">⭐ ${escName}</div>
                <div style="display: flex; gap: 4px; align-items: center;">
                  <button type="button" onclick="editSavedRecipe(${idx})" title="Edit Menu" style="background: rgba(255,255,255,0.25); border: none; color: #fde047; border-radius: 4px; width: 22px; height: 22px; cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">✏️</button>
                  <button type="button" onclick="hapusSavedRecipe(${idx})" title="Hapus" style="background: rgba(255,255,255,0.25); border: none; color: #fca5a5; border-radius: 4px; width: 22px; height: 22px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">✕</button>
                </div>
              </div>
              <div style="font-size: 0.63rem; opacity: 0.9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2;">${escapeHtml(descItemText)}</div>
            </div>
            <div style="display: flex; gap: 4px; margin-top: auto;">
              <button type="button" class="recipe-btn-action" style="flex: 1;" onclick='beliPaketResepCustom(${srJson})'>+ Masukkan Bahan</button>
              <button type="button" class="recipe-btn-action" style="flex: 0 0 30px; padding: 5px 0;" title="Bagikan ke Rumpi" onclick='bagikanResepCustomKeRumpi(${srJson})'>📢</button>
            </div>
          </div>`;
      });

      container.innerHTML += `
        <div class="recipe-card" style="border: 1px dashed rgba(255,255,255,0.4);">
          <div>
            <div style="font-weight: 800; font-size: 0.85rem; margin-bottom: 2px;">Simpan Menu Sendiri 👩‍🍳</div>
            <div style="font-size: 0.65rem; opacity: 0.9; line-height: 1.2;">Pilih barang di keranjang, simpan menu langsung tanpa harus belanja!</div>
          </div>
          <div style="font-size: 0.63rem; opacity: 0.8; font-style: italic; text-align: center; margin-top: auto;">Tersimpan otomatis di database akunmu</div>
        </div>`;
    }

    function editSavedRecipe(index) {
      let sr = customerSavedRecipes[index];
      if (!sr) return;

      cart = [];
      sr.items.forEach(it => {
        let p = databaseProduk[it.code];
        if (p) {
          let satuan = (p.satuan || "").toLowerCase().trim();
          let isKg = (satuan === "kg" || satuan === "kilogram");
          let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
          let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
          let valModal = p.hargaModal !== undefined ? p.hargaModal : (p.modal || 0);
          let modalParsed = typeof valModal === 'number' ? valModal : parseInt(valModal.toString().replace(/[^0-9]/g, '')) || 0;
          if (isKg) { hargaParsed *= 10; modalParsed *= 10; }

          cart.push({
            code: it.code,
            nama: p.nama,
            harga: hargaParsed,
            modal: modalParsed,
            qty: it.qty,
            subtotal: Math.round(it.qty * hargaParsed),
            foto: p.foto
          });
        }
      });

      renderCartPelanggan();
      openCartModal();

      document.getElementById('cust-save-recipe-toggle').checked = true;
      toggleSaveRecipeOptions(true);
      document.getElementById('cust-save-recipe-name').value = sr.nama;

      customerSavedRecipes.splice(index, 1);
      if (currentCustomerDocId) {
        storeCollection("pelanggan").doc(currentCustomerDocId).update({
          savedRecipes: customerSavedRecipes
        }).then(() => {
          renderRecipeCards();
        });
      }

      showToast("Menu dimuat untuk diedit. Sesuaikan lalu simpan kembali!");
    }

    function hapusSavedRecipe(idx) {
      if (!currentCustomerDocId) return alert("Silakan login terlebih dahulu.");
      if (!confirm("Hapus menu resep tersimpan ini?")) return;
      
      let updatedRecipes = [...customerSavedRecipes];
      updatedRecipes.splice(idx, 1);

      storeCollection("pelanggan").doc(currentCustomerDocId).update({
        savedRecipes: updatedRecipes
      }).then(() => {
        customerSavedRecipes = updatedRecipes;
        renderRecipeCards();
        showToast("Menu kustom berhasil dihapus.");
      }).catch(err => {
        alert("Gagal menghapus: " + err.message);
      });
    }

    function toggleSaveRecipeOptions(isChecked) {
      document.getElementById('wrapper-save-recipe-fields').style.display = isChecked ? 'flex' : 'none';
    }

    function showToast(message, type = "success") { const toast = document.getElementById("toastNotification"); toast.innerText = message; toast.className = "toast show " + type; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000); }
    let sharedAudioCtx = null; function getSharedAudioContext() { if (!sharedAudioCtx) { sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } if (sharedAudioCtx.state === 'suspended') { sharedAudioCtx.resume(); } return sharedAudioCtx; }
    function playTone(freq, type = "sine") { try { const audioCtx = getSharedAudioContext(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type = type; osc.frequency.value = freq; gain.gain.value = 0.3; osc.start(); osc.stop(audioCtx.currentTime + 0.1); } catch (e) {} }
    function playBeep() { playTone(1000, "sine"); } function playBeepDown() { playTone(600, "triangle"); }
    function playCustomerNotificationSound() { playTone(800, "sine"); setTimeout(() => playTone(1000, "sine"), 150); }

    /* PHASE 12: Account/Settings UI logic extracted to _core/modules/settings.js */
    function toggleMenuModal() {
      const modal = document.getElementById('menuToggleModal');
      const isOpen = modal.classList.contains('show');
      if (!isOpen) { appOpenModal('menuToggleModal'); modal.classList.add('show'); }
      else if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'menuToggleModal') { history.back(); }
      else { modal.classList.remove('show'); }
    }

    function setModePencarianPelanggan(aktif) {
      const ids = ['category-container','reorder-section-wrapper','recipe-section-wrapper','trending-section-wrapper'];
      ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = aktif ? 'none' : ''; });
      const pos = document.querySelector('#belanja .pos-container');
      if (pos) pos.style.display = 'block';
    }

    function bukaKolomPencarian() {
      if (!appNavRestoring) appPushState({ search:true, modal:null });
      const searchContainer = document.getElementById("sticky-search-container");
      if (searchContainer) {
        searchContainer.style.display = "block";
        setModePencarianPelanggan(true);
        filterKatalogPelanggan("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => document.getElementById("inventory-search-input")?.focus(), 200);
      }
    }

    function tutupKolomPencarian() {
      if (!appNavRestoring && history.state?.__kasirquhState?.search) { history.back(); return; }
      const input = document.getElementById("inventory-search-input");
      const searchContainer = document.getElementById("sticky-search-container");
      if (input) input.value = "";
      if (searchContainer) searchContainer.style.display = "none";
      setModePencarianPelanggan(false);
      perbaruiTampilanKategori();
      filterKatalogPelanggan("");
    }
/* PHASE 9: pilihKategoriPelanggan extracted to _core/modules/products.js */

/* PHASE 9: perbaruiTampilanKategori extracted to _core/modules/products.js */


    function gantiFormAuth(type) { document.getElementById('formLoginContainer').style.display = type === 'login' ? 'block' : 'none'; document.getElementById('formRegisterContainer').style.display = type === 'register' ? 'block' : 'none'; }
    /* === DRAG FAB AI PELANGGAN === */
    (function initDraggableAiFab(){
      const fab = document.getElementById('fab-ai-btn');
      if (!fab || fab.dataset.dragReady === '1') return;
      fab.dataset.dragReady = '1';

      const saved = (() => {
        try { return JSON.parse(localStorage.getItem('kasirquh_ai_fab_pos') || 'null'); } catch(e) { return null; }
      })();
      let dragging = false;
      let moved = false;
      let pointerId = null;
      let offsetX = 0;
      let offsetY = 0;

      function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
      function place(x, y, save = true){
        const maxX = Math.max(0, window.innerWidth - fab.offsetWidth);
        const maxY = Math.max(0, window.innerHeight - fab.offsetHeight);
        x = clamp(x, 0, maxX);
        y = clamp(y, 0, maxY);
        fab.style.left = x + 'px';
        fab.style.top = y + 'px';
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
        if(save){
          try { localStorage.setItem('kasirquh_ai_fab_pos', JSON.stringify({x,y})); } catch(e) {}
        }
      }

      function applyInitialPosition(){
        if(saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)){
          place(saved.x, saved.y, false);
        } else {
          const rect = fab.getBoundingClientRect();
          place(window.innerWidth - rect.width - 10, (window.innerHeight - rect.height) / 2, false);
        }
      }

      fab.addEventListener('pointerdown', (e) => {
        if(e.pointerType === 'mouse' && e.button !== 0) return;
        const rect = fab.getBoundingClientRect();
        pointerId = e.pointerId;
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        dragging = true;
        moved = false;
        fab.classList.add('is-dragging');
        try { fab.setPointerCapture(pointerId); } catch(err) {}
        e.preventDefault();
      }, {passive:false});

      fab.addEventListener('pointermove', (e) => {
        if(!dragging || e.pointerId !== pointerId) return;
        const rect = fab.getBoundingClientRect();
        if(Math.abs((e.clientX - rect.left) - offsetX) > 3 || Math.abs((e.clientY - rect.top) - offsetY) > 3) moved = true;
        place(e.clientX - offsetX, e.clientY - offsetY);
        e.preventDefault();
      }, {passive:false});

      function endDrag(e){
        if(!dragging || (e && e.pointerId !== pointerId)) return;
        dragging = false;
        fab.classList.remove('is-dragging');
        try { if(pointerId != null) fab.releasePointerCapture(pointerId); } catch(err) {}
        pointerId = null;
      }
      fab.addEventListener('pointerup', endDrag);
      fab.addEventListener('pointercancel', endDrag);

      /* Setelah digeser, jangan sampai pointerup dianggap sebagai tap pembuka AI. */
      fab.addEventListener('click', (e) => {
        if(moved){
          e.preventDefault();
          e.stopImmediatePropagation();
          moved = false;
        }
      }, true);

      window.addEventListener('resize', () => {
        const rect = fab.getBoundingClientRect();
        place(rect.left, rect.top, true);
      });

      requestAnimationFrame(applyInitialPosition);
    })();

    async function toggleAIChatModal() {
      const modal = document.getElementById('aiChatModal');
      const willOpen = !modal.classList.contains('show');
      if (willOpen) {
        appOpenModal('aiChatModal');
        modal.classList.add('show');
        if (isAiSoundOn) await putarSuaraSambutanAI();
      } else if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'aiChatModal') {
        history.back();
      } else {
        modal.classList.remove('show');
      }
    }

    async function putarSuaraSambutanAI() {
      if (!isAiSoundOn) return;
      const namaToko = (pengaturanToko && pengaturanToko.nama) ? pengaturanToko.nama : "KasirQuh";
      const teksSambutan = `HALOOOO BESTIE! Aku Asisten AI Warunge Mimi. Mau ngobrol atau tanya-tanya dulu?`;
      try {
        if (window._aiWelcomeAudio) {
          try { window._aiWelcomeAudio.pause(); } catch (e) {}
          try { URL.revokeObjectURL(window._aiWelcomeAudioUrl); } catch (e) {}
        }
        const ttsResponse = await fetch(`/api/tts?text=${encodeURIComponent(teksSambutan)}`);
        if (!ttsResponse.ok) throw new Error("TTS gagal");
        const audioUrl = URL.createObjectURL(await ttsResponse.blob());
        const audio = new Audio(audioUrl);
        window._aiWelcomeAudio = audio;
        window._aiWelcomeAudioUrl = audioUrl;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          window._aiWelcomeAudio = null;
          window._aiWelcomeAudioUrl = null;
        };
        await audio.play();
      } catch (err) {
        console.error("TTS sambutan AI:", err);
      }
    }
/* PHASE 9: openProductDetail extracted to _core/modules/products.js */

/* PHASE 9: closeProductDetail extracted to _core/modules/products.js */

/* PHASE 9: ubahQtyDetail extracted to _core/modules/products.js */

/* PHASE 9: tambahDariDetail extracted to _core/modules/products.js */

/* PHASE 9: tanyaAdminBarang extracted to _core/modules/products.js */


    /* PHASE 11: chat presentation/realtime/AI extracted to _core/modules/chat.js */

    function prosesLoginPelanggan(e) {
      e.preventDefault();
      const phone = document.getElementById('cust-login-phone').value.trim();
      const pass = document.getElementById('cust-login-pass').value.trim();
      if (!phone || !pass) return alert("Nomor WhatsApp dan Sandi wajib diisi!");

      storeCollection("pelanggan").where("phone", "==", phone).get().then((snapshot) => {
        if (snapshot.empty) {
          alert("Nomor WhatsApp belum terdaftar. Silakan daftar terlebih dahulu.");
        } else {
          let docData = snapshot.docs[0].data();
          
          if (docData.status === "pending" || docData.disetujui === false) {
            return alert("Akun Anda sedang menunggu persetujuan dari Admin toko. Silakan hubungi admin.");
          }

          if (pass === (docData.password || "user")) {
            localStorage.setItem('cust_phone_v13', phone);
            currentCustomerPhone = phone;
            currentCustomerName = docData.nama || 'Pelanggan';
            document.getElementById('customerLoginModal').style.display = 'none';
            // Refresh HANYA setelah tombol Masuk pada form login berhasil.
            // Tidak terkait dengan bottom navbar/menu.
            setTimeout(() => { window.location.reload(); }, 150);
            muatDataPelangganRealtime();
            muatRiwayatPesananOnlinePelanggan();
            window.initCustomerChatListener?.();
            refreshKatalogPelanggan();

            showToast("Berhasil Masuk! Selamat Berbelanja 🛒");
            periksaCheckinHarian();
            tampilkanKoinDiProfil();
            renderRecipeCards();
          } else {
            alert("Sandi salah..!!! Coba lagi, atau kontak Admin untuk memperbaharui!");
          }
        }
      }).catch(err => {
        alert("Terjadi kesalahan saat masuk: " + err.message);
      });
    }

    function prosesDaftarPelanggan(e) {
      e.preventDefault();
      const name = document.getElementById('cust-reg-name').value.trim();
      const phone = document.getElementById('cust-reg-phone').value.trim();
      const address = document.getElementById('cust-reg-address').value.trim();
      const pass = document.getElementById('cust-reg-pass').value.trim();

      if (!name || !phone || !address || !pass) return alert("Semua kolom wajib diisi!");

      storeCollection("pelanggan").where("phone", "==", phone).get().then((snapshot) => {
        if (!snapshot.empty) {
          alert("Nomor WhatsApp sudah terdaftar! Silakan langsung masuk.");
          gantiFormAuth('login');
        } else {
          storeCollection("pelanggan").add({
            nama: name,
            phone: phone,
            alamat: address,
            password: pass,
            status: "pending",
            catatan: [],
            savedRecipes: [],
            waktuDaftar: new Date().toLocaleString('id-ID')
          }).then(() => {
            alert("Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin toko sebelum dapat digunakan untuk masuk.");
            document.getElementById('cust-reg-name').value = '';
            document.getElementById('cust-reg-phone').value = '';
            document.getElementById('cust-reg-address').value = '';
            document.getElementById('cust-reg-pass').value = '';
            gantiFormAuth('login');
          }).catch((err) => {
            alert("Gagal mendaftar: " + err.message);
          });
        }
      }).catch(err => {
        alert("Terjadi kesalahan: " + err.message);
      });
    }

    /* PHASE 13/18: logoutPelanggan is owned by _core/modules/auth.js. */

    function initFirebaseListeners() {
      const route = document.body?.dataset?.kqRoute || window.KQ_CUSTOMER_PAGE?.route || 'home';
      const needsProducts = ['home','produk','keranjang','chat'].includes(route);

      // Store identity is shared by every customer page.
      storeCollection("pengaturan").doc("toko_v13").onSnapshot((doc) => { if (doc.exists) { pengaturanToko = doc.data(); const namaToko = pengaturanToko.nama || "KasirQuh"; localStorage.setItem('cust_store_name_v13', namaToko); if(document.getElementById('receipt-shop-name')) document.getElementById('receipt-shop-name').innerText = namaToko; if(document.getElementById('receipt-shop-address')) document.getElementById('receipt-shop-address').innerText = pengaturanToko.alamat || ""; if (document.getElementById('customer-home-store-name')) document.getElementById('customer-home-store-name').innerText = namaToko; } });

      // Product data is needed by Home, Catalog, Cart/Checkout and AI chat.
      if (needsProducts) {
        storeCollection("produk").onSnapshot((snapshot) => { 
          databaseProduk = {};
          snapshot.forEach((doc) => { databaseProduk[doc.id] = doc.data(); });
          isProductsLoaded = true;
          if (route === 'home') muatBarangLarisHariIni();
          perbaruiTampilanKategori();
          refreshKatalogPelanggan();
          if(window.__promoRenderHook) window.__promoRenderHook();
          if (route === 'home') renderPromoTokoPelanggan();
          if (lastFetchedOrders && lastFetchedOrders.length > 0) renderQuickReorder(lastFetchedOrders);
        });
      }

      // Home-only realtime widgets: trending and stock/reorder configuration.
      if (route === 'home') {
        storeCollection("pengaturan").doc("beranda_pelanggan_laris").onSnapshot((doc) => {
          const cfg = doc.exists ? doc.data() : {enabled:true, limit:5};
          window.__sedangLarisConfig = { enabled: cfg.enabled !== false, limit: Math.min(20, Math.max(1, parseInt(cfg.limit,10) || 5)) };
          isTrendingConfigLoaded = true;
          muatBarangLarisHariIni();
        });
        storeCollection("pengaturan").doc("beranda_pelanggan_stok_rumah").onSnapshot((doc) => {
          const cfg = doc.exists ? doc.data() : {enabled:true, limit:5};
          window.__stokRumahConfig = { enabled: cfg.enabled !== false, limit: Math.min(20, Math.max(1, parseInt(cfg.limit,10) || 5)) };
          renderQuickReorder(lastFetchedOrders || []);
        }, (err) => {
          console.warn("Listener pengaturan Stok Rumah gagal:", err);
          renderQuickReorder(lastFetchedOrders || []);
        });
        storeCollection("transaksi").onSnapshot((snapshot) => {
          window.__trendingTransactionsSnapshot = snapshot;
          muatBarangLarisHariIni();
        }, (err) => {
          console.warn("Listener transaksi Sedang Laris gagal:", err);
          muatBarangLarisHariIni();
        });
      }
    }


    let homeFeatureTransitionTimer = null;
    function setHomeFeatureTransition(showHome) {
      const ids = ['reorder-section-wrapper','recipe-section-wrapper','trending-section-wrapper'];
      const catalog = document.querySelector('.home-catalog-transition');
      if (homeFeatureTransitionTimer) clearTimeout(homeFeatureTransitionTimer);

      if (!animasiNavigasiDeveloperAktif()) {
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          el.classList.remove('home-feature-closing');
          el.style.maxHeight = '';
          el.style.opacity = '';
          el.style.transform = '';
          el.style.display = showHome ? 'block' : 'none';
        });
        if (catalog) {
          catalog.classList.remove('catalog-lifting');
          catalog.classList.add('home-catalog-transition');
        }
        return;
      }

      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        if (!showHome) {
          if (getComputedStyle(el).display === 'none') {
            el.style.display = 'block';
          }
          // Mulai dari tinggi aktual agar penutupan benar-benar terlihat.
          el.style.maxHeight = el.scrollHeight + 'px';
          el.classList.remove('home-feature-closing');
          void el.offsetHeight;
          requestAnimationFrame(() => {
            el.classList.add('home-feature-closing');
          });
          el.addEventListener('transitionend', function(ev) {
            if (ev.propertyName !== 'max-height' || !el.classList.contains('home-feature-closing')) return;
            el.style.display = 'none';
          }, {once:true});
        } else {
          el.style.display = 'block';
          el.style.maxHeight = '0px';
          el.classList.add('home-feature-closing');
          void el.offsetHeight;
          requestAnimationFrame(() => {
            el.classList.remove('home-feature-closing');
            el.style.maxHeight = el.scrollHeight + 'px';
          });
        }
      });

      if (catalog) {
        catalog.classList.remove('catalog-lifting');
        void catalog.offsetHeight;
        if (!showHome) {
          // Saat panel-panel di atas mengempis, katalog ikut bergerak naik.
          requestAnimationFrame(() => catalog.classList.add('catalog-lifting'));
          homeFeatureTransitionTimer = setTimeout(() => catalog.classList.remove('catalog-lifting'), 760);
        } else {
          // Saat kembali ke Home, katalog turun sedikit lalu kembali ke posisi normal
          // bersamaan dengan panel Home yang membuka.
          catalog.classList.add('catalog-lifting');
          requestAnimationFrame(() => requestAnimationFrame(() => catalog.classList.remove('catalog-lifting')));
        }
      }
    }

    function switchTabPelanggan(tabId) {
      if (!appNavRestoring) {
        const nextState = Object.assign({}, appGetState(), { tab:tabId, category:tabId === 'belanja' ? (activeKategoriPelanggan || 'Home') : 'Home', search:false, modal:null, detailCode:null });
        const cur = history.state && history.state.__kasirquhState;
        const menuIsOpen = document.getElementById('menuToggleModal')?.classList.contains('show');
        if (menuIsOpen && cur && cur.modal === 'menuToggleModal') history.replaceState({ __kasirquh:true, __kasirquhRoute:window.KQ_CUSTOMER_PAGE?.route || 'home', __kasirquhState:nextState }, '', location.href);
        else if (cur && cur.modal === 'productDetailModal') history.replaceState({ __kasirquh:true, __kasirquhRoute:window.KQ_CUSTOMER_PAGE?.route || 'home', __kasirquhState:nextState }, '', location.href);
        else history.pushState({ __kasirquh:true, __kasirquhRoute:window.KQ_CUSTOMER_PAGE?.route || 'home', __kasirquhState:nextState }, '', location.href);
      }
      const previousTab = document.querySelector('.tab-content.active')?.id;
      if (previousTab === 'belanja' && tabId !== 'belanja') setHomeFeatureTransition(false);
      document.querySelectorAll('.tab-content').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
      const activeEl = document.getElementById(tabId); if (activeEl) { activeEl.classList.add('active'); activeEl.style.display = tabId === 'live-chat' ? 'flex' : 'block'; }
      if (tabId === 'live-chat') { unreadRumpiCust = 0; document.getElementById("badge-rumpi-subtab").style.display = "none"; document.getElementById("badge-livechat-cust").style.display = "none"; }
      if (tabId === 'belanja' && activeKategoriPelanggan === 'Home') { if (animasiNavigasiDeveloperAktif()) setTimeout(() => setHomeFeatureTransition(true), 20); else setHomeFeatureTransition(true); }
      document.querySelectorAll('.popup-menu-btn').forEach(btn => btn.classList.remove('active-menu'));
      const activeBtnMap = { 'belanja': 'pop-btn-belanja', 'data-pelanggan': 'pop-btn-datapelanggan', 'live-chat': 'pop-btn-livechat', 'pengaturan': 'pop-btn-pengaturan' };
      if (activeBtnMap[tabId]) { document.getElementById(activeBtnMap[tabId])?.classList.add('active-menu'); }

      const displays = {
        'belanja': { title: "Belanja", pBox: "flex", fabCart: "flex", fabAi: "flex", cat: "flex" },
        'data-pelanggan': { title: "Data Pelanggan", pBox: "none", fabCart: "none", fabAi: "none", cat: "none" },
        'live-chat': { title: "Live Chat", pBox: "none", fabCart: "none", fabAi: "none", cat: "none" },
        'pengaturan': { title: "Pengaturan", pBox: "none", fabCart: "none", fabAi: "none", cat: "none" }
      };
      
      let d = displays[tabId];
      document.getElementById('bottom-bar-title').innerText = d.title; document.getElementById('pagination-box').style.display = d.pBox;
      if(document.getElementById('fab-cart-btn')) document.getElementById('fab-cart-btn').style.display = d.fabCart; if(document.getElementById('fab-ai-btn')) document.getElementById('fab-ai-btn').style.display = d.fabAi;
      const searchContainer = document.getElementById('sticky-search-container');
      const searchFab = document.getElementById('fab-search-btn');
      if (tabId === 'belanja') {
        if (searchFab) searchFab.style.display = 'flex';
      } else {
        if (searchContainer) searchContainer.style.display = 'none';
        if (searchFab) searchFab.style.display = 'none';
      }
      const catContainer = document.getElementById('category-container'); if(catContainer) catContainer.style.display = d.cat;

      if(tabId === 'belanja') { perbaruiTampilanKategori(); const pb=document.getElementById('promo-banner-section'); if(pb && pb.getAttribute('aria-hidden') === 'false' && activeKategoriPelanggan === 'Home') pb.style.display = 'flex'; }
      else { 
        const promoBanner = document.getElementById('promo-banner-section'); if (promoBanner) promoBanner.style.display = 'none';
        setHomeFeatureTransition(false);
      }

      /* PHASE 12: Account settings form hydration is owned by settings.js. */
      if (tabId === 'pengaturan' && window.KQModules?.settings?.syncForm) { window.KQModules.settings.syncForm(); }
    }

    async function muatBarangLarisHariIni() {
      // Jangan pernah mengosongkan section hanya karena listener Firebase datang
      // dalam urutan yang berbeda. Produk dan konfigurasi harus siap lebih dulu.
      if (!isProductsLoaded || !isTrendingConfigLoaded) return;

      const cfg = window.__sedangLarisConfig || {enabled:true, limit:5};
      if (cfg.enabled === false) { renderTrending([]); return; }

      const limit = Math.min(20, Math.max(1, parseInt(cfg.limit,10) || 5));
      const token = ++trendingLoadToken;

      try {
        let snap = window.__trendingTransactionsSnapshot;

        // Listener adalah sumber utama. Jika belum tersedia (misalnya saat awal
        // koneksi), ambil data sekali sebagai fallback.
        if (!snap) {
          snap = await storeCollection("transaksi").get();
        }
        if (token !== trendingLoadToken) return;

        const docs = [];
        snap.forEach(doc => docs.push({ id: doc.id, data: doc.data() || {} }));

        // Tentukan tanggal transaksi yang dipakai:
        // 1. Utamakan hari ini jika ada transaksi.
        // 2. Jika hari ini kosong, otomatis pakai tanggal transaksi TERAKHIR.
        // Jadi kartu tidak blank walaupun hari ini/kemarin belum ada penjualan.
        const getDateKey = (data) => {
          let d = null;

          if (data.waktuTimestamp) {
            try {
              if (typeof data.waktuTimestamp.toDate === 'function') {
                d = data.waktuTimestamp.toDate();
              } else if (data.waktuTimestamp.seconds) {
                d = new Date(Number(data.waktuTimestamp.seconds) * 1000);
              }
            } catch (_) {}
          }

          if (!d && data.waktu) {
            const parsed = new Date(data.waktu);
            if (!isNaN(parsed.getTime())) d = parsed;
          }

          if (!d) return null;

          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        const dateKeys = docs.map(x => getDateKey(x.data)).filter(Boolean);
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        let targetDateKey = null;
        if (dateKeys.includes(todayKey)) {
          targetDateKey = todayKey;
        } else if (dateKeys.length) {
          targetDateKey = dateKeys.sort().pop();
        }

        if (!targetDateKey) {
          // Tidak ada transaksi sama sekali.
          renderTrending([]);
          return;
        }

        const itemCounts = {};
        const byName = {};

        Object.keys(databaseProduk).forEach(code => {
          const nama = String(databaseProduk[code]?.nama || '').trim().toLowerCase();
          if (nama) byName[nama] = code;
        });

        docs.forEach(({data}) => {
          if (getDateKey(data) !== targetDateKey || !Array.isArray(data.items)) return;

          data.items.forEach(it => {
            const qty = Number(it.qty) || 0;
            if (qty <= 0) return;

            const code = String(it.code || '').trim();
            if (code && databaseProduk[code]) {
              itemCounts[code] = (itemCounts[code] || 0) + qty;
              return;
            }

            // Data transaksi lama kadang punya code berbeda dari ID produk.
            // Cocokkan berdasarkan nama produk.
            const nama = String(it.nama || '').trim().toLowerCase();
            const matchedCode = byName[nama];
            if (matchedCode) {
              itemCounts[matchedCode] = (itemCounts[matchedCode] || 0) + qty;
            }
          });
        });

        const top = Object.keys(itemCounts)
          .sort((a,b) => itemCounts[b] - itemCounts[a])
          .slice(0, limit);

        renderTrending(top);

        // Simpan info tanggal yang sedang ditampilkan agar mudah dicek/debug.
        window.__sedangLarisDateKey = targetDateKey;
        window.__sedangLarisIsToday = targetDateKey === todayKey;
      } catch (err) {
        console.error('Gagal memuat Sedang Laris:', err);

        // Jangan menghapus tampilan lama ketika ada error jaringan/query.
        // Jika belum pernah ada tampilan sama sekali, baru sembunyikan section.
        if (!document.querySelector('#trending-container .trending-card')) {
          renderTrending([]);
        }
      }
    }


    // NO. 2 only: seamless auto-scroll for the "Stok Rumah Habis" carousel.
    // Because the track contains an exact duplicate, reset by half the track
    // width instead of jumping back to scrollLeft=0.
    function setupSeamlessReorderScroll(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      let isInteracting = false;
      let timeoutId = null;
      let lastTime = performance.now();

      const step = (now) => {
        const dt = Math.min(now - lastTime, 50);
        lastTime = now;

        if (!animasiNavigasiDeveloperAktif()) {
          requestAnimationFrame(step);
          return;
        }

        if (!isInteracting && container.scrollWidth > container.clientWidth) {
          const track = container.querySelector(".auto-scroll-track");
          const loopWidth = track ? track.scrollWidth / 2 : 0;

          // Slow, frame-rate-independent movement.
          container.scrollLeft += 0.026 * dt;

          // Seamless loop: the second copy is identical to the first.
          if (loopWidth > 0 && container.scrollLeft >= loopWidth) {
            container.scrollLeft -= loopWidth;
          }
        }

        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);

      const pause = () => {
        isInteracting = true;
        clearTimeout(timeoutId);
      };

      const resume = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { isInteracting = false; }, 2200);
      };

      container.addEventListener("touchstart", pause, { passive: true });
      container.addEventListener("touchend", resume, { passive: true });
      container.addEventListener("touchcancel", resume, { passive: true });
      container.addEventListener("mousedown", pause);
      container.addEventListener("mouseup", resume);
      container.addEventListener("mouseleave", resume);
    }

    function setupAutoScrollInteraction(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      let scrollSpeed = 0.8;
      let isInteracting = false;
      let timeoutId = null;

      const scrollInterval = setInterval(() => {
        if (!animasiNavigasiDeveloperAktif()) return;
        if (!isInteracting) {
          container.scrollLeft += scrollSpeed;
          if (container.scrollLeft >= (container.scrollWidth - container.clientWidth - 2)) {
            container.scrollLeft = 0;
          }
        }
      }, 30);

      container.addEventListener('touchstart', () => { isInteracting = true; clearTimeout(timeoutId); });
      container.addEventListener('touchend', () => {
        timeoutId = setTimeout(() => { isInteracting = false; }, 2500);
      });
      container.addEventListener('mousedown', () => { isInteracting = true; clearTimeout(timeoutId); });
      container.addEventListener('mouseup', () => {
        timeoutId = setTimeout(() => { isInteracting = false; }, 2500);
      });
    }

    function renderTrending(codes) {
      const container = document.getElementById("trending-container"); const wrapper = document.getElementById("trending-section-wrapper"); container.innerHTML = "";
      if(codes.length === 0) { wrapper.style.display = "none"; return; }
      
      let itemsHtml = "";
      codes.forEach(code => {
        let p = databaseProduk[code]; let fotoSrc = p.foto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/></svg>";
        let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs");
        let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
        if ((satuan.toLowerCase() === 'kg' || satuan.toLowerCase() === 'kilogram')) hargaParsed *= 10;
        
        itemsHtml += `
          <div onclick="openProductDetail('${code}')" class="trending-card">
            <img src="${fotoSrc}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.3);">
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: bold; font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">${p.nama}</div>
              <div style="font-size: 0.68rem; color: rgba(255,255,255,0.8); margin-bottom: 2px;">Sisa: ${p.stok} ${satuan}</div>
              <div style="font-size: 0.78rem; color: #fde047; font-weight: bold;">Rp ${hargaParsed.toLocaleString('id-ID')}</div>
            </div>
          </div>`;
      });
      container.innerHTML = `<div class="auto-scroll-track">${itemsHtml}${itemsHtml}</div>`;
      setupAutoScrollInteraction("trending-container");
      perbaruiTampilanKategori(); 
    }
/* PHASE 9: tambahKeKeranjangCepat extracted to _core/modules/products.js */

/* PHASE 9: refreshKatalogPelanggan extracted to _core/modules/products.js */


    // Pagination lama tidak lagi mengubah sumber data. Tahap berikutnya akan menggantinya dengan infinite scroll.
/* PHASE 9: ubahHalamanPos extracted to _core/modules/products.js */

/* PHASE 9: filterKatalogPelanggan extracted to _core/modules/products.js */


    // TAHAP 2: lazy rendering + infinite scroll.
    // DatabaseProduk tetap penuh. Sentinel dipakai agar tidak bergantung
    // pada window.scroll atau jenis container scroll yang dipakai halaman.
    let catalogScrollLoading = false;
    let catalogLoadObserver = null;
/* PHASE 9: loadNextCatalogBatch extracted to _core/modules/products.js */

/* PHASE 9: setupCatalogInfiniteScroll extracted to _core/modules/products.js */


    // Fallback tambahan untuk browser/scroll container yang tidak memicu
    // observer secara konsisten. Capture=true menangkap scroll dari elemen anak.
/* PHASE 9: handleCatalogInfiniteScroll extracted to _core/modules/products.js */


    window.addEventListener('scroll', handleCatalogInfiniteScroll, { passive: true });
    document.addEventListener('scroll', handleCatalogInfiniteScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleCatalogInfiniteScroll, { passive: true });
    window.addEventListener('load', setupCatalogInfiniteScroll, { once: true });

    // Assistant AI dari welcome gateway.
    window.addEventListener('load', () => {
      let openAI = false;
      try {
        openAI = sessionStorage.getItem('kasirquh_open_ai_from_welcome') === '1';
        if (openAI) sessionStorage.removeItem('kasirquh_open_ai_from_welcome');
      } catch (e) {}
      if (!openAI) return;
      setTimeout(() => {
        try { toggleAIChatModal(); } catch (e) { console.warn('Gagal membuka Assistant AI dari welcome:', e); }
      }, 900);
    }, { once: true });
    setTimeout(setupCatalogInfiniteScroll, 0);

    /* PHASE 10: renderCartPelanggan extracted to _core/modules/cart.js */

    /* PHASE 10: ubahQtyKeranjang extracted to _core/modules/cart.js */

    /* PHASE 10: kosongkanKeranjang extracted to _core/modules/cart.js */
    /* PHASE 10: openCartModal extracted to _core/modules/cart.js */
    /* PHASE 10: closeCartModal extracted to _core/modules/cart.js */
    /* PHASE 10: togglePayMethodCust extracted to _core/modules/cart.js */
    /* PHASE 10: handleProofUpload extracted to _core/modules/cart.js */

    /* PHASE 10: prosesSimpanMenuSaja extracted to _core/modules/cart.js */

    /* PHASE 10: prosesCheckoutPelanggan extracted to _core/modules/transactions.js */

    function muatDataPelangganRealtime() {
      storeCollection("pelanggan").where("phone", "==", currentCustomerPhone).onSnapshot((snapshot) => {
        const container = document.getElementById("customer-notes-container");
        container.innerHTML = "";
        snapshot.forEach((doc) => {
          let data = doc.data();
          currentCustomerDocId = doc.id;
          currentCustomerName = data.nama || 'Pelanggan';
          customerSavedRecipes = data.savedRecipes || [];
          renderRecipeCards();

          document.getElementById("profile-name").innerText = currentCustomerName;
          document.getElementById("profile-phone").innerText = data.phone || "-";
          
          if (data.catatan && data.catatan.length > 0) {
            data.catatan.forEach(note => {
              container.innerHTML += `<div style="border-bottom: 1px dashed var(--border-color); padding: 4px 0; font-size: 0.78rem;"><div style="color:var(--text-color);"><b>[${note.jenis}]</b> ${note.keterangan}</div><div style="font-size: 0.68rem; color: var(--text-muted);">${note.waktu}</div></div>`;
            });
          } else {
            container.innerHTML = `<div class="empty-state" style="font-size: 0.78rem;">Belum ada catatan atau tagihan.</div>`;
          }
        });
      });
    }
    
    /* PHASE 10: renderQuickReorder extracted to _core/modules/transactions.js */

    /* PHASE 10: muatRiwayatPesananOnlinePelanggan extracted to _core/modules/transactions.js */

    /* PHASE 12: simpanProfilPelanggan extracted to _core/modules/settings.js */
    /* PHASE 11: kirimPesanKeAI extracted to _core/modules/chat.js */
    function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/&lt;*</g, "&lt;").replace(/>/g, "&gt;"); }
    function toggleOpsiDeveloper() {
      const panel = document.getElementById('developer-options-panel');
      const btn = document.getElementById('Opsi Developer');
      if (!panel || !btn) return;
      const akanBuka = panel.style.display === 'none' || !panel.style.display;

      // Update tombol lebih dulu agar tap terasa instan, lalu lakukan reflow berat
      // setelah frame berikutnya. Containment mencegah perubahan panel merambat
      // menghitung ulang seluruh halaman katalog.
      btn.setAttribute('aria-expanded', String(akanBuka));
      btn.innerHTML = akanBuka ? '🛠️ Tutup Opsi Developer' : '🛠️ Opsi Developer';
      requestAnimationFrame(() => {
        panel.style.display = akanBuka ? 'block' : 'none';
      });
    }

    function animasiNavigasiDeveloperAktif() {
      return localStorage.getItem('cust_dev_nav_animation_v1') !== 'off';
    }

    function syncAnimasiNavigasiDeveloper() {
      const toggle = document.getElementById('developer-animation-toggle');
      const status = document.getElementById('developer-animation-status');
      const aktif = animasiNavigasiDeveloperAktif();
      if (toggle) toggle.checked = aktif;
      if (status) status.textContent = aktif ? 'Animasi navigasi & scroll: ON' : 'Animasi navigasi & scroll: OFF';
      document.documentElement.classList.toggle('dev-no-nav-animation', !aktif);
    }

    function toggleAnimasiNavigasiDeveloper(aktif) {
      localStorage.setItem('cust_dev_nav_animation_v1', aktif ? 'on' : 'off');
      syncAnimasiNavigasiDeveloper();
    }
    syncAnimasiNavigasiDeveloper();

    function bersihkanCacheTotal() { if (confirm("Bersihkan cache aplikasi?")) { if ('caches' in window) caches.keys().then((names) => { names.forEach((name) => { caches.delete(name); }); }); if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then((registrations) => { for(let r of registrations) r.unregister(); }); setTimeout(() => { window.location.reload(true); }, 500); } }
    async function hapusDataSitusPelanggan() {
      const ok = confirm("Hapus cookie & seluruh data situs aplikasi ini?\n\nYang akan dibersihkan: cookie yang dapat diakses JavaScript, localStorage, sessionStorage, IndexedDB, Cache Storage, dan service worker. Anda mungkin perlu masuk kembali.\n\nLanjutkan?");
      if (!ok) return;
      try {
        // Cookie yang dapat diakses JavaScript pada domain/path ini. Cookie HttpOnly tidak dapat dihapus oleh halaman web.
        const cookies = document.cookie ? document.cookie.split(";") : [];
        cookies.forEach(cookie => {
          const eq = cookie.indexOf("=");
          const name = (eq >= 0 ? cookie.slice(0, eq) : cookie).trim();
          if (!name) return;
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/";
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=" + location.pathname;
        });
        try { localStorage.clear(); } catch (_) {}
        try { sessionStorage.clear(); } catch (_) {}
        if (window.indexedDB) {
          if (indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all((dbs || []).map(db => db.name ? new Promise(resolve => { const req = indexedDB.deleteDatabase(db.name); req.onsuccess = req.onerror = req.onblocked = () => resolve(); }) : Promise.resolve()));
          }
        }
        if (window.caches) {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        }
        if (navigator.serviceWorker) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(r => r.unregister()));
        }
      } catch (err) {
        console.warn("Pembersihan data situs tidak sepenuhnya berhasil:", err);
      } finally {
        // Beri browser sedikit waktu menyelesaikan penghapusan sebelum memuat ulang.
        setTimeout(() => window.location.reload(), 350);
      }
    }
  

/* ===== EXTRACTED FROM pelanggan.html <script> #6 id=smooth-transisi-home-kategori-js-final ===== */

(function () {
  const IDS = ['reorder-section-wrapper','recipe-section-wrapper','trending-section-wrapper'];

  function els() {
    return IDS.map(id => document.getElementById(id)).filter(Boolean);
  }

  window.smoothHomeToCategory = function () {
    const blocks = els();
    blocks.forEach(el => {
      if (getComputedStyle(el).display === 'none') return;
      el.style.maxHeight = el.scrollHeight + 'px';
      void el.offsetHeight;
      el.classList.add('home-feature-closing');
    });

    const catalog = document.getElementById('pos-card-wrapper');
    if (catalog) {
      catalog.classList.add('home-catalog-transition');
      requestAnimationFrame(() => catalog.classList.add('catalog-lifting'));
      setTimeout(() => catalog.classList.remove('catalog-lifting'), 560);
    }
  };

  window.smoothCategoryToHome = function () {
    const blocks = els();
    blocks.forEach(el => {
      el.style.display = 'block';
      el.classList.remove('home-feature-closing');
      el.style.maxHeight = '0px';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-34px) scaleY(.97)';
    });

    requestAnimationFrame(() => {
      blocks.forEach(el => {
        el.style.maxHeight = el.scrollHeight + 'px';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) scaleY(1)';
      });
    });

    setTimeout(() => {
      blocks.forEach(el => {
        el.style.maxHeight = '';
        el.style.opacity = '';
        el.style.transform = '';
      });
    }, 850);
  };
})();


/* ===== EXTRACTED FROM pelanggan.html <script> #7 id=kq-back-to-top-script ===== */

  // Floating helper modern: muncul setelah user melewati ~2 layar.
  // Fungsi scroll tetap native smooth dan tidak mengubah lazy rendering.
  (function () {
    const fab = document.getElementById('scroll-helper-fab');
    if (!fab) return;

    // Selalu posisikan helper DI ATAS seluruh stack FAB (Asisten/Pencarian/Keranjang).
    // Tidak bergantung pada tebakan jarak, jadi tidak bisa ketiban FAB pencarian.
    function positionAboveFabStack() {
      const stack = document.querySelector('.fab-container');
      if (!stack) return;
      try {
        const r = stack.getBoundingClientRect();
        const gap = 12;
        const bottom = Math.max(90, window.innerHeight - r.top + gap);
        fab.style.setProperty('bottom', bottom + 'px', 'important');
      } catch (e) {}
    }

    let ticking = false;
    const threshold = () => Math.max(650, window.innerHeight * 2.05);

    function isScrolledEnough(source) {
      try {
        if (source === window) return window.scrollY > threshold();
        return source && source.scrollTop > threshold();
      } catch (e) { return false; }
    }

    function findScrollDepth() {
      if (window.scrollY > threshold()) return true;
      const known = [
        document.scrollingElement,
        document.documentElement,
        document.body,
        document.querySelector('.main-content'),
        document.querySelector('.tab-content.active'),
        document.getElementById('pos-card-wrapper'),
        document.getElementById('pos-catalog-container')
      ];
      for (const el of known) if (isScrolledEnough(el)) return true;
      return false;
    }

    function updateScrollHelper() {
      ticking = false;
      fab.classList.toggle('is-visible', findScrollDepth());
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScrollHelper);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
    window.addEventListener('resize', () => { positionAboveFabStack(); scheduleUpdate(); }, { passive: true });
    positionAboveFabStack();
    document.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
    scheduleUpdate();

    window.kembaliKeAtasKatalog = function () {
      const targets = new Set();
      const addTarget = (el) => { if (el) targets.add(el); };

      addTarget(document.scrollingElement);
      addTarget(document.documentElement);
      addTarget(document.body);
      addTarget(document.querySelector('.main-content'));
      addTarget(document.querySelector('.tab-content.active'));
      addTarget(document.getElementById('pos-card-wrapper'));
      addTarget(document.getElementById('pos-catalog-container'));

      // Ikuti container yang benar-benar sedang bergulir.
      document.querySelectorAll('*').forEach((el) => {
        try {
          if (el.scrollHeight > el.clientHeight + 2 && el.scrollTop > 0) addTarget(el);
        } catch (e) {}
      });

      const smooth = animasiNavigasiDeveloperAktif();
      targets.forEach((el) => {
        try { el.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' }); } catch (e) {
          try { el.scrollTop = 0; } catch (e2) {}
        }
      });

      try { window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' }); } catch (e) {
        try { window.scrollTo(0, 0); } catch (e2) {}
      }

      // OFF: langsung hilang. ON: beri waktu perjalanan smooth selesai.
      setTimeout(scheduleUpdate, smooth ? 450 : 0);
    };
  })();


/* ===== EXTRACTED FROM pelanggan.html <script> #8 id=modern-card-photo-bg-remover ===== */

/*
 * PROTOTYPE: hapus background foto produk yang menyatu dengan tepi foto.
 * Hanya dipakai pada Card View + tema Modern.
 * Data foto asli (JPEG Base64) TIDAK diubah; hasil transparan hanya untuk tampilan.
 * Fokus awal: background putih/abu sangat terang yang mengelilingi produk.
 */
function makeModernProductTransparent(img) {
  if (!img || !document.body || document.body.getAttribute('data-theme') !== 'modern') return;
  if (img.dataset.bgRemoved === '1' || !img.src) return;
  img.dataset.bgRemoved = '1';

  const run = () => {
    try {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return;
      const max = 420;
      const scale = Math.min(1, max / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, cw, ch);
      const image = ctx.getImageData(0, 0, cw, ch);
      const d = image.data;

      // Estimasi warna background dari empat sudut.
      const pts = [[0,0],[cw-1,0],[0,ch-1],[cw-1,ch-1]];
      let br=0,bg=0,bb=0;
      pts.forEach(([x,y]) => { const i=(y*cw+x)*4; br+=d[i]; bg+=d[i+1]; bb+=d[i+2]; });
      br/=4; bg/=4; bb/=4;
      const brightness=(br+bg+bb)/3;
      // Prototype sengaja konservatif: hanya background terang/putih.
      if (brightness < 205) {
        img.classList.add('modern-photo-fallback');
        return;
      }

      const visited = new Uint8Array(cw*ch);
      const qx = new Int32Array(cw*ch);
      const qy = new Int32Array(cw*ch);
      let head=0, tail=0;
      const seed = (x,y) => { const pos=y*cw+x; if (!visited[pos]) { visited[pos]=1; qx[tail]=x; qy[tail]=y; tail++; } };
      for(let x=0;x<cw;x++){ seed(x,0); seed(x,ch-1); }
      for(let y=1;y<ch-1;y++){ seed(0,y); seed(cw-1,y); }

      const tolerance = 62;
      const dist = (i) => Math.sqrt((d[i]-br)**2 + (d[i+1]-bg)**2 + (d[i+2]-bb)**2);
      while(head<tail){
        const x=qx[head], y=qy[head++], i=(y*cw+x)*4;
        if (dist(i) <= tolerance && (d[i]+d[i+1]+d[i+2])/3 >= 185) {
          d[i+3]=0;
          if(x>0) seed(x-1,y); if(x<cw-1) seed(x+1,y); if(y>0) seed(x,y-1); if(y<ch-1) seed(x,y+1);
        }
      }

      ctx.putImageData(image,0,0);
      const transparentSrc = canvas.toDataURL('image/png');
      // Jika ternyata tidak ada pixel yang berhasil dibuat transparan, gunakan fallback rounded.
      if (!transparentSrc || transparentSrc.length < 100) {
        img.classList.add('modern-photo-fallback');
        return;
      }
      img.src = transparentSrc;
      img.classList.add('modern-bg-removed');
    } catch (e) {
      // Jika browser/remote image tidak mengizinkan canvas, biarkan foto asli tampil
      // dengan fallback rounded + shadow.
      img.dataset.bgRemoved = '0';
      img.classList.add('modern-photo-fallback');
    }
  };
  if (img.complete && img.naturalWidth) run(); else img.addEventListener('load', run, {once:true});
}


