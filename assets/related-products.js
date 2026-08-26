(() => {
  const init = (section) => {
    if (!section || section.dataset.relatedReady === 'true') return;
    section.dataset.relatedReady = 'true';
    const url = section.dataset.url;
    if (!url) return;

    fetch(url, { headers: { Accept: 'text/html' } })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load recommendations');
        return response.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const incoming = doc.querySelector('[data-related-products]');
        if (!incoming || !incoming.innerHTML.trim()) return;
        section.innerHTML = incoming.innerHTML;
        window.SoleParadiseMotion?.animateScope?.(section);
      })
      .catch(() => {});
  };

  const start = (scope = document) => scope.querySelectorAll?.('[data-related-products]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => start(document), { once: true });
  else start(document);
  document.addEventListener('shopify:section:load', (event) => start(event.target));
})();
