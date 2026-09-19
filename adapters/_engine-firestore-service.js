/* KasirQuh Firestore Service — Phase 16
 * Thin compatibility layer. It does not initialize Firebase and does not change
 * the existing database shape. Callers continue to use the existing compat SDK.
 */
(function (global) {
  'use strict';
  const KQServices = global.KQServices = global.KQServices || {};

  KQServices.firestore = {
    getDb: function () {
      const db = global.__kqDb || global.db;
      if (!db) throw new Error('Firestore belum siap.');
      return db;
    },
    storeCollection: function (name, tokoId, scopedNames) {
      const db = this.getDb();
      if (!scopedNames || !scopedNames.has(name)) return db.collection(name);
      if (!tokoId) throw new Error('tokoId belum tersedia.');
      return db.collection('toko').doc(tokoId).collection(name);
    },
    serverTimestamp: function () {
      return global.firebase.firestore.FieldValue.serverTimestamp();
    },
    increment: function (value) {
      return global.firebase.firestore.FieldValue.increment(value);
    },
    arrayUnion: function () {
      return global.firebase.firestore.FieldValue.arrayUnion.apply(global.firebase.firestore.FieldValue, arguments);
    }
  };
})(window);
