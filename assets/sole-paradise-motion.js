(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const initialized = new WeakSet();
  const canAnimate = () => !!window.gsap;

  const animateScope = (scope = document) => {
    if (!canAnimate()) return;

    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    scope.querySelectorAll?.('[data-sp-hero-line]').forEach((element, index) => {
      if (initialized.has(element)) return;
      initialized.add(element);
      gsap.from(element, {
        yPercent: 115,
        opacity: 0,
        duration: 1,
        delay: index * 0.08,
        ease: 'power3.out'
      });
    });

    scope.querySelectorAll?.('[data-sp-horizon]').forEach((element) => {
      if (initialized.has(element)) return;
      initialized.add(element);
      gsap.fromTo(element, { scaleX: 0 }, {
        scaleX: 1,
        duration: 1.3,
        delay: 0.15,
        ease: 'power3.inOut'
      });
    });

    scope.querySelectorAll?.('[data-sp-product-section]').forEach((section) => {
      if (initialized.has(section)) return;
      initialized.add(section);
      const gallery = section.querySelector('[data-sp-product-gallery]');
      const info = section.querySelector('[data-sp-product-info]');
      const revealItems = section.querySelectorAll('[data-sp-product-reveal]');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (gallery) tl.from(gallery, { opacity: 0, y: 18, duration: 0.85 });
      if (info) tl.from(info, { opacity: 0, x: 22, duration: 0.8 }, '-=.55');
      if (revealItems.length) tl.from(revealItems, { opacity: 0, y: 14, duration: 0.55, stagger: 0.06 }, '-=.45');
    });

    if (!window.ScrollTrigger) return;

    scope.querySelectorAll?.('[data-sp-reveal]').forEach((element) => {
      if (initialized.has(element)) return;
      initialized.add(element);
      gsap.from(element, {
        y: 28,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 88%',
          once: true
        }
      });
    });

    scope.querySelectorAll?.('[data-sp-parallax]').forEach((element) => {
      if (initialized.has(element)) return;
      initialized.add(element);
      gsap.to(element, {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    });

    scope.querySelectorAll?.('.sp-selects__item').forEach((element, index) => {
      if (initialized.has(element)) return;
      initialized.add(element);
      const media = element.querySelector('.product-card__media');
      gsap.from(element, {
        opacity: 0,
        y: 50 + index * 10,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 90%', once: true }
      });
      if (media) {
        gsap.to(media, {
          yPercent: index % 2 === 0 ? -4 : 4,
          ease: 'none',
          scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: 0.9 }
        });
      }
    });

    window.ScrollTrigger.refresh();
  };

  window.SoleParadiseMotion = {
    animateMenu(panel) {
      if (!canAnimate() || !panel) return;
      const gsap = window.gsap;
      gsap.killTweensOf(panel);
      gsap.fromTo(panel, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out' });
      const columns = panel.querySelectorAll('.header-nav-desktop__panel-item');
      if (columns.length) gsap.from(columns, { opacity: 0, y: 12, duration: 0.35, stagger: 0.045, ease: 'power2.out' });
    },
    animateDrawer(panel, backdrop, open = true) {
      if (!canAnimate() || !panel) return;
      const gsap = window.gsap;
      gsap.killTweensOf([panel, backdrop].filter(Boolean));
      if (open) {
        gsap.fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.42, ease: 'power3.out' });
        if (backdrop) gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' });
      } else {
        gsap.to(panel, { xPercent: -100, duration: 0.3, ease: 'power2.in' });
        if (backdrop) gsap.to(backdrop, { opacity: 0, duration: 0.22, ease: 'power2.in' });
      }
    },
    animateSellerStep(step, direction = 1) {
      if (!canAnimate() || !step) return;
      window.gsap.fromTo(step, { opacity: 0, x: 24 * direction }, { opacity: 1, x: 0, duration: 0.42, ease: 'power3.out' });
    },
    animateScope
  };

  const start = () => animateScope(document);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  document.addEventListener('shopify:section:load', (event) => {
    animateScope(event.target);
  });
})();
