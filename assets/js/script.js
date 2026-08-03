/*
 * Sayfa metinleri artik calisma zamaninda degistirilmiyor.
 *
 * Turkce ve Ingilizce surumler ayri URL'ler olarak yayinlaniyor (/ ve /en/),
 * icerik her iki dosyaya da build sirasinda gomuluyor (scripts/build-en.mjs).
 * Bu sayede:
 *   - dil secimi yenilemede kaybolmuyor, paylasilan baglantida korunuyor
 *   - arama motorlari Ingilizce surumu de indeksleyebiliyor
 *   - ~10 KB'lik ceviri sozlugu artik tarayiciya hic gonderilmiyor
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const header = document.getElementById('siteHeader');
  const scrollTopBtn = document.getElementById('scrollTop');
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('mainNav');
  const yearSpan = document.getElementById('year');

  // --- Update Year ---
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // --- Scroll Effects ---
  // passive: bu isleyici asla preventDefault cagirmaz; tarayiciya bunu bildirmek
  // dokunmatik cihazlarda kaydirmanin takilmasini onler.
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Decorative Background Video ---
  // Video 1.6 MB ve tamamen dekoratif. Isaretlemede yer alsaydi tarayici onu
  // her ziyarette indirirdi; CSS'te display:none yapmak indirmeyi ENGELLEMEZ.
  // Bu yuzden oge yalnizca gercekten gosterilecegi durumda olusturuluyor.
  const setupBackgroundVideo = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Dar ekranlarda video zaten kirpiliyor ve mobil veri pahali.
    if (window.matchMedia('(max-width: 900px)').matches) return;

    // Kullanici veri tasarrufu istiyorsa veya baglanti yavassa hic indirme.
    const connection = navigator.connection;
    if (connection) {
      if (connection.saveData) return;
      if (/^(slow-)?2g$/.test(connection.effectiveType || '')) return;
    }

    const video = document.createElement('video');
    video.className = 'site-bg-video';
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    // Kok-goreli yol: bu betik hem / hem de /en/ altindan yukleniyor, goreli bir
    // yol Ingilizce sayfada /en/assets/... olarak cozulur ve 404 verirdi.
    video.src = '/assets/video/bg-flow.mp4';
    document.body.prepend(video);

    return video;
  };

  // --- Seamless Video Loop (dip through the backdrop instead of a hard jump-cut) ---
  const bgVideo = setupBackgroundVideo();
  if (bgVideo) {
    const FADE = 0.6; // seconds faded at each end of the loop
    let lastOpacity = null;
    let frameHandle = null;

    const fadeAt = (time, duration) => {
      const remaining = duration - time;
      if (remaining < FADE) return Math.max(remaining / FADE, 0);
      if (time < FADE) return Math.min(time / FADE, 1);
      return 1;
    };

    const tick = () => {
      const duration = bgVideo.duration;
      if (duration) {
        // Ayni degeri her karede yeniden yazmak bos yere stil hesaplamasi tetikler;
        // sadece deger degistiginde yaz. Gorsel sonuc birebir ayni.
        const opacity = fadeAt(bgVideo.currentTime, duration);
        if (opacity !== lastOpacity) {
          bgVideo.style.opacity = opacity;
          lastOpacity = opacity;
        }
      }
      frameHandle = requestAnimationFrame(tick);
    };

    // Sekme arka plandayken ya da video duraklamisken saniyede 60 kez opaklik
    // hesaplamanin anlami yok; dongu yalnizca gorunur ve oynarken calisir.
    const startLoop = () => {
      if (frameHandle === null && !document.hidden && !bgVideo.paused) {
        frameHandle = requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
    };

    document.addEventListener('visibilitychange', () => (document.hidden ? stopLoop() : startLoop()));
    bgVideo.addEventListener('play', startLoop);
    bgVideo.addEventListener('pause', stopLoop);
    bgVideo.addEventListener('ended', stopLoop);
    startLoop();
  }

  // --- Hero Scroll Cue ---
  const scrollCue = document.getElementById('scrollCue');
  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // --- Mobile Menu Toggle ---
  const setMenuOpen = (isOpen) => {
    mainNav.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  };
  setMenuOpen(false);

  hamburger.addEventListener('click', () => {
    setMenuOpen(!mainNav.classList.contains('open'));
  });

  // Close menu when clicking a link
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  // --- Reveal on Scroll ---
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('section, .timeline-item, .project-card, .skill-card').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });

  // --- Project Detail Toggle ---
  // Etiketler isaretlemeden okunuyor; her sayfa kendi dilindeki metni tasiyor.
  document.querySelectorAll('.project-toggle').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      const card = btn.closest('.project-card');
      const isOpen = card.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.textContent = isOpen
        ? (btn.dataset.labelHide || btn.textContent)
        : (btn.dataset.labelShow || btn.textContent);
    });
  });
});
