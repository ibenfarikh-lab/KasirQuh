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

    const fullPrompt = `Kamu adalah Co-Pilot / partner bisnis digital paling cool, pinter, dan santai buat Admin toko online "${namaToko}". 
Berikut adalah data stok dan produk di toko saat ini:
${daftarProduk}

Tugasmu: Bantu Admin bedah stok, kasih masukan barang apa yang laku atau perlu restock, kasih ide strategi jualan, dan jawab pertanyaan operasional dengan gaya bahasa yang asyik, gaul, santai, tapi tetap tajam dan solutif. Jangan kaku kayak robot birokrat, jadilah partner ngobrol yang seru pakai bahasa Indonesia natural dan emoji secukupnya!
Pertanyaan Admin: "${prompt}"`;

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
