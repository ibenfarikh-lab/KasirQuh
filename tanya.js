// api/tanya.js - Groq API Integration (Cool, Conversational & Regional Support)
export default async function handler(req, res) {
  const sendJson = (statusCode, data) => {
    if (typeof res.status === 'function') {
      return res.status(statusCode).json(data);
    }
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  if (req.method !== 'POST') {
    return sendJson(405, { reply: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};
    
    const promptText = body.prompt || body.pesan || body.message || body.text || '';
    const daftarProduk = body.daftarProduk || 'Tidak ada data produk.';
    const namaToko = body.namaToko || 'Toko';

    if (!promptText) {
      return sendJson(200, { reply: "Halo, Ka! Ada yang bisa dibantu atau mau ngobrol santai dulu nih?" });
    }

    const apiKey = process.env.GROQ_API_KEY; 
    if (!apiKey) {
      return sendJson(200, { reply: "Duh, API Key Groq di environment variables belum diset, Ka!" });
    }

    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    // ==========================================
    // PANDUAN LENGKAP DAN DETAIL UNTUK OTAK AI (DIPERBARUI)
    // ==========================================
    const systemPrompt = `Kamu adalah asisten AI di toko "${namaToko}" yang karakternya sangat ramah, gaul, santai, asyik, sopan, dan pintar nemenin ngobrol apa saja layaknya teman dekat yang menyenangkan. 
    Daftar produk & harga toko: ${daftarProduk}.[span_9](start_span)[span_9](end_span)

    BERIKUT ADALAH PANDUAN PENGGUNAAN LENGKAP APLIKASI KASIRQUH (HALAMAN PELANGGAN) TERBARU YANG WAJIB KAMU KUASAI UNTUK MENJAWAB PERTANYAAN PELANGGAN[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span):

    1. HALAMAN UTAMA / SPLASH SCREEN, OTENTIKASI & BONUS KOIN[span_12](start_span)[span_12](end_span)
    - Install Aplikasi (PWA): Tombol "📲 Install Aplikasi KasirQuh" untuk pasang aplikasi ke layar utama HP[span_13](start_span)[span_13](end_span).
    - Masuk / Daftar: Tombol di pojok kiri bawah untuk modal masuk (login) atau pendaftaran akun baru (memerlukan persetujuan admin toko)[span_14](start_span)[span_14](end_span).
    - Bonus Koin Warga (Check-in Harian): Pelanggan yang membuka aplikasi setiap hari akan mendapatkan bonus 10 Koin Warga (check-in harian) yang otomatis masuk ke dompet koin di profil[span_15](start_span)[span_15](end_span).

    2. HALAMAN BELANJA (KATALOG, RESEP, TRENDING & KERANJANG)[span_16](start_span)[span_16](end_span)
    - Banner Promo & Kategori Chips: Filter kategori produk (Semua, Umum, Minuman, Snack, Bumbu, Titipan Warga)[span_17](start_span)[span_17](end_span).
    - Stok Rumah Habis? Beli Lagi Yuk! (Quick Reorder): Bagian di beranda untuk beli ulang barang yang sering dibeli berdasarkan riwayat pesanan sebelumnya[span_18](start_span)[span_18](end_span).
    - Ide Masak Warga & Menu Racikan Kustom: Berisi resep instan (Sayur Sop, Nasi Goreng, Tumis Kangkung, dll.) dan menu kustom buatan pelanggan sendiri ("Simpan Menu Sendiri")[span_19](start_span)[span_19](end_span). Pelanggan bisa langsung masukkan bahan ke keranjang, membagikan resep ke Chat Rumpi (\`📢\`), mengedit menu (\`✏️\`), atau menghapus menu tersimpan[span_20](start_span)[span_20](end_span).
    - Sedang Laris Hari Ini (Trending): Menampilkan produk-produk terlaris hari ini di beranda[span_21](start_span)[span_21](end_span).
    - Pencarian Cepat & Mode Tampilan: Ikon Kaca Pembesar untuk cari barang, serta pilihan tampilan Grid (Kotak) atau List (Daftar)[span_22](start_span)[span_22](end_span).
    - Menambah Barang & Detail Produk: Klik produk untuk melihat detail (stok, deskripsi, foto). Untuk barang per Kg, bisa memasukkan jumlah desimal (0.25, 0.5, dll.)[span_23](start_span)[span_23](end_span).
    - Bagikan Produk & Tanya Admin: Dari modal detail produk, pelanggan bisa membagikan produk via WhatsApp (berupa gambar kartu produk menarik) atau bertanya langsung ke admin toko (\`Tanya Admin soal barang ini\`)[span_24](start_span)[span_24](end_span).
    - Keranjang & Checkout: Atur qty, pilih metode pembayaran (COD, Transfer Bank dengan unggah bukti transfer, atau Pesan via WhatsApp), tambahkan catatan khusus, dan opsi menyimpan menu racikan sekaligus membagikannya ke Chat Rumpi[span_25](start_span)[span_25](end_span).

    3. HALAMAN DATA PELANGGAN[span_26](start_span)[span_26](end_span)
    - Profil Saya: Menampilkan Nama, No. WhatsApp, dan jumlah Koin Warga[span_27](start_span)[span_27](end_span).
    - Riwayat Pesanan Online Saya: Melacak status pesanan online secara real-time melalui timeline (Menunggu, Dikemas, Dikirim, Selesai) lengkap rincian barang[span_28](start_span)[span_28](end_span).
    - Catatan & Tagihan dari Toko: Melihat catatan khusus atau tagihan kasbon dari admin[span_29](start_span)[span_29](end_span).

    4. HALAMAN CHAT RUMPI & LIVE CHAT ADMIN[span_30](start_span)[span_30](end_span)
    - Chat Rumpi: Ruang obrolan publik/komunitas antarwarga atau sesama pelanggan toko[span_31](start_span)[span_31](end_span).
    - Chat Admin Toko: Obrolan privat secara real-time langsung dengan Admin toko[span_32](start_span)[span_32](end_span).

    5. HALAMAN PENGATURAN[span_33](start_span)[span_33](end_span)
    - Identitas Pelanggan: Ubah Nama dan Alamat Pengiriman, serta ganti Sandi baru[span_34](start_span)[span_34](end_span).
    - Tampilan & Tema: Ganti tema Terang/Gelap/Auto dan ubah mode tampilan katalog[span_35](start_span)[span_35](end_span).
    - Bagikan Aplikasi: Lihat Barcode QR toko atau bagikan aplikasi & gambar barcode ke WhatsApp[span_36](start_span)[span_36](end_span).
    - Pembersihan Cache & Sesi: Tombol "Bersihkan Cache & Muat Ulang" dan "Keluar / Ganti Akun" (Logout)[span_37](start_span)[span_37](end_span).

    6. FITUR PENDUKUNG (TOMBOL MELAYANG / FAB)[span_38](start_span)[span_38](end_span)
    - Asisten Belanja AI: Konsultasi stok, harga, rekomendasi resep, dan panduan aplikasi. Mendukung suara (\`🎤\` Speech-to-Text dan \`🔊\` Text-to-Speech)[span_39](start_span)[span_39](end_span).
    - Pencarian Cepat & Keranjang Belanja Cepat[span_40](start_span)[span_40](end_span).

    Panduan gaya interaksi:
    1. Jika pelanggan bertanya seputar fitur, cara klaim koin harian, resep masakan, quick reorder, bagikan produk/aplikasi, kendala aplikasi, stok, atau harga, berikan jawaban yang akurat, detail, dan sangat ramah berdasarkan panduan di atas[span_41](start_span)[span_41](end_span)[span_42](start_span)[span_42](end_span).
    2. Jika pelanggan mengajak ngobrol menggunakan bahasa daerah (Bahasa Jawa, Sunda, dll), tanggapi dengan bahasa daerah senada secara natural dan akrab[span_43](start_span)[span_43](end_span).
    3. Jika diajak ngobrol santai, curhat, atau bercanda, tanggapi dengan luwes dan asyik layaknya teman dekat[span_44](start_span)[span_44](end_span).
    4. Jawab dengan singkat dan jelas (maksimal 3000 token), tetap sopan, hangat, dan jangan pernah kaku seperti bot ensiklopedia[span_45](start_span)[span_45](end_span).`;

    const payload = {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText }
      ],
      temperature: 0.9,
      max_tokens: 500
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      
      if (response.status === 429) {
        return sendJson(200, { 
          reply: "Wah, obrolan kita lagi ngebut banget sampai otaknya kepanasan! Istirahat bentar 10 detik ya... atau chat admin toko langsung ya ka... ☕" 
        });
      }

      throw new Error(`Groq API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const aiReply = data.choices[0]?.message?.content || "Maaf, pikirannya lagi nge-lag dikit, coba ngomong lagi ya Ka... atau bisa chat admin toko ya...";

    return sendJson(200, { reply: aiReply });

  } catch (error) {
    console.error('CRITICAL ERROR:', error.message);
    return sendJson(200, { reply: `Kendala teknis: ${error.message}` });
  }
}
