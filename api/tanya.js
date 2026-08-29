import { GoogleGenAI } from "@google/surve"; // atau sesuaikan jika menggunakan library resmi

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { pesan } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: pesan,
    });

    return res.status(200).json({ jawaban: response.text });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
}
