/* KasirQuh V4 Firebase bootstrap — compatibility + defensive namespace init. */
(function(global){
  'use strict';
  // Create the namespace before defining init so every dependent script can see it.
  global.KQV4 = global.KQV4 || {};
  const config = {apiKey:'AIzaSyCwOxkcydduRDC9v1b_XOr8K8FYtpHOY2g',authDomain:'kasirquh.firebaseapp.com',projectId:'kasirquh',storageBucket:'kasirquh.firebasestorage.app',messagingSenderId:'87320899036',appId:'1:87320899036:web:592c6768ea4aca6bdbb319',measurementId:'G-2BL7RJN9Z5'};
  function init(){
    const fb = global.firebase;
    if(!fb) throw new Error('Firebase SDK belum dimuat. Pastikan internet aktif dan halaman dijalankan melalui server lokal (bukan file://).');
    if(!fb.apps || !fb.apps.length) fb.initializeApp(config);
    global.__kqDb = global.__kqDb || fb.firestore();
    global.__kqAuth = global.__kqAuth || fb.auth();
    global.db = global.__kqDb;
    global.auth = global.__kqAuth;
    global.KQV4.Firebase = {init};
    return {db:global.__kqDb,auth:global.__kqAuth};
  }
  global.KQV4.Firebase = {init};
})(window);
