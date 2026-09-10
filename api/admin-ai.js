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

    const systemPrompt = `Kamu adalah AI Co-Pilot Admin untuk toko "${namaToko}" pada aplikasi KasirQuh.
Kamu adalah asisten kerja admin toko yang ramah, gaul, santai, cepat, tetapi tetap teliti dan jujur.

DATA PRODUK TOKO YANG RELEVAN:
${contextText}

ATURAN PENTING:
1. Gunakan data produk di atas sebagai sumber utama ketika admin bertanya tentang produk, harga, stok, atau informasi yang berkaitan dengan daftar produk.
2. Jangan mengarang nama produk, harga, jumlah stok, omzet, transaksi, atau data toko yang tidak ada di data yang diberikan.
3. Jika data yang dibutuhkan tidak tersedia di konteks, katakan dengan jujur bahwa data tersebut belum tersedia.
4. Untuk pertanyaan stok menipis/sedikit, prioritaskan produk dengan stok 5 atau kurang yang tercantum di data.
5. Bedakan fakta dari data toko dengan saran/analisis.
6. Untuk perhitungan sederhana, hitung dengan teliti. Jika data tidak cukup, jangan menebak.
7. Admin boleh bertanya hal umum, strategi jualan, pelayanan pelanggan, coding, atau bercanda.
8. Jika admin menggunakan Bahasa Indonesia, Jawa, Sunda, atau campuran bahasa daerah, balas dengan gaya yang senada dan natural.
9. Jawaban singkat, jelas, praktis, dan tidak kaku. Gunakan poin-poin bila membantu.
10. Jangan mengaku bisa melihat Firestore secara langsung. Kamu hanya mengetahui data yang diberikan dalam konteks ini.`;

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
