/* KasirQuh V14 Phase 9 — physical Product module extraction */
(function(){
  window.KQModules = window.KQModules || {};
  window.bagikanProdukViaWA = function bagikanProdukViaWA() {
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
  window.renderTeksDanBagikanProduk = function renderTeksDanBagikanProduk(ctx, canvas, p, hargaParsed, satuan, storeName) {
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
  window.pilihKategoriPelanggan = function pilihKategoriPelanggan(kategori) {
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
  window.perbaruiTampilanKategori = function perbaruiTampilanKategori() {
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
  window.openProductDetail = function openProductDetail(code) {
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
  window.closeProductDetail = function closeProductDetail(skipHistory = false) {
        if (!skipHistory && !appNavRestoring && history.state?.__kasirquhState?.modal === 'productDetailModal') { history.back(); return; }
        const detailModal = document.getElementById('productDetailModal');
        detailModal.classList.remove('show');
        detailModal.classList.remove('modern-card-detail-mode');
      }
  window.ubahQtyDetail = function ubahQtyDetail(dir) {
        if(!currentDetailCode) return;
        let p = databaseProduk[currentDetailCode]; if(!p) return;
        let newQty = currentDetailQty + (dir * currentDetailStep);
        if(newQty < currentDetailStep) newQty = currentDetailStep;
        if(newQty > (p.stok || 0)) return showToast("Sisa stok hanya " + p.stok, "error");
        currentDetailQty = parseFloat(newQty.toFixed(3));
        document.getElementById('detail-qty-input').value = currentDetailQty;
      }
  window.tambahDariDetail = function tambahDariDetail() {
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
  window.tanyaAdminBarang = function tanyaAdminBarang() {
        if(!currentDetailCode) return;
        let p = databaseProduk[currentDetailCode];
        closeProductDetail(true);
        switchTabPelanggan('live-chat'); switchSubTabLiveChat('admin');
        let inputEl = document.getElementById("customer-chat-input");
        if(inputEl) { inputEl.value = `Halo admin, saya mau tanya soal barang ${p.nama}... `; setTimeout(() => inputEl.focus(), 500); }
      }
  window.tambahKeKeranjangCepat = function tambahKeKeranjangCepat(code) {
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
  window.refreshKatalogPelanggan = function refreshKatalogPelanggan() {
        const container = document.getElementById("pos-catalog-container"); const cardWrapper = document.getElementById("pos-card-wrapper");
        if (!container || !cardWrapper) return;
        const isHomeRoute = (document.body?.dataset?.kqRoute || window.KQ_CUSTOMER_PAGE?.route || 'home') === 'home';
        if (!['list','grid','card'].includes(catalogViewMode)) catalogViewMode = 'grid';
        container.className = catalogViewMode === 'list' ? "product-catalog-list" : (catalogViewMode === 'card' ? "product-catalog-card" : "product-catalog-grid");
        if (!isHomeRoute) updateCatalogViewButtons();
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
        const visibleCount = isHomeRoute ? 6 : catalogVisibleCount;
        let paginatedItems = matchedProducts.slice(0, visibleCount);
        container.innerHTML = "";
  
        const loadSentinel = document.getElementById('catalog-load-sentinel');
        cardWrapper.dataset.catalogTotal = String(matchedProducts.length);
        if (loadSentinel) loadSentinel.style.display = isHomeRoute ? 'none' : ((catalogVisibleCount < matchedProducts.length) ? 'block' : 'none');
  
        if (matchedProducts.length === 0) { container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 15px; font-size: 0.8rem;">Produk tidak ditemukan untuk kategori ini.</div>`; const pi=document.getElementById("pos-page-indicator"); if(pi) pi.innerText = `1/1`; if (loadSentinel) loadSentinel.style.display='none'; return; }
        const imageLoadingAttr = isHomeRoute ? '' : ' loading="lazy"';
  
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
                    <img class="modern-card-product" src="${fotoSrc}" alt="${p.nama}" ${imageLoadingAttr} onload="makeModernProductTransparent(this)">
                    <div class="modern-card-platform" aria-hidden="true">
                      <div class="modern-card-base"></div>
                      <div class="modern-card-rim"></div>
                      <div class="modern-card-surface"></div>
                      <div class="modern-card-highlight"></div>
                    </div>
                    <button type="button" class="btn-quick-cart-icon modern-card-cart-btn" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">${typeof KQIcon === "function" ? KQIcon("cart") : ""}</button>
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
                    <img src="${fotoSrc}" alt="${p.nama}" ${imageLoadingAttr}>
                    <button type="button" class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">${typeof KQIcon === "function" ? KQIcon("cart") : ""}</button>
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
                    <button type="button" class="btn-quick-cart-icon modern-cart-btn" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">${typeof KQIcon === "function" ? KQIcon("cart") : ""}</button>
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
                    <button type="button" class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">${typeof KQIcon === "function" ? KQIcon("cart") : ""}</button>
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
                    <button type="button" class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" style="position: static; width: 24px; height: 24px; font-size: 0.7rem;">${typeof KQIcon === "function" ? KQIcon("cart") : ""}</button>
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
                    <button type="button" class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" style="position:static; width:24px; height:24px; font-size:.7rem;">${typeof KQIcon === "function" ? KQIcon("cart") : ""}</button>
                  </div>
                </div>`;
            }
          }
        });
        const pageIndicator = document.getElementById("pos-page-indicator");
        if (pageIndicator) pageIndicator.innerText = `${Math.min(visibleCount, matchedProducts.length)}/${matchedProducts.length}`;
      }
  window.ubahHalamanPos = function ubahHalamanPos(d) { return; }
  window.filterKatalogPelanggan = function filterKatalogPelanggan(v) {
        currentPosPage = 1;
        // Saat filter/kategori berubah, mulai lagi dari 6 card pertama yang cocok.
        catalogVisibleCount = CATALOG_INITIAL_VISIBLE;
        refreshKatalogPelanggan();
      }
  window.loadNextCatalogBatch = function loadNextCatalogBatch() {
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
  window.setupCatalogInfiniteScroll = function setupCatalogInfiniteScroll() {
        const sentinel = document.getElementById('catalog-load-sentinel');
        if (!sentinel || !('IntersectionObserver' in window)) return;
        if (catalogLoadObserver) catalogLoadObserver.disconnect();
  
        catalogLoadObserver = new IntersectionObserver((entries) => {
          if (entries.some(entry => entry.isIntersecting)) loadNextCatalogBatch();
        }, { root: null, rootMargin: '500px 0px 500px 0px', threshold: 0 });
        catalogLoadObserver.observe(sentinel);
      }
  window.handleCatalogInfiniteScroll = function handleCatalogInfiniteScroll() {
        if (catalogScrollLoading) return;
        const sentinel = document.getElementById('catalog-load-sentinel');
        if (!sentinel || sentinel.style.display === 'none') return;
        const rect = sentinel.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 500) loadNextCatalogBatch();
      }
  window.KQModules.products = window.KQModules.products || {};
  window.KQModules.products.name = 'products';
  window.KQModules.products.boot = function(){
    if(typeof window.perbaruiTampilanKategori==='function') window.perbaruiTampilanKategori();
    if(typeof window.refreshKatalogPelanggan==='function') window.refreshKatalogPelanggan();
  };
})();
