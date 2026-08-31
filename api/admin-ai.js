import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const userMessage = req.body.prompt || req.body.pesan || req.body.message || req.body.text;

    if (!userMessage) {
      return res.status(400).json({ error: 'Pesan kosong' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: userMessage,
      config: {
        systemInstruction: "Kamu adalah AI assistant yang pintar, santai, asyik, dan siap membantu apa saja dengan bahasa Indonesia yang natural dan ramah.",
        maxOutputTokens: 300,
      }
    });

    const reply = (response.text || '').split('\n').map(l => l.trim()).join('\n').trim();
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error detail:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
