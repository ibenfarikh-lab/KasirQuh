/* ===== gateway-script-1 ===== */
(function(){
  const o=document.getElementById('kasirquhPwaOpening');
  if(!o)return;
  const close=()=>o.classList.add('hide');
  window.addEventListener('load',()=>setTimeout(close,1050),{once:true});
  setTimeout(close,1800);
})();

/* ===== gateway-script-2 ===== */
(function () {
  function initSlide123Welcome() {
    const existingWelcome = document.getElementById('kasirquhVisual4Welcome');
    const login = document.getElementById('loginModal');

    // IMPORTANT: wait for Firebase Auth to resolve persistence before deciding whether
    // Welcome should exist. Reading auth.currentUser synchronously can be null for a
    // short time during startup even when a valid session is being restored.
    if (window.firebase && firebase.auth) {
      let settled = false;
      const unsubscribe = firebase.auth().onAuthStateChanged(function(user) {
        if (settled) return;
        settled = true;
        try { unsubscribe(); } catch (_) {}
        if (user) {
          if (existingWelcome) existingWelcome.remove();
          if (login) login.style.display = 'none';
          return;
        }
        initSlide123WelcomeBody();
      });
      return;
    }
    initSlide123WelcomeBody();
  }

  function initSlide123WelcomeBody() {
    const welcome = document.getElementById('kasirquhVisual4Welcome');
    const image = document.getElementById('kv4SlideImage');
    const customer = document.getElementById('kv4CustomerHotspot');
    const admin = document.getElementById('kv4AdminHotspot');
    const customerGlow = document.getElementById('kv4CustomerGlow');
    const adminGlow = document.getElementById('kv4AdminGlow');
    if (!welcome || !image || !customer || !admin) return;

    const slides = ['./slide1.png', './slide2.png', './slide3.png'];
    let current = 0;
    let leaving = false;
    let slideTimer = null;

    // Preload every slide before it is ever shown. This prevents a black flash
    // when the image source changes during the transition.
    const preloadedSlides = slides.map(function (src) {
      const img = new Image();
      img.src = src;
      return img;
    });

    // Position hotspots/glows against the actual rendered image, so object-fit:cover
    // and different screen aspect ratios cannot shift them away from the photo buttons.
    const customerBox = { x: 40 / 688, y: 1270 / 1536, w: 390 / 688, h: 100 / 1536 };
    const adminBox = { x: 442 / 688, y: 1270 / 1536, w: 205 / 688, h: 100 / 1536 };

    function syncSlideButtonPositions() {
      const imgRect = image.getBoundingClientRect();
      const parentRect = welcome.getBoundingClientRect();
      const parentW = parentRect.width;
      const parentH = parentRect.height;
      const scale = Math.max(parentW / image.naturalWidth, parentH / image.naturalHeight);
      const renderedW = image.naturalWidth * scale;
      const renderedH = image.naturalHeight * scale;
      const cropX = (renderedW - parentW) / 2;
      const cropY = (renderedH - parentH) / 2;
      function apply(box, hotspot, glow) {
        if (!hotspot) return;
        const left = box.x * image.naturalWidth * scale - cropX;
        const top = box.y * image.naturalHeight * scale - cropY;
        const width = box.w * image.naturalWidth * scale;
        const height = box.h * image.naturalHeight * scale;
        [hotspot, glow].forEach(function(el) {
          if (!el) return;
          el.style.left = left + 'px';
          el.style.top = top + 'px';
          el.style.width = width + 'px';
          el.style.height = height + 'px';
        });
      }
      if (image.naturalWidth && image.naturalHeight) {
        apply(customerBox, customer, customerGlow);
        apply(adminBox, admin, adminGlow);
      }
    }

    image.addEventListener('load', syncSlideButtonPositions);
    window.addEventListener('resize', syncSlideButtonPositions);
    requestAnimationFrame(syncSlideButtonPositions);

    function pulseButtonGlows() {
      [customerGlow, adminGlow].forEach(function (el) {
        if (!el) return;
        el.classList.remove('kv4-glow-active', 'kv4-glow-pressed');
        void el.offsetWidth;
        el.classList.add('kv4-glow-active');
      });
    }

    function showNextSlide() {
      if (leaving) return;
      const next = (current + 1) % slides.length;
      const nextImage = preloadedSlides[next];

      function commitNextSlide() {
        if (leaving) return;
        current = next;
        // The next image is already loaded, so swap it without ever fading
        // through the black background. The existing glow timing is preserved.
        image.src = slides[current];
        syncSlideButtonPositions();
        pulseButtonGlows();
      }

      if (nextImage && nextImage.complete) {
        commitNextSlide();
      } else if (nextImage) {
        nextImage.addEventListener('load', commitNextSlide, { once: true });
      } else {
        commitNextSlide();
      }
    }

    pulseButtonGlows();
    slideTimer = setInterval(showNextSlide, 4500);

    function leave(mode, destination) {
      if (leaving) return;
      leaving = true;
      if (slideTimer) clearInterval(slideTimer);
      welcome.classList.add(mode);
      setTimeout(function () {
        if (destination) {
          window.location.href = destination;
          return;
        }
        welcome.classList.add('kv4-leaving');
        setTimeout(function () { welcome.remove(); }, 760);
      }, 430);
    }

    customer.addEventListener('click', function () {
      if (customerGlow) { customerGlow.classList.remove('kv4-glow-active'); void customerGlow.offsetWidth; customerGlow.classList.add('kv4-glow-pressed'); }
      leave('kv4-focus-customer', (window.KQ_APP_CONFIG?.routes?.pelanggan || './pelanggan/index.html'));
    });

    admin.addEventListener('click', function () {
      if (adminGlow) { adminGlow.classList.remove('kv4-glow-active'); void adminGlow.offsetWidth; adminGlow.classList.add('kv4-glow-pressed'); }
      leave('kv4-focus-admin', (window.KQ_APP_CONFIG?.routes?.admin || './admin/index.html'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlide123Welcome);
  } else {
    initSlide123Welcome();
  }
})();
