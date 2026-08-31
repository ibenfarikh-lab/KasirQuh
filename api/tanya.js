export default async function handler(req, res) {
  const sendJson = (statusCode, data) => {
    if (typeof res.status === 'function') {
      return res.status(statusCode).json(data);
    }
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  if (req.method !== 'POST') {
    return sendJson(405, { reply: 'Method not allowed' });
  }

  let promptText = '';
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    promptText = body.prompt || body.pesan || body.message || body.text || '';

    if (!promptText) {
      return sendJson(200, { reply: "Pesan tidak boleh kosong." });
    }

    const text = promptText.toLowerCase();
    let reply = "";

    // Sistem pencocokan kata kunci lokal (100% bebas token & tanpa API luar)
    if (text.includes('halo') || text.includes('hai') || text.includes('pagi') || text.includes('siang') || text.includes('malam')) {
      reply = "Halo juga Kak! Ada yang bisa dibantu buat hari ini? 😊";
    } else if (text.includes('stok') || text.includes('barang')) {
      reply = "Untuk cek detail stok barang, Kakak bisa langsung lihat di menu daftar produk ya! Biar datanya lebih akurat. 📦✨";
    } else if (text.includes('harga') || text.includes('jual') || text.includes('beli')) {
      reply = "Soal harga dan produk, semuanya sudah tercatat rapi di sistem kasir kita ya Kak. Ada detail lain yang mau dicek? 💰";
    } else if (text.includes('terima kasih') || text.includes('makasih') || text.includes('thanks')) {
      reply = "Sama-sama Kak! Semoga laris manis terus jualannya ya! 💪🚀";
    } else if (text.includes('siapa kamu') || text.includes('kamu siapa')) {
      reply = "Aku asisten digital lokal KasirQuh yang setia nemenin tanpa takut kuota token habis! 😎";
    } else {
      reply = `Wah, seru tuh! Tapi aku bot lokal versi santai nih Kak, jadi jawabannya seputar sapa-sapaan atau info toko dulu ya! 😉`;
    }

    return sendJson(200, { reply });
  } catch (error) {
    console.error('CRITICAL CATCH ERROR:', error.message, error.stack);
    return sendJson(200, { reply: `Maaf Kak, terjadi kendala teknis: ${error.message}` });
  }
}
