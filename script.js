let currentLang = localStorage.getItem('setting_lang_v13') || 'id';
let currentTheme = localStorage.getItem('setting_theme_v13') || 'light';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('setting_lang_v13', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  updatePermanentBarTitle();
}

function gantiBahasa(lang) { setLanguage(lang); }

function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('setting_theme_v13', theme);
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.body.setAttribute('data-theme', theme);
  }
  const themeSelect = document.getElementById("setting-theme");
  if (themeSelect) themeSelect.value = theme;
}

function gantiTema(theme) { setTheme(theme); }

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (currentTheme === 'auto') {
    document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});

function gantiViewModeSetting(mode) {
  viewMode = mode;
  localStorage.setItem('inventory_view_mode_v13', mode);
  const viewSelect = document.getElementById("setting-view-mode");
  if (viewSelect) viewSelect.value = mode;
  refreshData();
}

function toggleFloatingMenu() {
  const popup = document.getElementById("floating-menu-popup");
  if (popup) popup.classList.toggle("show");
}

document.addEventListener('click', function(event) {
  const popup = document.getElementById("floating-menu-popup");
  const menuBtn = document.querySelector(".btn-bar-menu");
  if (popup && popup.classList.contains('show')) {
    if (!popup.contains(event.target) && !menuBtn.contains(event.target)) {
      popup.classList.remove('show');
    }
  }
});

window.addEventListener('scroll', function() {
  const popup = document.getElementById("floating-menu-popup");
  if (popup && popup.classList.contains('show')) {
    popup.classList.remove('show');
  }
}, true);

function formatInputRupiah(input) {
  let angka = input.value.replace(/[^,\d]/g, '').toString();
  let split = angka.split(',');
  let sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    let separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }

  rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  input.value = rupiah;
}

function parseRupiahToNumber(stringVal) {
  if (!stringVal) return 0;
  return parseInt(stringVal.toString().replace(/\./g, '')) || 0;
}

let userAuth = { user: "admin", pass: "admin", updatedAt: 0 };
db.collection("pengaturan").doc("auth").onSnapshot((doc) => {
  if (doc.exists) {
    let cloudData = doc.data();
    let oldUpdatedAt = localStorage.getItem('auth_updated_at_v13') || "0";

    if (cloudData.updatedAt && cloudData.updatedAt.toString() !== oldUpdatedAt) {
      localStorage.setItem('auth_updated_at_v13', cloudData.updatedAt);
      if (localStorage.getItem('isLoggedIn') === 'true') {
        localStorage.removeItem('isLoggedIn');
        alert("🔐 Pengaturan akun/password telah diubah oleh administrator. Silakan login kembali dengan sandi baru.");
        cekStatusLogin();
      }
    }
    userAuth = cloudData;
  } else {
    let defaultAuth = { user: "admin", pass: "admin", updatedAt: Date.now() };
    db.collection("pengaturan").doc("auth").set(defaultAuth);
  }
  refreshData();
});

let pengaturanToko = { nama: "TokoQuh", alamat: "Jl. Merdeka", phone: "089" };
db.collection("pengaturan").doc("toko_v13").onSnapshot((doc) => {
  if (doc.exists) {
    pengaturanToko = doc.data();
  } else {
    db.collection("pengaturan").doc("toko_v13").set(pengaturanToko);
  }
  refreshData();
});

let scanCooldownDuration = 1500;
db.collection("pengaturan").doc("sistem_v13").onSnapshot((doc) => {
  if (doc.exists) {
    let data = doc.data();
    if (data.cooldown) scanCooldownDuration = data.cooldown;
  } else {
    db.collection("pengaturan").doc("sistem_v13").set({ cooldown: 1500 });
  }
  refreshData();
});

let daftarNamaTabCatatan = ["catatan1", "catatan2", "catatan3", "catatan4"];
let labelNamaTabCatatan = {
  catatan1: "Catatan 1",
  catatan2: "Catatan 2",
  catatan3: "Catatan 3",
  catatan4: "Catatan 4"
};
let databaseCatatanDinamis = {};
let activeSubCatatanTab = "catatan1";

function getLocalDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
let selectedCatatanDate = getLocalDateStr();

function formatTanggalIndo(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  let dayName = d.toLocaleDateString('id-ID', { weekday: 'long' });
  let day = String(d.getDate()).padStart(2, '0');
  let month = String(d.getMonth() + 1).padStart(2, '0');
  let year = String(d.getFullYear()).slice(-2);
  return `${dayName}, ${day}/${month}/${year}`;
}

function ubahTanggalCatatan(dateStr) {
  if (!dateStr) return;
  selectedCatatanDate = dateStr;
  updateDateDisplayUI();
  renderSubTabsCatatanUI();
}

function updateDateDisplayUI() {
  const displayEl = document.getElementById("catatan-date-display");
  const pickerEl = document.getElementById("catatan-date-picker");
  if (displayEl) displayEl.innerText = `📅 ${formatTanggalIndo(selectedCatatanDate)}`;
  if (pickerEl && pickerEl.value !== selectedCatatanDate) {
    pickerEl.value = selectedCatatanDate;
  }
}

function getPreviousDateStr(dateStr) {
  const parts = dateStr.split('-');
  let d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  d.setDate(d.getDate() - 1);
  let y = d.getFullYear();
  let m = String(d.getMonth() + 1).padStart(2, '0');
  let day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

db.collection("pengaturan").doc("daftar_tab_catatan_v13").onSnapshot((doc) => {
  if (doc.exists) {
    let data = doc.data();
    if (data.list && data.list.length > 0) daftarNamaTabCatatan = data.list;
    if (data.labels) labelNamaTabCatatan = data.labels;
  } else {
    db.collection("pengaturan").doc("daftar_tab_catatan_v13").set({
      list: daftarNamaTabCatatan,
      labels: labelNamaTabCatatan
    });
  }
  updateDateDisplayUI();
  renderSubTabsCatatanUI();
});

async function findLatestPreviousData(tabKey, targetDateStr) {
  let currDate = targetDateStr;
  for (let i = 0; i < 30; i++) {
    currDate = getPreviousDateStr(currDate);
    if (currDate < "2026-08-22") break;
    let checkDocId = `catatan_data_${tabKey}_${currDate}_v13`;
    let snap = await db.collection("pengaturan").doc(checkDocId).get();
    if (snap.exists && snap.data().items && snap.data().items.length > 0) {
      return snap.data();
    }
  }
  let legacySnap = await db.collection("pengaturan").doc(`catatan_data_${tabKey}_v13`).get();
  if (legacySnap.exists) return legacySnap.data();
  return null;
}

function setupCatatanListener(tabKey) {
  const docId = `catatan_data_${tabKey}_${selectedCatatanDate}_v13`;
  const legacyDocId = `catatan_data_${tabKey}_v13`;

  db.collection("pengaturan").doc(docId).get().then(async (docSnap) => {
    let targetData = null;

    if (selectedCatatanDate === "2026-08-22") {
      let legacySnap = await db.collection("pengaturan").doc(legacyDocId).get();
      if (legacySnap.exists && legacySnap.data().items && legacySnap.data().items.length > 0) {
        targetData = legacySnap.data();
        await db.collection("pengaturan").doc(docId).set(targetData);
      }
    }

    let needsRollOver = !docSnap.exists;
    if (docSnap.exists && docSnap.data().items) {
      let dData = docSnap.data();
      let isEffectivelyEmpty = dData.items.length === 0 || dData.items.every(it => !it.subjudul && !it.isi);
      if (isEffectivelyEmpty && selectedCatatanDate !== "2026-08-22") {
        needsRollOver = true;
      }
    }

    if (!targetData && needsRollOver && selectedCatatanDate !== "2026-08-22") {
      let prevData = await findLatestPreviousData(tabKey, selectedCatatanDate);

      let baseModal = "100.000";
      let baseItems = [];

      if (prevData && prevData.items) {
        let prevModalAwal = parseRupiahToNumber(prevData.modalAwal || "0");
        let prevTotalBayar = 0;
        prevData.items.forEach(item => {
          if (item.subjudul) {
            let subLower = item.subjudul.toLowerCase();
            let parts = subLower.split('pembayaran');
            if (parts.length > 1) {
              prevTotalBayar += parseRupiahToNumber(parts[1]);
            } else {
              let matches = item.subjudul.match(/\b[\d\.]+\b/g);
              if (matches) {
                prevTotalBayar += parseRupiahToNumber(matches[matches.length - 1]);
              }
            }
          }
        });
        let prevSisa = prevModalAwal - prevTotalBayar;
        baseModal = prevSisa > 0 ? prevSisa.toLocaleString('id-ID') : "0";

        baseItems = prevData.items.map(it => ({
          id: "NOTE-" + Date.now() + Math.random().toString(36).substr(2, 4),
          judul: it.judul || "Catatan",
          subjudul: "",
          isi: "",
          waktu: new Date().toLocaleString('id-ID')
        }));
      } else {
        let defaultLabel = labelNamaTabCatatan[tabKey] || tabKey;
        baseItems = [
          { id: "NOTE-" + Date.now(), judul: defaultLabel, subjudul: "", isi: "", waktu: new Date().toLocaleString('id-ID') }
        ];
      }

      targetData = {
        modalAwal: baseModal,
        items: baseItems
      };

      await db.collection("pengaturan").doc(docId).set(targetData);
    } else if (!targetData) {
      targetData = docSnap.exists ? docSnap.data() : { modalAwal: "100.000", items: [] };
    }

    db.collection("pengaturan").doc(docId).onSnapshot((snap) => {
      if (snap.exists) {
        databaseCatatanDinamis[tabKey] = snap.data();
      }
      renderHalamanSubCatatan(tabKey);
    });
  }).catch(err => {
    console.error("Gagal memuat catatan: ", err);
  });
}

function renderSubTabsCatatanUI() {
  const containerTabs = document.getElementById("container-sub-tabs-catatan");
  const containerContent = document.getElementById("wrapper-content-sub-catatan");
  if (!containerTabs || !containerContent) return;

  containerTabs.innerHTML = "";
  containerContent.innerHTML = "";

  if (!daftarNamaTabCatatan.includes(activeSubCatatanTab)) {
    activeSubCatatanTab = daftarNamaTabCatatan[0] || "catatan1";
  }

  daftarNamaTabCatatan.forEach(tabKey => {
    let label = labelNamaTabCatatan[tabKey] || tabKey;
    let isActive = (tabKey === activeSubCatatanTab);

    let btn = document.createElement("button");
    btn.className = `sub-tab-btn ${isActive ? 'active' : ''}`;
    btn.style.cssText = "display: flex; align-items: center; gap: 6px; white-space: nowrap;";
    btn.innerHTML = `
      <span>${label}</span> 
      <span onclick="event.stopPropagation(); ubahNamaTabDinamis('${tabKey}')" title="Ubah Nama Tab" style="font-size: 0.75rem; cursor: pointer; background: rgba(0, 0, 0, 0.15); padding: 4px 6px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;">✏️</span>
      <span onclick="event.stopPropagation(); hapusTabCatatanDinamis('${tabKey}')" title="Hapus Tab Catatan" style="font-size: 0.75rem; cursor: pointer; background: rgba(0, 0, 0, 0.15); padding: 4px 6px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;">🗑️</span>
    `;
    btn.onclick = () => switchSubCatatanTab(tabKey);
    containerTabs.appendChild(btn);

    setupCatatanListener(tabKey);

    let contentDiv = document.createElement("div");
    contentDiv.id = `sub-content-${tabKey}`;
    contentDiv.className = `sub-tab-content ${isActive ? 'active' : ''}`;
    contentDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
        <div style="background: var(--card-bg); border: 1.5px solid #2563eb; border-radius: 12px; padding: 12px 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted);">UANG MODAL AWAL:</span>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 0.9rem; font-weight: bold;">Rp</span>
              <input type="text" id="modal-awal-${tabKey}" value="100.000" oninput="formatInputRupiah(this); hitungRingkasanCatatanDinamis('${tabKey}'); simpanModalAwalDinamis('${tabKey}');" style="width: 130px; padding: 4px 8px; font-size: 0.9rem; font-weight: bold; text-align: right;">
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 6px;">
            <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted);">Uang Modal</span>
            <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted);">Pembayaran</span>
            <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted);">Sisa Modal</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; font-weight: bold;">
            <span style="color: #2563eb;">Rp <span id="lbl-modal-${tabKey}">100.000</span></span>
            <span style="color: #ea580c;">Rp <span id="lbl-bayar-${tabKey}">0</span></span>
            <span style="color: #16a34a;">Rp <span id="lbl-sisa-${tabKey}">100.000</span></span>
          </div>
        </div>
        <div id="container-list-${tabKey}" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    `;
    containerContent.appendChild(contentDiv);
    renderHalamanSubCatatan(tabKey);
  });
  updatePermanentBarTitle();
}

function switchSubCatatanTab(tabKey) {
  activeSubCatatanTab = tabKey;
  document.querySelectorAll('#catatan .sub-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#catatan .sub-tab-btn').forEach(el => el.classList.remove('active'));
  
  let contentEl = document.getElementById(`sub-content-${tabKey}`);
  if (contentEl) contentEl.classList.add('active');
  renderSubTabsCatatanUI();
  updatePermanentBarTitle();
}

function tambahTabCatatanBaru() {
  let nomorBaru = daftarNamaTabCatatan.length + 1;
  let newKey = "catatan" + Date.now();
  let newLabel = "Catatan " + nomorBaru;

  daftarNamaTabCatatan.push(newKey);
  labelNamaTabCatatan[newKey] = newLabel;

  db.collection("pengaturan").doc("daftar_tab_catatan_v13").set({
    list: daftarNamaTabCatatan,
    labels: labelNamaTabCatatan
  }).then(() => {
    activeSubCatatanTab = newKey;
    showNotif("Catatan baru ditambahkan!");
  }).catch(err => alert("Gagal menambah catatan: " + err.message));
}

function ubahNamaTabDinamis(tabKey) {
  let labelLama = labelNamaTabCatatan[tabKey] || tabKey;
  let labelBaru = prompt(`Masukkan nama baru untuk "${labelLama}":`, labelLama);
  if (labelBaru !== null && labelBaru.trim() !== "") {
    labelNamaTabCatatan[tabKey] = labelBaru.trim();
    db.collection("pengaturan").doc("daftar_tab_catatan_v13").set({
      list: daftarNamaTabCatatan,
      labels: labelNamaTabCatatan
    }).then(() => {
      renderSubTabsCatatanUI();
      showNotif("Nama catatan diperbarui!");
    }).catch(err => alert("Gagal mengubah nama: " + err.message));
  }
}

function hapusTabCatatanDinamis(tabKey) {
  if (daftarNamaTabCatatan.length <= 1) {
    return alert("Minimal harus menyisakan 1 tab catatan!");
  }
  if (confirm(`Apakah Anda yakin ingin menghapus "${labelNamaTabCatatan[tabKey] || tabKey}" beserta seluruh isinya?`)) {
    daftarNamaTabCatatan = daftarNamaTabCatatan.filter(k => k !== tabKey);
    delete labelNamaTabCatatan[tabKey];

    db.collection("pengaturan").doc("daftar_tab_catatan_v13").set({
      list: daftarNamaTabCatatan,
      labels: labelNamaTabCatatan
    }).then(() => {
      db.collection("pengaturan").doc(`catatan_data_${tabKey}_${selectedCatatanDate}_v13`).delete().catch(e => {});
      activeSubCatatanTab = daftarNamaTabCatatan[0];
      renderSubTabsCatatanUI();
      showNotif("Tab catatan dihapus!");
    }).catch(err => alert("Gagal menghapus tab: " + err.message));
  }
}

function simpanModalAwalDinamis(tabKey) {
  let inputEl = document.getElementById(`modal-awal-${tabKey}`);
  if (!inputEl || !databaseCatatanDinamis[tabKey]) return;
  databaseCatatanDinamis[tabKey].modalAwal = inputEl.value;

  db.collection("pengaturan").doc(`catatan_data_${tabKey}_${selectedCatatanDate}_v13`).set(databaseCatatanDinamis[tabKey], { merge: true })
    .catch(err => console.error("Gagal simpan modal: ", err));
}

function hitungRingkasanCatatanDinamis(tabKey) {
  let inputEl = document.getElementById(`modal-awal-${tabKey}`);
  if (!inputEl) return;
  let modalAwal = parseRupiahToNumber(inputEl.value);
  let totalPembayaran = 0;
  let dataObj = databaseCatatanDinamis[tabKey];

  if (dataObj && dataObj.items) {
    dataObj.items.forEach(item => {
      if (item.subjudul) {
        let subLower = item.subjudul.toLowerCase();
        let parts = subLower.split('pembayaran');
        if (parts.length > 1) {
          let angkaBayar = parseRupiahToNumber(parts[1]);
          totalPembayaran += angkaBayar;
        } else {
          let matches = item.subjudul.match(/\b[\d\.]+\b/g);
          if (matches) {
            let angkaTerakhir = parseRupiahToNumber(matches[matches.length - 1]);
            totalPembayaran += angkaTerakhir;
          }
        }
      }
    });
  }

  let sisaModal = modalAwal - totalPembayaran;
  let lblModal = document.getElementById(`lbl-modal-${tabKey}`);
  let lblBayar = document.getElementById(`lbl-bayar-${tabKey}`);
  let lblSisa = document.getElementById(`lbl-sisa-${tabKey}`);

  if (lblModal) lblModal.innerText = modalAwal.toLocaleString('id-ID');
  if (lblBayar) lblBayar.innerText = totalPembayaran.toLocaleString('id-ID');
  if (lblSisa) lblSisa.innerText = sisaModal.toLocaleString('id-ID');
}

function renderHalamanSubCatatan(tabKey) {
  let dataObj = databaseCatatanDinamis[tabKey];
  if (!dataObj) return;

  let inputEl = document.getElementById(`modal-awal-${tabKey}`);
  if (inputEl && dataObj.modalAwal) {
    inputEl.value = dataObj.modalAwal;
  }

  let container = document.getElementById(`container-list-${tabKey}`);
  if (!container) return;
  container.innerHTML = "";

  let listData = dataObj.items || [];
  if (listData.length === 0) {
    container.innerHTML = `<div class="empty-state">Belum ada catatan untuk tanggal ini. Tekan tombol <b>+</b> di kanan bawah untuk membuat catatan baru.</div>`;
    hitungRingkasanCatatanDinamis(tabKey);
    return;
  }

  listData.forEach((item, index) => {
    let formattedIsi = "(Tidak ada rincian)";
    if (item.isi) {
      let lines = item.isi.split('\n');
      formattedIsi = lines.map(line => {
        return `<div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dashed var(--border-color);"><span>${line}</span></div>`;
      }).join('');
    }

    let tombolAtasDisabled = index === 0 ? 'opacity: 0.4; cursor: not-allowed;' : '';
    let tombolBawahDisabled = index === listData.length - 1 ? 'opacity: 0.4; cursor: not-allowed;' : '';

    container.innerHTML += `
      <div class="card" style="margin-bottom: 0; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
          <div>
            <div style="font-weight: bold; font-size: 0.95rem; color: var(--text-color);">${item.judul}</div>
            ${item.subjudul ? `<div style="font-size: 0.8rem; font-weight: 600; color: #2563eb; margin-top: 1px;">${item.subjudul}</div>` : ''}
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">${item.waktu}</div>
          </div>
          <div style="display: flex; gap: 4px; align-items: center;">
            <button class="btn-edit" onclick="pindahCatatanUrutanDinamis('${tabKey}', ${index}, -1)" title="Pindah ke Atas" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.8rem; ${tombolAtasDisabled}">⬆️</button>
            <button class="btn-edit" onclick="pindahCatatanUrutanDinamis('${tabKey}', ${index}, 1)" title="Pindah ke Bawah" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.8rem; ${tombolBawahDisabled}">⬇️</button>
            <button class="btn-edit" onclick="openCatatanModal('${tabKey}', '${item.id}')" title="Edit Catatan" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.8rem;">✏️</button>
            <button class="btn-edit" onclick="hapusCatatanCardDinamis('${tabKey}', '${item.id}')" title="Hapus Catatan" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.8rem;">🗑️</button>
          </div>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-color); padding-top: 2px; display: flex; flex-direction: column; gap: 2px;">
          ${formattedIsi}
        </div>
      </div>
    `;
  });

  hitungRingkasanCatatanDinamis(tabKey);
}

function openCatatanModal(targetTabKey = activeSubCatatanTab, id = null) {
  const modal = document.getElementById("catatanModal");
  if (!modal) return;
  document.getElementById("catatan-type-target").value = targetTabKey;
  let dataObj = databaseCatatanDinamis[targetTabKey] || { items: [] };

  if (id) {
    let item = dataObj.items.find(c => c.id === id);
    if (item) {
      document.getElementById("catatan-modal-title").innerText = "Edit Catatan";
      document.getElementById("catatan-id").value = item.id;
      document.getElementById("catatan-title-input").value = item.judul || "";
      document.getElementById("catatan-subtitle-input").value = item.subjudul || "";
      document.getElementById("catatan-desc-input").value = item.isi || "";
    }
  } else {
    document.getElementById("catatan-modal-title").innerText = "Tambah Catatan Baru";
    document.getElementById("catatan-id").value = "";
    document.getElementById("catatan-title-input").value = `Catatan ${dataObj.items.length + 1}`;
    document.getElementById("catatan-subtitle-input").value = "";
    document.getElementById("catatan-desc-input").value = "";
  }
  modal.classList.add("show");
  history.pushState({tab: activeTab, modal: 'catatan'}, "", "");
}

function closeCatatanModal() {
  const modal = document.getElementById("catatanModal");
  if (modal) modal.classList.remove("show");
}

function simpanCatatanCard() {
  const targetTabKey = document.getElementById("catatan-type-target").value;
  const id = document.getElementById("catatan-id").value;
  const judul = document.getElementById("catatan-title-input").value.trim();
  const subjudul = document.getElementById("catatan-subtitle-input").value.trim();
  const isi = document.getElementById("catatan-desc-input").value.trim();

  if (!judul) return alert("Judul catatan wajib diisi!");

  let dataObj = databaseCatatanDinamis[targetTabKey] || { modalAwal: "100.000", items: [] };
  let targetList = [...(dataObj.items || [])];

  if (id) {
    let index = targetList.findIndex(c => c.id === id);
    if (index !== -1) {
      targetList[index] = { ...targetList[index], judul, subjudul, isi, waktu: new Date().toLocaleString('id-ID') };
    }
  } else {
    let newItem = {
      id: "NOTE-" + Date.now(),
      judul: judul,
      subjudul: subjudul,
      isi: isi,
      waktu: new Date().toLocaleString('id-ID')
    };
    targetList.push(newItem);
  }

  dataObj.items = targetList;
  db.collection("pengaturan").doc(`catatan_data_${targetTabKey}_${selectedCatatanDate}_v13`).set(dataObj)
    .then(() => {
      databaseCatatanDinamis[targetTabKey] = dataObj;
      closeCatatanModal();
      renderHalamanSubCatatan(targetTabKey);
      showNotif("Catatan berhasil disimpan ke Cloud!");
    })
    .catch(err => alert("Gagal menyimpan: " + err.message));
}

function hapusCatatanCardDinamis(targetTabKey, id) {
  if (confirm("Apakah Anda yakin ingin menghapus catatan ini?")) {
    let dataObj = databaseCatatanDinamis[targetTabKey];
    if (!dataObj) return;
    dataObj.items = (dataObj.items || []).filter(c => c.id !== id);

    db.collection("pengaturan").doc(`catatan_data_${targetTabKey}_${selectedCatatanDate}_v13`).set(dataObj)
      .then(() => {
        renderHalamanSubCatatan(targetTabKey);
        showNotif("Catatan dihapus!");
      })
      .catch(err => alert("Gagal menghapus: " + err.message));
  }
}

function pindahCatatanUrutanDinamis(targetTabKey, index, direction) {
  let dataObj = databaseCatatanDinamis[targetTabKey];
  if (!dataObj || !dataObj.items) return;
  let targetList = [...dataObj.items];

  let targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= targetList.length) return;
  
  let temp = targetList[index];
  targetList[index] = targetList[targetIndex];
  targetList[targetIndex] = temp;

  dataObj.items = targetList;
  db.collection("pengaturan").doc(`catatan_data_${targetTabKey}_${selectedCatatanDate}_v13`).set(dataObj)
    .then(() => {
      renderHalamanSubCatatan(targetTabKey);
      showNotif("Urutan diperbarui!");
    })
    .catch(err => alert("Gagal mengubah urutan: " + err.message));
}

function cekStatusLogin() {
  if (localStorage.getItem('isLoggedIn') === 'true') {
    document.getElementById('loginModal').style.display = 'none';
  } else {
    document.getElementById('loginModal').style.display = 'flex';
  }
}

function prosesLogin(e) {
  e.preventDefault();
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value.trim();

  if (u === userAuth.user && p === userAuth.pass) {
    localStorage.setItem('isLoggedIn', 'true');
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    history.replaceState({tab: "penjualan"}, "", "");
  } else {
    alert("Username atau Password salah!");
  }
}

function logout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    localStorage.removeItem('isLoggedIn');
    cekStatusLogin();
  }
}

function simpanPengaturanAkun() {
  const u = document.getElementById('setting-user').value.trim();
  const p = document.getElementById('setting-pass').value.trim();
  if (!u || !p) return alert("Username dan Password tidak boleh kosong!");
  
  let newUpdatedAt = Date.now();
  db.collection("pengaturan").doc("auth").set({ user: u, pass: p, updatedAt: newUpdatedAt })
    .then(() => {
      localStorage.setItem('auth_updated_at_v13', newUpdatedAt);
      alert("Akun login berhasil diperbarui secara online!");
    })
    .catch(err => alert("Gagal menyimpan akun: " + err.message));
}

let databaseProduk = {};
db.collection("produk").onSnapshot((snapshot) => {
  databaseProduk = {};
  snapshot.forEach((doc) => {
    databaseProduk[doc.id] = doc.data();
  });
  refreshData();
});

let databasePelanggan = [];
db.collection("pelanggan").onSnapshot((snapshot) => {
  databasePelanggan = [];
  snapshot.forEach((doc) => {
    let data = doc.data();
    data.id = doc.id;
    databasePelanggan.push(data);
  });
  refreshData();
});

let restockListItems = [];
db.collection("pengaturan").doc("restock_v13").onSnapshot((doc) => {
  if (doc.exists) {
    restockListItems = doc.data().items || [];
  } else {
    db.collection("pengaturan").doc("restock_v13").set({ items: [] });
  }
  refreshData();
});

function simpanRestockKeCloud() {
  db.collection("pengaturan").doc("restock_v13").set({ items: restockListItems })
    .catch(err => console.error("Gagal simpan restock ke cloud: ", err));
}

let riwayatTransaksi = [];
db.collection("transaksi").orderBy("waktuTimestamp", "desc").onSnapshot((snapshot) => {
  riwayatTransaksi = [];
  snapshot.forEach((doc) => {
    let tData = doc.data();
    tData.firestoreId = doc.id;
    riwayatTransaksi.push(tData);
  });
  refreshData();
}, (error) => {
  db.collection("transaksi").get().then((snapshot) => {
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
  if (isScannerPosOpen) { toggleScannerPos(); history.pushState({tab: activeTab}, "", ""); return; }
  if (isScannerDbOpen) { toggleScannerDb(); history.pushState({tab: activeTab}, "", ""); return; }
  if (document.getElementById("cartModal").classList.contains("show")) { closeCartModal(); history.pushState({tab: activeTab}, "", ""); return; }
  if (document.getElementById("productModal").classList.contains("show")) { closeProductModal(); history.pushState({tab: activeTab}, "", ""); return; }
  if (document.getElementById("customerModal").classList.contains("show")) { closeCustomerModal(); history.pushState({tab: activeTab}, "", ""); return; }
  if (document.getElementById("bookkeepingModal").classList.contains("show")) { closeBookkeepingModal(); history.pushState({tab: activeTab}, "", ""); return; }
  if (document.getElementById("catatanModal") && document.getElementById("catatanModal").classList.contains("show")) { closeCatatanModal(); history.pushState({tab: activeTab}, "", ""); return; }
  
  const searchBar = document.getElementById("sticky-search-container");
  if (searchBar && searchBar.classList.contains("show")) {
    searchBar.classList.remove("show");
    history.pushState({tab: activeTab}, "", "");
    return;
  }

  let konfirmasi = confirm("Apakah Anda yakin ingin keluar ke halaman login?");
  if (konfirmasi) {
    localStorage.removeItem('isLoggedIn');
    cekStatusLogin();
    history.replaceState({tab: activeTab}, "", "");
  } else {
    history.replaceState({tab: activeTab}, "", "");
  }
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

function openProductModal(codeToEdit = null, restockId = null) {
  const modal = document.getElementById("productModal");
  const title = document.getElementById("modal-title");
  const submitBtn = document.getElementById("modal-submit-btn");

  document.getElementById("edit-restock-id").value = restockId || "";

  if (restockId) {
    let rItem = restockListItems.find(i => i.id === restockId);
    if (rItem) {
      title.innerText = "Edit Barang Belanja Stok";
      submitBtn.innerText = "Simpan Perubahan Belanja";
      submitBtn.setAttribute("onclick", `simpanEditBelanjaStok('${restockId}')`);

      let sat = (rItem.satuan || "").toLowerCase();
      document.getElementById("db-code").value = rItem.code || "";
      document.getElementById("db-name").value = rItem.nama || "";
      document.getElementById("db-category").value = rItem.kategori || "";
      document.getElementById("db-unit").value = sat || "pcs";
      document.getElementById("db-isi-rtg").value = rItem.isiRtg || 10;
      document.getElementById("db-stock").value = rItem.qty !== undefined ? rItem.qty : 1;
      document.getElementById("db-cost").value = ((sat === 'rtg' || sat === 'kg') ? (rItem.modalRtg || 0) : (rItem.modal || 0)).toLocaleString('id-ID');
      document.getElementById("db-price").value = ((sat === 'rtg' || sat === 'kg') ? (rItem.hargaRtg || 0) : (rItem.harga || 0)).toLocaleString('id-ID');
      document.getElementById("db-selected-online-img").value = rItem.foto || "";
    }
  } else if (codeToEdit && databaseProduk[codeToEdit]) {
    let p = databaseProduk[codeToEdit];
    title.innerText = "Edit Barang Stok";
    submitBtn.innerText = "Simpan Perubahan";
    submitBtn.setAttribute("onclick", `simpanEditBarang('${codeToEdit}')`);

    let sat = (p.satuan || "").toLowerCase();
    document.getElementById("db-code").value = codeToEdit;
    document.getElementById("db-name").value = p.nama;
    document.getElementById("db-category").value = p.kategori || "";
    document.getElementById("db-unit").value = sat || "pcs";
    document.getElementById("db-isi-rtg").value = p.isiRtg || 10;
    document.getElementById("db-stock").value = p.stok !== undefined ? p.stok : 0;
    document.getElementById("db-cost").value = ((sat === 'rtg' || sat === 'kg') ? (p.modalRtg || 0) : (p.modal || 0)).toLocaleString('id-ID');
    document.getElementById("db-price").value = ((sat === 'rtg' || sat === 'kg') ? (p.hargaRtg || 0) : (p.harga || 0)).toLocaleString('id-ID');
    document.getElementById("db-selected-online-img").value = p.foto || "";
  } else if (activeTab === 'belanja-stok') {
    title.innerText = "Tambah Barang Belanja Stok";
    submitBtn.innerText = "Tambahkan ke Belanja Stok";
    submitBtn.setAttribute("onclick", "tambahkanKeBelanjaStok()");

    document.getElementById("db-code").value = "";
    document.getElementById("db-name").value = "";
    document.getElementById("db-category").value = "";
    document.getElementById("db-unit").value = "pcs";
    document.getElementById("db-isi-rtg").value = 10;
    document.getElementById("db-stock").value = "";
    document.getElementById("db-cost").value = "";
    document.getElementById("db-price").value = "";
    document.getElementById("db-selected-online-img").value = "";
  } else {
    title.innerText = "Tambah Barang Stok Baru";
    submitBtn.innerText = "Simpan ke Stok";
    submitBtn.setAttribute("onclick", "simpanBarangLangsung()");

    document.getElementById("db-code").value = "";
    document.getElementById("db-name").value = "";
    document.getElementById("db-category").value = "";
    document.getElementById("db-unit").value = "pcs";
    document.getElementById("db-isi-rtg").value = 10;
    document.getElementById("db-stock").value = "";
    document.getElementById("db-cost").value = "";
    document.getElementById("db-price").value = "";
    document.getElementById("db-selected-online-img").value = "";
  }

  updateUnitLabel();
  document.getElementById("db-image").value = "";
  document.getElementById("online-image-results").style.display = "none";
  document.getElementById("online-image-results").innerHTML = "";
  document.getElementById("autocomplete-suggestions").style.display = "none";

  modal.classList.add("show");
  history.pushState({tab: activeTab, modal: 'product'}, "", "");
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let width = img.width;
      let height = img.height;
      const maxSize = 300;
      
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      document.getElementById("db-selected-online-img").value = compressedBase64;
      showNotif("Foto berhasil dimuat!");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function simpanBarangLangsung() {
  const name = document.getElementById("db-name").value.trim();
  if (!name) return alert("Isi nama barang terlebih dahulu!");
  let code = document.getElementById("db-code").value.trim() || ("BRG-" + Date.now());
  const category = document.getElementById("db-category").value.trim() || "Umum";
  const unit = (document.getElementById("db-unit").value || "pcs").toLowerCase();
  const isiRtg = (unit === 'kg') ? 10 : (parseInt(document.getElementById("db-isi-rtg").value) || 10);
  let stokVal = parseFloat(document.getElementById("db-stock").value) || 0;
  
  let cost = parseRupiahToNumber(document.getElementById("db-cost").value);
  let price = parseRupiahToNumber(document.getElementById("db-price").value);

  let finalStok = (unit === 'rtg') ? (stokVal * isiRtg) : stokVal;
  let finalModal = (unit === 'rtg' || unit === 'kg') ? (cost / isiRtg) : cost;
  let finalHarga = (unit === 'rtg' || unit === 'kg') ? (price / isiRtg) : price;

  const selectedOnlineImg = document.getElementById("db-selected-online-img").value;
  const existingFoto = databaseProduk[code] ? databaseProduk[code].foto : "";

  db.collection("produk").doc(code).set({
    nama: name,
    kategori: category,
    satuan: unit,
    isiRtg: isiRtg,
    stok: finalStok,
    modal: finalModal,
    harga: finalHarga,
    modalRtg: cost,
    hargaRtg: price,
    foto: selectedOnlineImg || existingFoto || defaultPlaceholderImg
  }, { merge: true }).then(() => {
    closeProductModal();
    showNotif("Barang baru ditambahkan ke stok!");
  }).catch(err => alert("Gagal menyimpan: " + err.message));
}

function simpanEditBarang(code) {
  const name = document.getElementById("db-name").value.trim();
  if (!name) return alert("Isi nama barang terlebih dahulu!");
  const category = document.getElementById("db-category").value.trim() || "Umum";
  const unit = (document.getElementById("db-unit").value || "pcs").toLowerCase();
  const isiRtg = (unit === 'kg') ? 10 : (parseInt(document.getElementById("db-isi-rtg").value) || 10);
  let stokVal = parseFloat(document.getElementById("db-stock").value) || 0;
  
  let cost = parseRupiahToNumber(document.getElementById("db-cost").value);
  let price = parseRupiahToNumber(document.getElementById("db-price").value);

  let finalStok = (unit === 'rtg') ? (stokVal * isiRtg) : stokVal;
  let finalModal = (unit === 'rtg' || unit === 'kg') ? (cost / isiRtg) : cost;
  let finalHarga = (unit === 'rtg' || unit === 'kg') ? (price / isiRtg) : price;

  const selectedOnlineImg = document.getElementById("db-selected-online-img").value;
  const existingFoto = databaseProduk[code] ? databaseProduk[code].foto : "";

  db.collection("produk").doc(code).update({
    nama: name,
    kategori: category,
    satuan: unit,
    isiRtg: isiRtg,
    stok: finalStok,
    modal: finalModal,
    harga: finalHarga,
    modalRtg: cost,
    hargaRtg: price,
    foto: selectedOnlineImg || existingFoto || defaultPlaceholderImg
  }).then(() => {
    closeProductModal();
    showNotif("Perubahan disimpan!");
  }).catch(err => alert("Gagal menyimpan: " + err.message));
}

function simpanEditBelanjaStok(restockId) {
  const name = document.getElementById("db-name").value.trim();
  if (!name) return alert("Isi nama barang terlebih dahulu!");
  let code = document.getElementById("db-code").value.trim() || ("BRG-" + Date.now());
  const category = document.getElementById("db-category").value.trim() || "Umum";
  const unit = (document.getElementById("db-unit").value || "pcs").toLowerCase();
  const isiRtg = (unit === 'kg') ? 10 : (parseInt(document.getElementById("db-isi-rtg").value) || 10);
  const qtyBeli = parseFloat(document.getElementById("db-stock").value) || 1;
  const cost = parseRupiahToNumber(document.getElementById("db-cost").value);
  const price = parseRupiahToNumber(document.getElementById("db-price").value);
  const selectedOnlineImg = document.getElementById("db-selected-online-img").value;

  let rItem = restockListItems.find(i => i.id === restockId);
  if (rItem) {
    rItem.code = code;
    rItem.nama = name;
    rItem.kategori = category;
    rItem.satuan = unit;
    rItem.isiRtg = isiRtg;
    rItem.qty = qtyBeli;
    rItem.modal = (unit === 'rtg' || unit === 'kg') ? (cost / isiRtg) : cost;
    rItem.harga = (unit === 'rtg' || unit === 'kg') ? (price / isiRtg) : price;
    rItem.modalRtg = cost;
    rItem.hargaRtg = price;
    if (selectedOnlineImg) rItem.foto = selectedOnlineImg;

    simpanRestockKeCloud();
    closeProductModal();
    refreshData();
    showNotif("Belanja stok diperbarui!");
  }
}

function autoFillDataBarang(namaInput) {
  const sugBox = document.getElementById("autocomplete-suggestions");
  if (!namaInput.trim()) {
    sugBox.style.display = "none";
    return;
  }

  let matches = [];
  for (let code in databaseProduk) {
    let p = databaseProduk[code];
    if (p.nama.toLowerCase().includes(namaInput.toLowerCase())) {
      matches.push({ code, ...p });
    }
  }

  if (matches.length > 0) {
    sugBox.style.display = "block";
    sugBox.innerHTML = "";
    matches.forEach(m => {
      let div = document.createElement("div");
      div.style.cssText = "padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;";
      div.innerText = m.nama + ` (Stok: ${m.stok || 0})`;
      div.onmousedown = function() {
        let sat = (m.satuan || "").toLowerCase();
        document.getElementById("db-name").value = m.nama;
        document.getElementById("db-code").value = m.code;
        document.getElementById("db-category").value = m.kategori || "";
        document.getElementById("db-unit").value = sat || "pcs";
        document.getElementById("db-isi-rtg").value = m.isiRtg || 10;
        document.getElementById("db-cost").value = (((sat === 'rtg' || sat === 'kg') ? m.modalRtg : m.modal) || 0).toLocaleString('id-ID');
        document.getElementById("db-price").value = (((sat === 'rtg' || sat === 'kg') ? m.hargaRtg : m.harga) || 0).toLocaleString('id-ID');
        document.getElementById("db-selected-online-img").value = m.foto || "";
        updateUnitLabel();
        sugBox.style.display = "none";
      };
      sugBox.appendChild(div);
    });
  } else {
    sugBox.style.display = "none";
  }

  let exactMatchCode = Object.keys(databaseProduk).find(code => databaseProduk[code].nama.toLowerCase() === namaInput.toLowerCase());
  if (exactMatchCode) {
    let p = databaseProduk[exactMatchCode];
    let sat = (p.satuan || "").toLowerCase();
    document.getElementById("db-code").value = exactMatchCode;
    document.getElementById("db-category").value = p.kategori || "";
    document.getElementById("db-unit").value = sat || "pcs";
    document.getElementById("db-isi-rtg").value = p.isiRtg || 10;
    document.getElementById("db-cost").value = (((sat === 'rtg' || sat === 'kg') ? p.modalRtg : p.modal) || 0).toLocaleString('id-ID');
    document.getElementById("db-price").value = (((sat === 'rtg' || sat === 'kg') ? p.hargaRtg : p.harga) || 0).toLocaleString('id-ID');
    document.getElementById("db-selected-online-img").value = p.foto || "";
    updateUnitLabel();
  }
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("show");
  document.getElementById("online-image-results").style.display = "none";
  document.getElementById("online-image-results").innerHTML = "";
  document.getElementById("db-selected-online-img").value = "";
  document.getElementById("autocomplete-suggestions").style.display = "none";
  document.getElementById("edit-restock-id").value = "";
  if (isScannerDbOpen) toggleScannerDb();
}

async function cariFotoOnline() {
  const namaProduk = document.getElementById("db-name").value.trim();
  if (!namaProduk) return alert("Harap isi Nama Barang terlebih dahulu!");
  const resultsContainer = document.getElementById("online-image-results");
  resultsContainer.style.display = "grid";
  resultsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; font-size: 0.75rem; color: var(--text-muted); padding: 15px;">Mencari foto...</div>`;

  try {
    let searchKeyword = encodeURIComponent(namaProduk);
    let url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${searchKeyword}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&format=json&origin=*`;
    let response = await fetch(url);
    let data = await response.json();
    resultsContainer.innerHTML = "";
    let foundImages = 0;

    if (data.query && data.query.pages) {
      let pages = data.query.pages;
      for (let key in pages) {
        let page = pages[key];
        if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
          let imgUrl = page.imageinfo[0].url;
          if (imgUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
            foundImages++;
            let thumbDiv = document.createElement("div");
            thumbDiv.style.cssText = "cursor: pointer; border: 2px solid transparent; border-radius: 6px; overflow: hidden; height: 60px; background: #fff; display: flex; align-items: center; justify-content: center;";
            thumbDiv.innerHTML = `<img src="${imgUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" crossorigin="anonymous">`;
            thumbDiv.onclick = function() {
              document.querySelectorAll('#online-image-results > div').forEach(el => el.style.borderColor = 'transparent');
              thumbDiv.style.borderColor = '#2563eb';
              convertImgToBase64(imgUrl, function(base64Str) {
                document.getElementById("db-selected-online-img").value = base64Str;
                showNotif("Foto dipilih!");
              });
            };
            resultsContainer.appendChild(thumbDiv);
          }
        }
      }
    }
    if (foundImages === 0) {
      let styles = ['identicon', 'bottts', 'shapes', 'fun-emoji'];
      styles.forEach(st => {
        let fallbackUrl = `https://api.dicebear.com/7.x/${st}/svg?seed=${encodeURIComponent(namaProduk)}`;
        let thumbDiv = document.createElement("div");
        thumbDiv.style.cssText = "cursor: pointer; border: 2px solid transparent; border-radius: 6px; overflow: hidden; height: 60px; background: #e2e8f0; display: flex; align-items: center; justify-content: center;";
        thumbDiv.innerHTML = `<img src="${fallbackUrl}" style="width: 80%; height: 80%; object-fit: contain;">`;
        thumbDiv.onclick = function() {
          document.querySelectorAll('#online-image-results > div').forEach(el => el.style.borderColor = 'transparent');
          thumbDiv.style.borderColor = '#2563eb';
          convertImgToBase64(fallbackUrl, function(base64Str) {
            document.getElementById("db-selected-online-img").value = base64Str;
            showNotif("Ikon dipilih!");
          });
        };
        resultsContainer.appendChild(thumbDiv);
      });
    }
  } catch (error) {
    resultsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; font-size: 0.75rem; color: #dc2626; padding: 10px;">Gagal memuat foto.</div>`;
  }
}

function convertImgToBase64(url, callback) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 120; canvas.height = 120;
    ctx.drawImage(img, 0, 0, 120, 120);
    callback(canvas.toDataURL('image/jpeg', 0.7));
  };
  img.src = url;
}

function openCustomerModal(id = null) {
  const modal = document.getElementById("customerModal");
  const title = document.getElementById("cust-modal-title");
  if (id) {
    let cust = databasePelanggan.find(c => c.id === id);
    if (cust) {
      title.innerText = "Edit Pelanggan";
      document.getElementById("cust-id").value = cust.id;
      document.getElementById("cust-name").value = cust.nama;
      document.getElementById("cust-phone").value = cust.phone;
      document.getElementById("cust-address").value = cust.alamat;
    }
  } else {
    title.innerText = "Tambah Pelanggan Baru";
    document.getElementById("cust-id").value = "";
    document.getElementById("cust-name").value = "";
    document.getElementById("cust-phone").value = "";
    document.getElementById("cust-address").value = "";
  }
  modal.classList.add("show");
  history.pushState({tab: activeTab, modal: 'customer'}, "", "");
}

function closeCustomerModal() { document.getElementById("customerModal").classList.remove("show"); }

function openBookkeepingModal(custId, noteId = null) {
  const modal = document.getElementById("bookkeepingModal");
  document.getElementById("bk-cust-id").value = custId;
  document.getElementById("bk-note-id").value = noteId || "";
  let cust = databasePelanggan.find(c => c.id === custId);
  if (noteId && cust && cust.catatan) {
    let note = cust.catatan.find(n => n.id === noteId);
    if (note) {
      document.getElementById("bk-modal-title").innerText = "Edit Catatan Pelanggan";
      document.getElementById("bk-datetime").value = note.waktu;
      document.getElementById("bk-type").value = note.jenis;
      document.getElementById("bk-amount").value = note.nominal > 0 ? note.nominal.toLocaleString('id-ID') : "";
      document.getElementById("bk-desc").value = note.keterangan;
    }
  } else {
    document.getElementById("bk-modal-title").innerText = "Tambah Catatan Pelanggan";
    document.getElementById("bk-datetime").value = new Date().toLocaleString('id-ID');
    document.getElementById("bk-type").value = "Belanja (belum dibayar)";
    document.getElementById("bk-amount").value = "";
    document.getElementById("bk-desc").value = "";
  }
  modal.classList.add("show");
  history.pushState({tab: activeTab, modal: 'bookkeeping'}, "", "");
}

function closeBookkeepingModal() { document.getElementById("bookkeepingModal").classList.remove("show"); }

function simpanCatatanPembukuan() {
  const custId = document.getElementById("bk-cust-id").value;
  const noteId = document.getElementById("bk-note-id").value;
  const waktuOtomatis = document.getElementById("bk-datetime").value;
  const jenis = document.getElementById("bk-type").value;
  const nominal = parseRupiahToNumber(document.getElementById("bk-amount").value);
  const keterangan = document.getElementById("bk-desc").value.trim();

  if (!keterangan && nominal <= 0) return alert("Harap isi keterangan atau nominal!");

  let cust = databasePelanggan.find(c => c.id === custId);
  if (cust) {
    if (!cust.catatan) cust.catatan = [];
    if (noteId) {
      let note = cust.catatan.find(n => n.id === noteId);
      if (note) { note.jenis = jenis; note.nominal = nominal; note.keterangan = keterangan || "-"; }
    } else {
      cust.catatan.push({ id: "NOTE-" + Date.now(), waktu: waktuOtomatis, jenis: jenis, nominal: nominal, keterangan: keterangan || "-" });
    }
    db.collection("pelanggan").doc(custId).update({ catatan: cust.catatan })
      .then(() => { closeBookkeepingModal(); showNotif("Catatan disimpan!"); })
      .catch(err => alert("Gagal menyimpan: " + err.message));
  }
}

function hapusCatatanPembukuan(custId, noteId) {
  if (confirm("Hapus catatan ini?")) {
    let cust = databasePelanggan.find(c => c.id === custId);
    if (cust && cust.catatan) {
      cust.catatan = cust.catatan.filter(n => n.id !== noteId);
      db.collection("pelanggan").doc(custId).update({ catatan: cust.catatan })
        .then(() => showNotif("Catatan dihapus!"))
        .catch(err => alert("Gagal menghapus: " + err.message));
    }
  }
}

function bagikanCatatanWhatsApp(custId) {
  let cust = databasePelanggan.find(c => c.id === custId);
  if (!cust || !cust.catatan || cust.catatan.length === 0) return alert("Belum ada catatan!");
  let rawPhone = cust.phone;
  if (!rawPhone || rawPhone === "-") {
    let manualPhone = prompt("Masukkan nomor WhatsApp tujuan:");
    if (!manualPhone) return;
    rawPhone = manualPhone;
  }
  let phone = rawPhone.replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);

  let text = `*BUKU CATATAN - ${pengaturanToko.nama}* 📖\n`;
  text += `Nama Pelanggan : *${cust.nama}*\n\n`;
  cust.catatan.forEach((note, idx) => {
    text += `${idx + 1}. [${note.jenis}] ${note.keterangan} ${note.nominal > 0 ? '(Rp ' + note.nominal.toLocaleString('id-ID') + ')' : ''}\n`;
  });
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

function tambahkanKeBelanjaStok() {
  const name = document.getElementById("db-name").value.trim();
  if (!name) return alert("Isi nama barang terlebih dahulu!");
  let code = document.getElementById("db-code").value.trim() || ("BRG-" + Date.now());
  const category = document.getElementById("db-category").value.trim() || "Umum";
  const unit = (document.getElementById("db-unit").value || "pcs").toLowerCase();
  const isiRtg = (unit === 'kg') ? 10 : (parseInt(document.getElementById("db-isi-rtg").value) || 10);
  const qtyBeli = parseFloat(document.getElementById("db-stock").value) || 1;
  const cost = parseRupiahToNumber(document.getElementById("db-cost").value);
  const price = parseRupiahToNumber(document.getElementById("db-price").value);
  const selectedOnlineImg = document.getElementById("db-selected-online-img").value;
  const existingFoto = databaseProduk[code] ? databaseProduk[code].foto : "";

  let newItem = {
    id: "RESTOCK-" + Date.now() + Math.random().toString(36).substr(2, 4),
    code: code,
    nama: name,
    kategori: category,
    satuan: unit,
    isiRtg: isiRtg,
    qty: qtyBeli,
    modal: (unit === 'rtg' || unit === 'kg') ? (cost / isiRtg) : cost,
    harga: (unit === 'rtg' || unit === 'kg') ? (price / isiRtg) : price,
    modalRtg: cost,
    hargaRtg: price,
    foto: selectedOnlineImg || existingFoto || defaultPlaceholderImg
  };

  restockListItems.push(newItem);
  simpanRestockKeCloud();
  closeProductModal();
  switchTab('belanja-stok', false);
  showNotif("Ditambahkan ke Belanja Stok!");
}

function hapusItemBelanja(itemId) {
  if (confirm("Hapus item ini dari daftar belanja?")) {
    restockListItems = restockListItems.filter(item => item.id !== itemId);
    simpanRestockKeCloud();
    refreshData();
    showNotif("Item dihapus");
  }
}

function kosongkanRestockList() {
  if (restockListItems.length === 0) return alert("Daftar belanja sudah kosong!");
  if (confirm("Kosongkan seluruh daftar belanja stok?")) {
    restockListItems = [];
    simpanRestockKeCloud();
    refreshData();
    showNotif("Daftar belanja dikosongkan");
  }
}

async function prosesBelanjaStok() {
  if (restockListItems.length === 0) return alert("Belum ada barang di daftar belanja stok!");
  if (!confirm("Selesaikan belanja? Ini akan otomatis memperbarui stok, nilai modal, dan harga jual di Halaman Stok utama.")) return;

  let batch = db.batch();
  restockListItems.forEach(item => {
    let code = item.code;
    let produkLama = databaseProduk[code];
    let stokLama = produkLama && produkLama.stok !== undefined ? produkLama.stok : 0;
    
    let sat = (item.satuan || "").toLowerCase();
    let qtyPenambahan = (sat === 'rtg') ? (item.qty * item.isiRtg) : item.qty;
    let stokBaru = parseFloat((stokLama + qtyPenambahan).toFixed(3));

    let docRef = db.collection("produk").doc(code);
    batch.set(docRef, {
      nama: item.nama,
      kategori: item.kategori,
      satuan: sat,
      isiRtg: item.isiRtg,
      stok: stokBaru,
      modal: item.modal,
      harga: item.harga,
      modalRtg: item.modalRtg,
      hargaRtg: item.hargaRtg,
      foto: item.foto !== defaultPlaceholderImg ? item.foto : (produkLama ? produkLama.foto || "" : "")
    }, { merge: true });
  });

  await batch.commit();
  restockListItems = [];
  simpanRestockKeCloud();
  refreshData();
  alert("🎉 Belanja berhasil diproses! Stok, modal, dan harga jual di Halaman Stok telah diperbarui.");
  switchTab('data-barang', false);
}

function switchSubDataTab(subTabId) {
  activeSubDataTab = subTabId;
  document.querySelectorAll('#laporan .sub-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#laporan .sub-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(subTabId)?.classList.add('active');

  const fabAdd = document.getElementById('fab-add-btn');
  const fabAddCust = document.getElementById('fab-add-cust-btn');
  const fabAddCatatan = document.getElementById('fab-add-catatan-btn');

  if (subTabId === 'sub-pelanggan') {
    document.getElementById('sub-btn-pelanggan')?.classList.add('active');
    if(fabAdd) fabAdd.style.display = 'none';
    if(fabAddCust) fabAddCust.style.display = 'flex';
    if(fabAddCatatan) fabAddCatatan.style.display = 'none';
  } else if (subTabId === 'sub-laporan') {
    document.getElementById('sub-btn-laporan')?.classList.add('active');
    if(fabAdd) fabAdd.style.display = 'none';
    if(fabAddCust) fabAddCust.style.display = 'none';
    if(fabAddCatatan) fabAddCatatan.style.display = 'none';
  }
  updatePermanentBarTitle();
}

function updatePermanentBarTitle() {
  const titleEl = document.getElementById("permanent-title");
  const posPag = document.getElementById("pos-pagination-wrapper");
  const stokPag = document.getElementById("stok-pagination-wrapper");

  posPag.classList.remove("show");
  stokPag.classList.remove("show");

  if (activeTab === 'penjualan') {
    titleEl.innerText = "Kasir";
    posPag.classList.add("show");
  } else if (activeTab === 'kasir-online') {
    titleEl.innerText = "Kasir Online";
  } else if (activeTab === 'data-barang') {
    titleEl.innerText = "Manajemen Stok";
    stokPag.classList.add("show");
  } else if (activeTab === 'belanja-stok') {
    titleEl.innerText = "Belanja Stok";
  } else if (activeTab === 'laporan') {
    titleEl.innerText = (activeSubDataTab === 'sub-pelanggan') ? "Data Pelanggan" : "Data Transaksi";
  } else if (activeTab === 'catatan') {
    titleEl.innerText = labelNamaTabCatatan[activeSubCatatanTab] || "Catatan";
  } else if (activeTab === 'pengaturan') {
    titleEl.innerText = "Pengaturan Sistem";
  }

  document.querySelectorAll('.popup-menu-btn').forEach(btn => btn.classList.remove('active-menu'));
  const activeBtnMap = {
    'penjualan': 'pop-btn-penjualan',
    'kasir-online': 'pop-btn-kasironline',
    'data-barang': 'pop-btn-databarang',
    'belanja-stok': 'pop-btn-belanjastok',
    'laporan': 'pop-btn-laporan',
    'catatan': 'pop-btn-catatan',
    'pengaturan': 'pop-btn-pengaturan'
  };
  if (activeBtnMap[activeTab]) {
    let btnEl = document.getElementById(activeBtnMap[activeTab]);
    if (btnEl) btnEl.classList.add('active-menu');
  }
}

function switchTab(tabId, pushHistory = true) {
  activeTab = tabId;
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  if (pushHistory) history.pushState({tab: tabId}, "", "");

  const fabCart = document.getElementById('fab-cart-btn');
  const fabScan = document.getElementById('fab-scan-btn');
  const fabFilter = document.getElementById('fab-filter-btn');
  const fabAdd = document.getElementById('fab-add-btn');
  const fabAddCust = document.getElementById('fab-add-cust-btn');
  const fabAddCatatan = document.getElementById('fab-add-catatan-btn');

  if (tabId === 'penjualan') {
    if(fabCart) fabCart.style.display = 'flex'; 
    if(fabScan) fabScan.style.display = 'flex'; 
    if(fabFilter) fabFilter.style.display = 'flex'; 
    if(fabAdd) fabAdd.style.display = 'none'; 
    if(fabAddCust) fabAddCust.style.display = 'none'; 
    if(fabAddCatatan) fabAddCatatan.style.display = 'none';
  } else if (tabId === 'kasir-online') {
    if(fabCart) fabCart.style.display = 'none'; 
    if(fabScan) fabScan.style.display = 'none'; 
    if(fabFilter) fabFilter.style.display = 'none'; 
    if(fabAdd) fabAdd.style.display = 'none'; 
    if(fabAddCust) fabAddCust.style.display = 'none'; 
    if(fabAddCatatan) fabAddCatatan.style.display = 'none';
  } else if (tabId === 'data-barang' || tabId === 'belanja-stok') {
    if(fabCart) fabCart.style.display = 'none'; 
    if(fabScan) fabScan.style.display = 'none'; 
    if(fabFilter) fabFilter.style.display = 'flex'; 
    if(fabAdd) fabAdd.style.display = 'flex'; 
    if(fabAddCust) fabAddCust.style.display = 'none'; 
    if(fabAddCatatan) fabAddCatatan.style.display = 'none';
    if(fabAdd) fabAdd.setAttribute("onclick", "openProductModal()");
  } else if (tabId === 'laporan') {
    if(fabCart) fabCart.style.display = 'none'; 
    if(fabScan) fabScan.style.display = 'none'; 
    if(fabFilter) fabFilter.style.display = 'none'; 
    if(fabAddCatatan) fabAddCatatan.style.display = 'none';
    if (activeSubDataTab === 'sub-pelanggan') { 
      if(fabAdd) fabAdd.style.display = 'none'; 
      if(fabAddCust) fabAddCust.style.display = 'flex'; 
    } else { 
      if(fabAdd) fabAdd.style.display = 'none'; 
      if(fabAddCust) fabAddCust.style.display = 'none'; 
    }
  } else if (tabId === 'catatan') {
    if(fabCart) fabCart.style.display = 'none'; 
    if(fabScan) fabScan.style.display = 'none'; 
    if(fabFilter) fabFilter.style.display = 'none'; 
    if(fabAdd) fabAdd.style.display = 'none'; 
    if(fabAddCust) fabAddCust.style.display = 'none';
    if(fabAddCatatan) fabAddCatatan.style.display = 'flex';
  } else {
    if(fabCart) fabCart.style.display = 'none'; 
    if(fabScan) fabScan.style.display = 'none'; 
    if(fabFilter) fabFilter.style.display = 'none'; 
    if(fabAdd) fabAdd.style.display = 'none'; 
    if(fabAddCust) fabAddCust.style.display = 'none'; 
    if(fabAddCatatan) fabAddCatatan.style.display = 'none';
  }
  updatePermanentBarTitle();
  refreshData();
}

function syncAndFilterGlobal(val) { 
  stokCurrentPage = 1;
  posCurrentPage = 1;
  refreshData(); 
}

function changeStokPage(delta) { 
  stokCurrentPage += delta; 
  refreshData(); 
  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.scrollTop = 0;
  window.scrollTo(0, 0);
}

function changePosPage(delta) { 
  posCurrentPage += delta; 
  refreshData(); 
  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.scrollTop = 0;
  window.scrollTo(0, 0);
}

function playBeep() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); osc.connect(audioCtx.destination);
  osc.type = "sine"; osc.frequency.value = 1000; gain.gain.value = 0.1;
  osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function toggleScannerPos() {
  const modal = document.getElementById("scannerModal");
  if (!isScannerPosOpen) {
    modal.classList.add("show");
    isScannerPosOpen = true;
    history.pushState({tab: activeTab, scanner: true}, "", "");
    if (!html5QrCodePos) html5QrCodePos = new Html5Qrcode("reader-pos");
    html5QrCodePos.start({ facingMode: "environment" }, { fps: 20, qrbox: { width: 300, height: 150 } }, 
      (decodedText) => {
        if (scannerTimeoutTimer) { clearTimeout(scannerTimeoutTimer); scannerTimeoutTimer = null; }
        processBarcodeScanPos(decodedText);
      }, () => {}
    ).catch(err => alert("Tidak dapat mengakses kamera."));
  } else {
    if (scannerTimeoutTimer) { clearTimeout(scannerTimeoutTimer); scannerTimeoutTimer = null; }
    modal.classList.remove("show");
    isScannerPosOpen = false;
    if (html5QrCodePos && html5QrCodePos.isScanning) html5QrCodePos.stop().catch(err => {});
  }
}

function processBarcodeScanPos(barcode) {
  if (isCooldown) return;
  isCooldown = true;
  playBeep();
  let produk = databaseProduk[barcode];
  if (!produk) {
    showNotif("Barang tidak ditemukan!");
    setTimeout(() => { isCooldown = false; }, scanCooldownDuration);
    return;
  }
  if ((produk.stok || 0) <= 0) {
    showNotif("Stok Habis!");
    setTimeout(() => { isCooldown = false; }, scanCooldownDuration);
    return;
  }
  showNotif("Berhasil: " + produk.nama);
  tambahItemKeCart(barcode, produk);
  setTimeout(() => { isCooldown = false; }, scanCooldownDuration);
}

function toggleScannerDb() {
  const box = document.getElementById("scanner-box-db");
  if (!isScannerDbOpen) {
    box.style.display = "block";
    isScannerDbOpen = true;
    history.pushState({tab: activeTab, scannerDb: true}, "", "");
    if (!html5QrCodeDb) html5QrCodeDb = new Html5Qrcode("reader-db");
    html5QrCodeDb.start({ facingMode: "environment" }, { fps: 20, qrbox: { width: 250, height: 120 } }, 
      (decodedText) => { processBarcodeScanDb(decodedText); }, () => {}
    ).catch(err => alert("Tidak dapat mengakses kamera."));
  } else {
    box.style.display = "none";
    isScannerDbOpen = false;
    if (html5QrCodeDb && html5QrCodeDb.isScanning) html5QrCodeDb.stop().catch(err => {});
  }
}

function processBarcodeScanDb(barcode) {
  playBeep();
  document.getElementById("db-code").value = barcode;
  if (databaseProduk[barcode]) {
    let p = databaseProduk[barcode];
    let sat = (p.satuan || "").toLowerCase();
    document.getElementById("db-name").value = p.nama;
    document.getElementById("db-category").value = p.kategori || "";
    document.getElementById("db-unit").value = sat || "pcs";
    document.getElementById("db-isi-rtg").value = p.isiRtg || 10;
    document.getElementById("db-cost").value = (((sat === 'rtg' || sat === 'kg') ? p.modalRtg : p.modal) || 0).toLocaleString('id-ID');
    document.getElementById("db-price").value = (((sat === 'rtg' || sat === 'kg') ? p.hargaRtg : p.harga) || 0).toLocaleString('id-ID');
    updateUnitLabel();
  }
  toggleScannerDb();
}

function tambahManualDariCode(barcode) {
  let produk = databaseProduk[barcode];
  if (produk) {
    if ((produk.stok || 0) <= 0) return alert("Stok habis!");
    playBeep();
    tambahItemKeCart(barcode, produk);
  }
}

function kurangManualDariCode(barcode) {
  const existingItem = cart.find(item => item.barcode === barcode);
  if (existingItem) {
    let index = cart.indexOf(existingItem);
    let sat = (existingItem.satuan || "").toLowerCase();
    let step = (sat === 'kg') ? 0.1 : 1; 
    existingItem.qty -= step;
    existingItem.qty = parseFloat(existingItem.qty.toFixed(3));
    if (existingItem.qty <= 0) cart.splice(index, 1);
    else {
      existingItem.subtotal = Math.round(existingItem.qty * existingItem.harga);
      existingItem.submodal = Math.round(existingItem.qty * existingItem.modal);
    }
    renderCart();
    refreshData();
  }
}

function tambahItemKeCart(barcode, produk) {
  const satProd = (produk.satuan || "").toLowerCase();
  const isKg = (satProd === 'kg');
  const isRtg = (satProd === 'rtg');
  let inputJumlah = 1;
  let displaySatuan = 'pcs';
  let hargaAktif = produk.harga;
  let modalAktif = produk.modal;

  if (isKg) {
    let isiOns = 10;
    let hargaKg = produk.hargaRtg || (produk.harga * isiOns);
    let modalKg = produk.modalRtg || (produk.modal * isiOns);

    let kgStr = prompt(`Masukkan jumlah Kilogram (Kg) untuk ${produk.nama}\n(Contoh: 1 untuk 1 kg, 0.5 untuk setengah kg / 5 ons, 0.1 untuk 1 ons):`, "1");
    if (kgStr === null) return;
    inputJumlah = parseFloat(kgStr.replace(',', '.')) || 1;
    hargaAktif = hargaKg;
    modalAktif = modalKg;
    displaySatuan = 'kg';
  } else if (isRtg) {
    let pilihanBeli = prompt(`Beli ${produk.nama} per apa?\n1. Eceran Pcs (@Rp ${produk.harga.toLocaleString('id-ID')})\n2. Renteng / rtg (isi ${produk.isiRtg} pcs - @Rp ${(produk.hargaRtg || (produk.harga * produk.isiRtg)).toLocaleString('id-ID')})\n\nKetik angka 1 atau 2:`, "1");
    if (pilihanBeli === "2") {
      let jumlahRtgStr = prompt(`Masukkan jumlah Renteng (rtg) yang dibeli:`, "1");
      if (jumlahRtgStr === null) return;
      let jmlRtg = parseFloat(jumlahRtgStr.replace(',', '.')) || 1;
      inputJumlah = jmlRtg * produk.isiRtg;
      hargaAktif = produk.hargaRtg ? (produk.hargaRtg / produk.isiRtg) : produk.harga;
      modalAktif = produk.modalRtg ? (produk.modalRtg / produk.isiRtg) : produk.modal;
      displaySatuan = 'rtg';
    } else if (pilihanBeli === "1") {
      let pcsStr = prompt(`Masukkan jumlah Pcs yang dibeli:`, "1");
      if (pcsStr === null) return;
      inputJumlah = parseFloat(pcsStr.replace(',', '.')) || 1;
      displaySatuan = 'pcs';
    } else {
      return;
    }
  }

  const existingItem = cart.find(item => item.barcode === barcode && item.satuanJual === displaySatuan);
  const currentCartQty = existingItem ? existingItem.qty : 0;
  if (currentCartQty + inputJumlah > (produk.stok || 0)) {
    alert(`Stok tidak mencukupi! Sisa stok: ${produk.stok} kg/pcs`);
    return;
  }

  if (existingItem) {
    existingItem.qty += inputJumlah;
    existingItem.subtotal = Math.round(existingItem.qty * hargaAktif);
    existingItem.submodal = Math.round(existingItem.qty * modalAktif);
  } else {
    cart.push({
      barcode: barcode, nama: produk.nama, kategori: produk.kategori || "Umum", satuan: satProd,
      satuanJual: displaySatuan, modal: modalAktif, harga: hargaAktif, foto: produk.foto || defaultPlaceholderImg,
      qty: inputJumlah, subtotal: Math.round(inputJumlah * hargaAktif), submodal: Math.round(inputJumlah * modalAktif)
    });
  }
  renderCart();
  refreshData();
}

function ubahQty(index, delta) {
  let item = cart[index];
  let produk = databaseProduk[item.barcode];
  let stokTersedia = produk ? (produk.stok || 0) : 0;
  let sat = (item.satuan || "").toLowerCase();
  let step = (sat === 'kg') ? 0.1 : 1; 
  if (delta > 0 && item.qty + step > stokTersedia) return alert("Stok tidak mencukupi!");

  if (delta > 0) item.qty += step; else item.qty -= step;
  item.qty = parseFloat(item.qty.toFixed(3));
  if (item.qty <= 0) cart.splice(index, 1);
  else {
    item.subtotal = Math.round(item.qty * item.harga);
    item.submodal = Math.round(item.qty * item.modal);
  }
  renderCart();
  refreshData();
}

function renderCart() {
  const tbody = document.getElementById("cart-body");
  tbody.innerHTML = "";
  totalBelanja = 0;
  let totalItemCount = 0;

  cart.forEach((item, index) => {
    totalBelanja += item.subtotal;
    totalItemCount += item.qty;
    
    let sat = (item.satuan || "").toLowerCase();
    let qtyDisplay = '';
    let isiOns = 10;

    if (item.satuanJual === 'kg') {
      if (item.qty < 1) {
        let jmlOns = Math.round(item.qty * isiOns);
        qtyDisplay = `${jmlOns} Ons`;
      } else {
        qtyDisplay = `${item.qty} Kg`;
      }
    } else if (item.satuanJual === 'rtg') {
      qtyDisplay = `${(item.qty / isiOns).toFixed(1)} rtg`;
    } else {
      qtyDisplay = `${item.qty} Pcs`;
    }

    tbody.innerHTML += `
      <tr>
        <td>
          <div class="item-with-img">
            <img src="${item.foto || defaultPlaceholderImg}" class="prod-img">
            <div>
              <div style="font-weight:600; line-height:1.1;">${item.nama}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">@Rp ${item.harga.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </td>
        <td style="text-align: center;">
          <div class="qty-control no-print">
            <button class="btn-qty" onclick="ubahQty(${index}, -1)">-</button>
            <span class="qty-val">${qtyDisplay}</span>
            <button class="btn-qty" onclick="ubahQty(${index}, 1)">+</button>
          </div>
        </td>
        <td style="text-align: right; font-weight: 600;">${item.subtotal.toLocaleString('id-ID')}</td>
        <td class="no-print" style="text-align: center;">
          <button class="btn-danger" onclick="hapusCart(${index})" style="padding: 4px 6px; font-size: 0.72rem; border-radius: 6px;">✕</button>
        </td>
      </tr>
    `;
  });

  if (cart.length === 0) tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 15px 0;">Keranjang Kosong</td></tr>`;
  document.getElementById("cart-count").innerText = totalItemCount;
  document.getElementById("grand-total").innerText = totalBelanja.toLocaleString('id-ID');
  hitungKembalian();
}

function hapusCart(i) { cart.splice(i, 1); renderCart(); refreshData(); }

function kosongkanKeranjang() {
  if (cart.length === 0) return alert("Keranjang sudah kosong!");
  if (confirm("Kosongkan isi keranjang?")) {
    cart = [];
    renderCart();
    refreshData();
    showNotif("Keranjang dikosongkan");
  }
}

function togglePayMethod() {
  const m = document.getElementById("pay-method").value;
  const input = document.getElementById("pay-amount");
  if(m === "QRIS") { input.value = totalBelanja.toLocaleString('id-ID'); input.disabled = true; }
  else { input.disabled = false; input.value = ""; }
  hitungKembalian();
}

function hitungKembalian() {
  const bayar = parseRupiahToNumber(document.getElementById("pay-amount").value);
  const kembalian = bayar - totalBelanja;
  document.getElementById("change-total").innerText = (kembalian > 0 ? kembalian : 0).toLocaleString('id-ID');
}

function prosesSimpanTransaksi() {
  cart.forEach(item => {
    if (databaseProduk[item.barcode]) {
      let sisaStok = (databaseProduk[item.barcode].stok || 0) - item.qty;
      let newStok = Math.max(0, parseFloat(sisaStok.toFixed(3)));
      db.collection("produk").doc(item.barcode).update({ stok: newStok });
    }
  });
  const totalModal = cart.reduce((acc, item) => acc + item.submodal, 0);
  const keuntungan = totalBelanja - totalModal;
  const transaksi = {
    waktu: new Date().toLocaleString('id-ID'),
    waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
    total: totalBelanja, 
    modal: totalModal, 
    untung: keuntungan,
    metode: document.getElementById("pay-method").value,
    qty: cart.reduce((acc, item) => acc + item.qty, 0)
  };
  db.collection("transaksi").add(transaksi).catch(err => console.error("Gagal simpan transaksi ke cloud: ", err));
}

function selesaiTransaksi() {
  if (cart.length === 0) return alert("Keranjang kosong!");
  const bayar = parseRupiahToNumber(document.getElementById("pay-amount").value);
  const metode = document.getElementById("pay-method").value;
  if (metode === "Tunai" && bayar < totalBelanja) return alert("Uang pembayaran kurang!");

  prosesSimpanTransaksi();
  window.print();
  cart = [];
  document.getElementById("pay-amount").value = "";
  document.getElementById("wa-customer-phone").value = "";
  closeCartModal();
  renderCart();
  refreshData();
}

function bagikanStrukWhatsApp() {
  if (cart.length === 0) return alert("Keranjang kosong!");
  const bayar = parseRupiahToNumber(document.getElementById("pay-amount").value);
  const metode = document.getElementById("pay-method").value;
  if (metode === "Tunai" && bayar < totalBelanja) return alert("Uang pembayaran kurang!");

  let rawPhone = document.getElementById("wa-customer-phone").value.trim();
  if (!rawPhone) return alert("Masukkan nomor WhatsApp pelanggan!");
  let phone = rawPhone.replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);

  let text = `*STRUK PEMBELIAN - ${pengaturanToko.nama}*📦\n`;
  text += `📅 ${new Date().toLocaleString('id-ID')}\n------------------------------------\n`;
  cart.forEach((item, idx) => {
    text += `${idx + 1}. ${item.nama} (${item.qty}x) = Rp ${item.subtotal.toLocaleString('id-ID')}\n`;
  });
  text += `------------------------------------\n*Total : Rp ${totalBelanja.toLocaleString('id-ID')}*\n`;
  text += `_Terima kasih!_ 🙏`;

  prosesSimpanTransaksi();
  cart = [];
  document.getElementById("pay-amount").value = "";
  document.getElementById("wa-customer-phone").value = "";
  closeCartModal();
  renderCart();
  refreshData();
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

function hapusBarang(code) {
  if(confirm("Hapus barang ini?")) {
    db.collection("produk").doc(code).delete()
      .then(() => showNotif("Barang dihapus!"))
      .catch(err => alert("Gagal menghapus: " + err.message));
  }
}

function eksporStokExcel() {
  let csv = "data:text/csv;charset=utf-8,Kode,Nama,Kategori,Satuan,Stok,Modal,Harga\n";
  for (let code in databaseProduk) {
    let p = databaseProduk[code];
    csv += `"${code}","${p.nama}","${p.kategori || 'Umum'}","${p.satuan || 'pcs'}",${p.stok || 0},${p.modal || 0},${p.harga || 0}\n`;
  }
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", `Stok_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

async function importStokExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    const text = e.target.result;
    const rows = text.split("\n");
    let batch = db.batch();
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
      let row = rows[i].trim();
      if (!row) continue;
      let cols = row.split(",");
      if (cols.length >= 7) {
        let code = cols[0].replace(/"/g, '');
        let nama = cols[1].replace(/"/g, '');
        let kat = cols[2].replace(/"/g, '') || "Umum";
        let sat = (cols[3].replace(/"/g, '') || "pcs").toLowerCase();
        let stok = parseFloat(cols[4]) || 0;
        let modal = parseFloat(cols[5]) || 0;
        let harga = parseFloat(cols[6]) || 0;
        if (nama) {
          if (!code) code = "BRG-" + Date.now() + "-" + i;
          let docRef = db.collection("produk").doc(code);
          batch.set(docRef, { nama, kategori: kat, satuan: sat, isiRtg: 10, stok, modal, harga, modalRtg: modal, hargaRtg: harga, foto: "" });
          count++;
        }
      }
    }
    await batch.commit();
    alert(`Berhasil mengimpor ${count} data!`);
    document.getElementById("import-csv-file").value = "";
    refreshData();
  };
  reader.readAsText(file);
}

function eksporPelangganExcel() {
  let csv = "data:text/csv;charset=utf-8,ID,Nama,Telepon,Alamat\n";
  databasePelanggan.forEach(c => { csv += `"${c.id}","${c.nama}","${c.phone || '-'}","${c.alamat || '-'}"\n`; });
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", `Pelanggan_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function importPelangganExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    const text = e.target.result;
    const rows = text.split("\n");
    let batch = db.batch();
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
      let row = rows[i].trim();
      if (!row) continue;
      let cols = row.split(",");
      if (cols.length >= 4) {
        let custId = cols[0].replace(/"/g, '') || ("CUST-" + Date.now() + "-" + i);
        let nama = cols[1].replace(/"/g, '');
        let phone = cols[2].replace(/"/g, '') || "-";
        let alamat = cols[3].replace(/"/g, '') || "-";
        if (nama) {
          let docRef = db.collection("pelanggan").doc(custId);
          batch.set(docRef, { nama, phone, alamat, catatan: [] });
          count++;
        }
      }
    }
    await batch.commit();
    alert(`Berhasil mengimpor ${count} pelanggan!`);
    document.getElementById("import-cust-file").value = "";
    refreshData();
  };
  reader.readAsText(file);
}

function eksporExcel() {
  if (riwayatTransaksi.length === 0) return alert("Belum ada transaksi!");
  let csv = "data:text/csv;charset=utf-8,Waktu,Metode,Qty,Omset,Modal,Untung\n";
  riwayatTransaksi.forEach(t => { csv += `"${t.waktu}","${t.metode}",${t.qty},${t.total},${t.modal},${t.untung}\n`; });
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", `Laporan_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function importLaporanExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    const rows = e.target.result.split("\n");
    let batch = db.batch();
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
      let row = rows[i].trim();
      if (!row) continue;
      let cols = row.split(",");
      if (cols.length >= 6) {
        let newTrxRef = db.collection("transaksi").doc();
        batch.set(newTrxRef, {
          waktu: cols[0].replace(/"/g, ''),
          waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
          metode: cols[1].replace(/"/g, ''),
          qty: parseFloat(cols[2]) || 0,
          total: parseFloat(cols[3]) || 0,
          modal: parseFloat(cols[4]) || 0,
          untung: parseFloat(cols[5]) || 0
        });
        count++;
      }
    }
    await batch.commit();
    alert(`Berhasil mengimpor ${count} riwayat ke cloud!`);
    refreshData();
  };
  reader.readAsText(file);
}

function simpanPelanggan() {
  const id = document.getElementById("cust-id").value.trim();
  const nama = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim() || "-";
  const alamat = document.getElementById("cust-address").value.trim() || "-";
  if (!nama) return alert("Nama pelanggan wajib diisi!");
  let custId = id || ("CUST-" + Date.now());
  let dataPelanggan = { nama, phone, alamat, catatan: id ? (databasePelanggan.find(c => c.id === id)?.catatan || []) : [] };
  db.collection("pelanggan").doc(custId).set(dataPelanggan)
    .then(() => { closeCustomerModal(); showNotif("Pelanggan tersimpan!"); })
    .catch(err => alert("Gagal: " + err.message));
}

function hapusPelanggan(id) {
  if (confirm("Hapus pelanggan ini?")) {
    db.collection("pelanggan").doc(id).delete()
      .then(() => showNotif("Pelanggan dihapus!"))
      .catch(err => alert("Gagal: " + err.message));
  }
}

function updateDropdowns(kategoriList) {
  const filterSelect = document.getElementById("filter-category");
  if(filterSelect) {
    let currentVal = filterSelect.value;
    let html = `<option value="Semua">Semua Kategori</option>`;
    kategoriList.forEach(kat => { html += `<option value="${kat}" ${kat === currentVal ? "selected" : ""}>${kat}</option>`; });
    if (filterSelect.innerHTML !== html) filterSelect.innerHTML = html;
  }
  const filterPosSelect = document.getElementById("filter-category-pos");
  if(filterPosSelect) {
    let currentPosVal = filterPosSelect.value;
    let htmlPos = `<option value="Semua">Semua Kategori</option>`;
    kategoriList.forEach(kat => { htmlPos += `<option value="${kat}" ${kat === currentPosVal ? "selected" : ""}>${kat}</option>`; });
    if (filterPosSelect.innerHTML !== htmlPos) filterPosSelect.innerHTML = htmlPos;
  }
}

function simpanPengaturanToko() {
  const nama = document.getElementById("setting-shop-name").value.trim() || "TokoQuh";
  const alamat = document.getElementById("setting-shop-address").value.trim() || "-";
  const phone = document.getElementById("setting-shop-phone").value.trim() || "-";

  db.collection("pengaturan").doc("toko_v13").set({
    nama: nama,
    alamat: alamat,
    phone: phone
  }).then(() => {
    alert("Profil toko berhasil disimpan secara online!");
  }).catch(err => {
    alert("Gagal menyimpan profil toko: " + err.message);
  });
}

function simpanPengaturanScan() {
  scanCooldownDuration = parseInt(document.getElementById("setting-cooldown").value) || 1500;

  db.collection("pengaturan").doc("sistem_v13").set({
    cooldown: scanCooldownDuration
  }, { merge: true }).then(() => {
    alert("Jeda scan berhasil diperbarui secara online!");
  }).catch(err => {
    alert("Gagal menyimpan jeda scan: " + err.message);
  });
}

async function resetRiwayat() {
  if (confirm("Kosongkan SELURUH riwayat transaksi di Cloud?")) {
    let snapshot = await db.collection("transaksi").get();
    let batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    alert("Riwayat transaksi dikosongkan dari Cloud.");
    refreshData();
  }
}

function resetDatabaseBarang() {
  if (confirm("Hapus SELURUH database barang?")) {
    for (let code in databaseProduk) { db.collection("produk").doc(code).delete(); }
    alert("Database barang dikosongkan.");
    refreshData();
  }
}

function refreshData() {
  document.getElementById("setting-user").value = userAuth.user;
  document.getElementById("setting-pass").value = userAuth.pass;
  document.getElementById("setting-shop-name").value = pengaturanToko.nama;
  document.getElementById("setting-shop-address").value = pengaturanToko.alamat;
  document.getElementById("setting-shop-phone").value = pengaturanToko.phone;
  document.getElementById("setting-cooldown").value = scanCooldownDuration;
  
  const viewSelect = document.getElementById("setting-view-mode");
  if (viewSelect) viewSelect.value = viewMode;

  document.getElementById("login-sub-title").innerText = pengaturanToko.nama || "TokoQuh";
  document.getElementById("receipt-shop-name").innerText = pengaturanToko.nama;
  document.getElementById("receipt-shop-address").innerText = pengaturanToko.alamat;
  document.getElementById("receipt-shop-phone").innerText = "Telp: " + pengaturanToko.phone;

  document.getElementById('inventory-list-wrapper').style.display = (viewMode === 'list') ? 'flex' : 'none';
  document.getElementById('inventory-grid-wrapper').style.display = (viewMode === 'grid') ? 'grid' : 'none';
  
  const restockListWrapper = document.getElementById("restock-list-wrapper");
  const restockGridWrapper = document.getElementById("restock-grid-wrapper");
  if(restockListWrapper && restockGridWrapper) {
    restockListWrapper.style.display = (viewMode === 'list') ? 'flex' : 'none';
    restockGridWrapper.style.display = (viewMode === 'grid') ? 'grid' : 'none';
  }

  const invList = document.getElementById("inventory-list-wrapper");
  const invGrid = document.getElementById("inventory-grid-wrapper");
  invList.innerHTML = ""; invGrid.innerHTML = "";

  let categories = new Set();
  const filterKatEl = document.getElementById("filter-category");
  const filterKat = filterKatEl ? filterKatEl.value : "Semua";
  const filterKatPosEl = document.getElementById("filter-category-pos");
  const filterKatPos = filterKatPosEl ? filterKatPosEl.value : "Semua";
  const searchInputEl = document.getElementById("inventory-search-input");
  const searchKeyword = searchInputEl ? searchInputEl.value.toLowerCase() : "";

  let filteredItems = [];
  let filteredItemsPos = [];

  for (let code in databaseProduk) {
    let item = databaseProduk[code];
    let kat = item.kategori || "Umum";
    categories.add(kat);

    if ((item.nama.toLowerCase().includes(searchKeyword) || code.toLowerCase().includes(searchKeyword)) && (filterKat === "Semua" || kat === filterKat)) {
      filteredItems.push({ code, ...item });
    }
    if ((item.nama.toLowerCase().includes(searchKeyword) || code.toLowerCase().includes(searchKeyword)) && (filterKatPos === "Semua" || kat === filterKatPos)) {
      filteredItemsPos.push({ code, ...item });
    }
  }

  filteredItems.sort((a, b) => a.nama.localeCompare(b.nama));
  filteredItemsPos.sort((a, b) => a.nama.localeCompare(b.nama));

  let itemsPerPageStok = 24;
  let totalStokPages = Math.ceil(filteredItems.length / itemsPerPageStok) || 1;
  if (stokCurrentPage > totalStokPages) stokCurrentPage = totalStokPages;
  if (stokCurrentPage < 1) stokCurrentPage = 1;

  let stokStartIndex = (stokCurrentPage - 1) * itemsPerPageStok;
  let paginatedStokItems = filteredItems.slice(stokStartIndex, stokStartIndex + itemsPerPageStok);

  if (filteredItems.length > 0) {
    document.getElementById("stok-page-info").innerText = `${stokCurrentPage}/${totalStokPages}`;
    document.getElementById("stok-prev-btn").disabled = (stokCurrentPage <= 1);
    document.getElementById("stok-next-btn").disabled = (stokCurrentPage >= totalStokPages);
  }

  if (paginatedStokItems.length === 0) {
    const emptyStokMsg = `<div class="empty-state" style="grid-column: 1/-1;">⚠️ Belum ada data barang stok.</div>`;
    invList.innerHTML = emptyStokMsg; invGrid.innerHTML = emptyStokMsg;
  } else {
    paginatedStokItems.forEach(item => {
      let code = item.code;
      let kat = item.kategori || "Umum";
      let sat = (item.satuan || "pcs").toLowerCase();
      let stok = item.stok !== undefined ? item.stok : 0;
      let fotoSrc = item.foto || defaultPlaceholderImg;
      let modalVal = (sat === 'rtg' || sat === 'kg') ? (item.modalRtg || 0) : (item.modal || 0);
      let hargaVal = (sat === 'rtg' || sat === 'kg') ? (item.hargaRtg || 0) : (item.harga || 0);
      let satuanLabel = sat === 'rtg' ? 'rtg (isi ' + (item.isiRtg || 10) + ')' : (sat === 'kg' ? 'kg' : sat);

      invList.innerHTML += `
        <div class="inv-list-item">
          <div style="display: flex; gap: 4px; flex-shrink: 0;">
            <button class="btn-edit" onclick="openProductModal('${code}')" title="Edit" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px;">✏️</button>
            <button class="btn-danger" onclick="hapusBarang('${code}')" title="Hapus" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px;"><svg style="width:16px; height:16px; fill:currentColor;" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
          </div>
          <img src="${fotoSrc}" class="inv-list-img">
          <div class="inv-list-details">
            <div class="inv-list-title">${item.nama}</div>
            <div class="inv-list-sub">${code} • Stok: ${stok} ${sat === 'kg' ? 'Kg' : 'pcs'} • ${satuanLabel} • ${kat}</div>
            <div class="inv-list-price">Modal: Rp ${modalVal.toLocaleString('id-ID')} - Jual: Rp ${hargaVal.toLocaleString('id-ID')}</div>
          </div>
        </div>
      `;

      invGrid.innerHTML += `
        <div class="inv-card">
          <div class="inv-card-top">
            <div style="display: flex; gap: 4px; width: 100%; margin-bottom: 2px;">
              <button class="btn-edit" style="flex: 1; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.75rem;" onclick="openProductModal('${code}')">Edit</button>
              <button class="btn-danger" style="flex: 1; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.75rem;" onclick="hapusBarang('${code}')">Hapus</button>
            </div>
            <img src="${fotoSrc}" class="inv-card-img">
            <div class="inv-card-info">
              <div class="inv-card-title">${item.nama}</div>
              <div class="inv-card-code">${code}</div>
              <div style="margin-top: 2px;"><span class="badge-kat">${kat}</span> <span class="${stok > 0 ? 'badge-stok' : 'badge-stok-habis'}">${stok} ${sat === 'kg' ? 'Kg' : 'pcs'}</span></div>
            </div>
          </div>
          <div class="inv-card-details">
            <div class="inv-card-row"><span>Modal:</span><b>Rp ${modalVal.toLocaleString('id-ID')}</b></div>
            <div class="inv-card-row"><span>Jual:</span><b>Rp ${hargaVal.toLocaleString('id-ID')}</b></div>
          </div>
        </div>
      `;
    });
  }

  updateDropdowns(Array.from(categories));
  renderKatalogKasirPaginated(filteredItemsPos);

  if(restockListWrapper && restockGridWrapper) {
    restockListWrapper.innerHTML = ""; restockGridWrapper.innerHTML = "";
    let totalEstBelanja = 0;

    if (restockListItems.length === 0) {
      const emptyRestockMsg = `<div class="empty-state" style="grid-column: 1/-1;">🛒 Belum ada daftar belanja stok.<br>Tekan tombol <b>+</b> di kanan bawah untuk menambahkan barang belanjaan.</div>`;
      restockListWrapper.innerHTML = emptyRestockMsg; restockGridWrapper.innerHTML = emptyRestockMsg;
    } else {
      restockListItems.forEach(item => {
        let fotoSrc = item.foto || defaultPlaceholderImg;
        let sat = (item.satuan || "").toLowerCase();
        let satuanLabel = sat === 'rtg' ? `rtg (isi ${item.isiRtg || 10})` : (sat === 'kg' ? `kg` : sat);
        
        let detailsListHtml = '';
        let detailsGridHtml = '';
        let subtotalModal = 0;

        if (sat === 'kg') {
          let isiOns = 10;
          let modalOns = item.modal || 0;
          let modalKgVal = item.modalRtg || (modalOns * isiOns);
          let jualOns = item.harga || 0;
          let jualKgVal = item.hargaRtg || (jualOns * isiOns);
          subtotalModal = modalKgVal * (item.qty || 1);

          detailsListHtml = `
            <div>⚖️ <b>1 Kg Modal :</b> Rp ${modalKgVal.toLocaleString('id-ID')}</div>
            <div>⚖️ <b>1 Ons Modal :</b> Rp ${modalOns.toLocaleString('id-ID')}</div>
            <div>⚖️ <b>1 Kg Jual :</b> Rp ${jualKgVal.toLocaleString('id-ID')}</div>
            <div>⚖️ <b>1 Ons Jual :</b> Rp ${jualOns.toLocaleString('id-ID')}</div>
          `;
          detailsGridHtml = `
            <div style="font-size: 0.72rem; line-height: 1.3; display: flex; flex-direction: column; gap: 2px;">
              <div><b>1 Kg Modal :</b> Rp ${modalKgVal.toLocaleString('id-ID')}</div>
              <div><b>1 Ons Modal :</b> Rp ${modalOns.toLocaleString('id-ID')}</div>
              <div><b>1 Kg Jual :</b> Rp ${jualKgVal.toLocaleString('id-ID')}</div>
              <div><b>1 Ons Jual :</b> Rp ${jualOns.toLocaleString('id-ID')}</div>
            </div>
          `;
        } else if (sat === 'pcs') {
          let hargaPcs = item.modal || 0;
          let jualPcs = item.harga || 0;
          subtotalModal = hargaPcs * (item.qty || 1);
          detailsListHtml = `
            <div>📦 <b>Pcs Modal :</b> Rp ${hargaPcs.toLocaleString('id-ID')}</div>
            <div>📦 <b>Pcs Jual :</b> Rp ${jualPcs.toLocaleString('id-ID')}</div>
          `;
          detailsGridHtml = `
            <div style="font-size: 0.72rem; line-height: 1.3; display: flex; flex-direction: column; gap: 2px;">
              <div><b>Pcs Modal :</b> Rp ${hargaPcs.toLocaleString('id-ID')}</div>
              <div><b>Pcs Jual :</b> Rp ${jualPcs.toLocaleString('id-ID')}</div>
            </div>
          `;
        } else {
          let modalPcs = item.modal || 0;
          let modalRtgVal = item.modalRtg || (modalPcs * (item.isiRtg || 10));
          let jualPcs = item.harga || 0;
          let jualRtgVal = item.hargaRtg || (jualPcs * (item.isiRtg || 10));
          subtotalModal = modalRtgVal * (item.qty || 1);
          
          detailsListHtml = `
            <div>📦 <b>Pcs Modal :</b> Rp ${modalPcs.toLocaleString('id-ID')}</div>
            <div>📦 <b>Pcs Jual :</b> Rp ${jualPcs.toLocaleString('id-ID')}</div>
            <div>📑 <b>Rtg Modal :</b> Rp ${modalRtgVal.toLocaleString('id-ID')}</div>
            <div>📑 <b>Rtg Jual :</b> Rp ${jualRtgVal.toLocaleString('id-ID')}</div>
          `;
          detailsGridHtml = `
            <div style="font-size: 0.72rem; line-height: 1.3; display: flex; flex-direction: column; gap: 2px;">
              <div><b>Pcs Modal :</b> Rp ${modalPcs.toLocaleString('id-ID')}</div>
              <div><b>Pcs Jual :</b> Rp ${jualPcs.toLocaleString('id-ID')}</div>
              <div><b>Rtg Modal :</b> Rp ${modalRtgVal.toLocaleString('id-ID')}</div>
              <div><b>Rtg Jual :</b> Rp ${jualRtgVal.toLocaleString('id-ID')}</div>
            </div>
          `;
        }

        totalEstBelanja += subtotalModal;

        restockListWrapper.innerHTML += `
          <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px; margin-bottom: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <img src="${fotoSrc}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; background: #fff; flex-shrink: 0; border: 1px solid var(--border-color);">
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                  <div>
                    <div style="font-weight: bold; font-size: 0.95rem; color: var(--text-color);">${item.nama}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">Beli: <b style="color: var(--text-color);">${item.qty} ${satuanLabel}</b></div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: bold; font-size: 0.95rem; color: #2563eb;">Rp ${subtotalModal.toLocaleString('id-ID')}</div>
                  </div>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-color); background: rgba(0,0,0,0.02); border: 1px dashed var(--border-color); border-radius: 8px; padding: 6px 8px; display: flex; flex-direction: column; gap: 3px;">
                  ${detailsListHtml}
                </div>
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 6px; border-top: 1px solid var(--border-color); margin-top: 8px; padding-top: 6px;">
              <button onclick="openProductModal(null, '${item.id}')" title="Edit" style="background: rgba(37, 99, 235, 0.1); color: #2563eb; border: none; cursor: pointer; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">✏️ Edit</button>
              <button onclick="hapusItemBelanja('${item.id}')" title="Hapus" style="background: rgba(220, 38, 38, 0.1); color: #dc2626; border: none; cursor: pointer; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">🗑️ Hapus</button>
            </div>
          </div>
        `;

        restockGridWrapper.innerHTML += `
          <div class="inv-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 10px;">
            <div>
              <div style="display: flex; gap: 4px; width: 100%; margin-bottom: 4px;">
                <button class="btn-edit" style="flex: 1; height: 26px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.72rem;" onclick="openProductModal(null, '${item.id}')">Edit</button>
                <button class="btn-danger" style="flex: 1; height: 26px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.72rem;" onclick="hapusItemBelanja('${item.id}')">Hapus</button>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <img src="${fotoSrc}" style="width: 42px; height: 42px; object-fit: contain; border-radius: 6px; background: #fff; border: 1px solid var(--border-color); flex-shrink: 0;">
                <div style="min-width: 0; flex: 1;">
                  <div style="font-weight: bold; font-size: 0.9rem; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nama}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Beli: <b>${item.qty} ${satuanLabel}</b></div>
                </div>
              </div>
              <div style="background: rgba(0,0,0,0.02); border: 1px dashed var(--border-color); border-radius: 8px; padding: 6px; margin-bottom: 6px;">
                ${detailsGridHtml}
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 6px; font-size: 0.8rem;">
              <span style="font-weight: bold; color: var(--text-muted);">Total:</span>
              <b style="color: #2563eb; font-size: 0.9rem;">Rp ${subtotalModal.toLocaleString('id-ID')}</b>
            </div>
          </div>
        `;
      });
    }
    document.getElementById("restock-est-total").innerText = totalEstBelanja.toLocaleString('id-ID');
  }

  const repBody = document.getElementById("report-body");
  repBody.innerHTML = "";
  let totalOmset = 0; let totalProfit = 0;
  riwayatTransaksi.forEach(t => {
    totalOmset += t.total; totalProfit += t.untung;
    repBody.innerHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 6px;">${t.waktu}</td><td style="padding: 6px;">${t.metode}</td><td style="padding: 6px;">${t.qty}</td><td style="padding: 6px;">Rp ${t.total.toLocaleString('id-ID')}</td><td style="padding: 6px; color: #16a34a; font-weight: bold;">Rp ${t.untung.toLocaleString('id-ID')}</td></tr>`;
  });
  if (riwayatTransaksi.length === 0) repBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 15px;">Belum ada riwayat transaksi.</td></tr>`;

  document.getElementById("dash-omset").innerText = totalOmset.toLocaleString('id-ID');
  document.getElementById("dash-profit").innerText = totalProfit.toLocaleString('id-ID');
  document.getElementById("dash-trans").innerText = riwayatTransaksi.length;
  document.getElementById("dash-items").innerText = Object.keys(databaseProduk).length;

  const custContainer = document.getElementById("customer-list-wrapper");
  custContainer.innerHTML = "";
  let grandTotalAllCustomersFinancial = 0;

  if (databasePelanggan.length === 0) {
    custContainer.innerHTML = `<div class="empty-state">Belum ada data pelanggan.</div>`;
  } else {
    databasePelanggan.forEach(c => {
      let catatanHtml = "";
      let custTotalNominal = 0;

      if (c.catatan && c.catatan.length > 0) {
        c.catatan.forEach(note => {
          let nom = note.nominal || 0;
          custTotalNominal += nom;
          catatanHtml += `<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding: 6px 0;"><div><span style="font-weight: bold; font-size: 0.72rem;">[${note.jenis}]</span> <span style="font-size: 0.75rem;">${note.keterangan}</span> ${nom > 0 ? '<b style="color:#2563eb;">(Rp ' + nom.toLocaleString('id-ID') + ')</b>' : ''}</div><button class="btn-danger" style="padding: 2px 5px; font-size: 0.65rem;" onclick="hapusCatatanPembukuan('${c.id}', '${note.id}')">✕</button></div>`;
        });
      } else {
        catatanHtml = `<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Belum ada catatan keuangan.</div>`;
      }

      grandTotalAllCustomersFinancial += custTotalNominal;

      custContainer.innerHTML += `
        <div class="cust-list-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-weight: bold; font-size: 0.85rem;">${c.nama}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">📞 ${c.phone} • 📍 ${c.alamat}</div>
              <div style="font-size: 0.78rem; font-weight: 600; color: #2563eb; margin-top: 3px;">Total Nilai Catatan: Rp ${custTotalNominal.toLocaleString('id-ID')}</div>
            </div>
            <div style="display: flex; gap: 4px;">
              <button style="background: #2563eb; color: white; padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" onclick="openBookkeepingModal('${c.id}')">+ Catat</button>
              <button style="background: #25D366; color: white; padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" onclick="bagikanCatatanWhatsApp('${c.id}')">💬 WA</button>
              <button class="btn-danger" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" onclick="hapusPelanggan('${c.id}')">Hapus</button>
            </div>
          </div>
          <div class="cust-bookkeeping">${catatanHtml}</div>
        </div>
      `;
    });
  }
  document.getElementById("customer-total-financial").innerText = grandTotalAllCustomersFinancial.toLocaleString('id-ID');
}

function renderKatalogKasirPaginated(filteredItems) {
  const catalogGrid = document.getElementById("pos-catalog-container");
  const catalogList = document.getElementById("pos-catalog-list-container");
  if(!catalogGrid || !catalogList) return;
  
  catalogGrid.style.display = (viewMode === 'grid') ? 'grid' : 'none';
  catalogList.style.display = (viewMode === 'list') ? 'flex' : 'none';
  catalogGrid.innerHTML = ""; catalogList.innerHTML = "";

  let itemsPerPagePos = 24;
  let totalPosPages = Math.ceil(filteredItems.length / itemsPerPagePos) || 1;
  if (posCurrentPage > totalPosPages) posCurrentPage = totalPosPages;
  if (posCurrentPage < 1) posCurrentPage = 1;

  let posStartIndex = (posCurrentPage - 1) * itemsPerPagePos;
  let paginatedPosItems = filteredItems.slice(posStartIndex, posStartIndex + itemsPerPagePos);

  if (filteredItems.length > 0) {
    document.getElementById("pos-page-info").innerText = `${posCurrentPage}/${totalPosPages}`;
    document.getElementById("pos-prev-btn").disabled = (posCurrentPage <= 1);
    document.getElementById("pos-next-btn").disabled = (posCurrentPage >= totalPosPages);
  }

  if (paginatedPosItems.length === 0) {
    const emptyMsg = `<div class="empty-state" style="grid-column: 1/-1;">⚠️ Belum ada barang tersedia.</div>`;
    catalogGrid.innerHTML = emptyMsg; catalogList.innerHTML = emptyMsg;
  } else {
    paginatedPosItems.forEach(p => {
      let code = p.code;
      let kat = p.kategori || "Umum";
      let sat = (p.satuan || "").toLowerCase();
      let stok = p.stok !== undefined ? p.stok : 0;
      let fotoSrc = p.foto || defaultPlaceholderImg;
      let isHabis = stok <= 0;
      let unitLabel = sat === 'kg' ? '/Kg' : (sat === 'rtg' ? '/pcs (rtg)' : '/Pcs');
      let displayHarga = sat === 'kg' ? (p.hargaRtg || (p.harga * 10)) : p.harga;
      let cartItem = cart.find(item => item.barcode === code);
      let currentQtyInCart = cartItem ? cartItem.qty : 0;

      catalogGrid.innerHTML += `
        <div class="inv-card">
          <div class="inv-card-top">
            <div style="display: flex; gap: 6px; width: 100%; margin-bottom: 2px;">
              <button class="btn-edit" style="flex: 1; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: #16a34a; color: white;" ${isHabis ? 'disabled' : ''} onclick="tambahManualDariCode('${code}')">+</button>
              <button class="btn-danger" style="flex: 1; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px;" ${currentQtyInCart <= 0 ? 'disabled' : ''} onclick="kurangManualDariCode('${code}')">-</button>
            </div>
            <img src="${fotoSrc}" class="inv-card-img">
            <div class="inv-card-info">
              <div class="inv-card-title">${p.nama}</div>
              <div class="inv-card-code">${code}</div>
              <div style="margin-top: 2px;"><span class="badge-kat">${kat}</span> <span class="${stok > 0 ? 'badge-stok' : 'badge-stok-habis'}">${stok} ${sat === 'kg' ? 'Kg' : 'pcs'}</span></div>
            </div>
          </div>
          <div class="inv-card-details">
            <div class="inv-card-row"><span>Harga:</span><b>Rp ${displayHarga.toLocaleString('id-ID')}${unitLabel}</b></div>
          </div>
        </div>
      `;

      catalogList.innerHTML += `
        <div class="catalog-list-item">
          <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center;">
            <button style="width: 28px; height: 28px; border-radius: 6px; background: #16a34a; color: white; border: none; cursor: pointer;" ${isHabis ? 'disabled' : ''} onclick="tambahManualDariCode('${code}')">+</button>
            <button style="width: 28px; height: 28px; border-radius: 6px; background: #dc2626; color: white; border: none; cursor: pointer;" ${currentQtyInCart <= 0 ? 'disabled' : ''} onclick="kurangManualDariCode('${code}')">-</button>
          </div>
          <img src="${fotoSrc}" class="catalog-list-img">
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: bold; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nama}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Stok: ${stok} ${sat === 'kg' ? 'Kg' : 'pcs'}</div>
            <div style="font-size: 0.78rem; font-weight: bold; color: #2563eb;">Rp ${displayHarga.toLocaleString('id-ID')}${unitLabel}</div>
          </div>
        </div>
      `;
    });
  }
}

function showNotif(msg) {
  const notif = document.getElementById("scan-notif");
  if(!notif) return;
  notif.innerText = msg; notif.style.display = "block";
  setTimeout(() => { notif.style.display = "none"; }, 1500);
}

function bersihkanCacheTotal() {
  if (confirm("Bersihkan seluruh cache aplikasi dan muat ulang ke versi terbaru?")) {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  }
}

function ambilDariCatatan() {
  let currentTabData = databaseCatatanDinamis[activeSubCatatanTab];
  if (!currentTabData || !currentTabData.items || currentTabData.items.length === 0) {
    return alert("Tidak ada catatan aktif pada tab atau tanggal ini!");
  }

  let addedCount = 0;
  currentTabData.items.forEach(noteItem => {
    if (!noteItem.isi) return;
    let lines = noteItem.isi.split('\n');
    lines.forEach(line => {
      let parts = line.split('-').map(p => p.trim());
      if (parts.length >= 4) {
        let nama = parts[0];
        let qty = parseFloat(parts[1]) || 1;
        let satuan = parts[2].toLowerCase();
        if (!['pcs', 'kg', 'rtg'].includes(satuan)) satuan = 'pcs';
        
        let modalTotalInput = parseRupiahToNumber(parts[3]) || 0;
        let modalSatuanTotal = qty > 0 ? (modalTotalInput / qty) : modalTotalInput;

        let existingCode = Object.keys(databaseProduk).find(code => databaseProduk[code].nama.toLowerCase() === nama.toLowerCase());
        let matchedProd = existingCode ? databaseProduk[existingCode] : null;
        
        let code = existingCode || ("BRG-" + Date.now() + Math.random().toString(36).substr(2, 4));
        let kategori = matchedProd ? (matchedProd.kategori || "Umum") : "Umum";
        let isiRtg = (satuan === 'kg') ? 10 : (matchedProd ? (matchedProd.isiRtg || 10) : 10);
        
        let modalRtgVal = (satuan === 'rtg' || satuan === 'kg') ? modalSatuanTotal : modalSatuanTotal * isiRtg;
        let modalPcsVal = (satuan === 'rtg' || satuan === 'kg') ? (modalSatuanTotal / isiRtg) : modalSatuanTotal;

        // Harga jual disamakan dengan harga modal, selanjutnya dapat diubah secara manual
        let hargaRtgVal = modalRtgVal;
        let hargaPcsVal = modalPcsVal;

        let foto = matchedProd ? (matchedProd.foto || defaultPlaceholderImg) : defaultPlaceholderImg;

        let newItem = {
          id: "RESTOCK-" + Date.now() + Math.random().toString(36).substr(2, 4),
          code: code,
          nama: nama,
          kategori: kategori,
          satuan: satuan,
          isiRtg: isiRtg,
          qty: qty,
          modal: modalPcsVal,
          harga: hargaPcsVal,
          modalRtg: modalRtgVal,
          hargaRtg: hargaRtgVal,
          foto: foto
        };
        
        restockListItems.push(newItem);
        addedCount++;
      }
    });
  });

  if (addedCount > 0) {
    simpanRestockKeCloud();
    refreshData();
    showNotif(`Berhasil menarik ${addedCount} item dari catatan!`);
  } else {
    alert("Tidak ditemukan format rincian valid (Contoh: Ayam - 4 - kg - 176.000) di catatan ini!");
  }
}

setTheme(currentTheme);
cekStatusLogin();
updatePermanentBarTitle();
