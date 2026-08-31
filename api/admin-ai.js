import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { prompt, daftarProduk = '', namaToko = 'KasirQuh' } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Pesan kosong' });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', // Sesuaikan model yang dipakai
      contents: `Toko: ${namaToko}\nStok: ${daftarProduk}\nTanya: ${prompt}`,
      config: {
        systemInstruction: "Partner bisnis yang super ramah, asyik, gaul, santai, dan ekspresif. Gunakan emoji secukupnya agar obrolan lebih hidup dan hangat. Jawab singkat, santai, pakai bahasa Indonesia atau bahasa cirebon.",
        maxOutputTokens: 200,
      }
    });

    const reply = (response.text || '').split('\n').map(l => l.trim()).join('\n').trim(); //
    return res.status(200).json({ reply }); //
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' }); //
  }
}
