/* KasirQuh Customer V14 — Phase 13 Auth + Session + Logout audit */
(function () {
  'use strict';

  window.KQModules = window.KQModules || {};

  const SESSION_KEY = 'cust_phone_v13';
  const SESSION_NAME_KEY = 'cust_name_v13';
  let validationInFlight = false;
  let validatedPhone = '';

  function updateFabAuthVisibility() {
    const login = document.getElementById('customerLoginModal');
    const loginVisible = !!login && getComputedStyle(login).display !== 'none';
    document.body.classList.toggle('fab-auth-hidden', loginVisible);
  }

  function installFabAuthGuard() {
    updateFabAuthVisibility();
    const el = document.getElementById('customerLoginModal');
    if (el && !el.dataset.kqFabObserver) {
      el.dataset.kqFabObserver = '1';
      new MutationObserver(updateFabAuthVisibility).observe(el, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
  }

  function installSessionLockStyle() {
    if (document.getElementById('kq-phase13-auth-style')) return;
    const style = document.createElement('style');
    style.id = 'kq-phase13-auth-style';
    style.textContent = `
      body.kq-session-pending [data-kq-page-content],
      body.kq-session-pending .kq-bottom-nav,
      body.kq-session-pending .fab-container,
      body.kq-session-pending #scroll-helper-fab,
      body.kq-session-pending .customer-developer-footer { visibility: hidden !important; }
      body.kq-session-locked [data-kq-page-content],
      body.kq-session-locked .kq-bottom-nav,
      body.kq-session-locked .fab-container,
      body.kq-session-locked #scroll-helper-fab,
      body.kq-session-locked .customer-developer-footer { visibility: hidden !important; }
    `;
    document.head.appendChild(style);
  }

  function showLogin() {
    const login = document.getElementById('customerLoginModal');
    if (login) login.style.display = 'flex';
    if (typeof window.gantiFormAuth === 'function') window.gantiFormAuth('login');
    document.body.classList.remove('kq-session-pending');
    document.body.classList.add('kq-session-locked');
    updateFabAuthVisibility();
  }

  function showAuthenticated() {
    document.body.classList.remove('kq-session-pending', 'kq-session-locked');
    const login = document.getElementById('customerLoginModal');
    if (login) login.style.display = 'none';
    updateFabAuthVisibility();
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_NAME_KEY);
    validatedPhone = '';
  }

  function logoutPelanggan(skipConfirm) {
    if (!skipConfirm && !confirm('Keluar dari sesi ini?')) return;
    clearSession();
    document.body.classList.add('kq-session-locked');
    try { history.replaceState(null, '', '/'); } catch (_) {}
    window.location.replace('/');
  }

  function redirectIfLoggedOut() {
    if (!localStorage.getItem(SESSION_KEY)) {
      const path = location.pathname.replace(/\/+$/, '') || '/';
      if (path.startsWith('/pelanggan')) window.location.replace('/');
      return true;
    }
    return false;
  }

  async function validateSession() {
    if (validationInFlight) return validationInFlight;
    const phone = (localStorage.getItem(SESSION_KEY) || '').trim();
    if (!phone) {
      showLogin();
      return false;
    }

    validationInFlight = (async () => {
      try {
        if (typeof window.storeCollection !== 'function') {
          // Core normally exposes storeCollection before Phase 13 boots.
          showLogin();
          return false;
        }
        const snap = await window.storeCollection('pelanggan').where('phone', '==', phone).limit(1).get();
        if (snap.empty) {
          clearSession();
          showLogin();
          return false;
        }
        const data = snap.docs[0].data() || {};
        if (data.status === 'pending' || data.disetujui === false) {
          clearSession();
          showLogin();
          alert('Akun pelanggan belum disetujui Admin toko. Silakan hubungi admin.');
          return false;
        }
        validatedPhone = phone;
        localStorage.setItem(SESSION_NAME_KEY, data.nama || 'Pelanggan');
        showAuthenticated();
        return true;
      } catch (err) {
        console.warn('[KasirQuh Phase 13] validasi sesi gagal:', err);
        // Do not silently trust a cached session when Firebase cannot verify it.
        clearSession();
        showLogin();
        return false;
      } finally {
        validationInFlight = false;
      }
    })();

    return validationInFlight;
  }

  function handlePageShow(event) {
    if (event.persisted || !localStorage.getItem(SESSION_KEY)) {
      const path = location.pathname.replace(/\/+$/, '') || '/';
      if (path.startsWith('/pelanggan')) validateSession();
    }
  }

  function installHistorySessionGuard() {
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', function () {
      if (!localStorage.getItem(SESSION_KEY)) {
        const path = location.pathname.replace(/\/+$/, '') || '/';
        if (path.startsWith('/pelanggan')) window.location.replace('/');
      }
    });
  }

  window.logoutPelanggan = logoutPelanggan;
  window.KQAuthSession = {
    key: SESSION_KEY,
    validate: validateSession,
    clear: clearSession,
    isValidated: function () { return !!validatedPhone && validatedPhone === localStorage.getItem(SESSION_KEY); },
    getPhone: function () { return localStorage.getItem(SESSION_KEY) || ''; }
  };

  const previous = window.KQModules.auth || {};
  window.KQModules.auth = Object.assign(previous, {
    name: 'auth',
    boot: function () {
      document.body?.setAttribute('data-kq-module-auth', 'ready');
      installSessionLockStyle();
      installFabAuthGuard();
      installHistorySessionGuard();
      document.body.classList.add('kq-session-pending');
      validateSession();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      installSessionLockStyle();
      installFabAuthGuard();
    }, { once: true });
  } else {
    installSessionLockStyle();
    installFabAuthGuard();
  }
})();
