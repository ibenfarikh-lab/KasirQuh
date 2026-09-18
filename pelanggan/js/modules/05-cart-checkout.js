function renderCartPelanggan() {
      const tbody = document.getElementById("cart-body"); tbody.innerHTML = ""; let total = 0, totalQty = 0;
      cart.forEach((item) => {
        total += item.subtotal; totalQty += item.qty;
        tbody.innerHTML += `
          <tr>
            <td style="font-size:0.75rem; font-weight:bold; color:var(--text-color);">${item.nama}</td>
            <td style="text-align: center; white-space: nowrap;">
              <button onclick="ubahQtyKeranjang('${item.code}', -1)" style="width:22px; height:22px; background:#dc2626; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.7rem;">-</button>
              <span style="display:inline-block; width:28px; font-size:0.78rem; font-weight:bold; color:var(--text-color);">${item.qty}</span>
              <button onclick="ubahQtyKeranjang('${item.code}', 1)" style="width:22px; height:22px; background:#16a34a; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.7rem;">+</button>
            </td>
            <td style="text-align: right; font-size:0.75rem; font-weight:bold; color:var(--text-color);">${item.subtotal.toLocaleString('id-ID')}</td>
          </tr>`;
      });
      if (cart.length === 0) tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 10px; font-size: 0.75rem;">Keranjang kosong</td></tr>`;
      document.getElementById("cart-count").innerText = totalQty; document.getElementById("grand-total").innerText = total.toLocaleString('id-ID');
    }

    function ubahQtyKeranjang(code, dir) {
      let idx = cart.findIndex(i => i.code === code); if (idx === -1) return;
      let item = cart[idx]; let p = databaseProduk[code]; if(!p) return;
      let isKg = ((p.satuan || "").toLowerCase().trim() === "kg" || (p.satuan || "").toLowerCase().trim() === "kilogram");
      let step = isKg ? 0.25 : 1;
      
      if (dir > 0) {
        if(item.qty + step > p.stok) { alert("Stok tidak mencukupi!"); return; }
        item.qty += step; playBeep();
      } else {
        if(item.qty - step < step) { 
           cart.splice(idx, 1); playBeepDown(); 
        } else { item.qty -= step; playBeepDown(); }
      }
      
      if(cart[idx]) {
        item.qty = parseFloat(item.qty.toFixed(3));
        item.subtotal = Math.round(item.qty * item.harga);
      }
      renderCartPelanggan();
    }

    function kosongkanKeranjang() { if (cart.length === 0) return alert("Keranjang sudah kosong!"); if (confirm("Kosongkan keranjang?")) { cart = []; renderCartPelanggan(); refreshKatalogPelanggan(); closeCartModal(); } }
    function openCartModal() { appOpenModal('cartModal'); document.getElementById('cartModal').classList.add('show'); }
    function closeCartModal() { if (!appNavRestoring && history.state?.__kasirquhState?.modal === 'cartModal') { history.back(); return; } document.getElementById('cartModal').classList.remove('show'); }
    function togglePayMethodCust() { document.getElementById("wrapper-tf-proof").style.display = (document.getElementById("pay-method-cust").value === "TF") ? "block" : "none"; }
    function handleProofUpload(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { const img = new Image(); img.onload = function() { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); let w = img.width, h = img.height; if (w > h) { if (w > 600) { h *= 600 / w; w = 600; } } else { if (h > 600) { w *= 600 / h; h = 600; } } canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h); document.getElementById("cust-proof-base64").value = canvas.toDataURL('image/jpeg', 0.8); }; img.src = e.target.result; }; reader.readAsDataURL(file); }

    function prosesSimpanMenuSaja() {
      if (cart.length === 0) return alert("Keranjang kosong, tidak ada barang untuk disimpan!");
      if (!currentCustomerDocId) return alert("Silakan login terlebih dahulu.");

      const saveRecipeName = document.getElementById("cust-save-recipe-name").value.trim();
      const isShareRumpiChecked = document.getElementById("cust-share-rumpi-toggle").checked;

      if (!saveRecipeName) return alert("Harap isi nama menu resep terlebih dahulu!");

      let itemsArr = cart.map(i => ({ code: i.code, qty: i.qty }));
      let newRecipeObj = { nama: saveRecipeName, items: itemsArr };

      storeCollection("pelanggan").doc(currentCustomerDocId).update({
        savedRecipes: firebase.firestore.FieldValue.arrayUnion(newRecipeObj)
      }).then(() => {
        customerSavedRecipes.push(newRecipeObj);
        renderRecipeCards();

        if (isShareRumpiChecked && currentCustomerPhone) {
          let totalBelanja = cart.reduce((acc, i) => acc + i.subtotal, 0);
          let itemListText = "";
          cart.forEach(i => {
            itemListText += `- ${i.nama} (${i.qty})\n`;
          });
          let pesanRumpi = `🍳 *Menu Racikan dari ${currentCustomerName || 'Pelanggan'}*\nNama Menu: "${saveRecipeName}"\nBahan-bahan:\n${itemListText}Perkiraan Total: Rp ${Math.round(totalBelanja).toLocaleString('id-ID')}`;
          let nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID');
          storeCollection("db_chat_rumpi").add({
            senderPhone: currentCustomerPhone,
            senderName: currentCustomerName || 'Pelanggan',
            pesan: pesanRumpi,
            waktu: nowStr,
            waktuTimestamp: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(()=>{});
        }

        showToast("🌟 Menu resep berhasil disimpan ke database akunmu!");
        document.getElementById("cust-save-recipe-name").value = "";
        document.getElementById("cust-save-recipe-toggle").checked = false;
        document.getElementById("wrapper-save-recipe-fields").style.display = "none";
        closeCartModal();
      }).catch(err => {
        alert("Gagal menyimpan menu: " + err.message);
      });
    }

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
