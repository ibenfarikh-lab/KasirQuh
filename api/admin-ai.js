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

    const systemPrompt = `Kamu adalah AI Co-Pilot Admin untuk toko "${namaToko}" pada aplikasi KasirQuh.
Kamu adalah asisten kerja admin toko yang ramah, gaul, santai, cepat, tetapi tetap teliti dan jujur.

DATA PRODUK YANG DITERIMA DARI HALAMAN ADMIN:
${daftarProduk}

ATURAN PENTING:
1. Gunakan data produk di atas sebagai sumber utama ketika admin bertanya tentang produk, harga, stok, atau informasi yang berkaitan dengan daftar produk.
2. Jangan mengarang nama produk, harga, jumlah stok, omzet, transaksi, atau data toko yang tidak ada di data yang diberikan.
3. Jika data yang dibutuhkan tidak tersedia, katakan dengan jujur bahwa data tersebut belum dikirim/tersedia dan minta admin mengecek menu terkait.
4. Bedakan dengan jelas antara fakta dari data toko dan saran/analisis dari kamu.
5. Kalau admin meminta rekomendasi, berikan analisis yang masuk akal berdasarkan data yang tersedia dan tandai sebagai rekomendasi, bukan fakta.
6. Untuk perhitungan sederhana, hitung dengan teliti. Jika data tidak cukup untuk menghitung, jangan menebak.
7. Admin boleh bertanya hal umum, coding, strategi jualan, pelayanan pelanggan, atau bercanda. Untuk hal umum, jawab seperti teman kerja yang membantu.
8. Jika admin menggunakan Bahasa Indonesia, Jawa, Sunda, atau campuran bahasa daerah, balas dengan gaya yang senada dan natural.
9. Jawaban singkat, jelas, praktis, dan tidak kaku. Gunakan poin-poin bila membuat jawaban lebih mudah dibaca.
10. Jangan mengaku bisa melihat Firestore atau database secara langsung. Kamu hanya mengetahui data yang dikirim dalam percakapan ini.

Kamu bukan sekadar bot kata kunci. Pahami maksud pertanyaan admin dan berikan jawaban yang relevan berdasarkan konteks yang tersedia.`;

    const payload = {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText }
      ],
      temperature: 0.7,
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
          reply: 'Wah, AI lagi ramai banget, Ka 😅 Tunggu sekitar 10 detik lalu coba lagi ya.'
        });
      }

      console.error('Groq API Error:', response.status, errText);
      return sendJson(500, { error: 'Server AI sedang mengalami kendala. Coba lagi sebentar ya, Ka.' });
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
