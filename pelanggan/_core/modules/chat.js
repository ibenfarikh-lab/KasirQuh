/* KasirQuh V14 Phase 11 — Chat + AI physical module extraction */
(function(){
  window.KQModules = window.KQModules || {};
  const state = window.KQChatState = window.KQChatState || {
    customerChatUnsubscribe:null,
    chatRumpiUnsubscribe:null,
    unreadRumpiCust:0,
    isAiSoundOn:true,
    aiRecognition:null,
    isAiListening:false
  };

  function startAiListeningState(){
    state.isAiListening=true;
    const micBtn=document.getElementById('aiMicButton');
    const input=document.getElementById('ai-chat-input');
    if(micBtn){ micBtn.style.background='#dc2626'; micBtn.innerText='🛑'; }
    if(input) input.placeholder='Mendengarkan...';
  }
  function stopAiListeningState(){
    state.isAiListening=false;
    const micBtn=document.getElementById('aiMicButton');
    const input=document.getElementById('ai-chat-input');
    if(micBtn){ micBtn.style.background='#374151'; micBtn.innerText='🎤'; }
    if(input) input.placeholder='Tanya stok, harga...';
  }
  function initSpeech(){
    if(state.aiRecognition || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition=window.SpeechRecognition || window.webkitSpeechRecognition;
    state.aiRecognition=new SpeechRecognition();
    state.aiRecognition.lang='id-ID';
    state.aiRecognition.onresult=function(e){
      const input=document.getElementById('ai-chat-input');
      if(input) input.value=e.results[0][0].transcript;
      stopAiListeningState();
      window.kirimPesanKeAI?.();
    };
    state.aiRecognition.onerror=stopAiListeningState;
    state.aiRecognition.onend=stopAiListeningState;
  }
  function toggleAISpeechRecognition(){
    initSpeech();
    if(!state.aiRecognition) return window.showToast?.('Fitur suara tidak didukung browser ini.','error');
    if(state.isAiListening){ state.aiRecognition.stop(); stopAiListeningState(); }
    else { state.aiRecognition.start(); startAiListeningState(); }
  }
  function toggleAISound(){
    state.isAiSoundOn=!state.isAiSoundOn;
    const btn=document.getElementById('aiSoundToggle');
    if(btn) btn.innerText=state.isAiSoundOn?'🔊 Suara: ON':'🔇 Suara: OFF';
    if(!state.isAiSoundOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function switchSubTabLiveChat(sub){
    const btnAdmin=document.getElementById('subtab-btn-admin'); const btnRumpi=document.getElementById('subtab-btn-rumpi');
    const contentAdmin=document.getElementById('subtab-admin-content'); const contentRumpi=document.getElementById('subtab-rumpi-content');
    if(!btnAdmin||!btnRumpi||!contentAdmin||!contentRumpi) return;
    if(sub==='admin'){
      btnAdmin.style.color='#2563eb'; btnAdmin.style.borderBottomColor='#2563eb'; btnRumpi.style.color='var(--text-muted)'; btnRumpi.style.borderBottomColor='transparent';
      contentAdmin.style.display='flex'; contentRumpi.style.display='none';
      if(window.currentCustomerPhone) window.storeCollection?.('chats').doc(window.currentCustomerPhone).update({unreadCustomer:0}).catch(()=>{});
    }else{
      btnRumpi.style.color='#2563eb'; btnRumpi.style.borderBottomColor='#2563eb'; btnAdmin.style.color='var(--text-muted)'; btnAdmin.style.borderBottomColor='transparent';
      contentRumpi.style.display='flex'; contentAdmin.style.display='none';
      state.unreadRumpiCust=0;
      document.getElementById('badge-rumpi-subtab')?.style.setProperty('display','none');
      document.getElementById('badge-livechat-cust')?.style.setProperty('display','none');
    }
  }

  function initChatRumpiListener(){
    let isInitialLoadRumpi=true;
    if(state.chatRumpiUnsubscribe) state.chatRumpiUnsubscribe();
    if(!window.storeCollection) return;
    state.chatRumpiUnsubscribe=window.storeCollection('db_chat_rumpi').orderBy('waktuTimestamp','asc').onSnapshot((snapshot)=>{
      if(!isInitialLoadRumpi){
        snapshot.docChanges().forEach((change)=>{
          if(change.type==='added' && change.doc.data().senderPhone!==window.currentCustomerPhone){
            window.playCustomerNotificationSound?.();
            const active=document.getElementById('live-chat')?.classList.contains('active') && document.getElementById('subtab-rumpi-content')?.style.display!=='none';
            if(!active){
              state.unreadRumpiCust++;
              const sub=document.getElementById('badge-rumpi-subtab'); const main=document.getElementById('badge-livechat-cust');
              if(sub){sub.innerText=state.unreadRumpiCust;sub.style.display='inline-block';}
              if(main){main.innerText=state.unreadRumpiCust;main.style.display='inline-block';}
            }
          }
        });
      }
      isInitialLoadRumpi=false;
      const box=document.getElementById('chat-rumpi-messages'); if(!box) return;
      box.innerHTML=snapshot.empty?'<div style="text-align:center;color:var(--text-muted);font-size:.78rem;margin-top:15px">Belum ada percakapan. Yuk mulai ngobrol, Kak!</div>':'';
      snapshot.forEach(doc=>{
        const m=doc.data(); const mine=m.senderPhone===window.currentCustomerPhone;
        const align=mine?'align-self:flex-end;background:#2563eb;color:white;':'align-self:flex-start;background:var(--input-bg);color:var(--text-color);border:1px solid var(--border-color);';
        box.innerHTML+=`<div style="max-width:75%;padding:6px 10px;border-radius:8px;font-size:.78rem;${align}">${!mine?`<div style="font-size:.65rem;font-weight:bold;color:#16a34a;margin-bottom:2px">${m.senderName||'Warga Toko'}</div>`:''}<div>${window.escapeHtml?.(m.pesan||'') || String(m.pesan||'')}</div><div style="font-size:.58rem;opacity:.8;text-align:right;margin-top:2px">${m.waktu||''}</div></div>`;
      });
      box.scrollTop=box.scrollHeight;
    });
  }

  function kirimPesanChatRumpi(){
    if(!window.currentCustomerPhone) return alert('Silakan login untuk ikut merumpikan!');
    const input=document.getElementById('chat-rumpi-input'); const pesan=input?.value.trim(); if(!pesan) return;
    const now=new Date(); const waktu=now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+' '+now.toLocaleDateString('id-ID');
    window.storeCollection?.('db_chat_rumpi').add({senderPhone:window.currentCustomerPhone,senderName:window.currentCustomerName||'Pelanggan',pesan,waktu,waktuTimestamp:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>{if(input) input.value='';}).catch(err=>alert('Gagal mengirim pesan: '+err.message));
  }

  function initCustomerChatListener(){
    if(!window.currentCustomerPhone || !window.storeCollection) return;
    window.storeCollection('chats').doc(window.currentCustomerPhone).onSnapshot((doc)=>{
      const badge=document.getElementById('badge-admin-subtab'); const unread=doc.exists?(doc.data().unreadCustomer||0):0;
      if(badge){badge.innerText=unread;badge.style.display=unread>0?'inline-block':'none';}
    });
    if(state.customerChatUnsubscribe) state.customerChatUnsubscribe();
    let initial=true;
    state.customerChatUnsubscribe=window.storeCollection('chats').doc(window.currentCustomerPhone).collection('messages').orderBy('waktuTimestamp','asc').onSnapshot((snapshot)=>{
      if(!initial) snapshot.docChanges().forEach(change=>{if(change.type==='added'&&change.doc.data().pengirim==='admin') window.playCustomerNotificationSound?.();});
      initial=false;
      const box=document.getElementById('customer-chat-messages'); if(!box) return;
      box.innerHTML=snapshot.empty?'<div style="text-align:center;color:var(--text-muted);font-size:.78rem;margin-top:15px">Belum ada pesan. Sampaikan pertanyaan Anda ke toko!</div>':'';
      snapshot.forEach(doc=>{const m=doc.data();const mine=m.pengirim==='customer';const align=mine?'align-self:flex-end;background:#2563eb;color:white;':'align-self:flex-start;background:var(--input-bg);color:var(--text-color);border:1px solid var(--border-color);';box.innerHTML+=`<div style="max-width:75%;padding:6px 10px;border-radius:8px;font-size:.78rem;${align}"><div>${window.escapeHtml?.(m.pesan||'') || String(m.pesan||'')}</div><div style="font-size:.58rem;opacity:.8;text-align:right;margin-top:2px">${m.waktu||''}</div></div>`;});
      box.scrollTop=box.scrollHeight;
    });
  }

  function kirimPesanPelanggan(){
    if(!window.currentCustomerPhone) return alert('Silakan login terlebih dahulu!');
    const input=document.getElementById('customer-chat-input'); const pesan=input?.value.trim(); if(!pesan) return;
    const now=new Date(); const waktu=now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+' '+now.toLocaleDateString('id-ID');
    window.storeCollection?.('chats').doc(window.currentCustomerPhone).collection('messages').add({pengirim:'customer',pesan,waktu,waktuTimestamp:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>window.storeCollection('chats').doc(window.currentCustomerPhone).set({customerNama:window.currentCustomerName,lastMessage:window.currentCustomerName+': '+pesan,lastTimestamp:firebase.firestore.FieldValue.serverTimestamp(),unreadAdmin:firebase.firestore.FieldValue.increment(1)},{merge:true})).then(()=>{if(input) input.value='';}).catch(err=>alert('Gagal mengirim pesan: '+err.message));
  }

  async function kirimPesanKeAI(){
    const input=document.getElementById('ai-chat-input'); const box=document.getElementById('ai-chat-messages'); const prompt=input?.value.trim(); if(!input||!box||!prompt) return;
    box.innerHTML+=`<div style="max-width:75%;padding:6px 10px;border-radius:8px;font-size:.78rem;align-self:flex-end;background:#7c3aed;color:white">${window.escapeHtml?.(prompt)||prompt}</div>`; input.value=''; box.scrollTop=box.scrollHeight;
    const loadingId='loading-'+Date.now(); box.innerHTML+=`<div id="${loadingId}" style="align-self:flex-start;background:var(--input-bg);color:var(--text-muted);padding:6px 10px;border-radius:8px;font-size:.78rem">Sedang mengetik...</div>`;
    try{
      let daftar=''; const keyword=prompt.toLowerCase(); const asking=['stok','harga','jual','ada','beli','minta','berapa','cari','menu','list','barang','toko','punya'].some(k=>keyword.includes(k)); const matched=[]; const products=window.databaseProduk||{};
      for(const code in products){const p=products[code];const nama=String(p.nama||'');const words=nama.toLowerCase().split(' ').filter(w=>w.length>2);if(keyword.includes(nama.toLowerCase())||words.some(w=>keyword.includes(w)))matched.push(p);}
      if(asking||matched.length){(matched.length?matched:Object.values(products)).slice(0,3).forEach(p=>{let sat=(p.satuan||'Pcs').toLowerCase();let harga=p.hargaJual!==undefined?p.hargaJual:(p.harga||0);if(sat==='kg'||sat==='kilogram'){harga=p.hargaRtg||(harga*10);sat='kg';}else if(sat==='rtg')sat='pcs';else sat=p.satuan||'Pcs';daftar+=`- ${p.nama}: Rp ${Number(harga).toLocaleString('id-ID')}, Stok: ${p.stok||0} ${sat}\n`;});}else daftar='Tidak ada produk dilampirkan (obrolan santai).';
      const response=await fetch('/api/tanya',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,daftarProduk:daftar,namaToko:window.pengaturanToko?.nama||'KasirQuh'})});
      const data=await response.json(); let reply='Maaf, saya sedang kendala teknis. Silakan tanya ke admin.'; if(data.reply) reply=data.reply.split('\n').map(l=>l.trim()).join('\n').trim(); else if(data.candidates?.[0]?.content?.parts?.[0]?.text) reply=data.candidates[0].content.parts[0].text.split('\n').map(l=>l.trim()).join('\n').trim();
      let audioUrl=null; if(state.isAiSoundOn){const clean=reply.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,'').trim();try{const r=await fetch(`/api/tts?text=${encodeURIComponent(clean)}`);if(r.ok)audioUrl=URL.createObjectURL(await r.blob());}catch(e){console.error(e);}}
      document.getElementById(loadingId)?.remove(); box.innerHTML+=`<div style="max-width:75%;padding:6px 10px;border-radius:8px;font-size:.78rem;align-self:flex-start;background:var(--input-bg);color:var(--text-color);border:1px solid var(--border-color);white-space:pre-line">${window.escapeHtml?.(reply)||reply}</div>`;box.scrollTop=box.scrollHeight;if(audioUrl)new Audio(audioUrl).play();
    }catch(err){document.getElementById(loadingId)?.remove();box.innerHTML+=`<div style="max-width:75%;padding:6px 10px;border-radius:8px;font-size:.78rem;align-self:flex-start;background:#fee2e2;color:#dc2626">Gagal terhubung ke AI.</div>`;}
  }

  Object.assign(window,{switchSubTabLiveChat,kirimPesanChatRumpi,initChatRumpiListener,initCustomerChatListener,kirimPesanPelanggan,kirimPesanKeAI,toggleAISpeechRecognition,toggleAISound,startAiListeningState,stopAiListeningState});
  window.KQModules.chat={name:'chat',boot:function(){
    initSpeech();
    document.body?.setAttribute('data-kq-module-chat','ready');
    if(window.KQ_CUSTOMER_PAGE?.route==='chat'){
      initChatRumpiListener();
      if(window.currentCustomerPhone) initCustomerChatListener();
    }
  }};
})();
