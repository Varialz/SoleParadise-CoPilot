(() => {
  'use strict';

  const desktop = window.matchMedia('(min-width: 1000px)');
  let activeSection = null;

  function closeDrawer(section, returnFocus = false) {
    if (!section) return;
    const drawer = section.querySelector('[data-collection-drawer]');
    const trigger = section.querySelector('[data-collection-drawer-open]');
    const panel = section.querySelector('[data-collection-drawer-panel]');
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
    if (!drawer || !trigger || !panel) return;
    drawer.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    document.documentElement.classList.add('collection-scroll-lock');
    activeSection = section;
    panel.focus();
  }

  function init(section) {
    if (!section || section.dataset.collectionInitialized === 'true') return;
    section.dataset.collectionInitialized = 'true';
    section.setAttribute('data-collection-enhanced', '');

    const open = section.querySelector('[data-collection-drawer-open]');
    const close = section.querySelector('[data-collection-drawer-close]');
    const backdrop = section.querySelector('[data-collection-drawer-backdrop]');
    const panel = section.querySelector('[data-collection-drawer-panel]');
    const sort = section.querySelector('[data-collection-sort-select]');
    const sortForm = section.querySelector('[data-collection-sort]');

    if (panel) panel.tabIndex = -1;
    if (open) open.addEventListener('click', () => openDrawer(section));
    if (close) close.addEventListener('click', () => closeDrawer(section, true));
    if (backdrop) backdrop.addEventListener('click', () => closeDrawer(section, true));
    if (sort && sortForm) sort.addEventListener('change', () => sortForm.submit());
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeSection) closeDrawer(activeSection, true);
  });

  desktop.addEventListener?.('change', (event) => {
    if (event.matches && activeSection) closeDrawer(activeSection, false);
  });

  window.theme = window.theme || {};
  if (window.theme.onSectionLoad) {
    window.theme.onSectionLoad('[data-collection]', init);
  } else {
    document.querySelectorAll('[data-collection]').forEach(init);
  }
})();
