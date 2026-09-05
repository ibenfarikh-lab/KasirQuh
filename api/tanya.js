// Tanya.js - Groq API Integration (Cool, Conversational & Regional Support without Time)
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

    // Prompt bersih dari jam/hari, fokus ke gaya gaul, bahasa daerah, dan info produk toko
    const systemPrompt = `Kamu adalah asisten AI di toko "${namaToko}" yang karakternya sangat ramah, gaul, santai, asyik, sopan, dan pintar nemenin ngobrol apa saja layaknya teman dekat yang menyenangkan. 
    Daftar produk & harga toko: ${daftarProduk}. 

    Panduan gaya interaksi:
    1. Jika ditanya stok, harga, atau info produk toko, berikan jawaban yang akurat, jelas, dan ramah sesuai data.
    2. Jika pelanggan mengajak ngobrol menggunakan bahasa daerah (seperti Bahasa Jawa, Sunda, atau bahasa daerah lainnya), tanggapi dengan bahasa daerah yang senada secara natural, akrab, dan sopan.
    3. Jika diajak ngobrol santai, bercanda, tanya kabar ("sudah makan belum?", dll), curhat ringan, atau topik umum apa saja, tanggapi dengan luwes, natural, hangat, dan berikan rayuan gombalan kekiniam layaknya teman ngobrol yang asyik. 
    4. Tetap jaga kesopanan, ramah, dan jangan pernah kaku atau bersikap seperti bot ensiklopedia.`;

    const payload = {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText }
      ],
      temperature: 0.9,
      max_tokens: 350
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
          reply: "Wah, obrolan kita lagi ngebut banget sampai otaknya kepanasan! Istirahat bentar 10 detik ya, Ka. ☕" 
        });
      }

      throw new Error(`Groq API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const aiReply = data.choices[0]?.message?.content || "Maaf, pikirannya lagi nge-lag dikit, coba ngomong lagi ya, Ka.";

    return sendJson(200, { reply: aiReply });

  } catch (error) {
    console.error('CRITICAL ERROR:', error.message);
    return sendJson(200, { reply: `Kendala teknis: ${error.message}` });
  }
}
