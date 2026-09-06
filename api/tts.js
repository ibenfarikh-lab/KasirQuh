// api/tts.js
import { EdgeTTS } from 'node-edge-tts';
import path from 'path';
import fs from 'fs';
import os from 'os';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const text = req.query.text;
  if (!text) {
    return res.status(400).json({ error: 'Parameter text dibutuhkan' });
  }

  try {
    // Menggunakan suara natural perempuan Indonesia (GadisNeural)
    const tts = new EdgeTTS({
      voice: 'id-ID-GadisNeural',
      lang: 'id-ID',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    });

    const tmpFile = path.join(os.tmpdir(), `tts-${Date.now()}.mp3`);
    
    // Proses teks jadi suara
    await tts.ttsPromise(text, tmpFile);
    
    const stat = fs.statSync(tmpFile);
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': stat.size
    });
    
    const readStream = fs.createReadStream(tmpFile);
    readStream.pipe(res);
    
    readStream.on('end', () => {
      fs.unlinkSync(tmpFile); 
    });

  } catch (error) {
    console.error('TTS API Error:', error);
    res.status(500).json({ error: 'Gagal membuat suara' });
  }
}
