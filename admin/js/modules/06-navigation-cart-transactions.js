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
  } else if (subTabId === 'sub-persetujuan') {
    document.getElementById('sub-btn-persetujuan')?.classList.add('active');
    if(fabAdd) fabAdd.style.display = 'none';
    if(fabAddCust) fabAddCust.style.display = 'none';
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
  const catatanPag = document.getElementById("catatan-pagination-wrapper");

  posPag.classList.remove("show");
  stokPag.classList.remove("show");
  if (catatanPag) catatanPag.classList.remove("show");

  if (activeTab === 'penjualan') {
    titleEl.innerText = (currentLang === 'en') ? "POS Page" : ((currentLang === 'ar') ? "صفحة الكاشير" : "Halaman Kasir");
    posPag.classList.add("show");
  } else if (activeTab === 'kasir-online') {
    titleEl.innerText = (currentLang === 'en') ? "Online POS" : ((currentLang === 'ar') ? "كاشير أونلاين" : "Kasir Online");
  } else if (activeTab === 'data-barang') {
    titleEl.innerText = (currentLang === 'en') ? "Stock Management" : ((currentLang === 'ar') ? "إدارة المخزون" : "Manajemen Stok");
    stokPag.classList.add("show");
  } else if (activeTab === 'belanja-stok') {
    titleEl.innerText = (currentLang === 'en') ? "Restock" : ((currentLang === 'ar') ? "إعادة التخزين" : "Belanja Stok");
  } else if (activeTab === 'laporan') {
    titleEl.innerText = (activeSubDataTab === 'sub-pelanggan') ? ((currentLang === 'en') ? "Customer Data" : ((currentLang === 'ar') ? "بيانات العملاء" : "Data Pelanggan")) : ((activeSubDataTab === 'sub-persetujuan') ? ((currentLang === 'en') ? "Customer Approvals" : ((currentLang === 'ar') ? "موافقات العملاء" : "Persetujuan Pelanggan")) : ((currentLang === 'en') ? "Transaction Data" : ((currentLang === 'ar') ? "بيانات المعاملات" : "Data Transaksi")));
  } else if (activeTab === 'catatan') {
    titleEl.innerText = labelNamaTabCatatan[activeSubCatatanTab] || "Catatan";
    if (catatanPag) catatanPag.classList.add("show"); 
  } else if (activeTab === 'live-chat-admin') {
    titleEl.innerText = (currentLang === 'en') ? "Live Chat" : ((currentLang === 'ar') ? "الدردشة المباشرة" : "Live Chat");
  } else if (activeTab === 'pengaturan') {
    titleEl.innerText = (currentLang === 'en') ? "System Settings" : ((currentLang === 'ar') ? "إعدادات النظام" : "Pengaturan Sistem");
  } else if (activeTab === 'kalkulator') {
    titleEl.innerText = (currentLang === 'en') ? "Calculator" : ((currentLang === 'ar') ? "آلة حاسبة" : "Kalkulator");
    initCalcPreview();
  }

  document.querySelectorAll('.popup-menu-btn').forEach(btn => btn.classList.remove('active-menu'));
  const activeBtnMap = {
    'penjualan': 'pop-btn-penjualan',
    'kasir-online': 'pop-btn-kasironline',
    'kalkulator': 'pop-btn-kalkulator',
    'data-barang': 'pop-btn-databarang',
    'belanja-stok': 'pop-btn-belanjastok',
    'laporan': 'pop-btn-laporan',
    'catatan': 'pop-btn-catatan',
    'live-chat-admin': 'pop-btn-livechat',
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

  if (pushHistory) history.replaceState({tab: tabId}, "", "");

  const fabCart = document.getElementById('fab-cart-btn');
  const fabScan = document.getElementById('fab-scan-btn');
  const fabFilter = document.getElementById('fab-filter-btn');
  const fabAdd = document.getElementById('fab-add-btn');
  const fabAddCust = document.getElementById('fab-add-cust-btn');
  const fabAddCatatan = document.getElementById('fab-add-catatan-btn');
  const fabVoiceScan = document.getElementById('fab-voice-scan-btn');

  if (tabId === 'penjualan') {
    if(fabCart) fabCart.style.display = 'flex'; 
    if(fabScan) fabScan.style.display = 'flex'; 
    if(fabFilter) fabFilter.style.display = 'flex'; 
    if(fabVoiceScan) fabVoiceScan.style.display = 'flex';
    if(fabAdd) fabAdd.style.display = 'none'; 
    if(fabAddCust) fabAddCust.style.display = 'none'; 
    if(fabAddCatatan) fabAddCatatan.style.display = 'none';
  } else {
    if(fabVoiceScan) fabVoiceScan.style.display = 'none';
    if (tabId === 'kasir-online') {
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
    } else if (tabId === 'kalkulator') {
      if(fabCart) fabCart.style.display = 'none'; 
      if(fabScan) fabScan.style.display = 'none'; 
      if(fabFilter) fabFilter.style.display = 'none'; 
      if(fabAdd) fabAdd.style.display = 'none'; 
      if(fabAddCust) fabAddCust.style.display = 'none'; 
      if(fabAddCatatan) fabAddCatatan.style.display = 'none';
      initCalcPreview();
    } else {
      if(fabCart) fabCart.style.display = 'none'; 
      if(fabScan) fabScan.style.display = 'none'; 
      if(fabFilter) fabFilter.style.display = 'none'; 
      if(fabAdd) fabAdd.style.display = 'none'; 
      if(fabAddCust) fabAddCust.style.display = 'none'; 
      if(fabAddCatatan) fabAddCatatan.style.display = 'none';
    }
  }
  updatePermanentBarTitle();
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
  if (!modal) {
    console.error("scannerModal tidak ditemukan");
    showNotif("Scanner belum tersedia pada halaman ini.");
    return;
  }
  if (!isScannerPosOpen) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
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
    modal.setAttribute("aria-hidden", "true");
    isScannerPosOpen = false;
    if (html5QrCodePos && html5QrCodePos.isScanning) html5QrCodePos.stop().catch(err => {});
  }
}

function processBarcodeScanPos(scannedValue) {
  if (isCooldown) return;
  isCooldown = true;
  playBeep();

  const value = String(scannedValue || '').trim();
  // Produk sekarang memakai ID Dokumen Firebase sebagai key.
  // QR/Barcode disimpan di field `barcode`, jadi scanner harus mencari keduanya.
  const found = Object.entries(databaseProduk || {}).find(([docId, p]) =>
    String(docId).trim() === value || String(p?.barcode || '').trim() === value
  );

  if (!found) {
    showNotif("Barang tidak ditemukan!");
    setTimeout(() => { isCooldown = false; }, scanCooldownDuration);
    return;
  }

  const [docId, produk] = found;
  if ((produk.stok || 0) <= 0) {
    showNotif("Stok Habis!");
    setTimeout(() => { isCooldown = false; }, scanCooldownDuration);
    return;
  }

  showNotif("Berhasil: " + produk.nama);
  // Keranjang tetap menggunakan ID Dokumen sebagai key internal.
  tambahItemKeCart(docId, produk);
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
  const value = String(barcode || '').trim();
  document.getElementById("db-barcode").value = value;
  const foundEntry = Object.entries(databaseProduk || {}).find(([docId, p]) => String(p?.barcode || '').trim() === value || docId === value);
  if (foundEntry) {
    const [docId, p] = foundEntry;
    let sat = (p.satuan || "").toLowerCase();
    document.getElementById("db-code").value = docId;
    document.getElementById("db-name").value = p.nama || "";
    setSelectedProductCategories(p.kategori || "");
    document.getElementById("db-unit").value = sat || "pcs";
    document.getElementById("db-isi-rtg").value = p.isiRtg || 10;
    document.getElementById("db-cost").value = (((sat === 'rtg' || sat === 'kg') ? p.modalRtg : p.modal) || 0).toLocaleString('id-ID');
    document.getElementById("db-price").value = (((sat === 'rtg' || sat === 'kg') ? p.hargaRtg : p.harga) || 0).toLocaleString('id-ID');
    updateUnitLabel();
  }
  toggleScannerDb();
}

function tambahManualDesimalDariCode(barcode) {
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

function tambahItemKeCart(barcode, produk, customQty = null, customSatuanJual = null) {
  const satProd = (produk.satuan || "").toLowerCase();
  const isKg = (satProd === 'kg');
  const isRtg = (satProd === 'rtg');
  let inputJumlah = customQty !== null ? customQty : 1;
  let displaySatuan = customSatuanJual !== null ? customSatuanJual : (isKg ? 'kg' : 'pcs');
  let hargaAktif = produk.harga;
  let modalAktif = produk.modal;

  if (isKg) {
    let isiOns = 10;
    let hargaKg = produk.hargaRtg || (produk.harga * isiOns);
    let modalKg = produk.modalRtg || (produk.modal * isiOns);

    if (customQty === null) {
      let kgStr = prompt(`Masukkan jumlah Kilogram (Kg) untuk ${produk.nama}\n(Contoh: 1 untuk 1 kg, 0.5 untuk setengah kg / 5 ons, 0.1 untuk 1 ons):`, "1");
      if (kgStr === null) return;
      inputJumlah = parseFloat(kgStr.replace(',', '.')) || 1;
    }
    hargaAktif = hargaKg;
    modalAktif = modalKg;
    displaySatuan = 'kg';
  } else if (isRtg) {
    hargaAktif = produk.harga;
    modalAktif = produk.modal;
    displaySatuan = 'pcs';
  }

  const existingItem = cart.find(item => item.barcode === barcode && item.satuanJual === displaySatuan);
  const currentCartQty = existingItem ? existingItem.qty : 0;
  if (currentCartQty + inputJumlah > (produk.stok || 0)) {
    if (customQty === null) alert(`Stok tidak mencukupi! Sisa stok: ${produk.stok}`);
    return false;
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
  return true;
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
      storeCollection("produk").doc(item.barcode).update({ stok: newStok });
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
  storeCollection("transaksi").add(transaksi).catch(err => console.error("Gagal simpan transaksi ke cloud: ", err));
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

