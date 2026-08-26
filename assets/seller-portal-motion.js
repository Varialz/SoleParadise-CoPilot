(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const init = (portal) => {
    if (!portal || portal.dataset.sellerMotionReady === 'true') return;
    portal.dataset.sellerMotionReady = 'true';

    const steps = [...portal.querySelectorAll('[data-seller-step]')];
    if (!steps.length) return;

    let lastIndex = steps.findIndex((step) => !step.hidden);
    if (lastIndex < 0) lastIndex = 0;

    steps.forEach((step, index) => {
      const observer = new MutationObserver(() => {
        if (step.hidden) return;
        const direction = index >= lastIndex ? 1 : -1;
        window.SoleParadiseMotion?.animateSellerStep?.(step, direction);
        lastIndex = index;
      });
      observer.observe(step, { attributes: true, attributeFilter: ['hidden'] });
    });
  };

  const start = () => document.querySelectorAll('[data-seller-portal]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll?.('[data-seller-portal]').forEach(init);
  });
})();
