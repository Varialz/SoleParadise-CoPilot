(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const initialized = new WeakSet();
  const canAnimate = () => !!window.gsap;
  const hasScrollTrigger = () => !!window.ScrollTrigger;

  const mark = (element) => {
    if (!element || initialized.has(element)) return false;
    initialized.add(element);
    return true;
  };

  const animateHero = (scope, gsap) => {
    scope.querySelectorAll?.('[data-sp-hero]').forEach((hero) => {
      if (!mark(hero)) return;

      const media = hero.querySelector('[data-sp-hero-media]');
      const image = media?.querySelector('img');
      const lines = hero.querySelectorAll('[data-sp-hero-line]');
      const horizon = hero.querySelector('[data-sp-horizon]');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (media) {
        tl.fromTo(media,
          { clipPath: 'inset(0 0 18% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power3.out' }
        );
      }
      if (image) {
        tl.fromTo(image, { scale: 1.025 }, { scale: 1, duration: 0.85, ease: 'power2.out' }, 0);
      }
      if (lines.length) {
        tl.from(lines, { opacity: 0, y: 12, duration: 0.5, stagger: 0.045 }, 0.16);
      }
      if (horizon) {
        tl.fromTo(horizon, { scaleX: 0 }, { scaleX: 1, duration: 0.65, ease: 'power2.out' }, 0.28);
      }
    });
  };

  const animateProductGrids = (scope, gsap) => {
    scope.querySelectorAll?.('[data-sp-product-grid]').forEach((grid) => {
      if (!mark(grid)) return;
      const cards = [...grid.querySelectorAll('.product-card')];
      if (!cards.length) return;
      cards.forEach((card) => initialized.add(card));

      const vars = {
        opacity: 0,
        y: 10,
        duration: 0.46,
        stagger: 0.025,
        ease: 'power2.out'
      };

      if (hasScrollTrigger()) {
        vars.scrollTrigger = { trigger: grid, start: 'top 86%', once: true };
      }
      gsap.from(cards, vars);
    });
  };

  const animateFeed = (scope, gsap) => {
    scope.querySelectorAll?.('[data-sp-feed-grid]').forEach((grid) => {
      if (!mark(grid)) return;
      const tiles = [...grid.querySelectorAll('[data-sp-feed-tile]')];
      if (!tiles.length) return;
      tiles.forEach((tile) => initialized.add(tile));

      const vars = {
        opacity: 0,
        y: 12,
        duration: 0.5,
        stagger: 0.03,
        ease: 'power2.out'
      };
      if (hasScrollTrigger()) vars.scrollTrigger = { trigger: grid, start: 'top 88%', once: true };
      gsap.from(tiles, vars);

    });
  };

  const animateEditorialMedia = (scope, gsap) => {
    scope.querySelectorAll?.('[data-sp-editorial-media]').forEach((media) => {
      if (!mark(media)) return;
      const image = media.querySelector('img');
      const vars = {
        clipPath: 'inset(0 0 14% 0)',
        duration: 0.62,
        ease: 'power3.out'
      };
      if (hasScrollTrigger()) vars.scrollTrigger = { trigger: media, start: 'top 86%', once: true };
      gsap.from(media, vars);

      if (image) {
        const imageVars = { scale: 1.02, duration: 0.72, ease: 'power2.out' };
        if (hasScrollTrigger()) imageVars.scrollTrigger = { trigger: media, start: 'top 86%', once: true };
        gsap.from(image, imageVars);

      }
    });
  };

  const animateProductPage = (scope, gsap) => {
    scope.querySelectorAll?.('[data-sp-product-section]').forEach((section) => {
      if (!mark(section)) return;
      const gallery = section.querySelector('[data-sp-product-gallery]');
      const info = section.querySelector('[data-sp-product-info]');
      const revealItems = section.querySelectorAll('[data-sp-product-reveal]');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (gallery) tl.from(gallery, { opacity: 0, y: 8, duration: 0.5 });
      if (info) tl.from(info, { opacity: 0, y: 8, duration: 0.48 }, '-=.3');
      if (revealItems.length) {
        revealItems.forEach((item) => initialized.add(item));
        tl.from(revealItems, { opacity: 0, y: 7, duration: 0.38, stagger: 0.025 }, '-=.25');
      }
    });
  };

  const animateGenericReveals = (scope, gsap) => {
    scope.querySelectorAll?.('[data-sp-reveal]').forEach((element) => {
      if (!mark(element)) return;
      const vars = { y: 9, opacity: 0, duration: 0.44, ease: 'power2.out' };
      if (hasScrollTrigger()) vars.scrollTrigger = { trigger: element, start: 'top 90%', once: true };
      gsap.from(element, vars);
    });
  };

  const animateSelects = (scope, gsap) => {
    if (!hasScrollTrigger()) return;
    scope.querySelectorAll?.('.sp-selects__item').forEach((element, index) => {
      if (!mark(element)) return;
      gsap.from(element, {
        opacity: 0,
        y: 10 + index * 2,
        duration: 0.48,
        ease: 'power2.out',
        scrollTrigger: { trigger: element, start: 'top 90%', once: true }
      });
    });
  };

  const animateScope = (scope = document) => {
    if (!canAnimate()) return;
    const gsap = window.gsap;
    if (hasScrollTrigger()) gsap.registerPlugin(window.ScrollTrigger);

    animateHero(scope, gsap);
    animateProductPage(scope, gsap);
    animateProductGrids(scope, gsap);
    animateFeed(scope, gsap);
    animateEditorialMedia(scope, gsap);
    animateSelects(scope, gsap);
    animateGenericReveals(scope, gsap);

    if (hasScrollTrigger()) window.ScrollTrigger.refresh();
  };

  window.SoleParadiseMotion = {
    animateMenu(panel) {
      if (!canAnimate() || !panel) return;
      const gsap = window.gsap;
      gsap.killTweensOf(panel);
      gsap.fromTo(panel, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' });
      const columns = panel.querySelectorAll('.header-nav-desktop__panel-item');
      if (columns.length) gsap.from(columns, { opacity: 0, y: 10, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
    },
    animateDrawer(panel, backdrop, open = true) {
      if (!canAnimate() || !panel) return;
      const gsap = window.gsap;
      gsap.killTweensOf([panel, backdrop].filter(Boolean));
      if (open) {
        gsap.fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.38, ease: 'power3.out' });
        if (backdrop) gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      } else {
        gsap.to(panel, { xPercent: -100, duration: 0.28, ease: 'power2.in' });
        if (backdrop) gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in' });
      }
    },
    animateSellerStep(step, direction = 1) {
      if (!canAnimate() || !step) return;
      window.gsap.fromTo(step, { opacity: 0, x: 20 * direction }, { opacity: 1, x: 0, duration: 0.38, ease: 'power3.out' });
    },
    animateScope
  };

  const start = () => animateScope(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  document.addEventListener('shopify:section:load', (event) => animateScope(event.target));
})();
