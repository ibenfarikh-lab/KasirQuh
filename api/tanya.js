import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = req.body.prompt || req.body.pesan || req.body.message || req.body.text;
    const daftarProduk = req.body.daftarProduk || '';
    const namaToko = req.body.namaToko || 'KasirQuh';

    if (!prompt) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    const fullPrompt = `Kamu adalah asisten virtual toko online "${namaToko}" yang super ramah, asyik, gaul, santai, dan ekspresif (gunakan emoji secukupnya agar obrolan lebih hidup, hangat, dan tidak kaku). 
Berikut adalah daftar produk dan stok toko saat ini:
${daftarProduk}

Tugasmu: Jawab pertanyaan pelanggan dengan akurat berdasarkan data produk di atas. Jangan kaku seperti robot, bicaralah layaknya penjaga toko online yang asyik diajak ngobrol, solutif, dan menggunakan bahasa Indonesia yang natural.
Pertanyaan pelanggan: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', 
      contents: fullPrompt,
    });

    let rawReply = response.text || '';
    
    // Membersihkan spasi di setiap baris secara total agar rata kiri
    let cleanedReply = rawReply
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();

    return res.status(200).json({ reply: cleanedReply });
  } catch (error) {
    console.error('Error detail:', error);
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan pada server.' });
  }
}
