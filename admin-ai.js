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
      return sendJson(200, { reply: "Pesane ora olih kosong, Ka." });
    }

    const text = promptText.toLowerCase();
    let reply = "";

    // Sistem pencocokan kata kunci lokal basa Cirebon komplit (Stok, Harga, Jam Buka, Lokasi, Pembayaran, Promo, & Candaan Gaul)[span_0](start_span)[span_0](end_span)
    if (text.includes('halo') || text.includes('hai') || text.includes('pagi') || text.includes('siang') || text.includes('malam')) {
      reply = "Hai, Ka! Ana sing bisa dibantu? 😊";
    } else if (text.includes('stok') || text.includes('barang')) {
      reply = "Nggo ngecek detail stok barang, kakanbisa langsung deleng ning menu daftar produk ya! Supaya datane luwih pas. 📦✨";
    } else if (text.includes('harga') || text.includes('jual') || text.includes('beli')) {
      reply = "Soal rega lan produk, kabeh wis kecatet rapi ning sistem kasir ya Ka. Ana maning sing pan dicek? 💰";
    } else if (text.includes('jam') || text.includes('buka') || text.includes('tutup') || text.includes('operasional')) {
      reply = "Toko buka saben dina, Ka, wiwit jam 07.00 esuk nganti jam 05.00 sore. Silaturahmi bae ning toko ya! ⏰";
    } else if (text.includes('lokasi') || text.includes('alamat') || text.includes('toko') || text.includes('dimana')) {
      reply = "Lokasi tokone gampang dijangkau tur strategis pisan. Yen bingung, bisa langsung takon admin utawa cek maps ya, Ka! 🗺️";
    } else if (text.includes('bayar') || text.includes('qris') || text.includes('transfer') || text.includes('cash') || text.includes('tunai')) {
      reply = "Masalah pembayaran gampang gawe, bisa cash utawa scan QRIS langsung. Sing penting lunas lan lancar barokah! 💳💸";
    } else if (text.includes('promo') || text.includes('diskon') || text.includes('murah') || text.includes('potongan')) {
      reply = "Sabar, Ka! Promo menarik lan diskon khusus biasane ana saben akhir pekan. Pantengin teros info terbarune ya! 🔥";
    } else if (text.includes('kabar') || text.includes('gimana') || text.includes('lagi apa')) {
      reply = "Aman jaya sentosa, Ka! Siap ngancani operasional toko ben tambah sat-set. ⚡";
    } else if (text.includes('canda') || text.includes('lucu') || text.includes('pantun') || text.includes('joke')) {
      reply = "Tuku trasi ning Jagasatru, bot lokal kiye pancen paling seru. Pan dibikinin pantun apa malem kiye, Ka? 🤭";
    } else if (text.includes('mantap') || text.includes('keren') || text.includes('kece') || text.includes('menyala') || text.includes('gokil') || text.includes('sabi')) {
      reply = "Jelas bae, abangku! Deweke kan sefrekuensi, tambah menyala abangku 🔥😎";
    } else if (text.includes('capek') || text.includes('lelah') || text.includes('semangat') || text.includes('stress')) {
      reply = "Tarik napas disit, Ka. Eling, rebahan iku seni, tapi cuan iku pasti! Semangat teross! 💪🔥";
    } else if (text.includes('terima kasih') || text.includes('makasih') || text.includes('thanks')) {
      reply = "Sama-sama, Ka! Moga-moga laris manis teros dagangane ya! 💪🚀";
    } else if (text.includes('siapa kamu') || text.includes('kamu siapa')) {
      reply = "Kita asisten digital lokal KasirQuh sing setia ngancani tanpa wedi kuota token entek! 😎";
    } else {
      reply = `Wah, seru temen iku! Tapi kita bot lokal versi santai nih Ka, dadi jawabane seputar sapa-sapaan, info toko, utawa obrolan seru disit ya! 😉 Boleh langsung chat admin toko bari ngopi yen butuh info jero mah ka 😁`;
    }

    return sendJson(200, { reply });
  } catch (error) {
    console.error('CRITICAL CATCH ERROR:', error.message, error.stack);
    return sendJson(200, { reply: `Maaf Ka, kedaden kendala teknis: ${error.message}` });
  }
}
