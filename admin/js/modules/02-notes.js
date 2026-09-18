storeCollection("pengaturan").doc("toko_v13").onSnapshot((doc) => {
  if (doc.exists) {
    pengaturanToko = doc.data();
  } else {
    storeCollection("pengaturan").doc("toko_v13").set(pengaturanToko);
  }
  refreshData();
});

let scanCooldownDuration = 1500;
storeCollection("pengaturan").doc("sistem_v13").onSnapshot((doc) => {
  if (doc.exists) {
    let data = doc.data();
    if (data.cooldown) scanCooldownDuration = data.cooldown;
  } else {
    storeCollection("pengaturan").doc("sistem_v13").set({ cooldown: 1500 });
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

function navigasiHariCatatan(delta) {
  let currentDate = new Date(selectedCatatanDate + "T00:00:00");
  currentDate.setDate(currentDate.getDate() + delta);
  
  let year = currentDate.getFullYear();
  let month = String(currentDate.getMonth() + 1).padStart(2, '0');
  let day = String(currentDate.getDate()).padStart(2, '0');
  
  ubahTanggalCatatan(`${year}-${month}-${day}`);
}

function updateDateDisplayUI() {
  const displayEl = document.getElementById("catatan-date-display");
  const pickerEl = document.getElementById("catatan-date-picker");
  const bottomDateEl = document.getElementById("catatan-bottom-date-info"); 

  if (displayEl) displayEl.innerText = `📅 ${formatTanggalIndo(selectedCatatanDate)}`;
  if (pickerEl && pickerEl.value !== selectedCatatanDate) {
    pickerEl.value = selectedCatatanDate;
  }
  
  if (bottomDateEl) {
    let fullDate = formatTanggalIndo(selectedCatatanDate);
    let splitDate = fullDate.split(', ');
    bottomDateEl.innerText = splitDate.length > 1 ? splitDate[1] : fullDate;
  }
}

storeCollection("pengaturan").doc("daftar_tab_catatan_v13").onSnapshot((doc) => {
  if (doc.exists) {
    let data = doc.data();
    if (data.list && data.list.length > 0) daftarNamaTabCatatan = data.list;
    if (data.labels) labelNamaTabCatatan = data.labels;
  } else {
    storeCollection("pengaturan").doc("daftar_tab_catatan_v13").set({
      list: daftarNamaTabCatatan,
      labels: labelNamaTabCatatan
    });
  }
  updateDateDisplayUI();
  renderSubTabsCatatanUI();
});

let catatanListeners = {};

function setupCatatanListener(tabKey) {
  const docId = `${tabKey}_${selectedCatatanDate}`;

  if (catatanListeners[tabKey]) {
    catatanListeners[tabKey]();
    catatanListeners[tabKey] = null;
  }

  catatanListeners[tabKey] = storeCollection("catatan").doc(docId).onSnapshot(async (docSnap) => {
    if (docSnap.exists) {
      databaseCatatanDinamis[tabKey] = docSnap.data();
      renderHalamanSubCatatan(tabKey);
    } else {
      let currDate = new Date(selectedCatatanDate + "T00:00:00");
      currDate.setDate(currDate.getDate() - 1);
      let prevDateStr = currDate.getFullYear() + '-' + String(currDate.getMonth() + 1).padStart(2, '0') + '-' + String(currDate.getDate()).padStart(2, '0');
      let prevDocId = `${tabKey}_${prevDateStr}`;
      
      let prevDocSnap = await storeCollection("catatan").doc(prevDocId).get();
      let targetItems = [];

      if (prevDocSnap.exists && prevDocSnap.data().items) {
        targetItems = prevDocSnap.data().items.map(item => ({
          id: "NOTE-" + Date.now() + Math.random().toString(36).substr(2, 3),
          judul: item.judul || "",
          subjudul: "",
          isi: "",
          waktu: new Date().toLocaleString('id-ID')
        }));
      } else {
        let defaultLabel = labelNamaTabCatatan[tabKey] || tabKey;
        targetItems = [
          { id: "NOTE-" + Date.now(), judul: defaultLabel, subjudul: "", isi: "", waktu: new Date().toLocaleString('id-ID') }
        ];
      }

      let targetData = {
        tabKey: tabKey,
        tanggal: selectedCatatanDate,
        modalAwal: "0",
        items: targetItems
      };
      await storeCollection("catatan").doc(docId).set(targetData);
    }
  }, err => {
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
              <input type="text" id="modal-awal-${tabKey}" value="0" oninput="formatInputRupiah(this); hitungRingkasanCatatanDinamis('${tabKey}'); simpanModalAwalDinamis('${tabKey}');" style="width: 130px; padding: 4px 8px; font-size: 0.9rem; font-weight: bold; text-align: right;">
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 6px;">
            <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted);">Uang Modal</span>
            <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted);">Pembayaran</span>
            <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-muted);">Sisa Modal</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; font-weight: bold;">
            <span style="color: #2563eb;">Rp <span id="lbl-modal-${tabKey}">0</span></span>
            <span style="color: #ea580c;">Rp <span id="lbl-bayar-${tabKey}">0</span></span>
            <span style="color: #16a34a;">Rp <span id="lbl-sisa-${tabKey}">0</span></span>
          </div>
        </div>
        <div id="container-list-${tabKey}" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    `;
    containerContent.appendChild(contentDiv);
    
    setupCatatanListener(tabKey);
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

  storeCollection("pengaturan").doc("daftar_tab_catatan_v13").set({
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
    storeCollection("pengaturan").doc("daftar_tab_catatan_v13").set({
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

    storeCollection("pengaturan").doc("daftar_tab_catatan_v13").set({
      list: daftarNamaTabCatatan,
      labels: labelNamaTabCatatan
    }).then(() => {
      storeCollection("catatan").doc(`${tabKey}_${selectedCatatanDate}`).delete().catch(e => {});
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
  databaseCatatanDinamis[tabKey].tabKey = tabKey;
  databaseCatatanDinamis[tabKey].tanggal = selectedCatatanDate;

  storeCollection("catatan").doc(`${tabKey}_${selectedCatatanDate}`).set(databaseCatatanDinamis[tabKey], { merge: true })
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
  if (inputEl && dataObj.modalAwal !== undefined) {
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

  let dataObj = databaseCatatanDinamis[targetTabKey] || { tabKey: targetTabKey, tanggal: selectedCatatanDate, modalAwal: "0", items: [] };
  dataObj.tabKey = targetTabKey;
  dataObj.tanggal = selectedCatatanDate;
  if (!dataObj.modalAwal) dataObj.modalAwal = "0";

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
  storeCollection("catatan").doc(`${targetTabKey}_${selectedCatatanDate}`).set(dataObj)
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

    storeCollection("catatan").doc(`${targetTabKey}_${selectedCatatanDate}`).set(dataObj)
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
  storeCollection("catatan").doc(`${targetTabKey}_${selectedCatatanDate}`).set(dataObj)
    .then(() => {
      renderHalamanSubCatatan(targetTabKey);
      showNotif("Urutan diperbarui!");
    })
    .catch(err => alert("Gagal mengubah urutan: " + err.message));
}

