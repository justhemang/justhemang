/* ============================================================
   JUST HEMANG — Vista/XP Aero Runtime + Premiere Pro Frame
   three.js 3D logo · gsap everything · cursor · menu
   Scroll is driven by #prViewport, not window.
   ============================================================ */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const IS_HOME = !document.body.classList.contains('page-sub');

/* Viewport is the scroller for everything */
const VP = () => document.getElementById('prViewport');

/* ============================================================
   THREE.JS — 3D Logo (home only)
   ============================================================ */
function initHero() {
  if (!IS_HOME) return;
  const canvas = $('#heroCanvas');
  const hero = $('#hero');
  if (!canvas || !hero || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, hero.clientWidth / hero.clientHeight, 0.1, 100);
  camera.position.z = 4;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(hero.clientWidth, hero.clientHeight);

  const textureLoader = new THREE.TextureLoader();
  const logoTexture = textureLoader.load('Logo Transparent.png');
  const logoMat = new THREE.MeshBasicMaterial({
    map: logoTexture, transparent: true, opacity: 0.15,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const logoGeo = new THREE.PlaneGeometry(2.2, 2.2);
  const logoMesh = new THREE.Mesh(logoGeo, logoMat);
  scene.add(logoMesh);

  const ringGeo = new THREE.RingGeometry(1.6, 1.63, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x66d9ef, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  scene.add(ring);

  const outerGeo = new THREE.RingGeometry(2.1, 2.13, 64);
  const outerMat = new THREE.MeshBasicMaterial({ color: 0x3399ff, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  scene.add(outer);

  let mouseX = 0, mouseY = 0;
  let running = !REDUCED;

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  addEventListener('resize', resize);

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    const t = performance.now() * 0.0003;
    logoMesh.rotation.y = t * 0.3 + mouseX * 0.2;
    logoMesh.rotation.x = Math.sin(t) * 0.08 + mouseY * 0.1;
    logoMesh.position.y = Math.sin(t * 1.5) * 0.06;
    ring.rotation.z = t * 0.15;
    ring.position.y = Math.sin(t * 1.5) * 0.06;
    outer.rotation.z = -t * 0.1;
    outer.position.y = Math.sin(t * 1.5) * 0.06;
    renderer.render(scene, camera);
  }

  if (REDUCED) { logoMesh.rotation.y = 0.2; renderer.render(scene, camera); return; }

  new IntersectionObserver((entries) => {
    const visible = entries[0].isIntersecting;
    if (visible && !running) { running = true; animate(); }
    if (!visible) running = false;
  }, { root: VP() }).observe(hero);

  animate();
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  if (!FINE_POINTER || REDUCED) return;
  document.body.classList.add('has-cursor');
  const dot = $('#cursorDot');
  if (!dot) return;
  addEventListener('mousemove', (e) => {
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }, { passive: true });
}

/* ============================================================
   FLOATING MENU
   ============================================================ */
function initMenu() {
  const fab = $('#menuFab');
  const overlay = $('#menuOverlay');
  if (!fab || !overlay) return;
  const links = $$('.menu-overlay__link', overlay);

  const toggle = (open) => {
    fab.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', String(open));
    overlay.classList.toggle('open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && typeof gsap !== 'undefined') {
      gsap.from(links, { opacity: 0, y: 60, stagger: 0.06, duration: 0.6, ease: 'power3.out', delay: 0.15 });
    }
  };

  fab.addEventListener('click', () => toggle(!overlay.classList.contains('open')));
  links.forEach((a) => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) toggle(false);
  });
}

/* ============================================================
   SCROLL PROGRESS (viewport-based)
   ============================================================ */
function initScrollProgress() {
  const progress = $('#scrollProgress');
  const vp = VP();
  if (!progress || !vp) return;
  vp.addEventListener('scroll', () => {
    const max = vp.scrollHeight - vp.clientHeight;
    progress.style.transform = `scaleX(${max > 0 ? vp.scrollTop / max : 0})`;
  }, { passive: true });
}

/* ============================================================
   TEXT SPLIT
   ============================================================ */
function splitText(el) {
  const ariaText = el.textContent;
  el.setAttribute('aria-label', ariaText);
  const result = [];
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      [...node.textContent].forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        result.push(span);
        node.parentNode.insertBefore(span, node);
      });
      node.remove();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'BR') { result.push(node); return; }
      [...node.childNodes].forEach(walk);
    }
  }
  [...el.childNodes].forEach(walk);
  return result;
}

/* ============================================================
   COUNTER ANIMATION
   ============================================================ */
function initCounters() {
  if (REDUCED || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  $$('.stat__num').forEach((el) => {
    const raw = el.textContent.trim();
    const match = raw.match(/^(\d+)(.*)/);
    if (!match) return;
    const target = parseInt(match[1], 10);
    const suffix = match[2] || '';
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, scroller: VP(), start: 'top 85%' },
      onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; },
    });
  });
}

/* ============================================================
   HORIZONTAL SCROLL SECTIONS
   ============================================================ */
function initHorizontalScroll() {
  if (REDUCED || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  $$('.hscroll').forEach((section) => {
    const track = section.querySelector('.hscroll__track');
    if (!track) return;

    const items = $$('.hscroll__item', track);
    if (items.length < 2) return;

    const getScrollWidth = () => track.scrollWidth - section.clientWidth;

    gsap.to(track, {
      x: () => -getScrollWidth(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        scroller: VP(),
        start: 'top top',
        end: () => '+=' + getScrollWidth(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    items.forEach((item, i) => {
      gsap.from(item, {
        opacity: 0, y: 40, rotateY: 15,
        duration: 0.8, delay: i * 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: item, scroller: VP(), start: 'left 85%' },
      });
    });
  });
}

/* ============================================================
   GSAP ANIMATIONS
   ============================================================ */
function initAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const scroller = VP();

  if (REDUCED) {
    $$('.anim-clip,.anim-scale,.anim-slide-left,.anim-slide-right,.anim-slide-up,.anim-rotate,.anim-blur').forEach((el) => {
      el.style.clipPath = 'none';
      el.style.transform = 'none';
      el.style.opacity = '1';
      el.style.filter = 'none';
    });
    return;
  }

  /* hero entrance */
  if (IS_HOME) {
    const tl = gsap.timeline({ delay: 0.3 });
    tl.from('.hero__pre', { opacity: 0, y: -20, duration: 0.8, ease: 'power3.out' })
      .from('.hero__line--top', { opacity: 0, x: -80, skewX: -8, duration: 0.9, ease: 'power4.out' }, '-=0.4')
      .from('.hero__char', { opacity: 0, y: 80, stagger: 0.06, duration: 0.9, ease: 'back.out(1.4)' }, '-=0.5')
      .from('#hero .accent-line', { scaleX: 0, duration: 0.8, ease: 'power3.inOut' }, '-=0.4')
      .from('.hero__tagline', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .from('.hero__scroll', { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.1')
      .from('.menu-fab', { opacity: 0, scale: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.4');
  } else {
    gsap.from('.menu-fab', { opacity: 0, scale: 0, duration: 0.5, ease: 'back.out(2)', delay: 0.2 });
  }

  /* text split */
  $$('.text-split').forEach((el) => {
    const chars = splitText(el);
    gsap.from(chars, {
      scrollTrigger: { trigger: el, scroller, start: 'top 85%' },
      opacity: 0, y: 40,
      stagger: 0.02, duration: 0.5, ease: 'back.out(1.7)',
    });
  });

  /* accent lines */
  $$('.accent-line').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 90%' },
      scaleX: 0, duration: 0.8, ease: 'power3.inOut',
    });
  });

  /* clip-path wipe */
  $$('.anim-clip').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      clipPath: 'inset(0 0 0 0)', duration: 0.9, ease: 'power3.inOut',
    });
  });

  /* scale reveals */
  $$('.anim-scale').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.4)',
    });
  });

  /* slide from left */
  $$('.anim-slide-left').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      x: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
    });
  });

  /* slide from right */
  $$('.anim-slide-right').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      x: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
    });
  });

  /* slide up */
  $$('.anim-slide-up').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
    });
  });

  /* rotate in */
  $$('.anim-rotate').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      rotation: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out',
    });
  });

  /* blur reveal */
  $$('.anim-blur').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      filter: 'blur(0px)', opacity: 1, duration: 0.8, ease: 'power2.out',
    });
  });

  /* work items */
  $$('.work__item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: { trigger: item, scroller, start: 'top 88%' },
      opacity: 0, y: 40, rotateX: 8,
      duration: 0.8, delay: i * 0.1, ease: 'power3.out',
    });
  });

  /* service items */
  $$('.service-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: { trigger: item, scroller, start: 'top 88%' },
      opacity: 0, x: -50, rotateY: -5,
      duration: 0.8, delay: i * 0.08, ease: 'power3.out',
    });
  });

  /* pricing cards */
  $$('.pricing__card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, scroller, start: 'top 88%' },
      opacity: 0, y: 40, scale: 0.95, rotateY: 5,
      duration: 0.7, delay: i * 0.1, ease: 'back.out(1.3)',
    });
  });

  /* process steps */
  $$('.process__step').forEach((step, i) => {
    gsap.from(step, {
      scrollTrigger: { trigger: step, scroller, start: 'top 88%' },
      opacity: 0, x: -40, rotateY: -3,
      duration: 0.7, delay: i * 0.1, ease: 'power3.out',
    });
  });

  /* capabilities */
  $$('.capability').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, scroller, start: 'top 88%' },
      opacity: 0, y: 30, scale: 0.95,
      duration: 0.6, delay: i * 0.08, ease: 'back.out(1.3)',
    });
  });

  /* stats */
  $$('.stat').forEach((stat, i) => {
    gsap.from(stat, {
      scrollTrigger: { trigger: stat, scroller, start: 'top 88%' },
      opacity: 0, y: 30, scale: 0.9,
      duration: 0.6, delay: i * 0.1, ease: 'back.out(1.5)',
    });
  });

  /* contact links */
  $$('.contact-links__item').forEach((item) => {
    gsap.from(item, {
      scrollTrigger: { trigger: item, scroller, start: 'top 88%' },
      opacity: 0, x: 40, rotateY: 3,
      duration: 0.8, ease: 'power3.out',
    });
  });

  /* team groups */
  $$('.team__group').forEach((group, i) => {
    gsap.from(group, {
      scrollTrigger: { trigger: group, scroller, start: 'top 85%' },
      opacity: 0, y: 40, scale: 0.9,
      duration: 0.8, delay: i * 0.12, ease: 'back.out(1.3)',
    });
  });

  /* CTA heading */
  $$('.cta__heading, .page-cta h2').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 85%' },
      opacity: 0, y: 80, scale: 0.85, skewY: 3,
      duration: 1.2, ease: 'power4.out',
    });
  });

  /* CTA buttons */
  $$('.cta__btn').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 90%' },
      opacity: 0, y: 30, scale: 0.8,
      duration: 0.7, ease: 'back.out(2.5)',
    });
  });

  /* section eyebrows */
  $$('.section__eyebrow').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 90%' },
      opacity: 0, x: -30, duration: 0.6, ease: 'power3.out',
    });
  });

  /* section headings */
  $$('.section__heading').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      opacity: 0, y: 50, scale: 0.95, duration: 1, ease: 'power3.out',
    });
  });

  /* statement text */
  $$('.statement__text').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 85%' },
      clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'power3.inOut',
    });
  });

  /* footer logo */
  const footerLogo = $('.footer__logo');
  if (footerLogo) {
    gsap.from(footerLogo, {
      scrollTrigger: { trigger: footerLogo, scroller, start: 'top 95%' },
      opacity: 0, rotation: -180, scale: 0.3,
      duration: 1, ease: 'back.out(1.5)',
    });
  }

  /* footer links */
  const footerLinks = $$('.footer__links a');
  if (footerLinks.length) {
    gsap.from(footerLinks, {
      scrollTrigger: { trigger: '.footer__links', scroller, start: 'top 95%' },
      opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power2.out',
    });
  }

  /* parallax on sections */
  $$('.section').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      y: -30, ease: 'none',
    });
  });

  /* marquee */
  const marquee = $('.marquee');
  if (marquee) {
    gsap.from(marquee, {
      scrollTrigger: { trigger: marquee, scroller, start: 'top 92%' },
      opacity: 0, scaleX: 0.8, duration: 1, ease: 'power3.out',
    });
  }

  /* work numbers */
  $$('.work__num').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, scroller, start: 'top 88%' },
      opacity: 0, scale: 2, duration: 0.6, ease: 'back.out(2)',
    });
  });

  /* reel */
  const reel = $('.reel__wrap');
  if (reel) {
    gsap.from(reel, {
      scrollTrigger: { trigger: reel, scroller, start: 'top 88%' },
      opacity: 0, y: 40, scale: 0.98, rotateX: 5,
      duration: 1, ease: 'power3.out',
    });
  }

  /* aero-window panels */
  $$('.aero-window').forEach((win, i) => {
    gsap.from(win, {
      scrollTrigger: { trigger: win, scroller, start: 'top 88%' },
      opacity: 0, y: 50, scale: 0.96,
      duration: 0.8, delay: i * 0.1, ease: 'power3.out',
    });
  });

  /* scroll progress glow */
  const progress = $('#scrollProgress');
  if (progress) {
    ScrollTrigger.create({
      trigger: document.body, scroller, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        progress.style.boxShadow = self.progress > 0.95
          ? '0 0 12px 2px rgba(42, 122, 122, 0.5)'
          : 'none';
      }
    });
  }
}

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
function initMagnetic() {
  if (!FINE_POINTER || REDUCED) return;
  $$('.cta__btn, .menu-fab').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = el.classList.contains('menu-fab')
        ? `translateY(-50%) translate(${x * 0.25}px, ${y * 0.25}px)`
        : `translate(${x * 0.25}px, ${y * 0.25}px)`;
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)',
        onComplete: () => { if (el.classList.contains('menu-fab')) el.style.transform = 'translateY(-50%)'; }
      });
    });
  });
}

/* ============================================================
   HOVER TILT
   ============================================================ */
function initHoverTilt() {
  if (!FINE_POINTER || REDUCED) return;
  $$('.work__item, .service-item, .pricing__card').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateZ(8px)`;
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { transform: 'perspective(800px) rotateY(0) rotateX(0) translateZ(0)', duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

/* ============================================================
   HERO CHAR MAGNETIC
   ============================================================ */
function initHeroChars() {
  if (!FINE_POINTER || REDUCED || !IS_HOME) return;
  const chars = $$('.hero__char');
  if (!chars.length) return;
  const hero = $('#hero');
  hero.addEventListener('pointermove', (e) => {
    const mx = e.clientX, my = e.clientY;
    chars.forEach((ch) => {
      const cr = ch.getBoundingClientRect();
      const cx = cr.left + cr.width / 2;
      const cy = cr.top + cr.height / 2;
      const dist = Math.hypot(mx - cx, my - cy);
      if (dist < 200) {
        const s = (1 - dist / 200) * 18;
        gsap.to(ch, { x: (mx - cx) / dist * s, y: (my - cy) / dist * s, duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.to(ch, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      }
    });
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    chars.forEach((ch) => gsap.to(ch, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' }));
  });
}

/* ============================================================
   MARQUEE
   ============================================================ */
function initMarquee() {
  const track = $('#marqueeTrack');
  if (!track || REDUCED) return;
  const unitHTML = track.innerHTML;
  let safety = 0;
  while (track.scrollWidth < innerWidth * 2.5 && safety < 20) { track.innerHTML += unitHTML; safety++; }
  let x = 0;
  (function loop() {
    x -= 0.5;
    const unitW = track.firstElementChild ? track.firstElementChild.offsetWidth * (track.children.length / 4) : 1000;
    if (Math.abs(x) > unitW) x = 0;
    track.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(loop);
  })();
}

/* ============================================================
   PAGE TRANSITIONS
   ============================================================ */
function initPageTransition() {
  const overlay = $('#pageTransition');
  if (!overlay) return;
  if (REDUCED) { overlay.style.display = 'none'; return; }

  const bars = $$('.pt-bar', overlay);
  const circle = $('.pt-circle', overlay);
  gsap.set(bars, { xPercent: 0 });
  if (circle) gsap.set(circle, { scale: 0 });

  const tl = gsap.timeline({ delay: 0.15 });
  tl.to(bars, { xPercent: -100, stagger: 0.06, duration: 0.6, ease: 'power4.inOut' });
  if (circle) tl.to(circle, { scale: 80, duration: 0.5, ease: 'power2.in' }, '-=0.3');

  $$('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || link.target === '_blank') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const url = new URL(href, location.href).href;
      if (url === location.href) return;
      const fab = $('#menuFab');
      const overlayEl = $('#menuOverlay');
      if (fab && overlayEl && overlayEl.classList.contains('open')) {
        fab.classList.remove('open');
        overlayEl.classList.remove('open');
        overlayEl.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
      gsap.set(bars, { xPercent: 0 });
      if (circle) gsap.set(circle, { scale: 0 });
      const tlIn = gsap.timeline();
      tlIn.to(bars, { xPercent: 0, stagger: 0.05, duration: 0.5, ease: 'power4.inOut' });
      if (circle) tlIn.to(circle, { scale: 80, duration: 0.4, ease: 'power2.in' }, '-=0.2');
      tlIn.call(() => { location.href = url; });
    });
  });
}

/* ============================================================
   TOOLKIT — Skills showcase animations
   ============================================================ */
function initToolkit() {
  if (REDUCED || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  $$('.toolkit__card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, scroller: VP(), start: 'top 88%' },
      opacity: 0, y: 40, scale: 0.9,
      duration: 0.6, delay: i * 0.08, ease: 'back.out(1.3)',
    });
  });
}

/* ============================================================
   INIT
   ============================================================ */
/* ============================================================
   WORKSPACE SWITCHER
   ============================================================ */
function initWorkspaceSwitcher() {
  const btns = $$('.pr-workspace-btn');
  if (!btns.length) return;
  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('pr-workspace-btn--active'));
      btn.classList.add('pr-workspace-btn--active');
    });
  });
}

/* ============================================================
   TOOL SELECTION
   ============================================================ */
function initToolSelection() {
  const tools = $$('.pr-tool');
  if (!tools.length) return;
  tools.forEach((tool) => {
    tool.addEventListener('click', () => {
      tools.forEach((t) => t.classList.remove('pr-tool--active'));
      tool.classList.add('pr-tool--active');
    });
  });
}

/* ============================================================
   PROJECT BIN — folder expand/collapse, file click
   ============================================================ */
function initProjectBin() {
  const folders = $$('.pr-bin-folder');
  const rows = $$('.pr-bin-row');
  folders.forEach((folder) => {
    folder.addEventListener('click', () => {
      folder.classList.toggle('pr-bin-folder--open');
      const arrow = folder.querySelector('.pr-bin-folder__arrow');
      if (arrow) arrow.innerHTML = folder.classList.contains('pr-bin-folder--open') ? '&#9660;' : '&#9654;';
    });
  });
  rows.forEach((row) => {
    row.addEventListener('click', () => {
      rows.forEach((r) => r.classList.remove('pr-bin-row--active'));
      row.classList.add('pr-bin-row--active');
      const label = document.getElementById('prSourceLabel');
      if (label) label.textContent = row.dataset.name || 'No clip loaded';
    });
  });
}

/* ============================================================
   SOURCE MONITOR — play/pause, mark in/out
   ============================================================ */
function initSourceMonitor() {
  const playBtn = document.getElementById('srcPlay');
  const inBtn = document.getElementById('srcMarkIn');
  const outBtn = document.getElementById('srcMarkOut');
  const wave = document.getElementById('prSourceWave');
  let playing = false;

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      playing = !playing;
      playBtn.innerHTML = playing ? '&#10074;&#10074;' : '&#9654;';
    });
  }
  if (inBtn) inBtn.addEventListener('click', () => { /* mark in visual */ });
  if (outBtn) outBtn.addEventListener('click', () => { /* mark out visual */ });
}

/* ============================================================
   LUMETRI SLIDERS — drag to adjust
   ============================================================ */
function initLumetriSliders() {
  $$('.pr-slider').forEach((slider) => {
    const track = slider.querySelector('.pr-slider-track');
    const thumb = slider.querySelector('.pr-slider-thumb');
    const valEl = slider.querySelector('.pr-slider__val');
    if (!track || !thumb) return;

    let dragging = false;
    const update = (e) => {
      const rect = track.getBoundingClientRect();
      let pct = (e.clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      thumb.style.left = (pct * 100) + '%';
      if (valEl) {
        const param = slider.dataset.param;
        let display;
        if (param === 'saturation') display = (pct * 200).toFixed(1);
        else if (param === 'contrast') display = Math.round((pct - 0.5) * 200).toString();
        else if (param && param.startsWith('vig-')) display = (pct * 100).toFixed(1);
        else if (param && param.startsWith('hsl-')) display = ((pct - 0.5) * 360).toFixed(1);
        else display = ((pct - 0.5) * 2).toFixed(1);
        valEl.textContent = display;
      }
    };

    track.addEventListener('mousedown', (e) => { dragging = true; update(e); });
    thumb.addEventListener('mousedown', (e) => { dragging = true; e.stopPropagation(); });
    document.addEventListener('mousemove', (e) => { if (dragging) update(e); });
    document.addEventListener('mouseup', () => { dragging = false; });
  });
}

/* ============================================================
   COLOR WHEELS — drag puck
   ============================================================ */
function initColorWheels() {
  $$('.pr-color-wheel').forEach((wheel) => {
    const puck = wheel.querySelector('.pr-color-wheel__puck');
    if (!puck) return;
    let dragging = false;

    const update = (e) => {
      const rect = wheel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const maxR = rect.width / 2 - 6;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) { dx = dx / dist * maxR; dy = dy / dist * maxR; }
      puck.style.left = (50 + dx / maxR * 50) + '%';
      puck.style.top = (50 + dy / maxR * 50) + '%';
    };

    wheel.addEventListener('mousedown', (e) => { dragging = true; update(e); });
    document.addEventListener('mousemove', (e) => { if (dragging) update(e); });
    document.addEventListener('mouseup', () => { dragging = false; });
  });
}

/* ============================================================
   LUMETRI COLLAPSE SECTIONS
   ============================================================ */
function initLumetriCollapse() {
  $$('.pr-lumetri__title').forEach((title) => {
    title.addEventListener('click', () => {
      const targetId = title.dataset.collapse;
      const body = document.getElementById(targetId);
      if (!body) return;
      const collapsed = body.classList.toggle('pr-lumetri__body--collapsed');
      if (collapsed) {
        body.style.maxHeight = '0';
      } else {
        body.style.maxHeight = body.scrollHeight + 'px';
        setTimeout(() => { body.style.maxHeight = ''; }, 300);
      }
      const arrow = title.innerHTML.includes('&#9660;') ? '&#9654;' : '&#9660;';
      title.innerHTML = title.textContent.replace(/[▲▼▶]/g, '').trim() + ' ' + arrow;
    });
  });
}

/* ============================================================
   ESSENTIAL GRAPHICS — template select, text edit, align
   ============================================================ */
function initGraphicsTemplates() {
  const tpls = $$('.pr-graphics-tpl');
  const textInput = document.getElementById('prGraphicsText');
  tpls.forEach((tpl) => {
    tpl.addEventListener('click', () => {
      tpls.forEach((t) => t.style.borderColor = '');
      tpl.style.borderColor = 'var(--pr-accent)';
    });
  });

  const alignBtns = $$('.pr-graphics-align-btn');
  alignBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      alignBtns.forEach((b) => b.classList.remove('pr-graphics-align-btn--active'));
      btn.classList.add('pr-graphics-align-btn--active');
    });
  });
}

/* ============================================================
   EFFECTS TREE — expand/collapse, select, search filter
   ============================================================ */
function initEffectsTree() {
  const tree = document.getElementById('prEffectsTree');
  const search = document.getElementById('prEffectsSearch');
  if (!tree) return;

  $$('.pr-tree-folder', tree).forEach((folder) => {
    folder.addEventListener('click', (e) => {
      if (e.target.classList.contains('pr-tree-item')) {
        $$('.pr-tree-item', tree).forEach((i) => i.classList.remove('pr-tree-item--active'));
        e.target.classList.add('pr-tree-item--active');
        return;
      }
      folder.classList.toggle('pr-tree-folder--open');
      const arrow = folder.querySelector('.pr-tree-folder__arrow');
      if (arrow) arrow.innerHTML = folder.classList.contains('pr-tree-folder--open') ? '&#9660;' : '&#9654;';
    });
  });

  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      $$('.pr-tree-item', tree).forEach((item) => {
        item.style.display = item.textContent.toLowerCase().includes(q) || !q ? '' : 'none';
      });
    });
  }
}

/* ============================================================
   AUDIO MIXER — fader drag + VU meter animation
   ============================================================ */
function initAudioMixer() {
  $$('.pr-fader-track').forEach((track) => {
    const thumb = track.querySelector('.pr-fader-thumb');
    const strip = track.closest('.pr-fader-strip');
    const dbEl = strip ? strip.querySelector('.pr-fader-db') : null;
    const vuFill = strip ? strip.querySelector('.pr-fader-vu-fill') : null;
    if (!thumb) return;
    let dragging = false;

    const update = (e) => {
      const rect = track.getBoundingClientRect();
      let pct = 1 - (e.clientY - rect.top) / rect.height;
      pct = Math.max(0, Math.min(1, pct));
      thumb.style.bottom = (pct * 100) + '%';
      if (vuFill) vuFill.style.height = (pct * 100) + '%';
      if (dbEl) {
        const db = pct === 0 ? '-∞' : ((pct - 0.5) * 24).toFixed(1) + ' dB';
        dbEl.textContent = db;
      }
    };

    track.addEventListener('mousedown', (e) => { dragging = true; update(e); });
    thumb.addEventListener('mousedown', (e) => { dragging = true; e.stopPropagation(); });
    document.addEventListener('mousemove', (e) => { if (dragging) update(e); });
    document.addEventListener('mouseup', () => { dragging = false; });
  });

  // VU meter bounce
  $$('.pr-fader-vu-fill').forEach((fill) => {
    let base = parseFloat(fill.style.height) || 40;
    function bounce() {
      const jitter = (Math.random() - 0.5) * 8;
      fill.style.height = Math.max(5, Math.min(95, base + jitter)) + '%';
      setTimeout(bounce, 150 + Math.random() * 200);
    }
    bounce();
  });
}

/* ============================================================
   MARKERS — click to jump playhead
   ============================================================ */
function initMarkers() {
  const playhead = document.getElementById('prPlayhead');
  const timecode = document.getElementById('prTimecode');
  $$('.pr-marker').forEach((marker) => {
    marker.addEventListener('click', () => {
      const tc = marker.dataset.time;
      if (playhead && tc) {
        const parts = tc.split(':').map(Number);
        const totalFrames = parts[0] * 86400 * 24 + parts[1] * 3600 * 24 + parts[2] * 24 + parts[3];
        const pct = (totalFrames / (24 * 240)) * 100;
        playhead.style.left = Math.min(95, Math.max(2, pct)) + '%';
      }
      if (timecode && tc) timecode.textContent = tc;
    });
  });
}

/* ============================================================
   HISTORY — click to highlight
   ============================================================ */
function initHistoryUndo() {
  $$('.pr-history-item').forEach((item) => {
    item.addEventListener('click', () => {
      const items = $$('.pr-history-item');
      const idx = items.indexOf(item);
      items.forEach((it, i) => {
        it.classList.toggle('pr-history-item--active', i <= idx);
      });
    });
  });
}

/* ============================================================
   TIMELINE — clip selection, ruler click, track toggles
   ============================================================ */
function initTimelineInteractions() {
  // Clip selection
  $$('.pr-clip').forEach((clip) => {
    clip.addEventListener('click', (e) => {
      e.stopPropagation();
      $$('.pr-clip').forEach((c) => c.style.outline = '');
      clip.style.outline = '1px solid var(--pr-accent)';
    });
  });

  // Ruler click → move playhead
  const ruler = document.getElementById('prRuler');
  const playhead = document.getElementById('prPlayhead');
  const timecode = document.getElementById('prTimecode');
  if (ruler && playhead) {
    ruler.addEventListener('click', (e) => {
      const rect = ruler.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      playhead.style.left = Math.max(0, Math.min(100, pct)) + '%';
      if (timecode) {
        const totalSec = Math.floor(pct * 2.4);
        const f = Math.floor((pct * 2.4 - totalSec) * 24);
        const s = totalSec % 60;
        const m = Math.floor(totalSec / 60) % 60;
        const h = Math.floor(totalSec / 3600);
        timecode.textContent =
          String(h).padStart(2, '0') + ':' +
          String(m).padStart(2, '0') + ':' +
          String(s).padStart(2, '0') + ':' +
          String(f).padStart(2, '0');
      }
    });
  }

  // Track eye/mute/solo/lock toggles
  $$('.pr-th__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('toggled');
      if (btn.classList.contains('toggled')) {
        btn.style.opacity = '0.4';
      } else {
        btn.style.opacity = '1';
      }
    });
  });
}

/* ============================================================
   TIMELINE ZOOM
   ============================================================ */
function initTimelineZoom() {
  const zoom = document.getElementById('prZoom');
  const tracks = document.querySelector('.pr-timeline__tracks');
  if (!zoom || !tracks) return;
  zoom.addEventListener('input', () => {
    const scale = 0.5 + (zoom.value / 10) * 1.5;
    tracks.style.transform = `scaleX(${scale})`;
    tracks.style.transformOrigin = 'left top';
  });
}

/* ============================================================
   KEYBOARD SHORTCUTS (Premiere Pro style)
   ============================================================ */
function initKeyboardShortcuts() {
  const toolKeys = {
    'v': 'select', 'a': 'trackselect', 'b': 'ripple',
    'n': 'rolling', 'r': 'ratestretch', 'c': 'razor',
    'y': 'slip', 'u': 'slide', 'p': 'pen', 'h': 'hand', 'z': 'zoom',
  };

  document.addEventListener('keydown', (e) => {
    // Don't intercept when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    const key = e.key.toLowerCase();

    // Space = play/pause source
    if (e.code === 'Space') {
      e.preventDefault();
      const playBtn = document.getElementById('srcPlay');
      if (playBtn) playBtn.click();
      return;
    }

    // [ and ] = mark in/out
    if (e.key === '[') { const b = document.getElementById('srcMarkIn'); if (b) b.click(); return; }
    if (e.key === ']') { const b = document.getElementById('srcMarkOut'); if (b) b.click(); return; }

    // Tool shortcuts
    if (toolKeys[key]) {
      const tool = document.querySelector(`.pr-tool[data-tool="${toolKeys[key]}"]`);
      if (tool) tool.click();
    }

    // Tab = switch bottom panels
    if (e.key === 'Tab') {
      e.preventDefault();
      const activeTab = document.querySelector('.pr-tab--active');
      if (activeTab) {
        const tabs = $$('.pr-tab');
        const idx = tabs.indexOf(activeTab);
        const next = tabs[(idx + 1) % tabs.length];
        if (next) next.click();
      }
    }

    // Esc = close menu
    if (e.key === 'Escape') {
      const overlay = document.getElementById('menuOverlay');
      if (overlay && overlay.classList.contains('open')) {
        const fab = document.getElementById('menuFab');
        if (fab) fab.click();
      }
    }
  });
}

/* ============================================================
   PR HAMBURGER — integrates with existing menu overlay
   ============================================================ */
function initPRHamburger() {
  const hamburger = document.getElementById('prHamburger');
  const fab = document.getElementById('menuFab');
  const overlay = document.getElementById('menuOverlay');
  if (!hamburger || !fab || !overlay) return;

  hamburger.addEventListener('click', () => {
    fab.click(); // reuse existing menu toggle
  });
}

/* ============================================================
   EXPORT BUTTONS
   ============================================================ */
function initExportButtons() {
  const queueBtn = document.querySelector('.pr-export__btn--queue');
  const exportBtn = document.querySelector('.pr-export__btn--export');
  if (queueBtn) {
    queueBtn.addEventListener('click', () => {
      queueBtn.textContent = 'Added to Queue ✓';
      queueBtn.style.color = 'var(--pr-accent)';
      setTimeout(() => { queueBtn.textContent = 'Queue'; queueBtn.style.color = ''; }, 2000);
    });
  }
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportBtn.textContent = 'Exporting...';
      exportBtn.style.opacity = '0.6';
      setTimeout(() => { exportBtn.textContent = 'Export ✓'; exportBtn.style.opacity = '1'; exportBtn.style.background = '#28c840'; }, 1500);
      setTimeout(() => { exportBtn.textContent = 'Export'; exportBtn.style.background = ''; }, 3500);
    });
  }
}

/* ============================================================
   INIT ALL
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initCursor();
  initScrollProgress();
  initMenu();
  initAnimations();
  initCounters();
  initHorizontalScroll();
  initMagnetic();
  initHoverTilt();
  initHeroChars();
  initMarquee();
  initPageTransition();
  initToolkit();
  // Premiere Pro panel interactivity
  initWorkspaceSwitcher();
  initToolSelection();
  initProjectBin();
  initSourceMonitor();
  initLumetriSliders();
  initColorWheels();
  initLumetriCollapse();
  initGraphicsTemplates();
  initEffectsTree();
  initAudioMixer();
  initMarkers();
  initHistoryUndo();
  initTimelineInteractions();
  initTimelineZoom();
  initKeyboardShortcuts();
  initPRHamburger();
  initExportButtons();
});
