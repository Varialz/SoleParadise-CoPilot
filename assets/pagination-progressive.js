(() => {
  const initialized = new WeakSet();
  const findGrid = (pagination) => (pagination.closest('section') || pagination.parentElement)?.querySelector('.sp-product-grid--collection, .sp-search__grid');

  const initialize = (pagination) => {
    if (!pagination || initialized.has(pagination)) return;
    initialized.add(pagination);
    const grid = findGrid(pagination);
    if (!grid) return;
    let loading = false;
    let observer;

    const bind = () => {
      const next = pagination.querySelector('[data-pagination-next]');
      const sentinel = pagination.querySelector('[data-pagination-sentinel]');
      if (!next) return;
      next.addEventListener('click', (event) => { event.preventDefault(); load(next); }, { once: true });
      if ('IntersectionObserver' in window && sentinel) {
        observer?.disconnect();
        observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) load(next);
        }, { rootMargin: '500px 0px 0px', threshold: 0 });
        observer.observe(sentinel);
      }
    };

    const load = async (next) => {
      if (loading || !next?.href) return;
      loading = true;
      observer?.disconnect();
      next.setAttribute('aria-busy', 'true');
      const label = next.querySelector('[data-pagination-label]');
      if (label) label.textContent = 'Loading pieces';
      try {
        const response = await fetch(next.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        if (!response.ok) throw new Error(`Pagination request failed: ${response.status}`);
        const page = new DOMParser().parseFromString(await response.text(), 'text/html');
        const gridSelector = grid.matches('.sp-search__grid') ? '.sp-search__grid' : '.sp-product-grid--collection';
        const incomingGrid = page.querySelector(gridSelector);
        const incomingPagination = page.querySelector('[data-pagination]');
        if (!incomingGrid || !incomingPagination) throw new Error('Pagination content was incomplete.');
        const cards = [...incomingGrid.children];
        cards.forEach((card) => grid.appendChild(card));
        pagination.innerHTML = incomingPagination.innerHTML;
        pagination.dataset.currentPage = incomingPagination.dataset.currentPage || '';
        pagination.dataset.totalPages = incomingPagination.dataset.totalPages || '';
        const status = pagination.querySelector('[data-pagination-status]');
        if (status) status.textContent = `${cards.length} more pieces loaded.`;
        window.SoleParadiseMotion?.animateScope?.(grid);
        loading = false;
        bind();
      } catch (error) {
        next.removeAttribute('aria-busy');
        if (label) label.textContent = 'Load more pieces';
        const status = pagination.querySelector('[data-pagination-status]');
        if (status) status.textContent = 'More pieces could not load automatically. Use the button to try again.';
        loading = false;
        bind();
      }
    };
    bind();
  };

  const initializeAll = (scope = document) => scope.querySelectorAll?.('[data-pagination]').forEach(initialize);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initializeAll(), { once: true });
  else initializeAll();
  document.addEventListener('shopify:section:load', (event) => initializeAll(event.target));
})();
