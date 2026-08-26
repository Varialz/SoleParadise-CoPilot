(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const initialized = new WeakSet();

  const animateScope = (scope = document) => {
    if (!window.gsap) return;

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

    window.ScrollTrigger.refresh();
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
