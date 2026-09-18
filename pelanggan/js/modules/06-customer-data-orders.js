function muatDataPelangganRealtime() {
      storeCollection("pelanggan").where("phone", "==", currentCustomerPhone).onSnapshot((snapshot) => {
        const container = document.getElementById("customer-notes-container");
        container.innerHTML = "";
        snapshot.forEach((doc) => {
          let data = doc.data();
          currentCustomerDocId = doc.id;
          currentCustomerName = data.nama || 'Pelanggan';
          customerSavedRecipes = data.savedRecipes || [];
          renderRecipeCards();

          document.getElementById("profile-name").innerText = currentCustomerName;
          document.getElementById("profile-phone").innerText = data.phone || "-";
          
          if (data.catatan && data.catatan.length > 0) {
            data.catatan.forEach(note => {
              container.innerHTML += `<div style="border-bottom: 1px dashed var(--border-color); padding: 4px 0; font-size: 0.78rem;"><div style="color:var(--text-color);"><b>[${note.jenis}]</b> ${note.keterangan}</div><div style="font-size: 0.68rem; color: var(--text-muted);">${note.waktu}</div></div>`;
            });
          } else {
            container.innerHTML = `<div class="empty-state" style="font-size: 0.78rem;">Belum ada catatan atau tagihan.</div>`;
          }
        });
      });
    }
    
    function renderQuickReorder(orders) {
      const container = document.getElementById("reorder-container"); const wrapper = document.getElementById("reorder-section-wrapper"); container.innerHTML = ""; let recentCodes = new Set(); orders.forEach(trx => { if(trx.items) trx.items.forEach(it => { if(it.code) recentCodes.add(it.code); }); });
      let renderedCount = 0; let itemsHtml = ""; 
      recentCodes.forEach(code => { 
        let p = databaseProduk[code]; 
        const stokRumahCfg = window.__stokRumahConfig || {enabled:true, limit:5};
        const stokRumahLimit = Math.min(20, Math.max(1, parseInt(stokRumahCfg.limit,10) || 5));
        if(stokRumahCfg.enabled !== false && p && (p.stok || 0) > 0 && renderedCount < stokRumahLimit) { 
          let fotoSrc = p.foto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/></svg>"; 
          let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs"); 
          let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); 
          let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0; 
          if ((satuan.toLowerCase() === 'kg' || satuan.toLowerCase() === 'kilogram')) hargaParsed *= 10; 
          
          itemsHtml += `<div class="reorder-card" onclick="openProductDetail('${code}')"><img src="${fotoSrc}" style="width: 100%; height: 55px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3);"><div style="font-size: 0.68rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">${p.nama}</div><div style="font-size: 0.68rem; color: #fde047; font-weight: bold;">Rp ${hargaParsed.toLocaleString('id-ID')}</div></div>`; 
          renderedCount++; 
        } 
      });
      
      if(renderedCount > 0) {
        container.innerHTML = `<div class="auto-scroll-track">${itemsHtml}${itemsHtml}</div>`;
        setupSeamlessReorderScroll("reorder-container");
      }

      if(renderedCount > 0 && activeKategoriPelanggan === 'Home' && document.getElementById('belanja').classList.contains('active')) { wrapper.style.display = "block"; } else { wrapper.style.display = "none"; }
    }

    function muatRiwayatPesananOnlinePelanggan() { 
      storeCollection("transaksi").where("customerPhone", "==", currentCustomerPhone).onSnapshot((snapshot) => { 
        const container = document.getElementById("customer-online-orders-container"); 
        if (!container) return; 
        container.innerHTML = ""; 
        if (snapshot.empty) { 
          container.innerHTML = `<div class="empty-state" style="font-size: 0.78rem;">Belum ada riwayat pesanan online.</div>`; 
          lastFetchedOrders = [];
          renderQuickReorder([]); 
          return; 
        } 
        let orders = []; 
        snapshot.forEach(doc => { orders.push({ id: doc.id, ...doc.data() }); }); 
        orders.sort((a, b) => { 
          let timeA = a.waktuTimestamp?.toMillis ? a.waktuTimestamp.toMillis() : 0; 
          let timeB = b.waktuTimestamp?.toMillis ? b.waktuTimestamp.toMillis() : 0; 
          return timeB - timeA; 
        }); 
        lastFetchedOrders = orders;
        renderQuickReorder(orders); 
        orders.forEach(trx => { 
          let statusLabel = trx.statusPesanan || "Menunggu Diproses"; 
          let s_lower = statusLabel.toLowerCase(); 
          let step = 1; 
          if(s_lower.includes("siap") || s_lower.includes("proses")) step = 2; 
          else if(s_lower.includes("kirim") || s_lower.includes("jalan")) step = 3; 
          else if(s_lower.includes("selesai")) step = 4; 
          let timelineHtml = `<div class="order-timeline"><div class="timeline-step ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 1 ? '✓' : '1'}</div><div class="timeline-text">Menunggu</div></div><div class="timeline-step ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 2 ? '✓' : '2'}</div><div class="timeline-text">Dikemas</div></div><div class="timeline-step ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 3 ? '✓' : '3'}</div><div class="timeline-text">Dikirim</div></div><div class="timeline-step ${step >= 4 ? 'completed' : ''}"><div class="timeline-icon">${step >= 4 ? '✓' : '4'}</div><div class="timeline-text">Selesai</div></div></div>`; 
          let itemsHtml = ""; 
          if (trx.items && trx.items.length > 0) { 
            itemsHtml = `<div style="margin: 4px 0; font-size: 0.72rem; background: var(--input-bg); padding: 6px; border-radius: 6px; color:var(--text-color);"><strong>Rincian Barang:</strong><ul style="margin: 2px 0 0 12px; padding: 0;">`; 
            trx.items.forEach(it => { itemsHtml += `<li>${it.nama} (${it.qty}x)</li>`; }); 
            itemsHtml += `</ul></div>`; 
          } 
          container.innerHTML += `<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; margin-bottom: 8px; background: var(--card-bg); box-shadow: 0 1px 4px rgba(0,0,0,0.05);"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;"><span style="font-size: 0.68rem; color: var(--text-muted);">🗓️ ${trx.waktu || '-'}</span><span style="background: ${step===4 ? '#16a34a' : (step===1 ? '#ef4444' : '#d97706')}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.62rem; font-weight: bold;">${statusLabel}</span></div>${timelineHtml}<div style="font-size: 0.75rem; font-weight: 600; color: #2563eb;">Metode: ${trx.metode || '-'}</div>${itemsHtml}<div style="font-size: 0.82rem; font-weight: 800; color: #16a34a; text-align: right;">Total: Rp ${(trx.total || 0).toLocaleString('id-ID')}</div></div>`; 
        }); 
      }); 
    }

    function simpanProfilPelanggan() { const nama = document.getElementById("setting-cust-name").value.trim(); const alamat = document.getElementById("setting-cust-address").value.trim(); if (!nama) return alert("Nama wajib diisi!"); storeCollection("pelanggan").where("phone", "==", currentCustomerPhone).get().then((snap) => { if (!snap.empty) { storeCollection("pelanggan").doc(snap.docs[0].id).update({ nama, alamat }).then(() => alert("Profil diperbarui!")).catch(err => alert("Gagal memperbarui: " + err.message)); } }).catch(err => alert("Terjadi kesalahan: " + err.message)); }
    async function kirimPesanKeAI() { let inputEl = document.getElementById("ai-chat-input"); let msgContainer = document.getElementById("ai-chat-messages"); let prompt = inputEl.value.trim(); if (!prompt) return; msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; align-self: flex-end; background: #7c3aed; color: white;">${escapeHtml(prompt)}</div>`; inputEl.value = ""; msgContainer.scrollTop = msgContainer.scrollHeight; let loadingId = "loading-" + Date.now(); msgContainer.innerHTML += `<div id="${loadingId}" style="align-self: flex-start; background: var(--input-bg); color: var(--text-muted); padding: 6px 10px; border-radius: 8px; font-size: 0.78rem;">Sedang mengetik...</div>`; msgContainer.scrollTop = msgContainer.scrollHeight; try { let daftarProdukText = ""; let keywordLower = prompt.toLowerCase(); let isAskingProduct = ["stok", "harga", "jual", "ada", "beli", "minta", "berapa", "cari", "menu", "list", "barang", "toko", "punya"].some(kw => keywordLower.includes(kw)); let matchedProducts = []; for (let code in databaseProduk) { let p = databaseProduk[code]; let pNamaLower = p.nama.toLowerCase(); let words = pNamaLower.split(' ').filter(w => w.length > 2); if (keywordLower.includes(pNamaLower) || words.some(w => keywordLower.includes(w))) matchedProducts.push(p); } if (isAskingProduct || matchedProducts.length > 0) { let targetList = matchedProducts.length > 0 ? matchedProducts.slice(0, 3) : Object.values(databaseProduk).slice(0, 3); targetList.forEach(p => { let sat = (p.satuan || 'Pcs').toLowerCase(); let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); if (sat === 'kg' || sat === 'kilogram') { valHarga = p.hargaRtg || (valHarga * 10); sat = 'kg'; } else if (sat === 'rtg') sat = 'pcs'; else sat = p.satuan || 'Pcs'; daftarProdukText += `- ${p.nama}: Rp ${valHarga.toLocaleString('id-ID')}, Stok: ${p.stok || 0} ${sat}\n`; }); } else { daftarProdukText = "Tidak ada produk dilampirkan (obrolan santai)."; } let response = await fetch('/api/tanya', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt, daftarProduk: daftarProdukText, namaToko: pengaturanToko.nama || 'KasirQuh' }) }); let data = await response.json(); let aiReply = "Maaf, saya sedang kendala teknis. Silakan tanya ke admin."; if (data.reply) aiReply = data.reply.split('\n').map(l => l.trim()).join('\n').trim(); else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) aiReply = data.candidates[0].content.parts[0].text.split('\n').map(l => l.trim()).join('\n').trim(); let audioUrl = null; if (isAiSoundOn) { const cleanText = aiReply.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(); try { const ttsResponse = await fetch(`/api/tts?text=${encodeURIComponent(cleanText)}`); if (ttsResponse.ok) audioUrl = URL.createObjectURL(await ttsResponse.blob()); } catch (e) { console.error(e); } } document.getElementById(loadingId)?.remove(); msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; align-self: flex-start; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color); white-space: pre-line;">${escapeHtml(aiReply)}</div>`; msgContainer.scrollTop = msgContainer.scrollHeight; if (audioUrl) { const audio = new Audio(audioUrl); audio.play(); } } catch (err) { document.getElementById(loadingId)?.remove(); msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; align-self: flex-start; background: #fee2e2; color: #dc2626;">Gagal terhubung ke AI.</div>`; } }
    function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/&lt;*</g, "&lt;").replace(/>/g, "&gt;"); }
    function toggleOpsiDeveloper() {
      const panel = document.getElementById('developer-options-panel');
      const btn = document.getElementById('Opsi Developer');
      if (!panel || !btn) return;
      const akanBuka = panel.style.display === 'none' || !panel.style.display;

      // Update tombol lebih dulu agar tap terasa instan, lalu lakukan reflow berat
      // setelah frame berikutnya. Containment mencegah perubahan panel merambat
      // menghitung ulang seluruh halaman katalog.
      btn.setAttribute('aria-expanded', String(akanBuka));
      btn.innerHTML = akanBuka ? '🛠️ Tutup Opsi Developer' : '🛠️ Opsi Developer';
      requestAnimationFrame(() => {
        panel.style.display = akanBuka ? 'block' : 'none';
      });
    }

    function animasiNavigasiDeveloperAktif() {
      return localStorage.getItem('cust_dev_nav_animation_v1') !== 'off';
    }

    function syncAnimasiNavigasiDeveloper() {
      const toggle = document.getElementById('developer-animation-toggle');
      const status = document.getElementById('developer-animation-status');
      const aktif = animasiNavigasiDeveloperAktif();
      if (toggle) toggle.checked = aktif;
      if (status) status.textContent = aktif ? 'Animasi navigasi & scroll: ON' : 'Animasi navigasi & scroll: OFF';
      document.documentElement.classList.toggle('dev-no-nav-animation', !aktif);
    }

    function toggleAnimasiNavigasiDeveloper(aktif) {
      localStorage.setItem('cust_dev_nav_animation_v1', aktif ? 'on' : 'off');
      syncAnimasiNavigasiDeveloper();
    }
    syncAnimasiNavigasiDeveloper();

    function bersihkanCacheTotal() { if (confirm("Bersihkan cache aplikasi?")) { if ('caches' in window) caches.keys().then((names) => { names.forEach((name) => { caches.delete(name); }); }); if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then((registrations) => { for(let r of registrations) r.unregister(); }); setTimeout(() => { window.location.reload(true); }, 500); } }
    async function hapusDataSitusPelanggan() {
      const ok = confirm("Hapus cookie & seluruh data situs aplikasi ini?\n\nYang akan dibersihkan: cookie yang dapat diakses JavaScript, localStorage, sessionStorage, IndexedDB, Cache Storage, dan service worker. Anda mungkin perlu masuk kembali.\n\nLanjutkan?");
      if (!ok) return;
      try {
        // Cookie yang dapat diakses JavaScript pada domain/path ini. Cookie HttpOnly tidak dapat dihapus oleh halaman web.
        const cookies = document.cookie ? document.cookie.split(";") : [];
        cookies.forEach(cookie => {
          const eq = cookie.indexOf("=");
          const name = (eq >= 0 ? cookie.slice(0, eq) : cookie).trim();
          if (!name) return;
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/";
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=" + location.pathname;
        });
        try { localStorage.clear(); } catch (_) {}
        try { sessionStorage.clear(); } catch (_) {}
        if (window.indexedDB) {
          if (indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all((dbs || []).map(db => db.name ? new Promise(resolve => { const req = indexedDB.deleteDatabase(db.name); req.onsuccess = req.onerror = req.onblocked = () => resolve(); }) : Promise.resolve()));
          }
        }
        if (window.caches) {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        }
        if (navigator.serviceWorker) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(r => r.unregister()));
        }
      } catch (err) {
        console.warn("Pembersihan data situs tidak sepenuhnya berhasil:", err);
      } finally {
        // Beri browser sedikit waktu menyelesaikan penghapusan sebelum memuat ulang.
        setTimeout(() => window.location.reload(), 350);
      }
    }
