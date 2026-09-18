/* Legacy compatibility loader. New admin pages load ordered modules directly. */
(function loadKasirQuhAdminModules(){
  if (window.__KQ_ADMIN_MODULES_LOADED__) return;
  window.__KQ_ADMIN_MODULES_LOADED__ = true;
  const files = [
    '01-core-theme-auth.js',
    '02-notes.js',
    '03-login-catalog-state.js',
    '04-products.js',
    '05-customers-restock.js',
    '06-navigation-cart-transactions.js',
    '07-data-import-settings-refresh.js',
    '08-advanced-voice-scanner.js',
    '09-notes-calculator.js',
    '10-chat-bootstrap.js',
  ];
  files.forEach(src => document.write('<script src="js/modules/' + src + '"><\/script>'));
})();
