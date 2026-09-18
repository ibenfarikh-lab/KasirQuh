(function () {
  function updateFabAuthVisibility() {
    const welcome = document.getElementById('welcomeScreen');
    const login = document.getElementById('customerLoginModal');

    const welcomeVisible = !!welcome && getComputedStyle(welcome).display !== 'none';
    const loginVisible = !!login && getComputedStyle(login).display !== 'none';

    document.body.classList.toggle('fab-auth-hidden', welcomeVisible || loginVisible);
  }

  function installFabAuthGuard() {
    updateFabAuthVisibility();

    ['welcomeScreen', 'customerLoginModal'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(updateFabAuthVisibility)
        .observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    });

    // Menangkap perubahan display dari kode lama tanpa mengubah alur login.
    setInterval(updateFabAuthVisibility, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installFabAuthGuard);
  } else {
    installFabAuthGuard();
  }
})();
