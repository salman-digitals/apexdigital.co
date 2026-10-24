/* APEX DIGITALS — lightweight vanilla JS (no dependencies) */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

  /* Header: scrolled state + mobile menu */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header || header.dataset.ready) return;
    header.dataset.ready = '1';
    var toggle = header.querySelector('[data-nav-toggle]');
    var nav = header.querySelector('[data-nav]');

    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!toggle || !nav) return;
    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* Hero: entrance + scroll-driven headline and portrait */
  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero || hero.dataset.ready) return;
    hero.dataset.ready = '1';

    var words = [].slice.call(hero.querySelectorAll('[data-hero-word]'));
    var portrait = hero.querySelector('[data-hero-portrait]');
    var bar = hero.querySelector('[data-hero-progress]');
    var img = hero.querySelector('.hero__img');

    words.forEach(function (w) {
      [].slice.call(w.querySelectorAll('.hero__line-inner')).forEach(function (l, i) {
        l.style.setProperty('--n', i);
      });
    });

    var started = false;
    function start() {
      if (started) return;
      started = true;
      requestAnimationFrame(function () {
        hero.classList.add('is-ready');
        setTimeout(function () { hero.classList.add('is-live'); }, 2000);
      });
    }
    if (img && !img.complete) {
      img.addEventListener('load', start);
      img.addEventListener('error', start);
      setTimeout(start, 1500);
    } else {
      start();
    }

    if (reduced) return;

    var current = 0;
    var ticking = false;

    function setWord(index) {
      if (index === current) return;
      current = index;
      words.forEach(function (w, i) {
        w.classList.toggle('is-active', i === index);
        w.classList.toggle('is-past', i < index);
        if (i === index) w.removeAttribute('aria-hidden'); else w.setAttribute('aria-hidden', 'true');
      });
    }

    function update() {
      ticking = false;
      var rect = hero.getBoundingClientRect();
      var span = hero.offsetHeight - window.innerHeight;
      var p = span > 0 ? clamp(-rect.top / span, 0, 1) : 0;

      if (words.length > 1) {
        setWord(Math.min(words.length - 1, Math.floor(p * words.length)));
      }
      if (portrait) {
        portrait.style.setProperty('--ps', (1 + 0.1 * p).toFixed(4));
        portrait.style.setProperty('--px', (-3 * p).toFixed(3));
      }
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* Scroll reveals */
  var observer = null;
  function initReveal() {
    var items = [].slice.call(document.querySelectorAll('[data-reveal]:not([data-seen])'));
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); el.dataset.seen = '1'; });
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add('is-in');
          observer.unobserve(el);
          setTimeout(function () { el.style.transitionDelay = ''; }, 1400);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }

    document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      [].slice.call(group.querySelectorAll('[data-reveal]')).forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i % 6, 5) * 70 + 'ms';
      });
    });

    items.forEach(function (el) { el.dataset.seen = '1'; observer.observe(el); });
  }

  function init() {
    initHeader();
    initHero();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Shopify theme editor: re-initialise when sections are edited */
  document.addEventListener('shopify:section:load', function () {
    document.querySelectorAll('[data-hero]').forEach(function (h) { delete h.dataset.ready; });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { delete el.dataset.seen; el.classList.add('is-in'); });
    initHero();
  });
})();
