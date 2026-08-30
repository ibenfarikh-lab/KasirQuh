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

  let promptText = '';
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    promptText = body.prompt || body.pesan || body.message || body.text || '';
    const daftarProduk = body.daftarProduk || '';
    const namaToko = body.namaToko || 'KasirQuh';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return sendJson(200, { reply: "API Key Gemini belum diatur di Environment Variables Vercel." });
    }

    if (!promptText) {
      return sendJson(200, { reply: "Pesan tidak boleh kosong." });
    }

    const fullPrompt = `Kamu adalah asisten virtual toko online "${namaToko}" yang super ramah, asyik, gaul, santai, dan ekspresif. Gunakan emoji secukupnya agar obrolan lebih hidup dan hangat.
Berikut adalah daftar produk dan stok toko saat ini:
${daftarProduk}

Tugasmu: Jawab pertanyaan pelanggan ("${promptText}") secara interaktif, natural, dan akurat berdasarkan data produk di atas. Jangan kaku seperti robot.`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }]
      })
    });

    const data = await apiResponse.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return sendJson(200, { reply: `Maaf Kak, kendala sistem AI: ${data.error.message || 'Kesalahan'}` });
    }

    let rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawReply) {
      return sendJson(200, { reply: `Halo Kak! Wah, ${namaToko} siap bantu jawab pertanyaan tentang "${promptText}". Ada produk spesifik yang dicari? 😊` });
    }

    let cleanedReply = rawReply
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();

    return sendJson(200, { reply: cleanedReply });
  } catch (error) {
    console.error('CRITICAL CATCH ERROR:', error.message, error.stack);
    return sendJson(200, { reply: `Maaf Kak, terjadi kendala teknis: ${error.message}` });
  }
}
