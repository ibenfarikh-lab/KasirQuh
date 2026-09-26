(function(){
  const o=document.getElementById('kasirquhPwaOpening');
  if(!o)return;
  const close=()=>o.classList.add('hide');
  window.addEventListener('load',()=>setTimeout(close,1050),{once:true});
  setTimeout(close,1800);
})();

(function () {
  const installButton = document.getElementById('gateway-pwa-install');
  if (!installButton) return;

  let deferredInstallPrompt = null;

  function hideInstallButton() {
    installButton.classList.remove('show');
  }

  function showInstallButton() {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;
    installButton.classList.add('show');
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallButton();
  });

  installButton.addEventListener('click', async function () {
    if (!deferredInstallPrompt) return;
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    hideInstallButton();
    try {
      promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (error) {
      console.warn('Gateway PWA install prompt:', error);
    }
  });

  window.addEventListener('appinstalled', function () {
    deferredInstallPrompt = null;
    hideInstallButton();
  });

  if (window.matchMedia) {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    if (standaloneQuery.matches) hideInstallButton();
    standaloneQuery.addEventListener?.('change', function (event) {
      if (event.matches) hideInstallButton();
    });
  }
})();

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
    const customerSwipe = document.getElementById('kv4CustomerSwipe');
    const swipeHandle = customerSwipe ? customerSwipe.querySelector('.kv4-swipe-handle') : null;
    if (!welcome || !image || !customer || !admin) return;

    const slides = ['./assets/gateway/slide1.png', './assets/gateway/slide2.png', './assets/gateway/slide3.png'];
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
    const customerBox = { x: 38 / 688, y: 1270 / 1536, w: 612 / 688, h: 95 / 1536 };
    const adminBox = { x: 490 / 688, y: 1370 / 1536, w: 170 / 688, h: 72 / 1536 };

    let swipeStartX = 0;
    let swipeCurrentX = 0;
    let swipeMaxX = 0;
    let swipeDragging = false;
    let swipeCompleted = false;

    function resetSwipeVisual(animated) {
      if (!customerSwipe || !swipeHandle) return;
      customerSwipe.classList.remove('kv4-swiping', 'kv4-swipe-success');
      if (!animated) {
        customerSwipe.classList.add('kv4-resetting');
        swipeHandle.style.transition = 'none';
      }
      swipeHandle.style.setProperty('--swipe-x', '0px');
      swipeHandle.style.setProperty('--swipe-progress', '0');
      if (!animated) {
        requestAnimationFrame(function () {
          if (customerSwipe) customerSwipe.classList.remove('kv4-resetting');
          if (swipeHandle) swipeHandle.style.removeProperty('transition');
        });
      }
    }

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
        if (customerSwipe) {
          const left = customerBox.x * image.naturalWidth * scale - cropX;
          const top = customerBox.y * image.naturalHeight * scale - cropY;
          const width = customerBox.w * image.naturalWidth * scale;
          const height = customerBox.h * image.naturalHeight * scale;
          customerSwipe.style.left = left + 'px';
          customerSwipe.style.top = top + 'px';
          customerSwipe.style.width = width + 'px';
          customerSwipe.style.height = height + 'px';
          swipeMaxX = Math.max(0, width - 62);
          if (!swipeDragging && !swipeCompleted) resetSwipeVisual(false);
        }
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

    customer.addEventListener('click', function (event) {
      // Deliberately do not open on a simple tap. The customer action is a swipe-to-start control.
      event.preventDefault();
    });

    customer.addEventListener('pointerdown', function (event) {
      if (leaving || swipeCompleted) return;
      swipeDragging = true;
      swipeStartX = event.clientX;
      swipeCurrentX = 0;
      customer.setPointerCapture?.(event.pointerId);
      if (customerSwipe) {
        customerSwipe.classList.add('kv4-swiping');
        customerSwipe.style.setProperty('--swipe-progress', '0');
      }
      if (swipeHandle) swipeHandle.style.transition = 'none';
      event.preventDefault();
    });

    customer.addEventListener('pointermove', function (event) {
      if (!swipeDragging || leaving || swipeCompleted) return;
      const delta = event.clientX - swipeStartX;
      swipeCurrentX = Math.max(0, Math.min(swipeMaxX, delta));
      const progress = swipeMaxX > 0 ? swipeCurrentX / swipeMaxX : 0;
      if (customerSwipe) {
        customerSwipe.style.setProperty('--swipe-progress', progress.toFixed(3));
      }
      if (swipeHandle) {
        swipeHandle.style.setProperty('--swipe-x', swipeCurrentX + 'px');
        swipeHandle.style.setProperty('--swipe-progress', progress.toFixed(3));
      }
      event.preventDefault();
    });

    function finishCustomerSwipe(event) {
      if (!swipeDragging) return;
      swipeDragging = false;
      try { customer.releasePointerCapture?.(event.pointerId); } catch (_) {}
      const threshold = Math.max(120, swipeMaxX * 0.78);
      if (swipeCurrentX >= threshold) {
        swipeCompleted = true;
        if (customerSwipe) customerSwipe.classList.add('kv4-swipe-success');
        if (customerSwipe) {
          customerSwipe.style.setProperty('--swipe-progress', '1');
        }
        if (swipeHandle) {
          swipeHandle.style.transition = 'transform .24s cubic-bezier(.2,.9,.2,1)';
          swipeHandle.style.setProperty('--swipe-x', swipeMaxX + 'px');
        }
        if (customerGlow) {
          customerGlow.classList.remove('kv4-glow-active', 'kv4-glow-pressed');
          void customerGlow.offsetWidth;
          customerGlow.classList.add('kv4-glow-pressed');
        }
        setTimeout(function () { leave('kv4-focus-customer', './pelanggan/index.html'); }, 180);
      } else {
        resetSwipeVisual(true);
      }
      event.preventDefault();
    }

    customer.addEventListener('pointerup', finishCustomerSwipe);
    customer.addEventListener('pointercancel', finishCustomerSwipe);

    admin.addEventListener('click', function () {
      if (adminGlow) { adminGlow.classList.remove('kv4-glow-active'); void adminGlow.offsetWidth; adminGlow.classList.add('kv4-glow-pressed'); }
      leave('kv4-focus-admin', './admin/index.html');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlide123Welcome);
  } else {
    initSlide123Welcome();
  }
})();

(function(){
  const fab=document.getElementById('index-ai-fab'), modal=document.getElementById('index-ai-modal'), close=document.getElementById('index-ai-close');
  const input=document.getElementById('index-ai-input'), messages=document.getElementById('index-ai-messages'), mic=document.getElementById('index-ai-mic'), sound=document.getElementById('index-ai-sound');
  if(!fab||!modal)return;
  let dragging=false,moved=false,pid=null,sx=0,sy=0,sl=0,st=0,isSound=true,recognition=null,listening=false;
  const clamp=(v,min,max)=>Math.min(Math.max(v,min),max);
  function place(left,top,save){
    const maxL=Math.max(0,innerWidth-fab.offsetWidth), maxT=Math.max(0,innerHeight-fab.offsetHeight);
    left=clamp(left,0,maxL); top=clamp(top,0,maxT);
    fab.style.left=left+'px'; fab.style.top=top+'px'; fab.style.right='auto'; fab.style.bottom='auto';
    if(save)localStorage.setItem('index_ai_fab_position_v1',JSON.stringify({left,top}));
  }
  function restore(){
    try{const p=JSON.parse(localStorage.getItem('index_ai_fab_position_v1')||'null'); if(p&&Number.isFinite(p.left)&&Number.isFinite(p.top)){place(p.left,p.top,false);return;}}catch(e){}
    requestAnimationFrame(()=>place(innerWidth-fab.offsetWidth-20,(innerHeight-fab.offsetHeight)/2,false));
  }
  fab.addEventListener('pointerdown',e=>{dragging=true;moved=false;pid=e.pointerId;sx=e.clientX;sy=e.clientY;const r=fab.getBoundingClientRect();sl=r.left;st=r.top;fab.setPointerCapture?.(pid);fab.classList.add('dragging');e.preventDefault();});
  fab.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==pid)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)>5)moved=true;place(sl+dx,st+dy,false);e.preventDefault();});
  function end(e){if(!dragging||e.pointerId!==pid)return;dragging=false;fab.releasePointerCapture?.(pid);fab.classList.remove('dragging');place(fab.getBoundingClientRect().left,fab.getBoundingClientRect().top,true);if(!moved)openAI();e.preventDefault();}
  fab.addEventListener('pointerup',end); fab.addEventListener('pointercancel',end);
  async function playWelcomeVoice(){
    if(!isSound)return;
    const teksSambutan='HALOOOO BESTIE! Aku Asisten AI Warunge Mimi. Mau ngobrol atau tanya-tanya dulu?';
    try{
      if(window._indexAiWelcomeAudio){try{window._indexAiWelcomeAudio.pause();}catch(e){} try{URL.revokeObjectURL(window._indexAiWelcomeAudioUrl);}catch(e){}}
      const r=await fetch('./api/tts?text='+encodeURIComponent(teksSambutan));
      if(!r.ok)throw new Error('TTS gagal');
      const u=URL.createObjectURL(await r.blob());
      const a=new Audio(u);
      window._indexAiWelcomeAudio=a; window._indexAiWelcomeAudioUrl=u;
      a.onended=()=>{try{URL.revokeObjectURL(u);}catch(e){} window._indexAiWelcomeAudio=null;window._indexAiWelcomeAudioUrl=null;};
      await a.play();
    }catch(e){console.warn('TTS sambutan AI index:',e);}
  }
  function openAI(){modal.classList.add('show');modal.setAttribute('aria-hidden','false');setTimeout(()=>input.focus(),40);playWelcomeVoice();}
  function closeAI(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');}
  close.onclick=closeAI; modal.addEventListener('click',e=>{if(e.target===modal)closeAI();});
  sound.onclick=()=>{isSound=!isSound;sound.textContent=isSound?'🔊 Suara: ON':'🔇 Suara: OFF';if(!isSound&&speechSynthesis)speechSynthesis.cancel();};
  async function speak(text){if(!isSound)return;try{const r=await fetch('./api/tts?text='+encodeURIComponent(text));if(!r.ok)throw 0;const u=URL.createObjectURL(await r.blob()),a=new Audio(u);a.onended=()=>URL.revokeObjectURL(u);await a.play();}catch(e){}}
  function add(text,me){const d=document.createElement('div');d.style.cssText='max-width:75%;padding:6px 10px;border-radius:8px;font-size:.78rem;white-space:pre-line;align-self:'+(me?'flex-end':'flex-start')+';background:'+(me?'#7c3aed':'#fff')+';color:'+(me?'#fff':'#111827')+';border:'+(me?'0':'1px solid #e5e7eb');d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d;}
  async function send(){const prompt=input.value.trim();if(!prompt)return;input.value='';add(prompt,true);const loading=add('Sedang mengetik...',false);try{const r=await fetch('./api/tanya',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,daftarProduk:'Tidak ada daftar produk saat berada di halaman pembuka.',namaToko:'Warunge Mimi'})});const data=await r.json();let reply=data.reply||(data.candidates&&data.candidates[0]?.content?.parts?.map(x=>x.text||'').join(''))||'Maaf, saya sedang mengalami kendala teknis.';loading.remove();add(reply,false);speak(reply);}catch(e){loading.remove();add('Gagal terhubung ke AI. Silakan coba lagi.',false);}}
  document.getElementById('index-ai-send').onclick=send; input.addEventListener('keydown',e=>{if(e.key==='Enter')send();});
  if('SpeechRecognition'in window||'webkitSpeechRecognition'in window){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;recognition=new SR();recognition.lang='id-ID';recognition.onresult=e=>{input.value=e.results[0][0].transcript;listening=false;mic.textContent='🎤';send();};recognition.onend=()=>{listening=false;mic.textContent='🎤';};recognition.onerror=()=>{listening=false;mic.textContent='🎤';};}
  mic.onclick=()=>{if(!recognition)return;if(listening){recognition.stop();return;}listening=true;mic.textContent='🛑';recognition.start();};
  addEventListener('resize',()=>{const r=fab.getBoundingClientRect();place(r.left,r.top,true);});
  restore();
})();
