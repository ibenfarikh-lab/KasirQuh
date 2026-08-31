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
      return sendJson(200, { reply: "Pesane ora olih kosong, Ka. Mau takon utawa curhat apa bae bebas pol!" });
    }

    const text = promptText.toLowerCase();
    let reply = "";

    // Sistem Q/A Super Lengkap, Bebas, Gaul, & Bahasa Cirebon Asik
    if (text.includes('halo') || text.includes('hai') || text.includes('pagi') || text.includes('siang') || text.includes('malam') || text.includes('salam')) {
      reply = "Tabe, Ka! Mau takon apa bae bebas, curhat masalah urip, atau ngobrol ngalor-ngidul juga oleh banget, santai bae ora kaku! 😊☕";
    } else if (text.includes('stok') || text.includes('barang') || text.includes('harga') || text.includes('jual') || text.includes('toko')) {
      reply = "Soal barang dagangan utawa rega toko, kabeh aman terkendali ning sistem kasir. Tapi yen mau takon hal liyane sing bebas banget, mangga ditunggu pitakonane! 📦💰";
    } else if (text.includes('cinta') || text.includes('jomblo') || text.includes('pacar') || text.includes('gebetan') || text.includes('galau') || text.includes('putus')) {
      reply = "Wah, mlebu jalur percintaan lan kegalauan kiye! Sing sabar ya Ka, jomblo iku dudu nasib tapi strategi nunda keborosan. Sing penting dompet kandel, ati aman sentosa! 😅💔";
    } else if (text.includes('game') || text.includes('main game') || text.includes('ml') || text.includes('ff') || text.includes('pubg') || text.includes('mabar')) {
      reply = "Ngomongin game, Rika biasane tipe player sing jago atau beban tim nih? Sing penting aja ngamuk-ngamuk bae pas kalah rank ya, Ka! 🎮🔥";
    } else if (text.includes('musik') || text.includes('lagu') || text.includes('nyanyi') || text.includes('konser') || text.includes('dengerin')) {
      reply = "Musik emang dadi pelebur penat sing paling mujarab. Mangga pasang headset, setel lagu favorit, ben urip ora pati tegang! 🎧🎶";
    } else if (text.includes('film') || text.includes('nonton') || text.includes('drakor') || text.includes('bioskop') || text.includes('series')) {
      reply = "Nonton film utawa drakor emang pelarian paling asik pas weekend. Tapi eling waktu istirahat ya Ka, aja nganti maring subuh melek terus! 🍿🎬";
    } else if (text.includes('ai') || text.includes('robot') || text.includes('teknologi') || text.includes('coding') || text.includes('web') || text.includes('internet')) {
      reply = "Ngomongin teknologi, jaman saiki kabeh kudu sat-set! Bot lokal kiye senajan tanpa server awan sing ribet, tapi siap mbantu ngobrol lan gawe urusan dadi luwih asik. 💻🤖";
    } else if (text.includes('kerja') || text.includes('kantor') || text.includes('gaji') || text.includes('bisnis') || text.includes('usaha') || text.includes('cuan')) {
      reply = "Urusan golet cuan lan bisnis emang butuh mental waja. Sing penting niat tulus, gaweyan tekun, insya Allah rezeki lancar barokah mengalir terus! 💸📈";
    } else if (text.includes('tidur') || text.includes('ngantuk') || text.includes('mager') || text.includes('istirahat') || text.includes('malas')) {
      reply = "Yen wis karuan ngantuk lan mager, mending gogoleran disit, Ka. Rebahan iku seni, tapi tugas utawa pegawean aja nganti kelalen ya! 🛏️💤";
    } else if (text.includes('canda') || text.includes('lucu') || text.includes('pantun') || text.includes('joke') || text.includes('ketawa')) {
      reply = "Tuku terasi ning Jagasatru, bot lokal kiye pinter ngerayu. Senajan gratis ora butuh kuota token mahal, tapi obrolan tetep nyambung lan menyala abangku! 🤭🔥";
    } else if (text.includes('pegel') || text.includes('lelah') || text.includes('semangat') || text.includes('stress') || text.includes('puyeng')) {
      reply = "Tarik napas sing dawa, Ka. Urip emang kadang munggah mudhun kaya nanjak di Plangon, tapi tetep semangat merga sukses nunggu ning ngarep! 💪✨";
    } else if (text.includes('mangan') || text.includes('kuliner') || text.includes('lapar') || text.includes('makan') || text.includes('pedes')) {
      reply = "Duh dadi ngiler, paling enak nembak Empal Gentong, Nasi Jamblang, utawa Tahu Gejrot pedes nikmat. Sing wis wareg aja lali bersyukur ya Ka! 🍲😋";
    } else if (text.includes('cuaca') || text.includes('hujan') || text.includes('panas') || text.includes('adem')) {
      reply = "Cuaca apa bae sing penting ati tetep adem, Ka. Yen udan siapna kopi hangat, yen panas, sing akeh nginum banyu putih ya! ☀️🌧️";
    } else if (text.includes('terima kasih') || text.includes('makasih') || text.includes('thanks') || text.includes('atur nuhun')) {
      reply = "Sama-sama, Ka! Kapan bae butuh kanca ngobrol utawa takon-takon bab apa bae, bot lokal kiye siap siaga 24 jam. Atur nuhun bali! 🚀";
    } else if (text.includes('siapa kamu') || text.includes('kamu siapa') || text.includes('nama')) {
      reply = "Kita asisten digital lokal paling gaul sak-Cirebon, bebas ditakoni apa bae tanpa wedi kuota entek utawa puyeng mikir server! 😎";
    } else {
      reply = `Pitakonan sing bener-bener mantap lan out of the box iku, Ka! Intine kabeh topik sing Rika takonaken ditampung dadi energi positif. Pokokmah bebas mau takon apa bae, sing penting obrolan tetep nyambung lan asik. Ana hal séjé sing pan diobrolaken, Ka? 😁🔥`;
    }

    return sendJson(200, { reply });
  } catch (error) {
    console.error('CRITICAL CATCH ERROR:', error.message, error.stack);
    return sendJson(200, { reply: `Maaf Ka, kedaden kendala teknis: ${error.message}` });
  }
}
