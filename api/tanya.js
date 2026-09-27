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
    const namaToko = body.namaToko || 'Toko';
    const firebaseIdToken = typeof body.firebaseIdToken === 'string' ? body.firebaseIdToken.trim() : '';

    // AI product context is resolved server-side from Firestore using the
    // authenticated customer's Firebase ID token. This keeps the customer
    // catalog from having to load the whole product collection into memory.
    async function loadRelevantProducts() {
      if (!firebaseIdToken) return [];

      const projectId = 'kasirquh';
      const parent = `projects/${projectId}/databases/(default)/documents/toko/toko_v13`;
      const endpoint = `https://firestore.googleapis.com/v1/${parent}:runQuery`;
      const normalized = String(promptText).toLowerCase().trim();
      const tokens = [...new Set(
        normalized
          .replace(/[^\p{L}\p{N}]+/gu, ' ')
          .split(/\s+/)
          .filter(word => word.length >= 3 && !['berapa','adakah','yang','dan','atau','untuk','dengan','saya','mau','beli','punya','ada','stok','harga','jual','cari','barang','produk','toko','menu'].includes(word))
          .slice(0, 4)
      )];

      const runQuery = async (whereClause) => {
        const structuredQuery = {
          from: [{ collectionId: 'produk' }],
          orderBy: [{ field: { fieldPath: 'nama' }, direction: 'ASCENDING' }],
          limit: 6
        };
        if (whereClause) structuredQuery.where = whereClause;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firebaseIdToken}`
          },
          body: JSON.stringify({ structuredQuery })
        });
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`Firestore query failed (${response.status}): ${detail}`);
        }
        return response.json();
      };

      const results = [];
      const seen = new Set();

      // Firestore has no native substring/contains query. Prefix queries let
      // the API retrieve only small, relevant slices without downloading all products.
      for (const token of tokens) {
        // Firestore string ordering is case-sensitive, so probe the common
        // lower-case and capitalized forms without widening into a full scan.
        const variants = [...new Set([token, token.charAt(0).toUpperCase() + token.slice(1)])];
        for (const variant of variants) {
          const rows = await runQuery({
            fieldFilter: {
              field: { fieldPath: 'nama' },
              op: 'GREATER_THAN_OR_EQUAL',
              value: { stringValue: variant }
            }
          });
          for (const row of rows) {
            const doc = row.document;
            if (!doc?.name) continue;
            const code = doc.name.split('/').pop();
            if (seen.has(code)) continue;
            const f = doc.fields || {};
            const nama = f.nama?.stringValue || '';
            if (!nama.toLowerCase().startsWith(token)) continue;
            seen.add(code);
            results.push({
              code,
              nama,
              kategori: f.kategori?.stringValue || 'Umum',
              satuan: f.satuan?.stringValue || 'Pcs',
              stok: Number(f.stok?.doubleValue ?? f.stok?.integerValue ?? 0),
              hargaJual: Number(f.hargaJual?.doubleValue ?? f.hargaJual?.integerValue ?? f.harga?.doubleValue ?? f.harga?.integerValue ?? 0),
              hargaRtg: Number(f.hargaRtg?.doubleValue ?? f.hargaRtg?.integerValue ?? 0)
            });
            if (results.length >= 12) return results;
          }
        }
      }

      // If the question is product-related but no name prefix matched, return
      // only a small catalog sample rather than the entire collection.
      const productWords = ['stok','harga','jual','beli','minta','berapa','cari','menu','list','barang','produk','toko','punya'];
      if (!results.length && productWords.some(word => normalized.includes(word))) {
        const rows = await runQuery(null);
        for (const row of rows) {
          const doc = row.document;
          if (!doc?.name) continue;
          const code = doc.name.split('/').pop();
          if (seen.has(code)) continue;
          const f = doc.fields || {};
          seen.add(code);
          results.push({
            code,
            nama: f.nama?.stringValue || '',
            kategori: f.kategori?.stringValue || 'Umum',
            satuan: f.satuan?.stringValue || 'Pcs',
            stok: Number(f.stok?.doubleValue ?? f.stok?.integerValue ?? 0),
            hargaJual: Number(f.hargaJual?.doubleValue ?? f.hargaJual?.integerValue ?? f.harga?.doubleValue ?? f.harga?.integerValue ?? 0),
            hargaRtg: Number(f.hargaRtg?.doubleValue ?? f.hargaRtg?.integerValue ?? 0)
          });
        }
      }
      return results;
    }

    let daftarProduk = 'Tidak ada data produk yang relevan.';
    try {
      const relevantProducts = await loadRelevantProducts();
      if (relevantProducts.length) {
        daftarProduk = relevantProducts.map(p => {
          let harga = p.hargaJual || 0;
          let satuan = p.satuan || 'Pcs';
          if (satuan.toLowerCase() === 'kg' || satuan.toLowerCase() === 'kilogram') {
            harga = p.hargaRtg || harga * 10;
            satuan = 'kg';
          } else if (satuan.toLowerCase() === 'rtg') {
            satuan = 'pcs';
          }
          return `- ${p.nama}: Rp ${harga.toLocaleString('id-ID')}, Stok: ${p.stok || 0} ${satuan}`;
        }).join('\n');
      }
    } catch (firestoreError) {
      console.error('AI Firestore lookup failed:', firestoreError.message);
    }

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
