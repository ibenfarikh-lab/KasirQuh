import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Menerima data dari frontend
    const prompt = req.body.prompt || req.body.pesan || req.body.message || req.body.text;
    const daftarProduk = req.body.daftarProduk || '';
    const namaToko = req.body.namaToko || 'KasirQuh';

    if (!prompt) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    // Menyusun prompt lengkap dengan informasi produk dan toko di backend
    const fullPrompt = `Anda adalah asisten toko online "${namaToko}".\nBerikut adalah daftar produk dan stok toko saat ini:\n${daftarProduk}\n\nJawablah pertanyaan pelanggan berikut dengan ramah, akurat berdasarkan data produk di atas, dan gunakan bahasa Indonesia: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', 
      contents: fullPrompt,
    });

    // Membersihkan spasi/indentasi berlebih di awal setiap baris dari respons AI
    let rawReply = response.text || '';
    let cleanedReply = rawReply.trim().replace(/^[ \t]+/gm, '');

    return res.status(200).json({ reply: cleanedReply });
  } catch (error) {
    console.error('Error detail:', error);
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan pada server.' });
  }
}
