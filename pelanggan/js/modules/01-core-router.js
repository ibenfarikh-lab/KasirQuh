if (!window.firebase || !firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(window.KQ_APP_CONFIG.firebase);
    } const db = firebase.firestore();
    // ===== V13 STORE DATA ROUTER =====
    // Semua data operasional toko sekarang berada di: toko/{tokoId}/{koleksi}.
    // tokoId bersifat stabil dan TIDAK mengikuti nama toko.
    const ACTIVE_TOKO_ID = window.KQ_APP_CONFIG?.storeId || "toko_v13";
    const V13_STORE_COLLECTIONS = new Set(["produk", "pelanggan", "transaksi", "catatan", "db_chat_rumpi", "chats", "pengaturan"]);
    function storeCollection(name) {
      if (!V13_STORE_COLLECTIONS.has(name)) return db.collection(name);
      return db.collection("toko").doc(ACTIVE_TOKO_ID).collection(name);
    }


    let databaseProduk = {}; let cart = []; let pengaturanToko = { nama: "", phone: "" };
    let currentCustomerPhone = localStorage.getItem('cust_phone_v13') || ''; let currentCustomerName = 'Pelanggan'; let currentCustomerDocId = ''; let customerSavedRecipes = []; let lastFetchedOrders = []; let catalogViewMode = localStorage.getItem('cust_view_v13') || 'grid';
    let isProductsLoaded = false; let isTrendingConfigLoaded = false; let trendingLoadToken = 0; let currentPosPage = 1; let itemsPerPagePos = 24;
    // TAHAP 1: jumlah card katalog yang ditampilkan saat awal. Ini TIDAK membatasi databaseProduk/dashboard.
    const CATALOG_INITIAL_VISIBLE = 6;
    let catalogVisibleCount = CATALOG_INITIAL_VISIBLE;
    let customerChatUnsubscribe = null; let chatRumpiUnsubscribe = null;
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

    function appGoBackIf(stateKey, fallbackClose) {
      if (appNavRestoring) { if (fallbackClose) fallbackClose(); return true; }
      const state = history.state && history.state.__kasirquhState;
      if (state && stateKey && state[stateKey]) { history.back(); return true; }
      if (fallbackClose) fallbackClose();
      return false;
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
      window.addEventListener('popstate', function() {
        // Android Back hanya ditangani bila masih ada elemen UI aktif.
        // Tidak ada pemulihan tab/kategori/history internal di sini.
        const search = document.getElementById('sticky-search-container');
        const searchOpen = search && search.style.display === 'block';
        if (searchOpen) {
          const input = document.getElementById('inventory-search-input');
          if (input) input.value = '';
          search.style.display = 'none';
          setModePencarianPelanggan(false);
          perbaruiTampilanKategori();
          filterKatalogPelanggan('');
          return;
        }
        const ids = ['customerLoginModal','dailyCheckinModal','menuToggleModal','promoTokoModal','cartModal','aiChatModal','qrCodeModal','productDetailModal'];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) continue;
          const visible = id === 'customerLoginModal' || id === 'dailyCheckinModal'
            ? getComputedStyle(el).display !== 'none'
            : el.classList.contains('show');
          if (visible) {
            if (id === 'customerLoginModal' || id === 'dailyCheckinModal') el.style.display = 'none';
            else el.classList.remove('show');
            return;
          }
        }
        // Tidak ada elemen aktif: jangan tahan/ubah Back.
        // Chrome/Android menerima Back secara normal.
      });
    }

    function appOpenModal(id, detailCode = null) {
      appPushState({ modal:id, detailCode:detailCode });
    }
