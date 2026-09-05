(() => {
  'use strict';

  const controllers = new WeakMap();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initHero(hero) {
    if (!hero) return null;
    if (controllers.has(hero)) return controllers.get(hero);

    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    if (!slides.length) return null;

    const currentLabel = hero.querySelector('[data-hero-current]');
    const totalLabel = hero.querySelector('[data-hero-total]');
    const toggle = hero.querySelector('[data-hero-toggle]');
    const copyRegion = hero.querySelector('[data-hero-copy-region]');
    const eyebrow = copyRegion?.querySelector('[data-hero-eyebrow]');
    const heading = copyRegion?.querySelector('[data-hero-heading]');
    const description = copyRegion?.querySelector('[data-hero-description]');
    const button = copyRegion?.querySelector('[data-hero-button]');

    let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
    if (index < 0) index = 0;

    let timer = null;
    let manuallyPaused = false;
    let interactionPaused = false;

    const autoplayEnabled = hero.getAttribute('data-hero-autoplay') === 'true' && slides.length > 1;
    const interval = Math.max(4000, Number(hero.getAttribute('data-hero-interval')) || 6000);
    const pad = (value) => String(value).padStart(2, '0');

    function clearTimer() {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function shouldAutoplay() {
      return autoplayEnabled &&
        !reducedMotion.matches &&
        !manuallyPaused &&
        !interactionPaused &&
        !document.hidden;
    }

    function update(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      const activeSlide = slides[index];

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      hero.setAttribute('data-hero-index', String(index));
      if (currentLabel) currentLabel.textContent = pad(index + 1);
      if (totalLabel) totalLabel.textContent = pad(slides.length);

      if (activeSlide.hasAttribute('data-hero-heading')) {
        const updateText = (element, value) => {
          if (!element) return;
          element.textContent = value || '';
          element.hidden = !value;
        };

        updateText(eyebrow, activeSlide.dataset.heroEyebrow);
        updateText(heading, activeSlide.dataset.heroHeading);
        updateText(description, activeSlide.dataset.heroCopy);

        if (button) {
          const label = activeSlide.dataset.heroButtonLabel || '';
          button.textContent = label;
          button.hidden = !label;
          button.href = activeSlide.dataset.heroButtonUrl || '#';
        }
      }
    }

    function schedule() {
      clearTimer();
      if (!shouldAutoplay()) return;
      timer = window.setTimeout(() => {
        update(index + 1);
        schedule();
      }, interval);
    }

    function go(nextIndex) {
      update(nextIndex);
      schedule();
    }

    function setPaused(paused) {
      manuallyPaused = paused;
      if (toggle) {
        toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
        toggle.textContent = paused ? 'Play' : 'Pause';
      }
      schedule();
    }

    const controller = {
      next() { go(index + 1); },
      prev() { go(index - 1); },
      goTo(nextIndex) { go(nextIndex); },
      toggle() { setPaused(!manuallyPaused); },
      refresh() {
        update(index);
        schedule();
      }
    };

    controllers.set(hero, controller);

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
      if (event.relatedTarget && hero.contains(event.relatedTarget)) return;
      interactionPaused = false;
      schedule();
    });

    update(index);
    schedule();
    return controller;
  }

  function init(scope = document) {
    if (scope.matches && scope.matches('[data-hero-slideshow]')) initHero(scope);
    if (scope.querySelectorAll) {
      scope.querySelectorAll('[data-hero-slideshow]').forEach(initHero);
    }
  }

  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-hero-prev],[data-hero-next],[data-hero-toggle]');
    if (!control) return;

    const hero = control.closest('[data-hero-slideshow]');
    if (!hero) return;

    const controller = initHero(hero);
    if (!controller) return;

    event.preventDefault();

    if (control.hasAttribute('data-hero-prev')) controller.prev();
    else if (control.hasAttribute('data-hero-next')) controller.next();
    else controller.toggle();
  }, true);

  document.addEventListener('visibilitychange', () => {
    document.querySelectorAll('[data-hero-slideshow]').forEach((hero) => {
      const controller = initHero(hero);
      if (controller) controller.refresh();
    });
  });

  const motionChange = () => {
    document.querySelectorAll('[data-hero-slideshow]').forEach((hero) => {
      const controller = initHero(hero);
      if (controller) controller.refresh();
    });
  };

  if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', motionChange);
  else if (typeof reducedMotion.addListener === 'function') reducedMotion.addListener(motionChange);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:block:select', (event) => {
    const slide = event.target.closest && event.target.closest('[data-hero-slide]');
    if (!slide) return;
    const hero = slide.closest('[data-hero-slideshow]');
    const controller = initHero(hero);
    if (controller) controller.goTo(Number(slide.dataset.slideIndex) || 0);
  });
})();
