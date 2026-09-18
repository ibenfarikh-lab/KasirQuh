// Floating helper modern: muncul setelah user melewati ~2 layar.
  // Fungsi scroll tetap native smooth dan tidak mengubah lazy rendering.
  (function () {
    const fab = document.getElementById('scroll-helper-fab');
    if (!fab) return;

    // Selalu posisikan helper DI ATAS seluruh stack FAB (Asisten/Pencarian/Keranjang).
    // Tidak bergantung pada tebakan jarak, jadi tidak bisa ketiban FAB pencarian.
    function positionAboveFabStack() {
      const stack = document.querySelector('.fab-container');
      if (!stack) return;
      try {
        const r = stack.getBoundingClientRect();
        const gap = 12;
        const bottom = Math.max(90, window.innerHeight - r.top + gap);
        fab.style.setProperty('bottom', bottom + 'px', 'important');
      } catch (e) {}
    }

    let ticking = false;
    const threshold = () => Math.max(650, window.innerHeight * 2.05);

    function isScrolledEnough(source) {
      try {
        if (source === window) return window.scrollY > threshold();
        return source && source.scrollTop > threshold();
      } catch (e) { return false; }
    }

    function findScrollDepth() {
      if (window.scrollY > threshold()) return true;
      const known = [
        document.scrollingElement,
        document.documentElement,
        document.body,
        document.querySelector('.main-content'),
        document.querySelector('.tab-content.active'),
        document.getElementById('pos-card-wrapper'),
        document.getElementById('pos-catalog-container')
      ];
      for (const el of known) if (isScrolledEnough(el)) return true;
      return false;
    }

    function updateScrollHelper() {
      ticking = false;
      fab.classList.toggle('is-visible', findScrollDepth());
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScrollHelper);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
    window.addEventListener('resize', () => { positionAboveFabStack(); scheduleUpdate(); }, { passive: true });
    positionAboveFabStack();
    document.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
    scheduleUpdate();

    window.kembaliKeAtasKatalog = function () {
      const targets = new Set();
      const addTarget = (el) => { if (el) targets.add(el); };

      addTarget(document.scrollingElement);
      addTarget(document.documentElement);
      addTarget(document.body);
      addTarget(document.querySelector('.main-content'));
      addTarget(document.querySelector('.tab-content.active'));
      addTarget(document.getElementById('pos-card-wrapper'));
      addTarget(document.getElementById('pos-catalog-container'));

      // Ikuti container yang benar-benar sedang bergulir.
      document.querySelectorAll('*').forEach((el) => {
        try {
          if (el.scrollHeight > el.clientHeight + 2 && el.scrollTop > 0) addTarget(el);
        } catch (e) {}
      });

      const smooth = animasiNavigasiDeveloperAktif();
      targets.forEach((el) => {
        try { el.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' }); } catch (e) {
          try { el.scrollTop = 0; } catch (e2) {}
        }
      });

      try { window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' }); } catch (e) {
        try { window.scrollTo(0, 0); } catch (e2) {}
      }

      // OFF: langsung hilang. ON: beri waktu perjalanan smooth selesai.
      setTimeout(scheduleUpdate, smooth ? 450 : 0);
    };
  })();
