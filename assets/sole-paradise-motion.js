(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const initialized = new WeakSet();
  const canAnimate = () => !!window.gsap;
  const hasScrollTrigger = () => !!window.ScrollTrigger;
  const isDesktop = () => window.matchMedia('(min-width: 750px)').matches;

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
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 1.15, ease: 'power4.inOut' }
        );
      }
      if (image) {
        tl.fromTo(image, { scale: 1.075 }, { scale: 1, duration: 1.35, ease: 'power3.out' }, 0);
      }
      if (lines.length) {
        tl.from(lines, { opacity: 0, y: 28, duration: 0.72, stagger: 0.075 }, 0.22);
      }
      if (horizon) {
        tl.fromTo(horizon, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power3.inOut' }, 0.38);
      }

      if (image && hasScrollTrigger() && isDesktop()) {
        gsap.to(image, {
          scale: 1.045,
          yPercent: 2.5,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8
          }
        });
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
        y: 22,
        duration: 0.72,
        stagger: 0.055,
        ease: 'power3.out'
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
        y: 30,
        duration: 0.82,
        stagger: 0.065,
        ease: 'power3.out'
      };
      if (hasScrollTrigger()) vars.scrollTrigger = { trigger: grid, start: 'top 88%', once: true };
      gsap.from(tiles, vars);

      if (hasScrollTrigger() && isDesktop()) {
        tiles.forEach((tile, index) => {
          const image = tile.querySelector('.sp-feed-tile__image');
          if (!image) return;
          gsap.fromTo(image,
            { yPercent: index % 2 === 0 ? -2.5 : 1.5, scale: 1.035 },
            {
              yPercent: index % 2 === 0 ? 2.5 : -1.5,
              scale: 1.035,
              ease: 'none',
              scrollTrigger: {
                trigger: tile,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.9
              }
            }
          );
        });
      }
    });
  };

  const animateEditorialMedia = (scope, gsap) => {
    scope.querySelectorAll?.('[data-sp-editorial-media]').forEach((media) => {
      if (!mark(media)) return;
      const image = media.querySelector('img');
      const vars = {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1.05,
        ease: 'power4.inOut'
      };
      if (hasScrollTrigger()) vars.scrollTrigger = { trigger: media, start: 'top 86%', once: true };
      gsap.from(media, vars);

      if (image) {
        const imageVars = { scale: 1.07, duration: 1.3, ease: 'power3.out' };
        if (hasScrollTrigger()) imageVars.scrollTrigger = { trigger: media, start: 'top 86%', once: true };
        gsap.from(image, imageVars);

        if (hasScrollTrigger() && isDesktop()) {
          gsap.to(image, {
            yPercent: -4,
            ease: 'none',
            scrollTrigger: {
              trigger: media,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.85
            }
          });
        }
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
      if (gallery) tl.from(gallery, { opacity: 0, y: 16, duration: 0.78 });
      if (info) tl.from(info, { opacity: 0, x: 18, duration: 0.72 }, '-=.5');
      if (revealItems.length) {
        revealItems.forEach((item) => initialized.add(item));
        tl.from(revealItems, { opacity: 0, y: 12, duration: 0.48, stagger: 0.045 }, '-=.38');
      }
    });
  };

  const animateGenericReveals = (scope, gsap) => {
    scope.querySelectorAll?.('[data-sp-reveal]').forEach((element) => {
      if (!mark(element)) return;
      const vars = { y: 20, opacity: 0, duration: 0.72, ease: 'power3.out' };
      if (hasScrollTrigger()) vars.scrollTrigger = { trigger: element, start: 'top 90%', once: true };
      gsap.from(element, vars);
    });
  };

  const animateLegacyParallax = (scope, gsap) => {
    if (!hasScrollTrigger() || !isDesktop()) return;
    scope.querySelectorAll?.('[data-sp-parallax]').forEach((element) => {
      if (!mark(element)) return;
      gsap.to(element, {
        yPercent: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.85
        }
      });
    });
  };

  const animateSelects = (scope, gsap) => {
    if (!hasScrollTrigger()) return;
    scope.querySelectorAll?.('.sp-selects__item').forEach((element, index) => {
      if (!mark(element)) return;
      gsap.from(element, {
        opacity: 0,
        y: 30 + index * 6,
        duration: 0.8,
        ease: 'power3.out',
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
    animateLegacyParallax(scope, gsap);

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
