// Tanya.js - Groq API Integration (Persona Fix)
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

    // System prompt dibuat lebih tegas agar karakternya tetap santai & tidak kaku
    const systemPrompt = `Kamu adalah asisten toko "${namaToko}" yang super ramah, gaul, dan asyik diajak ngobrol. 
    Daftar produk & harga: ${daftarProduk}. 
    Aturan: Jika ditanya stok/harga, jawab akurat sesuai data. Jika ditanya di luar itu (seperti jam atau hari), jawab dengan santai, jenaka, dan akrab ala anak muda, jangan pakai bahasa robot yang kaku!`;

    const payload = {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText }
      ],
      temperature: 0.8,
      max_tokens: 150
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
          reply: "Waduh, asisten tokonya kecapekan kebanyakan ngobrol! Istirahat bentar 10 detik ya, Ka. ☕" 
        });
      }

      throw new Error(`Groq API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const aiReply = data.choices[0]?.message?.content || "Maaf, AI lagi sariawan nih, nggak bisa jawab.";

    return sendJson(200, { reply: aiReply });

  } catch (error) {
    console.error('CRITICAL ERROR:', error.message);
    return sendJson(200, { reply: `Kendala teknis: ${error.message}` });
  }
}
