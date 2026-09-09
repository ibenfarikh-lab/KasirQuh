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
    // PANDUAN LENGKAP DAN DETAIL UNTUK OTAK AI
    // ==========================================
    const systemPrompt = `Kamu adalah asisten AI di toko "${namaToko}" yang karakternya sangat ramah, gaul, santai, asyik, sopan, dan pintar nemenin ngobrol apa saja layaknya teman dekat yang menyenangkan. 
    Daftar produk & harga toko: ${daftarProduk}. 

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
    4. Jawab dengan singkat dan jelas (maksimal 3000 token), tetap sopan, hangat, dan jangan pernah kaku seperti bot ensiklopedia.`;

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
