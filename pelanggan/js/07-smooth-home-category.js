(function () {
  const IDS = ['reorder-section-wrapper','recipe-section-wrapper','trending-section-wrapper'];

  function els() {
    return IDS.map(id => document.getElementById(id)).filter(Boolean);
  }

  window.smoothHomeToCategory = function () {
    const blocks = els();
    blocks.forEach(el => {
      if (getComputedStyle(el).display === 'none') return;
      el.style.maxHeight = el.scrollHeight + 'px';
      void el.offsetHeight;
      el.classList.add('home-feature-closing');
    });

    const catalog = document.getElementById('pos-card-wrapper');
    if (catalog) {
      catalog.classList.add('home-catalog-transition');
      requestAnimationFrame(() => catalog.classList.add('catalog-lifting'));
      setTimeout(() => catalog.classList.remove('catalog-lifting'), 560);
    }
  };

  window.smoothCategoryToHome = function () {
    const blocks = els();
    blocks.forEach(el => {
      el.style.display = 'block';
      el.classList.remove('home-feature-closing');
      el.style.maxHeight = '0px';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-34px) scaleY(.97)';
    });

    requestAnimationFrame(() => {
      blocks.forEach(el => {
        el.style.maxHeight = el.scrollHeight + 'px';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) scaleY(1)';
      });
    });

    setTimeout(() => {
      blocks.forEach(el => {
        el.style.maxHeight = '';
        el.style.opacity = '';
        el.style.transform = '';
      });
    }, 850);
  };
})();
