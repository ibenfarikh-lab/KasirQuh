/* KasirQuh shared runtime configuration.
 * Firebase web config is public application configuration; private secrets remain server-side.
 */
window.KQ_APP_CONFIG = Object.freeze({
  storeId: 'toko_v13',
  firebase: Object.freeze({
    apiKey: 'AIzaSyCwOxkcydduRDC9v1b_XOr8K8FYtpHOY2g',
    authDomain: 'kasirquh.firebaseapp.com',
    projectId: 'kasirquh',
    storageBucket: 'kasirquh.firebasestorage.app',
    messagingSenderId: '87320899036',
    appId: '1:87320899036:web:592c6768ea4aca6bdbb319',
    measurementId: 'G-2BL7RJN9Z5'
  }),
  routes: Object.freeze({
    home: '/',
    admin: '/admin/index.html',
    pelanggan: '/pelanggan/index.html'
  })
});
