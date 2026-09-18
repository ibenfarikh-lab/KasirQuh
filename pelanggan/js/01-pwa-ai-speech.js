if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(err => console.log(err)); }); }
    let deferredPrompt; const welcomeScreen = document.getElementById('welcomeScreen'); const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone && welcomeScreen) welcomeScreen.style.display = 'none';
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; const cardInstall = document.getElementById('card-install-pwa'); if (cardInstall) cardInstall.style.display = 'block'; });
    async function triggerInstallPWA() { if (!deferredPrompt) return alert("Bisa install lewat menu Chrome."); deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') tutupWelcomeScreen(); deferredPrompt = null; document.getElementById('card-install-pwa').style.display = 'none'; }
    function tutupWelcomeScreen() {
      // Tutup secara langsung dan ambil elemen terbaru agar tidak terpengaruh cache/urutan inisialisasi.
      const screen = document.getElementById('welcomeScreen');
      if (!screen) return;
      screen.style.setProperty('opacity', '0', 'important');
      screen.style.setProperty('pointer-events', 'none', 'important');
      screen.style.setProperty('display', 'none', 'important');
      document.body.classList.remove('fab-auth-hidden');
      if (typeof updateFabAuthVisibility === 'function') updateFabAuthVisibility();
    }
    function bukaLoginDariWelcome() { tutupWelcomeScreen(); if (!currentCustomerPhone) { document.getElementById('customerLoginModal').style.display = 'flex'; gantiFormAuth('login'); } }

    let isAiSoundOn = true; let aiRecognition = null; let isAiListening = false;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; aiRecognition = new SpeechRecognition(); aiRecognition.lang = 'id-ID';
      aiRecognition.onresult = function(e) { document.getElementById('ai-chat-input').value = e.results[0][0].transcript; stopAiListeningState(); kirimPesanKeAI(); };
      aiRecognition.onerror = function(e) { stopAiListeningState(); }; aiRecognition.onend = function() { stopAiListeningState(); };
    }
    function toggleAISpeechRecognition() { if (!aiRecognition) return showToast("Fitur suara tidak didukung browser ini.", "error"); if (isAiListening) { aiRecognition.stop(); stopAiListeningState(); } else { aiRecognition.start(); startAiListeningState(); } }
    function startAiListeningState() { isAiListening = true; const micBtn = document.getElementById('aiMicButton'); micBtn.style.background = '#dc2626'; micBtn.innerText = "🛑"; document.getElementById('ai-chat-input').placeholder = "Mendengarkan..."; }
    function stopAiListeningState() { isAiListening = false; const micBtn = document.getElementById('aiMicButton'); micBtn.style.background = '#374151'; micBtn.innerText = "🎤"; document.getElementById('ai-chat-input').placeholder = "Tanya stok, harga..."; }
    function toggleAISound() { isAiSoundOn = !isAiSoundOn; document.getElementById('aiSoundToggle').innerText = isAiSoundOn ? "🔊 Suara: ON" : "🔇 Suara: OFF"; if (!isAiSoundOn && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }

    function getPelangganVercelUrl() {
      let origin = window.location.origin;
      if (!origin || origin.includes("null") || origin.includes("file:")) {
        return "https://kasirquh.vercel.app/pelanggan/index.html"; // Fallback URL Vercel Anda
      }
      if (!window.location.pathname.includes("/pelanggan/")) {
        return origin + "/pelanggan/index.html";
      }
      return window.location.href;
    }

    function bukaModalQRCode() {
      appOpenModal('qrCodeModal');
      const currentUrl = getPelangganVercelUrl();
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
      document.getElementById('qr-code-img').src = qrApiUrl;
      const storeName = pengaturanToko.nama || "KasirQuh";
      document.getElementById('qr-store-name').innerText = storeName;
      document.getElementById('qr-store-subtitle').innerText = "Belanja Harian Makin Praktis - " + storeName + " -";
      document.getElementById('qrCodeModal').classList.add('show');
    }

    function tutupModalQRCode() {
      if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'qrCodeModal') { history.back(); return; }
      document.getElementById('qrCodeModal').classList.remove('show');
    }

    function bagikanAplikasiViaWA() {
      const currentUrl = getPelangganVercelUrl();
      const storeName = pengaturanToko.nama || "KasirQuh";
      const pesan = `Halo! Yuk belanja kebutuhan harian makin praktis di *${storeName}* pakai aplikasi KasirQuh.\n\nKlik tautan Vercel berikut untuk mulai belanja & daftar:\n${currentUrl}\n\nTinggal Pilih Barang • Beres! 🛒✨`;
      window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, '_blank');
    }

    function bagikanBarcodeSebagaiGambar() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 400, 500);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(1, '#7c3aed');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 500);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      const storeName = pengaturanToko.nama || "KasirQuh";
      ctx.fillText(storeName, 200, 65);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText("Belanja Harian Makin Praktis", 200, 90);

      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(80, 120, 240, 240, 16);
        ctx.fill();
      } else {
        ctx.fillRect(80, 120, 240, 240);
      }

      const currentUrl = getPelangganVercelUrl();
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
      
      let img = new Image();
      img.crossOrigin = "anonymous";
      img.src = qrApiUrl;
      img.onload = async function() {
        ctx.drawImage(img, 100, 140, 200, 200);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText("📷 Scan Untuk Daftar / Login", 200, 400);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText("✨ Tinggal Scan • Pilih Barang • Beres!", 200, 435);

        canvas.toBlob(async (blob) => {
          const file = new File([blob], "barcode-kasirquh.png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Barcode ' + storeName,
                text: 'Yuk scan barcode ini atau klik link Vercel untuk mulai belanja di ' + storeName + '!\n' + currentUrl
              });
            } catch (err) {
              console.log(err);
            }
          } else {
            const link = document.createElement('a');
            link.download = 'barcode-kasirquh.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast("📥 Gambar barcode berhasil diunduh! Silakan kirimkan ke WhatsApp.");
          }
        }, 'image/png');
      };
    }

    function bagikanProdukViaWA() {
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

    function renderTeksDanBagikanProduk(ctx, canvas, p, hargaParsed, satuan, storeName) {
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
