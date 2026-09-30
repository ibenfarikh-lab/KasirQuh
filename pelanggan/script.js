// ===== #loginModal — MESIN AKUN PELANGGAN =====
// Mengikuti struktur data pelanggan KasirQuh tanpa membuat koleksi/field baru.
const customerSessionKey = "cust_phone_v13";
let currentCustomerPhone = localStorage.getItem(customerSessionKey) || "";
let currentCustomerDocId = "";
let currentCustomerName = "Pelanggan";
let customerSavedRecipes = [];

const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginAccount = document.getElementById("loginAccount");
const loginPassword = document.getElementById("loginPassword");
const loginSubmit = document.getElementById("loginSubmit");
const loginStatus = document.getElementById("loginStatus");
const akunPelanggan = document.getElementById("akunPelanggan");
const akunPelangganLabel = document.getElementById("akunPelangganLabel");

function updateCustomerButton(){
  if(!akunPelanggan || !akunPelangganLabel)return;
  akunPelangganLabel.textContent = currentCustomerPhone ? currentCustomerName : "Masuk";
  akunPelanggan.setAttribute("aria-label", currentCustomerPhone ? "Akun pelanggan" : "Masuk pelanggan");
}

function logoutCustomer(){
  localStorage.removeItem(customerSessionKey);
  currentCustomerPhone="";
  currentCustomerDocId="";
  currentCustomerName="Pelanggan";
  customerSavedRecipes=[];
  updateCustomerButton();
  setLoginStatus("");
  openLoginModal();
}

akunPelanggan?.addEventListener("click",()=>{
  if(currentCustomerPhone){switchView("akun");return;}
  openLoginModal();
});

function openLoginModal(){
  if(!loginModal)return;
  loginModal.classList.add("is-open");
  loginModal.setAttribute("aria-hidden","false");
  document.body.classList.add("login-locked");
  setTimeout(()=>loginAccount?.focus(),50);
}
function closeLoginModal(){
  if(!loginModal)return;
  loginModal.classList.remove("is-open");
  loginModal.setAttribute("aria-hidden","true");
  document.body.classList.remove("login-locked");
}
function setLoginStatus(message=""){ if(loginStatus)loginStatus.textContent=message; }

async function loadCustomerSession(){
  if(!currentCustomerPhone){openLoginModal();return;}
  try{
    const snapshot=await storeCollection("pelanggan").where("phone","==",currentCustomerPhone).get();
    if(snapshot.empty){localStorage.removeItem(customerSessionKey);currentCustomerPhone="";openLoginModal();return;}
    const doc=snapshot.docs[0];
    const data=doc.data();
    currentCustomerDocId=doc.id;
    if(data.status==="pending" || data.disetujui===false){
      localStorage.removeItem(customerSessionKey);currentCustomerPhone="";
      setLoginStatus("Akun masih menunggu persetujuan Admin.");
      openLoginModal();return;
    }
    currentCustomerName=String(data.nama||"Pelanggan");
    customerSavedRecipes=Array.isArray(data.savedRecipes)?data.savedRecipes:[];
    updateCustomerButton();
    closeLoginModal();
    startCustomerDatabase();
  }catch(error){
    console.error("Firestore pelanggan:",error);
    setLoginStatus("Tidak dapat memuat akun pelanggan.");
    openLoginModal();
  }
}

async function loginCustomer(event){
  event.preventDefault();
  const phone=loginAccount.value.trim();
  const password=loginPassword.value;
  if(!phone||!password){setLoginStatus("Nomor WhatsApp dan sandi wajib diisi.");return;}
  loginSubmit.disabled=true;setLoginStatus("Memeriksa akun...");
  try{
    const snapshot=await storeCollection("pelanggan").where("phone","==",phone).get();
    if(snapshot.empty){setLoginStatus("Nomor WhatsApp belum terdaftar.");return;}
    const doc=snapshot.docs[0];
    const data=doc.data();
    if(data.status==="pending" || data.disetujui===false){setLoginStatus("Akun masih menunggu persetujuan Admin.");return;}
    // KasirQuh pelanggan memang menyimpan dan memeriksa field password ini.
    if(password!==(data.password||"user")){setLoginStatus("Sandi salah. Silakan coba lagi.");return;}
    currentCustomerPhone=phone;
    currentCustomerDocId=doc.id;
    currentCustomerName=String(data.nama||"Pelanggan");
    customerSavedRecipes=Array.isArray(data.savedRecipes)?data.savedRecipes:[];
    localStorage.setItem(customerSessionKey,phone);
    updateCustomerButton();
    loginPassword.value="";
    setLoginStatus("");
    closeLoginModal();
    showToast("Berhasil masuk sebagai pelanggan ✓");
    startCustomerDatabase();
  }catch(error){
    console.error("Login pelanggan:",error);
    setLoginStatus("Login gagal: "+(error.message||"terjadi kesalahan"));
  }finally{loginSubmit.disabled=false;}
}

loginForm?.addEventListener("submit",loginCustomer);
document.getElementById("loginBackdrop")?.addEventListener("click",()=>{
  // Modal tidak bisa ditutup tanpa sesi pelanggan.
  if(!currentCustomerPhone)loginAccount?.focus();
});


// ===== MESIN HEADER TOKO 1 — diadaptasi dari mesin pelanggan KasirQuh =====
// Green/Yellow only: identitas toko, greeting, info toko, pencarian, dan keranjang.
function updateGreeting(){
 const h=new Date().getHours();
 const el=document.getElementById("greeting");
 if(!el) return;
 el.textContent=(h<11?"Selamat pagi":h<15?"Selamat siang":h<18?"Selamat sore":"Selamat malam")+" 👋";
}
updateGreeting();
updateHeaderContext("beranda");

// ===== MESIN DATABASE — diadaptasi dari koneksi Firestore KasirQuh =====
// Key/config mengikuti project Firebase KasirQuh. Data produk dibaca dari
// toko/{tokoId}/produk agar Toko 1 memakai sumber produk yang sama.
const firebaseConfig = {
  apiKey: "AIzaSyCwOxkcydduRDC9v1b_XOr8K8FYtpHOY2g",
  authDomain: "kasirquh.firebaseapp.com",
  projectId: "kasirquh",
  storageBucket: "kasirquh.firebasestorage.app",
  messagingSenderId: "87320899036",
  appId: "1:87320899036:web:592c6768ea4aca6bdbb319",
  measurementId: "G-2BL7RJN9Z5"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const ACTIVE_TOKO_ID = "toko_v13";
const storeCollection = name => db.collection("toko").doc(ACTIVE_TOKO_ID).collection(name);

let products=[];
let catalog=[];
const selling=[];
const productByCode={};
function normalizeProduct(code,data){
 const p={...data};
 const price=Number(p.hargaJual ?? p.harga ?? 0);
 return {...p,code,name:String(p.nama||p.name||code),price,stock:Number(p.stok ?? p.stock ?? 0),cls:String(p.cls||"sauce"),foto:p.foto||""};
}
let catalogQuery="";
let activeCategory="Semua";
function productCategory(p){return String(p.kategori||p.category||p.jenis||p.kelompok||"Lainnya").trim()||"Lainnya";}
function rebuildCatalogFromDatabase(){
 catalog=Object.values(productByCode).map(p=>({...p})).filter(p=>p.name);
 products=catalog.filter(p=>p.stock>0);
 renderCategoryFilters();
 renderProductCatalog();
 renderStokRumah();
 renderPromoTokoHariIni();
 renderSedangLaris();
 renderIdeMasak();
}
function startProductDatabase(){
 storeCollection("produk").onSnapshot(snapshot=>{Object.keys(productByCode).forEach(k=>delete productByCode[k]);snapshot.forEach(doc=>productByCode[doc.id]=normalizeProduct(doc.id,doc.data()));rebuildCatalogFromDatabase();},err=>{console.error("Firestore produk:",err);showToast("Gagal mengambil data produk");});
 storeCollection("pengaturan").doc("toko_v13").onSnapshot(doc=>{const d=doc.exists?doc.data():{};document.getElementById("TokoNama")?.replaceChildren(document.createTextNode(d.nama||"Warunge Mimi"));window.__storeSettings=d;});
 storeCollection("pengaturan").doc("beranda_pelanggan_home").onSnapshot(doc=>{const d=doc.exists?doc.data():{};const text=String(d.runningText||"").trim();const el=document.getElementById("InfoTokoText");if(el){el.textContent=text||"Info toko belum tersedia";el.style.animationName=text?"infoTokoRun":"none";el.style.paddingLeft=text?"100%":"0";}window.__customerHomeSettings=d;},err=>console.warn("Running text Info Toko:",err));
 storeCollection("pengaturan").doc("beranda_pelanggan_promo").onSnapshot(doc=>{const d=doc.exists?doc.data():{};promoTokoConfig={enabled:d.enabled!==false,codes:Array.isArray(d.codes)?d.codes:[]};renderPromoTokoHariIni();});
 storeCollection("pengaturan").doc("beranda_pelanggan_stok_rumah").onSnapshot(doc=>{const d=doc.exists?doc.data():{};window.__stokRumahConfig={enabled:d.enabled!==false,limit:Math.min(20,Math.max(1,Number(d.limit)||5))};renderStokRumah();});
 storeCollection("pengaturan").doc("beranda_pelanggan_resep").onSnapshot(doc=>{const d=doc.exists?doc.data():{};ideMasakConfig={enabled:d.enabled!==false,recipes:Array.isArray(d.recipes)?d.recipes:[]};renderIdeMasak();});
 storeCollection("pengaturan").doc("beranda_pelanggan_laris").onSnapshot(doc=>{const d=doc.exists?doc.data():{};sedangLarisConfig={enabled:d.enabled!==false,limit:Math.min(20,Math.max(1,Number(d.limit)||5))};renderSedangLaris();});
 storeCollection("transaksi").orderBy("waktuTimestamp","desc").limit(200).onSnapshot(snapshot=>{window.__allTransactions=[];snapshot.forEach(doc=>window.__allTransactions.push({id:doc.id,...doc.data()}));renderSedangLaris();},err=>{console.warn("Transaksi laris query utama gagal, fallback:",err);storeCollection("transaksi").onSnapshot(snapshot=>{window.__allTransactions=[];snapshot.forEach(doc=>window.__allTransactions.push({id:doc.id,...doc.data()}));renderSedangLaris();},fallbackErr=>console.warn("Transaksi laris fallback gagal:",fallbackErr));});
}
function startCustomerDatabase(){if(!currentCustomerPhone)return;storeCollection("pelanggan").where("phone","==",currentCustomerPhone).onSnapshot(s=>{if(s.empty)return;const d=s.docs[0];currentCustomerDocId=d.id;currentCustomerName=String(d.data().nama||"Pelanggan");window.__customerData=d.data();customerSavedRecipes=Array.isArray(d.data().savedRecipes)?d.data().savedRecipes:[];updateCustomerButton();renderIdeMasak();});storeCollection("transaksi").where("customerPhone","==",currentCustomerPhone).limit(100).onSnapshot(s=>{window.__customerOrders=[];s.forEach(d=>window.__customerOrders.push({id:d.id,...d.data()}));renderStokRumah();});}


const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#39;"}[c]));
const money=n=>"Rp "+Number(n||0).toLocaleString("id-ID");
const imgClass=c=>`product-photo ${escapeHtml(c||"")}`;
function productPhoto(p, id, className="") {
 const src=String(p?.foto||"").trim();
 const alt=escapeHtml(p?.name||p?.nama||"Foto produk");
 const safeId=escapeHtml(id);
 if(!src) return `<div class="${className} product-photo-placeholder" id="${safeId}" aria-label="Foto produk belum tersedia">Foto belum tersedia</div>`;
 return `<img class="${className} product-photo" id="${safeId}" src="${escapeHtml(src)}" alt="${alt}" loading="lazy" decoding="async" onerror="this.classList.add('is-error');this.removeAttribute('src');this.alt='Foto belum tersedia'">`;
}

// ===== BERANDA PELANGGAN — SUMBER DATA FIRESTORE =====
let promoTokoConfig={enabled:true,codes:[]};
let ideMasakConfig={enabled:true,recipes:[]};
let sedangLarisConfig={enabled:true,limit:5};
window.__stokRumahConfig={enabled:true,limit:5};
window.__customerOrders=[];
window.__allTransactions=[];

function renderStokRumah(){
 const section=document.getElementById("stokRumah"),box=document.getElementById("stokRumahList");
 if(!section||!box)return;
 const cfg=window.__stokRumahConfig;
 if(cfg.enabled===false){section.style.display="none";box.innerHTML="";return;}
 section.style.display="";
 const recent=[];
 window.__customerOrders.forEach(t=>(t.items||[]).forEach(i=>{if(i.code&&!recent.includes(i.code))recent.push(i.code);}));
 const items=recent.map(c=>productByCode[c]).filter(p=>p&&p.stock>0).slice(0,Math.min(20,Math.max(1,Number(cfg.limit)||5)));
 if(!currentCustomerPhone){
   box.innerHTML='<div class="section-empty" id="stokRumahEmpty">Masuk untuk melihat barang yang biasa kamu beli.</div>';
   return;
 }
 if(!items.length){
   box.innerHTML='<div class="section-empty" id="stokRumahEmpty">Belum ada riwayat belanja untuk rekomendasi pribadi.</div>';
   return;
 }
 box.innerHTML=items.map(p=>`<article class="quick embossed" id="stokRumah-${p.code}" data-product-code="${escapeHtml(p.code||"")}" data-price="${p.price}">${productPhoto(p, `stokRumah-${p.code}-photo`, "quick-img")}<b>${escapeHtml(p.name)}</b><span>${money(p.price)}</span><button class="card-cart" type="button" data-add-code="${escapeHtml(p.code||"")}" aria-label="Tambah ${escapeHtml(p.name)} ke keranjang">🛒</button></article>`).join("");
 setupStokRumahScroll();
}
function setupStokRumahScroll(){const c=document.getElementById("stokRumahList");if(!c||c.dataset.loopReady)return;c.dataset.loopReady="1";let last=performance.now(),down=false;c.addEventListener("pointerdown",()=>down=true);["pointerup","pointercancel","pointerleave"].forEach(e=>c.addEventListener(e,()=>down=false));function tick(now){const dt=Math.min(now-last,50);last=now;if(!down&&!document.hidden&&c.scrollWidth>c.clientWidth){c.scrollLeft+=.008*dt;}last=now;requestAnimationFrame(tick)}requestAnimationFrame(tick);}

function recipeCard(r, scope, index){
 const items=Array.isArray(r?.items)?r.items:[];
 const itemNames=items.map(i=>{
   const p=i.code?productByCode[i.code]:Object.values(productByCode).find(x=>String(x.name||'').toLowerCase()===String(i.name||i.nama||'').toLowerCase());
   return p?.name||i.name||i.nama||"Bahan";
 }).slice(0,3);
 const more=items.length>3?` +${items.length-3}`:"";
 const image=r?.foto
   ? `<img class="recipe-image" id="ideMasakHariIni-${scope}-${index}-image" src="${escapeHtml(r.foto)}" alt="${escapeHtml(r.nama||"Menu")}" loading="lazy" onerror="this.style.display='none'">`
   : `<div class="recipe-image ${escapeHtml(r?.cls||"food-one")}" id="ideMasakHariIni-${scope}-${index}-image" aria-hidden="true"></div>`;
 const isPersonal=scope==="personal";
 return `<article class="recipe-card embossed" id="ideMasakHariIni-${scope}-${index}" data-recipe-scope="${scope}" data-recipe-index="${index}">
   ${image}
   <div class="recipe-body">
     <h3>${isPersonal?'⭐ ':''}${escapeHtml(r?.nama||"Menu Warga")}</h3>
     <p>${escapeHtml(r?.desc||(isPersonal?"Menu custom kamu.":"Ide masak pilihan toko."))}</p>
     <small>${escapeHtml(itemNames.join(", ")||"Bahan belum ditentukan")}${more}</small>
   </div>
   <div class="recipe-actions">
     <button class="recipe-add" data-recipe-action="add" type="button">+ Bahan</button>
     <button class="recipe-share" data-recipe-action="share" type="button" aria-label="Bagikan resep">📢</button>
   </div>
 </article>`;
}

function renderIdeMasak(){
 const section=document.getElementById("ideMasakHariIni"),box=document.getElementById("ideMasakList");
 if(!section||!box)return;
 if(ideMasakConfig.enabled===false){section.style.display="none";return;}
 section.style.display="";
 const adminRecipes=(ideMasakConfig.recipes||[]).slice(0,5).map(r=>({r,scope:"admin"}));
 const personalRecipes=currentCustomerPhone&&Array.isArray(customerSavedRecipes)
   ? customerSavedRecipes.slice(0,5).map(r=>({r,scope:"personal"})) : [];
 const all=[...adminRecipes,...personalRecipes];
 if(!all.length){box.innerHTML=`<div class="section-empty" id="ideMasakEmpty">Belum ada ide masak dari warga.</div>`;return;}
 box.innerHTML=all.map((x,i)=>recipeCard(x.r,x.scope,i)).join("");
}
function getRecipeByScope(scope,index){
 const card=document.querySelector(`[data-recipe-scope="${scope}"][data-recipe-index="${index}"]`);
 const globalIndex=card?Array.from(document.querySelectorAll("#ideMasakList [data-recipe-scope]")).indexOf(card):Number(index);
 const adminCount=(ideMasakConfig.recipes||[]).slice(0,5).length;
 if(scope==="admin")return (ideMasakConfig.recipes||[])[Number(index)];
 return customerSavedRecipes[Number(index)];
}
function beliPaketIdeMasak(r){
 let n=0;
 (r?.items||[]).forEach(i=>{
   const p=i.code?productByCode[i.code]:Object.values(productByCode).find(x=>String(x.name||'').toLowerCase()===String(i.name||i.nama||'').toLowerCase());
   const q=Math.max(1,Number(i.qty)||1);
   if(p&&p.stock>0){for(let j=0;j<q;j++)add(p.name,p.price);n++;}
 });
 showToast(n?`${n} bahan masuk keranjang ✓`:"Bahan belum tersedia");
}
function shareRecipe(r){
 if(!r)return;
 if(navigator.share){navigator.share({title:r.nama||"Ide Masak",text:`Ide masak: ${r.nama||"Menu"}`}).catch(()=>{});return;}
 showToast("Bagikan resep tidak tersedia di perangkat ini");
}
document.getElementById("ideMasakList")?.addEventListener("click",e=>{
 const card=e.target.closest("[data-recipe-scope]");
 if(!card)return;
 const scope=card.dataset.recipeScope;
 const index=Number(card.dataset.recipeIndex);
 const r=scope==="admin"?(ideMasakConfig.recipes||[])[index]:customerSavedRecipes[index];
 if(e.target.closest("[data-recipe-action='add']"))beliPaketIdeMasak(r);
 if(e.target.closest("[data-recipe-action='share']"))shareRecipe(r);
});

function renderPromoTokoHariIni(){
 const section=document.getElementById("promoTokoHariIni"),track=document.getElementById("promoTokoHariIni-track"),dots=document.getElementById("promoTokoHariIni-dots");
 if(!section||!track||!dots)return;
 const items=promoTokoConfig.enabled!==false?(promoTokoConfig.codes||[]).map(String).map(c=>productByCode[c]).filter(p=>p&&p.stock>0):[];
 if(!items.length){section.style.display="none";track.innerHTML="";dots.innerHTML="";return;}
 section.style.display="";
 track.innerHTML=items.map((p,i)=>`<article class="promo-slide embossed" id="promoTokoHariIni-${i}" data-product-code="${escapeHtml(p.code||"")}" data-price="${p.price}">
   <div class="promo-photo-wrap">${productPhoto(p, `promoTokoHariIni-${i}-photo`, "prod-img")}</div>
   <div class="promo-info">
     <div class="promo-badge">PROMO</div>
     <h3>${escapeHtml(p.name)}</h3>
     <p>Harga promo hari ini</p>
     <b>${money(p.price)}</b>
     <button class="promo-action" type="button" data-add-code="${escapeHtml(p.code||"")}" aria-label="Tambah ${escapeHtml(p.name)} ke keranjang">🛒</button>
   </div>
 </article>`).join("");
 dots.innerHTML=items.map((_,i)=>`<span class="promo-dot${i===0?" is-active":""}" data-promo-dot="${i}"></span>`).join("");
 setupPromoSlider(items.length);
}

let promoSliderTimer=null;
let promoSliderIndex=0;
function setupPromoSlider(total){
 const viewport=document.getElementById("promoTokoHariIni-list"),track=document.getElementById("promoTokoHariIni-track"),dots=document.getElementById("promoTokoHariIni-dots");
 if(!viewport||!track||!dots)return;
 clearInterval(promoSliderTimer); promoSliderTimer=null; promoSliderIndex=0;
 const go=(index)=>{promoSliderIndex=(index+total)%total;track.style.transform=`translateX(-${promoSliderIndex*100}%)`;dots.querySelectorAll(".promo-dot").forEach((d,i)=>d.classList.toggle("is-active",i===promoSliderIndex));};
 if(total>1){
   let paused=false;
   viewport.onpointerdown=()=>paused=true;
   viewport.onpointerup=()=>paused=false;
   viewport.onpointercancel=()=>paused=false;
   viewport.onpointerleave=()=>paused=false;
   promoSliderTimer=setInterval(()=>{if(!document.hidden&&!paused)go(promoSliderIndex+1);},4500);
   dots.querySelectorAll(".promo-dot").forEach((d,i)=>d.addEventListener("click",()=>go(i)));
 }
}

function transactionDateKey(t){const raw=t.waktuTimestamp||t.waktu||t.date||t.createdAt||t.tanggal;let d=null;if(raw?.toDate){try{d=raw.toDate();}catch(_){}}else if(raw?.seconds){d=new Date(Number(raw.seconds)*1000);}else{const parsed=new Date(raw);if(!Number.isNaN(parsed.getTime()))d=parsed;}if(!d)return null;return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function renderSedangLaris(items){const section=document.getElementById("sedangLarisHariIni"),box=document.getElementById("sedangLarisHariIniList");if(!section||!box)return;if(!items.length){section.style.display="none";box.innerHTML="";return;}section.style.display="";const cards=items.map((p,i)=>`<article class="selling embossed" id="sedanglaris-${p.code||String(p.name).replace(/[^a-z0-9]+/gi,"-")}-${i}" data-product-code="${escapeHtml(p.code||"")}" data-price="${p.price}">${productPhoto(p, `sedanglaris-${p.code||String(p.name).replace(/[^a-z0-9]+/gi,"-")}-${i}-photo`, "prod-img")}<div><h3>${escapeHtml(p.name)}</h3><p>Terjual: ${p.sold} pcs</p><b>${money(p.price)}</b></div><button class="card-cart" type="button" data-add-code="${escapeHtml(p.code||"")}" aria-label="Tambah ${escapeHtml(p.name)} ke keranjang">🛒</button></article>`).join("");box.innerHTML=cards+cards.replace(/ id="sedanglaris-/g, ' id="sedanglaris-loop-');setupSedangLarisScroll();}
function renderSedangLaris(){if(sedangLarisConfig.enabled===false){renderSedangLaris([]);return;}const dated=window.__allTransactions.map(t=>({t,key:transactionDateKey(t)})).filter(x=>x.key);if(!dated.length){renderSedangLaris([]);return;}const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;const target=dated.some(x=>x.key===today)?today:[...new Set(dated.map(x=>x.key))].sort().pop();const counts={};dated.filter(x=>x.key===target).forEach(({t})=>(Array.isArray(t.items)?t.items:[]).forEach(i=>{const rawCode=String(i.code||i.productCode||"").trim();const p=rawCode?productByCode[rawCode]:null;const itemName=String(i.nama||i.name||"").trim();const name=p?.name||itemName;if(!name)return;const q=Number(i.qty??i.jumlah??1);if(q<=0)return;let key=rawCode;if(!key){const matched=Object.values(productByCode).find(prod=>String(prod.name||"").trim().toLowerCase()===name.toLowerCase());key=matched?.code||name.toLowerCase();}counts[key]??={name,code:rawCode||key,qty:0};counts[key].qty+=q;}));const top=Object.values(counts).sort((a,b)=>b.qty-a.qty).slice(0,Math.min(20,Math.max(1,Number(sedangLarisConfig.limit)||5))).map(x=>{const p=x.code?productByCode[x.code]:null;return {name:p?.name||x.name,code:p?.code||x.code||"",price:p?.price||0,cls:p?.cls||"",sold:x.qty};});renderSedangLaris(top);}
function setupSedangLarisScroll(){const c=document.getElementById("sedangLarisHariIniList");if(!c||c.dataset.loopReady)return;c.dataset.loopReady="1";let down=false,last=performance.now();function tick(now){if(!document.hidden&&!down&&c.scrollWidth>c.clientWidth){const dt=Math.min(now-last,50);c.scrollLeft+=.026*dt;const loop=c.scrollWidth/2;if(loop&&c.scrollLeft>=loop)c.scrollLeft-=loop;}last=now;requestAnimationFrame(tick)}c.addEventListener("pointerdown",()=>down=true);["pointerup","pointercancel","pointerleave"].forEach(e=>c.addEventListener(e,()=>down=false));requestAnimationFrame(tick);}

function renderCategoryFilters(){
 const box=document.getElementById("kategori");
 if(!box)return;
 const cats=["Semua",...new Set(catalog.map(productCategory))];
 if(!cats.includes(activeCategory))activeCategory="Semua";
 box.innerHTML=cats.map(cat=>`<button type="button" class="category-chip embossed-inset ${cat===activeCategory?"active":""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`).join("");
}
function getFilteredCatalog(){
 const q=catalogQuery.toLowerCase();
 return catalog.filter(p=>{
   const matchesQuery=!q||[p.name,p.code,p.nama,p.barcode].some(v=>String(v??"").toLowerCase().includes(q));
   const matchesCategory=activeCategory==="Semua"||productCategory(p)===activeCategory;
   return matchesQuery&&matchesCategory;
 });
}
function renderProductCatalog(){
 const box=document.getElementById("productList");
 if(!box)return;
 const items=getFilteredCatalog();
 const count=document.getElementById("produkCount");
 if(count)count.textContent=`${items.length} produk`;
 box.innerHTML=items.map(p=>`
 <article class="product embossed" id="produk-${String(p.code||p.name).replace(/[^a-zA-Z0-9]+/g,"-")}" data-product-code="${escapeHtml(p.code||"")}">
  ${productPhoto(p, `produk-${String(p.code||p.name).replace(/[^a-zA-Z0-9]+/g,"-")}-photo`, "prod-img")}<h3>${escapeHtml(p.name)}</h3><p>${p.stock>0?`Stok ${p.stock}`:"Habis"}</p>
  <div class="product-bottom"><span class="price">${money(p.price)}</span>
  <button class="card-cart" type="button" data-add-code="${escapeHtml(p.code||"")}" data-price="${p.price}" ${p.stock<=0?"disabled":""} aria-label="Tambah ${escapeHtml(p.name)} ke keranjang">🛒</button></div>
 </article>`).join("") || `<div class="recipe-empty">Tidak ada produk yang cocok.</div>`;
}

let selectedProductCode="";
let productDetailQty=1;
const cart=[];
const toast=document.getElementById("toast");
function showToast(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1200)}
function getProductByCode(code){return code?productByCode[String(code)]:null;}
function renderProductDetail(){
 const detail=document.getElementById("productDetail");
 const p=getProductByCode(selectedProductCode);
 if(!detail||!p)return;
 const stock=Math.max(0,Number(p.stock)||0);
 productDetailQty=Math.max(1,Math.min(productDetailQty||1,stock||1));
 const id=String(p.code||p.name).replace(/[^a-zA-Z0-9]+/g,"-");
 const photoWrap=document.getElementById("productDetailPhotoWrap");
 if(photoWrap)photoWrap.innerHTML=productPhoto(p,`productDetail-${id}-photo`,`product-detail-photo`);
 document.getElementById("productDetailName").textContent=p.name;
 document.getElementById("productDetailPrice").textContent=money(p.price);
 const stockEl=document.getElementById("productDetailStock");
 stockEl.textContent=stock>0?`Stok ${stock}`:"Stok habis";
 stockEl.classList.toggle("is-empty",stock<=0);
 const desc=String(p.deskripsi||p.description||p.keterangan||"").trim();
 const descEl=document.getElementById("productDetailDescription");
 descEl.textContent=desc;
 descEl.hidden=!desc;
 document.getElementById("productDetailQty").textContent=stock>0?String(productDetailQty):"0";
 document.getElementById("productDetailMinus").disabled=stock<=0||productDetailQty<=1;
 document.getElementById("productDetailPlus").disabled=stock<=0||productDetailQty>=stock;
 document.getElementById("productDetailAdd").disabled=stock<=0;
}
function openProductDetail(code){
 const p=getProductByCode(code);
 if(!p)return;
 selectedProductCode=String(p.code);
 productDetailQty=1;
 const detail=document.getElementById("productDetail");
 if(!detail)return;
 detail.hidden=false;
 document.body.classList.add("product-detail-open");
 renderProductDetail();
}
function closeProductDetail(){
 const detail=document.getElementById("productDetail");
 if(!detail)return;
 detail.hidden=true;
 selectedProductCode="";
 productDetailQty=1;
 document.body.classList.remove("product-detail-open");
}
function changeProductDetailQty(delta){
 const p=getProductByCode(selectedProductCode);
 if(!p)return;
 const stock=Math.max(0,Number(p.stock)||0);
 if(stock<=0)return;
 productDetailQty=Math.max(1,Math.min(productDetailQty+delta,stock));
 renderProductDetail();
}
function getCartTotal(){return cart.reduce((sum,item)=>sum+(Number(item.price)||0)*(Number(item.qty)||0),0);}
function getCartQty(){return cart.reduce((sum,item)=>sum+(Number(item.qty)||0),0);}
function renderCart(){
 const count=document.getElementById("cartCount");
 const itemCount=document.getElementById("cartItemCount");
 const box=document.getElementById("cartItems");
 const total=getCartTotal();
 if(count)count.textContent=getCartQty();
 if(itemCount)itemCount.textContent=getCartQty();
 if(!box)return;
 box.innerHTML=cart.length?cart.map(item=>{
   const p=getProductByCode(item.code);
   const foto=String(p?.foto||"").trim();
   const photo=foto
     ? `<img class="cart-photo" src="${escapeHtml(foto)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.classList.add('cart-photo-placeholder');this.removeAttribute('src');this.alt='Foto belum tersedia'">`
     : `<div class="cart-photo cart-photo-placeholder">Foto belum tersedia</div>`;
   const stock=Math.max(0,Number(p?.stock)||Number(item.qty)||0);
   return `<div class="cart-row embossed" data-cart-code="${escapeHtml(item.code)}">
     ${photo}
     <div class="cart-main">
       <div class="cart-name">${escapeHtml(item.name)}</div>
       <div class="cart-price">${money(item.price)} / item</div>
       <div class="cart-controls">
         <button type="button" data-cart-action="minus" data-cart-code="${escapeHtml(item.code)}" aria-label="Kurangi ${escapeHtml(item.name)}">−</button>
         <b>${Number(item.qty)||0}</b>
         <button type="button" data-cart-action="plus" data-cart-code="${escapeHtml(item.code)}" ${stock<=Number(item.qty)?"disabled":""} aria-label="Tambah ${escapeHtml(item.name)}">+</button>
         <button class="cart-remove" type="button" data-cart-action="remove" data-cart-code="${escapeHtml(item.code)}" aria-label="Hapus ${escapeHtml(item.name)}">Hapus</button>
       </div>
     </div>
     <div class="cart-subtotal">${money((Number(item.price)||0)*(Number(item.qty)||0))}</div>
   </div>`;
 }).join(""):`<div class="cart-empty"><strong>Keranjang masih kosong.</strong><span>Tambahkan barang dari Belanja.</span></div>`;
 const totalEl=document.getElementById("cartTotal");
 if(totalEl)totalEl.textContent=money(total);
 const checkoutTotal=document.getElementById("checkoutGrandTotal");
 if(checkoutTotal)checkoutTotal.textContent=money(total);
 renderCheckoutCustomer();
}
function renderCheckoutCustomer(){
 const data=window.__customerData||{};
 const customerBox=document.getElementById("checkoutCustomerData");
 const addressBox=document.getElementById("checkoutAddressText");
 if(customerBox)customerBox.innerHTML=currentCustomerPhone
   ? `<div><b>${escapeHtml(data.nama||currentCustomerName||"Pelanggan")}</b></div><div>${escapeHtml(data.phone||currentCustomerPhone)}</div>`
   : `<div>Belum masuk sebagai pelanggan.</div>`;
 if(addressBox)addressBox.textContent=String(data.alamat||"").trim()||"Alamat belum diisi. Silakan lengkapi di Akun.";
}
function updateCheckoutPayment(){
 const method=document.querySelector('input[name="paymentMethod"]:checked')?.value||"COD";
 const proof=document.getElementById("checkoutProof");
 if(proof)proof.hidden=method!=="TF";
}
function changeCartQty(code,delta){
 const item=cart.find(x=>String(x.code)===String(code));
 if(!item)return;
 const p=getProductByCode(code);
 const stock=Math.max(0,Number(p?.stock)||0);
 const next=(Number(item.qty)||0)+delta;
 if(delta>0 && next>stock){showToast(`Stok ${p?.name||item.name} hanya ${stock}`);return;}
 if(next<=0){cart.splice(cart.indexOf(item),1);}else item.qty=next;
 renderCart();
}
function removeCartItem(code){
 const index=cart.findIndex(x=>String(x.code)===String(code));
 if(index<0)return;
 cart.splice(index,1);
 renderCart();
 showToast("Barang dihapus dari keranjang");
}
function clearCart(){
 if(!cart.length)return;
 if(!window.confirm("Kosongkan semua barang dari keranjang?"))return;
 cart.length=0;
 renderCart();
 closeCheckoutPanel();
 showToast("Keranjang dikosongkan");
}
function openCheckoutPanel(){
 if(!cart.length){showToast("Keranjang masih kosong");return;}
 if(!currentCustomerPhone){openLoginModal();return;}
 renderCart();
 document.getElementById("cartPanel")?.setAttribute("hidden","");
 const panel=document.getElementById("checkoutPanel");
 if(panel)panel.hidden=false;
 renderCheckoutCustomer();
 updateCheckoutPayment();
}
function closeCheckoutPanel(){
 const panel=document.getElementById("checkoutPanel");
 if(panel)panel.hidden=true;
 document.getElementById("cartPanel")?.removeAttribute("hidden");
}
async function readTransferProof(file){
 if(!file)return "";
 if(!file.type.startsWith("image/"))throw new Error("Bukti transfer harus berupa gambar.");
 return await new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onload=()=>{
     const img=new Image();
     img.onload=()=>{
       const max=600, scale=Math.min(1,max/Math.max(img.width,img.height));
       const canvas=document.createElement("canvas");
       canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
       const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);
       resolve(canvas.toDataURL("image/jpeg",.8));
     };
     img.onerror=()=>reject(new Error("Bukti transfer tidak dapat dibaca."));
     img.src=reader.result;
   };
   reader.onerror=()=>reject(new Error("Gagal membaca bukti transfer."));
   reader.readAsDataURL(file);
 });
}
function paymentLabel(method){return method==="TF"?"Transfer Bank":method==="WhatsApp"?"Pesan via WhatsApp":"COD (Bayar di Tempat)";}
function buildWhatsAppOrderMessage(order){
 const storePhone=String(window.__storeSettings?.whatsapp||window.__storeSettings?.phone||window.__storeSettings?.telepon||"").replace(/\D/g,"");
 if(!storePhone)return null;
 const lines=[`Halo ${window.__storeSettings?.nama||"Toko"}, saya ingin memesan:`,``,...order.items.map(x=>`• ${x.nama} × ${x.qty} = ${money(x.subtotal)}`),``,`Total: ${money(order.total)}`,`Pembayaran: ${order.metode}`,`Nama: ${order.customerNama}`,`No. HP: ${order.customerPhone}`,`Alamat: ${order.customerAlamat||"-"}`];
 if(order.catatanPelanggan)lines.push(`Catatan: ${order.catatanPelanggan}`);
 return `https://wa.me/${storePhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
async function processCheckout(){
 if(!currentCustomerPhone){openLoginModal();return;}
 if(!cart.length){showToast("Keranjang masih kosong");return;}
 const submit=document.getElementById("checkoutSubmit");
 if(submit?.disabled)return;
 const method=document.querySelector('input[name="paymentMethod"]:checked')?.value||"COD";
 const note=document.getElementById("checkoutNote")?.value.trim()||"";
 const proofFile=document.getElementById("checkoutProofFile")?.files?.[0]||null;
 if(method==="TF"&&!proofFile&&!document.getElementById("checkoutProofBase64")?.value){showToast("Bukti transfer wajib diunggah");return;}
 submit.disabled=true;submit.textContent="Memproses...";
 try{
   const proof=method==="TF"?(document.getElementById("checkoutProofBase64")?.value||await readTransferProof(proofFile)):"";
   if(method==="TF")document.getElementById("checkoutProofBase64").value=proof;
   const customer=window.__customerData||{};
   const orderItems=cart.map(x=>({code:String(x.code),qty:Number(x.qty)||0})).filter(x=>x.qty>0);
   if(!orderItems.length)throw new Error("Keranjang kosong.");
   const orderResult=await db.runTransaction(async tx=>{
     const refs=orderItems.map(x=>({item:x,ref:storeCollection("produk").doc(x.code)}));
     const docs=[];
     for(const entry of refs)docs.push(await tx.get(entry.ref));
     let total=0,modal=0,qtyTotal=0;
     const items=[];
     for(let i=0;i<refs.length;i++){
       const {item}=refs[i], snap=docs[i];
       if(!snap.exists)throw new Error(`Produk ${item.code} tidak ditemukan.`);
       const p=normalizeProduct(item.code,snap.data());
       if(p.stock<item.qty)throw new Error(`Stok ${p.name} hanya ${p.stock}.`);
       const subtotal=p.price*item.qty;
       const modalSatuan=Number(snap.data().hargaModal ?? snap.data().hargaBeli ?? snap.data().modal ?? 0)||0;
       total+=subtotal;modal+=modalSatuan*item.qty;qtyTotal+=item.qty;
       items.push({nama:p.name,qty:item.qty,subtotal,code:item.code});
       tx.update(refs[i].ref,{stok:Math.max(0,p.stock-item.qty)});
     }
     const transactionRef=storeCollection("transaksi").doc();
     const order={waktu:new Date().toLocaleString("id-ID"),waktuTimestamp:firebase.firestore.FieldValue.serverTimestamp(),total,modal,untung:total-modal,metode:paymentLabel(method),qty:qtyTotal,customerNama:String(customer.nama||currentCustomerName||"Pelanggan"),customerPhone:currentCustomerPhone,customerAlamat:String(customer.alamat||""),catatanPelanggan:note,buktiTransfer:proof,statusPesanan:"Menunggu Diproses",items};
     tx.set(transactionRef,order);
     return {id:transactionRef.id,...order};
   });
   cart.length=0;
   renderCart();
   document.getElementById("checkoutNote").value="";
   document.getElementById("checkoutProofFile").value="";
   document.getElementById("checkoutProofBase64").value="";
   closeCheckoutPanel();
   closeCart();
   showToast("Pesanan berhasil dibuat ✓");
   if(method==="WhatsApp"){
     const url=buildWhatsAppOrderMessage(orderResult);
     if(url)window.open(url,"_blank","noopener");
   }
 }catch(error){
   console.error("Checkout Toko 1:",error);
   showToast(error?.message||"Checkout gagal. Silakan coba lagi.");
 }finally{submit.disabled=false;submit.textContent="🛍️ Buat Pesanan";}
}

function addProductByCode(code, requestedQty=1){
 const p=getProductByCode(code);
 if(!p)return;
 const stock=Math.max(0,Number(p.stock)||0);
 if(stock<=0){showToast("Produk sedang habis");return false;}
 const qty=Math.max(1,Number(requestedQty)||1);
 const x=cart.find(i=>i.code===String(code));
 const current=x?Number(x.qty)||0:0;
 if(current>=stock){showToast(`Stok ${p.name} tidak mencukupi`);return false;}
 const nextQty=Math.min(current+qty,stock);
 if(x)x.qty=nextQty;
 else cart.push({name:p.name,price:p.price,qty:Math.min(qty,stock),code:String(code)});
 renderCart();
 if(nextQty<current+qty)showToast(`Stok ${p.name} hanya ${stock}`);
 else showToast(`${p.name} masuk keranjang ✓`);
 return true;
}
function addProductDetailToCart(){
 const p=getProductByCode(selectedProductCode);
 if(!p)return;
 addProductByCode(p.code,productDetailQty);
 renderProductDetail();
}
async function saveCurrentCartAsRecipe(){
 if(!currentCustomerPhone){openLoginModal();return;}
 if(!currentCustomerDocId){showToast("Data akun belum siap");return;}
 if(!cart.length){showToast("Keranjang masih kosong");return;}
 const nama=window.prompt("Nama menu pribadi:","Menu Favoritku");
 if(!nama||!nama.trim())return;
 const items=cart.map(x=>({code:x.code||catalog.find(p=>p.name===x.name)?.code||"",qty:x.qty})).filter(x=>x.code);
 if(!items.length){showToast("Produk menu belum memiliki kode");return;}
 const next=[...(customerSavedRecipes||[]),{id:`personal-${Date.now()}`,nama:nama.trim(),desc:"Menu pribadi pelanggan",items}].slice(-20);
 try{await storeCollection("pelanggan").doc(currentCustomerDocId).update({savedRecipes:next});customerSavedRecipes=next;renderIdeMasak();showToast("Menu pribadi tersimpan ✓");}catch(e){console.error(e);showToast("Gagal menyimpan menu");}
}
document.getElementById("saveCartAsRecipe")?.addEventListener("click",saveCurrentCartAsRecipe);
document.addEventListener("click",e=>{
 const cartAction=e.target.closest("[data-cart-action]");
 if(cartAction){
   const code=cartAction.dataset.cartCode, action=cartAction.dataset.cartAction;
   if(action==="plus")changeCartQty(code,1);
   else if(action==="minus")changeCartQty(code,-1);
   else if(action==="remove")removeCartItem(code);
   return;
 }
 const addButton=e.target.closest("[data-add-code]");
 if(addButton){e.stopPropagation();addProductByCode(addButton.dataset.addCode);return;}
 const productCard=e.target.closest("[data-product-code]");
 if(productCard){openProductDetail(productCard.dataset.productCode);return;}
});
document.getElementById("clearCart")?.addEventListener("click",clearCart);
document.getElementById("cartCheckout")?.addEventListener("click",openCheckoutPanel);
document.getElementById("checkoutBack")?.addEventListener("click",closeCheckoutPanel);
document.getElementById("checkoutSubmit")?.addEventListener("click",processCheckout);
document.querySelectorAll('input[name="paymentMethod"]').forEach(input=>input.addEventListener("change",updateCheckoutPayment));
document.getElementById("checkoutProofFile")?.addEventListener("change",async e=>{
 const file=e.target.files?.[0]; if(!file)return;
 try{document.getElementById("checkoutProofBase64").value=await readTransferProof(file);showToast("Bukti transfer siap");}
 catch(err){e.target.value="";document.getElementById("checkoutProofBase64").value="";showToast(err.message||"Bukti transfer tidak dapat dibaca");}
});
document.getElementById("productDetailClose")?.addEventListener("click",closeProductDetail);
document.getElementById("productDetailMinus")?.addEventListener("click",()=>changeProductDetailQty(-1));
document.getElementById("productDetailPlus")?.addEventListener("click",()=>changeProductDetailQty(1));
document.getElementById("productDetailAdd")?.addEventListener("click",addProductDetailToCart);
document.getElementById("kategori")?.addEventListener("click",e=>{
 const b=e.target.closest("[data-category]");
 if(!b)return;
 activeCategory=b.dataset.category||"Semua";
 renderCategoryFilters();
 renderProductCatalog();
});
const drawer=document.getElementById("drawer"),overlay=document.getElementById("overlay");
function openCart(){drawer.classList.add("open");overlay.classList.add("show");closeCheckoutPanel();renderCart()}
function closeCart(){drawer.classList.remove("open");overlay.classList.remove("show")}
document.getElementById("basket").onclick=openCart;
document.getElementById("closeDrawer").onclick=closeCart;
overlay.onclick=closeCart;

document.getElementById("search")?.addEventListener("input",e=>{
 catalogQuery=e.target.value.trim();
 renderProductCatalog();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.getElementById("productDetail")?.hidden)closeProductDetail();});
document.getElementById("aiBtn").onclick=()=>showToast("Halo Mimi! Ada yang bisa dibantu? 🤖");


// ===== NAVIGASI 1–4 — empat root view eksplisit, satu shell =====
const viewButtons=[
 document.getElementById("navBeranda"),
 document.getElementById("navBelanja"),
 document.getElementById("navKomunitas"),
 document.getElementById("navAkun")
].filter(Boolean);
const views=[
 document.getElementById("beranda"),
 document.getElementById("belanja"),
 document.getElementById("komunitas"),
 document.getElementById("akun")
].filter(Boolean);
let activeView="beranda";
function updateHeaderContext(viewId){
 const homeParts=[document.getElementById("TokoId"),document.getElementById("InfoToko")];
 const title=document.getElementById("headerContextTitle");
 homeParts.forEach(el=>el?.classList.toggle("header-home-only",viewId!=="beranda"));
 const labels={belanja:"Belanja",komunitas:"Komunitas",akun:"Akun"};
 if(title){title.textContent=labels[viewId]||"";title.hidden=viewId==="beranda";}
}
function switchView(viewId,{scrollTop=true}={}){
 closeProductDetail();
 const target=document.getElementById(viewId);
 if(!target)return;
 if(viewId==="komunitas" && !currentCustomerPhone){openLoginModal();return;}
 if(viewId==="akun" && !currentCustomerPhone){openLoginModal();return;}
 activeView=viewId;
 updateHeaderContext(viewId);
 views.forEach(view=>{const on=view.id===viewId;view.classList.toggle("active",on);view.hidden=!on;});
 viewButtons.forEach(btn=>{const on=btn.dataset.view===viewId;btn.classList.toggle("active",on);if(on)btn.setAttribute("aria-current","page");else btn.removeAttribute("aria-current");});
 if(viewId==="komunitas")initCommunityChat();
 if(viewId==="akun")renderAccountPage();
 if(scrollTop)window.scrollTo({top:0,behavior:"smooth"});
}
viewButtons.forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));

// ===== #akun — mesin data pelanggan, pesanan, resep, dan pengaturan =====
function renderAccountPage(){
 const data=window.__customerData||{};
 syncCustomerSettings();
 const dataBox=document.getElementById("dataPelangganContent");
 if(dataBox)dataBox.innerHTML=currentCustomerPhone?`<div><b>Nama</b><span>${escapeHtml(data.nama||currentCustomerName||"Pelanggan")}</span></div><div><b>WhatsApp</b><span>${escapeHtml(data.phone||currentCustomerPhone)}</span></div><div><b>Alamat</b><span>${escapeHtml(data.alamat||"Belum diisi")}</span></div>`:`<p>Silakan masuk sebagai pelanggan.</p>`;
 const orderBox=document.getElementById("pesananList");
 const orders=Array.isArray(window.__customerOrders)?[...window.__customerOrders]:[];
 if(orderBox)orderBox.innerHTML=orders.length?orders.sort((a,b)=>String(b.waktuTimestamp||b.waktu||b.tanggal).localeCompare(String(a.waktuTimestamp||a.waktu||a.tanggal))).slice(0,30).map(o=>{const items=Array.isArray(o.items)?o.items:[];const label=items.map(i=>`${escapeHtml(i.nama||i.name||i.code||"Barang")} × ${Number(i.qty||i.jumlah||1)}`).join(", ")||"Detail pesanan belum tersedia";return `<article class="account-row"><b>${label}</b><span>${escapeHtml(o.status||o.statusPesanan||o.waktu||o.tanggal||"Pesanan")}</span></article>`}).join(""):"<p>Belum ada riwayat pesanan.</p>";
 const recipeBox=document.getElementById("menuCustomList");
 const recipes=Array.isArray(data.savedRecipes)?data.savedRecipes:Array.isArray(data.menuResep)?data.menuResep:[];
 if(recipeBox)recipeBox.innerHTML=recipes.length?recipes.map((r,i)=>`<article class="account-row menu-custom-row" data-menu-index="${i}"><div><b>${escapeHtml(r.nama||r.name||r.judul||`Menu ${i+1}`)}</b><span>${escapeHtml(r.desc||r.deskripsi||"Menu tersimpan")}</span></div><div class="menu-custom-actions"><button type="button" class="account-mini" data-menu-action="add">+ Bahan</button><button type="button" class="account-mini" data-menu-action="share" aria-label="Bagikan menu">📢</button><button type="button" class="account-mini" data-menu-action="delete" aria-label="Hapus menu">🗑️</button></div></article>`).join(""):"<p>Belum ada menu resep tersimpan.</p>";
}
document.getElementById("akunLogout")?.addEventListener("click",()=>logoutCustomer());
document.getElementById("buatMenuCustom")?.addEventListener("click",saveCurrentCartAsRecipe);
document.getElementById("menuCustomList")?.addEventListener("click",async e=>{
 const row=e.target.closest("[data-menu-index]"); const btn=e.target.closest("[data-menu-action]"); if(!row||!btn)return;
 const index=Number(row.dataset.menuIndex); const recipe=customerSavedRecipes[index]; if(!recipe)return;
 const action=btn.dataset.menuAction;
 if(action==="add"){beliPaketIdeMasak(recipe);return;}
 if(action==="share"){shareRecipe(recipe);return;}
 if(action==="delete"){
   if(!currentCustomerDocId)return showToast("Data akun belum siap");
   if(!confirm(`Hapus menu "${recipe.nama||"Menu"}"?`))return;
   const next=customerSavedRecipes.filter((_,i)=>i!==index);
   try{await storeCollection("pelanggan").doc(currentCustomerDocId).update({savedRecipes:next});customerSavedRecipes=next;window.__customerData={...(window.__customerData||{}),savedRecipes:next};renderAccountPage();renderIdeMasak();showToast("Menu custom dihapus ✓");}
   catch(err){console.error(err);showToast("Gagal menghapus menu");}
 }
});

// ===== #komunitas — mesin chat pelanggan KasirQuh, dirapikan untuk Toko 1 =====
let rumpiUnsubscribe=null, adminChatUnsubscribe=null, adminMetaUnsubscribe=null;
let activeChat="rumpi";
function chatBubble(text, mine, name, time){
 const wrap=document.createElement("div"); wrap.className=`chat-bubble ${mine?"mine":"theirs"}`;
 if(name && !mine){const n=document.createElement("div");n.className="chat-name";n.textContent=name;wrap.appendChild(n);}
 const msg=document.createElement("div");msg.textContent=text||"";wrap.appendChild(msg);
 if(time){const tm=document.createElement("div");tm.className="chat-time";tm.textContent=time;wrap.appendChild(tm);}
 return wrap;
}
function renderRumpi(snapshot){
 const box=document.getElementById("chatRumpiMessages"); if(!box)return; box.replaceChildren();
 if(snapshot.empty){box.innerHTML='<p class="chat-empty">Belum ada percakapan. Yuk mulai ngobrol, Kak!</p>';return;}
 [...snapshot.docs].reverse().forEach(doc=>{const m=doc.data();box.appendChild(chatBubble(m.pesan,m.senderPhone===currentCustomerPhone,m.senderPhone===currentCustomerPhone?"":(m.senderName||"Warga Toko"),m.waktu||""));});
 box.scrollTop=box.scrollHeight;
}
function renderAdminChat(snapshot){
 const box=document.getElementById("chatAdminMessages"); if(!box)return; box.replaceChildren();
 if(snapshot.empty){box.innerHTML='<p class="chat-empty">Belum ada pesan. Sampaikan pertanyaan Anda ke toko!</p>';return;}
 [...snapshot.docs].reverse().forEach(doc=>{const m=doc.data();box.appendChild(chatBubble(m.pesan,m.pengirim==="customer","",m.waktu||""));});
 box.scrollTop=box.scrollHeight;
}
function initCommunityChat(){
 if(!currentCustomerPhone)return;
 if(!rumpiUnsubscribe){rumpiUnsubscribe=storeCollection("db_chat_rumpi").orderBy("waktuTimestamp","desc").limit(100).onSnapshot(renderRumpi,err=>console.warn("Chat rumpi:",err));}
 if(!adminChatUnsubscribe){adminChatUnsubscribe=storeCollection("chats").doc(currentCustomerPhone).collection("messages").orderBy("waktuTimestamp","desc").limit(100).onSnapshot(renderAdminChat,err=>console.warn("Chat admin:",err));}
 if(!adminMetaUnsubscribe){adminMetaUnsubscribe=storeCollection("chats").doc(currentCustomerPhone).onSnapshot(doc=>{const unread=Number(doc.data()?.unreadCustomer||0);const tab=document.getElementById("chatTabAdmin");if(tab)tab.dataset.unread=unread>0?String(unread):"";});}
}
function switchChatSubtab(type){
 if(!currentCustomerPhone){openLoginModal();return;} activeChat=type;
 document.querySelectorAll("#chatSubnav .chat-subtab").forEach(b=>b.classList.toggle("active",b.dataset.chat===type));
 document.querySelectorAll("#komunitas .chat-pane").forEach(p=>{const on=p.dataset.pane===type;p.classList.toggle("active",on);p.hidden=!on;});
 if(type==="admin")storeCollection("chats").doc(currentCustomerPhone).set({unreadCustomer:0},{merge:true}).catch(()=>{});
}
document.querySelectorAll("#chatSubnav .chat-subtab").forEach(btn=>btn.addEventListener("click",()=>switchChatSubtab(btn.dataset.chat)));
document.getElementById("chatRumpiForm")?.addEventListener("submit",e=>{
 e.preventDefault(); if(!currentCustomerPhone){openLoginModal();return;} const input=document.getElementById("chatRumpiInput"),pesan=input.value.trim();if(!pesan)return;
 const now=new Date(),waktu=now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+" "+now.toLocaleDateString("id-ID");
 storeCollection("db_chat_rumpi").add({senderPhone:currentCustomerPhone,senderName:currentCustomerName||"Pelanggan",pesan,waktu,waktuTimestamp:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>input.value="").catch(err=>showToast("Gagal mengirim pesan"));
});
document.getElementById("chatAdminForm")?.addEventListener("submit",e=>{
 e.preventDefault(); if(!currentCustomerPhone){openLoginModal();return;} const input=document.getElementById("chatAdminInput"),pesan=input.value.trim();if(!pesan)return;
 const now=new Date(),waktu=now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+" "+now.toLocaleDateString("id-ID");
 const ref=storeCollection("chats").doc(currentCustomerPhone);
 ref.collection("messages").add({pengirim:"customer",pesan,waktu,waktuTimestamp:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>ref.set({customerNama:currentCustomerName,lastMessage:currentCustomerName+": "+pesan,lastTimestamp:firebase.firestore.FieldValue.serverTimestamp(),unreadAdmin:firebase.firestore.FieldValue.increment(1)},{merge:true})).then(()=>input.value="").catch(()=>showToast("Gagal mengirim pesan"));
});

const style=document.createElement("style");
style.textContent=`
.product-photo{background-size:cover;background-position:center}
`;
document.head.appendChild(style);
renderCart();

// Mulai sinkronisasi produk realtime dari Firestore KasirQuh.
startProductDatabase();
updateCustomerButton();
loadCustomerSession();

// ===== #pengaturan — mesin profil, tema, bagikan, dan sesi =====
const customerThemeKey="cust_theme_toko1_v1";
function applyCustomerTheme(theme){
  const value=["modern","light","dark"].includes(theme)?theme:"modern";
  document.documentElement.dataset.theme=value;
  localStorage.setItem(customerThemeKey,value);
  const select=document.getElementById("pengaturanTemaSelect");
  if(select)select.value=value;
}
function syncCustomerSettings(){
  const data=window.__customerData||{};
  const nama=document.getElementById("pengaturanNama");
  const nomor=document.getElementById("pengaturanNomor");
  const alamat=document.getElementById("pengaturanAlamat");
  if(nama)nama.value=String(data.nama||currentCustomerName||"");
  if(nomor)nomor.value=String(data.phone||currentCustomerPhone||"");
  if(alamat)alamat.value=String(data.alamat||"");
  applyCustomerTheme(localStorage.getItem(customerThemeKey)||"modern");
}
async function simpanPengaturanProfil(){
  const status=document.getElementById("pengaturanProfilStatus");
  const setStatus=t=>{if(status)status.textContent=t;};
  if(!currentCustomerDocId){setStatus("Silakan masuk sebagai pelanggan.");return;}
  const nama=document.getElementById("pengaturanNama")?.value.trim()||"Pelanggan";
  const alamat=document.getElementById("pengaturanAlamat")?.value.trim()||"";
  const password=document.getElementById("pengaturanPassword")?.value||"";
  const update={nama,alamat};
  if(password)update.password=password;
  try{
    await storeCollection("pelanggan").doc(currentCustomerDocId).update(update);
    currentCustomerName=nama;
    window.__customerData={...(window.__customerData||{}),...update,phone:currentCustomerPhone};
    updateCustomerButton();
    const pass=document.getElementById("pengaturanPassword");if(pass)pass.value="";
    renderAccountPage();
    setStatus("✓ Perubahan tersimpan.");
  }catch(err){console.error("Simpan pengaturan pelanggan:",err);setStatus("Gagal menyimpan perubahan.");}
}
async function bagikanAplikasi(){
  const shareData={title:document.title,text:"Yuk gunakan Toko 1 untuk belanja lebih praktis."};
  try{
    if(navigator.share){await navigator.share(shareData);return;}
    const text=encodeURIComponent(shareData.text+(location.href?" "+location.href:""));
    window.open("https://wa.me/?text="+text,"_blank","noopener");
  }catch(err){if(err?.name!=="AbortError")showToast("Belum bisa membagikan aplikasi.");}
}
document.getElementById("pengaturanTemaSelect")?.addEventListener("change",e=>applyCustomerTheme(e.target.value));
document.getElementById("simpanPengaturanProfil")?.addEventListener("click",simpanPengaturanProfil);
document.getElementById("bagikanAplikasi")?.addEventListener("click",bagikanAplikasi);
applyCustomerTheme(localStorage.getItem(customerThemeKey)||"modern");
