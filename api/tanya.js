import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Mendukung berbagai kemungkinan nama variabel dari frontend (/html)
    const pesanUser = req.body.pesan || req.body.message || req.body.text || req.body.prompt;

    if (!pesanUser) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: pesanUser,
    });

    return res.status(200).json({ jawaban: response.text });
  } catch (error) {
    console.error('Error detail:', error);
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan pada server.' });
  }
}
