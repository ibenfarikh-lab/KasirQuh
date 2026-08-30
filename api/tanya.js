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
    const systemInstruction = `Kamu adalah asisten virtual toko online "${namaToko || 'KasirQuh'}" yang super ramah, asyik, gaul, santai, dan ekspresif (gunakan emoji secukupnya agar obrolan lebih hidup, hangat, dan tidak kaku). 
Berikut adalah daftar produk dan stok toko saat ini:
${daftarProduk || 'Tidak ada data produk'}

Tugasmu: Jawab pertanyaan pelanggan dengan akurat berdasarkan data produk di atas. Jangan kaku seperti robot, bicaralah layaknya penjaga toko online yang asyik diajak ngobrol, solutif, dan menggunakan bahasa Indonesia yang natural.
Pertanyaan pelanggan: "${prompt}"`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemInstruction }]
          }
        ]
      })
    });

    const data = await apiResponse.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      let rawReply = data.candidates[0].content.parts[0].text;
      let cleanedReply = rawReply
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .trim();
      return res.status(200).json({ reply: cleanedReply });
    } else {
      console.error("Gemini API Error Response:", data);
      return res.status(200).json({ reply: "Halo Kak! Maaf, AI sedang memuat ulang. Silakan tanyakan sekali lagi ya! 😊" });
    }
  } catch (error) {
    console.error('Error detail:', error);
    return res.status(200).json({ reply: "Maaf Kak, saat ini asisten AI sedang istirahat sebentar. Silakan tanyakan langsung ke admin ya! 😊" });
  }
}
