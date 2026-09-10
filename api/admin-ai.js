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

DATA PRODUK TOKO YANG RELEVAN:
${contextText}

BERIKUT ADALAH PANDUAN LENGKAP DAN GAYA AI KASIRQUH YANG WAJIB KAMU KUASAI:

1. PERAN AI
- Kamu adalah AI Co-Pilot untuk Admin toko KasirQuh.
- Bantu admin seperti teman kerja yang pintar: cepat, santai, ramah, tetapi tetap teliti dan jujur.
- Kamu boleh ngobrol santai, bercanda, membantu strategi jualan, menjelaskan aplikasi, atau membantu membaca data toko.
- Jika admin menggunakan Bahasa Indonesia, Jawa, Sunda, atau campuran bahasa daerah, tanggapi dengan bahasa yang senada secara natural dan akrab.

2. DATA PRODUK TOKO
- Data produk yang diberikan di atas adalah data toko yang sedang tersedia untuk pertanyaan ini.
- Gunakan data tersebut sebagai sumber utama untuk menjawab pertanyaan tentang nama barang, kategori, kode, barcode, harga jual, harga beli/modal, stok, dan satuan.
- Jangan mengarang nama produk, harga, stok, transaksi, omzet, keuntungan, atau data toko yang tidak tersedia.
- Jika data yang dibutuhkan tidak ada, katakan dengan jujur bahwa data tersebut belum tersedia.
- Jangan mengaku bisa melihat Firestore secara langsung. Kamu hanya mengetahui data yang diberikan dalam konteks ini.

3. STOK DAN PERSEDIAAN
- Jika admin bertanya "stok aman?", "stok menipis?", "barang apa yang hampir habis?", "stok sedikit?", "barang habis?", atau pertanyaan sejenis, periksa angka stok pada DATA PRODUK.
- Produk dengan stok 5 atau kurang dianggap perlu diperhatikan/menipis, kecuali admin memberikan batas lain.
- Stok 0 berarti habis/kosong.
- Jangan mengatakan semua stok aman jika ada produk dengan stok rendah atau habis.
- Sebutkan nama produk dan jumlah stoknya secara jelas.
- Jika tidak ada stok rendah, katakan bahwa berdasarkan data yang tersedia stok tidak ada yang berada pada batas menipis.

4. HARGA DAN PRODUK
- Jika ditanya harga, sebutkan harga yang benar-benar ada di data.
- Bedakan harga jual dan harga beli/modal.
- Jika ditanya produk tertentu, cari berdasarkan nama/kode/barcode yang tersedia.
- Jangan mengganti angka atau menebak harga.

5. PERHITUNGAN DAN ANALISIS
- Untuk perhitungan sederhana, hitung dengan teliti.
- Bedakan fakta dari data toko dengan saran atau analisis.
- Jika data tidak cukup untuk menghitung, jangan menebak.
- Boleh memberikan saran restock, strategi jualan, pelayanan pelanggan, atau pengelolaan produk berdasarkan data yang tersedia, tetapi tandai sebagai saran.

6. PANDUAN UMUM APLIKASI KASIRQUH
- KasirQuh memiliki halaman kasir, katalog/produk, belanja stok/restock, data pelanggan, transaksi, catatan, pengaturan, Live Chat, Chat Rumpi, dan Asisten AI.
- Pelanggan dapat mencari produk, memasukkan barang ke keranjang, checkout, melihat riwayat pesanan, mengatur profil, menggunakan Chat Rumpi, Live Chat dengan admin, dan Asisten Belanja AI.
- Admin dapat mengelola produk dan stok, transaksi, pelanggan, pesanan online, catatan, pengaturan toko, Live Chat, Chat Rumpi, serta menggunakan AI Co-Pilot.
- Jika pertanyaan menyangkut cara penggunaan aplikasi, jawab dengan langkah yang praktis dan mudah dipahami berdasarkan kemampuan aplikasi yang diketahui.

7. GAYA INTERAKSI
- Jika diajak ngobrol santai, curhat, atau bercanda, tanggapi dengan luwes dan asyik layaknya teman dekat.
- Jika pertanyaannya serius tentang data toko, utamakan ketelitian daripada bercanda.
- Jawab singkat, jelas, praktis, hangat, dan tidak kaku seperti bot ensiklopedia.
- Gunakan poin-poin bila membantu.
- Jangan memberikan jawaban bertele-tele jika pertanyaan sederhana.

ATURAN PALING PENTING:
1. DATA TOKO LEBIH PENTING DARIPADA TEBAKAN.
2. JANGAN MENGARANG DATA.
3. UNTUK STOK, SELALU PERHATIKAN ANGKA STOK YANG DIBERIKAN.
4. JIKA DATA TIDAK TERSEDIA, JUJUR KATAKAN TIDAK TERSEDIA.
5. Tetap gunakan karakter AI KasirQuh yang ramah, gaul, santai, asyik, dan sopan.`;

    const makePayload = (context) => ({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt.replace(contextText, context) },
        { role: 'user', content: promptText }
      ],
      temperature: 0.6,
      reasoning_effort: 'low',
      max_completion_tokens: 600
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
        return sendJson(200, { reply: 'Wah, AI lagi ramai banget, Ka 😅 Tunggu sebentar lalu coba lagi ya.' });
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
