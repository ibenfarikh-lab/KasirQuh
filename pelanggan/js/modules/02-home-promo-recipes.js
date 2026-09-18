const defaultRecipes = [
      { nama: "Sayur Sop Bening", desc: "Praktis, tinggal cemplung. Isian kol, wortel, bumbu kaldu.", keywords: ['kol', 'wortel', 'royco', 'bawang'] },
      { nama: "Nasi Goreng Dadakan", desc: "Bikin malam makin hangat. Butuh kecap, telur, bumbu instan.", keywords: ['kecap', 'telur', 'bumbu nasi goreng'] },
      { nama: "Tumis Kangkung Segar", desc: "Menu rumahan favorit. Kangkung hijau segar dan bumbu pilihan.", keywords: ['kangkung', 'bawang', 'cabe'] },
      { nama: "Mie Instan Telur", desc: "Andalan kala lapar melanda malam hari dengan tambahan telur.", keywords: ['mie instan', 'telur', 'sawi'] },
      { nama: "Es Teh Manis Segar", desc: "Pelepas dahaga di siang hari yang panas dan menyegarkan.", keywords: ['teh', 'gula', 'es'] }
    ];

    window.onload = function() {
      muatIdeMasakAdminPelanggan();
      applyThemePelanggan(localStorage.getItem('cust_theme_v13') || 'modern');
      initAndroidBackNavigation();
      updateCustomerGreeting(); setInterval(updateCustomerGreeting, 60000);
      const cachedStoreName = localStorage.getItem('cust_store_name_v13'); if (cachedStoreName) { document.getElementById('welcomeStoreName').innerText = cachedStoreName; document.getElementById('receipt-shop-name').innerText = cachedStoreName; if(document.getElementById('customer-home-store-name')) document.getElementById('customer-home-store-name').innerText = cachedStoreName; }
      initChatRumpiListener();
      renderRecipeCards();
      if (currentCustomerPhone) {
        document.getElementById('welcomeScreen').style.display = 'none'; document.getElementById('customerLoginModal').style.display = 'none';
        muatDataPelangganRealtime(); muatRiwayatPesananOnlinePelanggan(); initCustomerChatListener(); periksaCheckinHarian(); tampilkanKoinDiProfil();
      } else { if (isStandalone) { document.getElementById('customerLoginModal').style.display = 'flex'; gantiFormAuth('login'); } }
      initFirebaseListeners();
      initPromoTokoPelanggan();
      initCustomerHomeInfoListener();
    };

    function updateCustomerGreeting() {
      const el = document.getElementById('customer-home-greeting');
      if (!el) return;
      const hour = Number(new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date()));
      const greeting = hour >= 5 && hour < 11 ? 'Selamat pagi 👋' : hour >= 11 && hour < 15 ? 'Selamat siang ☀️' : hour >= 15 && hour < 18 ? 'Selamat sore 🌤️' : 'Selamat malam 🌙';
      el.textContent = greeting;
    }

    function renderCustomerHomeInfo(cfg) {
      const running=document.getElementById('customer-home-running-text');
      const text = (cfg && typeof cfg.runningText === 'string' && cfg.runningText.trim())
        ? cfg.runningText.trim()
        : ((cfg && typeof cfg.infoText === 'string' && cfg.infoText.trim()) ? cfg.infoText.trim() : 'Selamat datang di toko kami 👋');
      if(running) {
        running.textContent = text;
        running.classList.remove('run-once');
        void running.offsetWidth;
        running.classList.add('run-once');
      }
    }

    function initCustomerHomeInfoListener() {
      storeCollection("pengaturan").doc('beranda_pelanggan_home').onSnapshot(snap => {
        const cfg=snap.exists ? snap.data() : {};
        renderCustomerHomeInfo(cfg);
      }, () => renderCustomerHomeInfo({}));
    }

    let promoTokoPelangganCfg = { enabled: false, codes: [] };

    let promoTokoPelangganIndex = 0;

    function getPromoTokoPelangganCodes() {
      return Array.isArray(promoTokoPelangganCfg.codes) ? promoTokoPelangganCfg.codes.filter(code => databaseProduk[code] && Number(databaseProduk[code].stok || 0) > 0) : [];
    }

    function renderPromoTokoPelanggan() {
      const banner = document.getElementById('promo-banner-section');
      const slider = document.getElementById('promo-toko-slider');
      const codes = getPromoTokoPelangganCodes();
      const active = promoTokoPelangganCfg.enabled !== false && codes.length > 0;
      if (banner) { banner.style.display = active ? 'flex' : 'none'; banner.setAttribute('aria-hidden', active ? 'false' : 'true'); }
      if (!slider) return;
      if (!active) { slider.innerHTML=''; promoTokoPelangganIndex=0; return; }
      if (promoTokoPelangganIndex >= codes.length) promoTokoPelangganIndex = 0;
      slider.innerHTML = '<div class="promo-toko-track">' + codes.map(code => {
        const p=databaseProduk[code];
        const raw=p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
        let harga=typeof raw==='number' ? raw : (parseInt(String(raw).replace(/[^0-9]/g,''),10)||0);
        const satuan=(p.satuan||'Pcs').toLowerCase();
        if(satuan==='kg'||satuan==='kilogram') harga*=10;
        const foto=p.foto||'';
        return `<div class="promo-detail">${foto ? `<img src="${escapeHtml(foto)}" alt="${escapeHtml(String(p.nama||'Produk promo'))}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}<div class="promo-detail-placeholder" style="${foto?'display:none;':''}">🎁</div><div class="promo-detail-name">${escapeHtml(String(p.nama||'Produk'))}</div><div class="promo-detail-price-label">Harga promo hari ini</div><div class="promo-detail-price">Rp ${harga.toLocaleString('id-ID')}</div><div class="promo-detail-stock">Tersedia: ${p.stok||0} ${escapeHtml(String(p.satuan||'Pcs'))}</div><button class="promo-detail-add" type="button" data-promo-code="${escapeHtml(String(code))}">+ Masukkan Keranjang</button></div>`;
      }).join('') + '</div>';
      slider.querySelectorAll('.promo-detail-add').forEach(btn => btn.addEventListener('click', () => beliPromoTokoPelanggan(btn.getAttribute('data-promo-code'))));
      updatePromoTokoSlider();
    }

    function updatePromoTokoSlider() {
      const track=document.querySelector('#promo-toko-slider .promo-toko-track');
      const codes=getPromoTokoPelangganCodes();
      if(track) track.style.transform=`translateX(-${promoTokoPelangganIndex*100}%)`;
      const counter=document.getElementById('promo-counter'); if(counter) counter.textContent=`${codes.length ? promoTokoPelangganIndex+1 : 1} / ${codes.length||1}`;
      const prev=document.getElementById('promo-prev-btn'), next=document.getElementById('promo-next-btn');
      if(prev) prev.disabled=promoTokoPelangganIndex<=0; if(next) next.disabled=promoTokoPelangganIndex>=codes.length-1;
    }

    function geserPromoTokoPelanggan(dir) {
      const codes=getPromoTokoPelangganCodes(); if(!codes.length) return;
      promoTokoPelangganIndex=Math.max(0,Math.min(codes.length-1,promoTokoPelangganIndex+dir)); updatePromoTokoSlider();
    }

    function initPromoTokoPelanggan() {
      try {
        const localCfg = JSON.parse(localStorage.getItem('admin_promo_toko_v1') || '{}');
        if (localCfg && Array.isArray(localCfg.codes)) promoTokoPelangganCfg = { enabled: localCfg.enabled !== false, codes: localCfg.codes };
      } catch(e) {}
      renderPromoTokoPelanggan();
      storeCollection("pengaturan").doc('beranda_pelanggan_promo').onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data() || {};
          promoTokoPelangganCfg = { enabled: data.enabled !== false, codes: Array.isArray(data.codes) ? data.codes : [] };
          localStorage.setItem('admin_promo_toko_v1', JSON.stringify(promoTokoPelangganCfg));
        } else {
          promoTokoPelangganCfg = { enabled: false, codes: [] };
        }
        renderPromoTokoPelanggan();
      }, err => {
        console.warn('Listener promo pelanggan gagal:', err);
        renderPromoTokoPelanggan();
      });
    }

    function bukaPromoTokoPelanggan() {
      appOpenModal('promoTokoModal');
      promoTokoPelangganIndex = 0;
      renderPromoTokoPelanggan();
      const modal = document.getElementById('promoTokoModal');
      const slider = document.getElementById('promo-toko-slider');
      if (slider && !slider.dataset.swipeReady) {
        let sx=0;
        slider.addEventListener('touchstart', e => { sx=e.touches[0].clientX; }, {passive:true});
        slider.addEventListener('touchend', e => { const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>45) geserPromoTokoPelanggan(dx<0?1:-1); }, {passive:true});
        slider.dataset.swipeReady='1';
      }
      if (modal) modal.classList.add('show');
    }

    function tutupPromoTokoPelanggan() {
      if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'promoTokoModal') { history.back(); return; }
      const modal = document.getElementById('promoTokoModal');
      if (modal) modal.classList.remove('show');
    }

    function beliPromoTokoPelanggan(code) {
      if (!databaseProduk[code]) return;
      tambahKeKeranjangDiamDiam(code);
      tutupPromoTokoPelanggan();
      renderCartPelanggan();
      showToast('🛒 Produk promo masuk ke keranjang!');
      openCartModal();
    }

    function periksaCheckinHarian() { if(!currentCustomerPhone) return; if(localStorage.getItem('admin_koin_warga_enabled') === 'false') return; let today = new Date().toLocaleDateString('id-ID'); let lastCheckin = localStorage.getItem('last_checkin_date_' + currentCustomerPhone); if(lastCheckin !== today) { const bonus=Math.max(0, parseInt(localStorage.getItem('admin_koin_warga_daily'),10) || 10); const p=document.querySelector('#dailyCheckinModal p'); if(p) p.innerText='Selamat! Kamu rajin buka aplikasi hari ini. Ini ' + bonus + ' Koin untukmu!'; setTimeout(() => { appOpenModal('dailyCheckinModal'); document.getElementById('dailyCheckinModal').style.display = 'flex'; }, 1500); } }
    function klaimKoinHarian() { let today = new Date().toLocaleDateString('id-ID'); localStorage.setItem('last_checkin_date_' + currentCustomerPhone, today); let bonus=Math.max(0, parseInt(localStorage.getItem('admin_koin_warga_daily'),10) || 10); let currentCoins = parseInt(localStorage.getItem('koin_warga_' + currentCustomerPhone)) || 0; localStorage.setItem('koin_warga_' + currentCustomerPhone, currentCoins + bonus); if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'dailyCheckinModal') history.back(); else document.getElementById('dailyCheckinModal').style.display = 'none'; showToast('🪙 Yey! ' + bonus + ' Koin berhasil ditambahkan ke dompetmu.'); playBeep(); tampilkanKoinDiProfil(); }
    function tampilkanKoinDiProfil() { let coins = localStorage.getItem('koin_warga_' + currentCustomerPhone) || 0; document.getElementById('profile-coins').innerText = coins; }

    window.__promoRenderHook = renderPromoTokoPelanggan;

    function beliPaketResepByKeywords(namaResep, keywords) {
      if(!isProductsLoaded) return alert("Tunggu katalog dimuat dulu ya kak.");
      let addedCount = 0;
      keywords.forEach(kw => { let foundCode = Object.keys(databaseProduk).find(code => databaseProduk[code].nama.toLowerCase().includes(kw)); if (foundCode) { tambahKeKeranjangDiamDiam(foundCode); addedCount++; } });
      if (addedCount > 0) { showToast(`🥘 Bahan ${namaResep} berhasil dimasukkan!`); renderCartPelanggan(); openCartModal(); } else { alert(`Maaf, bahan untuk ${namaResep} lagi kosong di toko.`); }
    }
    
    function bagikanResepKeywordsKeRumpi(namaResep, keywords) {
      if (!currentCustomerPhone) return alert("Silakan login terlebih dahulu untuk berbagi resep!");
      if(!isProductsLoaded) return alert("Tunggu katalog dimuat dulu ya kak.");
      let foundItemsText = "";
      keywords.forEach(kw => {
        let foundCode = Object.keys(databaseProduk).find(code => databaseProduk[code].nama.toLowerCase().includes(kw));
        if (foundCode) {
          let p = databaseProduk[foundCode];
          foundItemsText += `- ${p.nama}\n`;
        }
      });
      let pesanRumpi = `🍳 *Menu Resep dari ${currentCustomerName || 'Pelanggan'}*\nNama Menu: "${namaResep}"\nBahan-bahan:\n${foundItemsText || '- Sesuai paket resep'}`;
      let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');
      
      storeCollection("db_chat_rumpi").add({
        senderPhone: currentCustomerPhone,
        senderName: currentCustomerName || 'Pelanggan',
        pesan: pesanRumpi,
        waktu: nowStr,
        waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        showToast("📢 Resep berhasil dibagikan ke Chat Rumpi!");
        switchTabPelanggan('live-chat');
        switchSubTabLiveChat('rumpi');
      }).catch(err => {
        alert("Gagal membagikan: " + err.message);
      });
    }

    function beliPaketResepCustom(recipeObj) {
      if(!isProductsLoaded) return alert("Tunggu katalog dimuat dulu ya kak.");
      let addedCount = 0;
      if(recipeObj.items) {
        recipeObj.items.forEach(it => {
          let p = databaseProduk[it.code];
          if(p && (p.stok || 0) >= it.qty) {
            let satuan = (p.satuan || "").toLowerCase().trim();
            let isKg = (satuan === "kg" || satuan === "kilogram");
            let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
            let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
            let valModal = p.hargaModal !== undefined ? p.hargaModal : (p.modal || 0);
            let modalParsed = typeof valModal === 'number' ? valModal : parseInt(valModal.toString().replace(/[^0-9]/g, '')) || 0;
            if (isKg) { hargaParsed *= 10; modalParsed *= 10; }

            let item = cart.find(i => i.code === it.code);
            if (item) {
              item.qty += it.qty; item.qty = parseFloat(item.qty.toFixed(3)); item.subtotal = Math.round(item.qty * hargaParsed);
            } else {
              cart.push({ code: it.code, nama: p.nama, harga: hargaParsed, modal: modalParsed, qty: it.qty, subtotal: Math.round(it.qty * hargaParsed), foto: p.foto });
            }
            addedCount++;
          }
        });
      }
      if (addedCount > 0) { showToast(`🥘 Bahan ${recipeObj.nama} berhasil dimasukkan!`); renderCartPelanggan(); openCartModal(); } else { alert(`Maaf, bahan untuk ${recipeObj.nama} sedang kosong.`); }
    }

    function bagikanResepCustomKeRumpi(recipeObj) {
      if (!currentCustomerPhone) return alert("Silakan login terlebih dahulu untuk berbagi resep!");
      let total = 0;
      let itemListText = "";
      recipeObj.items.forEach(it => {
        let p = databaseProduk[it.code];
        if(p) {
          let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs");
          let isKg = satuan === 'kg' || satuan === 'kilogram';
          let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
          let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
          if (isKg) hargaParsed *= 10;
          total += it.qty * hargaParsed;
          itemListText += `- ${p.nama} (${it.qty} ${satuan})\n`;
        }
      });

      let pesanRumpi = `🍳 *Menu Racikan dari ${currentCustomerName || 'Pelanggan'}*\nNama Menu: "${recipeObj.nama}"\nBahan-bahan:\n${itemListText}Perkiraan Total: Rp ${Math.round(total).toLocaleString('id-ID')}`;
      let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');
      
      storeCollection("db_chat_rumpi").add({
        senderPhone: currentCustomerPhone,
        senderName: currentCustomerName || 'Pelanggan',
        pesan: pesanRumpi,
        waktu: nowStr,
        waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        showToast("📢 Resep berhasil dibagikan ke Chat Rumpi!");
        switchTabPelanggan('live-chat');
        switchSubTabLiveChat('rumpi');
      }).catch(err => {
        alert("Gagal membagikan: " + err.message);
      });
    }

    function tambahKeKeranjangDiamDiam(code) {
      let p = databaseProduk[code]; if (!p || (p.stok || 0) <= 0) return; let satuan = (p.satuan || "").toLowerCase().trim(); let qtyToAdd = (satuan === "kg" || satuan === "kilogram") ? 0.25 : 1;
      let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
      let valModal = p.hargaModal !== undefined ? p.hargaModal : (p.modal || 0); let modalParsed = typeof valModal === 'number' ? valModal : parseInt(valModal.toString().replace(/[^0-9]/g, '')) || 0;
      if (satuan === "kg" || satuan === "kilogram") { hargaParsed *= 10; modalParsed *= 10; }
      let item = cart.find(i => i.code === code);
      if (item) { if (item.qty + qtyToAdd <= p.stok) { item.qty += qtyToAdd; item.qty = parseFloat(item.qty.toFixed(3)); item.subtotal = Math.round(item.qty * hargaParsed); } } 
      else { if (qtyToAdd <= p.stok) { cart.push({ code, nama: p.nama, harga: hargaParsed, modal: modalParsed, qty: qtyToAdd, subtotal: Math.round(qtyToAdd * hargaParsed), foto: p.foto }); } }
    }

    async function muatIdeMasakAdminPelanggan() {
      try {
        const snap = await storeCollection("pengaturan").doc("beranda_pelanggan_resep").get();
        const data = snap.exists ? snap.data() : {};
        adminCustomerRecipesEnabled = data.enabled !== false;
        adminCustomerRecipes = Array.isArray(data.recipes) ? data.recipes : [];
      } catch(e) {
        adminCustomerRecipesEnabled = true;
        adminCustomerRecipes = [];
      }
      renderRecipeCards();
    }

    function renderRecipeCards() {
      const container = document.getElementById('recipe-scroll-container');
      if(!container) return;
      container.innerHTML = "";

      if (adminCustomerRecipesEnabled && adminCustomerRecipes.length) {
        adminCustomerRecipes.forEach(r => {
          const escName=escapeHtml(r.nama||'Menu Warga');
          const escDesc=escapeHtml(r.desc||'Ide masak pilihan toko.');
          const rJson=JSON.stringify(r).replace(/'/g,"&#39;");
          const foto=r.foto ? `<img src="${escapeHtml(r.foto)}" alt="" style="width:100%;height:62px;object-fit:cover;border-radius:7px;margin-bottom:5px;" onerror="this.style.display='none'">` : '';
          container.innerHTML += `<div class="recipe-card">${foto}<div><div style="font-weight:800;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">${escName}</div><div style="font-size:.65rem;opacity:.9;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.2;">${escDesc}</div></div><div style="display:flex;gap:4px;margin-top:auto;"><button class="recipe-btn-action" style="flex:1;" onclick='beliPaketResepCustom(${rJson})'>+ Masukkan Bahan</button><button class="recipe-btn-action" style="flex:0 0 30px;padding:5px 0;" title="Bagikan ke Rumpi" onclick='bagikanResepCustomKeRumpi(${rJson})'>📢</button></div></div>`;
        });
      }

      defaultRecipes.forEach(r => {
        let escName = escapeHtml(r.nama);
        let escDesc = escapeHtml(r.desc);
        let kwJson = JSON.stringify(r.keywords).replace(/"/g, '&quot;');
        container.innerHTML += `
          <div class="recipe-card">
            <div>
              <div style="font-weight: 800; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${escName}</div>
              <div style="font-size: 0.65rem; opacity: 0.9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2;">${escDesc}</div>
            </div>
            <div style="display: flex; gap: 4px; margin-top: auto;">
              <button class="recipe-btn-action" style="flex: 1;" onclick='beliPaketResepByKeywords("${escName}", ${kwJson})'>+ Masukkan Bahan</button>
              <button class="recipe-btn-action" style="flex: 0 0 30px; padding: 5px 0;" title="Bagikan ke Rumpi" onclick='bagikanResepKeywordsKeRumpi("${escName}", ${kwJson})'>📢</button>
            </div>
          </div>`;
      });

      customerSavedRecipes.forEach((sr, idx) => {
        let escName = escapeHtml(sr.nama);
        let srJson = JSON.stringify(sr).replace(/'/g, "&#39;");
        
        let itemNames = [];
        if(sr.items) {
          sr.items.forEach(it => {
            let p = databaseProduk[it.code];
            if(p) itemNames.push(p.nama);
          });
        }
        let descItemText = itemNames.length > 0 ? itemNames.join(', ') : 'Menu Racikan Toko';

        container.innerHTML += `
          <div class="recipe-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 4px; margin-bottom: 2px;">
                <div style="font-weight: 800; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">⭐ ${escName}</div>
                <div style="display: flex; gap: 4px; align-items: center;">
                  <button onclick="editSavedRecipe(${idx})" title="Edit Menu" style="background: rgba(255,255,255,0.25); border: none; color: #fde047; border-radius: 4px; width: 22px; height: 22px; cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">✏️</button>
                  <button onclick="hapusSavedRecipe(${idx})" title="Hapus" style="background: rgba(255,255,255,0.25); border: none; color: #fca5a5; border-radius: 4px; width: 22px; height: 22px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; font-weight: bold;">✕</button>
                </div>
              </div>
              <div style="font-size: 0.63rem; opacity: 0.9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2;">${escapeHtml(descItemText)}</div>
            </div>
            <div style="display: flex; gap: 4px; margin-top: auto;">
              <button class="recipe-btn-action" style="flex: 1;" onclick='beliPaketResepCustom(${srJson})'>+ Masukkan Bahan</button>
              <button class="recipe-btn-action" style="flex: 0 0 30px; padding: 5px 0;" title="Bagikan ke Rumpi" onclick='bagikanResepCustomKeRumpi(${srJson})'>📢</button>
            </div>
          </div>`;
      });

      container.innerHTML += `
        <div class="recipe-card" style="border: 1px dashed rgba(255,255,255,0.4);">
          <div>
            <div style="font-weight: 800; font-size: 0.85rem; margin-bottom: 2px;">Simpan Menu Sendiri 👩‍🍳</div>
            <div style="font-size: 0.65rem; opacity: 0.9; line-height: 1.2;">Pilih barang di keranjang, simpan menu langsung tanpa harus belanja!</div>
          </div>
          <div style="font-size: 0.63rem; opacity: 0.8; font-style: italic; text-align: center; margin-top: auto;">Tersimpan otomatis di database akunmu</div>
        </div>`;
    }

    function editSavedRecipe(index) {
      let sr = customerSavedRecipes[index];
      if (!sr) return;

      cart = [];
      sr.items.forEach(it => {
        let p = databaseProduk[it.code];
        if (p) {
          let satuan = (p.satuan || "").toLowerCase().trim();
          let isKg = (satuan === "kg" || satuan === "kilogram");
          let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0);
          let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0;
          let valModal = p.hargaModal !== undefined ? p.hargaModal : (p.modal || 0);
          let modalParsed = typeof valModal === 'number' ? valModal : parseInt(valModal.toString().replace(/[^0-9]/g, '')) || 0;
          if (isKg) { hargaParsed *= 10; modalParsed *= 10; }

          cart.push({
            code: it.code,
            nama: p.nama,
            harga: hargaParsed,
            modal: modalParsed,
            qty: it.qty,
            subtotal: Math.round(it.qty * hargaParsed),
            foto: p.foto
          });
        }
      });

      renderCartPelanggan();
      openCartModal();

      document.getElementById('cust-save-recipe-toggle').checked = true;
      toggleSaveRecipeOptions(true);
      document.getElementById('cust-save-recipe-name').value = sr.nama;

      customerSavedRecipes.splice(index, 1);
      if (currentCustomerDocId) {
        storeCollection("pelanggan").doc(currentCustomerDocId).update({
          savedRecipes: customerSavedRecipes
        }).then(() => {
          renderRecipeCards();
        });
      }

      showToast("Menu dimuat untuk diedit. Sesuaikan lalu simpan kembali!");
    }

    function hapusSavedRecipe(idx) {
      if (!currentCustomerDocId) return alert("Silakan login terlebih dahulu.");
      if (!confirm("Hapus menu resep tersimpan ini?")) return;
      
      let updatedRecipes = [...customerSavedRecipes];
      updatedRecipes.splice(idx, 1);

      storeCollection("pelanggan").doc(currentCustomerDocId).update({
        savedRecipes: updatedRecipes
      }).then(() => {
        customerSavedRecipes = updatedRecipes;
        renderRecipeCards();
        showToast("Menu kustom berhasil dihapus.");
      }).catch(err => {
        alert("Gagal menghapus: " + err.message);
      });
    }

    function toggleSaveRecipeOptions(isChecked) {
      document.getElementById('wrapper-save-recipe-fields').style.display = isChecked ? 'flex' : 'none';
    }

    function showToast(message, type = "success") { const toast = document.getElementById("toastNotification"); toast.innerText = message; toast.className = "toast show " + type; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000); }
    let sharedAudioCtx = null; function getSharedAudioContext() { if (!sharedAudioCtx) { sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } if (sharedAudioCtx.state === 'suspended') { sharedAudioCtx.resume(); } return sharedAudioCtx; }
    function playTone(freq, type = "sine") { try { const audioCtx = getSharedAudioContext(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type = type; osc.frequency.value = freq; gain.gain.value = 0.3; osc.start(); osc.stop(audioCtx.currentTime + 0.1); } catch (e) {} }
    function playBeep() { playTone(1000, "sine"); } function playBeepDown() { playTone(600, "triangle"); }
    function playCustomerNotificationSound() { playTone(800, "sine"); setTimeout(() => playTone(1000, "sine"), 150); }

    function applyThemePelanggan(theme) { const safeTheme = ['light', 'dark', 'modern'].includes(theme) ? theme : 'light'; document.body.setAttribute('data-theme', safeTheme); }
