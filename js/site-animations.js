/**
 * site-animations.js — Shared across all JustHemang pages
 * Handles: cursor trail, spotlight, smooth scroll (Lenis), GSAP ScrollTrigger reveals
 */
(function () {
  // ── Wait for GSAP to be ready ─────────────────────────────────────────
  if (typeof gsap === 'undefined') return;

  // ── Spotlight ────────────────────────────────────────────────────────
  const spotlight = document.getElementById('spotlight');
  if (spotlight) {
    document.addEventListener('mousemove', (e) => {
      spotlight.style.setProperty('--mx', e.clientX + 'px');
      spotlight.style.setProperty('--my', e.clientY + 'px');
    });
  }

  // ── Cursor trail ─────────────────────────────────────────────────────
  // Bypass completely if running in the Premiere Editor workspace environment
  const isEditorActive = window.self !== window.top || document.getElementById('pr-program-monitor') !== null || (window.top && window.top.document && window.top.document.getElementById('pr-program-monitor') !== null);
  if (!isEditorActive) {
    // Inject trail styles once
    if (!document.getElementById('cursor-trail-style')) {
      const s = document.createElement('style');
      s.id = 'cursor-trail-style';
      s.textContent = `
        body { cursor: none !important; }
        a, button, [role="button"], .skill-card, .laptop, #laptop-wrapper { cursor: none !important; }
        .ct-dot {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 999999;
          transform: translate(-50%, -50%);
          mix-blend-mode: normal;
          will-change: transform, opacity;
        }
        /* Main cursor dot */
        .ct-dot.ct-main {
          width: 10px; height: 10px;
          background: rgba(94,242,255,1);
          box-shadow: 0 0 12px rgba(94,242,255,0.8), 0 0 30px rgba(94,242,255,0.3);
          transition: width .15s, height .15s, background .15s, box-shadow .15s;
        }
        .ct-dot.ct-main.hovered {
          width: 28px; height: 28px;
          background: rgba(94,242,255,0.25);
          box-shadow: 0 0 20px rgba(94,242,255,0.5);
        }
        .ct-dot.ct-main.clicked {
          width: 6px; height: 6px;
          background: #fff;
          box-shadow: 0 0 20px rgba(255,255,255,0.9);
        }
        /* Ring */
        .ct-dot.ct-ring {
          width: 28px; height: 28px;
          border: 1.5px solid rgba(94,242,255,0.45);
          background: transparent;
          transition: width .2s, height .2s, border-color .2s;
        }
        .ct-dot.ct-ring.hovered {
          width: 50px; height: 50px;
          border-color: rgba(94,242,255,0.2);
        }
        /* Trail dots */
        .ct-dot.ct-trail {
          background: rgba(94,242,255,1);
        }
      `;
      document.head.appendChild(s);
    }

    // Build trail dots
    const TRAIL_COUNT = 8;
    const trailDots = [];
    let mx = -200, my = -200; // raw mouse
    let rx = -200, ry = -200; // ring lerp
    const dotPositions = Array.from({ length: TRAIL_COUNT }, () => ({ x: -200, y: -200 }));

    // Main dot
    const mainDot = document.createElement('div');
    mainDot.className = 'ct-dot ct-main';
    document.body.appendChild(mainDot);

    // Ring
    const ring = document.createElement('div');
    ring.className = 'ct-dot ct-ring';
    document.body.appendChild(ring);

    // Trail
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const d = document.createElement('div');
      d.className = 'ct-dot ct-trail';
      const frac = (i + 1) / TRAIL_COUNT; // 0→1 from newest to oldest
      const size = Math.round(8 - frac * 6);     // 8→2 px
      const alpha = (1 - frac) * 0.55;
      d.style.cssText = `width:${size}px;height:${size}px;opacity:${alpha};`;
      document.body.appendChild(d);
      trailDots.push(d);
    }

    // Track mouse
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      mainDot.style.left = mx + 'px';
      mainDot.style.top  = my + 'px';
    });

    // Click flash
    document.addEventListener('mousedown', () => {
      mainDot.classList.add('clicked');
      ring.classList.add('clicked');
    });
    document.addEventListener('mouseup', () => {
      mainDot.classList.remove('clicked');
      ring.classList.remove('clicked');
    });

    // Hover states on interactive elements
    const interactives = () => document.querySelectorAll('a,button,[role="button"],.skill-card,#laptop-wrapper,.laptop');
    function bindHover() {
      interactives().forEach(el => {
        el.addEventListener('mouseenter', () => { mainDot.classList.add('hovered'); ring.classList.add('hovered'); });
        el.addEventListener('mouseleave', () => { mainDot.classList.remove('hovered'); ring.classList.remove('hovered'); });
      });
    }
    bindHover();

    // Animation loop
    let prevPositions = Array.from({ length: TRAIL_COUNT }, () => ({ x: -200, y: -200 }));
    prevPositions.unshift({ x: mx, y: my }); // head

    function trailLoop() {
      // Ring lags behind
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';

      // Shift trail history
      dotPositions.unshift({ x: mx, y: my });
      dotPositions.length = TRAIL_COUNT + 1;

      trailDots.forEach((dot, i) => {
        const pos = dotPositions[i + 1] || dotPositions[dotPositions.length - 1];
        dot.style.left = pos.x + 'px';
        dot.style.top  = pos.y + 'px';
      });

      requestAnimationFrame(trailLoop);
    }
    trailLoop();
  }

  // ── Lenis smooth scroll ───────────────────────────────────────────────
  if (typeof Lenis !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // Store globally so page-specific code can use it
    window._lenis = lenis;
  } else if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ── Generic scroll reveals ─────────────────────────────────────────────
  // Any element with [data-reveal] gets a staggered fade-up
  document.querySelectorAll('[data-reveal]').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%' },
      opacity: 0,
      y: 50,
      duration: 0.8,
      ease: 'power3.out',
    });
  });

  // Sections with headings
  document.querySelectorAll('h1,h2,h3').forEach(el => {
    if (el.closest('#hero,#hero-h1')) return; // skip hero (handled separately)
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      opacity: 0,
      y: 40,
      duration: 0.75,
      ease: 'power3.out',
    });
  });

  // Buttons & cards
  document.querySelectorAll('.brutal-border,.skill-card,[data-card]').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 92%' },
      opacity: 0,
      y: 30,
      duration: 0.6,
      delay: (i % 4) * 0.08,
      ease: 'back.out(1.4)',
    });
  });

  // Marquee — speed up on hover
  document.querySelectorAll('.marquee, .marquee-content, .marquee-inner').forEach(el => {
    const parent = el.closest('[style*="rotate"]') || el.parentElement;
    parent?.addEventListener('mouseenter', () => {
      gsap.to(el, { '--marquee-speed': '8s', duration: 0.4 });
    });
    parent?.addEventListener('mouseleave', () => {
      gsap.to(el, { '--marquee-speed': '18s', duration: 0.6 });
    });
  });

  // Navbar scroll shrink
  const nav = document.getElementById('main-nav') || document.querySelector('nav');
  if (nav && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      start: 'top -60px',
      onUpdate: (self) => {
        const shrunk = self.scroll() > 60;
        nav.style.background = shrunk ? 'rgba(3,3,3,0.97)' : 'rgba(3,3,3,0.92)';
      }
    });
  }

  // ── Page Transitions ──────────────────────────────────────────────────
  if (!document.getElementById('page-transition-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #030303;
      border-top: 4px solid #5ef2ff;
      box-shadow: 0 -20px 40px rgba(94,242,255,0.15);
      z-index: 9999999;
      transform: translateY(0%);
      pointer-events: none;
    `;
    document.body.appendChild(overlay);

    // Initial page load reveal
    if (document.getElementById('loader')) {
      // Loader handles the reveal, just move overlay out of the way immediately
      gsap.set(overlay, { yPercent: 100 });
    } else {
      // No loader, slide overlay UP and OUT
      gsap.to(overlay, {
        yPercent: -100,
        duration: 0.65,
        ease: 'power3.inOut',
        delay: 0.15,
        onComplete: () => {
          overlay.style.transform = 'translateY(100%)';
        }
      });
    }

    // Intercept local links for page transitions
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      // If it's a local link and not an anchor/hash or external site
      if (href && 
          !href.startsWith('#') && 
          !href.startsWith('javascript:') && 
          !link.hasAttribute('target') && 
          (href.endsWith('.html') || href === '/' || href.startsWith('html/') || href.startsWith('./') || href.startsWith('../'))) {
        
        e.preventDefault();
        
        // Reset overlay position below screen, then slide it UP to cover
        gsap.set(overlay, { yPercent: 100 });
        gsap.to(overlay, {
          yPercent: 0,
          duration: 0.55,
          ease: 'power3.inOut',
          onComplete: () => {
            window.location.href = href;
          }
        });
      }
    });
  }

  console.log('[JH] site-animations.js loaded ✓');
})();
