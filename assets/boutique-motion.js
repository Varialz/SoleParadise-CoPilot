(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const ready = () => !!window.gsap;
  const gsap = () => window.gsap;

  const animateProduct = (scope = document) => {
    if (!ready()) return;
    scope.querySelectorAll?.('[data-sp-product-section]').forEach((section) => {
      if (section.dataset.spMotionReady === 'true') return;
      section.dataset.spMotionReady = 'true';
      const gallery = section.querySelector('[data-sp-product-gallery]');
      const items = section.querySelectorAll('[data-sp-product-reveal]');
      if (gallery) gsap().from(gallery, { opacity: 0, y: 18, duration: .8, ease: 'power3.out' });
      if (items.length) gsap().from(items, { opacity: 0, y: 24, duration: .75, stagger: .08, delay: .08, ease: 'power3.out' });
    });
  };

  const animateSelects = (scope = document) => {
    if (!ready() || !window.ScrollTrigger) return;
    scope.querySelectorAll?.('.sp-selects__item').forEach((item, index) => {
      if (item.dataset.spSelectMotion === 'true') return;
      item.dataset.spSelectMotion = 'true';
      gsap().from(item, {
        opacity: 0,
        y: 36 + index * 8,
        duration: .9,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 88%', once: true }
      });
      const media = item.querySelector('.product-card__media');
      if (media) gsap().to(media, {
        yPercent: index === 1 ? -5 : -2,
        ease: 'none',
        scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: .7 }
      });
    });
  };

  const animatePanelOpen = (panel, childSelector) => {
    if (!ready() || !panel) return;
    gsap().killTweensOf(panel);
    gsap().fromTo(panel, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .26, ease: 'power2.out' });
    const children = panel.querySelectorAll(childSelector);
    if (children.length) gsap().from(children, { opacity: 0, y: 10, duration: .32, stagger: .035, ease: 'power2.out' });
  };

  const watchClassOpen = (selector, childSelector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.dataset.spOpenObserved === 'true') return;
      element.dataset.spOpenObserved = 'true';
      const observer = new MutationObserver(() => {
        if (element.classList.contains('is-open')) animatePanelOpen(element, childSelector);
      });
      observer.observe(element, { attributes: true, attributeFilter: ['class'] });
    });
  };

  const watchSellerSteps = (scope = document) => {
    if (!ready()) return;
    scope.querySelectorAll?.('[data-seller-portal]').forEach((portal) => {
      if (portal.dataset.spStepObserved === 'true') return;
      portal.dataset.spStepObserved = 'true';
      portal.querySelectorAll('[data-seller-step]').forEach((step) => {
        const observer = new MutationObserver(() => {
          if (!step.hidden && step.classList.contains('is-active')) {
            gsap().fromTo(step, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: .38, ease: 'power3.out' });
          }
        });
        observer.observe(step, { attributes: true, attributeFilter: ['hidden', 'class'] });
      });
    });
  };

  const init = (scope = document) => {
    if (!ready()) return;
    if (window.ScrollTrigger) gsap().registerPlugin(window.ScrollTrigger);
    animateProduct(scope);
    animateSelects(scope);
    watchSellerSteps(scope);
    watchClassOpen('.header-nav-desktop__panel', '.header-nav-desktop__panel-item');
    watchClassOpen('.sp-collection__filters', '.collection-filter');
  };

  const start = () => init(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
