/* KasirQuh Auth Service — Phase 16
 * Thin adapter around Firebase Auth. Firebase initialization remains in the app.
 */
(function (global) {
  'use strict';
  const KQServices = global.KQServices = global.KQServices || {};

  KQServices.auth = {
    getAuth: function () {
      const auth = global.__kqAuth || global.auth;
      if (!auth) throw new Error('Firebase Authentication belum siap.');
      return auth;
    },
    currentUser: function () {
      return this.getAuth().currentUser || null;
    },
    signIn: function (email, password) {
      return this.getAuth().signInWithEmailAndPassword(email, password);
    },
    signOut: function () {
      return this.getAuth().signOut();
    },
    onAuthStateChanged: function (callback) {
      return this.getAuth().onAuthStateChanged(callback);
    }
  };
})(window);
