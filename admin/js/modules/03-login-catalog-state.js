function cekStatusLogin() {
  const loginModal = document.getElementById("loginModal");
  if (!loginModal) return;
  loginModal.style.display = (typeof auth !== "undefined" && auth.currentUser) ? "none" : "flex";
}

function prosesLogin(e) {
  e.preventDefault();
  if (typeof auth === "undefined") return alert("Firebase Authentication belum siap.");
  const email = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("login-username").value = "";
      document.getElementById("login-password").value = "";
      history.replaceState({tab: "penjualan"}, "", "");
    })
    .catch(err => {
      let pesan = "Email atau Password salah.";
      if (err.code === "auth/invalid-email") pesan = "Format email tidak valid.";
      else if (err.code === "auth/user-disabled") pesan = "Akun ini dinonaktifkan.";
      else if (err.code === "auth/too-many-requests") pesan = "Terlalu banyak percobaan login. Coba lagi beberapa saat.";
      alert(pesan);
      console.error("Firebase Auth login:", err);
    });
}

function logout() {
  if (!confirm("Apakah Anda yakin ingin keluar?")) return;
  auth.signOut()
    .then(() => {
      // Kembali ke Welcome Screen utama (root index.html), bukan admin/index.html.
      window.location.href = "../index.html";
    })
    .catch(err => alert("Gagal keluar: " + err.message));
}

function simpanPengaturanAkun() {
  const user = auth.currentUser;
  const email = document.getElementById("setting-user").value.trim();
  const password = document.getElementById("setting-pass").value;
  if (!user) return alert("Silakan login terlebih dahulu.");
  if (!email) return alert("Email tidak boleh kosong!");
  const changes = [];
  if (email !== (user.email || "")) {
    changes.push(user.updateEmail(email).catch(err => {
      if (err.code === "auth/requires-recent-login") throw new Error("Untuk mengganti email, silakan logout lalu login kembali, kemudian coba lagi.");
      throw err;
    }));
  }
  if (password) {
    if (password.length < 6) return alert("Password minimal 6 karakter.");
    changes.push(user.updatePassword(password).catch(err => {
      if (err.code === "auth/requires-recent-login") throw new Error("Untuk mengganti password, silakan logout lalu login kembali, kemudian coba lagi.");
      throw err;
    }));
  }
  if (!changes.length) return alert("Tidak ada perubahan akun.");
  Promise.all(changes)
    .then(() => db.collection("pengguna").doc(user.uid).set({ role:"admin", tokoId:"toko_v13", email:email, updatedAt:firebase.firestore.FieldValue.serverTimestamp() }, {merge:true}))
    .then(() => { document.getElementById("setting-pass").value = ""; alert("Akun login berhasil diperbarui di Firebase Authentication."); refreshData(); })
    .catch(err => alert("Gagal memperbarui akun: " + err.message));
}

let databaseProduk = {};
storeCollection("produk").onSnapshot((snapshot) => {
  databaseProduk = {};
  snapshot.forEach((doc) => {
    databaseProduk[doc.id] = doc.data();
  });
  refreshData();
});

let databasePelanggan = [];
storeCollection("pelanggan").onSnapshot((snapshot) => {
  databasePelanggan = [];
  snapshot.forEach((doc) => {
    let data = doc.data();
    data.id = doc.id;
    databasePelanggan.push(data);
  });
  refreshData();
});

let restockListItems = [];
storeCollection("pengaturan").doc("restock_v13").onSnapshot((doc) => {
  if (doc.exists) {
    restockListItems = doc.data().items || [];
  } else {
    storeCollection("pengaturan").doc("restock_v13").set({ items: [] });
  }
  refreshData();
});

function simpanRestockKeCloud() {
  storeCollection("pengaturan").doc("restock_v13").set({ items: restockListItems })
    .catch(err => console.error("Gagal simpan restock ke cloud: ", err));
}

let riwayatTransaksi = [];
storeCollection("transaksi").orderBy("waktuTimestamp", "desc").onSnapshot((snapshot) => {
  riwayatTransaksi = [];
  snapshot.forEach((doc) => {
    let tData = doc.data();
    tData.firestoreId = doc.id;
    riwayatTransaksi.push(tData);
  });
  refreshData();
}, (error) => {
  storeCollection("transaksi").get().then((snapshot) => {
    riwayatTransaksi = [];
    snapshot.forEach((doc) => {
      let tData = doc.data();
      tData.firestoreId = doc.id;
      riwayatTransaksi.push(tData);
    });
    refreshData();
  });
});

let viewMode = localStorage.getItem('inventory_view_mode_v13') || 'grid';
let stokCurrentPage = 1;
let posCurrentPage = 1;
let cart = [];
let isCooldown = false;
let totalBelanja = 0;
let activeTab = 'penjualan';
let activeSubDataTab = 'sub-pelanggan';

let html5QrCodePos = null;
let isScannerPosOpen = false;
let scannerTimeoutTimer = null;

let html5QrCodeDb = null;
let isScannerDbOpen = false;

const defaultPlaceholderImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='45' height='45' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";

window.addEventListener('popstate', function(event) {
  // Back menutup overlay/floating yang sedang terbuka. Setelah ditutup,
  // jangan pushState lagi agar Back berikutnya langsung diserahkan ke
  // Android/Chrome (keluar dari PWA), bukan mengulang history internal.
  if (isScannerPosOpen) { toggleScannerPos(); return; }
  if (isScannerDbOpen) { toggleScannerDb(); return; }

  const closers = [
    ['cartModal', closeCartModal],
    ['productModal', closeProductModal],
    ['customerModal', closeCustomerModal],
    ['bookkeepingModal', closeBookkeepingModal],
    ['catatanModal', closeCatatanModal],
    ['proofModal', window.closeProofModal],
    ['editOrderModal', window.closeEditOrderModal],
    ['adminCustomerDetailModal', window.closeAdminCustomerDetailModal]
  ];
  for (const [id, closeFn] of closers) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('show')) {
      if (typeof closeFn === 'function') closeFn();
      else el.classList.remove('show');
      return;
    }
  }

  const floatingMenu = document.getElementById('floating-menu-backdrop');
  if (floatingMenu && floatingMenu.classList.contains('show')) {
    floatingMenu.classList.remove('show');
    return;
  }

  const searchBar = document.getElementById('sticky-search-container');
  if (searchBar && searchBar.classList.contains('show')) {
    searchBar.classList.remove('show');
    const input = document.getElementById('inventory-search-input');
    if (input) input.value = '';
    syncAndFilterGlobal('');
    return;
  }

  // Tidak ada overlay/floating UI: biarkan Android/Chrome menangani Back.
});

function openCartModal() {
  document.getElementById("cartModal").classList.add("show");
  history.pushState({tab: activeTab, modal: 'cart'}, "", "");
}

function closeCartModal() { document.getElementById("cartModal").classList.remove("show"); }

function toggleStickySearchBar() {
  const searchBar = document.getElementById("sticky-search-container");
  if (searchBar) {
    searchBar.classList.toggle("show");
    if(searchBar.classList.contains("show")) {
      setTimeout(() => document.getElementById("inventory-search-input").focus(), 100);
      history.pushState({tab: activeTab, floating: 'search'}, "", "");
    } else {
      document.getElementById("inventory-search-input").value = "";
      syncAndFilterGlobal("");
    }
  }
}

let searchDebounceTimer = null;

function syncAndFilterGlobal(val) { 
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    stokCurrentPage = 1;
    posCurrentPage = 1;
    refreshData(); 
  }, 300);
}

function updateUnitLabel() {
  const unit = document.getElementById("db-unit").value;
  const rtgWrapper = document.getElementById("wrapper-db-isi-rtg");
  
  if (unit === 'kg') {
    if (rtgWrapper) rtgWrapper.style.display = "none";
    document.getElementById("db-isi-rtg").value = "10";
    
    document.getElementById("lbl-db-stock").innerText = "Jumlah Stok (Kg):";
    document.getElementById("lbl-db-cost").innerText = "Harga Modal / Kg (Rp):";
    document.getElementById("lbl-db-price").innerText = "Harga Jual / Kg (Rp):";
  } else if (unit === 'rtg') {
    if (rtgWrapper) rtgWrapper.style.display = "block";
    
    document.getElementById("lbl-db-stock").innerText = "Jumlah Stok (Renteng):";
    document.getElementById("lbl-db-cost").innerText = "Harga Modal / Renteng (Rp):";
    document.getElementById("lbl-db-price").innerText = "Harga Jual / Renteng (Rp):";
    let labelEl = rtgWrapper.querySelector("span") || rtgWrapper.querySelector("label");
    if (labelEl) labelEl.innerText = "Isi Pcs per Renteng:";
  } else {
    if (rtgWrapper) rtgWrapper.style.display = "none";
    document.getElementById("db-stock").value = "1";
    document.getElementById("lbl-db-stock").innerText = "Jumlah Stok (Pcs):";
    document.getElementById("lbl-db-cost").innerText = "Harga Modal (Rp):";
    document.getElementById("lbl-db-price").innerText = "Harga Jual (Rp):";
  }
}

let selectedProductCategories = [];

function normalizeProductCategories(value) {
  if (Array.isArray(value)) return [...new Set(value.map(v => String(v || '').trim()).filter(Boolean))];
  if (typeof value === 'string') return [...new Set(value.split(',').map(v => v.trim()).filter(Boolean))];
  return [];
}

const STANDARD_PRODUCT_CATEGORIES = [
  "Titipan Warga",
  "Sembako",
  "Minuman",
  "Makanan",
  "Snack",
  "Bumbu",
  "Perawatan",
  "Kebutuhan Rumah",
  "Lainnya"
];

function getAllProductCategories() {
  const set = new Set(STANDARD_PRODUCT_CATEGORIES);
  Object.values(databaseProduk || {}).forEach(p => {
    normalizeProductCategories(p && p.kategori).forEach(k => set.add(k));
  });
  return Array.from(set).sort((a,b) => {
    const ai = STANDARD_PRODUCT_CATEGORIES.indexOf(a);
    const bi = STANDARD_PRODUCT_CATEGORIES.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b, 'id');
  });
}

function syncSelectedProductCategories() {
  document.getElementById('db-category').value = JSON.stringify(selectedProductCategories);
}

function setSelectedProductCategories(value) {
  selectedProductCategories = normalizeProductCategories(value);
  syncSelectedProductCategories();
  renderProductCategoryPicker();
}

function renderProductCategoryPicker() {
  const chips = document.getElementById('db-category-chips');
  const menu = document.getElementById('db-category-menu');
  if (!chips || !menu) return;
  chips.innerHTML = '';
  if (!selectedProductCategories.length) {
    chips.innerHTML = '<span style="color:var(--text-muted);font-size:.82rem;">Pilih kategori...</span>';
  } else {
    selectedProductCategories.forEach(cat => {
      const chip = document.createElement('span');
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:999px;background:var(--primary-color,#2563eb);color:#fff;font-size:.76rem;';
      chip.innerHTML = `${escapeHtml(cat)} <button type="button" style="border:0;background:transparent;color:inherit;cursor:pointer;font-weight:bold;padding:0;" aria-label="Hapus kategori">×</button>`;
      chip.querySelector('button').onclick = (e) => { e.stopPropagation(); toggleProductCategory(cat); };
      chips.appendChild(chip);
    });
  }
  const cats = getAllProductCategories();
  menu.innerHTML = '';
  if (!cats.length) {
    menu.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:.8rem;">Belum ada kategori tersimpan.</div>';
  } else {
    cats.forEach(cat => {
      const row = document.createElement('label');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;cursor:pointer;font-size:.82rem;';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=selectedProductCategories.includes(cat);
      cb.onchange = () => toggleProductCategory(cat, cb.checked);
      row.appendChild(cb);
      const text = document.createElement('span'); text.textContent=cat; row.appendChild(text);
      menu.appendChild(row);
    });
  }
  const add = document.createElement('div');
  add.style.cssText='display:flex;gap:6px;padding:8px 4px 4px;border-top:1px solid var(--border-color);margin-top:6px;';
  add.innerHTML='<input id="db-new-category" type="text" placeholder="Kategori baru..." style="flex:1;min-width:0;padding:7px;border:1px solid var(--input-border);border-radius:7px;background:var(--input-bg);color:var(--text-color);"><button type="button" style="padding:7px 9px;border:0;border-radius:7px;cursor:pointer;">＋</button>';
  add.querySelector('button').onclick=(e)=>{e.stopPropagation(); addNewProductCategory();};
  add.querySelector('input').onclick=(e)=>e.stopPropagation();
  menu.appendChild(add);
  syncSelectedProductCategories();
}

function toggleProductCategoryMenu() {
  const menu=document.getElementById('db-category-menu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  if (menu.style.display === 'block') renderProductCategoryPicker();
}

function toggleProductCategory(cat, force) {
  const exists=selectedProductCategories.includes(cat);
  const shouldSelect = force === undefined ? !exists : force;
  if (shouldSelect && !exists) selectedProductCategories.push(cat);
  if (!shouldSelect && exists) selectedProductCategories=selectedProductCategories.filter(x=>x!==cat);
  syncSelectedProductCategories();
  renderProductCategoryPicker();
}

function addNewProductCategory() {
  const input=document.getElementById('db-new-category');
  const cat=(input?.value||'').trim();
  if(!cat) return;
  if(!selectedProductCategories.includes(cat)) selectedProductCategories.push(cat);
  syncSelectedProductCategories();
  renderProductCategoryPicker();
  const newInput=document.getElementById('db-new-category');
  if(newInput) newInput.focus();
}

function getSelectedProductCategoriesForSave() {
  const cats = normalizeProductCategories(selectedProductCategories);
  return cats.length ? cats : ["Lainnya"];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

