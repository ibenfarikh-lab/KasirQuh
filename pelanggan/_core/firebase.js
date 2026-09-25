/* KasirQuh Customer V14 — Phase 14 Firebase/Firestore bootstrap */
(function(){
  'use strict';
  const firebaseConfig = { apiKey: "AIzaSyCwOxkcydduRDC9v1b_XOr8K8FYtpHOY2g", authDomain: "kasirquh.firebaseapp.com", projectId: "kasirquh", storageBucket: "kasirquh.firebasestorage.app", messagingSenderId: "87320899036", appId: "1:87320899036:web:592c6768ea4aca6bdbb319", measurementId: "G-2BL7RJN9Z5" };
  if (!window.firebase) throw new Error('[KasirQuh] Firebase SDK belum dimuat.');
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const ACTIVE_TOKO_ID = 'toko_v13';
  const STORE_COLLECTIONS = new Set(['produk','pelanggan','transaksi','catatan','db_chat_rumpi','chats','pengaturan']);
  function storeCollection(name){
    if (!STORE_COLLECTIONS.has(name)) return db.collection(name);
    return db.collection('toko').doc(ACTIVE_TOKO_ID).collection(name);
  }
  window.db = db;
  window.ACTIVE_TOKO_ID = ACTIVE_TOKO_ID;
  window.storeCollection = storeCollection;
  window.KQFirebase = { db, config: firebaseConfig, activeTokoId: ACTIVE_TOKO_ID, storeCollection };
})();
