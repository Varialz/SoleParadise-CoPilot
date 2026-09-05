(() => {
  'use strict';

  const initialized = new WeakSet();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initHero(hero) {
    if (!hero || initialized.has(hero)) return;

    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    if (!slides.length) return;

    initialized.add(hero);

    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    const toggle = hero.querySelector('[data-hero-toggle]');
    const currentLabel = hero.querySelector('[data-hero-current]');
    const totalLabel = hero.querySelector('[data-hero-total]');

    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    let timer = null;
    let manuallyPaused = false;
    let interactionPaused = false;

    const autoplayEnabled = hero.dataset.heroAutoplay === 'true' && slides.length > 1;
    const interval = Math.max(4000, Number(hero.dataset.heroInterval) || 6000);
    const pad = (value) => String(value).padStart(2, '0');

    if (totalLabel) totalLabel.textContent = pad(slides.length);

    const update = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      if (currentLabel) currentLabel.textContent = pad(index + 1);
    };

    const clearTimer = () => {
      if (!timer) return;
      window.clearTimeout(timer);
      timer = null;
    };

    const shouldAutoplay = () => (
      autoplayEnabled &&
      !reducedMotion.matches &&
      !manuallyPaused &&
      !interactionPaused &&
      !document.hidden
    );

    const schedule = () => {
      clearTimer();
      if (!shouldAutoplay()) return;
      timer = window.setTimeout(() => {
        update(index + 1);
        schedule();
      }, interval);
    };

    const go = (nextIndex) => {
      update(nextIndex);
      schedule();
    };

    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));

    toggle?.addEventListener('click', () => {
      manuallyPaused = !manuallyPaused;
      toggle.setAttribute('aria-pressed', manuallyPaused ? 'true' : 'false');
      toggle.textContent = manuallyPaused ? 'Play' : 'Pause';
      schedule();
    });

    hero.addEventListener('mouseenter', () => {
      interactionPaused = true;
      clearTimer();
    });

    hero.addEventListener('mouseleave', () => {
      interactionPaused = false;
      schedule();
    });

    hero.addEventListener('focusin', () => {
      interactionPaused = true;
      clearTimer();
    });

    hero.addEventListener('focusout', (event) => {
      if (hero.contains(event.relatedTarget)) return;
      interactionPaused = false;
      schedule();
    });

    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener?.('change', schedule);

    update(index);
    schedule();
  }

  function init(scope = document) {
    if (scope.matches?.('[data-hero-slideshow]')) initHero(scope);
    scope.querySelectorAll?.('[data-hero-slideshow]').forEach(initHero);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();

  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
