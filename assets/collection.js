(() => {
  'use strict';

  const desktop = window.matchMedia('(min-width: 1000px)');
  let activeSection = null;

  function closeDrawer(section, returnFocus = false) {
    if (!section) return;
    const drawer = section.querySelector('[data-collection-drawer]');
    const trigger = section.querySelector('[data-collection-drawer-open]');
    const panel = section.querySelector('[data-collection-drawer-panel]');
    const backdrop = section.querySelector('[data-collection-drawer-backdrop]');
    window.SoleParadiseMotion?.animateDrawer?.(panel, backdrop, false);
    if (drawer) drawer.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (panel) {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }
    document.documentElement.classList.remove('collection-scroll-lock');
    if (returnFocus && trigger) trigger.focus();
    if (activeSection === section) activeSection = null;
  }

  function openDrawer(section) {
    if (desktop.matches) return;
    const drawer = section.querySelector('[data-collection-drawer]');
    const trigger = section.querySelector('[data-collection-drawer-open]');
    const panel = section.querySelector('[data-collection-drawer-panel]');
    const backdrop = section.querySelector('[data-collection-drawer-backdrop]');
    if (!drawer || !trigger || !panel) return;
    drawer.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    document.documentElement.classList.add('collection-scroll-lock');
    activeSection = section;
    window.SoleParadiseMotion?.animateDrawer?.(panel, backdrop, true);
    panel.focus();
  }

  function navigateTo(url) {
    window.location.assign(url.toString());
  }

  function submitFilters(form) {
    if (!form) return;

    const destination = new URL(form.action || window.location.href, window.location.origin);
    const params = new URLSearchParams();

    for (const [name, rawValue] of new FormData(form).entries()) {
      const value = String(rawValue).trim();
      if (!name || !value) continue;
      params.append(name, value);
    }

    params.delete('page');
    destination.search = params.toString();
    navigateTo(destination);
  }

  function submitSort(select) {
    if (!select) return;

    const destination = new URL(window.location.href);
    const value = String(select.value || '').trim();

    if (value) destination.searchParams.set('sort_by', value);
    else destination.searchParams.delete('sort_by');

    destination.searchParams.delete('page');
    navigateTo(destination);
  }

  function init(section) {
    if (!section || section.dataset.collectionInitialized === 'true') return;
    section.dataset.collectionInitialized = 'true';
    section.setAttribute('data-collection-enhanced', '');

    const open = section.querySelector('[data-collection-drawer-open]');
    const close = section.querySelector('[data-collection-drawer-close]');
    const backdrop = section.querySelector('[data-collection-drawer-backdrop]');
    const panel = section.querySelector('[data-collection-drawer-panel]');
    const filterForm = panel?.querySelector('form');
    const sort = section.querySelector('[data-collection-sort-select]');

    if (panel) panel.tabIndex = -1;
    if (open) open.addEventListener('click', () => openDrawer(section));
    if (close) close.addEventListener('click', () => closeDrawer(section, true));
    if (backdrop) backdrop.addEventListener('click', () => closeDrawer(section, true));

    if (filterForm) {
      filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const submitButton = filterForm.querySelector('[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.setAttribute('aria-busy', 'true');
          submitButton.textContent = 'Applying…';
        }
        submitFilters(filterForm);
      });
    }

    if (sort) {
      sort.addEventListener('change', () => {
        sort.disabled = true;
        sort.setAttribute('aria-busy', 'true');
        submitSort(sort);
      });
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeSection) closeDrawer(activeSection, true);
  });

  desktop.addEventListener?.('change', (event) => {
    if (event.matches && activeSection) closeDrawer(activeSection, false);
  });

  window.theme = window.theme || {};
  if (window.theme.onSectionLoad) window.theme.onSectionLoad('[data-collection]', init);
  else document.querySelectorAll('[data-collection]').forEach(init);
})();
