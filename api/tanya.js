import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "API Key Gemini belum diatur di Environment Variables Vercel." });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = req.body.prompt || req.body.pesan || req.body.message || req.body.text;
    const daftarProduk = req.body.daftarProduk || '';
    const namaToko = req.body.namaToko || 'KasirQuh';

    if (!prompt) {
      return res.status(200).json({ reply: 'Pesan tidak boleh kosong.' });
    }

    const fullPrompt = `Kamu adalah asisten virtual toko online "${namaToko}" yang super ramah, asyik, gaul, santai, dan ekspresif (gunakan emoji secukupnya agar obrolan lebih hidup, hangat, dan tidak kaku). 
Berikut adalah daftar produk dan stok toko saat ini:
${daftarProduk}

Tugasmu: Jawab pertanyaan pelanggan dengan akurat berdasarkan data produk di atas. Jangan kaku seperti robot, bicaralah layaknya penjaga toko online yang asyik diajak ngobrol, solutif, dan menggunakan bahasa Indonesia yang natural.
Pertanyaan pelanggan: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: fullPrompt,
    });

    let rawReply = response.text || '';
    
    let cleanedReply = rawReply
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();

    return res.status(200).json({ reply: cleanedReply || "Halo Kak! Ada yang bisa saya bantu?" });
  } catch (error) {
    console.error('Error detail:', error);
    return res.status(200).json({ reply: "Maaf Kak, saat ini asisten AI sedang istirahat sebentar. Silakan tanyakan langsung ke admin ya! 😊" });
  }
}
