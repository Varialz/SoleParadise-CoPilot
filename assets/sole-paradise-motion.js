(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const start = () => {
    if (!window.gsap) return;

    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    gsap.from('[data-sp-hero-line]', {
      yPercent: 115,
      opacity: 0,
      duration: 1,
      stagger: 0.08,
      ease: 'power3.out'
    });

    const horizon = document.querySelector('[data-sp-horizon]');
    if (horizon) {
      gsap.fromTo(horizon, { scaleX: 0 }, {
        scaleX: 1,
        duration: 1.3,
        delay: 0.15,
        ease: 'power3.inOut'
      });
    }

    if (!window.ScrollTrigger) return;

    gsap.utils.toArray('[data-sp-reveal]').forEach((element) => {
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

    gsap.utils.toArray('[data-sp-parallax]').forEach((element) => {
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
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
