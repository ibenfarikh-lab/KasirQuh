function hapusBarang(code) {
  if(confirm("Hapus barang ini?")) {
    storeCollection("produk").doc(code).delete()
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
          let stokTersimpan = (sat === 'rtg') ? (stok * 10) : stok;
          let docRef = storeCollection("produk").doc(code);
          batch.set(docRef, { nama, kategori: kat, satuan: sat, isiRtg: 10, stok: stokTersimpan, modal, harga, modalRtg: modal, hargaRtg: harga, foto: "" });
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
          let docRef = storeCollection("pelanggan").doc(custId);
          batch.set(docRef, { nama, phone, alamat, password: "123456", catatan: [] });
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
        let newTrxRef = storeCollection("transaksi").doc();
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
  const password = document.getElementById("cust-password").value.trim();

  if (!nama) return alert("Nama pelanggan wajib diisi!");
  let custId = id || ("CUST-" + Date.now());
  
  let existingCust = id ? databasePelanggan.find(c => c.id === id) : null;
  let existingCatatan = existingCust ? (existingCust.catatan || []) : [];
  let existingPassword = existingCust ? (existingCust.password || "123456") : "123456";

  let dataPelanggan = { 
    nama, 
    phone, 
    alamat, 
    catatan: existingCatatan,
    password: password ? password : existingPassword
  };

  storeCollection("pelanggan").doc(custId).set(dataPelanggan, { merge: true })
    .then(() => { closeCustomerModal(); showNotif("Pelanggan tersimpan!"); })
    .catch(err => alert("Gagal: " + err.message));
}

function setujuiAkunPelanggan(docId) {
  storeCollection("pelanggan").doc(docId).update({
    status: "aktif"
  }).then(() => {
    alert("Akun pelanggan berhasil disetujui! Pelanggan sekarang dapat masuk.");
  }).catch(err => {
    alert("Gagal menyetujui akun: " + err.message);
  });
}

function hapusPelanggan(id) {
  if (confirm("Hapus pelanggan ini?")) {
    storeCollection("pelanggan").doc(id).delete()
      .then(() => showNotif("Pelanggan dihapus!"))
      .catch(err => alert("Gagal: " + err.message));
  }
}

function updateDropdowns(kategoriList) {
  const filterSelect = document.getElementById("filter-category");
  if(filterSelect) {
    let currentVal = filterSelect.value;
    let html = `<option value="Semua">${currentLang === 'en' ? 'All Categories' : (currentLang === 'ar' ? 'جميع الفئات' : 'Semua Kategori')}</option>`;
    kategoriList.forEach(kat => { html += `<option value="${kat}" ${kat === currentVal ? "selected" : ""}>${kat}</option>`; });
    if (filterSelect.innerHTML !== html) filterSelect.innerHTML = html;
  }
  const filterPosSelect = document.getElementById("filter-category-pos");
  if(filterPosSelect) {
    let currentPosVal = filterPosSelect.value;
    let htmlPos = `<option value="Semua">${currentLang === 'en' ? 'All Categories' : (currentLang === 'ar' ? 'جميع الفئات' : 'Semua Kategori')}</option>`;
    kategoriList.forEach(kat => { htmlPos += `<option value="${kat}" ${kat === currentPosVal ? "selected" : ""}>${kat}</option>`; });
    if (filterPosSelect.innerHTML !== htmlPos) filterPosSelect.innerHTML = htmlPos;
  }
}

function simpanPengaturanToko() {
  const nama = document.getElementById("setting-shop-name").value.trim() || "";
  const alamat = document.getElementById("setting-shop-address").value.trim() || "-";
  const phone = document.getElementById("setting-shop-phone").value.trim() || "-";

  storeCollection("pengaturan").doc("toko_v13").set({
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

  storeCollection("pengaturan").doc("sistem_v13").set({
    cooldown: scanCooldownDuration
  }, { merge: true }).then(() => {
    alert("Jeda scan berhasil diperbarui secara online!");
  }).catch(err => {
    alert("Gagal menyimpan jeda scan: " + err.message);
  });
}

async function resetRiwayat() {
  if (confirm("Kosongkan SELURUH riwayat transaksi di Cloud?")) {
    let snapshot = await storeCollection("transaksi").get();
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
    for (let code in databaseProduk) { storeCollection("produk").doc(code).delete(); }
    alert("Database barang dikosongkan.");
    refreshData();
  }
}

function refreshData() {
  const setUsr = document.getElementById("setting-user");
  if (setUsr) setUsr.value = userAuth.user;
  const setPass = document.getElementById("setting-pass");
  if (setPass) setPass.value = userAuth.pass;
  const setShopName = document.getElementById("setting-shop-name");
  if (setShopName) setShopName.value = pengaturanToko.nama;
  const setShopAddr = document.getElementById("setting-shop-address");
  if (setShopAddr) setShopAddr.value = pengaturanToko.alamat;
  const setShopPhone = document.getElementById("setting-shop-phone");
  if (setShopPhone) setShopPhone.value = pengaturanToko.phone;
  const setCooldown = document.getElementById("setting-cooldown");
  if (setCooldown) setCooldown.value = scanCooldownDuration;
  
  const viewSelect = document.getElementById("setting-view-mode");
  if (viewSelect) viewSelect.value = viewMode;
  const langSelect = document.getElementById("setting-language");
  if (langSelect) langSelect.value = currentLang;

  const loginSub = document.getElementById("login-sub-title");
  if (loginSub) loginSub.innerText = pengaturanToko.nama || "";
  const rcptName = document.getElementById("receipt-shop-name");
  if (rcptName) rcptName.innerText = pengaturanToko.nama;
  const rcptAddr = document.getElementById("receipt-shop-address");
  if (rcptAddr) rcptAddr.innerText = pengaturanToko.alamat;
  const rcptPhone = document.getElementById("receipt-shop-phone");
  if (rcptPhone) rcptPhone.innerText = "Telp: " + pengaturanToko.phone;

  const searchInputEl = document.getElementById("inventory-search-input");
  const searchKeyword = searchInputEl ? searchInputEl.value.toLowerCase() : "";

  let categories = new Set();

  const filterKatPosEl = document.getElementById("filter-category-pos");
  const filterKatPos = filterKatPosEl ? filterKatPosEl.value : "Semua";

  let filteredItemsPos = [];
  for (let code in databaseProduk) {
    let item = databaseProduk[code];
    let kat = item.kategori || "Umum";
    categories.add(kat);

    if ((item.nama.toLowerCase().includes(searchKeyword) || code.toLowerCase().includes(searchKeyword)) && (filterKatPos === "Semua" || kat === filterKatPos)) {
      filteredItemsPos.push({ code, ...item });
    }
  }
  filteredItemsPos.sort((a, b) => a.nama.localeCompare(b.nama));
  updateDropdowns(Array.from(categories));

  if (activeTab === 'penjualan') {
    renderKatalogKasirPaginated(filteredItemsPos);
    return; 
  }

  if (activeTab === 'belanja-stok') {
    renderRestockList();
    return;
  }

  if (activeTab === 'data-barang') {
    const invList = document.getElementById("inventory-list-wrapper");
    const invGrid = document.getElementById("inventory-grid-wrapper");
    if (invList) invList.style.display = (viewMode === 'list') ? 'flex' : 'none';
    if (invGrid) invGrid.style.display = (viewMode === 'grid') ? 'grid' : 'none';
    
    const filterKatEl = document.getElementById("filter-category");
    const filterKat = filterKatEl ? filterKatEl.value : "Semua";
    let filteredItems = [];
    for (let code in databaseProduk) {
      let item = databaseProduk[code];
      let kat = item.kategori || "Umum";
      if ((item.nama.toLowerCase().includes(searchKeyword) || code.toLowerCase().includes(searchKeyword)) && (filterKat === "Semua" || kat === filterKat)) {
        filteredItems.push({ code, ...item });
      }
    }
    filteredItems.sort((a, b) => a.nama.localeCompare(b.nama));

    if (invList && invGrid) {
      invList.innerHTML = ""; invGrid.innerHTML = "";
      let itemsPerPageStok = 24;
      let totalStokPages = Math.ceil(filteredItems.length / itemsPerPageStok) || 1;
      if (stokCurrentPage > totalStokPages) stokCurrentPage = totalStokPages;
      if (stokCurrentPage < 1) stokCurrentPage = 1;

      let stokStartIndex = (stokCurrentPage - 1) * itemsPerPageStok;
      let paginatedStokItems = filteredItems.slice(stokStartIndex, stokStartIndex + itemsPerPageStok);

      document.getElementById("stok-page-info").innerText = `${stokCurrentPage}/${totalStokPages}`;
      document.getElementById("stok-prev-btn").disabled = (stokCurrentPage <= 1);
      document.getElementById("stok-next-btn").disabled = (stokCurrentPage >= totalStokPages);

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
          let isiRtg = item.isiRtg || 10;
          let satuanLabel = sat === 'rtg' ? 'rtg (isi ' + isiRtg + ')' : (sat === 'kg' ? 'kg' : sat);

          let detailsListHtml = '';
          let detailsGridHtml = '';

          if (sat === 'kg') {
            let isiOns = 10;
            let modalOns = item.modal || 0;
            let modalKgVal = item.modalRtg || (modalOns * isiOns);
            let jualOns = item.harga || 0;
            let jualKgVal = item.hargaRtg || (jualOns * isiOns);
            detailsListHtml = `<div>⚖️ <b>1 Kg Modal :</b> Rp ${modalKgVal.toLocaleString('id-ID')}</div><div>⚖️ <b>1 Ons Modal :</b> Rp ${modalOns.toLocaleString('id-ID')}</div><div>⚖️ <b>1 Kg Jual :</b> Rp ${jualKgVal.toLocaleString('id-ID')}</div><div>⚖️ <b>1 Ons Jual :</b> Rp ${jualOns.toLocaleString('id-ID')}</div>`;
            detailsGridHtml = `<div style="font-size: 0.72rem; line-height: 1.3; display: flex; flex-direction: column; gap: 2px;"><div><b>1 Kg Modal :</b> Rp ${modalKgVal.toLocaleString('id-ID')}</div><div><b>1 Ons Modal :</b> Rp ${modalOns.toLocaleString('id-ID')}</div><div><b>1 Kg Jual :</b> Rp ${jualKgVal.toLocaleString('id-ID')}</div><div><b>1 Ons Jual :</b> Rp ${jualOns.toLocaleString('id-ID')}</div></div>`;
          } else if (sat === 'pcs') {
            let hargaPcs = item.modal || 0;
            let jualPcs = item.harga || 0;
            detailsListHtml = `<div>📦 <b>Pcs Modal :</b> Rp ${hargaPcs.toLocaleString('id-ID')}</div><div>📦 <b>Pcs Jual :</b> Rp ${jualPcs.toLocaleString('id-ID')}</div>`;
            detailsGridHtml = `<div style="font-size: 0.72rem; line-height: 1.3; display: flex; flex-direction: column; gap: 2px;"><div><b>Pcs Modal :</b> Rp ${hargaPcs.toLocaleString('id-ID')}</div><div><b>Pcs Jual :</b> Rp ${jualPcs.toLocaleString('id-ID')}</div></div>`;
          } else {
            let modalPcs = item.modal || 0;
            let modalRtgVal = item.modalRtg || (modalPcs * isiRtg);
            let jualPcs = item.harga || 0;
            let jualRtgVal = item.hargaRtg || (jualPcs * isiRtg);
            detailsListHtml = `<div>📑 <b>Rtg Modal :</b> Rp ${modalRtgVal.toLocaleString('id-ID')}</div><div>📑 <b>Rtg Jual :</b> Rp ${jualRtgVal.toLocaleString('id-ID')}</div><div>📦 <b>Pcs Modal :</b> Rp ${modalPcs.toLocaleString('id-ID')}</div><div>📦 <b>Pcs Jual :</b> Rp ${jualPcs.toLocaleString('id-ID')}</div>`;
            detailsGridHtml = `<div style="font-size: 0.72rem; line-height: 1.3; display: flex; flex-direction: column; gap: 2px;"><div><b>Rtg Modal :</b> Rp ${modalRtgVal.toLocaleString('id-ID')}</div><div><b>Rtg Jual :</b> Rp ${jualRtgVal.toLocaleString('id-ID')}</div><div><b>Pcs Modal :</b> Rp ${modalPcs.toLocaleString('id-ID')}</div><div><b>Pcs Jual :</b> Rp ${jualPcs.toLocaleString('id-ID')}</div></div>`;
          }

          invList.innerHTML += `<div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px; margin-bottom: 8px;"><div style="display: flex; align-items: flex-start; gap: 10px;"><img src="${fotoSrc}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; background: #fff; flex-shrink: 0; border: 1px solid var(--border-color);"><div style="flex: 1; min-width: 0; display: flex; justify-content: space-between; align-items: flex-start;"><div><div style="font-weight: bold; font-size: 0.95rem; color: var(--text-color);">${item.nama}</div><div style="font-size: 0.78rem; color: var(--text-muted);">${code} • Stok: <b style="color: var(--text-color);">${stok} ${sat === 'kg' ? 'Kg' : 'pcs'}</b> • ${satuanLabel}</div></div><div><span class="badge-kat">${kat}</span></div></div></div><div style="font-size: 0.75rem; color: var(--text-color); background: rgba(0,0,0,0.02); border: 1px dashed var(--border-color); border-radius: 8px; padding: 6px 8px; margin-top: 8px; display: flex; flex-direction: column; gap: 3px;">${detailsListHtml}</div><div style="display: flex; justify-content: flex-end; gap: 6px; border-top: 1px solid var(--border-color); margin-top: 8px; padding-top: 6px;"><button onclick="openProductModal('${code}')" style="background: rgba(37, 99, 235, 0.1); color: #2563eb; border: none; cursor: pointer; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">✏️ Edit</button><button onclick="hapusBarang('${code}')" style="background: rgba(220, 38, 38, 0.1); color: #dc2626; border: none; cursor: pointer; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">🗑️ Hapus</button></div></div>`;
          invGrid.innerHTML += `<div class="inv-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 10px;"><div><div style="display: flex; gap: 4px; width: 100%; margin-bottom: 4px;"><button class="btn-edit" style="flex: 1; height: 26px; border-radius: 6px; font-size: 0.72rem;" onclick="openProductModal('${code}')">Edit</button><button class="btn-danger" style="flex: 1; height: 26px; border-radius: 6px; font-size: 0.72rem;" onclick="hapusBarang('${code}')">Hapus</button></div><div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;"><img src="${fotoSrc}" style="width: 42px; height: 42px; object-fit: contain; border-radius: 6px; background: #fff; border: 1px solid var(--border-color); flex-shrink: 0;"><div style="min-width: 0; flex: 1;"><div style="font-weight: bold; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nama}</div><div style="font-size: 0.75rem; color: var(--text-muted);">Stok: <b>${stok}</b></div></div></div><div style="background: rgba(0,0,0,0.02); border: 1px dashed var(--border-color); border-radius: 8px; padding: 6px; margin-bottom: 6px;">${detailsGridHtml}</div></div><div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 6px; font-size: 0.8rem;"><span style="font-weight: bold; color: var(--text-muted);">Kategori:</span><span class="badge-kat">${kat}</span></div></div>`;
        });
      }
    }
    return;
  }

  if (activeTab === 'laporan') {
    let totalOmset = 0; let totalProfit = 0;
    const repBody = document.getElementById("report-body");
    if (repBody) {
      repBody.innerHTML = "";
      riwayatTransaksi.forEach(t => {
        totalOmset += t.total; totalProfit += t.untung;
        repBody.innerHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 6px;">${t.waktu}</td><td style="padding: 6px;">${t.metode}</td><td style="padding: 6px;">${t.qty}</td><td style="padding: 6px;">Rp ${t.total.toLocaleString('id-ID')}</td><td style="padding: 6px; color: #16a34a; font-weight: bold;">Rp ${t.untung.toLocaleString('id-ID')}</td></tr>`;
      });
      if (riwayatTransaksi.length === 0) repBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 15px;">Belum ada riwayat transaksi.</td></tr>`;
    }

    const dashOmset = document.getElementById("dash-omset");
    if (dashOmset) dashOmset.innerText = totalOmset.toLocaleString('id-ID');
    const dashProfit = document.getElementById("dash-profit");
    if (dashProfit) dashProfit.innerText = totalProfit.toLocaleString('id-ID');
    const dashTrans = document.getElementById("dash-trans");
    if (dashTrans) dashTrans.innerText = riwayatTransaksi.length;
    const dashItems = document.getElementById("dash-items");
    if (dashItems) dashItems.innerText = Object.keys(databaseProduk).length;

    const custContainer = document.getElementById("customer-list-wrapper");
    if (custContainer) {
      custContainer.innerHTML = "";
      let grandTotalAllCustomersFinancial = 0;
      
      // FILTER AGAR PELANGGAN PENDING TIDAK MUNCUL DI DAFTAR UTAMA
      databasePelanggan.filter(c => String(c.status || "").toLowerCase() !== "pending").forEach(c => {
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
        custContainer.innerHTML += `<div class="cust-list-item"><div style="display: flex; justify-content: space-between; align-items: flex-start;"><div><div style="font-weight: bold; font-size: 0.85rem;">${c.nama}</div><div style="font-size: 0.75rem; color: var(--text-muted);">📞 ${c.phone} • 📍 ${c.alamat}</div><div style="font-size: 0.78rem; font-weight: 600; color: #2563eb; margin-top: 3px;">Total Nilai Catatan: Rp ${custTotalNominal.toLocaleString('id-ID')}</div></div><div style="display: flex; gap: 4px;"><button style="background: #2563eb; color: white; padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" onclick="openBookkeepingModal('${c.id}')">+ Catat</button><button style="background: #25D366; color: white; padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" onclick="bagikanCatatanWhatsApp('${c.id}')">💬 WA</button><button class="btn-edit" style="background: #ca8a04; color: white; padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" onclick="openCustomerModal('${c.id}')">Edit</button><button class="btn-danger" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" onclick="hapusPelanggan('${c.id}')">Hapus</button></div></div><div class="cust-bookkeeping">${catatanHtml}</div></div>`;
      });
      const custTotalFin = document.getElementById("customer-total-financial");
      if (custTotalFin) custTotalFin.innerText = grandTotalAllCustomersFinancial.toLocaleString('id-ID');
    }

    // KODE TAMBAHAN UNTUK MENAMPILKAN PELANGGAN PENDING
    const pendingContainer = document.getElementById("pending-customer-list-wrapper");
    if (pendingContainer) {
      pendingContainer.innerHTML = "";
      
      let pendingCustomers = databasePelanggan.filter(c => String(c.status || "").toLowerCase() === "pending");
      
      if (pendingCustomers.length === 0) {
        pendingContainer.innerHTML = `<div class="empty-state" style="text-align: center; padding: 20px; color: var(--text-muted);">Tidak ada pelanggan yang menunggu persetujuan.</div>`;
      } else {
        pendingCustomers.forEach(c => {
          pendingContainer.innerHTML += `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px;">
              <div>
                <div style="font-weight: bold; font-size: 0.9rem;">👤 ${c.nama}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">📞 ${c.phone || '-'} | 📍 ${c.alamat || '-'}</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button onclick="setujuiAkunPelanggan('${c.id}')" style="background: #16a34a; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.75rem;">✅ Setuju</button>
                <button onclick="hapusPelanggan('${c.id}')" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.75rem;">❌ Tolak</button>
              </div>
            </div>
          `;
        });
      }
    }
    
    return;
  }
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
      let unitLabel = sat === 'kg' ? '/Kg' : '/Pcs';
      let displayHarga = sat === 'kg' ? (p.hargaRtg || (p.harga * 10)) : p.harga;
      let cartItem = cart.find(item => item.barcode === code);
      let currentQtyInCart = cartItem ? cartItem.qty : 0;

      catalogGrid.innerHTML += `
        <div class="inv-card">
          <div class="inv-card-top">
            <div style="display: flex; gap: 6px; width: 100%; margin-bottom: 2px;">
              <button class="btn-edit" style="flex: 1; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: #16a34a; color: white;" ${isHabis ? 'disabled' : ''} onclick="tambahManualDesimalDariCode('${code}')">+</button>
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
            <button style="width: 28px; height: 28px; border-radius: 6px; background: #16a34a; color: white; border: none; cursor: pointer;" ${isHabis ? 'disabled' : ''} onclick="tambahManualDesimalDariCode('${code}')">+</button>
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

