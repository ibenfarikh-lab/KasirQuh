/* KasirQuh Customer V14 — Phase 12 Account + Settings module */
(function(){
  window.KQModules = window.KQModules || {};

  function applyThemePelanggan(theme) {
    const safeTheme = ['light', 'dark', 'modern'].includes(theme) ? theme : 'modern';
    document.body.setAttribute('data-theme', safeTheme);
  }

  function gantiTemaPelanggan(theme) {
    const safeTheme = ['light', 'dark', 'modern'].includes(theme) ? theme : 'modern';
    const previousTheme = localStorage.getItem('cust_theme_v13') || 'modern';
    localStorage.setItem('cust_theme_v13', safeTheme);
    applyThemePelanggan(safeTheme);
    if (previousTheme !== safeTheme) window.location.reload();
  }

  function updateCatalogViewButtons() {
    const selected = localStorage.getItem('cust_view_v13') || 'grid';
    document.querySelectorAll('.catalog-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === selected);
    });
  }

  function gantiViewModePelanggan(mode) {
    if (!['list','grid','card'].includes(mode)) mode = 'grid';
    localStorage.setItem('cust_view_v13', mode);
    updateCatalogViewButtons();
    if (typeof window.refreshKatalogPelanggan === 'function') {
      try { window.refreshKatalogPelanggan(); } catch (err) {
        console.warn('[KasirQuh] refresh katalog setelah ubah tampilan gagal:', err);
      }
    }
  }

  function syncForm() {
    const theme = document.getElementById('setting-cust-theme');
    const view = document.getElementById('setting-cust-view');
    if (theme) theme.value = localStorage.getItem('cust_theme_v13') || 'modern';
    if (view) view.value = localStorage.getItem('cust_view_v13') || 'grid';

    const phone = window.currentCustomerPhone || '';
    if (!phone || typeof window.storeCollection !== 'function') return;

    window.storeCollection('pelanggan').where('phone', '==', phone).get().then(snap => {
      if (snap.empty) return;
      const data = snap.docs[0].data() || {};
      const name = document.getElementById('setting-cust-name');
      const phoneEl = document.getElementById('setting-cust-phone');
      const address = document.getElementById('setting-cust-address');
      if (name) name.value = data.nama || '';
      if (phoneEl) phoneEl.value = data.phone || '';
      if (address) address.value = data.alamat || '';
    }).catch(err => console.warn('[KasirQuh] gagal memuat form akun:', err));
  }

  function simpanProfilPelanggan() {
    const nameEl = document.getElementById('setting-cust-name');
    const addressEl = document.getElementById('setting-cust-address');
    const nama = nameEl ? nameEl.value.trim() : '';
    const alamat = addressEl ? addressEl.value.trim() : '';
    const phone = window.currentCustomerPhone || '';

    if (!nama) return alert('Nama wajib diisi!');
    if (!phone || typeof window.storeCollection !== 'function') {
      return alert('Sesi pelanggan belum siap. Silakan coba lagi.');
    }

    window.storeCollection('pelanggan').where('phone', '==', phone).get().then(snap => {
      if (snap.empty) return alert('Data pelanggan tidak ditemukan.');
      return window.storeCollection('pelanggan').doc(snap.docs[0].id).update({ nama, alamat })
        .then(() => alert('Profil diperbarui!'));
    }).catch(err => alert('Gagal memperbarui: ' + err.message));
  }

  window.applyThemePelanggan = applyThemePelanggan;
  window.gantiTemaPelanggan = gantiTemaPelanggan;
  window.updateCatalogViewButtons = updateCatalogViewButtons;
  window.gantiViewModePelanggan = gantiViewModePelanggan;
  window.simpanProfilPelanggan = simpanProfilPelanggan;

  window.KQModules.settings = {
    name: 'settings',
    syncForm,
    boot: function(){
      document.body?.setAttribute('data-kq-module-settings','ready');
      applyThemePelanggan(localStorage.getItem('cust_theme_v13') || 'modern');
      syncForm();
    }
  };
})();
