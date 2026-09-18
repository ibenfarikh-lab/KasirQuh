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
      document.getElementById("cust-password").value = "";
    }
  } else {
    title.innerText = "Tambah Pelanggan Baru";
    document.getElementById("cust-id").value = "";
    document.getElementById("cust-name").value = "";
    document.getElementById("cust-phone").value = "";
    document.getElementById("cust-address").value = "";
    document.getElementById("cust-password").value = "";
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
    storeCollection("pelanggan").doc(custId).update({ catatan: cust.catatan })
      .then(() => { closeBookkeepingModal(); showNotif("Catatan disimpan!"); })
      .catch(err => alert("Gagal menyimpan: " + err.message));
  }
}

function hapusCatatanPembukuan(custId, noteId) {
  if (confirm("Hapus catatan ini?")) {
    let cust = databasePelanggan.find(c => c.id === custId);
    if (cust && cust.catatan) {
      cust.catatan = cust.catatan.filter(n => n.id !== noteId);
      storeCollection("pelanggan").doc(custId).update({ catatan: cust.catatan })
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
  const barcode = document.getElementById("db-barcode").value.trim();
  const category = getSelectedProductCategoriesForSave();
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
    barcode: barcode || "",
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

    let docRef = storeCollection("produk").doc(code);
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
      barcode: item.barcode || "",
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

function renderRestockList() {
  const listWrapper = document.getElementById("restock-list-wrapper");
  const estTotalEl = document.getElementById("restock-est-total");
  
  if (!listWrapper) return;

  let estTotal = 0;
  if (!restockListItems || restockListItems.length === 0) {
    listWrapper.innerHTML = `<div class="empty-state" style="text-align: center; padding: 20px; color: var(--text-muted);">Belum ada barang di daftar belanja stok.</div>`;
    if (estTotalEl) estTotalEl.innerText = "0";
    return;
  }

  let htmlContent = "";
  restockListItems.forEach((item) => {
    let subtotal = (item.qty || 1) * (item.modalRtg || item.modal || 0);
    estTotal += subtotal;
    let fotoSrc = item.foto || defaultPlaceholderImg;
    let satuanLabel = item.satuan === 'rtg' ? 'rtg' : (item.satuan === 'kg' ? 'Kg' : 'pcs');

    htmlContent += `
      <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; margin-bottom: 8px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
          <img src="${fotoSrc}" style="width: 45px; height: 45px; object-fit: contain; border-radius: 6px; border: 1px solid var(--border-color); background: #fff; flex-shrink: 0;">
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: bold; font-size: 0.9rem; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nama}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Qty: <b>${item.qty} ${satuanLabel}</b> • Modal: Rp ${(item.modalRtg || item.modal || 0).toLocaleString('id-ID')}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="font-weight: bold; color: #2563eb; font-size: 0.9rem; white-space: nowrap;">Rp ${subtotal.toLocaleString('id-ID')}</div>
          <button onclick="openProductModal(null, '${item.id}')" style="background: rgba(37, 99, 235, 0.1); color: #2563eb; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">✏️</button>
          <button onclick="hapusItemBelanja('${item.id}')" style="background: rgba(220, 38, 38, 0.1); color: #dc2626; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">🗑️</button>
        </div>
      </div>
    `;
  });

  listWrapper.innerHTML = htmlContent;
  if (estTotalEl) estTotalEl.innerText = estTotal.toLocaleString('id-ID');
}

function ambilDariCatatan() {
  let currentTabData = databaseCatatanDinamis[activeSubCatatanTab];
  
  if (!currentTabData || !currentTabData.items || currentTabData.items.length === 0) {
    for (let key in databaseCatatanDinamis) {
      if (databaseCatatanDinamis[key] && databaseCatatanDinamis[key].items && databaseCatatanDinamis[key].items.length > 0) {
        currentTabData = databaseCatatanDinamis[key];
        break;
      }
    }
  }

  if (!currentTabData || !currentTabData.items || currentTabData.items.length === 0) {
    return alert("Tidak ada data catatan yang ditemukan di memori! Pastikan Anda sudah mengisi teks di menu Catatan.");
  }

  let addedCount = 0;
  const unitList = ['pcs', 'kg', 'rtg', 'ons', 'bks', 'pak', 'liter', 'ltr'];

  currentTabData.items.forEach(noteItem => {
    if (!noteItem || !noteItem.isi) return;
    let lines = noteItem.isi.split('\n');
    
    lines.forEach(line => {
      let lineStr = line.trim();
      if (!lineStr) return;

      let cleanLine = lineStr.replace(/Rp\.?/gi, '').trim();
      let parts = cleanLine.split(/\s+/);
      
      if (parts.length < 2) return;

      let rawHarga = parts[parts.length - 1];
      let modalTotalInput = parseRupiahToNumber(rawHarga);
      if (modalTotalInput <= 0) return;

      let remParts = parts.slice(0, parts.length - 1);
      let qty = 1;
      let satuan = 'pcs';
      let namaParts = remParts;

      if (remParts.length >= 2) {
        let lastToken = remParts[remParts.length - 1].toLowerCase();
        let secondLastToken = remParts[remParts.length - 2].toLowerCase();
        let cleanSecond = secondLastToken.replace(',', '.');

        if (unitList.includes(lastToken) && !isNaN(cleanSecond)) {
          satuan = lastToken;
          qty = parseFloat(cleanSecond) || 1;
          namaParts = remParts.slice(0, remParts.length - 2);
        } else {
          let match = lastToken.match(/^([\d\.,]+)([a-zA-Z]*)$/);
          let cleanNum = match ? match[1].replace(',', '.') : '';
          if (match && !isNaN(cleanNum)) {
            qty = parseFloat(cleanNum) || 1;
            if (match[2]) satuan = match[2].toLowerCase();
            namaParts = remParts.slice(0, remParts.length - 1);
          } else if (!isNaN(lastToken.replace(',', '.'))) {
            qty = parseFloat(lastToken.replace(',', '.')) || 1;
            satuan = 'pcs';
            namaParts = remParts.slice(0, remParts.length - 1);
          }
        }
      } else if (remParts.length === 1) {
        let lastToken = remParts[0].toLowerCase();
        let match = lastToken.match(/^([\d\.,]+)([a-zA-Z]+)$/);
        let cleanNum = match ? match[1].replace(',', '.') : '';
        if (match && !isNaN(cleanNum)) {
          qty = parseFloat(cleanNum) || 1;
          satuan = match[2].toLowerCase();
          namaParts = [];
        } else if (!isNaN(lastToken.replace(',', '.'))) {
          qty = parseFloat(lastToken.replace(',', '.')) || 1;
          satuan = 'pcs';
          namaParts = [];
        }
      }

      let nama = namaParts.join(' ').trim();
      if (!nama) nama = remParts.join(' ') || "Barang Catatan";

      if (!unitList.includes(satuan)) satuan = 'pcs';

      let modalSatuanTotal = qty > 0 ? (modalTotalInput / qty) : modalTotalInput;

      let existingCode = Object.keys(databaseProduk).find(code => databaseProduk[code].nama.toLowerCase() === nama.toLowerCase());
      let matchedProd = existingCode ? databaseProduk[existingCode] : null;
      
      let code = existingCode || ("BRG-" + Date.now() + Math.random().toString(36).substr(2, 4));
      let kategori = matchedProd ? (matchedProd.kategori || "Umum") : "Umum";
      let isiRtg = (satuan === 'kg' || satuan === 'ons' || satuan === 'liter' || satuan === 'ltr') ? 10 : (matchedProd ? (matchedProd.isiRtg || 10) : 10);
      
      let modalRtgVal = (satuan === 'rtg' || satuan === 'kg') ? modalSatuanTotal : modalSatuanTotal * isiRtg;
      let modalPcsVal = (satuan === 'rtg' || satuan === 'kg') ? (modalSatuanTotal / isiRtg) : modalSatuanTotal;

      let newItem = {
        id: "RESTOCK-" + Date.now() + Math.random().toString(36).substr(2, 4),
        code: code,
        nama: nama,
        kategori: kategori,
        satuan: satuan,
        isiRtg: isiRtg,
        qty: qty,
        modal: modalPcsVal,
        harga: modalPcsVal,
        modalRtg: modalRtgVal,
        hargaRtg: modalRtgVal,
        foto: matchedProd ? (matchedProd.foto || defaultPlaceholderImg) : defaultPlaceholderImg
      };
      
      restockListItems.push(newItem);
      addedCount++;
    });
  });

  if (addedCount > 0) {
    simpanRestockKeCloud();
    renderRestockList();
    showNotif(`Berhasil menarik ${addedCount} item dari catatan!`);
    switchTab('belanja-stok', false);
  } else {
    alert("Gagal membaca catatan! Pastikan format baris catatan benar (Cth: Minyak 2 kg 15.000).");
  }
}

