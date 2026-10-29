/* Marci Metzger Homes main.js. Shared behaviour for every page. */
(function () {
  'use strict';

  /* 1. Helpers */
  const root = document.documentElement;
  const page = document.body.dataset.route || 'home';
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hasObserver = 'IntersectionObserver' in window;
  const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';
  const siteData = readSiteData();

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); }

  function readSiteData() {
    const el = document.getElementById('site-data');
    try { return el ? JSON.parse(el.textContent) : {}; } catch (err) { return {}; }
  }

  function setGroupVisible(name, visible, scope) {
    $$('[data-show="' + name + '"]', scope).forEach(el => el.toggleAttribute('hidden', !visible));
  }

  function setText(name, text, scope) {
    $$('[data-text="' + name + '"]', scope).forEach(el => { el.textContent = text; });
  }

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (err) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (err) { /* ignore */ } }
  };

  const scrollTasks = [];
  let scrollFrame = null;
  function onEveryScroll(task) { scrollTasks.push(task); }
  function requestScrollUpdate() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      const writes = scrollTasks.map(task => task()).filter(Boolean);
      writes.forEach(write => write());
    });
  }

  /* 2. Header: shadow, mobile menu, Pages dropdown */
  let isMenuOpen = false;
  let isPagesOpen = false;

  function updateHeaderShadow() {
    const scrolled = window.scrollY > 8;
    return () => root.classList.toggle('is-scrolled', scrolled);
  }

  function setMobileMenu(open) {
    if (open === isMenuOpen) return;
    isMenuOpen = open;
    root.classList.toggle('is-menu-open', open);
    setGroupVisible('menu-open', open);
    setGroupVisible('menu-closed', !open);
    setText('menuText', open ? 'Close' : 'Menu');
    $$('[data-on-click="toggleMobileMenu"]').forEach(btn => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  function setPagesMenu(open) {
    if (open === isPagesOpen) return;
    isPagesOpen = open;
    setGroupVisible('pages-menu', open);
    $$('[data-pages-toggle]').forEach(btn => btn.setAttribute('aria-expanded', String(open)));
  }

  /* 3. In-page links: scroll a section to just under the header */
  let pinFrame = null;
  let settleTimer = null;

  function getHeaderHeight() {
    const header = $('.site-header');
    return header ? Math.round(header.getBoundingClientRect().height) : 80;
  }

  function glideTo(getTargetY, isCancelled, onDone) {
    const startY = window.scrollY, startTime = performance.now();
    const duration = Math.min(1400, Math.max(500, Math.abs(getTargetY() - startY) * 0.35));
    const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => {
      if (isCancelled()) return;
      const t = Math.min(1, (now - startTime) / duration);
      jumpScrollTo(startY + (getTargetY() - startY) * easeInOutCubic(t));
      if (t < 1) pinFrame = requestAnimationFrame(step); else onDone();
    };
    pinFrame = requestAnimationFrame(step);
  }

  function scrollToSection(el, behavior) {
    const smooth = behavior === 'smooth' && !reduceMotion;
    const targetY = () => Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - getHeaderHeight()));
    const jumpTo = jumpScrollTo;
    stopSmoothWheel();
    if (pinFrame) cancelAnimationFrame(pinFrame);
    clearTimeout(settleTimer);
    let userTookOver = false;
    const stopPinning = () => { userTookOver = true; };
    ['wheel', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, stopPinning, { once: true, passive: true }));
    const holdPosition = () => {
      const start = performance.now();
      const step = () => {
        if (userTookOver) return;
        const y = targetY();
        if (Math.abs(window.scrollY - y) > 1) jumpTo(y);
        if (performance.now() - start < 1200) pinFrame = requestAnimationFrame(step);
      };
      pinFrame = requestAnimationFrame(step);
    };
    if (smooth) {
      glideTo(targetY, () => userTookOver, holdPosition);
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => { jumpTo(targetY()); holdPosition(); }));
    }
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }

  function handleInPageLink(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    const section = href.length > 1 ? document.getElementById(href.slice(1)) : null;
    if (!section) return;
    event.preventDefault();
    try { history.pushState(null, '', href); } catch (err) { /* file:// or sandbox */ }
    setMobileMenu(false);
    setPagesMenu(false);
    requestAnimationFrame(() => scrollToSection(section, 'smooth'));
  }

  function scrollToHashOnLoad() {
    if (location.hash.length < 2) return;
    const section = document.getElementById(location.hash.slice(1));
    if (section) setTimeout(() => scrollToSection(section, 'instant'), 120);
  }

  /* 3b. Smooth wheel scrolling (desktop mouse and trackpad) */
  const SMOOTH_EASE = 0.1; // share of the remaining distance covered per frame
  const smoothWheel = { target: 0, current: 0, frame: null };

  function jumpScrollTo(y) {
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    root.style.scrollBehavior = '';
  }

  function stopSmoothWheel() {
    if (smoothWheel.frame) cancelAnimationFrame(smoothWheel.frame);
    smoothWheel.frame = null;
  }

  function canScrollInside(el, deltaY) {
    for (let node = el; node && node !== document.body && node !== root; node = node.parentElement) {
      if (node.nodeType !== 1) continue;
      const overflowY = getComputedStyle(node).overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        if (deltaY < 0 && node.scrollTop > 0) return true;
        if (deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1) return true;
      }
    }
    return false;
  }

  function stepSmoothWheel() {
    const distance = smoothWheel.target - smoothWheel.current;
    if (Math.abs(distance) < 0.5) {
      smoothWheel.current = smoothWheel.target;
      jumpScrollTo(smoothWheel.current);
      smoothWheel.frame = null;
      return;
    }
    smoothWheel.current += distance * SMOOTH_EASE;
    jumpScrollTo(smoothWheel.current);
    smoothWheel.frame = requestAnimationFrame(stepSmoothWheel);
  }

  function onSmoothWheel(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey) return; // pinch / browser zoom
    if (root.style.overflow === 'hidden') return; // lightbox open
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return; // sideways swipe
    if (canScrollInside(event.target, event.deltaY)) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1;
    if (!smoothWheel.frame) smoothWheel.target = smoothWheel.current = window.scrollY;
    const maxY = root.scrollHeight - window.innerHeight;
    smoothWheel.target = Math.max(0, Math.min(maxY, smoothWheel.target + event.deltaY * unit));
    if (!smoothWheel.frame) smoothWheel.frame = requestAnimationFrame(stepSmoothWheel);
  }

  function onNativeScrollDuringGlide() {
    if (smoothWheel.frame && Math.abs(window.scrollY - Math.round(smoothWheel.current)) > 2) stopSmoothWheel();
  }

  function initSmoothWheelScroll() {
    const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduceMotion || !finePointer) return;
    window.addEventListener('wheel', onSmoothWheel, { passive: false });
    window.addEventListener('scroll', onNativeScrollDuringGlide, { passive: true });
    window.addEventListener('keydown', stopSmoothWheel);
  }

  /* 4. Scroll spy: highlight the menu item of the section in view */
  const SPY_SECTIONS = [['home', 'home'], ['about', 'about'], ['get-it-sold', 'about'], ['listings', 'listings'], ['gallery', 'gallery'], ['services', 'gallery'], ['contact', 'contact']];
  let activeMenuItem = null;

  function updateScrollSpy() {
    if (page !== 'home') return;
    const line = window.innerHeight * 0.35;
    let active = 'home';
    SPY_SECTIONS.forEach(([id, item]) => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= line) active = item;
    });
    if (active === activeMenuItem) return;
    activeMenuItem = active;
    const href = active === 'listings' ? '#listings' : '#' + active;
    return () => $$('[data-nav-link], [data-drawer-link]').forEach(link => {
      if (link.getAttribute('href') === href) link.setAttribute('aria-current', 'true');
      else if (link.getAttribute('aria-current') === 'true') link.removeAttribute('aria-current');
    });
  }

  /* 5. Home hero: intro fade and scroll-driven shrink */
  function playHeroIntro() {
    if (reduceMotion) { root.classList.add('is-hero-in'); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-hero-in')));
  }

  function updateHero() {
    const section = $('[data-ref="hero"]');
    const frame = $('[data-ref="hero-frame"]');
    const text = $('[data-ref="hero-text"]');
    const caption = $('[data-ref="hero-caption"]');
    if (!section || !frame || !text || !caption) return;
    if (reduceMotion) {
      return () => { frame.style.clipPath = 'none'; text.style.opacity = '1'; text.style.transform = 'none'; caption.style.opacity = '0'; };
    }
    const viewH = window.innerHeight - 80, viewW = window.innerWidth;
    const box = section.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (80 - box.top) / Math.max(1, box.height - viewH)));
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const captionShare = viewW < 640 ? 0.22 : 0.16;
    const top = eased * viewH * 0.05, bottom = eased * viewH * captionShare, side = eased * Math.max(16, viewW * 0.06), radius = eased * 24;
    const textOpacity = 1 - Math.min(1, progress / 0.45);
    return () => {
      frame.style.clipPath = 'inset(' + top + 'px ' + side + 'px ' + bottom + 'px ' + side + 'px round ' + radius + 'px)';
      text.style.opacity = String(textOpacity);
      text.style.transform = 'translateY(' + (-progress * 48) + 'px)';
      text.style.visibility = textOpacity < 0.02 ? 'hidden' : 'visible';
      caption.style.opacity = String(Math.min(1, Math.max(0, (progress - 0.55) / 0.35)));
    };
  }

  /* 6. Brush highlights behind key words */
  function initBrushMarks() {
    const marks = $$('[data-mark]');
    if (reduceMotion || !hasObserver) { marks.forEach(m => m.classList.add('is-marked')); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-marked');
      observer.unobserve(entry.target);
    }), { threshold: 0.6 });
    marks.forEach(m => observer.observe(m));
  }

  /* 7. "Get it sold" timeline */
  function updateTimeline() {
    const box = $('[data-ref="timeline"]');
    const fill = $('[data-ref="timeline-fill"]');
    if (!box || !fill) return;
    const viewH = window.innerHeight, rect = box.getBoundingClientRect();
    const progress = reduceMotion ? 1 : Math.min(1, Math.max(0, (viewH * 0.62 - rect.top) / rect.height));
    const arrived = $$('[data-tl]:not(.is-active)', box).filter(step => reduceMotion || step.getBoundingClientRect().top + step.offsetHeight * 0.3 < viewH * 0.85);
    return () => {
      fill.style.transform = 'scaleY(' + progress + ')';
      arrived.forEach(step => step.classList.add('is-active'));
    };
  }

  /* 8. Photo gallery: column layout, reveal, lightbox, swipe */
  const photos = siteData.gallery || [];
  let galleryColumnCount = 0;

  function getGalleryColumnCount() {
    const w = window.innerWidth;
    return w >= 960 ? 3 : w >= 560 ? 2 : 1;
  }

  function arrangeGalleryColumns() {
    const columns = $$('[data-gal-col]');
    const layouts = siteData.galleryLayouts;
    if (!columns.length || !layouts) return;
    const count = getGalleryColumnCount();
    if (count === galleryColumnCount) return;
    galleryColumnCount = count;
    const tiles = {};
    $$('[data-gal]').forEach(tile => { tiles[tile.dataset.gal] = tile; });
    layouts[count].forEach((column, c) => {
      column.forEach(([index, ratio]) => {
        const tile = tiles[index];
        if (!tile) return;
        tile.dataset.ratio = ratio;
        columns[c].appendChild(tile);
      });
    });
    columns.forEach((column, c) => column.toggleAttribute('hidden', c >= count));
  }

  function revealGalleryTile(tile, delay) {
    if (tile.classList.contains('is-revealed')) return;
    tile.style.transitionDelay = delay + 'ms';
    tile.classList.add('is-revealed');
  }

  function initGalleryReveal() {
    const tiles = $$('[data-gal]');
    if (reduceMotion || !hasObserver) { tiles.forEach(t => revealGalleryTile(t, 0)); return; }
    const observer = new IntersectionObserver(entries => {
      const hits = entries.filter(e => e.isIntersecting).map(e => e.target)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      hits.forEach((tile, k) => { revealGalleryTile(tile, k * 110); observer.unobserve(tile); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
    tiles.forEach(t => observer.observe(t));
  }

  function revealGalleryTilesInView() {
    const viewH = window.innerHeight;
    const inView = $$('[data-gal]:not(.is-revealed)').filter(tile => tile.getBoundingClientRect().top < viewH * 0.95);
    if (inView.length) return () => inView.forEach((tile, k) => revealGalleryTile(tile, k * 90));
  }

  const lightbox = { index: -1, lastFocus: null, built: false, touch: null };
  const lightboxDialog = () => $('[data-show="lightbox"]');
  const lightboxTrack = () => $('[data-ref="lightbox-track"]');
  const trackOffset = (i, extraPx) => 'translateX(calc(' + (-i * 100) + '% - ' + (i * 32) + 'px' + (extraPx ? ' + ' + extraPx + 'px' : '') + '))';

  function buildLightboxSlides() {
    const track = lightboxTrack();
    if (!track || lightbox.built) return;
    photos.forEach(photo => {
      const slide = document.createElement('div');
      slide.className = 'lightbox__slide';
      const img = document.createElement('img');
      img.className = 'lightbox__img';
      img.src = photo.src;
      img.alt = photo.alt;
      img.draggable = false;
      slide.appendChild(img);
      track.appendChild(slide);
    });
    lightbox.built = true;
  }

  function showLightboxPhoto(animate) {
    const track = lightboxTrack(), dialog = lightboxDialog();
    if (!track || !dialog) return;
    const i = lightbox.index;
    if (!animate) { track.style.transition = 'none'; }
    track.style.transform = trackOffset(i);
    if (!animate) { void track.offsetWidth; track.style.transition = ''; }
    Array.from(track.children).forEach((slide, k) => {
      slide.classList.toggle('is-current', k === i);
      if (k === i) slide.removeAttribute('aria-hidden'); else slide.setAttribute('aria-hidden', 'true');
    });
    dialog.setAttribute('aria-label', 'Photo ' + (i + 1) + ' of ' + photos.length);
    setText('lbCount', (i + 1) + ' / ' + photos.length);
  }

  function lockPageScroll(lock) {
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
    document.body.style.paddingRight = lock && scrollbar > 0 ? scrollbar + 'px' : '';
  }

  function openLightbox(event, button) {
    const tile = button.closest('[data-gal]');
    if (!tile || !photos.length) return;
    buildLightboxSlides();
    lightbox.lastFocus = document.activeElement;
    lightbox.index = Number(tile.dataset.gal);
    setGroupVisible('lightbox', true);
    lockPageScroll(true);
    showLightboxPhoto(false);
    const close = $('[data-lb-close]');
    if (close) close.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (lightbox.index < 0) return;
    lightbox.index = -1;
    setGroupVisible('lightbox', false);
    lockPageScroll(false);
    if (lightbox.lastFocus) lightbox.lastFocus.focus({ preventScroll: true });
  }

  function stepLightbox(direction) {
    if (lightbox.index < 0) return;
    lightbox.index = (lightbox.index + direction + photos.length) % photos.length;
    showLightboxPhoto(true);
  }

  function initLightboxSwipe() {
    const dialog = lightboxDialog();
    if (!dialog) return;
    const last = () => photos.length - 1;
    dialog.addEventListener('touchstart', e => {
      const t = e.touches[0];
      lightbox.touch = { x: t.clientX, y: t.clientY, time: Date.now(), horizontal: null };
    }, { passive: true });
    dialog.addEventListener('touchmove', e => {
      const touch = lightbox.touch, track = lightboxTrack();
      if (!touch || !track) return;
      const t = e.touches[0];
      let dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;
      if (touch.horizontal === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        touch.horizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (!touch.horizontal) return;
      if ((lightbox.index === 0 && dx > 0) || (lightbox.index === last() && dx < 0)) dx *= 0.3;
      track.style.transition = 'none';
      track.style.transform = trackOffset(lightbox.index, dx);
    }, { passive: true });
    dialog.addEventListener('touchend', e => {
      const touch = lightbox.touch, track = lightboxTrack();
      lightbox.touch = null;
      if (!touch) return;
      if (track) track.style.transition = '';
      if (!touch.horizontal) return;
      const dx = e.changedTouches[0].clientX - touch.x;
      const speed = Math.abs(dx) / Math.max(1, Date.now() - touch.time);
      const direction = dx < 0 ? 1 : -1;
      const farEnough = Math.abs(dx) > window.innerWidth * 0.18 || speed > 0.45;
      const atEdge = (lightbox.index === 0 && direction < 0) || (lightbox.index === last() && direction > 0);
      if (farEnough && !atEdge) { e.preventDefault(); stepLightbox(direction); }
      else if (track) track.style.transform = trackOffset(lightbox.index);
    });
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    setText('lbHint', coarse ? 'Swipe to browse photos' : 'Use arrow keys or buttons to browse');
  }

  /* 9. Scroll reveals: paragraphs, quote, service cards, [data-reveal] blocks */
  const fadeUp = (el, delay) => el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay, easing: EASE_OUT, fill: 'backwards' });

  function splitWords(p) {
    const original = Array.from(p.childNodes);
    if (!original.every(n => n.nodeType === 3)) return null;
    const fragment = document.createDocumentFragment();
    const spans = [];
    p.textContent.split(/(\s+)/).forEach(word => {
      if (!word) return;
      if (/^\s+$/.test(word)) { fragment.appendChild(document.createTextNode(word)); return; }
      const span = document.createElement('span');
      span.textContent = word;
      span.style.display = 'inline-block';
      fragment.appendChild(span);
      spans.push(span);
    });
    original.forEach(n => n.remove());
    p.appendChild(fragment);
    return { spans, restore() { while (p.firstChild) p.removeChild(p.firstChild); original.forEach(n => p.appendChild(n)); } };
  }

  function revealLines(p) {
    const split = splitWords(p);
    if (!split) { fadeUp(p, 0); return; }
    const lines = [];
    let lineTop = null;
    split.spans.forEach(span => {
      const top = span.offsetTop;
      if (lineTop === null || Math.abs(top - lineTop) > 4) { lines.push([]); lineTop = top; }
      lines[lines.length - 1].push(span);
    });
    let lastAnimation = null;
    lines.forEach((line, i) => line.forEach(span => { lastAnimation = fadeUp(span, i * 120); }));
    if (lastAnimation) lastAnimation.onfinish = () => split.restore(); else split.restore();
  }

  function revealQuote(quote) {
    const mark = $('[data-quote-mark]', quote);
    if (mark) mark.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.12)', offset: 0.6 }, { transform: 'scale(.96)', offset: 0.8 }, { opacity: 1, transform: 'scale(1)' }], { duration: 650, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
    let k = 0, lastAnimation = null;
    const splits = [];
    $$('p', quote).forEach(p => {
      const split = splitWords(p);
      if (!split) return;
      splits.push(split);
      split.spans.forEach(span => {
        lastAnimation = span.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 550 + k++ * 28, easing: EASE_OUT, fill: 'backwards' });
      });
    });
    if (lastAnimation) lastAnimation.onfinish = () => splits.forEach(s => s.restore());
  }

  const REVEAL_KEYFRAMES = {
    up: [{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'none' }],
    left: [{ opacity: 0, transform: 'translateX(-40px)' }, { opacity: 1, transform: 'none' }],
    right: [{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }],
    img: [{ opacity: 0, transform: 'translateY(24px)', clipPath: 'inset(6% 6% 6% 6% round 4px)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0% 0% 0% 0% round 4px)' }],
    form: [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }]
  };

  function revealBlock(block) {
    const variant = block.getAttribute('data-reveal');
    const delay = (Number(block.getAttribute('data-reveal-i')) || 0) * 140;
    const duration = variant === 'img' ? 1200 : variant === 'form' ? 1000 : 900;
    block.style.opacity = '';
    block.animate(REVEAL_KEYFRAMES[variant] || REVEAL_KEYFRAMES.up, { duration, delay, easing: EASE_OUT, fill: 'backwards' });
    if (variant === 'form') {
      Array.from(block.children).filter(c => c.offsetHeight).forEach((child, j) => {
        child.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: delay + 240 + j * 80, easing: EASE_OUT, fill: 'backwards' });
      });
    }
    $$('[data-reveal-sub]', block).forEach(sub => {
      const isFrame = sub.getAttribute('data-reveal-sub') === 'frame';
      const frames = isFrame ? [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }] : [{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }];
      sub.animate(frames, { duration: 1000, delay: delay + (isFrame ? 450 : 750), easing: EASE_OUT, fill: 'backwards' });
    });
    const img = variant === 'img' && $('img', block);
    if (img) img.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 1600, delay, easing: EASE_OUT });
  }

  function revealServiceCard(card, i) {
    card.style.opacity = '';
    card.animate([{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: i * 160, easing: EASE_OUT, fill: 'backwards' });
    const img = $('img', card);
    if (img) img.animate([{ transform: 'scale(1.08)', filter: 'saturate(.7)' }, { transform: 'scale(1)', filter: 'saturate(1)' }], { duration: 1400, delay: i * 160, easing: EASE_OUT, fill: 'backwards' });
  }

  function initScrollReveals() {
    const main = document.getElementById('main');
    if (!main || reduceMotion || !hasObserver) return;

    const paragraphs = $$('p', main).filter(p => p.textContent.trim().length > 40 && !p.closest('form,button,a,label,blockquote,[aria-hidden="true"],[data-tl],[data-gal],#home,[role="dialog"]'));
    const quote = $('[data-quote]', main);
    const viewH = window.innerHeight;
    const isBelowFold = el => el.getBoundingClientRect().top > viewH * 0.9;
    const textItems = (quote ? paragraphs.concat(quote) : paragraphs).filter(isBelowFold);
    const allCards = $$('[data-svc]', main);
    const cards = allCards.filter(isBelowFold);
    const waiting = $$('[data-reveal]', main).filter(isBelowFold);
    textItems.forEach(el => { el.style.opacity = '0'; });
    cards.forEach(c => { c.style.opacity = '0'; });
    waiting.forEach(b => { b.style.opacity = '0'; });
    const textObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      textObserver.unobserve(el);
      el.style.opacity = '';
      if (el.hasAttribute('data-quote')) revealQuote(el); else revealLines(el);
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    textItems.forEach(el => textObserver.observe(el));

    const cardObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      cardObserver.unobserve(entry.target);
      revealServiceCard(entry.target, allCards.indexOf(entry.target) % 3);
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    cards.forEach(c => cardObserver.observe(c));

    const blockObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      blockObserver.unobserve(entry.target);
      revealBlock(entry.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    waiting.forEach(b => blockObserver.observe(b));
  }

  /* 10. Forms: listing search, contact message */
  function formMessage(form, kind) {
    const section = form.closest('section') || document;
    return $('[data-msg="' + kind + '"]', form) || $('[data-msg="' + kind + '"]', section);
  }

  function searchListings(event, form) {
    event.preventDefault();
    const data = new FormData(form);
    const toNumber = v => { const n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; };
    const min = toNumber(data.get('min')), max = toNumber(data.get('max'));
    const message = formMessage(form, 'search');
    const button = $('button[type="submit"], button:not([type])', form);
    const show = (status, text) => {
      if (message) { message.dataset.status = status; setText('searchMsg', text, message.parentElement || form); }
      $$('[data-validate]', form).forEach(input => input.setAttribute('aria-invalid', String(status === 'error')));
    };
    if (min !== null && max !== null && max < min) {
      show('error', 'Max Price is lower than Min Price. Raise the maximum or clear one of the fields.');
      return;
    }
    show('loading', 'Opening listings on marcimetzger.com…');
    if (button) button.disabled = true;
    setText('searchLabel', 'Searching…', form);
    setTimeout(() => {
      window.open('https://marcimetzger.com/listings', '_blank', 'noopener');
      if (button) button.disabled = false;
      setText('searchLabel', 'Search Now', form);
      show('idle', 'Listings opened in a new tab. Not seeing what you need? Call (206) 919-6886.');
    }, 500);
  }

  function sendContactMessage(event, form) {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const emailInput = $('[name="email"]', form);
    const message = formMessage(form, 'contact');
    const button = $('button[type="submit"], button:not([type])', form);
    const show = (status, text) => {
      if (message) { message.dataset.status = status; setText('contactMsg', text, message.parentElement || form); }
    };
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (emailInput) emailInput.setAttribute('aria-invalid', String(!valid));
    setGroupVisible('email-error', !valid, form);
    if (!valid) { show('error', ''); if (emailInput) emailInput.focus(); return; }

    const finish = ok => {
      if (button) button.disabled = false;
      setText('contactLabel', 'Send', form);
      show(ok ? 'sent' : 'failed', ok ? 'Thank you. Your message was sent and Marci\u2019s team will reply by email.' : 'Your message didn\u2019t go through. Please try again, or call (206) 919-6886.');
      if (ok) form.reset();
    };
    if (/netlify\.app$/.test(location.hostname)) {
      if (button) button.disabled = true;
      setText('contactLabel', 'Sending…', form);
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() })
        .then(r => finish(r.ok)).catch(() => finish(false));
      return;
    }
    const name = String(data.get('name') || '').trim();
    const text = String(data.get('message') || '').trim();
    const body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + text;
    window.location.href = 'mailto:marcimetzger@gmail.com?subject=' + encodeURIComponent('Website message from ' + (name || email)) + '&body=' + encodeURIComponent(body);
    show('mailto', 'Your email app has opened with your message. Press Send there to deliver it, or call (206) 919-6886.');
  }

  /* 11. Office hours and week days */
  function isOfficeOpenNow() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false }).formatToParts(new Date());
      const hour = parseInt(parts.find(p => p.type === 'hour').value, 10) % 24;
      return hour >= 8 && hour < 19;
    } catch (err) { return false; }
  }

  function updateOfficeStatus() {
    const open = isOfficeOpenNow();
    root.classList.toggle('is-office-open', open);
    setText('openLabel', open ? 'Open now' : 'Closed now');
  }

  function highlightToday() {
    const today = (new Date().getDay() + 6) % 7;
    $$('[data-weekday]').forEach((day, i) => {
      if (i === today) day.setAttribute('aria-current', 'date'); else day.removeAttribute('aria-current');
    });
  }

  /* 12. Back-to-top button */
  function updateBackToTop() {
    const viewH = window.innerHeight;
    const footer = document.getElementById('site-footer');
    const footerInView = !!footer && footer.getBoundingClientRect().top < viewH - 24;
    const visible = window.scrollY > viewH * 0.9 && !footerInView;
    if (visible === root.classList.contains('is-top-visible')) return;
    return () => {
      root.classList.toggle('is-top-visible', visible);
      $$('[data-on-click="scrollBackToTop"][data-floating]').forEach(btn => {
        btn.tabIndex = visible ? 0 : -1;
        if (visible) btn.removeAttribute('aria-hidden'); else btn.setAttribute('aria-hidden', 'true');
      });
    };
  }

  function scrollBackToTop() {
    stopSmoothWheel();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    const main = document.getElementById('main');
    if (main) main.focus({ preventScroll: true });
  }

  /* 13. Cookie notice */
  const COOKIE_KEY = 'mm_cookie_ok';

  function initCookieNotice() {
    const show = storage.get(COOKIE_KEY) !== '1';
    setGroupVisible('cookie', show);
    root.classList.toggle('has-cookie', show);
  }

  function acceptCookies() {
    storage.set(COOKIE_KEY, '1');
    setGroupVisible('cookie', false);
    root.classList.remove('has-cookie');
  }

  /* 14. Image fallbacks */
  function handleBrokenImage(img) {
    const mode = img.dataset.fallback;
    if (mode === 'remove-card') {
      const card = img.closest('li');
      if (card) card.remove();
    } else if (mode === 'show-placeholder') {
      img.hidden = true;
      setGroupVisible('photo-failed', true, img.parentElement);
    }
  }

  function initImageFallbacks() {
    document.addEventListener('error', e => {
      const img = e.target;
      if (img && img.tagName === 'IMG' && img.dataset.fallback) handleBrokenImage(img);
    }, true);
    $$('img[data-fallback]').forEach(img => { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) handleBrokenImage(img); });
  }

  /* 15. Click actions and keyboard */
  const CLICK_ACTIONS = {
    toggleMobileMenu: () => setMobileMenu(!isMenuOpen),
    closeMobileMenu: () => setMobileMenu(false),
    togglePagesMenu: () => setPagesMenu(!isPagesOpen),
    closePagesMenu: () => setPagesMenu(false),
    openLightbox,
    closeLightbox,
    closeLightboxFromBackdrop: (event, el) => { if (event.target === el) closeLightbox(); },
    showPreviousPhoto: () => stepLightbox(-1),
    showNextPhoto: () => stepLightbox(1),
    scrollBackToTop,
    acceptCookies
  };
  const SUBMIT_ACTIONS = { searchListings, sendContactMessage };

  function onDocumentClick(event) {
    handleInPageLink(event);
    const el = event.target.closest && event.target.closest('[data-on-click]');
    const action = el && CLICK_ACTIONS[el.dataset.onClick];
    if (action) action(event, el);
  }

  function onDocumentSubmit(event) {
    const form = event.target;
    const action = form && SUBMIT_ACTIONS[form.dataset.onSubmit];
    if (action) action(event, form);
  }

  function onKeyDown(event) {
    if (lightbox.index >= 0) {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') stepLightbox(1);
      if (event.key === 'ArrowLeft') stepLightbox(-1);
    } else if (event.key === 'Escape') {
      setMobileMenu(false);
      setPagesMenu(false);
    }
  }

  function onResize() {
    if (window.innerWidth >= 960) setMobileMenu(false);
    arrangeGalleryColumns();
    requestScrollUpdate();
  }

  /* 16. Start-up */
  function init() {
    initImageFallbacks();
    initSmoothWheelScroll();
    initCookieNotice();
    arrangeGalleryColumns();
    initLightboxSwipe();
    updateOfficeStatus();
    highlightToday();
    setInterval(() => { updateOfficeStatus(); highlightToday(); }, 60000);

    onEveryScroll(updateHeaderShadow);
    onEveryScroll(updateScrollSpy);
    onEveryScroll(updateHero);
    onEveryScroll(updateTimeline);
    onEveryScroll(revealGalleryTilesInView);
    onEveryScroll(updateBackToTop);
    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', () => { requestScrollUpdate(); if (location.hash) scrollToHashOnLoad(); }, { once: true });
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('submit', onDocumentSubmit);
    requestScrollUpdate();

    playHeroIntro();
    scrollToHashOnLoad();
    const whenIdle = window.requestIdleCallback || (fn => setTimeout(fn, 120));
    requestAnimationFrame(() => whenIdle(() => { initGalleryReveal(); initScrollReveals(); initBrushMarks(); }, { timeout: 600 }));
  }

  init();
})();
