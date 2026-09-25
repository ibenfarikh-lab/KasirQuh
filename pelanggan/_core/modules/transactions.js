/* KasirQuh V14 Phase 10 — Transaction module
 * Extracted from _core/script.js without changing Firestore schema.
 * Checkout/history keep the existing transaction document shape.
 */
async function prosesCheckoutPelanggan() {
      if (cart.length === 0) return alert("Keranjang kosong!"); 
      const payMethod = document.getElementById("pay-method-cust").value; 
      const proofBase64 = document.getElementById("cust-proof-base64").value; 
      const catatanPelanggan = document.getElementById("cust-order-note").value.trim(); 
      const isSaveRecipeChecked = document.getElementById("cust-save-recipe-toggle").checked;
      const saveRecipeName = document.getElementById("cust-save-recipe-name").value.trim();
      const isShareRumpiChecked = document.getElementById("cust-share-rumpi-toggle").checked;

      if (payMethod === "TF" && !proofBase64) return alert("Harap unggah bukti transfer!");
      if (isSaveRecipeChecked && !saveRecipeName) return alert("Harap isi nama menu resep yang akan disimpan!");

      let phoneToko = pengaturanToko.phone.replace(/[^0-9]/g, ''); if (phoneToko.startsWith('0')) phoneToko = '62' + phoneToko.slice(1);
      storeCollection("pelanggan").where("phone", "==", currentCustomerPhone).get().then(async (snap) => {
        let namaCust = "Pelanggan", alamatCust = "-"; if (!snap.empty) { namaCust = snap.docs[0].data().nama || "Pelanggan"; alamatCust = snap.docs[0].data().alamat || "-"; }
        let totalBelanja = cart.reduce((acc, i) => acc + i.subtotal, 0); let totalModal = cart.reduce((acc, i) => acc + (i.modal * i.qty), 0); let keuntungan = totalBelanja - totalModal; let totalQty = cart.reduce((acc, i) => acc + i.qty, 0); let namaMetode = payMethod === "TF" ? "Transfer Bank" : (payMethod === "WhatsApp" ? "Pesan via WhatsApp" : "COD (Bayar di Tempat)");
        try {
          let batch = db.batch(); cart.forEach(item => { let pData = databaseProduk[item.code]; if (pData) batch.update(storeCollection("produk").doc(item.code), { stok: Math.max(0, parseFloat(((pData.stok || 0) - item.qty).toFixed(3))) }); }); let newTrxRef = storeCollection("transaksi").doc(); batch.set(newTrxRef, { waktu: new Date().toLocaleString('id-ID'), waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp(), total: totalBelanja, modal: totalModal, untung: keuntungan, metode: namaMetode, qty: totalQty, customerNama: namaCust, customerPhone: currentCustomerPhone, customerAlamat: alamatCust, catatanPelanggan: catatanPelanggan, buktiTransfer: payMethod === "TF" ? proofBase64 : "", statusPesanan: "Menunggu Diproses", items: cart.map(i => ({ nama: i.nama, qty: i.qty, subtotal: i.subtotal, code: i.code })) }); await batch.commit();

          if (isSaveRecipeChecked && currentCustomerDocId) {
            let itemsArr = cart.map(i => ({ code: i.code, qty: i.qty }));
            let newRecipeObj = { nama: saveRecipeName, items: itemsArr };
            await storeCollection("pelanggan").doc(currentCustomerDocId).update({
              savedRecipes: firebase.firestore.FieldValue.arrayUnion(newRecipeObj)
            });
            customerSavedRecipes.push(newRecipeObj);
            renderRecipeCards();

            if (isShareRumpiChecked && currentCustomerPhone) {
              let itemListText = "";
              cart.forEach(i => {
                itemListText += `- ${i.nama} (${i.qty})\n`;
              });
              let pesanRumpi = `🍳 *Menu Racikan dari ${namaCust}*\nNama Menu: "${saveRecipeName}"\nBahan-bahan:\n${itemListText}Perkiraan Total: Rp ${Math.round(totalBelanja).toLocaleString('id-ID')}`;
              let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');
              storeCollection("db_chat_rumpi").add({
                senderPhone: currentCustomerPhone,
                senderName: namaCust,
                pesan: pesanRumpi,
                waktu: nowStr,
                waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
              }).catch(()=>{});
            }
          }

          let text = `*PESANAN BARU DARI PELANGGAN* 🛒\nNama : *${namaCust}*\nNo WA : ${currentCustomerPhone}\nAlamat : ${alamatCust}\nMetode : *${namaMetode}*\n`; if (catatanPelanggan) text += `Catatan : _${catatanPelanggan}_\n`; text += `------------------------------------\n`; cart.forEach((item, idx) => { text += `${idx + 1}. ${item.nama} (${item.qty}x) = Rp ${item.subtotal.toLocaleString('id-ID')}\n`; }); text += `------------------------------------\n*Total : Rp ${totalBelanja.toLocaleString('id-ID')}*`; window.open(`https://wa.me/${phoneToko}?text=${encodeURIComponent(text)}`, '_blank');
          alert("Pesanan berhasil dikirim!"); cart = []; document.getElementById("cust-order-note").value = ""; document.getElementById("cust-save-recipe-toggle").checked = false; document.getElementById("cust-save-recipe-name").value = ""; document.getElementById("wrapper-save-recipe-fields").style.display = "none"; renderCartPelanggan(); refreshKatalogPelanggan(); closeCartModal();
        } catch (err) { alert("Gagal memproses pesanan: " + err.message); }
      });
    }

function renderQuickReorder(orders) {
      const container = document.getElementById("reorder-container"); const wrapper = document.getElementById("reorder-section-wrapper"); container.innerHTML = ""; let recentCodes = new Set(); orders.forEach(trx => { if(trx.items) trx.items.forEach(it => { if(it.code) recentCodes.add(it.code); }); });
      let renderedCount = 0; let itemsHtml = ""; 
      recentCodes.forEach(code => { 
        let p = databaseProduk[code]; 
        const stokRumahCfg = window.__stokRumahConfig || {enabled:true, limit:5};
        const stokRumahLimit = Math.min(20, Math.max(1, parseInt(stokRumahCfg.limit,10) || 5));
        if(stokRumahCfg.enabled !== false && p && (p.stok || 0) > 0 && renderedCount < stokRumahLimit) { 
          let fotoSrc = p.foto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/></svg>"; 
          let satuan = (p.satuan || "Pcs").toLowerCase() === 'rtg' ? "pcs" : (p.satuan || "Pcs"); 
          let valHarga = p.hargaJual !== undefined ? p.hargaJual : (p.harga || 0); 
          let hargaParsed = typeof valHarga === 'number' ? valHarga : parseInt(valHarga.toString().replace(/[^0-9]/g, '')) || 0; 
          if ((satuan.toLowerCase() === 'kg' || satuan.toLowerCase() === 'kilogram')) hargaParsed *= 10; 
          
          itemsHtml += `<div class="reorder-card" onclick="openProductDetail('${code}')"><img src="${fotoSrc}" style="width: 100%; height: 55px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3);"><div style="font-size: 0.68rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">${p.nama}</div><div style="font-size: 0.68rem; color: #fde047; font-weight: bold;">Rp ${hargaParsed.toLocaleString('id-ID')}</div></div>`; 
          renderedCount++; 
        } 
      });
      
      if(renderedCount > 0) {
        container.innerHTML = `<div class="auto-scroll-track">${itemsHtml}${itemsHtml}</div>`;
        setupSeamlessReorderScroll("reorder-container");
      }

      if(renderedCount > 0 && activeKategoriPelanggan === 'Home' && document.getElementById('belanja').classList.contains('active')) { wrapper.style.display = "block"; } else { wrapper.style.display = "none"; }
    }

function muatRiwayatPesananOnlinePelanggan() { 
      storeCollection("transaksi").where("customerPhone", "==", currentCustomerPhone).onSnapshot((snapshot) => { 
        const container = document.getElementById("customer-online-orders-container"); 
        if (!container) return; 
        container.innerHTML = ""; 
        if (snapshot.empty) { 
          container.innerHTML = `<div class="empty-state" style="font-size: 0.78rem;">Belum ada riwayat pesanan online.</div>`; 
          lastFetchedOrders = [];
          renderQuickReorder([]); 
          return; 
        } 
        let orders = []; 
        snapshot.forEach(doc => { orders.push({ id: doc.id, ...doc.data() }); }); 
        orders.sort((a, b) => { 
          let timeA = a.waktuTimestamp?.toMillis ? a.waktuTimestamp.toMillis() : 0; 
          let timeB = b.waktuTimestamp?.toMillis ? b.waktuTimestamp.toMillis() : 0; 
          return timeB - timeA; 
        }); 
        lastFetchedOrders = orders;
        renderQuickReorder(orders); 
        orders.forEach(trx => { 
          let statusLabel = trx.statusPesanan || "Menunggu Diproses"; 
          let s_lower = statusLabel.toLowerCase(); 
          let step = 1; 
          if(s_lower.includes("siap") || s_lower.includes("proses")) step = 2; 
          else if(s_lower.includes("kirim") || s_lower.includes("jalan")) step = 3; 
          else if(s_lower.includes("selesai")) step = 4; 
          let timelineHtml = `<div class="order-timeline"><div class="timeline-step ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 1 ? '✓' : '1'}</div><div class="timeline-text">Menunggu</div></div><div class="timeline-step ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 2 ? '✓' : '2'}</div><div class="timeline-text">Dikemas</div></div><div class="timeline-step ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}"><div class="timeline-icon">${step > 3 ? '✓' : '3'}</div><div class="timeline-text">Dikirim</div></div><div class="timeline-step ${step >= 4 ? 'completed' : ''}"><div class="timeline-icon">${step >= 4 ? '✓' : '4'}</div><div class="timeline-text">Selesai</div></div></div>`; 
          let itemsHtml = ""; 
          if (trx.items && trx.items.length > 0) { 
            itemsHtml = `<div style="margin: 4px 0; font-size: 0.72rem; background: var(--input-bg); padding: 6px; border-radius: 6px; color:var(--text-color);"><strong>Rincian Barang:</strong><ul style="margin: 2px 0 0 12px; padding: 0;">`; 
            trx.items.forEach(it => { itemsHtml += `<li>${it.nama} (${it.qty}x)</li>`; }); 
            itemsHtml += `</ul></div>`; 
          } 
          container.innerHTML += `<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; margin-bottom: 8px; background: var(--card-bg); box-shadow: 0 1px 4px rgba(0,0,0,0.05);"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;"><span style="font-size: 0.68rem; color: var(--text-muted);">🗓️ ${trx.waktu || '-'}</span><span style="background: ${step===4 ? '#16a34a' : (step===1 ? '#ef4444' : '#d97706')}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.62rem; font-weight: bold;">${statusLabel}</span></div>${timelineHtml}<div style="font-size: 0.75rem; font-weight: 600; color: #2563eb;">Metode: ${trx.metode || '-'}</div>${itemsHtml}<div style="font-size: 0.82rem; font-weight: 800; color: #16a34a; text-align: right;">Total: Rp ${(trx.total || 0).toLocaleString('id-ID')}</div></div>`; 
        }); 
      }); 
    }
