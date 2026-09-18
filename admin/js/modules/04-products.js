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
      document.getElementById("db-barcode").value = rItem.barcode || "";
      document.getElementById("db-name").value = rItem.nama || "";
      setSelectedProductCategories(rItem.kategori || "");
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
    document.getElementById("db-barcode").value = p.barcode || "";
    document.getElementById("db-name").value = p.nama;
    setSelectedProductCategories(p.kategori || "");
    document.getElementById("db-unit").value = sat || "pcs";
    document.getElementById("db-isi-rtg").value = p.isiRtg || 10;
    let stokTampil = p.stok !== undefined ? p.stok : 0;
    if (sat === 'rtg') {
      let isi = p.isiRtg || 10;
      stokTampil = stokTampil / isi;
    }
    document.getElementById("db-stock").value = stokTampil;
    document.getElementById("db-cost").value = ((sat === 'rtg' || sat === 'kg') ? (p.modalRtg || 0) : (p.modal || 0)).toLocaleString('id-ID');
    document.getElementById("db-price").value = ((sat === 'rtg' || sat === 'kg') ? (p.hargaRtg || 0) : (p.harga || 0)).toLocaleString('id-ID');
    document.getElementById("db-selected-online-img").value = p.foto || "";
  } else if (activeTab === 'belanja-stok') {
    title.innerText = "Tambah Barang Belanja Stok";
    submitBtn.innerText = "Tambahkan ke Belanja Stok";
    submitBtn.setAttribute("onclick", "tambahkanKeBelanjaStok()");

    document.getElementById("db-code").value = "BRG-" + Date.now();
    document.getElementById("db-barcode").value = "";
    document.getElementById("db-name").value = "";
    setSelectedProductCategories([]);
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

    document.getElementById("db-code").value = "BRG-" + Date.now();
    document.getElementById("db-barcode").value = "";
    document.getElementById("db-name").value = "";
    setSelectedProductCategories([]);
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
  const barcode = document.getElementById("db-barcode").value.trim();
  const category = getSelectedProductCategoriesForSave();
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

  storeCollection("produk").doc(code).set({
    nama: name,
    kategori: category,
    barcode: barcode || "",
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
  const barcode = document.getElementById("db-barcode").value.trim();
  const category = getSelectedProductCategoriesForSave();
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

  storeCollection("produk").doc(code).update({
    nama: name,
    kategori: category,
    barcode: barcode || "",
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
  const barcode = document.getElementById("db-barcode").value.trim();
  const category = getSelectedProductCategoriesForSave();
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
    rItem.barcode = barcode || "";
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
        document.getElementById("db-barcode").value = m.barcode || "";
        setSelectedProductCategories(m.kategori || "");
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
    document.getElementById("db-barcode").value = p.barcode || "";
    setSelectedProductCategories(p.kategori || "");
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

