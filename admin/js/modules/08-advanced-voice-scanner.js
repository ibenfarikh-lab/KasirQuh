function showNotif(msg) {
  const notif = document.getElementById("scan-notif");
  if(!notif) return;
  notif.innerText = msg; notif.style.display = "block";
  setTimeout(() => { notif.style.display = "none"; }, 1500);
}

async function perbaruiAplikasi() {
  const status = document.getElementById('update-app-status');
  const setStatus = (text) => { if (status) status.textContent = text; };
  if (!confirm('Perbarui aplikasi sekarang?\n\nCache aplikasi akan disegarkan dan halaman dimuat ulang. Login, pengaturan lokal, dan data Firestore tidak dihapus.')) return;

  try {
    setStatus('Menyiapkan pembaruan...');

    // Hapus hanya Cache Storage milik aplikasi. localStorage/sessionStorage/IndexedDB tidak disentuh.
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }

    // Minta Service Worker terbaru segera aktif, tetapi jangan menghapus data situs.
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async registration => {
        try { await registration.update(); } catch (_) {}
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }));
    }

    setStatus('Pembaruan selesai. Memuat ulang...');
    setTimeout(() => window.location.reload(), 350);
  } catch (err) {
    console.warn('Pembaruan aplikasi tidak sepenuhnya berhasil:', err);
    setStatus('Pembaruan sebagian gagal. Memuat ulang...');
    setTimeout(() => window.location.reload(), 500);
  }
}

async function muatAdvanceScriptAdmin() {
  const input = document.getElementById('advance-script-input');
  const status = document.getElementById('advance-script-status');
  if (!input || !status || !currentAdminProfile?.tokoId) return;
  try {
    const doc = await storeCollection('pengaturan').doc('developer').get();
    const data = doc.exists ? (doc.data() || {}) : {};
    input.value = typeof data.advanceScript === 'string' ? data.advanceScript : '';
    status.textContent = input.value.trim() ? 'Script tersimpan untuk toko aktif.' : 'Belum ada script tersimpan.';
  } catch (err) {
    console.warn('Gagal memuat Advance Script:', err);
    status.textContent = 'Gagal membaca script developer.';
  }
}

async function simpanAdvanceScript() {
  const input = document.getElementById('advance-script-input');
  const status = document.getElementById('advance-script-status');
  if (!input || !status) return;
  if (!currentAdminProfile?.tokoId) return alert('Profil toko belum siap. Silakan tunggu sebentar lalu coba lagi.');
  const code = input.value;
  if (!code.trim()) return alert('Kolom Advance Script masih kosong.');
  if (code.length > 50000) return alert('Script terlalu panjang. Maksimal 50.000 karakter.');
  if (!confirm('Simpan Advance Script untuk toko aktif?\n\nScript ini dapat dijalankan dari panel developer. Pastikan kodenya benar.')) return;
  try {
    await storeCollection('pengaturan').doc('developer').set({
      advanceScript: code,
      advanceScriptUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      advanceScriptUpdatedBy: currentAdminProfile.uid || ''
    }, { merge: true });
    status.textContent = 'Script tersimpan. Siap dijalankan.';
  } catch (err) {
    console.error('Gagal menyimpan Advance Script:', err);
    alert('Gagal menyimpan Advance Script: ' + err.message);
  }
}

async function jalankanAdvanceScript() {
  const input = document.getElementById('advance-script-input');
  const status = document.getElementById('advance-script-status');
  if (!input || !status) return;
  const code = input.value.trim();
  if (!code) return alert('Belum ada Advance Script.');
  if (!currentAdminProfile?.tokoId) return alert('Profil toko belum siap.');
  if (!confirm('Jalankan Advance Script sekarang?\n\nPastikan script memang ditujukan untuk toko aktif dan sudah diuji.')) return;
  try {
    status.textContent = 'Menjalankan script...';
    // Direct eval sengaja dipakai agar script maintenance dapat mengakses helper
    // dan variabel runtime script.js. Fitur ini hanya tersedia dari panel admin.
    await eval(`(async () => {\n${code}\n})()`);
    status.textContent = 'Script selesai dijalankan.';
    alert('Advance Script selesai dijalankan.');
  } catch (err) {
    console.error('Advance Script error:', err);
    status.textContent = 'Script gagal: ' + (err.message || err);
    alert('Advance Script gagal: ' + (err.message || err));
  }
}

async function hapusAdvanceScript() {
  const input = document.getElementById('advance-script-input');
  const status = document.getElementById('advance-script-status');
  if (!input || !status) return;
  if (!currentAdminProfile?.tokoId) return alert('Profil toko belum siap.');
  if (!confirm('Hapus Advance Script yang tersimpan untuk toko aktif?')) return;
  try {
    await storeCollection('pengaturan').doc('developer').set({
      advanceScript: '',
      advanceScriptUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      advanceScriptUpdatedBy: currentAdminProfile.uid || ''
    }, { merge: true });
    input.value = '';
    status.textContent = 'Advance Script sudah dihapus.';
  } catch (err) {
    console.error('Gagal menghapus Advance Script:', err);
    alert('Gagal menghapus Advance Script: ' + err.message);
  }
}

let touchstartY = 0;
let touchendY = 0;

document.addEventListener('touchstart', e => {
  touchstartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
  touchendY = e.changedTouches[0].screenY;
  
  let mainContentEl = document.querySelector('.main-content');
  if (mainContentEl && mainContentEl.scrollTop === 0 && (touchendY - touchstartY > 120)) {
    showNotif("Memuat ulang data...");
    if (typeof refreshData === 'function') {
      refreshData();
    } else {
      window.location.reload();
    }
  }
}, { passive: true });

let recognition = null;
let isRecording = false;

function toggleVoiceInput() {
  const micBtn = document.getElementById('ai-mic-btn');
  const inputField = document.getElementById('ai-user-input');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Maaf, browser Partner belum mendukung fitur voice input. Silakan gunakan Google Chrome.");
    return;
  }

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
      isRecording = true;
      if (micBtn) {
        micBtn.style.color = '#ef4444';
        micBtn.style.transform = 'scale(1.2)';
      }
      if (inputField) {
        inputField.placeholder = "🎤 Sedang mendengarkan... Silakan bicara";
      }
    };

    recognition.onresult = function(event) {
      const speechResult = event.results[0][0].transcript;
      if (inputField) {
        inputField.value = speechResult;
      }
    };

    recognition.onerror = function(event) {
      console.error("Speech recognition error:", event.error);
      stopVoiceRecordingUI();
    };

    recognition.onend = function() {
      stopVoiceRecordingUI();
    };
  }

  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

function stopVoiceRecordingUI() {
  isRecording = false;
  const micBtn = document.getElementById('ai-mic-btn');
  const inputField = document.getElementById('ai-user-input');
  if (micBtn) {
    micBtn.style.color = 'var(--text-color)';
    micBtn.style.transform = 'scale(1)';
  }
  if (inputField) {
    inputField.placeholder = "Tanya stok, saran jualan...";
  }
}

// --- FITUR BARU: VOICE SCANNER POS (DENGAN TIMER 10 DETIK & MODAL KERANJANG) ---
let voiceScannerPos = null;
let isVoiceScannerPosActive = false;
let voiceTimeoutTimer = null;

function startVoiceScannerFlow() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return alert("Maaf, browser HP Anda belum mendukung fitur Voice Scanner. Gunakan Google Chrome.");
  }

  openCartModal();

  const indicatorBox = document.getElementById("voice-indicator-container");
  const indicatorText = document.getElementById("voice-indicator-text");
  if (indicatorBox) indicatorBox.style.display = "flex";
  if (indicatorText) indicatorText.innerText = "Mendengarkan pesanan...";

  if (!voiceScannerPos) {
    voiceScannerPos = new SpeechRecognition();
    voiceScannerPos.lang = 'id-ID';
    voiceScannerPos.interimResults = true;
    voiceScannerPos.continuous = true;

    voiceScannerPos.onstart = function() {
      isVoiceScannerPosActive = true;
      resetVoiceTimeout();
    };

    voiceScannerPos.onresult = function(event) {
      resetVoiceTimeout();
      
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      let currentSpokenText = finalTranscript || interimTranscript;
      if (indicatorText) indicatorText.innerText = currentSpokenText;

      if (finalTranscript) {
        processVoicePosCommand(finalTranscript.toLowerCase().trim());
      }
    };

    voiceScannerPos.onerror = function(event) {
      console.log("Voice error:", event.error);
    };

    voiceScannerPos.onend = function() {
      if (isVoiceScannerPosActive) {
        try { voiceScannerPos.start(); } catch(e) {}
      }
    };
  }

  try {
    voiceScannerPos.start();
  } catch(e) {}
}

function resetVoiceTimeout() {
  if (voiceTimeoutTimer) clearTimeout(voiceTimeoutTimer);
  voiceTimeoutTimer = setTimeout(() => {
    stopVoiceScannerUI();
    showNotif("Voice scanner ditutup otomatis.");
  }, 10000);
}

function stopVoiceScannerUI() {
  isVoiceScannerPosActive = false;
  if (voiceTimeoutTimer) {
    clearTimeout(voiceTimeoutTimer);
    voiceTimeoutTimer = null;
  }
  if (voiceScannerPos) {
    try { voiceScannerPos.stop(); } catch(e) {}
  }
  const indicatorBox = document.getElementById("voice-indicator-container");
  if (indicatorBox) indicatorBox.style.display = "none";
}

function processVoicePosCommand(spokenText) {
  let cleanText = spokenText
    .replace(/setengah/g, '0.5')
    .replace(/seperempat/g, '0.25')
    .replace(/satu/g, '1')
    .replace(/dua/g, '2')
    .replace(/tiga/g, '3')
    .replace(/empat/g, '4')
    .replace(/lima/g, '5')
    .replace(/enam/g, '6')
    .replace(/tujuh/g, '7')
    .replace(/delapan/g, '8')
    .replace(/sembilan/g, '9')
    .replace(/sepuluh/g, '10');

  let matchedProductCode = null;
  let parsedQty = 1;
  let parsedSatuanJual = 'pcs';

  let isKgCommand = cleanText.includes('kg') || cleanText.includes('kilo');
  let isOnsCommand = cleanText.includes('ons');

  for (let code in databaseProduk) {
    let p = databaseProduk[code];
    let namaProd = p.nama.toLowerCase();

    if (cleanText.includes(namaProd)) {
      matchedProductCode = code;
      let remainingText = cleanText.replace(namaProd, '').trim();
      let numbersInRemaining = remainingText.match(/[\d\.]+/g);

      if (numbersInRemaining && numbersInRemaining.length > 0) {
        let val = parseFloat(numbersInRemaining[0]);
        if (!isNaN(val)) parsedQty = val;
      }

      if (isOnsCommand) {
        parsedQty = parsedQty / 10;
        parsedSatuanJual = 'kg';
      } else if (isKgCommand || (p.satuan && p.satuan.toLowerCase() === 'kg')) {
        parsedSatuanJual = 'kg';
      }
      break;
    }
  }

  if (matchedProductCode && databaseProduk[matchedProductCode]) {
    let prod = databaseProduk[matchedProductCode];
    let success = tambahItemKeCart(matchedProductCode, prod, parsedQty, parsedSatuanJual);
    if (success) {
      playBeep();
      showNotif(`✔️ ${prod.nama} (${parsedQty} ${parsedSatuanJual})`);
    } else {
      showNotif(`❌ Stok habis/kurang: ${prod.nama}`);
    }
  } else {
    showNotif(`❌ Barang tidak dikenali: "${spokenText}"`);
  }
}
// --- END FITUR VOICE SCANNER POS ---

