// Tanya.js - Groq API Integration (Token Optimized)
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
      return sendJson(200, { reply: "Silakan ketik pertanyaanmu, Ka!" });
    }

    const apiKey = process.env.GROQ_API_KEY; 
    if (!apiKey) {
      return sendJson(200, { reply: "Duh, API Key Groq di environment variables belum diset, Ka!" });
    }

    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const systemPrompt = `Asisten "${namaToko}". Stok/Harga: ${daftarProduk}. Jawab singkat, jelas, ramah.`;

    const payload = {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText }
      ],
      temperature: 0.7,
      max_tokens: 150 // Diturunkan agar hemat token per menit
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
      throw new Error(`Groq API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const aiReply = data.choices[0]?.message?.content || "Maaf, AI sedang tidak bisa merespons.";

    return sendJson(200, { reply: aiReply });

  } catch (error) {
    console.error('CRITICAL ERROR:', error.message);
    return sendJson(200, { reply: `Kendala teknis: ${error.message}` });
  }
}
