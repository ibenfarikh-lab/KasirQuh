export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prompt = req.body.prompt || req.body.pesan || req.body.message || req.body.text;
    const daftarProduk = req.body.daftarProduk || '';
    const namaToko = req.body.namaToko || 'KasirQuh';

    if (!prompt) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    // Menggunakan Groq API dengan native fetch (tanpa install package tambahan)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Model super pintar & gratis di Groq
        messages: [
          {
            role: 'system',
            content: `Kamu adalah Co-Pilot / partner bisnis digital paling cool, pinter, dan santai buat Admin toko online "${namaToko}". Tugasmu: Bantu Admin bedah stok, kasih masukan barang apa yang laku atau perlu restock, kasih ide strategi jualan, dan jawab pertanyaan operasional dengan gaya bahasa yang asyik, gaul, santai, tapi tetap tajam dan solutif pakai bahasa Indonesia natural dan emoji secukupnya.`
          },
          {
            role: 'user',
            content: `Data Stok Toko:\n${daftarProduk}\n\nPertanyaan Admin: "${prompt}"`
          }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal terhubung ke Groq AI');
    }

    let rawReply = data.choices[0]?.message?.content || '';
    
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
