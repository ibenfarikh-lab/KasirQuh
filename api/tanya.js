import { GoogleGenAI } from "@google/genai";

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
  }
}
