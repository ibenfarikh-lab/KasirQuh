function gantiTemaPelanggan(theme) {
      const safeTheme = ['light', 'dark', 'modern'].includes(theme) ? theme : 'light';
      const previousTheme = localStorage.getItem('cust_theme_v13') || 'modern';
      localStorage.setItem('cust_theme_v13', safeTheme);
      applyThemePelanggan(safeTheme);
      if (previousTheme !== safeTheme) {
        window.location.reload();
      }
    }
    function updateCatalogViewButtons() {
      document.querySelectorAll('.catalog-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === catalogViewMode);
      });
    }
    function gantiViewModePelanggan(mode) {
      if (!['list','grid','card'].includes(mode)) mode = 'grid';
      catalogViewMode = mode;
      localStorage.setItem('cust_view_v13', mode);
      updateCatalogViewButtons();
      refreshKatalogPelanggan();
    }
    function toggleMenuModal() {
      const modal = document.getElementById('menuToggleModal');
      const isOpen = modal.classList.contains('show');
      if (!isOpen) { appOpenModal('menuToggleModal'); modal.classList.add('show'); }
      else if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'menuToggleModal') { history.back(); }
      else { modal.classList.remove('show'); }
    }

    function setModePencarianPelanggan(aktif) {
      const ids = ['category-container','reorder-section-wrapper','recipe-section-wrapper','trending-section-wrapper'];
      ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = aktif ? 'none' : ''; });
      const pos = document.querySelector('#belanja .pos-container');
      if (pos) pos.style.display = 'block';
    }

    function bukaKolomPencarian() {
      if (!appNavRestoring) appPushState({ search:true, modal:null });
      const searchContainer = document.getElementById("sticky-search-container");
      if (searchContainer) {
        searchContainer.style.display = "block";
        setModePencarianPelanggan(true);
        filterKatalogPelanggan("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => document.getElementById("inventory-search-input")?.focus(), 200);
      }
    }

    function tutupKolomPencarian() {
      if (!appNavRestoring && history.state?.__kasirquhState?.search) { history.back(); return; }
      const input = document.getElementById("inventory-search-input");
      const searchContainer = document.getElementById("sticky-search-container");
      if (input) input.value = "";
      if (searchContainer) searchContainer.style.display = "none";
      setModePencarianPelanggan(false);
      perbaruiTampilanKategori();
      filterKatalogPelanggan("");
    }

    function pilihKategoriPelanggan(kategori) {
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
    
    function perbaruiTampilanKategori() {
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

    function gantiFormAuth(type) { document.getElementById('formLoginContainer').style.display = type === 'login' ? 'block' : 'none'; document.getElementById('formRegisterContainer').style.display = type === 'register' ? 'block' : 'none'; }
    async function toggleAIChatModal() {
      const modal = document.getElementById('aiChatModal');
      const willOpen = !modal.classList.contains('show');
      if (willOpen) {
        appOpenModal('aiChatModal');
        modal.classList.add('show');
        if (isAiSoundOn) await putarSuaraSambutanAI();
      } else if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'aiChatModal') {
        history.back();
      } else {
        modal.classList.remove('show');
      }
    }

    async function putarSuaraSambutanAI() {
      if (!isAiSoundOn) return;
      const namaToko = (pengaturanToko && pengaturanToko.nama) ? pengaturanToko.nama : "KasirQuh";
      const teksSambutan = `HALOOOO BESTIE! WELCOME... di ${namaToko}! Toko serba ada paling hits, tempat nongkrong bumbu dapur lengkap, sayuran, kopi sachet biar gak ngantuk, sampe bahan masakan siap tempur pawone bestie! Kenalin kula asisten kece dari ${namaToko} siap baturi belanja makin gampang dan cepet. Mau saya bantuin apa nih? Mau ngobrol atau tanya-tanya dulu boleh banget!`;
      try {
        if (window._aiWelcomeAudio) {
          try { window._aiWelcomeAudio.pause(); } catch (e) {}
          try { URL.revokeObjectURL(window._aiWelcomeAudioUrl); } catch (e) {}
        }
        const ttsResponse = await fetch(`/api/tts?text=${encodeURIComponent(teksSambutan)}`);
        if (!ttsResponse.ok) throw new Error("TTS gagal");
        const audioUrl = URL.createObjectURL(await ttsResponse.blob());
        const audio = new Audio(audioUrl);
        window._aiWelcomeAudio = audio;
        window._aiWelcomeAudioUrl = audioUrl;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          window._aiWelcomeAudio = null;
          window._aiWelcomeAudioUrl = null;
        };
        await audio.play();
      } catch (err) {
        console.error("TTS sambutan AI:", err);
      }
    }

    function openProductDetail(code) {
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
    
    function closeProductDetail(skipHistory = false) {
      if (!skipHistory && !appNavRestoring && history.state?.__kasirquhState?.modal === 'productDetailModal') { history.back(); return; }
      const detailModal = document.getElementById('productDetailModal');
      detailModal.classList.remove('show');
      detailModal.classList.remove('modern-card-detail-mode');
    }

    function ubahQtyDetail(dir) {
      if(!currentDetailCode) return;
      let p = databaseProduk[currentDetailCode]; if(!p) return;
      let newQty = currentDetailQty + (dir * currentDetailStep);
      if(newQty < currentDetailStep) newQty = currentDetailStep;
      if(newQty > (p.stok || 0)) return showToast("Sisa stok hanya " + p.stok, "error");
      currentDetailQty = parseFloat(newQty.toFixed(3));
      document.getElementById('detail-qty-input').value = currentDetailQty;
    }

    function tambahDariDetail() {
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

    function tanyaAdminBarang() {
      if(!currentDetailCode) return;
      let p = databaseProduk[currentDetailCode];
      closeProductDetail(true);
      switchTabPelanggan('live-chat'); switchSubTabLiveChat('admin');
      let inputEl = document.getElementById("customer-chat-input");
      if(inputEl) { inputEl.value = `Halo admin, saya mau tanya soal barang ${p.nama}... `; setTimeout(() => inputEl.focus(), 500); }
    }

    function switchSubTabLiveChat(sub) {
      const btnAdmin = document.getElementById('subtab-btn-admin'); const btnRumpi = document.getElementById('subtab-btn-rumpi');
      const contentAdmin = document.getElementById('subtab-admin-content'); const contentRumpi = document.getElementById('subtab-rumpi-content');
      if (sub === 'admin') {
        btnAdmin.style.color = '#2563eb'; btnAdmin.style.borderBottomColor = '#2563eb'; btnRumpi.style.color = 'var(--text-muted)'; btnRumpi.style.borderBottomColor = 'transparent';
        contentAdmin.style.display = 'flex'; contentRumpi.style.display = 'none';
        if (currentCustomerPhone) storeCollection("chats").doc(currentCustomerPhone).update({ unreadCustomer: 0 }).catch(() => {});
      } else {
        btnRumpi.style.color = '#2563eb'; btnRumpi.style.borderBottomColor = '#2563eb'; btnAdmin.style.color = 'var(--text-muted)'; btnAdmin.style.borderBottomColor = 'transparent';
        contentRumpi.style.display = 'flex'; contentAdmin.style.display = 'none';
        unreadRumpiCust = 0; document.getElementById("badge-rumpi-subtab").style.display = "none"; document.getElementById("badge-livechat-cust").style.display = "none";
      }
    }

    let unreadRumpiCust = 0;
    function initChatRumpiListener() {
      let isInitialLoadRumpi = true; if (chatRumpiUnsubscribe) chatRumpiUnsubscribe();
      chatRumpiUnsubscribe = storeCollection("db_chat_rumpi").orderBy("waktuTimestamp", "asc").onSnapshot((snapshot) => {
          if (!isInitialLoadRumpi) { snapshot.docChanges().forEach((change) => { if (change.type === "added" && change.doc.data().senderPhone !== currentCustomerPhone) { playCustomerNotificationSound(); let isRumpiSubActive = document.getElementById('live-chat').classList.contains('active') && document.getElementById('subtab-rumpi-content').style.display !== 'none'; if (!isRumpiSubActive) { unreadRumpiCust++; let badgeSub = document.getElementById("badge-rumpi-subtab"); if (badgeSub) { badgeSub.innerText = unreadRumpiCust; badgeSub.style.display = "inline-block"; } let badgeMain = document.getElementById("badge-livechat-cust"); if (badgeMain) { badgeMain.innerText = unreadRumpiCust; badgeMain.style.display = "inline-block"; } } } }); }
          isInitialLoadRumpi = false; let msgContainer = document.getElementById("chat-rumpi-messages"); if (!msgContainer) return;
          msgContainer.innerHTML = snapshot.empty ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; margin-top: 15px;">Belum ada percakapan. Yuk mulai ngobrol, Kak!</div>` : "";
          snapshot.forEach(doc => { let m = doc.data(); let isMyMessage = m.senderPhone === currentCustomerPhone; let alignStyle = isMyMessage ? "align-self: flex-end; background: #2563eb; color: white;" : "align-self: flex-start; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color);"; msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; ${alignStyle}">${!isMyMessage ? `<div style="font-size: 0.65rem; font-weight: bold; color: #16a34a; margin-bottom: 2px;">${m.senderName || 'Warga Toko'}</div>` : ''}<div>${escapeHtml(m.pesan || '')}</div><div style="font-size: 0.58rem; opacity: 0.8; text-align: right; margin-top: 2px;">${m.waktu || ''}</div></div>`; });
          msgContainer.scrollTop = msgContainer.scrollHeight;
        });
    }

    function kirimPesanChatRumpi() { if (!currentCustomerPhone) return alert("Silakan login untuk ikut merumpikan!"); let inputEl = document.getElementById("chat-rumpi-input"); let pesan = inputEl.value.trim(); if (!pesan) return; let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID'); storeCollection("db_chat_rumpi").add({ senderPhone: currentCustomerPhone, senderName: currentCustomerName || 'Pelanggan', pesan: pesan, waktu: nowStr, waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { inputEl.value = ""; }).catch(err => { alert("Gagal mengirim pesan: " + err.message); }); }
    function initCustomerChatListener() { if (!currentCustomerPhone) return; storeCollection("chats").doc(currentCustomerPhone).onSnapshot((doc) => { if (doc.exists) { let unread = doc.data().unreadCustomer || 0; let badgeAdminSub = document.getElementById("badge-admin-subtab"); if (badgeAdminSub) { if (unread > 0) { badgeAdminSub.innerText = unread; badgeAdminSub.style.display = "inline-block"; } else { badgeAdminSub.style.display = "none"; } } } }); if (customerChatUnsubscribe) customerChatUnsubscribe(); let isInitialLoadChat = true; customerChatUnsubscribe = storeCollection("chats").doc(currentCustomerPhone).collection("messages").orderBy("waktuTimestamp", "asc").onSnapshot((snapshot) => { if (!isInitialLoadChat) { snapshot.docChanges().forEach((change) => { if (change.type === "added" && change.doc.data().pengirim === "admin") { playCustomerNotificationSound(); } }); } isInitialLoadChat = false; let msgContainer = document.getElementById("customer-chat-messages"); if (!msgContainer) return; msgContainer.innerHTML = snapshot.empty ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; margin-top: 15px;">Belum ada pesan. Sampaikan pertanyaan Anda ke toko!</div>` : ""; snapshot.forEach(doc => { let m = doc.data(); let isCustomer = m.pengirim === "customer"; let alignBubble = isCustomer ? "align-self: flex-end; background: #2563eb; color: white;" : "align-self: flex-start; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color);"; msgContainer.innerHTML += `<div style="max-width: 75%; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; ${alignBubble}"><div>${m.pesan}</div><div style="font-size: 0.58rem; opacity: 0.8; text-align: right; margin-top: 2px;">${m.waktu || ''}</div></div>`; }); msgContainer.scrollTop = msgContainer.scrollHeight; }); }
    function kirimPesanPelanggan() { if (!currentCustomerPhone) return alert("Silakan login terlebih dahulu!"); let inputEl = document.getElementById("customer-chat-input"); let pesan = inputEl.value.trim(); if (!pesan) return; let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID'); storeCollection("chats").doc(currentCustomerPhone).collection("messages").add({ pengirim: "customer", pesan: pesan, waktu: nowStr, waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { storeCollection("chats").doc(currentCustomerPhone).set({ customerNama: currentCustomerName, lastMessage: currentCustomerName + ": " + pesan, lastTimestamp: firebase.firestore.FieldValue.serverTimestamp(), unreadAdmin: firebase.firestore.FieldValue.increment(1) }, { merge: true }); inputEl.value = ""; }).catch(err => { alert("Gagal mengirim pesan: " + err.message); }); }

    function prosesLoginPelanggan(e) {
      e.preventDefault();
      const phone = document.getElementById('cust-login-phone').value.trim();
      const pass = document.getElementById('cust-login-pass').value.trim();
      if (!phone || !pass) return alert("Nomor WhatsApp dan Sandi wajib diisi!");

      storeCollection("pelanggan").where("phone", "==", phone).get().then((snapshot) => {
        if (snapshot.empty) {
          alert("Nomor WhatsApp belum terdaftar. Silakan daftar terlebih dahulu.");
        } else {
          let docData = snapshot.docs[0].data();
          
          if (docData.status === "pending" || docData.disetujui === false) {
            return alert("Akun Anda sedang menunggu persetujuan dari Admin toko. Silakan hubungi admin.");
          }

          if (pass === (docData.password || "user")) {
            localStorage.setItem('cust_phone_v13', phone);
            currentCustomerPhone = phone;
            currentCustomerName = docData.nama || 'Pelanggan';
            document.getElementById('customerLoginModal').style.display = 'none';
            // Refresh HANYA setelah tombol Masuk pada form login berhasil.
            // Tidak terkait dengan bottom navbar/menu.
            setTimeout(() => { window.location.reload(); }, 150);
            // Setelah login berhasil, tutup layar welcome secara langsung agar konten pelanggan terlihat.
            tutupWelcomeScreen();
            muatDataPelangganRealtime();
            muatRiwayatPesananOnlinePelanggan();
            initCustomerChatListener();
            refreshKatalogPelanggan();

            showToast("Berhasil Masuk! Selamat Berbelanja 🛒");
            periksaCheckinHarian();
            tampilkanKoinDiProfil();
            renderRecipeCards();
          } else {
            alert("Sandi salah..!!! Coba lagi, atau kontak Admin untuk memperbaharui!");
          }
        }
      }).catch(err => {
        alert("Terjadi kesalahan saat masuk: " + err.message);
      });
    }

    function prosesDaftarPelanggan(e) {
      e.preventDefault();
      const name = document.getElementById('cust-reg-name').value.trim();
      const phone = document.getElementById('cust-reg-phone').value.trim();
      const address = document.getElementById('cust-reg-address').value.trim();
      const pass = document.getElementById('cust-reg-pass').value.trim();

      if (!name || !phone || !address || !pass) return alert("Semua kolom wajib diisi!");

      storeCollection("pelanggan").where("phone", "==", phone).get().then((snapshot) => {
        if (!snapshot.empty) {
          alert("Nomor WhatsApp sudah terdaftar! Silakan langsung masuk.");
          gantiFormAuth('login');
        } else {
          storeCollection("pelanggan").add({
            nama: name,
            phone: phone,
            alamat: address,
            password: pass,
            status: "pending",
            catatan: [],
            savedRecipes: [],
            waktuDaftar: new Date().toLocaleString('id-ID')
          }).then(() => {
            alert("Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin toko sebelum dapat digunakan untuk masuk.");
            document.getElementById('cust-reg-name').value = '';
            document.getElementById('cust-reg-phone').value = '';
            document.getElementById('cust-reg-address').value = '';
            document.getElementById('cust-reg-pass').value = '';
            gantiFormAuth('login');
          }).catch((err) => {
            alert("Gagal mendaftar: " + err.message);
          });
        }
      }).catch(err => {
        alert("Terjadi kesalahan: " + err.message);
      });
    }

    function logoutPelanggan() { 
      if (confirm("Keluar dari sesi ini?")) { 
        localStorage.removeItem('cust_phone_v13'); 
        currentCustomerPhone = ''; 
        document.getElementById('customerLoginModal').style.display = 'flex'; 
        gantiFormAuth('login'); 
        window.location.href = './index.html'; 
      } 
    }

    function initFirebaseListeners() {
      storeCollection("pengaturan").doc("toko_v13").onSnapshot((doc) => { if (doc.exists) { pengaturanToko = doc.data(); const namaToko = pengaturanToko.nama || "KasirQuh"; localStorage.setItem('cust_store_name_v13', namaToko); document.getElementById('receipt-shop-name').innerText = namaToko; document.getElementById('receipt-shop-address').innerText = pengaturanToko.alamat || ""; if (document.getElementById('welcomeStoreName')) document.getElementById('welcomeStoreName').innerText = namaToko; if (document.getElementById('customer-home-store-name')) document.getElementById('customer-home-store-name').innerText = namaToko; } });
      storeCollection("produk").onSnapshot((snapshot) => { 
        databaseProduk = {}; 
        snapshot.forEach((doc) => { databaseProduk[doc.id] = doc.data(); }); 
        isProductsLoaded = true; 
        muatBarangLarisHariIni(); 
        perbaruiTampilanKategori(); 
        refreshKatalogPelanggan(); 
        if(window.__promoRenderHook) window.__promoRenderHook();
        renderPromoTokoPelanggan();
        if (lastFetchedOrders && lastFetchedOrders.length > 0) {
          renderQuickReorder(lastFetchedOrders);
        }
      });
      storeCollection("pengaturan").doc("beranda_pelanggan_laris").onSnapshot((doc) => {
        const cfg = doc.exists ? doc.data() : {enabled:true, limit:5};
        window.__sedangLarisConfig = { enabled: cfg.enabled !== false, limit: Math.min(20, Math.max(1, parseInt(cfg.limit,10) || 5)) };
        isTrendingConfigLoaded = true;
        muatBarangLarisHariIni();
      });
      // Listener pengaturan "Stok Rumah Habis" dari Admin > Beranda Pelanggan.
      // Jumlah kartu mengikuti konfigurasi Firebase yang disimpan Admin.
      storeCollection("pengaturan").doc("beranda_pelanggan_stok_rumah").onSnapshot((doc) => {
        const cfg = doc.exists ? doc.data() : {enabled:true, limit:5};
        window.__stokRumahConfig = { enabled: cfg.enabled !== false, limit: Math.min(20, Math.max(1, parseInt(cfg.limit,10) || 5)) };
        renderQuickReorder(lastFetchedOrders || []);
      }, (err) => {
        console.warn("Listener pengaturan Stok Rumah gagal:", err);
        renderQuickReorder(lastFetchedOrders || []);
      });

      // Listener transaksi untuk "Sedang Laris".
      // Jika hari ini belum ada transaksi, tampilkan data dari tanggal transaksi
      // terakhir yang tersedia. Begitu ada transaksi baru, kartu otomatis dihitung ulang.
      storeCollection("transaksi").onSnapshot((snapshot) => {
        window.__trendingTransactionsSnapshot = snapshot;
        muatBarangLarisHariIni();
      }, (err) => {
        console.warn("Listener transaksi Sedang Laris gagal:", err);
        // muatBarangLarisHariIni() tetap boleh mencoba query langsung sebagai fallback.
        muatBarangLarisHariIni();
      });
    }


    let homeFeatureTransitionTimer = null;
    function setHomeFeatureTransition(showHome) {
      const ids = ['reorder-section-wrapper','recipe-section-wrapper','trending-section-wrapper'];
      const catalog = document.querySelector('.home-catalog-transition');
      if (homeFeatureTransitionTimer) clearTimeout(homeFeatureTransitionTimer);

      if (!animasiNavigasiDeveloperAktif()) {
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          el.classList.remove('home-feature-closing');
          el.style.maxHeight = '';
          el.style.opacity = '';
          el.style.transform = '';
          el.style.display = showHome ? 'block' : 'none';
        });
        if (catalog) {
          catalog.classList.remove('catalog-lifting');
          catalog.classList.add('home-catalog-transition');
        }
        return;
      }

      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        if (!showHome) {
          if (getComputedStyle(el).display === 'none') {
            el.style.display = 'block';
          }
          // Mulai dari tinggi aktual agar penutupan benar-benar terlihat.
          el.style.maxHeight = el.scrollHeight + 'px';
          el.classList.remove('home-feature-closing');
          void el.offsetHeight;
          requestAnimationFrame(() => {
            el.classList.add('home-feature-closing');
          });
          el.addEventListener('transitionend', function(ev) {
            if (ev.propertyName !== 'max-height' || !el.classList.contains('home-feature-closing')) return;
            el.style.display = 'none';
          }, {once:true});
        } else {
          el.style.display = 'block';
          el.style.maxHeight = '0px';
          el.classList.add('home-feature-closing');
          void el.offsetHeight;
          requestAnimationFrame(() => {
            el.classList.remove('home-feature-closing');
            el.style.maxHeight = el.scrollHeight + 'px';
          });
        }
      });

      if (catalog) {
        catalog.classList.remove('catalog-lifting');
        void catalog.offsetHeight;
        if (!showHome) {
          // Saat panel-panel di atas mengempis, katalog ikut bergerak naik.
          requestAnimationFrame(() => catalog.classList.add('catalog-lifting'));
          homeFeatureTransitionTimer = setTimeout(() => catalog.classList.remove('catalog-lifting'), 760);
        } else {
          // Saat kembali ke Home, katalog turun sedikit lalu kembali ke posisi normal
          // bersamaan dengan panel Home yang membuka.
          catalog.classList.add('catalog-lifting');
          requestAnimationFrame(() => requestAnimationFrame(() => catalog.classList.remove('catalog-lifting')));
        }
      }
    }

    function switchTabPelanggan(tabId) {
      if (!appNavRestoring) {
        // Pergantian halaman/tab bukan history Back. Back hanya untuk elemen aktif.
        const cur = history.state && history.state.__kasirquhState;
        const nextState = Object.assign({}, appGetState(), { tab:tabId, category:tabId === 'belanja' ? (activeKategoriPelanggan || 'Home') : 'Home', search:false, modal:null, detailCode:null });
        const menuIsOpen = document.getElementById('menuToggleModal')?.classList.contains('show');
        if ((menuIsOpen && cur && cur.modal === 'menuToggleModal') || (cur && cur.modal === 'productDetailModal')) {
          history.replaceState({ __kasirquh:true, __kasirquhState:nextState }, '', location.href);
        }
      }
      const previousTab = document.querySelector('.tab-content.active')?.id;
      if (previousTab === 'belanja' && tabId !== 'belanja') setHomeFeatureTransition(false);
      document.querySelectorAll('.tab-content').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
      const activeEl = document.getElementById(tabId); if (activeEl) { activeEl.classList.add('active'); activeEl.style.display = tabId === 'live-chat' ? 'flex' : 'block'; }
      if (tabId === 'live-chat') { unreadRumpiCust = 0; document.getElementById("badge-rumpi-subtab").style.display = "none"; document.getElementById("badge-livechat-cust").style.display = "none"; }
      if (tabId === 'belanja' && activeKategoriPelanggan === 'Home') { if (animasiNavigasiDeveloperAktif()) setTimeout(() => setHomeFeatureTransition(true), 20); else setHomeFeatureTransition(true); }
      document.querySelectorAll('.popup-menu-btn').forEach(btn => btn.classList.remove('active-menu'));
      const activeBtnMap = { 'belanja': 'pop-btn-belanja', 'data-pelanggan': 'pop-btn-datapelanggan', 'live-chat': 'pop-btn-livechat', 'pengaturan': 'pop-btn-pengaturan' };
      if (activeBtnMap[tabId]) { document.getElementById(activeBtnMap[tabId])?.classList.add('active-menu'); }

      const displays = {
        'belanja': { title: "Belanja", pBox: "flex", fabCart: "flex", fabAi: "flex", cat: "flex" },
        'data-pelanggan': { title: "Data Pelanggan", pBox: "none", fabCart: "none", fabAi: "none", cat: "none" },
        'live-chat': { title: "Live Chat", pBox: "none", fabCart: "none", fabAi: "none", cat: "none" },
        'pengaturan': { title: "Pengaturan", pBox: "none", fabCart: "none", fabAi: "none", cat: "none" }
      };
      
      let d = displays[tabId];
      document.getElementById('bottom-bar-title').innerText = d.title; document.getElementById('pagination-box').style.display = d.pBox;
      if(document.getElementById('fab-cart-btn')) document.getElementById('fab-cart-btn').style.display = d.fabCart; if(document.getElementById('fab-ai-btn')) document.getElementById('fab-ai-btn').style.display = d.fabAi;
      const searchContainer = document.getElementById('sticky-search-container');
      const searchFab = document.getElementById('fab-search-btn');
      if (tabId === 'belanja') {
        if (searchFab) searchFab.style.display = 'flex';
      } else {
        if (searchContainer) searchContainer.style.display = 'none';
        if (searchFab) searchFab.style.display = 'none';
      }
      const catContainer = document.getElementById('category-container'); if(catContainer) catContainer.style.display = d.cat;

      if(tabId === 'belanja') { perbaruiTampilanKategori(); const pb=document.getElementById('promo-banner-section'); if(pb && pb.getAttribute('aria-hidden') === 'false' && activeKategoriPelanggan === 'Home') pb.style.display = 'flex'; }
      else { 
        const promoBanner = document.getElementById('promo-banner-section'); if (promoBanner) promoBanner.style.display = 'none';
        setHomeFeatureTransition(false);
      }

      if (tabId === 'pengaturan') { document.getElementById('setting-cust-theme').value = localStorage.getItem('cust_theme_v13') || 'modern'; document.getElementById('setting-cust-view').value = catalogViewMode; if (currentCustomerPhone) { storeCollection("pelanggan").where("phone", "==", currentCustomerPhone).get().then(snap => { if (!snap.empty) { let data = snap.docs[0].data(); document.getElementById('setting-cust-name').value = data.nama || ""; document.getElementById('setting-cust-phone').value = data.phone || ""; document.getElementById('setting-cust-address').value = data.alamat || ""; } }); } }
    }
