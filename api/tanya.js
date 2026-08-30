export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed' });
  }

  const { prompt, daftarProduk, namaToko } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ reply: "API Key Gemini belum diatur di Environment Variables Vercel." });
  }

  if (!prompt) {
    return res.status(200).json({ reply: "Pesan tidak boleh kosong." });
  }

  try {
    const fullPrompt = `Kamu adalah asisten virtual toko online "${namaToko || 'KasirQuh'}" yang super ramah, asyik, gaul, santai, dan ekspresif. Gunakan emoji secukupnya agar obrolan lebih hidup dan hangat. 
Berikut adalah daftar produk dan stok toko saat ini:
${daftarProduk || 'Tidak ada data produk'}

Tugasmu: Jawab pertanyaan pelanggan ("${prompt}") secara interaktif, natural, dan akurat berdasarkan data produk di atas. Jangan kaku seperti robot.`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ]
      })
    });

    const data = await apiResponse.json();
    
    // Ekstraksi teks yang jauh lebih fleksibel dari berbagai struktur respons Gemini
    let rawReply = "";
    try {
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawReply = data.candidates[0].content.parts[0].text;
      } else if (data.candidates?.[0]?.output) {
        rawReply = data.candidates[0].output;
      } else if (data.text) {
        rawReply = data.text;
      } else if (data.output) {
        rawReply = data.output;
      }
    } catch (e) {
      console.error("Parsing error:", e);
    }

    if (!rawReply) {
      rawReply = `Halo Kak! Wah, ${namaToko || 'toko'} siap bantu jawab pertanyaan tentang "${prompt}". Ada produk spesifik yang sedang dicari? 😊`;
    }

    let cleanedReply = rawReply
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();

    return res.status(200).json({ reply: cleanedReply });
  } catch (error) {
    console.error('Error detail:', error);
    return res.status(200).json({ reply: `Halo Kak! Terkait "${prompt}", silakan tanyakan langsung ke admin ya biar dibantu lebih cepat! 😊` });
  }
}
