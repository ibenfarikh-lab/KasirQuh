/* Extracted from admin/index.html inline script #1. */
function getPengaturanKoinWarga() {
  return { enabled: localStorage.getItem('admin_koin_warga_enabled') !== 'false', daily: Math.max(0, parseInt(localStorage.getItem('admin_koin_warga_daily'), 10) || 10) };
}
function toggleAdminKoinWarga() {
  const panel=document.getElementById('admin-koin-warga-panel'); if(!panel) return;
  const open=panel.style.display !== 'none'; panel.style.display=open?'none':'block';
  if(!open){ const c=getPengaturanKoinWarga(); document.getElementById('admin-koin-enabled').checked=c.enabled; document.getElementById('admin-koin-daily').value=c.daily; }
}
function simpanPengaturanKoinWarga() {
  const enabled=document.getElementById('admin-koin-enabled').checked;
  const daily=Math.max(0, parseInt(document.getElementById('admin-koin-daily').value,10) || 0);
  localStorage.setItem('admin_koin_warga_enabled', String(enabled));
  localStorage.setItem('admin_koin_warga_daily', String(daily));
  const st=document.getElementById('admin-koin-status'); if(st) st.textContent='✓ Pengaturan Koin Warga tersimpan.';
}
function getPengaturanPromoTokoLocal() {
  try { return JSON.parse(localStorage.getItem('admin_promo_toko_v1') || '{"enabled":true,"codes":[]}'); }
  catch(e) { return {enabled:true,codes:[]}; }
}
function renderAdminPromoProductList(selectedCodes) {
  const box=document.getElementById('admin-promo-product-list'); if(!box) return;
  const codes=selectedCodes || [];
  const items=Object.keys(databaseProduk || {}).map(code => ({code,p:databaseProduk[code]}))
    .filter(x => x.p && x.p.nama).sort((a,b)=>String(a.p.nama).localeCompare(String(b.p.nama),'id'));
  if(!items.length){ box.innerHTML='<div style="font-size:.75rem;opacity:.7;">Katalog belum dimuat.</div>'; return; }
  box.innerHTML=items.map(({code,p})=>{
    const checked=codes.includes(code);
    const stok=Number(p.stok||0);
    return `<label class="admin-promo-product-row" style="display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;column-gap:8px;padding:8px 9px;border-radius:8px;background:#222;border:1px solid #333;font-size:.78rem;box-sizing:border-box;min-height:44px;">
      <input type="checkbox" class="admin-promo-product" value="${code}" ${checked?'checked':''} ${stok<=0?'disabled':''} style="width:18px;height:18px;margin:0;justify-self:center;">
      <span style="min-width:0;line-height:1.25;overflow-wrap:anywhere;text-align:left;">${String(p.nama).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}</span>
      <span style="opacity:.65;white-space:nowrap;text-align:right;">${stok>0?('stok '+stok):'habis'}</span>
    </label>`;
  }).join('');
  box.querySelectorAll('.admin-promo-product').forEach(el=>el.addEventListener('change',()=>{
    const checked=[...box.querySelectorAll('.admin-promo-product:checked')];
    if(checked.length>5){ el.checked=false; alert('Maksimal 5 barang untuk Promo Toko Hari Ini.'); }
  }));
}
function toggleAdminPromoToko() {
  const panel=document.getElementById('admin-promo-toko-panel'); if(!panel) return;
  const open=panel.style.display !== 'none'; panel.style.display=open?'none':'block';
  if(!open){
    const cfg=getPengaturanPromoTokoLocal();
    document.getElementById('admin-promo-enabled').checked=cfg.enabled !== false;
    renderAdminPromoProductList(cfg.codes || []);
  }
}
async function simpanPengaturanPromoToko() {
  const enabled=document.getElementById('admin-promo-enabled')?.checked !== false;
  const codes=[...document.querySelectorAll('.admin-promo-product:checked')].map(el=>el.value).slice(0,5);
  const cfg={enabled,codes,updatedAt:Date.now()};
  localStorage.setItem('admin_promo_toko_v1',JSON.stringify(cfg));
  try {
    await storeCollection("pengaturan").doc('beranda_pelanggan_promo').set(cfg,{merge:true});
    const st=document.getElementById('admin-promo-status'); if(st) st.textContent='✓ Promo tersimpan dan siap tampil di pelanggan.';
  } catch(err) {
    const st=document.getElementById('admin-promo-status'); if(st) st.textContent='⚠️ Tersimpan di perangkat, tetapi sinkronisasi gagal.';
  }
}
function getAdminHomeInfoConfig() {
  try { const c=JSON.parse(localStorage.getItem('admin_home_info_v1') || '{}'); return {runningText:c.runningText || ''}; }
  catch(e) { return {runningText:''}; }
}
function toggleAdminHomeInfo() {
  const panel=document.getElementById('admin-home-info-panel'); if(!panel) return;
  const open=panel.style.display!=='none'; panel.style.display=open?'none':'block';
  if(!open) { const c=getAdminHomeInfoConfig(); document.getElementById('admin-home-running-text').value=c.runningText; }
}
async function simpanPengaturanHomeInfo() {
  const cfg={infoText:'Info Toko....', runningText:(document.getElementById('admin-home-running-text')?.value || '').trim(), updatedAt:Date.now()};
  localStorage.setItem('admin_home_info_v1',JSON.stringify(cfg));
  try { await storeCollection("pengaturan").doc('beranda_pelanggan_home').set(cfg,{merge:true}); const st=document.getElementById('admin-home-info-status'); if(st) st.textContent='✓ Info toko & running text tersimpan dan siap tampil di pelanggan.'; }
  catch(err) { const st=document.getElementById('admin-home-info-status'); if(st) st.textContent='⚠️ Tersimpan di perangkat, tetapi sinkronisasi gagal.'; }
}
function getAdminIdeMasakConfig() {
  try {
    const c = JSON.parse(localStorage.getItem('admin_ide_masak_v1') || '{}');
    return { enabled: c.enabled !== false, recipes: Array.isArray(c.recipes) ? c.recipes : [] };
  } catch(e) { return {enabled:true, recipes:[]}; }
}
function escapeAdminRecipe(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function renderAdminIdeMasakList(recipes) {
  const box=document.getElementById('admin-recipe-list'); if(!box) return;
  const list=Array.isArray(recipes)?recipes:[];
  if(!list.length) {
    box.innerHTML='<div style="font-size:.75rem;opacity:.7;padding:8px;border:1px dashed #444;border-radius:8px;">Belum ada menu. Tekan “Tambah Menu”.</div>';
    return;
  }
  const products=Object.keys(databaseProduk||{}).map(code=>({code,p:databaseProduk[code]})).filter(x=>x.p&&x.p.nama)
    .sort((a,b)=>String(a.p.nama).localeCompare(String(b.p.nama),'id'));
  const options='<option value="">-- pilih bahan --</option>'+products.map(x=>`<option value="${escapeAdminRecipe(x.code)}">${escapeAdminRecipe(x.p.nama)}</option>`).join('');
  box.innerHTML=list.map((r,i)=>{
    const items=Array.isArray(r.items)?r.items:[];
    return `<div class="admin-recipe-editor" data-index="${i}" style="padding:9px;border-radius:9px;background:#222;border:1px solid #3a3a3a;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px;">
        <strong style="font-size:.8rem;">Menu ${i+1}</strong>
        <button type="button" onclick="hapusAdminIdeMasak(${i})" style="border:0;border-radius:6px;background:#dc2626;color:#fff;padding:5px 8px;font-weight:700;">Hapus</button>
      </div>
      <input class="admin-recipe-name" value="${escapeAdminRecipe(r.nama)}" placeholder="Nama menu" style="width:100%;box-sizing:border-box;padding:7px;border-radius:7px;border:1px solid #555;margin-bottom:6px;background:#fff;color:#111;">
      <input class="admin-recipe-photo" value="${escapeAdminRecipe(r.foto||'')}" placeholder="URL foto menu (opsional)" style="width:100%;box-sizing:border-box;padding:7px;border-radius:7px;border:1px solid #555;margin-bottom:6px;background:#fff;color:#111;">
      <textarea class="admin-recipe-desc" placeholder="Deskripsi singkat" style="width:100%;box-sizing:border-box;min-height:55px;padding:7px;border-radius:7px;border:1px solid #555;margin-bottom:6px;background:#fff;color:#111;">${escapeAdminRecipe(r.desc||'')}</textarea>
      <div style="font-size:.72rem;font-weight:700;margin-bottom:4px;">Bahan:</div>
      <div class="admin-recipe-items" style="display:flex;flex-direction:column;gap:5px;">
        ${items.map((it,j)=>`<div class="admin-recipe-item" style="display:flex;gap:5px;align-items:center;">
          <select class="admin-recipe-product" style="flex:1;min-width:0;padding:6px;border-radius:6px;background:#fff;color:#111;border:1px solid #555;">${options.replace(`value="${escapeAdminRecipe(it.code)}"`,`value="${escapeAdminRecipe(it.code)}" selected`)}</select>
          <input class="admin-recipe-qty" type="number" min="0.001" step="0.001" value="${Number(it.qty)||1}" style="width:58px;padding:6px;border-radius:6px;border:1px solid #555;background:#fff;color:#111;">
          <button type="button" onclick="this.parentElement.remove()" style="border:0;border-radius:6px;background:#555;color:#fff;padding:6px 8px;">✕</button>
        </div>`).join('')}
      </div>
      <button type="button" onclick="tambahBahanAdminIdeMasak(${i})" style="width:100%;margin-top:6px;border:1px solid #555;border-radius:7px;padding:6px;background:#333;color:#fff;font-weight:700;">＋ Tambah Bahan</button>
    </div>`;
  }).join('');
}
function toggleAdminIdeMasak() {
  const panel=document.getElementById('admin-ide-masak-panel'); if(!panel) return;
  const open=panel.style.display!=='none'; panel.style.display=open?'none':'block';
  if(!open) {
    const cfg=getAdminIdeMasakConfig();
    document.getElementById('admin-recipe-enabled').checked=cfg.enabled;
    renderAdminIdeMasakList(cfg.recipes);
  }
}
function tambahAdminIdeMasak() {
  const cfg=getAdminIdeMasakConfig();
  if(cfg.recipes.length>=5) return alert('Maksimal 5 menu Ide Masak Hari Ini.');
  cfg.recipes.push({id:'recipe_'+Date.now(),nama:'',desc:'',foto:'',items:[]});
  renderAdminIdeMasakList(cfg.recipes);
}
function hapusAdminIdeMasak(index) {
  const cfg=getAdminIdeMasakConfig();
  cfg.recipes.splice(index,1);
  renderAdminIdeMasakList(cfg.recipes);
}
function tambahBahanAdminIdeMasak(index) {
  const box=document.querySelector(`.admin-recipe-editor[data-index="${index}"] .admin-recipe-items`);
  if(!box) return;
  const selects=document.querySelectorAll('#admin-recipe-list .admin-recipe-editor')[index].querySelectorAll('.admin-recipe-product');
  const products=Object.keys(databaseProduk||{}).map(code=>({code,p:databaseProduk[code]})).filter(x=>x.p&&x.p.nama).sort((a,b)=>String(a.p.nama).localeCompare(String(b.p.nama),'id'));
  const options='<option value="">-- pilih bahan --</option>'+products.map(x=>`<option value="${escapeAdminRecipe(x.code)}">${escapeAdminRecipe(x.p.nama)}</option>`).join('');
  box.insertAdjacentHTML('beforeend',`<div class="admin-recipe-item" style="display:flex;gap:5px;align-items:center;">
    <select class="admin-recipe-product" style="flex:1;min-width:0;padding:6px;border-radius:6px;background:#fff;color:#111;border:1px solid #555;">${options}</select>
    <input class="admin-recipe-qty" type="number" min="0.001" step="0.001" value="1" style="width:58px;padding:6px;border-radius:6px;border:1px solid #555;background:#fff;color:#111;">
    <button type="button" onclick="this.parentElement.remove()" style="border:0;border-radius:6px;background:#555;color:#fff;padding:6px 8px;">✕</button>
  </div>`);
}
function collectAdminIdeMasak() {
  return [...document.querySelectorAll('#admin-recipe-list .admin-recipe-editor')].map((el,i)=>({
    id: el.dataset.index ? (getAdminIdeMasakConfig().recipes[Number(el.dataset.index)]?.id || ('recipe_'+Date.now()+i)) : ('recipe_'+Date.now()+i),
    nama: el.querySelector('.admin-recipe-name')?.value.trim() || '',
    foto: el.querySelector('.admin-recipe-photo')?.value.trim() || '',
    desc: el.querySelector('.admin-recipe-desc')?.value.trim() || '',
    items: [...el.querySelectorAll('.admin-recipe-item')].map(row=>({code:row.querySelector('.admin-recipe-product')?.value||'',qty:parseFloat(row.querySelector('.admin-recipe-qty')?.value)||1})).filter(x=>x.code)
  }));
}
async function simpanPengaturanIdeMasak() {
  const enabled=document.getElementById('admin-recipe-enabled')?.checked!==false;
  const recipes=collectAdminIdeMasak().filter(r=>r.nama).slice(0,5);
  const cfg={enabled,recipes,updatedAt:Date.now()};
  localStorage.setItem('admin_ide_masak_v1',JSON.stringify(cfg));
  try {
    await storeCollection("pengaturan").doc('beranda_pelanggan_resep').set(cfg,{merge:true});
    const st=document.getElementById('admin-recipe-status'); if(st) st.textContent='✓ Ide Masak tersimpan dan siap tampil di pelanggan.';
  } catch(err) {
    const st=document.getElementById('admin-recipe-status'); if(st) st.textContent='⚠️ Tersimpan di perangkat, tetapi sinkronisasi gagal.';
  }
}
function getAdminStokRumahHabisConfig() {
  try {
    const c = JSON.parse(localStorage.getItem('admin_stok_rumah_habis_v1') || '{}');
    return { enabled: c.enabled !== false, limit: Math.min(10, Math.max(1, parseInt(c.limit,10) || 5)) };
  } catch(e) { return {enabled:true, limit:5}; }
}
function toggleAdminStokRumahHabis() {
  const panel=document.getElementById('admin-stok-rumah-panel'); if(!panel) return;
  const open=panel.style.display!=='none'; panel.style.display=open?'none':'block';
  if(!open){
    const c=getAdminStokRumahHabisConfig();
    const enabled=document.getElementById('admin-home-stock-toggle');
    const limit=document.getElementById('admin-stok-rumah-limit');
    if(enabled) enabled.checked=c.enabled;
    if(limit) limit.value=c.limit;
  }
}
async function simpanPengaturanStokRumahHabis() {
  const enabled=document.getElementById('admin-home-stock-toggle')?.checked!==false;
  const limit=Math.min(10,Math.max(1,parseInt(document.getElementById('admin-stok-rumah-limit')?.value,10)||5));
  const cfg={enabled,limit,updatedAt:Date.now()};
  localStorage.setItem('admin_stok_rumah_habis_v1',JSON.stringify(cfg));
  try {
    await storeCollection("pengaturan").doc('beranda_pelanggan_stok_rumah').set(cfg,{merge:true});
    const st=document.getElementById('admin-stok-rumah-status'); if(st) st.textContent='✓ Pengaturan Stok Rumah Habis tersimpan.';
  } catch(err) {
    const st=document.getElementById('admin-stok-rumah-status'); if(st) st.textContent='⚠️ Tersimpan di perangkat, tetapi sinkronisasi gagal.';
  }
}
function getAdminSedangLarisConfig() {
  try {
    const c=JSON.parse(localStorage.getItem('admin_sedang_laris_v1') || '{}');
    return {enabled:c.enabled !== false, limit:Math.min(10,Math.max(1,parseInt(c.limit,10)||5))};
  } catch(e) { return {enabled:true,limit:5}; }
}
function toggleAdminSedangLaris() {
  const panel=document.getElementById('admin-sedang-laris-panel'); if(!panel) return;
  const open=panel.style.display!=='none'; panel.style.display=open?'none':'block';
  if(!open){ const c=getAdminSedangLarisConfig(); document.getElementById('admin-trending-enabled').checked=c.enabled; document.getElementById('admin-trending-limit').value=c.limit; }
}
async function simpanPengaturanSedangLaris() {
  const enabled=document.getElementById('admin-trending-enabled')?.checked!==false;
  const limit=Math.min(10,Math.max(1,parseInt(document.getElementById('admin-trending-limit')?.value,10)||5));
  const cfg={enabled,limit,updatedAt:Date.now()};
  localStorage.setItem('admin_sedang_laris_v1',JSON.stringify(cfg));
  try {
    await storeCollection("pengaturan").doc('beranda_pelanggan_laris').set(cfg,{merge:true});
    const st=document.getElementById('admin-trending-status'); if(st) st.textContent='✓ Pengaturan Sedang Laris tersimpan.';
  } catch(err) {
    const st=document.getElementById('admin-trending-status'); if(st) st.textContent='⚠️ Tersimpan di perangkat, tetapi sinkronisasi gagal.';
  }
}
function scrollKePengaturanBerandaPelanggan() {
  const target = document.getElementById('admin-beranda-pelanggan');
  const shortcut = document.getElementById('shortcut-beranda-pelanggan');
  if (!target) return;

  const isOpen = target.getAttribute('aria-hidden') === 'false';

  if (isOpen) {
    // Klik kedua: tutup kembali dengan animasi naik/fade.
    // Gunakan tinggi aktual dulu agar transisi max-height tetap halus.
    target.style.maxHeight = target.scrollHeight + 'px';
    requestAnimationFrame(() => {
      target.setAttribute('aria-hidden', 'true');
      target.style.maxHeight = '0px';
      target.style.opacity = '0';
      target.style.transform = 'translateY(-8px)';
    });
    if (shortcut) shortcut.setAttribute('aria-expanded', 'false');
    return;
  }

  // Klik pertama: buka konten tepat di bawah card Beranda Pelanggan.
  target.setAttribute('aria-hidden', 'false');
  target.style.maxHeight = '0px';
  target.style.opacity = '0';
  target.style.transform = 'translateY(-8px)';

  requestAnimationFrame(() => {
    target.style.maxHeight = target.scrollHeight + 'px';
    target.style.opacity = '1';
    target.style.transform = 'translateY(0)';
  });

  if (shortcut) shortcut.setAttribute('aria-expanded', 'true');

  // Setelah transisi selesai, biarkan tinggi mengikuti isi agar aman bila panel berubah ukuran.
  window.setTimeout(() => {
    if (target.getAttribute('aria-hidden') === 'false') target.style.maxHeight = 'none';
  }, 600);
}
