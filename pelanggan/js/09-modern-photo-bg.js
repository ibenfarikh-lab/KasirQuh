/*
 * PROTOTYPE: hapus background foto produk yang menyatu dengan tepi foto.
 * Hanya dipakai pada Card View + tema Modern.
 * Data foto asli (JPEG Base64) TIDAK diubah; hasil transparan hanya untuk tampilan.
 * Fokus awal: background putih/abu sangat terang yang mengelilingi produk.
 */
function makeModernProductTransparent(img) {
  if (!img || !document.body || document.body.getAttribute('data-theme') !== 'modern') return;
  if (img.dataset.bgRemoved === '1' || !img.src) return;
  img.dataset.bgRemoved = '1';

  const run = () => {
    try {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return;
      const max = 420;
      const scale = Math.min(1, max / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, cw, ch);
      const image = ctx.getImageData(0, 0, cw, ch);
      const d = image.data;

      // Estimasi warna background dari empat sudut.
      const pts = [[0,0],[cw-1,0],[0,ch-1],[cw-1,ch-1]];
      let br=0,bg=0,bb=0;
      pts.forEach(([x,y]) => { const i=(y*cw+x)*4; br+=d[i]; bg+=d[i+1]; bb+=d[i+2]; });
      br/=4; bg/=4; bb/=4;
      const brightness=(br+bg+bb)/3;
      // Prototype sengaja konservatif: hanya background terang/putih.
      if (brightness < 205) {
        img.classList.add('modern-photo-fallback');
        return;
      }

      const visited = new Uint8Array(cw*ch);
      const qx = new Int32Array(cw*ch);
      const qy = new Int32Array(cw*ch);
      let head=0, tail=0;
      const seed = (x,y) => { const pos=y*cw+x; if (!visited[pos]) { visited[pos]=1; qx[tail]=x; qy[tail]=y; tail++; } };
      for(let x=0;x<cw;x++){ seed(x,0); seed(x,ch-1); }
      for(let y=1;y<ch-1;y++){ seed(0,y); seed(cw-1,y); }

      const tolerance = 62;
      const dist = (i) => Math.sqrt((d[i]-br)**2 + (d[i+1]-bg)**2 + (d[i+2]-bb)**2);
      while(head<tail){
        const x=qx[head], y=qy[head++], i=(y*cw+x)*4;
        if (dist(i) <= tolerance && (d[i]+d[i+1]+d[i+2])/3 >= 185) {
          d[i+3]=0;
          if(x>0) seed(x-1,y); if(x<cw-1) seed(x+1,y); if(y>0) seed(x,y-1); if(y<ch-1) seed(x,y+1);
        }
      }

      ctx.putImageData(image,0,0);
      const transparentSrc = canvas.toDataURL('image/png');
      // Jika ternyata tidak ada pixel yang berhasil dibuat transparan, gunakan fallback rounded.
      if (!transparentSrc || transparentSrc.length < 100) {
        img.classList.add('modern-photo-fallback');
        return;
      }
      img.src = transparentSrc;
      img.classList.add('modern-bg-removed');
    } catch (e) {
      // Jika browser/remote image tidak mengizinkan canvas, biarkan foto asli tampil
      // dengan fallback rounded + shadow.
      img.dataset.bgRemoved = '0';
      img.classList.add('modern-photo-fallback');
    }
  };
  if (img.complete && img.naturalWidth) run(); else img.addEventListener('load', run, {once:true});
}
