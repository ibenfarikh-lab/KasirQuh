async function muatBarangLarisHariIni() {
      // Jangan pernah mengosongkan section hanya karena listener Firebase datang
      // dalam urutan yang berbeda. Produk dan konfigurasi harus siap lebih dulu.
      if (!isProductsLoaded || !isTrendingConfigLoaded) return;

      const cfg = window.__sedangLarisConfig || {enabled:true, limit:5};
      if (cfg.enabled === false) { renderTrending([]); return; }

      const limit = Math.min(20, Math.max(1, parseInt(cfg.limit,10) || 5));
      const token = ++trendingLoadToken;

      try {
        let snap = window.__trendingTransactionsSnapshot;

        // Listener adalah sumber utama. Jika belum tersedia (misalnya saat awal
        // koneksi), ambil data sekali sebagai fallback.
        if (!snap) {
          snap = await storeCollection("transaksi").get();
        }
        if (token !== trendingLoadToken) return;

        const docs = [];
        snap.forEach(doc => docs.push({ id: doc.id, data: doc.data() || {} }));

        // Tentukan tanggal transaksi yang dipakai:
        // 1. Utamakan hari ini jika ada transaksi.
        // 2. Jika hari ini kosong, otomatis pakai tanggal transaksi TERAKHIR.
        // Jadi kartu tidak blank walaupun hari ini/kemarin belum ada penjualan.
        const getDateKey = (data) => {
          let d = null;

          if (data.waktuTimestamp) {
            try {
              if (typeof data.waktuTimestamp.toDate === 'function') {
                d = data.waktuTimestamp.toDate();
              } else if (data.waktuTimestamp.seconds) {
                d = new Date(Number(data.waktuTimestamp.seconds) * 1000);
              }
            } catch (_) {}
          }

          if (!d && data.waktu) {
            const parsed = new Date(data.waktu);
            if (!isNaN(parsed.getTime())) d = parsed;
          }

          if (!d) return null;

          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        const dateKeys = docs.map(x => getDateKey(x.data)).filter(Boolean);
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        let targetDateKey = null;
        if (dateKeys.includes(todayKey)) {
          targetDateKey = todayKey;
        } else if (dateKeys.length) {
          targetDateKey = dateKeys.sort().pop();
        }

        if (!targetDateKey) {
          // Tidak ada transaksi sama sekali.
          renderTrending([]);
          return;
        }

        const itemCounts = {};
        const byName = {};

        Object.keys(databaseProduk).forEach(code => {
          const nama = String(databaseProduk[code]?.nama || '').trim().toLowerCase();
          if (nama) byName[nama] = code;
        });

        docs.forEach(({data}) => {
          if (getDateKey(data) !== targetDateKey || !Array.isArray(data.items)) return;

          data.items.forEach(it => {
            const qty = Number(it.qty) || 0;
            if (qty <= 0) return;

            const code = String(it.code || '').trim();
            if (code && databaseProduk[code]) {
              itemCounts[code] = (itemCounts[code] || 0) + qty;
              return;
            }

            // Data transaksi lama kadang punya code berbeda dari ID produk.
            // Cocokkan berdasarkan nama produk.
            const nama = String(it.nama || '').trim().toLowerCase();
            const matchedCode = byName[nama];
            if (matchedCode) {
              itemCounts[matchedCode] = (itemCounts[matchedCode] || 0) + qty;
            }
          });
        });

        const top = Object.keys(itemCounts)
          .sort((a,b) => itemCounts[b] - itemCounts[a])
          .slice(0, limit);

        renderTrending(top);

        // Simpan info tanggal yang sedang ditampilkan agar mudah dicek/debug.
        window.__sedangLarisDateKey = targetDateKey;
        window.__sedangLarisIsToday = targetDateKey === todayKey;
      } catch (err) {
        console.error('Gagal memuat Sedang Laris:', err);

        // Jangan menghapus tampilan lama ketika ada error jaringan/query.
        // Jika belum pernah ada tampilan sama sekali, baru sembunyikan section.
        if (!document.querySelector('#trending-container .trending-card')) {
          renderTrending([]);
        }
      }
    }


    // NO. 2 only: seamless auto-scroll for the "Stok Rumah Habis" carousel.
    // Because the track contains an exact duplicate, reset by half the track
    // width instead of jumping back to scrollLeft=0.
    function setupSeamlessReorderScroll(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      let isInteracting = false;
      let timeoutId = null;
      let lastTime = performance.now();

      const step = (now) => {
        const dt = Math.min(now - lastTime, 50);
        lastTime = now;

        if (!animasiNavigasiDeveloperAktif()) {
          requestAnimationFrame(step);
          return;
        }

        if (!isInteracting && container.scrollWidth > container.clientWidth) {
          const track = container.querySelector(".auto-scroll-track");
          const loopWidth = track ? track.scrollWidth / 2 : 0;

          // Slow, frame-rate-independent movement.
          container.scrollLeft += 0.026 * dt;

          // Seamless loop: the second copy is identical to the first.
          if (loopWidth > 0 && container.scrollLeft >= loopWidth) {
            container.scrollLeft -= loopWidth;
          }
        }

        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);

      const pause = () => {
        isInteracting = true;
        clearTimeout(timeoutId);
      };

      const resume = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { isInteracting = false; }, 2200);
      };

      container.addEventListener("touchstart", pause, { passive: true });
      container.addEventListener("touchend", resume, { passive: true });
      container.addEventListener("touchcancel", resume, { passive: true });
      container.addEventListener("mousedown", pause);
      container.addEventListener("mouseup", resume);
      container.addEventListener("mouseleave", resume);
    }

    function setupAutoScrollInteraction(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      let scrollSpeed = 0.8;
      let isInteracting = false;
      let timeoutId = null;

      const scrollInterval = setInterval(() => {
        if (!animasiNavigasiDeveloperAktif()) return;
        if (!isInteracting) {
          container.scrollLeft += scrollSpeed;
          if (container.scrollLeft >= (container.scrollWidth - container.clientWidth - 2)) {
            container.scrollLeft = 0;
          }
        }
      }, 30);

      container.addEventListener('touchstart', () => { isInteracting = true; clearTimeout(timeoutId); });
      container.addEventListener('touchend', () => {
        timeoutId = setTimeout(() => { isInteracting = false; }, 2500);
      });
      container.addEventListener('mousedown', () => { isInteracting = true; clearTimeout(timeoutId); });
      container.addEventListener('mouseup', () => {
        timeoutId = setTimeout(() => { isInteracting = false; }, 2500);
      });
    }

    function renderTrending(codes) {
      const container = document.getElementById("trending-container"); const wrapper = document.getElementById("trending-section-wrapper"); container.innerHTML = "";
      if(codes.length === 0) { wrapper.style.display = "none"; return; }
      
      let itemsHtml = "";
      codes.forEach(code => {
        let p = databaseProduk[code]; let fotoSrc = p.foto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/></svg>";
        let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs");
        let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
        if ((satuan.toLowerCase() === 'kg' || satuan.toLowerCase() === 'kilogram')) hargaParsed *= 10;
        
        itemsHtml += `
          <div onclick="openProductDetail('${code}')" class="trending-card">
            <img src="${fotoSrc}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.3);">
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: bold; font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">${p.nama}</div>
              <div style="font-size: 0.68rem; color: rgba(255,255,255,0.8); margin-bottom: 2px;">Sisa: ${p.stok} ${satuan}</div>
              <div style="font-size: 0.78rem; color: #fde047; font-weight: bold;">Rp ${hargaParsed.toLocaleString('id-ID')}</div>
            </div>
          </div>`;
      });
      container.innerHTML = `<div class="auto-scroll-track">${itemsHtml}${itemsHtml}</div>`;
      setupAutoScrollInteraction("trending-container");
      perbaruiTampilanKategori(); 
    }

    function tambahKeKeranjangCepat(code) {
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

    function refreshKatalogPelanggan() {
      const container = document.getElementById("pos-catalog-container"); const cardWrapper = document.getElementById("pos-card-wrapper");
      if (!container || !cardWrapper) return;
      if (!['list','grid','card'].includes(catalogViewMode)) catalogViewMode = 'grid';
      container.className = catalogViewMode === 'list' ? "product-catalog-list" : (catalogViewMode === 'card' ? "product-catalog-card" : "product-catalog-grid");
      updateCatalogViewButtons();
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
      // TAHAP 1: hanya card katalog yang dibatasi. databaseProduk tetap lengkap untuk seluruh dashboard.
      let paginatedItems = matchedProducts.slice(0, catalogVisibleCount);
      container.innerHTML = "";

      const loadSentinel = document.getElementById('catalog-load-sentinel');
      cardWrapper.dataset.catalogTotal = String(matchedProducts.length);
      if (loadSentinel) loadSentinel.style.display = (catalogVisibleCount < matchedProducts.length) ? 'block' : 'none';

      if (matchedProducts.length === 0) { container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 15px; font-size: 0.8rem;">Produk tidak ditemukan untuk kategori ini.</div>`; document.getElementById("pos-page-indicator").innerText = `1/1`; if (loadSentinel) loadSentinel.style.display='none'; return; }

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
                  <img class="modern-card-product" src="${fotoSrc}" alt="${p.nama}" loading="lazy" onload="makeModernProductTransparent(this)">
                  <div class="modern-card-platform" aria-hidden="true">
                    <div class="modern-card-base"></div>
                    <div class="modern-card-rim"></div>
                    <div class="modern-card-surface"></div>
                    <div class="modern-card-highlight"></div>
                  </div>
                  <button class="btn-quick-cart-icon modern-card-cart-btn" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">🛒</button>
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
                  <img src="${fotoSrc}" alt="${p.nama}" loading="lazy">
                  <button class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">🛒</button>
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
                  <button class="btn-quick-cart-icon modern-cart-btn" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">🛒</button>
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
                  <button class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" title="Beli">🛒</button>
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
                  <button class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" style="position: static; width: 24px; height: 24px; font-size: 0.7rem;">🛒</button>
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
                  <button class="btn-quick-cart-icon" onclick="event.stopPropagation(); tambahKeKeranjangCepat('${code}')" style="position:static; width:24px; height:24px; font-size:.7rem;">🛒</button>
                </div>
              </div>`;
          }
        }
      }); document.getElementById("pos-page-indicator").innerText = `${Math.min(catalogVisibleCount, matchedProducts.length)}/${matchedProducts.length}`;
    }

    // Pagination lama tidak lagi mengubah sumber data. Tahap berikutnya akan menggantinya dengan infinite scroll.
    function ubahHalamanPos(d) { return; }

    function filterKatalogPelanggan(v) {
      currentPosPage = 1;
      // Saat filter/kategori berubah, mulai lagi dari 6 card pertama yang cocok.
      catalogVisibleCount = CATALOG_INITIAL_VISIBLE;
      refreshKatalogPelanggan();
    }

    // TAHAP 2: lazy rendering + infinite scroll.
    // DatabaseProduk tetap penuh. Sentinel dipakai agar tidak bergantung
    // pada window.scroll atau jenis container scroll yang dipakai halaman.
    let catalogScrollLoading = false;
    let catalogLoadObserver = null;

    function loadNextCatalogBatch() {
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

    function setupCatalogInfiniteScroll() {
      const sentinel = document.getElementById('catalog-load-sentinel');
      if (!sentinel || !('IntersectionObserver' in window)) return;
      if (catalogLoadObserver) catalogLoadObserver.disconnect();

      catalogLoadObserver = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) loadNextCatalogBatch();
      }, { root: null, rootMargin: '500px 0px 500px 0px', threshold: 0 });
      catalogLoadObserver.observe(sentinel);
    }

    // Fallback tambahan untuk browser/scroll container yang tidak memicu
    // observer secara konsisten. Capture=true menangkap scroll dari elemen anak.
    function handleCatalogInfiniteScroll() {
      if (catalogScrollLoading) return;
      const sentinel = document.getElementById('catalog-load-sentinel');
      if (!sentinel || sentinel.style.display === 'none') return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 500) loadNextCatalogBatch();
    }

    window.addEventListener('scroll', handleCatalogInfiniteScroll, { passive: true });
    document.addEventListener('scroll', handleCatalogInfiniteScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleCatalogInfiniteScroll, { passive: true });
    window.addEventListener('load', setupCatalogInfiniteScroll, { once: true });

    // Assistant AI dari welcome gateway.
    window.addEventListener('load', () => {
      let openAI = false;
      try {
        openAI = sessionStorage.getItem('kasirquh_open_ai_from_welcome') === '1';
        if (openAI) sessionStorage.removeItem('kasirquh_open_ai_from_welcome');
      } catch (e) {}
      if (!openAI) return;
      setTimeout(() => {
        try { toggleAIChatModal(); } catch (e) { console.warn('Gagal membuka Assistant AI dari welcome:', e); }
      }, 900);
    }, { once: true });
    setTimeout(setupCatalogInfiniteScroll, 0);
