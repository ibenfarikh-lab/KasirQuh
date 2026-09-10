// api/admin-ai.js - Groq API Integration untuk AI Admin KasirQuh
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
    return sendJson(405, { error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const promptText = body.prompt || body.pesan || body.message || body.text || '';
    const daftarProduk = body.daftarProduk || 'Tidak ada data produk yang dikirim dari halaman admin.';
    const namaToko = body.namaToko || 'KasirQuh';

    if (!promptText) {
      return sendJson(200, { reply: 'Halo, Ka! Mau cek stok, harga, produk, atau ngobrol santai dulu? 😁' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return sendJson(500, { error: 'GROQ_API_KEY belum diset di Environment Variables Vercel.' });
    }

    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    // Rapikan data produk sebelum dikirim ke Groq.
    // Kalau katalog besar, jangan kirim seluruh database ke prompt karena bisa
    // membuat request terlalu berat. Pilih data yang paling relevan dengan pertanyaan.
    let products = [];
    try {
      const parsed = typeof daftarProduk === 'string' ? JSON.parse(daftarProduk) : daftarProduk;
      if (Array.isArray(parsed)) products = parsed;
    } catch (e) {
      products = [];
    }

    const q = promptText.toLowerCase();
    const stockQuestion = /stok|menipis|sedikit|habis|kosong|persediaan/.test(q);
    const priceQuestion = /harga|jual|beli|berapa rupiah|berapa harganya/.test(q);
    const productQuestion = /produk|barang|item|daftar/.test(q);

    let selected = products;

    // Untuk pertanyaan stok, prioritaskan barang dengan stok rendah/habis.
    if (stockQuestion && products.length) {
      selected = products.filter(p => Number(p.stok ?? 0) <= 5);
      if (!selected.length) selected = products.slice().sort((a, b) => Number(a.stok ?? 0) - Number(b.stok ?? 0)).slice(0, 50);
    }

    // Jika admin menyebut nama produk, prioritaskan produk yang namanya cocok.
    const mentioned = products.filter(p => {
      const name = String(p.nama || '').toLowerCase();
      return name && q.includes(name);
    });
    if (mentioned.length) selected = mentioned;

    // Batasi ukuran konteks agar request stabil.
    selected = selected.slice(0, stockQuestion ? 100 : (priceQuestion || productQuestion ? 150 : 80));

    const compactProducts = selected.map(p => ({
      kode: p.kode || p.barcode || '',
      nama: p.nama || '',
      kategori: p.kategori || '',
      harga: Number(p.harga ?? 0),
      hargaBeli: Number(p.hargaBeli ?? 0),
      stok: Number(p.stok ?? 0),
      satuan: p.satuan || '',
      barcode: p.barcode || ''
    }));

    let contextText = JSON.stringify(compactProducts);
    if (products.length > selected.length) {
      contextText += `\nCatatan: total produk di database ${products.length}; yang ditampilkan di konteks AI ${selected.length} produk paling relevan.`;
    }

    const systemPrompt = `Kamu adalah asisten AI di toko "${namaToko}" yang karakternya sangat ramah, gaul, santai, asyik, sopan, dan pintar nemenin ngobrol apa saja layaknya teman dekat yang menyenangkan. 
    Daftar produk & harga toko: ${contextText}. 

    BERIKUT ADALAH PANDUAN PENGGUNAAN LENGKAP APLIKASI KASIRQUH (HALAMAN PELANGGAN) YANG WAJIB KAMU KUASAI UNTUK MENJAWAB PERTANYAAN PELANGGAN:

    1. HALAMAN UTAMA / SPLASH SCREEN & OTENTIKASI
    - Install Aplikasi (PWA): Ada tombol "📲 Install Aplikasi KasirQuh" untuk pasang aplikasi ke layar utama HP (Home Screen) agar bisa diakses seperti aplikasi native.
    - Masuk / Daftar: Tombol di pojok kiri bawah untuk modal masuk (login) atau pendaftaran akun baru.
    - Login: Menggunakan No. WhatsApp dan Sandi.
    - Pendaftaran: Mengisi Nama Lengkap, No. WhatsApp, Alamat Pengiriman, dan Sandi. Akun baru akan berstatus Pending (Menunggu Persetujuan Admin) sebelum bisa dipakai login.

    2. HALAMAN BELANJA (KATALOG & KERANJANG)
    - Fitur Pencarian Cepat: Klik ikon Kaca Pembesar (Search) di tombol melayang (FAB) untuk membuka kolom pencarian nama barang.
    - Navigasi Halaman (Pagination): Gunakan tombol panah (◄ dan ►) di bar bawah untuk pindah halaman katalog produk.
    - Mode Tampilan: Katalog bisa diubah antara mode Kotak/Grid atau Daftar/List lewat Pengaturan.
    - Menambah Barang: Klik tombol (+) pada kartu produk. Khusus barang satuan Kilogram (Kg), akan muncul pop-up prompt untuk memasukkan jumlah desimal (misal: 1 untuk 1 kg, 0.5 untuk setengah kg, atau 0.1 untuk 1 ons).
    - Mengurangi/Membatalkan: Klik tombol (-) atau buka keranjang untuk menghapus item.
    - Keranjang & Checkout: Klik ikon Keranjang di tombol melayang untuk melihat total belanja. Metode pembayaran tersedia: COD (Bayar di Tempat), Transfer Bank (TF) dengan mengunggah foto bukti transfer, atau Pesan via WhatsApp. Pelanggan juga bisa menulis catatan khusus (misal: "ayam dipotong 8").

    3. HALAMAN DATA PELANGGAN (MENU HAMBURGER / TITIK TIGA DI POJOK KANAN BAWAH)
    - Profil Saya: Menampilkan informasi Nama, No. WhatsApp, dan Alamat pengiriman aktif.
    - Riwayat Pesanan Online Saya: Melihat daftar pesanan terdahulu beserta statusnya (Menunggu Diproses, Selesai, dll) dan rincian produknya.
    - Catatan & Tagihan dari Toko: Melihat catatan khusus atau catatan kasbon/tagihan dari Admin toko.

    4. HALAMAN CHAT RUMPI (OBROLAN WARGA)
    - Ruang obrolan publik/komunitas antarwarga atau sesama pelanggan toko.
    - Ada lencana (badge) merah di menu jika ada pesan baru dari warga lain.
    - Kirim pesan lewat kolom teks di bawah lalu tekan Kirim atau tombol Enter di keyboard HP.

    5. HALAMAN PENGATURAN
    - Install ke HP: Tombol instalasi PWA jika belum terpasang.
    - Identitas Pelanggan: Ubah Nama Lengkap, lihat No. WhatsApp (read-only), perbarui Alamat Pengiriman, atau ganti Sandi baru, lalu klik Simpan Perubahan.
    - Tampilan & Tema: Ganti tema (Terang / Gelap / Auto) dan ubah mode tampilan katalog (Kotak / Daftar).
    - Nada Dering Notifikasi: Pilih sumber suara notifikasi (Default Beep atau file audio .mp3/.wav dari HP).
    - Pembersihan Cache & Sesi: Bersihkan Cache & Muat Ulang untuk mengatasi kendala sistem, atau Keluar / Ganti Akun (Logout).

    6. FITUR PENDUKUNG: ASISTEN BELANJA AI & LIVE CHAT (TOMBOL MELAYANG / FAB)
    - Asisten Belanja AI (Ikon Pesan Ungu): Tempat konsultasi stok, harga, rekomendasi, atau tanya panduan aplikasi. Mendukung Speech-to-Text (mikrofon 🎤 untuk ngomong pakai suara) dan Text-to-Speech (tombol suara 🔊 agar AI membacakan balasan). Ada juga tombol pintas "Chat Admin".
    - Live Chat dengan Toko (Ikon Pesan Hijau): Obrolan privat langsung secara real-time dengan Admin toko, lengkap dengan tombol pintas "Tanya AI".

    Panduan gaya interaksi:
    1. Jika pelanggan bertanya seputar fitur, cara belanja, kendala aplikasi, stok, atau harga, berikan jawaban yang akurat, detail, dan sangat ramah berdasarkan panduan lengkap di atas.
    2. Jika pelanggan mengajak ngobrol menggunakan bahasa daerah (Bahasa Jawa, Sunda, dll), tanggapi dengan bahasa daerah senada secara natural dan akrab.
    3. Jika diajak ngobrol santai, curhat, atau bercanda, tanggapi dengan luwes dan asyik layaknya teman dekat.
    4. Jawab dengan singkat dan jelas (maksimal 3000 token), tetap sopan, hangat, dan jangan pernah kaku seperti bot ensiklopedia.

    TAMBAHAN KHUSUS UNTUK ADMIN / AI CO-PILOT:
    - Kamu sedang berbicara dengan ADMIN toko, bukan pelanggan.
    - Bantu admin seperti teman kerja yang pintar: cek stok, harga, produk, restock, dan analisis sederhana.
    - DATA PRODUK TOKO di atas adalah sumber utama untuk informasi produk.
    - Jika admin bertanya "stok aman?", "stok menipis?", "barang hampir habis?", "stok sedikit?", "barang habis?", atau sejenisnya, periksa angka stok yang tersedia.
    - Stok 0 berarti HABIS/KOSONG.
    - Secara default stok 5 atau kurang dianggap MENIPIS/PERLU DIPERHATIKAN, kecuali admin menyebut batas lain.
    - Jangan pernah mengatakan semua stok aman jika ada produk dengan stok 5 atau kurang.
    - Sebutkan nama barang + jumlah stok + satuannya dengan jelas.
    - Jika tidak ada barang dengan stok 5 atau kurang, katakan berdasarkan data yang tersedia stok tidak ada yang masuk batas menipis.
    - Jika ditanya harga, bedakan harga jual dan harga beli/modal sesuai data.
    - Jika ditanya produk tertentu, cari berdasarkan nama, kode, atau barcode jika tersedia.
    - Untuk analisis atau saran restock, bedakan FAKTA dari DATA TOKO dan SARAN dari AI.
    - Jangan mengarang omzet, transaksi, keuntungan, stok, harga, atau data lain yang tidak diberikan.
    - Jika data yang dibutuhkan tidak tersedia, katakan dengan jujur bahwa data tersebut belum tersedia.
    - Jika admin bercanda atau mengajak ngobrol, balas tetap santai, gaul, natural, dan menyenangkan seperti karakter AI pelanggan.
    - Jika admin memakai Bahasa Jawa, Sunda, atau campuran bahasa daerah, balas senada secara natural.
    - Jangan kaku. Untuk pertanyaan sederhana, jawab singkat. Untuk analisis, gunakan poin-poin agar mudah dibaca.
    - Jangan mengaku dapat mengakses Firestore secara langsung. Kamu hanya mengetahui data yang dikirimkan dalam konteks ini.`;

    const makePayload = (context) => ({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt.replace(contextText, context) },
        { role: 'user', content: promptText }
      ],
      temperature: 0.9,
      max_tokens: 500
    });

    let response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(makePayload(contextText))
    });

    // Jika request terlalu berat/ditolak, coba sekali lagi dengan konteks super-ringkas.
    if (!response.ok && (response.status === 400 || response.status === 413)) {
      const smaller = JSON.stringify(compactProducts.slice(0, 30));
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(makePayload(smaller))
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', response.status, errText);

      if (response.status === 401) {
        return sendJson(500, { error: 'GROQ_API_KEY tidak valid atau sudah kedaluwarsa.' });
      }
      if (response.status === 429) {
        // Jangan biarkan pertanyaan data toko gagal total hanya karena Groq sedang rate-limit.
        // Untuk pertanyaan stok/harga/produk, jawab langsung dari data Firestore yang sudah dikirim.
        if (stockQuestion || priceQuestion || productQuestion || mentioned.length) {
          const lowStock = products
            .filter(p => Number(p.stok ?? 0) <= 5)
            .sort((a, b) => Number(a.stok ?? 0) - Number(b.stok ?? 0));

          if (stockQuestion) {
            if (mentioned.length) {
              const rows = mentioned.map(p => `- ${p.nama || 'Produk'}: ${Number(p.stok ?? 0)} ${p.satuan || 'pcs'}`);
              return sendJson(200, { reply: `Siap Ka 😎 Dari data stok yang masuk:\n${rows.join('\n')}\n\n${mentioned.some(p => Number(p.stok ?? 0) <= 5) ? '⚠️ Ada yang perlu diperhatikan karena stoknya 5 atau kurang.' : '✅ Stoknya masih di atas batas menipis.'}` });
            }
            if (lowStock.length) {
              const rows = lowStock.slice(0, 30).map(p => `- ${p.nama || 'Produk'}: ${Number(p.stok ?? 0)} ${p.satuan || 'pcs'}`);
              return sendJson(200, { reply: `Ka, dari data stok terbaru, ini yang perlu diperhatikan 👀📦\n${rows.join('\n')}\n\nBatas menipis default: 5 atau kurang.` });
            }
            return sendJson(200, { reply: 'Aman Ka 😎 Berdasarkan data produk yang masuk, belum ada stok yang 5 pcs atau kurang.' });
          }

          if (priceQuestion && mentioned.length) {
            const rows = mentioned.map(p => `- ${p.nama || 'Produk'}: harga jual Rp ${Number(p.harga ?? 0).toLocaleString('id-ID')} | harga beli/modal Rp ${Number(p.hargaBeli ?? 0).toLocaleString('id-ID')}`);
            return sendJson(200, { reply: `Siap Ka 😎\n${rows.join('\n')}` });
          }

          if (mentioned.length) {
            const rows = mentioned.map(p => `- ${p.nama || 'Produk'} | stok ${Number(p.stok ?? 0)} ${p.satuan || 'pcs'} | harga Rp ${Number(p.harga ?? 0).toLocaleString('id-ID')}`);
            return sendJson(200, { reply: `Nih Ka, data yang ketemu 👇\n${rows.join('\n')}\n\nGroq lagi kena batas request, jadi untuk sementara aku ambil langsung dari data toko yang masuk. 😅` });
          }
        }

        return sendJson(200, { reply: 'Wah, otak AI lagi kena batas request sebentar, Ka 😅 Data toko tetap aman. Coba lagi beberapa detik ya.' });
      }
      if (response.status === 413) {
        return sendJson(200, { reply: 'Data produk yang dikirim terlalu besar, Ka. Aku sudah coba mengecilkan datanya tapi masih ditolak server.' });
      }
      return sendJson(500, { error: `Server AI menolak permintaan (${response.status}). Coba lagi sebentar ya, Ka.` });
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content?.trim();

    if (!aiReply) {
      return sendJson(200, {
        reply: 'Maaf Ka, AI belum menghasilkan jawaban. Coba tanyakan lagi ya. 😁'
      });
    }

    return sendJson(200, { reply: aiReply });
  } catch (error) {
    console.error('CRITICAL ADMIN AI ERROR:', error.message);
    return sendJson(500, { error: 'Gagal terhubung ke server AI. Coba lagi sebentar ya, Ka.' });
  }
}
