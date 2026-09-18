// --- FITUR CHAT RUMPI (ADMIN) ---
let adminChatRumpiUnsubscribe = null;
let activeAdminChatSub = 'pribadi';
let unreadRumpiAdmin = 0;
let adminRumpiBadgeListener = null;

function updateAdminLiveChatBadge() {
  const badgeChat = document.getElementById("badge-chat-count");
  if (!badgeChat) return;

  const totalUnread = (typeof adminPrivateUnreadTotal === "number" ? adminPrivateUnreadTotal : 0) + unreadRumpiAdmin;

  if (totalUnread > 0) {
    badgeChat.innerText = totalUnread;
    badgeChat.style.display = "inline-block";
  } else {
    badgeChat.style.display = "none";
  }
}

function initAdminRumpiNotificationListener() {
  let isInitialLoadRumpiAdmin = true;

  if (adminRumpiBadgeListener) {
    adminRumpiBadgeListener();
  }

  adminRumpiBadgeListener = storeCollection("db_chat_rumpi")
    .orderBy("waktuTimestamp", "asc")
    .onSnapshot((snapshot) => {
      if (!isInitialLoadRumpiAdmin) {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;

          const m = change.doc.data();

          // Pesan Admin sendiri tidak dianggap pesan masuk.
          if (m.senderPhone === "Admin") return;

          // Ikuti pola Rumpi pelanggan: pesan baru dari orang lain membunyikan nada.
          playNotificationSound();

          const wrapRumpi = document.getElementById("wrapper-admin-chat-rumpi");
          const isRumpiActive = activeAdminChatSub === "rumpi" &&
            wrapRumpi && wrapRumpi.style.display !== "none";

          if (!isRumpiActive) {
            unreadRumpiAdmin++;
            updateAdminLiveChatBadge();
          }
        });
      }

      isInitialLoadRumpiAdmin = false;
    }, (error) => {
      console.error("Listener notifikasi Chat Rumpi Admin gagal:", error);
    });
}

function switchAdminChatSubTab(sub) {
  activeAdminChatSub = sub;
  const btnPribadi = document.getElementById("btn-sub-chat-pribadi");
  const btnRumpi = document.getElementById("btn-sub-chat-rumpi");
  const wrapPribadi = document.getElementById("wrapper-admin-chat-pribadi");
  const wrapRumpi = document.getElementById("wrapper-admin-chat-rumpi");

  if (!btnPribadi || !btnRumpi) return;

  if (sub === 'pribadi') {
    btnPribadi.style.background = "#2563eb"; 
    btnPribadi.style.color = "white"; 
    btnPribadi.style.border = "none";
    
    btnRumpi.style.background = "var(--input-bg)"; 
    btnRumpi.style.color = "var(--text-color)"; 
    btnRumpi.style.border = "1px solid var(--input-border)";
    
    wrapPribadi.style.display = "flex"; 
    wrapRumpi.style.display = "none";
  } else {
    btnRumpi.style.background = "#2563eb"; 
    btnRumpi.style.color = "white"; 
    btnRumpi.style.border = "none";
    
    btnPribadi.style.background = "var(--input-bg)"; 
    btnPribadi.style.color = "var(--text-color)"; 
    btnPribadi.style.border = "1px solid var(--input-border)";
    
    wrapRumpi.style.display = "flex"; 
    wrapPribadi.style.display = "none";

    // Rumpi sudah dibuka, tandai notifikasi Rumpi yang menunggu sebagai terbaca.
    unreadRumpiAdmin = 0;
    updateAdminLiveChatBadge();
    
    initAdminChatRumpiListener();
  }
}

function initAdminChatRumpiListener() {
  if (adminChatRumpiUnsubscribe) adminChatRumpiUnsubscribe();

  adminChatRumpiUnsubscribe = storeCollection("db_chat_rumpi")
    .orderBy("waktuTimestamp", "asc")
    .onSnapshot((snapshot) => {
      let msgContainer = document.getElementById("admin-chat-rumpi-messages");
      if (!msgContainer) return;
      msgContainer.innerHTML = "";

      if (snapshot.empty) {
        msgContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 20px;">Belum ada pesan di Chat Rumpi.</div>`;
        return;
      }

      snapshot.forEach(doc => {
        let m = doc.data();
        let docId = doc.id;
        msgContainer.innerHTML += `
          <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <span style="font-weight: bold; color: #2563eb; font-size: 0.8rem;">👤 ${m.senderName || 'Warga'} (${m.senderPhone || '-'})</span>
                <span style="font-size: 0.68rem; color: var(--text-muted);">${m.waktu || ''}</span>
              </div>
              <div style="color: var(--text-color); word-break: break-word;">${escapeHtml(m.pesan || '')}</div>
            </div>
            <button onclick="hapusPesanRumpiAdmin('${docId}')" title="Hapus Pesan" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; flex-shrink: 0;">🗑️</button>
          </div>
        `;
      });
      msgContainer.scrollTop = msgContainer.scrollHeight;
    });
}

function hapusPesanRumpiAdmin(docId) {
  if (confirm("Hapus pesan ini dari Chat Rumpi?")) {
    storeCollection("db_chat_rumpi").doc(docId).delete().catch(err => alert("Gagal menghapus pesan: " + err.message));
  }
}

function bersihkanSemuaChatRumpiAdmin() {
  if (confirm("Hapus seluruh riwayat pesan di Chat Rumpi? Tindakan ini tidak dapat dibatalkan!")) {
    storeCollection("db_chat_rumpi").get().then(snapshot => {
      let batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    }).then(() => {
      alert("Semua riwayat Chat Rumpi berhasil dibersihkan!");
    }).catch(err => {
      alert("Gagal membersihkan chat: " + err.message);
    });
  }
}

// --- END FITUR CHAT RUMPI ---


// Inisialisasi awal saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  initCalcPreview();
  const display = document.getElementById("calc-display");
  if (display) {
    display.addEventListener("input", () => {
      autoCalculate();
    });
  }
});

setTheme(currentTheme);
setLanguage(currentLang);
cekStatusLogin();
updatePermanentBarTitle();

// Toggle Opsi Developer pada panel admin.
function toggleAdminDeveloperOptions() {
  const panel = document.getElementById('admin-developer-panel');
  const btn = document.getElementById('admin-developer-toggle');
  const card = document.getElementById('developer-options-card');
  if (!panel || !btn) return;

  const akanBuka = panel.hidden;
  panel.hidden = !akanBuka;
  btn.setAttribute('aria-expanded', String(akanBuka));
  btn.textContent = akanBuka ? '🛠️ Tutup Opsi Developer' : '🛠️ Opsi Developer';

  if (akanBuka) {
    requestAnimationFrame(() => {
      (card || panel).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
