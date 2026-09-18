/* Extracted from admin/index.html inline script #2. */

    if (!window.firebase || !firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(window.KQ_APP_CONFIG.firebase);
    }
    const db = firebase.firestore();
    // Firebase Authentication: initialize once and expose the same auth instance to script.js
    // Data router/auth guard is owned by script.js so there is only ONE global definition.
    const auth = firebase.auth();


    let onlineOrdersDataCache = [];
    let activeOnlineTab = 'berlangsung';
    let editingOrderItemsTemp = [];
    let selectedChatPhone = null;
    let chatUnsubscribe = null;
    let adminChatPrevUnread = {};
    let adminPrivateUnreadTotal = 0;

    document.addEventListener("DOMContentLoaded", function() {
      initOnlineOrdersListener();
      initCustomerCardClickObserver();
      initAdminChatListener();
      initAdminRumpiNotificationListener();

      let savedAdminTone = localStorage.getItem('admin_ringtone_v13') || 'default';
      const adminRingtoneSelect = document.getElementById('setting-admin-ringtone-type');
      const adminUploadWrapper = document.getElementById('wrapper-upload-ringtone-admin');
      if (adminRingtoneSelect && adminUploadWrapper) {
        if (savedAdminTone === 'default') {
          adminRingtoneSelect.value = 'default';
          adminUploadWrapper.style.display = 'none';
        } else {
          adminRingtoneSelect.value = 'custom';
          adminUploadWrapper.style.display = 'block';
        }
      }
    });

    // --- DRAG FAB AI ADMIN ---
    let adminAiFabDragged = false;
    let adminAiFabPointerId = null;
    let adminAiFabStartX = 0;
    let adminAiFabStartY = 0;
    let adminAiFabStartLeft = 0;
    let adminAiFabStartTop = 0;

    function positionAdminAiChatBox() {
      const wrapper = document.getElementById('admin-ai-wrapper');
      const button = document.getElementById('ai-toggle-btn');
      const chatBox = document.getElementById('ai-chat-box');
      if (!wrapper || !button || !chatBox || chatBox.style.display === 'none') return;

      const rect = button.getBoundingClientRect();
      const gap = 8;
      const boxWidth = Math.min(320, Math.max(260, window.innerWidth - 16));
      const boxHeight = Math.min(380, Math.max(220, window.innerHeight - 16));

      chatBox.style.width = boxWidth + 'px';
      chatBox.style.height = boxHeight + 'px';

      let left = rect.right - boxWidth;
      let top = rect.bottom + gap;

      if (top + boxHeight > window.innerHeight - 8) {
        top = rect.top - boxHeight - gap;
      }

      left = Math.min(Math.max(left, 8), Math.max(8, window.innerWidth - boxWidth - 8));
      top = Math.min(Math.max(top, 8), Math.max(8, window.innerHeight - boxHeight - 8));

      chatBox.style.left = left + 'px';
      chatBox.style.top = top + 'px';
      chatBox.style.right = 'auto';
    }

    function initDraggableAdminAiFab() {
      const wrapper = document.getElementById('admin-ai-wrapper');
      const button = document.getElementById('ai-toggle-btn');
      if (!wrapper || !button) return;

      const saved = localStorage.getItem('admin_ai_fab_position_v1');
      if (saved) {
        try {
          const pos = JSON.parse(saved);
          const maxLeft = Math.max(0, window.innerWidth - button.offsetWidth);
          const maxTop = Math.max(0, window.innerHeight - button.offsetHeight);
          const left = Math.min(Math.max(Number(pos.left) || 0, 0), maxLeft);
          const top = Math.min(Math.max(Number(pos.top) || 0, 0), maxTop);
          wrapper.style.left = left + 'px';
          wrapper.style.top = top + 'px';
          wrapper.style.right = 'auto';
        } catch (e) {}
      }

      button.addEventListener('pointerdown', function(e) {
        if (e.button !== undefined && e.button !== 0) return;
        adminAiFabPointerId = e.pointerId;
        adminAiFabDragged = false;
        const rect = button.getBoundingClientRect();
        adminAiFabStartX = e.clientX;
        adminAiFabStartY = e.clientY;
        adminAiFabStartLeft = rect.left;
        adminAiFabStartTop = rect.top;
        try { button.setPointerCapture(e.pointerId); } catch (_) {}
      });

      button.addEventListener('pointermove', function(e) {
        if (adminAiFabPointerId !== e.pointerId) return;
        const dx = e.clientX - adminAiFabStartX;
        const dy = e.clientY - adminAiFabStartY;
        if (!adminAiFabDragged && Math.hypot(dx, dy) < 6) return;
        adminAiFabDragged = true;

        const maxLeft = Math.max(0, window.innerWidth - button.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - button.offsetHeight);
        const left = Math.min(Math.max(adminAiFabStartLeft + dx, 0), maxLeft);
        const top = Math.min(Math.max(adminAiFabStartTop + dy, 0), maxTop);

        wrapper.style.left = left + 'px';
        wrapper.style.top = top + 'px';
        wrapper.style.right = 'auto';

        // Jika panel AI sedang terbuka, ikutkan panel agar tetap terlihat.
        positionAdminAiChatBox();
      });

      button.addEventListener('pointerup', function(e) {
        if (adminAiFabPointerId !== e.pointerId) return;
        if (adminAiFabDragged) {
          const rect = button.getBoundingClientRect();
          localStorage.setItem('admin_ai_fab_position_v1', JSON.stringify({
            left: Math.round(rect.left),
            top: Math.round(rect.top)
          }));
        }
        adminAiFabPointerId = null;
      });

      button.addEventListener('pointercancel', function() {
        adminAiFabPointerId = null;
      });

      // Jangan membuka AI saat gerakan drag berakhir.
      button.addEventListener('click', function(e) {
        if (adminAiFabDragged) {
          e.preventDefault();
          e.stopImmediatePropagation();
          adminAiFabDragged = false;
        }
      }, true);

      window.addEventListener('resize', function() {
        const rect = button.getBoundingClientRect();
        const maxLeft = Math.max(0, window.innerWidth - button.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - button.offsetHeight);
        const left = Math.min(Math.max(rect.left, 0), maxLeft);
        const top = Math.min(Math.max(rect.top, 0), maxTop);
        wrapper.style.left = left + 'px';
        wrapper.style.top = top + 'px';
        wrapper.style.right = 'auto';
        localStorage.setItem('admin_ai_fab_position_v1', JSON.stringify({
          left: Math.round(left), top: Math.round(top)
        }));
        positionAdminAiChatBox();
      });
    }

    document.addEventListener('DOMContentLoaded', initDraggableAdminAiFab);

    // --- SCRIPT AI CO-PILOT ADMIN ---
    function toggleAdminAi() {
      const chatBox = document.getElementById('ai-chat-box');
      if (chatBox.style.display === 'none' || chatBox.style.display === '') {
        chatBox.style.display = 'flex';
        positionAdminAiChatBox();
      } else {
        chatBox.style.display = 'none';
      }
    }

    function handleAiKeyPress(event) {
      if (event.key === 'Enter') {
        sendAdminAiMessage();
      }
    }

    async function sendAdminAiMessage() {
      const inputField = document.getElementById('ai-user-input');
      const messageContainer = document.getElementById('ai-chat-messages');
      const text = inputField.value.trim();

      if (!text) return;

      messageContainer.innerHTML += `<div style="background: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-end;">${text}</div>`;
      inputField.value = '';
      messageContainer.scrollTop = messageContainer.scrollHeight;

      // Sama seperti AI pelanggan: kirim hanya produk yang relevan, maksimal 3.
      let daftarProdukText = '';
      const keywordLower = text.toLowerCase();
      const shoppingKeywords = ["stok", "harga", "jual", "ada", "beli", "minta", "berapa", "cari", "menu", "list", "barang", "toko", "punya"];
      const isAskingProduct = shoppingKeywords.some(kw => keywordLower.includes(kw));

      try {
        const produkList = Array.isArray(databaseProduk)
          ? databaseProduk
          : Object.values(databaseProduk || {});

        const matchedProducts = produkList.filter(p => {
          const namaProduk = String(p?.nama || '').toLowerCase();
          if (!namaProduk) return false;
          const kataNama = namaProduk.split(/\s+/).filter(k => k.length > 2);
          return keywordLower.includes(namaProduk) || kataNama.some(k => keywordLower.includes(k));
        });

        if (isAskingProduct || matchedProducts.length > 0) {
          const produkUntukAI = (matchedProducts.length > 0 ? matchedProducts : produkList).slice(0, 3);
          produkUntukAI.forEach(p => {
            let valHarga = Number(p?.hargaJual ?? p?.harga ?? 0);
            let sat = p?.satuan || 'Pcs';

            if (String(p?.satuan || '').toLowerCase() === 'kg' || String(p?.satuan || '').toLowerCase() === 'kilogram') {
              valHarga = Number(p?.hargaRtg ?? (valHarga * 10));
              sat = 'kg';
            } else if (String(p?.satuan || '').toLowerCase() === 'rtg') {
              sat = 'pcs';
            }

            daftarProdukText += `- ${p?.nama || 'Produk'}: Rp ${valHarga.toLocaleString('id-ID')}, Stok: ${p?.stok || 0} ${sat}\n`;
          });
        } else {
          daftarProdukText = 'Tidak ada produk yang dilampirkan (obrolan santai).';
        }
      } catch (e) {
        console.error('AI Admin: gagal menyiapkan data produk ringan:', e);
        daftarProdukText = 'Tidak ada produk yang dilampirkan (obrolan santai).';
      }

      let namaTokoVal = 'KasirQuh';
      try {
        if (typeof pengaturanToko !== 'undefined' && pengaturanToko.nama) {
          namaTokoVal = pengaturanToko.nama;
        }
      } catch (e) {}

      const loadingId = 'loading-' + Date.now();
      messageContainer.innerHTML += `<div id="${loadingId}" style="background: var(--input-bg, #e5e7eb); color: var(--text-color, #374151); padding: 8px 12px; border-radius: 8px; max-width: 85%;">Sedang mengetik...</div>`;
      messageContainer.scrollTop = messageContainer.scrollHeight;

      try {
        const response = await fetch('/api/admin-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            daftarProduk: daftarProdukText,
            namaToko: namaTokoVal
          })
        });

        const data = await response.json();

        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        if (response.ok) {
          messageContainer.innerHTML += `<div style="background: var(--input-bg, #e5e7eb); color: var(--text-color, #111827); padding: 8px 12px; border-radius: 8px; max-width: 85%; white-space: pre-line;">${data.reply}</div>`;
        } else {
          messageContainer.innerHTML += `<div style="background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 8px; max-width: 85%;">Error: ${data.error || data.reply || 'Terjadi kendala.'}</div>`;
        }
        messageContainer.scrollTop = messageContainer.scrollHeight;
      } catch (error) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        messageContainer.innerHTML += `<div style="background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 8px; max-width: 85%;">Kendala koneksi AI: ${error.message}</div>`;
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }
    // --- END SCRIPT AI CO-PILOT ADMIN ---

    function switchOnlineTab(tab) {
      activeOnlineTab = tab;
      const btnBerlangsung = document.getElementById("btn-sub-berlangsung");
      const btnSelesai = document.getElementById("btn-sub-selesai");
      const wrapBerlangsung = document.getElementById("wrapper-pesanan-berlangsung");
      const wrapSelesai = document.getElementById("wrapper-pesanan-selesai");

      if (tab === 'berlangsung') {
        btnBerlangsung.style.background = "#2563eb"; btnBerlangsung.style.color = "white"; btnBerlangsung.style.border = "none";
        btnSelesai.style.background = "var(--input-bg)"; btnSelesai.style.color = "var(--text-color)"; btnSelesai.style.border = "1px solid var(--input-border)";
        wrapBerlangsung.style.display = "flex"; wrapSelesai.style.display = "none";
      } else {
        btnSelesai.style.background = "#16a34a"; btnSelesai.style.color = "white"; btnSelesai.style.border = "none";
        btnBerlangsung.style.background = "var(--input-bg)"; btnBerlangsung.style.color = "var(--text-color)"; btnBerlangsung.style.border = "1px solid var(--input-border)";
        wrapSelesai.style.display = "flex"; wrapBerlangsung.style.display = "none";
      }
      renderOnlineOrdersUI();
    }

    function playNotificationSound() {
      let savedTone = localStorage.getItem('admin_ringtone_v13') || 'default';
      if (savedTone === 'default') {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          function playBeep(delay, freq, duration) {
            setTimeout(() => {
              if (audioCtx.state === 'suspended') audioCtx.resume();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'square';
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
              osc.connect(gain); gain.connect(audioCtx.destination);
              gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
              osc.start(); osc.stop(audioCtx.currentTime + duration);
            }, delay);
          }
          for (let i = 0; i < 20; i++) {
            playBeep(i * 110, (i % 4 === 3) ? 1200 : 900, (i === 19) ? 0.3 : 0.08);
          }
        } catch (e) { console.log("Audio diblokir:", e); }
      } else {
        const audio = new Audio(savedTone);
        audio.play().catch(e => console.log("Gagal memutar audio:", e));
      }
    }

    function gantiTipeNadaAdmin(val) {
      const uploadWrapper = document.getElementById("wrapper-upload-ringtone-admin");
      if (val === "custom") {
        uploadWrapper.style.display = "block";
      } else {
        uploadWrapper.style.display = "none";
        localStorage.setItem('admin_ringtone_v13', 'default');
        alert("Nada dering diatur ke Default!");
      }
    }

    function simpanNadaAdminDariHP(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64Audio = e.target.result;
        localStorage.setItem('admin_ringtone_v13', base64Audio);
        alert("Nada dering dari HP berhasil disimpan!");
        playNotificationSound();
      };
      reader.readAsDataURL(file);
    }

    function initOnlineOrdersListener() {
      let isInitialLoad = true;
      storeCollection("transaksi").onSnapshot((snapshot) => {
        if (!isInitialLoad) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              let data = change.doc.data();
              if (data.customerPhone || (data.metode && data.metode.includes("Online"))) {
                playNotificationSound();
              }
            }
          });
        }
        isInitialLoad = false;

        onlineOrdersDataCache = [];
        snapshot.forEach(doc => {
          let data = doc.data();
          if (data.customerPhone || (data.metode && data.metode.includes("Online"))) {
            onlineOrdersDataCache.push({ id: doc.id, ...data });
          }
        });

        onlineOrdersDataCache.sort((a, b) => {
          let timeA = a.waktuTimestamp?.toMillis ? a.waktuTimestamp.toMillis() : 0;
          let timeB = b.waktuTimestamp?.toMillis ? b.waktuTimestamp.toMillis() : 0;
          return timeB - timeA;
        });

        renderOnlineOrdersUI();
      });
    }

    // --- FITUR LIVE CHAT ADMIN ---
    function initAdminChatListener() {
      let isInitialChatLoad = true;
      storeCollection("chats").onSnapshot((snapshot) => {
        if (!isInitialChatLoad) {
          snapshot.docChanges().forEach((change) => {
            let data = change.doc.data();
            let phone = change.doc.id;
            let unread = data.unreadAdmin || 0;
            let prevUnread = adminChatPrevUnread[phone] || 0;

            if ((change.type === "added" && unread > 0) || (change.type === "modified" && unread > prevUnread)) {
              playNotificationSound();
            }
          });
        }
        isInitialChatLoad = false;

        let chatListContainer = document.getElementById("admin-chat-list");
        if (!chatListContainer) return;
        chatListContainer.innerHTML = "";

        if (snapshot.empty) {
          chatListContainer.innerHTML = `<div style="padding: 15px; text-align: center; color: var(--text-muted); font-size: 0.85rem;" data-i18n="no_chat_messages">Belum ada pesan masuk.</div>`;
          return;
        }

        let totalUnread = 0;
        snapshot.forEach(doc => {
          let data = doc.data();
          let phone = doc.id;
          let name = data.customerNama || phone;
          let lastMsg = data.lastMessage || "Kirim pesan...";
          let unread = data.unreadAdmin || 0;
          totalUnread += unread;

          adminChatPrevUnread[phone] = unread;

          let activeStyle = selectedChatPhone === phone ? "background: rgba(37,99,235,0.1); border-left: 4px solid #2563eb;" : "";

          chatListContainer.innerHTML += `
            <div onclick="bukaRuangChatAdmin('${phone}', '${name}')" style="padding: 12px; border-bottom: 1px solid var(--border-color); cursor: pointer; ${activeStyle}">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.9rem; color:#fff !important;">
                <span style="color:#fff !important;">👤 ${name}</span>
                ${unread > 0 ? `<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem;">${unread}</span>` : ''}
              </div>
              <div style="font-size: 0.78rem; color:#fff !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">${phone}</div>
            </div>
          `;
        });

        adminPrivateUnreadTotal = totalUnread;
        updateAdminLiveChatBadge();
      });
    }

    function toggleAdminPrivateChatList(forceState) {
      const drawer = document.getElementById("admin-private-chat-drawer");
      if (!drawer) return;
      const open = typeof forceState === "boolean" ? forceState : drawer.style.display === "none";
      drawer.style.display = open ? "flex" : "none";
      const btn = document.querySelector(".admin-chat-people-toggle");
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function bukaRuangChatAdmin(phone, name) {
      selectedChatPhone = phone;
      toggleAdminPrivateChatList(false);
      const chatTitleEl = document.getElementById("admin-chat-title");
      if (chatTitleEl) chatTitleEl.innerText = `Chat dengan: ${name} (${phone})`;
      const deleteChatBtn = document.getElementById("admin-chat-delete-btn");
      if (deleteChatBtn) deleteChatBtn.style.display = "inline-block";
      document.getElementById("admin-chat-input").removeAttribute("disabled");
      document.getElementById("admin-chat-send-btn").removeAttribute("disabled");

      storeCollection("chats").doc(phone).update({ unreadAdmin: 0 }).catch(() => {});
      adminChatPrevUnread[phone] = 0;

      if (chatUnsubscribe) chatUnsubscribe();

      chatUnsubscribe = storeCollection("chats").doc(phone).collection("messages")
        .orderBy("waktuTimestamp", "asc")
        .onSnapshot((snapshot) => {
          let msgContainer = document.getElementById("admin-chat-messages");
          msgContainer.innerHTML = "";
          if (snapshot.empty) {
            msgContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 20px;">Belum ada percakapan.</div>`;
            return;
          }
          snapshot.forEach(doc => {
            let m = doc.data();
            let isAdmin = m.pengirim === "admin";
            let alignBubble = isAdmin ? "align-self: flex-end; background: #2563eb; color: white;" : "align-self: flex-start; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color);";
            msgContainer.innerHTML += `
              <div style="max-width: 75%; padding: 8px 12px; border-radius: 10px; font-size: 0.85rem; ${alignBubble}">
                <div>${m.pesan}</div>
                <div style="font-size: 0.65rem; opacity: 0.8; text-align: right; margin-top: 2px;">${m.waktu || ''}</div>
              </div>
            `;
          });
          msgContainer.scrollTop = msgContainer.scrollHeight;
        });
    }

    function kirimPesanAdmin() {
      if (!selectedChatPhone) return alert("Pilih pelanggan terlebih dahulu!");
      let inputEl = document.getElementById("admin-chat-input");
      let pesan = inputEl.value.trim();
      if (!pesan) return;

      let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');

      storeCollection("chats").doc(selectedChatPhone).collection("messages").add({
        pengirim: "admin",
        pesan: pesan,
        waktu: nowStr,
        waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        storeCollection("chats").doc(selectedChatPhone).set({
          lastMessage: "Admin: " + pesan,
          lastTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
          unreadCustomer: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
        inputEl.value = "";
      });
    }

    async function hapusSemuaChatPribadiAdmin() {
      if (!selectedChatPhone) return alert("Pilih pelanggan terlebih dahulu!");
      if (!confirm("Hapus seluruh riwayat Chat Pribadi dengan pelanggan ini? Tindakan ini tidak dapat dibatalkan!")) return;

      try {
        const messagesRef = storeCollection("chats").doc(selectedChatPhone).collection("messages");
        const snapshot = await messagesRef.get();
        let batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        await storeCollection("chats").doc(selectedChatPhone).set({
          lastMessage: "",
          lastTimestamp: firebase.firestore.FieldValue.delete(),
          unreadAdmin: 0,
          unreadCustomer: 0
        }, { merge: true });

        adminChatPrevUnread[selectedChatPhone] = 0;
        adminPrivateUnreadTotal = 0;
        updateAdminLiveChatBadge();
        alert("Riwayat Chat Pribadi berhasil dihapus!");
      } catch (err) {
        alert("Gagal menghapus chat: " + err.message);
      }
    }

    function kirimPesanRumpiAdmin() {
      let inputEl = document.getElementById("admin-chat-rumpi-input");
      let pesan = inputEl.value.trim();
      if (!pesan) return;

      let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');

      storeCollection("db_chat_rumpi").add({
        senderPhone: "Admin",
        senderName: "Admin Toko",
        pesan: pesan,
        waktu: nowStr,
        waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        inputEl.value = "";
      }).catch(err => {
        alert("Gagal mengirim pesan: " + err.message);
      });
    }

    function renderOnlineOrdersUI() {
      const containerBerlangsung = document.getElementById("wrapper-pesanan-berlangsung");
      const containerSelesai = document.getElementById("wrapper-pesanan-selesai");
      if (!containerBerlangsung || !containerSelesai) return;

      containerBerlangsung.innerHTML = "";
      containerSelesai.innerHTML = "";

      let listBerlangsung = onlineOrdersDataCache.filter(t => (t.statusPesanan || "Menunggu Diproses") !== "Selesai");
      let listSelesai = onlineOrdersDataCache.filter(t => (t.statusPesanan || "") === "Selesai");

      let activeCount = listBerlangsung.length;
      const badgeEl = document.getElementById("badge-online-count");
      const blueDotEl = document.getElementById("burger-blue-dot");

      if (badgeEl) {
        if (activeCount > 0) {
          badgeEl.innerText = activeCount;
          badgeEl.style.display = "inline-block";
        } else {
          badgeEl.style.display = "none";
        }
      }

      if (blueDotEl) {
        if (activeCount > 0) {
          blueDotEl.style.display = "block";
        } else {
          blueDotEl.style.display = "none";
        }
      }

      if (listBerlangsung.length === 0) {
        containerBerlangsung.innerHTML = `<div class="empty-state" style="text-align: center; padding: 20px; color: var(--text-muted);">Tidak ada pesanan sedang berlangsung.</div>`;
      } else {
        listBerlangsung.forEach(trx => containerBerlangsung.innerHTML += buildOrderCardHtml(trx));
      }

      if (listSelesai.length === 0) {
        containerSelesai.innerHTML = `<div class="empty-state" style="text-align: center; padding: 20px; color: var(--text-muted);">Belum ada riwayat pesanan selesai.</div>`;
      } else {
        listSelesai.forEach(trx => containerSelesai.innerHTML += buildOrderCardHtml(trx));
      }
    }

    function buildOrderCardHtml(trx) {
      let statusBadge = trx.statusPesanan || "Menunggu Diproses";
      let badgeColor = statusBadge === "Selesai" ? "#16a34a" : "#d97706";
      let buktiBtn = trx.buktiTransfer ? `<button onclick="bukaBuktiTransfer('${trx.buktiTransfer}')" title="Lihat Bukti Transfer" style="background: #2563eb; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.9rem; cursor: pointer;">🖼️</button>` : "";

      let itemsHtml = "";
      if (trx.items && trx.items.length > 0) {
        itemsHtml = `<div style="margin: 8px 0; background: var(--input-bg); padding: 8px; border-radius: 8px; font-size: 0.82rem;"><strong>📦 Rincian Barang:</strong><ul style="margin: 4px 0 0 16px; padding: 0;">`;
        trx.items.forEach(it => {
          itemsHtml += `<li>${it.nama} — <b>(${it.qty}x)</b> = Rp ${(it.subtotal || 0).toLocaleString('id-ID')}</li>`;
        });
        itemsHtml += `</ul></div>`;
      } else {
        itemsHtml = `<div style="margin: 8px 0; font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Rincian barang kosong.</div>`;
      }

      return `
        <div class="card" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${trx.waktu || '-'}</span>
            <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">${statusBadge}</span>
          </div>
          <div style="font-weight: bold; font-size: 0.95rem; color: var(--text-color);">👤 ${trx.customerNama || 'Pelanggan'} (${trx.customerPhone || '-'})</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">📍 Alamat: ${trx.customerAlamat || '-'}</div>
          <div style="font-size: 0.85rem; font-weight: 600; color: #2563eb; margin-bottom: 4px;">Metode: ${trx.metode || '-'}</div>
          
          ${itemsHtml}

          <div style="font-size: 0.95rem; font-weight: bold; margin-bottom: 8px; color: #16a34a;">Total Belanja: Rp ${(trx.total || 0).toLocaleString('id-ID')}</div>
          
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            ${buktiBtn}
            <button onclick="kirimWaPesananAdmin('${trx.id}')" title="Kirim Rincian ke WhatsApp Pelanggan" style="background: #25D366; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.9rem; cursor: pointer;">💬</button>
            <button onclick="bukaModalEditPesanan('${trx.id}')" title="Edit Rincian Pesanan" style="background: #ca8a04; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.9rem; cursor: pointer;">✏️</button>
            <button onclick="ubahStatusPesananAdmin('${trx.id}', 'Selesai')" title="Tandai Selesai" style="background: #16a34a; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.9rem; cursor: pointer;">✅</button>
            <button onclick="hapusPesananAdmin('${trx.id}')" title="Hapus Pesanan" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.9rem; cursor: pointer;">🗑️</button>
          </div>
        </div>
      `;
    }

    function kirimWaPesananAdmin(id) {
      let trx = onlineOrdersDataCache.find(t => t.id === id);
      if (!trx || !trx.customerPhone) return alert("Nomor WhatsApp pelanggan tidak tersedia!");
      let phone = trx.customerPhone.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '62' + phone.slice(1);

      let text = `*INFO PESANAN - ${pengaturanToko.nama || 'Toko'}* 📦\n`;
      text += `Halo *${trx.customerNama || 'Pelanggan'}*, status pesanan Anda: *${trx.statusPesanan || 'Menunggu Diproses'}*\n\n`;
      if (trx.items && trx.items.length > 0) {
        trx.items.forEach((it, idx) => {
          text += `${idx + 1}. ${it.nama} (${it.qty}x) = Rp ${(it.subtotal || 0).toLocaleString('id-ID')}\n`;
        });
      }
      text += `------------------------------------\n*Total : Rp ${(trx.total || 0).toLocaleString('id-ID')}*\n`;
      text += `Terima kasih telah berbelanja! 🙏`;

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    }

    function bukaModalEditPesanan(id) {
      let trx = onlineOrdersDataCache.find(t => t.id === id);
      if (!trx) return alert("Data pesanan tidak ditemukan!");
      
      document.getElementById("edit-order-id").value = id;
      editingOrderItemsTemp = trx.items ? JSON.parse(JSON.stringify(trx.items)) : [];
      renderEditOrderItemsModal();
      document.getElementById("editOrderModal").classList.add("show");
      history.pushState({tab: activeTab, modal: 'editOrder'}, "", "");
    }

    function closeEditOrderModal() {
      document.getElementById("editOrderModal").classList.remove("show");
    }

    function renderEditOrderItemsModal() {
      const container = document.getElementById("edit-order-items-container");
      container.innerHTML = "";
      let grandTotal = 0;

      if (editingOrderItemsTemp.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 10px; font-size: 0.8rem; font-style: italic;">Belum ada rincian barang pada pesanan ini.</div>`;
      }

      editingOrderItemsTemp.forEach((it, idx) => {
        let unitPrice = it.qty > 0 ? (it.subtotal / it.qty) : (it.subtotal || 0);
        grandTotal += (it.subtotal || 0);

        container.innerHTML += `
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--input-bg); padding: 8px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 4px;">
            <div style="flex: 1;">
              <div style="font-weight: bold;">${it.nama || 'Barang'}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Rp ${unitPrice.toLocaleString('id-ID')} / item</div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button onclick="ubahQtyEditOrder(${idx}, -1)" style="width: 26px; height: 26px; background: #dc2626; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">-</button>
              <span style="font-weight: bold; min-width: 20px; text-align: center;">${it.qty || 1}</span>
              <button onclick="ubahQtyEditOrder(${idx}, 1)" style="width: 26px; height: 26px; background: #16a34a; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">+</button>
              <button onclick="hapusItemEditOrder(${idx})" style="background: transparent; border: none; color: #dc2626; cursor: pointer; font-size: 1rem; margin-left: 4px;" title="Hapus Barang">🗑️</button>
            </div>
          </div>
        `;
      });
      document.getElementById("edit-order-grand-total").innerText = grandTotal.toLocaleString('id-ID');
    }

    function ubahQtyEditOrder(idx, delta) {
      let it = editingOrderItemsTemp[idx];
      let unitPrice = it.qty > 0 ? (it.subtotal / it.qty) : 0;
      it.qty += delta;
      if (it.qty <= 0) {
        editingOrderItemsTemp.splice(idx, 1);
      } else {
        it.subtotal = it.qty * unitPrice;
      }
      renderEditOrderItemsModal();
    }

    function hapusItemEditOrder(idx) {
      editingOrderItemsTemp.splice(idx, 1);
      renderEditOrderItemsModal();
    }

    async function simpanPerubahanPesananAdmin() {
      let id = document.getElementById("edit-order-id").value;
      if (!id) return;
      let newTotal = editingOrderItemsTemp.reduce((acc, i) => acc + i.subtotal, 0);
      let newQty = editingOrderItemsTemp.reduce((acc, i) => acc + i.qty, 0);

      try {
        await storeCollection("transaksi").doc(id).update({
          items: editingOrderItemsTemp,
          total: newTotal,
          qty: newQty
        });
        alert("Pesanan berhasil diperbarui!");
        closeEditOrderModal();
      } catch (err) {
        alert("Gagal memperbarui pesanan: " + err.message);
      }
    }

    function bukaBuktiTransfer(base64Img) {
      document.getElementById("proof-img-preview").src = base64Img;
      document.getElementById("proofModal").classList.add("show");
      history.pushState({tab: activeTab, modal: 'proof'}, "", "");
    }
    function closeProofModal() { document.getElementById("proofModal").classList.remove("show"); }
    function ubahStatusPesananAdmin(id, status) {
      storeCollection("transaksi").doc(id).update({ statusPesanan: status }).then(() => alert("Status diperbarui menjadi: " + status));
    }
    function hapusPesananAdmin(id) {
      if (confirm("Hapus riwayat pesanan online ini?")) storeCollection("transaksi").doc(id).delete();
    }

    function initCustomerCardClickObserver() {
      const observer = new MutationObserver(() => {
        const cards = document.querySelectorAll("#customer-list-wrapper .card, #customer-list-wrapper > div");
        cards.forEach(card => {
          if (card.dataset.clickableEnhanced) return;
          card.dataset.clickableEnhanced = "true";
          card.style.cursor = "pointer";
          card.style.transition = "all 0.2s ease";
          
          card.onmouseover = () => card.style.borderColor = "#2563eb";
          card.onmouseout = () => card.style.borderColor = "var(--border-color)";

          const text = card.innerText;
          const phoneMatch = text.match(/(?:\+62|0)[0-9\-\s]{8,}/);
          if (phoneMatch) {
            let cleanPhone = phoneMatch[0].replace(/[\s\-]/g, '');
            card.onclick = (e) => {
              if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
              bukaDetailPelangganAdminByPhone(cleanPhone);
            };
          }
        });
      });

      const targetWrapper = document.getElementById("customer-list-wrapper");
      if (targetWrapper) {
        observer.observe(targetWrapper, { childList: true, subtree: true });
      }
    }

    function bukaDetailPelangganAdminByPhone(phone) {
      storeCollection("pelanggan").where("phone", "==", phone).get().then(snap => {
        if (snap.empty) {
          storeCollection("pelanggan").get().then(allSnap => {
            let found = null;
            allSnap.forEach(d => {
              let p = d.data().phone || "";
              if (p.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')) {
                found = d.data();
              }
            });
            if (found) {
              displayCustomerDetailModal(found);
            } else {
              alert("Data pelanggan tidak ditemukan di database!");
            }
          });
          return;
        }
        displayCustomerDetailModal(snap.docs[0].data());
      });
    }

    function displayCustomerDetailModal(custData) {
      let modalBody = document.getElementById("adm-cust-modal-body");
      document.getElementById("adm-cust-modal-title").innerText = `👤 ${custData.nama || 'Pelanggan'}`;

      let htmlInfo = `
        <div style="background: var(--input-bg); padding: 10px; border-radius: 8px; margin-bottom: 4px;">
          <div><strong>No. WhatsApp:</strong> ${custData.phone || '-'}</div>
          <div><strong>Alamat:</strong> ${custData.alamat || '-'}</div>
        </div>
      `;

      let phoneClean = (custData.phone || "").replace(/[^0-9]/g, '');
      let custTransactions = onlineOrdersDataCache.filter(t => {
        let tPhone = (t.customerPhone || "").replace(/[^0-9]/g, '');
        return tPhone && phoneClean && (tPhone.includes(phoneClean) || phoneClean.includes(tPhone));
      });

      let htmlTrx = `<div style="font-weight: bold; margin-top: 4px;">📦 Riwayat Belanja / Pesanan:</div>`;
      if (custTransactions.length === 0) {
        htmlTrx += `<div style="color: var(--text-muted); font-style: italic; font-size: 0.8rem; margin-bottom: 6px;">Belum ada riwayat transaksi tercatat.</div>`;
      } else {
        htmlTrx += `<div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; max-height: 200px; overflow-y: auto;">`;
        custTransactions.forEach(trx => {
          let itemsStr = trx.items ? trx.items.map(i => `${i.nama} (${i.qty}x)`).join(', ') : 'Rincian kosong';
          htmlTrx += `
            <div style="border: 1px solid var(--border-color); padding: 8px; border-radius: 6px; background: var(--card-bg);">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted);">
                <span>${trx.waktu || '-'}</span>
                <span style="font-weight: bold; color: #16a34a;">${trx.statusPesanan || 'Selesai'}</span>
              </div>
              <div style="font-size: 0.8rem; margin: 2px 0;"><strong>Barang:</strong> ${itemsStr}</div>
              <div style="font-weight: bold; color: #2563eb; font-size: 0.85rem;">Total: Rp ${(trx.total || 0).toLocaleString('id-ID')} (${trx.metode || '-'})</div>
            </div>
          `;
        });
        htmlTrx += `</div>`;
      }

      let htmlNotes = `<div style="font-weight: bold; margin-top: 4px;">📝 Catatan & Tagihan Toko:</div>`;
      if (!custData.catatan || custData.catatan.length === 0) {
        htmlNotes += `<div style="color: var(--text-muted); font-style: italic; font-size: 0.80rem;">Tidak ada catatan khusus.</div>`;
      } else {
        htmlNotes += `<div style="display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow-y: auto;">`;
        custData.catatan.forEach(note => {
          htmlNotes += `
            <div style="border-bottom: 1px dashed var(--border-color); padding: 6px 0; font-size: 0.80rem;">
              <div><b>[${note.jenis}]</b> ${note.keterangan}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">${note.waktu}</div>
            </div>
          `;
        });
        htmlNotes += `</div>`;
      }

      modalBody.innerHTML = htmlInfo + htmlTrx + htmlNotes;
      document.getElementById("adminCustomerDetailModal").classList.add("show");
      history.pushState({tab: activeTab, modal: 'adminCustomerDetail'}, "", "");
    }

    function closeAdminCustomerDetailModal() {
      document.getElementById("adminCustomerDetailModal").classList.remove("show");
    }
