
/* ===== H-07-Q: CUSTOMER LOGIN-FIRST AUTH GUARD ===== */
(function () {
  function updateFabAuthVisibility() {
    const login = document.getElementById('customerLoginModal');
    const loginVisible = !!login && getComputedStyle(login).display !== 'none';
    document.body.classList.toggle('fab-auth-hidden', loginVisible);
  }
  function installFabAuthGuard() {
    updateFabAuthVisibility();
    const el = document.getElementById('customerLoginModal');
    if (el) new MutationObserver(updateFabAuthVisibility).observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    setInterval(updateFabAuthVisibility, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installFabAuthGuard);
  else installFabAuthGuard();
})();

/* ===== EXTRACTED FROM pelanggan.html <script> #4 id=none ===== */

    let isAiSoundOn = true; let aiRecognition = null; let isAiListening = false;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; aiRecognition = new SpeechRecognition(); aiRecognition.lang = 'id-ID';
      aiRecognition.onresult = function(e) { document.getElementById('ai-chat-input').value = e.results[0][0].transcript; stopAiListeningState(); kirimPesanKeAI(); };
      aiRecognition.onerror = function(e) { stopAiListeningState(); }; aiRecognition.onend = function() { stopAiListeningState(); };
    }
    function toggleAISpeechRecognition() { if (!aiRecognition) return showToast("Fitur suara tidak didukung browser ini.", "error"); if (isAiListening) { aiRecognition.stop(); stopAiListeningState(); } else { aiRecognition.start(); startAiListeningState(); } }
    function startAiListeningState() { isAiListening = true; const micBtn = document.getElementById('aiMicButton'); micBtn.style.background = '#dc2626'; micBtn.innerText = "🛑"; document.getElementById('ai-chat-input').placeholder = "Mendengarkan..."; }
    function stopAiListeningState() { isAiListening = false; const micBtn = document.getElementById('aiMicButton'); micBtn.style.background = '#374151'; micBtn.innerText = "🎤"; document.getElementById('ai-chat-input').placeholder = "Tanya stok, harga..."; }
    function toggleAISound() { isAiSoundOn = !isAiSoundOn; document.getElementById('aiSoundToggle').innerText = isAiSoundOn ? "🔊 Suara: ON" : "🔇 Suara: OFF"; if (!isAiSoundOn && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }

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

    function bagikanProdukViaWA() {
      if(!currentDetailCode) return;
      let p = databaseProduk[currentDetailCode]; if(!p) return;
      let storeName = pengaturanToko.nama || "KasirQuh";
      let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs");
      let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
      let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
      if (satuan === 'kg' || satuan === 'kilogram') hargaParsed *= 10;

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 460;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 400, 460);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(1, '#7c3aed');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 460);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(storeName, 200, 40);

      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(30, 60, 340, 300, 16);
        ctx.fill();
      } else {
        ctx.fillRect(30, 60, 340, 300);
      }

      let fotoSrc = p.foto || "";
      if (fotoSrc) {
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = fotoSrc;
        img.onload = function() {
          ctx.drawImage(img, 120, 75, 160, 140);
          renderTeksDanBagikanProduk(ctx, canvas, p, hargaParsed, satuan, storeName);
        };
        img.onerror = function() {
          renderTeksDanBagikanProduk(ctx, canvas, p, hargaParsed, satuan, storeName);
        };
      } else {
        renderTeksDanBagikanProduk(ctx, canvas, p, hargaParsed, satuan, storeName);
      }
    }

    function renderTeksDanBagikanProduk(ctx, canvas, p, hargaParsed, satuan, storeName) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.nama, 200, 245);

      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Rp ${hargaParsed.toLocaleString('id-ID')} / ${satuan}`, 200, 280);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Stok Tersedia: ${p.stok || 0} ${satuan}`, 200, 310);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText("🛒 Yuk Belanja di " + storeName, 200, 405);

      const vercelUrl = getPelangganVercelUrl();

      canvas.toBlob(async (blob) => {
        const file = new File([blob], "produk-" + p.nama.replace(/[^a-zA-Z0-9]/g, '_') + ".png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: p.nama,
              text: `Yuk beli *${p.nama}* seharga Rp ${hargaParsed.toLocaleString('id-ID')} / ${satuan} di ${storeName}!\n\nCek di sini:\n${vercelUrl}`
            });
          } catch (err) {
            console.log(err);
          }
        } else {
          const link = document.createElement('a');
          link.download = 'produk.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast("📥 Gambar produk diunduh! Silakan kirimkan ke WhatsApp.");
        }
      }, 'image/png');
    }
  

/* ===== EXTRACTED FROM pelanggan.html <script> #5 id=none ===== */

    const firebaseConfig = { apiKey: "AIzaSyCwOxkcydduRDC9v1b_XOr8K8FYtpHOY2g", authDomain: "kasirquh.firebaseapp.com", projectId: "kasirquh", storageBucket: "kasirquh.firebasestorage.app", messagingSenderId: "87320899036", appId: "1:87320899036:web:592c6768ea4aca6bdbb319", measurementId: "G-2BL7RJN9Z5" };
    firebase.initializeApp(firebaseConfig); const db = firebase.firestore();
    // ===== V13 STORE DATA ROUTER =====
    // Semua data operasional toko sekarang berada di: toko/{tokoId}/{koleksi}.
    // tokoId bersifat stabil dan TIDAK mengikuti nama toko.
    const ACTIVE_TOKO_ID = "toko_v13";
    const V13_STORE_COLLECTIONS = new Set(["produk", "pelanggan", "transaksi", "catatan", "db_chat_rumpi", "chats", "pengaturan"]);
    function storeCollection(name) {
      if (!V13_STORE_COLLECTIONS.has(name)) return db.collection(name);
      return db.collection("toko").doc(ACTIVE_TOKO_ID).collection(name);
    }


    let databaseProduk = {}; let cart = []; let pengaturanToko = { nama: "", phone: "" };
    let currentCustomerPhone = localStorage.getItem('cust_phone_v13') || ''; let currentCustomerName = 'Pelanggan'; let currentCustomerDocId = ''; let customerSavedRecipes = []; let lastFetchedOrders = []; let catalogViewMode = localStorage.getItem('cust_view_v13') || 'grid';
    let isProductsLoaded = false; let isTrendingConfigLoaded = false; let trendingLoadToken = 0; let currentPosPage = 1; let itemsPerPagePos = 24;
    // STAGE 9: satu gerbang visual untuk dashboard utama agar konten berbasis DB
    // tidak muncul sepotong-sepotong saat first paint. Listener tetap realtime.
    let dashboardPrimaryReady = false;
    let dashboardChatStarted = false;
    let dashboardHomeInfoCfg = null;
    let dashboardPrimaryState = { products:false, recipes:false, trendingConfig:false, trendingTransactions:false, stokConfig:false, stokOrders:false };
    dashboardPrimaryState.stokOrders = !currentCustomerPhone;

    function tryRevealPrimaryDashboard() {
      if (dashboardPrimaryReady) return;
      const ready = dashboardPrimaryState.products && dashboardPrimaryState.recipes &&
        dashboardPrimaryState.trendingConfig && dashboardPrimaryState.trendingTransactions &&
        dashboardPrimaryState.stokConfig && dashboardPrimaryState.stokOrders;
      if (!ready) return;
      dashboardPrimaryReady = true;
      ['recipe-section-wrapper','trending-section-wrapper'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('dashboard-primary-pending');
        el.classList.add('dashboard-primary-ready');
      });
      const categoryEl = document.getElementById('category-container');
      if (categoryEl) {
        categoryEl.classList.remove('dashboard-category-pending');
        categoryEl.classList.add('dashboard-category-ready');
      }
      if (dashboardHomeInfoCfg) renderCustomerHomeInfo(dashboardHomeInfoCfg);
      renderRecipeCards();
      muatBarangLarisHariIni();
      renderQuickReorder(lastFetchedOrders || []);
      initKategoriPelangganListener();
      initPromoTokoPelanggan();
      if (!dashboardChatStarted) {
        dashboardChatStarted = true;
        const deferCustomerRealtime = window.requestIdleCallback || function(cb) { setTimeout(cb, 700); };
        deferCustomerRealtime(() => {
          initChatRumpiListener();
          if (currentCustomerPhone) initCustomerChatListener();
        });
      }
    }

    // TAHAP 1: jumlah card katalog yang ditampilkan saat awal. Ini TIDAK membatasi databaseProduk/dashboard.
    const CATALOG_INITIAL_VISIBLE = 6;
    let catalogVisibleCount = CATALOG_INITIAL_VISIBLE;
    let customerChatUnsubscribe = null; let chatRumpiUnsubscribe = null;
    let activeKategoriPelanggan = 'Home'; let toastTimeout; let masterKategoriPelanggan = [];
    let adminCustomerRecipes = []; let adminCustomerRecipesEnabled = false;

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
        tab: document.querySelector('.tab-content.active')?.id || 'belanja',
        category: activeKategoriPelanggan || 'Home',
        search: !!searchOpen,
        modal: modal,
        detailCode: modal === 'productDetailModal' ? currentDetailCode : null
      };
    }

    function appNormalizeState(state) {
      const base = { tab:'belanja', category:'Home', search:false, modal:null, detailCode:null };
      return Object.assign(base, state || {});
    }

    function appPushState(patch) {
      if (!appNavReady || appNavRestoring) return;
      const next = Object.assign({}, appGetState(), patch || {});
      const current = history.state && history.state.__kasirquhState;
      // Hindari entry duplikat yang sama persis.
      if (current && JSON.stringify(current) === JSON.stringify(next)) return;
      history.pushState({ __kasirquh: true, __kasirquhState: next }, '', location.href);
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
        if (state.tab && document.getElementById(state.tab)) switchTabPelanggan(state.tab);
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
      const initial = { tab:'belanja', category: activeKategoriPelanggan || 'Home', search:false, modal:null, detailCode:null };
      history.replaceState({ __kasirquh: true, __kasirquhState: initial }, '', location.href);
      appNavReady = true;
      window.addEventListener('popstate', function(event) {
        const state = event.state && event.state.__kasirquhState;
        if (state) {
          appRestoreState(state);
          return;
        }
        // Jika browser mengirim popstate tanpa state internal, kembalikan ke Home.
        appRestoreState(initial);
      });
    }

    function appOpenModal(id, detailCode = null) {
      appPushState({ modal:id, detailCode:detailCode });
    }



    window.onload = function() {
      applyThemePelanggan(localStorage.getItem('cust_theme_v13') || 'modern');
      initAndroidBackNavigation();
      updateCustomerGreeting(); setInterval(updateCustomerGreeting, 60000);
      const cachedStoreName = localStorage.getItem('cust_store_name_v13'); if (cachedStoreName) { document.getElementById('receipt-shop-name').innerText = cachedStoreName; if(document.getElementById('customer-home-store-name')) document.getElementById('customer-home-store-name').innerText = cachedStoreName; }
      if (currentCustomerPhone) {
        document.getElementById('customerLoginModal').style.display = 'none';
        muatDataPelangganRealtime(); muatRiwayatPesananOnlinePelanggan(); periksaCheckinHarian(); tampilkanKoinDiProfil();
      } else { document.getElementById('customerLoginModal').style.display = 'flex'; gantiFormAuth('login'); }
      // Stage 9: header tetap first paint, lalu dashboard utama berbasis DB
      // berjalan dalam satu fase paralel. Tidak ada delay buatan.
      initHeaderTokoListener();
      initCustomerHomeInfoListener();
      const deferDashboardAfterHeader = window.requestAnimationFrame || function(cb) { setTimeout(cb, 16); };
      deferDashboardAfterHeader(() => {
        initStokRumahListener();
        initIdeMasakPelanggan();
        initSedangLarisListeners();
        initProdukKatalogListener();
      });

    };

    function updateCustomerGreeting() {
      const el = document.getElementById('customer-home-greeting');
      if (!el) return;
      const hour = Number(new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date()));
      const greeting = hour >= 5 && hour < 11 ? 'Selamat pagi 👋' : hour >= 11 && hour < 15 ? 'Selamat siang ☀️' : hour >= 15 && hour < 18 ? 'Selamat sore 🌤️' : 'Selamat malam 🌙';
      el.textContent = greeting;
    }

    function renderCustomerHomeInfo(cfg) {
      dashboardHomeInfoCfg = cfg || {};
      const running=document.getElementById('customer-home-running-text');
      if(!running) return;
      const text = (cfg && typeof cfg.runningText === 'string') ? cfg.runningText.trim() : '';
      running.textContent = text;
      running.classList.remove('run-once');
      if(text) {
        void running.offsetWidth;
        running.classList.add('run-once');
      }
      if (!dashboardPrimaryReady) return;
      const infoLine = document.getElementById('customer-home-info-line');
      if (infoLine) {
        infoLine.classList.remove('dashboard-home-info-pending');
        infoLine.classList.add('dashboard-home-info-ready');
      }
    }

    function initCustomerHomeInfoListener() {
      storeCollection("pengaturan").doc('beranda_pelanggan_home').onSnapshot(snap => {
        renderCustomerHomeInfo(snap.exists ? snap.data() : {});
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
    function tampilkanKoinDiProfil() { let coins = localStorage.getItem('koin_warga_' + currentCustomerPhone) || 0; document.getElementById('profile-coins').innerText = coins; }

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

    function initIdeMasakPelanggan() {
      // Tahap 3: listener konfigurasi Ide Masak dimulai setelah Header + Stok Rumah sempat render.
      muatIdeMasakAdminPelanggan();
    }

    async function muatIdeMasakAdminPelanggan() {
      try {
        const snap = await storeCollection("pengaturan").doc("beranda_pelanggan_resep").get();
        if (!snap.exists) {
          adminCustomerRecipesEnabled = false;
          adminCustomerRecipes = [];
        } else {
          const data = snap.data() || {};
          adminCustomerRecipesEnabled = data.enabled === true;
          adminCustomerRecipes = adminCustomerRecipesEnabled && Array.isArray(data.recipes) ? data.recipes : [];
        }
      } catch(e) {
        adminCustomerRecipesEnabled = false;
        adminCustomerRecipes = [];
      }
      dashboardPrimaryState.recipes = true;
      tryRevealPrimaryDashboard();
    }

    function renderRecipeCards() {
      if (!dashboardPrimaryReady) return;
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

    function applyThemePelanggan(theme) { const safeTheme = ['light', 'dark', 'modern'].includes(theme) ? theme : 'light'; document.body.setAttribute('data-theme', safeTheme); }
    function gantiTemaPelanggan(theme) {
      const safeTheme = ['light', 'dark', 'modern'].includes(theme) ? theme : 'light';
      const previousTheme = localStorage.getItem('cust_theme_v13') || 'modern';
      localStorage.setItem('cust_theme_v13', safeTheme);
      applyThemePelanggan(safeTheme);
      if (previousTheme !== safeTheme) {
        window.location.reload();
      }
    }
    function updateCatalogViewButtons() {
      document.querySelectorAll('.catalog-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === catalogViewMode);
      });
    }
    function gantiViewModePelanggan(mode) {
      if (!['list','grid','card'].includes(mode)) mode = 'grid';
      catalogViewMode = mode;
      localStorage.setItem('cust_view_v13', mode);
      updateCatalogViewButtons();
      refreshKatalogPelanggan();
    }
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

    function renderKategoriPelanggan(categories) {
      masterKategoriPelanggan = Array.isArray(categories) ? [...new Set(categories.map(v => String(v || '').trim()).filter(Boolean))] : [];
      const container = document.getElementById('category-container');
      if (!container) return;
      const keep = container.querySelectorAll('[data-category="Home"],[data-category="Produk"]');
      container.innerHTML = '';
      keep.forEach(btn => container.appendChild(btn));
      masterKategoriPelanggan.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'chip-btn'; btn.dataset.category = cat; btn.title = cat; btn.setAttribute('aria-label', cat);
        btn.innerHTML = '<svg aria-hidden="true" class="category-line-icon" viewBox="0 0 24 24"><path d="M5 7h14v14H5z"></path><path d="M8 7V4h8v3"></path><path d="M9 12h6M9 16h4"></path></svg>';
        btn.addEventListener('click', () => pilihKategoriPelanggan(cat));
        container.appendChild(btn);
      });
      if (activeKategoriPelanggan !== 'Home' && activeKategoriPelanggan !== 'Produk' && !masterKategoriPelanggan.includes(activeKategoriPelanggan)) {
        activeKategoriPelanggan = 'Home';
      }
      document.querySelectorAll('#category-container .chip-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.category === activeKategoriPelanggan));
      perbaruiTampilanKategori();
    }

    function pilihKategoriPelanggan(kategori) {
      const wasHome = activeKategoriPelanggan === 'Home';
      if (wasHome && kategori !== 'Home' && animasiNavigasiDeveloperAktif() && window.smoothHomeToCategory) window.smoothHomeToCategory();
      if (!wasHome && kategori === 'Home' && animasiNavigasiDeveloperAktif() && window.smoothCategoryToHome) window.smoothCategoryToHome();
      if (!appNavRestoring) appPushState({ category:kategori, search:false, modal:null });
      if (wasHome && kategori !== 'Home') setHomeFeatureTransition(false);
      activeKategoriPelanggan = kategori;
      if (!wasHome && kategori === 'Home') setTimeout(() => setHomeFeatureTransition(true), 20);
      document.querySelectorAll('#category-container .chip-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === kategori);
      });
      currentPosPage = 1;
      perbaruiTampilanKategori();
      refreshKatalogPelanggan();
    }
    
    function perbaruiTampilanKategori() {
      const searchOpen = document.getElementById('sticky-search-container')?.style.display === 'block';
      const isHome = activeKategoriPelanggan === 'Home';
      const titleEl = document.getElementById('catalog-category-title');
      const activeBtn = Array.from(document.querySelectorAll('#category-container .chip-btn')).find(btn => btn.dataset.category === activeKategoriPelanggan);

      if (titleEl) {
        if (isHome) {
          titleEl.textContent = '';
          titleEl.style.display = 'none';
        } else {
          const ikon = activeBtn ? activeBtn.textContent.trim() : '';
          titleEl.textContent = `${ikon} ${activeKategoriPelanggan}`.trim();
          titleEl.style.display = 'block';
        }
      }

      if (searchOpen) {
        ['category-container'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
        setHomeFeatureTransition(false);
        return;
      }

      const promoBanner = document.getElementById('promo-banner-section');
      if (promoBanner) promoBanner.style.display = (promoBanner.getAttribute('aria-hidden') === 'false' && isHome) ? 'flex' : 'none';
      const reorderHasItems = !!document.getElementById('reorder-container')?.children.length;
      if (!isHome) {
        ['reorder-section-wrapper','recipe-section-wrapper','trending-section-wrapper'].forEach(id => { const el=document.getElementById(id); if (el && !el.classList.contains('home-feature-closing')) el.style.display='block'; });
        setHomeFeatureTransition(false);
      } else {
        const reorderWrapper = document.getElementById('reorder-section-wrapper');
        if (reorderWrapper && !reorderHasItems) reorderWrapper.style.display = 'none';
        setHomeFeatureTransition(true);
      }
    }

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

    function openProductDetail(code) {
      if (!appNavRestoring) appOpenModal('productDetailModal', code);
      let p = databaseProduk[code]; if(!p) return;
      currentDetailCode = code;
      let fotoSrc = p.foto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/></svg>";
      let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs");
      let isKg = satuan === 'kg' || satuan === 'kilogram';
      let hargaParsed = typeof p.hargaJual === 'number' ? p.hargaJual : parseInt((p.hargaJual || p.harga || 0).toString().replace(/[^0-9]/g, '')) || 0;
      if (isKg) hargaParsed *= 10;
      
      currentDetailStep = isKg ? 0.25 : 1;
      currentDetailQty = currentDetailStep;
      
      const detailModal = document.getElementById("productDetailModal");
      const modernCardDetail = document.body.getAttribute('data-theme') === 'modern' && catalogViewMode === 'card';
      detailModal.classList.toggle('modern-card-detail-mode', modernCardDetail);
      const detailImg = document.getElementById('detail-img');
      detailImg.src = fotoSrc;
      if (modernCardDetail) {
        detailImg.onload = function(){
          if (typeof makeModernProductTransparent === 'function') makeModernProductTransparent(this);
        };
      }
      document.getElementById('detail-category').innerText = p.kategori || "UMUM";
      document.getElementById('detail-name').innerText = p.nama;
      document.getElementById('detail-price').innerText = `Rp ${hargaParsed.toLocaleString('id-ID')} / ${satuan}`;
      document.getElementById('detail-stock').innerText = `${p.stok || 0} ${satuan}`;
      document.getElementById('detail-desc').innerText = p.deskripsi || "Barang berkualitas dari toko kami.";
      document.getElementById('detail-qty-input').value = currentDetailQty;

      let btnAdd = document.getElementById('btn-detail-add');
      if((p.stok || 0) <= 0) {
        btnAdd.style.background = "#94a3b8"; btnAdd.innerText = "Stok Habis"; btnAdd.disabled = true;
      } else {
        btnAdd.style.background = "#2563eb"; btnAdd.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg> Masukkan`; btnAdd.disabled = false;
      }
      detailModal.classList.add("show");
    }
    
    function closeProductDetail(skipHistory = false) {
      if (!skipHistory && !appNavRestoring && history.state?.__kasirquhState?.modal === 'productDetailModal') { history.back(); return; }
      const detailModal = document.getElementById('productDetailModal');
      detailModal.classList.remove('show');
      detailModal.classList.remove('modern-card-detail-mode');
    }

    function ubahQtyDetail(dir) {
      if(!currentDetailCode) return;
      let p = databaseProduk[currentDetailCode]; if(!p) return;
      let newQty = currentDetailQty + (dir * currentDetailStep);
      if(newQty < currentDetailStep) newQty = currentDetailStep;
      if(newQty > (p.stok || 0)) return showToast("Sisa stok hanya " + p.stok, "error");
      currentDetailQty = parseFloat(newQty.toFixed(3));
      document.getElementById('detail-qty-input').value = currentDetailQty;
    }

    function tambahDariDetail() {
      if(!currentDetailCode) return;
      let p = databaseProduk[currentDetailCode]; if(!p) return;
      let qtyToAdd = currentDetailQty;
      let satuan = (p.satuan || "").toLowerCase().trim(); let isKg = (satuan === "kg" || satuan === "kilogram");
      
      let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
      let valModal = p.hargaModal !== undefined ? p.hargaModal : (p.modal || 0); let modalParsed = typeof valModal === 'number' ? valModal : parseInt(valModal.toString().replace(/[^0-9]/g, '')) || 0;
      if (isKg) { hargaParsed *= 10; modalParsed *= 10; }

      let item = cart.find(i => i.code === currentDetailCode);
      if (item) { 
        if (item.qty + qtyToAdd > p.stok) return alert("Stok tidak mencukupi!"); 
        item.qty += qtyToAdd; item.qty = parseFloat(item.qty.toFixed(3)); item.subtotal = Math.round(item.qty * hargaParsed); 
      } else { 
        cart.push({ code: currentDetailCode, nama: p.nama, harga: hargaParsed, modal: modalParsed, qty: qtyToAdd, subtotal: Math.round(qtyToAdd * hargaParsed), foto: p.foto }); 
      }
      playBeep(); showToast("🛒 " + p.nama + " ditambahkan.");
      const cartFab = document.getElementById("fab-cart-btn"); if (cartFab) { cartFab.classList.remove("cart-animating"); void cartFab.offsetWidth; cartFab.classList.add("cart-animating"); }
      renderCartPelanggan(); closeProductDetail(true);
    }

    function tanyaAdminBarang() {
      if(!currentDetailCode) return;
      let p = databaseProduk[currentDetailCode];
      closeProductDetail(true);
      switchTabPelanggan('live-chat'); switchSubTabLiveChat('admin');
      let inputEl = document.getElementById("customer-chat-input");
      if(inputEl) { inputEl.value = `Halo admin, saya mau tanya soal barang ${p.nama}... `; setTimeout(() => inputEl.focus(), 500); }
    }

    function switchSubTabLiveChat(sub) {
      const btnAdmin = document.getElementById('subtab-btn-admin'); const btnRumpi = document.getElementById('subtab-btn-rumpi');
      const contentAdmin = document.getElementById('subtab-admin-content'); const contentRumpi = document.getElementById('subtab-rumpi-content');
      if (sub === 'admin') {
        btnAdmin.style.color = '#2563eb'; btnAdmin.style.borderBottomColor = '#2563eb'; btnRumpi.style.color = 'var(--text-muted)'; btnRumpi.style.borderBottomColor = 'transparent';
        contentAdmin.style.display = 'flex'; contentRumpi.style.display = 'none';
        if (currentCustomerPhone) storeCollection("chats").doc(currentCustomerPhone).update({ unreadCustomer: 0 }).catch(() => {});
      } else {
        btnRumpi.style.color = '#2563eb'; btnRumpi.style.borderBottomColor = '#2563eb'; btnAdmin.style.color = 'var(--text-muted)'; btnAdmin.style.borderBottomColor = 'transparent';
        contentRumpi.style.display = 'flex'; contentAdmin.style.display = 'none';
        unreadRumpiCust = 0; document.getElementById("badge-rumpi-subtab").style.display = "none"; document.getElementById("badge-livechat-cust").style.display = "none";
      }
    }

    let unreadRumpiCust = 0;
    function initChatRumpiListener() {
      let isInitialLoadRumpi = true; if (chatRumpiUnsubscribe) chatRumpiUnsubscribe();
      chatRumpiUnsubscribe = storeCollection("db_chat_rumpi").orderBy("waktuTimestamp", "asc").onSnapshot((snapshot) => {
          if (!isInitialLoadRumpi) { snapshot.docChanges().forEach((change) => { if (change.type === "added" && change.doc.data().senderPhone !== currentCustomerPhone) { playCustomerNotificationSound(); let isRumpiSubActive = document.getElementById('live-chat').classList.contains('active') && document.getElementById('subtab-rumpi-content').style.display !== 'none'; if (!isRumpiSubActive) { unreadRumpiCust++; let badgeSub = document.getElementById("badge-rumpi-subtab"); if (badgeSub) { badgeSub.innerText = unreadRumpiCust; badgeSub.style.display = "inline-block"; } let badgeMain = document.getElementById("badge-livechat-cust"); if (badgeMain) { badgeMain.innerText = unreadRumpiCust; badgeMain.style.display = "inline-block"; } } } }); }
          isInitialLoadRumpi = false; let msgContainer = document.getElementById("chat-rumpi-messages"); if (!msgContainer) return;
          msgContainer.innerHTML = snapshot.empty ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; margin-top: 15px;">Belum ada percakapan. Yuk mulai ngobrol, Kak!</div>` : "";
          snapshot.forEach(doc => { let m = doc.data(); let isMyMessage = m.senderPhone === currentCustomerPhone; let alignStyle = isMyMessage ? "align-self: flex-end; background: #2563eb; color: white;" : "align-self: flex-start; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color);"; msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; ${alignStyle}">${!isMyMessage ? `<div style="font-size: 0.65rem; font-weight: bold; color: #16a34a; margin-bottom: 2px;">${m.senderName || 'Warga Toko'}</div>` : ''}<div>${escapeHtml(m.pesan || '')}</div><div style="font-size: 0.58rem; opacity: 0.8; text-align: right; margin-top: 2px;">${m.waktu || ''}</div></div>`; });
          msgContainer.scrollTop = msgContainer.scrollHeight;
        });
    }

    function kirimPesanChatRumpi() { if (!currentCustomerPhone) return alert("Silakan login untuk ikut merumpikan!"); let inputEl = document.getElementById("chat-rumpi-input"); let pesan = inputEl.value.trim(); if (!pesan) return; let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID'); storeCollection("db_chat_rumpi").add({ senderPhone: currentCustomerPhone, senderName: currentCustomerName || 'Pelanggan', pesan: pesan, waktu: nowStr, waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { inputEl.value = ""; }).catch(err => { alert("Gagal mengirim pesan: " + err.message); }); }
    function initCustomerChatListener() { if (!currentCustomerPhone) return; storeCollection("chats").doc(currentCustomerPhone).onSnapshot((doc) => { if (doc.exists) { let unread = doc.data().unreadCustomer || 0; let badgeAdminSub = document.getElementById("badge-admin-subtab"); if (badgeAdminSub) { if (unread > 0) { badgeAdminSub.innerText = unread; badgeAdminSub.style.display = "inline-block"; } else { badgeAdminSub.style.display = "none"; } } } }); if (customerChatUnsubscribe) customerChatUnsubscribe(); let isInitialLoadChat = true; customerChatUnsubscribe = storeCollection("chats").doc(currentCustomerPhone).collection("messages").orderBy("waktuTimestamp", "asc").onSnapshot((snapshot) => { if (!isInitialLoadChat) { snapshot.docChanges().forEach((change) => { if (change.type === "added" && change.doc.data().pengirim === "admin") { playCustomerNotificationSound(); } }); } isInitialLoadChat = false; let msgContainer = document.getElementById("customer-chat-messages"); if (!msgContainer) return; msgContainer.innerHTML = snapshot.empty ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; margin-top: 15px;">Belum ada pesan. Sampaikan pertanyaan Anda ke toko!</div>` : ""; snapshot.forEach(doc => { let m = doc.data(); let isCustomer = m.pengirim === "customer"; let alignBubble = isCustomer ? "align-self: flex-end; background: #2563eb; color: white;" : "align-self: flex-start; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color);"; msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; ${alignBubble}"><div>${m.pesan}</div><div style="font-size: 0.58rem; opacity: 0.8; text-align: right; margin-top: 2px;">${m.waktu || ''}</div></div>`; }); msgContainer.scrollTop = msgContainer.scrollHeight; }); }
    function kirimPesanPelanggan() { if (!currentCustomerPhone) return alert("Silakan login terlebih dahulu!"); let inputEl = document.getElementById("customer-chat-input"); let pesan = inputEl.value.trim(); if (!pesan) return; let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID'); storeCollection("chats").doc(currentCustomerPhone).collection("messages").add({ pengirim: "customer", pesan: pesan, waktu: nowStr, waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { storeCollection("chats").doc(currentCustomerPhone).set({ customerNama: currentCustomerName, lastMessage: currentCustomerName + ": " + pesan, lastTimestamp: firebase.firestore.FieldValue.serverTimestamp(), unreadAdmin: firebase.firestore.FieldValue.increment(1) }, { merge: true }); inputEl.value = ""; }).catch(err => { alert("Gagal mengirim pesan: " + err.message); }); }

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
            initCustomerChatListener();
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

    function logoutPelanggan() {
      if (confirm("Keluar dari sesi ini?")) {
        localStorage.removeItem('cust_phone_v13');
        currentCustomerPhone = '';
        window.location.href = '/';
      }
    }

    function initHeaderTokoListener() {
      storeCollection("pengaturan").doc("toko_v13").onSnapshot((doc) => {
        if (doc.exists) {
          pengaturanToko = doc.data();
          const namaToko = pengaturanToko.nama || "KasirQuh";
          localStorage.setItem('cust_store_name_v13', namaToko);
          document.getElementById('receipt-shop-name').innerText = namaToko;
          document.getElementById('receipt-shop-address').innerText = pengaturanToko.alamat || "";
          if (document.getElementById('customer-home-store-name')) document.getElementById('customer-home-store-name').innerText = namaToko;
        }
      });
    }

    function initStokRumahListener() {
      // Tahap 2: listener ringan untuk konfigurasi Stok Rumah diprioritaskan setelah header.
      storeCollection("pengaturan").doc("beranda_pelanggan_stok_rumah").onSnapshot((doc) => {
        const cfg = doc.exists ? doc.data() : {enabled:true, limit:5};
        window.__stokRumahConfig = { enabled: cfg.enabled !== false, limit: Math.min(20, Math.max(1, parseInt(cfg.limit,10) || 5)) };
        dashboardPrimaryState.stokConfig = true;
        renderQuickReorder(lastFetchedOrders || []);
        tryRevealPrimaryDashboard();
      }, (err) => {
        console.warn("Listener pengaturan Stok Rumah gagal:", err);
        dashboardPrimaryState.stokConfig = true;
        renderQuickReorder(lastFetchedOrders || []);
        tryRevealPrimaryDashboard();
      });
    }

    function initFirebaseListeners(includeHeader = true) {
      if (includeHeader) initHeaderTokoListener();
    }

    function initProdukKatalogListener() {
      // Tahap 6: produk baru dimuat setelah kategori mendapat giliran render.
      // Database produk tetap realtime; yang berubah hanya waktunya saat first-load.
      storeCollection("produk").onSnapshot((snapshot) => { 
        databaseProduk = {}; 
        snapshot.forEach((doc) => { databaseProduk[doc.id] = doc.data(); }); 
        isProductsLoaded = true; 
        dashboardPrimaryState.products = true;
        muatBarangLarisHariIni(); 
        perbaruiTampilanKategori(); 
        refreshKatalogPelanggan(); 
        if(window.__promoRenderHook) window.__promoRenderHook();
        renderPromoTokoPelanggan();
        if (lastFetchedOrders && lastFetchedOrders.length > 0) {
          renderQuickReorder(lastFetchedOrders);
        }
        tryRevealPrimaryDashboard();
      }, (err) => {
        console.warn("Listener produk gagal:", err);
        dashboardPrimaryState.products = true;
        tryRevealPrimaryDashboard();
      });
    }

    function initKategoriPelangganListener() {
      // Tahap 5: kategori dirender setelah blok Sedang Laris mendapat giliran.
      const deferCategoryInit = window.requestAnimationFrame || function(cb) { setTimeout(cb, 16); };
      deferCategoryInit(() => {
        storeCollection("pengaturan").doc("kategori_produk_v13").onSnapshot((doc) => {
          renderKategoriPelanggan(doc.exists ? (doc.data().categories || []) : []);
        });
      });
    }

    function initSedangLarisListeners() {
      // Tahap 4: blok Sedang Laris baru mulai setelah tiga blok teratas mendapat giliran render.
      const deferTrendingInit = window.requestAnimationFrame || function(cb) { setTimeout(cb, 16); };
      deferTrendingInit(() => {
        storeCollection("pengaturan").doc("beranda_pelanggan_laris").onSnapshot((doc) => {
          const cfg = doc.exists ? doc.data() : {enabled:true, limit:5};
          window.__sedangLarisConfig = { enabled: cfg.enabled !== false, limit: Math.min(20, Math.max(1, parseInt(cfg.limit,10) || 5)) };
          isTrendingConfigLoaded = true;
          dashboardPrimaryState.trendingConfig = true;
          muatBarangLarisHariIni();
          tryRevealPrimaryDashboard();
        }, (err) => {
          console.warn("Listener pengaturan Sedang Laris gagal:", err);
          isTrendingConfigLoaded = true;
          dashboardPrimaryState.trendingConfig = true;
          muatBarangLarisHariIni();
          tryRevealPrimaryDashboard();
        });

        storeCollection("transaksi").onSnapshot((snapshot) => {
          window.__trendingTransactionsSnapshot = snapshot;
          dashboardPrimaryState.trendingTransactions = true;
          muatBarangLarisHariIni();
          tryRevealPrimaryDashboard();
        }, (err) => {
          console.warn("Listener transaksi Sedang Laris gagal:", err);
          dashboardPrimaryState.trendingTransactions = true;
          muatBarangLarisHariIni();
          tryRevealPrimaryDashboard();
        });
      });
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
        if (menuIsOpen && cur && cur.modal === 'menuToggleModal') history.replaceState({ __kasirquh:true, __kasirquhState:nextState }, '', location.href);
        else if (cur && cur.modal === 'productDetailModal') history.replaceState({ __kasirquh:true, __kasirquhState:nextState }, '', location.href);
        else history.pushState({ __kasirquh:true, __kasirquhState:nextState }, '', location.href);
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

      if (tabId === 'pengaturan') { document.getElementById('setting-cust-theme').value = localStorage.getItem('cust_theme_v13') || 'modern'; document.getElementById('setting-cust-view').value = catalogViewMode; if (currentCustomerPhone) { storeCollection("pelanggan").where("phone", "==", currentCustomerPhone).get().then(snap => { if (!snap.empty) { let data = snap.docs[0].data(); document.getElementById('setting-cust-name').value = data.nama || ""; document.getElementById('setting-cust-phone').value = data.phone || ""; document.getElementById('setting-cust-address').value = data.alamat || ""; } }); } }
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

    function tambahKeKeranjangCepat(code) {
      let p = databaseProduk[code];
      if (!p || (p.stok || 0) <= 0) return alert("Maaf, stok barang ini sudah habis!");
      
      let satuan = (p.satuan || "").toLowerCase().trim();
      let qtyToAdd = (satuan === "kg" || satuan === "kilogram") ? 0.25 : 1; 

      let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
      let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
      let valModal = p.hargaModal !== undefined ? p.hargaModal : (p.modal || 0);
      let modalParsed = typeof valModal === 'number' ? valModal : parseInt(valModal.toString().replace(/[^0-9]/g, '')) || 0;

      if (satuan === "kg" || satuan === "kilogram") { hargaParsed *= 10; modalParsed *= 10; }

      let item = cart.find(i => i.code === code);
      if (item) {
        if (item.qty + qtyToAdd <= p.stok) {
          item.qty += qtyToAdd;
          item.qty = parseFloat(item.qty.toFixed(3));
          item.subtotal = Math.round(item.qty * hargaParsed);
        } else {
          return alert("Stok tidak mencukupi!");
        }
      } else {
        if (qtyToAdd <= p.stok) {
          cart.push({ code, nama: p.nama, harga: hargaParsed, modal: modalParsed, qty: qtyToAdd, subtotal: Math.round(qtyToAdd * hargaParsed), foto: p.foto });
        }
      }
      
      playBeep(); 
      showToast("🛒 " + p.nama + " ditambahkan.");
      const cartFab = document.getElementById("fab-cart-btn"); 
      if (cartFab) { 
        cartFab.classList.remove("cart-animating"); 
        void cartFab.offsetWidth;
        cartFab.classList.add("cart-animating"); 
      }
      renderCartPelanggan();
    }

    function refreshKatalogPelanggan() {
      const container = document.getElementById("pos-catalog-container"); const cardWrapper = document.getElementById("pos-card-wrapper");
      if (!container || !cardWrapper) return;
      if (!['list','grid','card'].includes(catalogViewMode)) catalogViewMode = 'grid';
      container.className = catalogViewMode === 'list' ? "product-catalog-list" : (catalogViewMode === 'card' ? "product-catalog-card" : "product-catalog-grid");
      updateCatalogViewButtons();
      if (!isProductsLoaded) { cardWrapper.style.display = "none"; return; } cardWrapper.style.display = "block";

      let matchedProducts = [];
      for (let code in databaseProduk) {
        let p = databaseProduk[code]; let pNamaLower = String(p.nama || '').toLowerCase();
        let pKat = p.kategori;
        let kategoriProduk = Array.isArray(pKat)
          ? pKat.flatMap(k => String(k || '').split(/[,;|]+/)).map(k => k.trim()).filter(Boolean)
          : String(pKat || '').split(/[,;|]+/).map(k => k.trim()).filter(Boolean);
      let searchKeyword = (document.getElementById("inventory-search-input")?.value || "").toLowerCase().trim();
        let matchSearch = !searchKeyword || pNamaLower.includes(searchKeyword);
        let matchCategory = (activeKategoriPelanggan === 'Home' || activeKategoriPelanggan === 'Produk') ||
          kategoriProduk.some(k => k.toLowerCase() === activeKategoriPelanggan.toLowerCase().trim());
        if (matchCategory && matchSearch) matchedProducts.push({ code, ...p });
      }
      
      matchedProducts.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
      // TAHAP 1: hanya card katalog yang dibatasi. databaseProduk tetap lengkap untuk seluruh dashboard.
      let paginatedItems = matchedProducts.slice(0, catalogVisibleCount);
      container.innerHTML = "";

      const loadSentinel = document.getElementById('catalog-load-sentinel');
      cardWrapper.dataset.catalogTotal = String(matchedProducts.length);
      if (loadSentinel) loadSentinel.style.display = (catalogVisibleCount < matchedProducts.length) ? 'block' : 'none';

      if (matchedProducts.length === 0) { container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 15px; font-size: 0.8rem;">Produk tidak ditemukan untuk kategori ini.</div>`; document.getElementById("pos-page-indicator").innerText = `1/1`; if (loadSentinel) loadSentinel.style.display='none'; return; }

      paginatedItems.forEach(p => {
        let code = p.code; let isHabis = (p.stok || 0) <= 0;
        let fotoSrc = p.foto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/></svg>";
        let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs");
        let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
        if ((satuan.toLowerCase() === 'kg' || satuan.toLowerCase() === 'kilogram')) hargaParsed *= 10;
        let sisaStokBadge = (!isHabis && p.stok <= 5) ? `<div style="position:absolute; top:4px; left:4px; background:#ef4444; color:white; font-size:0.55rem; padding:2px 5px; border-radius:4px; font-weight:bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2); pointer-events: none; z-index: 5;">🔥 Sisa ${p.stok}</div>` : "";

        if (catalogViewMode === 'card') {
          const activeCustomerTheme = document.body.getAttribute('data-theme');
          if (activeCustomerTheme === 'modern') {
            container.innerHTML += `
              <div class="catalog-card-view modern-product-card-view" onclick="openProductDetail('${code}')">
                ${isHabis ? '<div class="modern-card-soldout"><span>HABIS</span></div>' : ''}
                <div class="modern-card-stage">
                  ${sisaStokBadge ? `<div class="modern-card-stock-badge">🔥 Sisa ${p.stok}</div>` : ''}
                  <img class="modern-card-product" src="${fotoSrc}" alt="${p.nama}" loading="lazy" onload="makeModernProductTransparent(this)">
                  <div class="modern-card-platform" aria-hidden="true">
                    <div class="modern-card-base"></div>
                    <div class="modern-card-rim"></div>
                    <div class="modern-card-surface"></div>
                    <div class="modern-card-highlight"></div>
                  </div>
                  <button type="button" class="btn-quick-cart-icon modern-card-cart-btn" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">🛒</button>
                </div>
                <div class="modern-card-info">
                  <div class="modern-card-name">${p.nama}</div>
                  <div class="modern-card-price">Rp ${hargaParsed.toLocaleString('id-ID')}</div>
                  <div class="modern-card-stock">Stok: ${p.stok || 0} ${satuan}</div>
                </div>
              </div>`;
          } else {
            container.innerHTML += `
              <div class="catalog-card-view generic-card-view" onclick="openProductDetail('${code}')">
                ${isHabis ? '<div class="generic-card-soldout"><span>HABIS</span></div>' : ''}
                <div class="generic-card-image-wrap">
                  ${sisaStokBadge}
                  <img src="${fotoSrc}" alt="${p.nama}" loading="lazy">
                  <button type="button" class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">🛒</button>
                </div>
                <div class="generic-card-name">${p.nama}</div>
                <div class="generic-card-price">Rp ${hargaParsed.toLocaleString('id-ID')}</div>
                <div class="generic-card-stock">Stok: ${p.stok || 0} ${satuan}</div>
              </div>`;
          }
        } else if (catalogViewMode === 'grid') {
          const activeCustomerTheme = document.body.getAttribute('data-theme');
          if (activeCustomerTheme === 'modern') {
            container.innerHTML += `
              <div class="inv-card modern-product-card" onclick="openProductDetail('${code}')">
                ${isHabis ? '<div class="modern-product-soldout"><span>HABIS</span></div>' : ''}
                <div class="modern-product-stage">
                  ${sisaStokBadge ? `<div class="modern-stock-badge">🔥 ${p.stok}</div>` : ''}
                  <img class="modern-product" src="${fotoSrc}" alt="${p.nama}" loading="lazy">
                  <div class="modern-platform" aria-hidden="true">
                    <div class="modern-base"></div>
                    <div class="modern-rim"></div>
                    <div class="modern-surface"></div>
                    <div class="modern-highlight"></div>
                  </div>
                  <button type="button" class="btn-quick-cart-icon modern-cart-btn" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">🛒</button>
                </div>
                <div class="modern-product-info">
                  <div class="modern-product-name">${p.nama}</div>
                  <div class="modern-product-price">Rp ${hargaParsed.toLocaleString('id-ID')}</div>
                  <div class="modern-product-stock">Stok: ${p.stok || 0} ${satuan}</div>
                </div>
              </div>`;
          } else {
            container.innerHTML += `
              <div class="inv-card" onclick="openProductDetail('${code}')">
                ${isHabis ? '<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10; border-radius:8px; display:flex; align-items:center; justify-content:center;"><span style="background:#dc2626; color:#fff; font-weight:bold; padding:3px 8px; border-radius:6px; font-size:0.7rem; transform:rotate(-15deg);">HABIS</span></div>' : ''}
                <div style="text-align: center; margin-bottom: 4px; position: relative;">
                  ${sisaStokBadge}
                  <img src="${fotoSrc}" style="width: 100%; height: 75px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3);">
                  <button type="button" class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">🛒</button>
                </div>
                <div style="font-weight: bold; font-size: 0.75rem; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nama}</div>
                <div style="font-size: 0.65rem; color: rgba(255,255,255,0.8); margin-bottom: 2px;">Stok: ${p.stok || 0} ${satuan}</div>
                <div style="font-size: 0.78rem; font-weight: bold; color: #fde047; margin-top: 2px;">Rp ${hargaParsed.toLocaleString('id-ID')}</div>
              </div>`;
          }
        } else {
          const activeCustomerTheme = document.body.getAttribute('data-theme');
          if (activeCustomerTheme === 'modern') {
            container.innerHTML += `
              <div class="catalog-list-item" onclick="openProductDetail('${code}')">
                <div class="modern-list-photo-wrap" style="position: relative; flex-shrink: 0;">
                  ${sisaStokBadge}
                  <img src="${fotoSrc}" class="modern-list-photo" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3);">
                  ${isHabis ? '<div class="modern-list-soldout-overlay" aria-label="Stok habis"><span>HABIS</span></div>' : ''}
                </div>
                <div class="modern-list-info" style="min-width: 0; flex: 1;">
                  <div style="font-weight: bold; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">${p.nama}</div>
                  <div style="font-size: 0.68rem; color: rgba(255,255,255,0.8);">Stok: ${p.stok || 0} ${satuan}</div>
                </div>
                <div class="modern-list-actions" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                  <div style="font-size: 0.8rem; font-weight: bold; color: #fde047;">Rp ${hargaParsed.toLocaleString('id-ID')}</div>
                  <button type="button" class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" style="position: static; width: 24px; height: 24px; font-size: 0.7rem;">🛒</button>
                </div>
              </div>`;
          } else {
            container.innerHTML += `
              <div class="catalog-list-item" onclick="openProductDetail('${code}')">
                <div class="generic-list-image-wrap" style="position:relative; flex-shrink:0; width:45px; height:45px;">
                  ${sisaStokBadge}
                  <img src="${fotoSrc}" class="catalog-list-img" alt="${p.nama}">
                  ${isHabis ? '<div class="generic-list-soldout-badge" aria-label="Stok habis"><span>HABIS</span></div>' : ''}
                </div>
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:bold; font-size:.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-color);">${p.nama}</div>
                  <div style="font-size:.68rem; color:var(--text-muted);">Stok: ${p.stok || 0} ${satuan}</div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                  <div style="font-size:.8rem; font-weight:bold; color:var(--text-color);">Rp ${hargaParsed.toLocaleString('id-ID')}</div>
                  <button type="button" class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" style="position:static; width:24px; height:24px; font-size:.7rem;">🛒</button>
                </div>
              </div>`;
          }
        }
      }); document.getElementById("pos-page-indicator").innerText = `${Math.min(catalogVisibleCount, matchedProducts.length)}/${matchedProducts.length}`;
    }

    // Pagination lama tidak lagi mengubah sumber data. Tahap berikutnya akan menggantinya dengan infinite scroll.
    function ubahHalamanPos(d) { return; }

    function filterKatalogPelanggan(v) {
      currentPosPage = 1;
      // Saat filter/kategori berubah, mulai lagi dari 6 card pertama yang cocok.
      catalogVisibleCount = CATALOG_INITIAL_VISIBLE;
      refreshKatalogPelanggan();
    }

    // TAHAP 2: lazy rendering + infinite scroll.
    // DatabaseProduk tetap penuh. Sentinel dipakai agar tidak bergantung
    // pada window.scroll atau jenis container scroll yang dipakai halaman.
    let catalogScrollLoading = false;
    let catalogLoadObserver = null;

    function loadNextCatalogBatch() {
      if (catalogScrollLoading) return;
      const wrapper = document.getElementById('pos-card-wrapper');
      if (!wrapper || wrapper.style.display === 'none') return;

      const total = parseInt(wrapper.dataset.catalogTotal || '0', 10);
      if (!total || catalogVisibleCount >= total) return;

      catalogScrollLoading = true;
      catalogVisibleCount = Math.min(catalogVisibleCount + CATALOG_INITIAL_VISIBLE, total);
      refreshKatalogPelanggan();
      requestAnimationFrame(() => { catalogScrollLoading = false; });
    }

    function setupCatalogInfiniteScroll() {
      const sentinel = document.getElementById('catalog-load-sentinel');
      if (!sentinel || !('IntersectionObserver' in window)) return;
      if (catalogLoadObserver) catalogLoadObserver.disconnect();

      catalogLoadObserver = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) loadNextCatalogBatch();
      }, { root: null, rootMargin: '500px 0px 500px 0px', threshold: 0 });
      catalogLoadObserver.observe(sentinel);
    }

    // Fallback tambahan untuk browser/scroll container yang tidak memicu
    // observer secara konsisten. Capture=true menangkap scroll dari elemen anak.
    function handleCatalogInfiniteScroll() {
      if (catalogScrollLoading) return;
      const sentinel = document.getElementById('catalog-load-sentinel');
      if (!sentinel || sentinel.style.display === 'none') return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 500) loadNextCatalogBatch();
    }

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

    function renderCartPelanggan() {
      const tbody = document.getElementById("cart-body"); tbody.innerHTML = ""; let total = 0, totalQty = 0;
      cart.forEach((item) => {
        total += item.subtotal; totalQty += item.qty;
        tbody.innerHTML += `
          <tr>
            <td style="font-size:0.75rem; font-weight:bold; color:var(--text-color);">${item.nama}</td>
            <td style="text-align: center; white-space: nowrap;">
              <button type="button" onclick="ubahQtyKeranjang('${item.code}', -1)" style="width:22px; height:22px; background:#dc2626; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.7rem;">-</button>
              <span style="display:inline-block; width:28px; font-size:0.78rem; font-weight:bold; color:var(--text-color);">${item.qty}</span>
              <button type="button" onclick="ubahQtyKeranjang('${item.code}', 1)" style="width:22px; height:22px; background:#16a34a; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.7rem;">+</button>
            </td>
            <td style="text-align: right; font-size:0.75rem; font-weight:bold; color:var(--text-color);">${item.subtotal.toLocaleString('id-ID')}</td>
          </tr>`;
      });
      if (cart.length === 0) tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 10px; font-size: 0.75rem;">Keranjang kosong</td></tr>`;
      document.getElementById("cart-count").innerText = totalQty; document.getElementById("grand-total").innerText = total.toLocaleString('id-ID');
    }

    function ubahQtyKeranjang(code, dir) {
      let idx = cart.findIndex(i => i.code === code); if (idx === -1) return;
      let item = cart[idx]; let p = databaseProduk[code]; if(!p) return;
      let isKg = ((p.satuan || "").toLowerCase().trim() === "kg" || (p.satuan || "").toLowerCase().trim() === "kilogram");
      let step = isKg ? 0.25 : 1;
      
      if (dir > 0) {
        if(item.qty + step > p.stok) { alert("Stok tidak mencukupi!"); return; }
        item.qty += step; playBeep();
      } else {
        if(item.qty - step < step) { 
           cart.splice(idx, 1); playBeepDown(); 
        } else { item.qty -= step; playBeepDown(); }
      }
      
      if(cart[idx]) {
        item.qty = parseFloat(item.qty.toFixed(3));
        item.subtotal = Math.round(item.qty * item.harga);
      }
      renderCartPelanggan();
    }

    function kosongkanKeranjang() { if (cart.length === 0) return alert("Keranjang sudah kosong!"); if (confirm("Kosongkan keranjang?")) { cart = []; renderCartPelanggan(); refreshKatalogPelanggan(); closeCartModal(); } }
    function openCartModal() { appOpenModal('cartModal'); document.getElementById('cartModal').classList.add('show'); }
    function closeCartModal() { if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'cartModal') { history.back(); return; } document.getElementById('cartModal').classList.remove('show'); }
    function togglePayMethodCust() { document.getElementById("wrapper-tf-proof").style.display = (document.getElementById("pay-method-cust").value === "TF") ? "block" : "none"; }
    function handleProofUpload(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { const img = new Image(); img.onload = function() { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); let w = img.width, h = img.height; if (w > h) { if (w > 600) { h *= 600 / w; w = 600; } } else { if (h > 600) { w *= 600 / h; h = 600; } } canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h); document.getElementById("cust-proof-base64").value = canvas.toDataURL('image/jpeg', 0.8); }; img.src = e.target.result; }; reader.readAsDataURL(file); }

    function prosesSimpanMenuSaja() {
      if (cart.length === 0) return alert("Keranjang kosong, tidak ada barang untuk disimpan!");
      if (!currentCustomerDocId) return alert("Silakan login terlebih dahulu.");

      const saveRecipeName = document.getElementById("cust-save-recipe-name").value.trim();
      const isShareRumpiChecked = document.getElementById("cust-share-rumpi-toggle").checked;

      if (!saveRecipeName) return alert("Harap isi nama menu resep terlebih dahulu!");

      let itemsArr = cart.map(i => ({ code: i.code, qty: i.qty }));
      let newRecipeObj = { nama: saveRecipeName, items: itemsArr };

      storeCollection("pelanggan").doc(currentCustomerDocId).update({
        savedRecipes: firebase.firestore.FieldValue.arrayUnion(newRecipeObj)
      }).then(() => {
        customerSavedRecipes.push(newRecipeObj);
        renderRecipeCards();

        if (isShareRumpiChecked && currentCustomerPhone) {
          let totalBelanja = cart.reduce((acc, i) => acc + i.subtotal, 0);
          let itemListText = "";
          cart.forEach(i => {
            itemListText += `- ${i.nama} (${i.qty})\n`;
          });
          let pesanRumpi = `🍳 *Menu Racikan dari ${currentCustomerName || 'Pelanggan'}*\nNama Menu: "${saveRecipeName}"\nBahan-bahan:\n${itemListText}Perkiraan Total: Rp ${Math.round(totalBelanja).toLocaleString('id-ID')}`;
          let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');
          storeCollection("db_chat_rumpi").add({
            senderPhone: currentCustomerPhone,
            senderName: currentCustomerName || 'Pelanggan',
            pesan: pesanRumpi,
            waktu: nowStr,
            waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(()=>{});
        }

        showToast("🌟 Menu resep berhasil disimpan ke database akunmu!");
        document.getElementById("cust-save-recipe-name").value = "";
        document.getElementById("cust-save-recipe-toggle").checked = false;
        document.getElementById("wrapper-save-recipe-fields").style.display = "none";
        closeCartModal();
      }).catch(err => {
        alert("Gagal menyimpan menu: " + err.message);
      });
    }

    async function prosesCheckoutPelanggan() {
      if (cart.length === 0) return alert("Keranjang kosong!"); 
      const payMethod = document.getElementById("pay-method-cust").value; 
      const proofBase64 = document.getElementById("cust-proof-base64").value; 
      const catatanPelanggan = document.getElementById("cust-order-note").value.trim(); 
      const isSaveRecipeChecked = document.getElementById("cust-save-recipe-toggle").checked;
      const saveRecipeName = document.getElementById("cust-save-recipe-name").value.trim();
      const isShareRumpiChecked = document.getElementById("cust-share-rumpi-toggle").checked;

      if (payMethod === "TF" && !proofBase64) return alert("Harap unggah bukti transfer!");
      if (isSaveRecipeChecked && !saveRecipeName) return alert("Harap isi nama menu resep yang akan disimpan!");

      let phoneToko = pengaturanToko.phone.replace(/[^0-9]/g, ''); if (phoneToko.startsWith('0')) phoneToko = '62' + phoneToko.slice(1);
      storeCollection("pelanggan").where("phone", "==", currentCustomerPhone).get().then(async (snap) => {
        let namaCust = "Pelanggan", alamatCust = "-"; if (!snap.empty) { namaCust = snap.docs[0].data().nama || "Pelanggan"; alamatCust = snap.docs[0].data().alamat || "-"; }
        let totalBelanja = cart.reduce((acc, i) => acc + i.subtotal, 0); let totalModal = cart.reduce((acc, i) => acc + (i.modal * i.qty), 0); let keuntungan = totalBelanja - totalModal; let totalQty = cart.reduce((acc, i) => acc + i.qty, 0); let namaMetode = payMethod === "TF" ? "Transfer Bank" : (payMethod === "WhatsApp" ? "Pesan via WhatsApp" : "COD (Bayar di Tempat)");
        try {
          let batch = db.batch(); cart.forEach(item => { let pData = databaseProduk[item.code]; if (pData) batch.update(storeCollection("produk").doc(item.code), { stok: Math.max(0, parseFloat(((pData.stok || 0) - item.qty).toFixed(3))) }); }); let newTrxRef = storeCollection("transaksi").doc(); batch.set(newTrxRef, { waktu: new Date().toLocaleString('id-ID'), waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp(), total: totalBelanja, modal: totalModal, untung: keuntungan, metode: namaMetode, qty: totalQty, customerNama: namaCust, customerPhone: currentCustomerPhone, customerAlamat: alamatCust, catatanPelanggan: catatanPelanggan, buktiTransfer: payMethod === "TF" ? proofBase64 : "", statusPesanan: "Menunggu Diproses", items: cart.map(i => ({ nama: i.nama, qty: i.qty, subtotal: i.subtotal, code: i.code })) }); await batch.commit();

          if (isSaveRecipeChecked && currentCustomerDocId) {
            let itemsArr = cart.map(i => ({ code: i.code, qty: i.qty }));
            let newRecipeObj = { nama: saveRecipeName, items: itemsArr };
            await storeCollection("pelanggan").doc(currentCustomerDocId).update({
              savedRecipes: firebase.firestore.FieldValue.arrayUnion(newRecipeObj)
            });
            customerSavedRecipes.push(newRecipeObj);
            renderRecipeCards();

            if (isShareRumpiChecked && currentCustomerPhone) {
              let itemListText = "";
              cart.forEach(i => {
                itemListText += `- ${i.nama} (${i.qty})\n`;
              });
              let pesanRumpi = `🍳 *Menu Racikan dari ${namaCust}*\nNama Menu: "${saveRecipeName}"\nBahan-bahan:\n${itemListText}Perkiraan Total: Rp ${Math.round(totalBelanja).toLocaleString('id-ID')}`;
              let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');
              storeCollection("db_chat_rumpi").add({
                senderPhone: currentCustomerPhone,
                senderName: namaCust,
                pesan: pesanRumpi,
                waktu: nowStr,
                waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
              }).catch(()=>{});
            }
          }

          let text = `*PESANAN BARU DARI PELANGGAN* 🛒\nNama : *${namaCust}*\nNo WA : ${currentCustomerPhone}\nAlamat : ${alamatCust}\nMetode : *${namaMetode}*\n`; if (catatanPelanggan) text += `Catatan : _${catatanPelanggan}_\n`; text += `------------------------------------\n`; cart.forEach((item, idx) => { text += `${idx + 1}. ${item.nama} (${item.qty}x) = Rp ${item.subtotal.toLocaleString('id-ID')}\n`; }); text += `------------------------------------\n*Total : Rp ${totalBelanja.toLocaleString('id-ID')}*`; window.open(`https://wa.me/${phoneToko}?text=${encodeURIComponent(text)}`, '_blank');
          alert("Pesanan berhasil dikirim!"); cart = []; document.getElementById("cust-order-note").value = ""; document.getElementById("cust-save-recipe-toggle").checked = false; document.getElementById("cust-save-recipe-name").value = ""; document.getElementById("wrapper-save-recipe-fields").style.display = "none"; renderCartPelanggan(); refreshKatalogPelanggan(); closeCartModal();
        } catch (err) { alert("Gagal memproses pesanan: " + err.message); }
      });
    }

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
    
    function renderQuickReorder(orders) {
      const container = document.getElementById("reorder-container"); const wrapper = document.getElementById("reorder-section-wrapper"); container.innerHTML = ""; let recentCodes = new Set(); orders.forEach(trx => { if(trx.items) trx.items.forEach(it => { if(it.code) recentCodes.add(it.code); }); });
      let renderedCount = 0; let itemsHtml = ""; 
      recentCodes.forEach(code => { 
        let p = databaseProduk[code]; 
        const stokRumahCfg = window.__stokRumahConfig || {enabled:true, limit:5};
        const stokRumahLimit = Math.min(20, Math.max(1, parseInt(stokRumahCfg.limit,10) || 5));
        if(stokRumahCfg.enabled !== false && p && (p.stok || 0) > 0 && renderedCount < stokRumahLimit) { 
          let fotoSrc = p.foto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/></svg>"; 
          let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs"); 
          let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); 
          let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0; 
          if ((satuan.toLowerCase() === 'kg' || satuan.toLowerCase() === 'kilogram')) hargaParsed *= 10; 
          
          itemsHtml += `<div class="reorder-card" onclick="openProductDetail('${code}')"><img src="${fotoSrc}" style="width: 100%; height: 55px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3);"><div style="font-size: 0.68rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">${p.nama}</div><div style="font-size: 0.68rem; color: #fde047; font-weight: bold;">Rp ${hargaParsed.toLocaleString('id-ID')}</div></div>`; 
          renderedCount++; 
        } 
      });
      
      if(renderedCount > 0) {
        container.innerHTML = `<div class="auto-scroll-track">${itemsHtml}${itemsHtml}</div>`;
        setupSeamlessReorderScroll("reorder-container");
      }

      if(renderedCount > 0 && activeKategoriPelanggan === 'Home' && document.getElementById('belanja').classList.contains('active')) { wrapper.style.display = "block"; } else { wrapper.style.display = "none"; }
    }

    function muatRiwayatPesananOnlinePelanggan() { 
      storeCollection("transaksi").where("customerPhone", "==", currentCustomerPhone).onSnapshot((snapshot) => { 
        const container = document.getElementById("customer-online-orders-container"); 
        if (!container) return; 
        container.innerHTML = ""; 
        if (snapshot.empty) { 
          container.innerHTML = `<div class="empty-state" style="font-size: 0.78rem;">Belum ada riwayat pesanan online.</div>`; 
          lastFetchedOrders = [];
          dashboardPrimaryState.stokOrders = true;
          renderQuickReorder([]); 
          tryRevealPrimaryDashboard();
          return; 
        } 
        let orders = []; 
        snapshot.forEach(doc => { orders.push({ id: doc.id, ...doc.data() }); }); 
        orders.sort((a, b) => { 
          let timeA = a.waktuTimestamp?.toMillis ? a.waktuTimestamp.toMillis() : 0; 
          let timeB = b.waktuTimestamp?.toMillis ? b.waktuTimestamp.toMillis() : 0; 
          return timeB - timeA; 
        }); 
        lastFetchedOrders = orders;
        dashboardPrimaryState.stokOrders = true;
        renderQuickReorder(orders);
        tryRevealPrimaryDashboard(); 
        orders.forEach(trx => { 
          let statusLabel = trx.statusPesanan || "Menunggu Diproses"; 
          let s_lower = statusLabel.toLowerCase(); 
          let step = 1; 
          if(s_lower.includes("siap") || s_lower.includes("proses")) step = 2; 
          else if(s_lower.includes("kirim") || s_lower.includes("jalan")) step = 3; 
          else if(s_lower.includes("selesai")) step = 4; 
          let timelineHtml = `<div class="order-timeline"><div class="timeline-step ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 1 ? '✓' : '1'}</div><div class="timeline-text">Menunggu</div></div><div class="timeline-step ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 2 ? '✓' : '2'}</div><div class="timeline-text">Dikemas</div></div><div class="timeline-step ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 3 ? '✓' : '3'}</div><div class="timeline-text">Dikirim</div></div><div class="timeline-step ${step >= 4 ? 'completed' : ''}"><div class="timeline-icon">${step >= 4 ? '✓' : '4'}</div><div class="timeline-text">Selesai</div></div></div>`; 
          let itemsHtml = ""; 
          if (trx.items && trx.items.length > 0) { 
            itemsHtml = `<div style="margin: 4px 0; font-size: 0.72rem; background: var(--input-bg); padding: 6px; border-radius: 6px; color:var(--text-color);"><strong>Rincian Barang:</strong><ul style="margin: 2px 0 0 12px; padding: 0;">`; 
            trx.items.forEach(it => { itemsHtml += `<li>${it.nama} (${it.qty}x)</li>`; }); 
            itemsHtml += `</ul></div>`; 
          } 
          container.innerHTML += `<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; margin-bottom: 8px; background: var(--card-bg); box-shadow: 0 1px 4px rgba(0,0,0,0.05);"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;"><span style="font-size: 0.68rem; color: var(--text-muted);">🗓️ ${trx.waktu || '-'}</span><span style="background: ${step===4 ? '#16a34a' : (step===1 ? '#ef4444' : '#d97706')}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.62rem; font-weight: bold;">${statusLabel}</span></div>${timelineHtml}<div style="font-size: 0.75rem; font-weight: 600; color: #2563eb;">Metode: ${trx.metode || '-'}</div>${itemsHtml}<div style="font-size: 0.82rem; font-weight: 800; color: #16a34a; text-align: right;">Total: Rp ${(trx.total || 0).toLocaleString('id-ID')}</div></div>`; 
        }); 
      }, (err) => {
        console.warn("Listener riwayat pesanan pelanggan gagal:", err);
        dashboardPrimaryState.stokOrders = true;
        tryRevealPrimaryDashboard();
      });
    }

    function simpanProfilPelanggan() { const nama = document.getElementById("setting-cust-name").value.trim(); const alamat = document.getElementById("setting-cust-address").value.trim(); if (!nama) return alert("Nama wajib diisi!"); storeCollection("pelanggan").where("phone", "==", currentCustomerPhone).get().then((snap) => { if (!snap.empty) { storeCollection("pelanggan").doc(snap.docs[0].id).update({ nama, alamat }).then(() => alert("Profil diperbarui!")).catch(err => alert("Gagal memperbarui: " + err.message)); } }).catch(err => alert("Terjadi kesalahan: " + err.message)); }
    async function kirimPesanKeAI() { let inputEl = document.getElementById("ai-chat-input"); let msgContainer = document.getElementById("ai-chat-messages"); let prompt = inputEl.value.trim(); if (!prompt) return; msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; align-self: flex-end; background: #7c3aed; color: white;">${escapeHtml(prompt)}</div>`; inputEl.value = ""; msgContainer.scrollTop = msgContainer.scrollHeight; let loadingId = "loading-" + Date.now(); msgContainer.innerHTML += `<div id="${loadingId}" style="align-self: flex-start; background: var(--input-bg); color: var(--text-muted); padding: 6px 10px; border-radius: 8px; font-size: 0.78rem;">Sedang mengetik...</div>`; msgContainer.scrollTop = msgContainer.scrollHeight; try { let daftarProdukText = ""; let keywordLower = prompt.toLowerCase(); let isAskingProduct = ["stok", "harga", "jual", "ada", "beli", "minta", "berapa", "cari", "menu", "list", "barang", "toko", "punya"].some(kw => keywordLower.includes(kw)); let matchedProducts = []; for (let code in databaseProduk) { let p = databaseProduk[code]; let pNamaLower = p.nama.toLowerCase(); let words = pNamaLower.split(' ').filter(w => w.length > 2); if (keywordLower.includes(pNamaLower) || words.some(w => keywordLower.includes(w))) matchedProducts.push(p); } if (isAskingProduct || matchedProducts.length > 0) { let targetList = matchedProducts.length > 0 ? matchedProducts.slice(0, 3) : Object.values(databaseProduk).slice(0, 3); targetList.forEach(p => { let sat = (p.satuan || 'Pcs').toLowerCase(); let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); if (sat === 'kg' || sat === 'kilogram') { valHarga = p.hargaRtg || (valHarga * 10); sat = 'kg'; } else if (sat === 'rtg') sat = 'pcs'; else sat = p.satuan || 'Pcs'; daftarProdukText += `- ${p.nama}: Rp ${valHarga.toLocaleString('id-ID')}, Stok: ${p.stok || 0} ${sat}\n`; }); } else { daftarProdukText = "Tidak ada produk dilampirkan (obrolan santai)."; } let response = await fetch('/api/tanya', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt, daftarProduk: daftarProdukText, namaToko: pengaturanToko.nama || 'KasirQuh' }) }); let data = await response.json(); let aiReply = "Maaf, saya sedang kendala teknis. Silakan tanya ke admin."; if (data.reply) aiReply = data.reply.split('\n').map(l => l.trim()).join('\n').trim(); else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) aiReply = data.candidates[0].content.parts[0].text.split('\n').map(l => l.trim()).join('\n').trim(); let audioUrl = null; if (isAiSoundOn) { const cleanText = aiReply.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(); try { const ttsResponse = await fetch(`/api/tts?text=${encodeURIComponent(cleanText)}`); if (ttsResponse.ok) audioUrl = URL.createObjectURL(await ttsResponse.blob()); } catch (e) { console.error(e); } } document.getElementById(loadingId)?.remove(); msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; align-self: flex-start; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color); white-space: pre-line;">${escapeHtml(aiReply)}</div>`; msgContainer.scrollTop = msgContainer.scrollHeight; if (audioUrl) { const audio = new Audio(audioUrl); audio.play(); } } catch (err) { document.getElementById(loadingId)?.remove(); msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; align-self: flex-start; background: #fee2e2; color: #dc2626;">Gagal terhubung ke AI.</div>`; } }
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

    async function perbaruiAplikasi() {
      const status = document.getElementById('update-app-status');
      const setStatus = (text) => { if (status) status.textContent = text; };
      if (!confirm('Perbarui aplikasi sekarang?\n\nCache aplikasi akan disegarkan dan halaman dimuat ulang. Login, pengaturan lokal, dan data Firestore tidak dihapus.')) return;

      try {
        setStatus('Menyiapkan pembaruan...');

        // Hapus hanya Cache Storage milik aplikasi. localStorage/sessionStorage/IndexedDB tidak disentuh.
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        }

        // Minta Service Worker terbaru segera aktif, tetapi jangan menghapus data situs.
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(async registration => {
            try { await registration.update(); } catch (_) {}
            if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }));
        }

        setStatus('Pembaruan selesai. Memuat ulang...');
        setTimeout(() => window.location.reload(), 350);
      } catch (err) {
        console.warn('Pembaruan aplikasi tidak sepenuhnya berhasil:', err);
        setStatus('Pembaruan sebagian gagal. Memuat ulang...');
        setTimeout(() => window.location.reload(), 500);
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
    'view-list': () => gantiViewModePelanggan('list'),
    'view-grid': () => gantiViewModePelanggan('grid'),
    'view-card': () => gantiViewModePelanggan('card')
  };

  document.querySelectorAll('[data-kq-static-action]').forEach((element) => {
    const action = actions[element.dataset.kqStaticAction];
    if (action) element.addEventListener('click', action);
  });
});

