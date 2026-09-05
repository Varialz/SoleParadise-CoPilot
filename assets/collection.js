(() => {
  'use strict';

  const desktop = window.matchMedia('(min-width: 1000px)');
  let activeSection = null;

  function getTrigger(section) {
    return section ? section.querySelector('[data-collection-drawer-open]') : null;
  }

  function getDrawer(section) {
    const trigger = getTrigger(section);
    const drawerId = trigger ? trigger.getAttribute('aria-controls') : '';
    if (drawerId) {
      const byId = document.getElementById(drawerId);
      if (byId) return byId;
    }
    return section ? section.querySelector('[data-collection-drawer]') : null;
  }

  function getSectionForDrawer(drawer) {
    if (!drawer || !drawer.id) return null;
    const triggers = document.querySelectorAll('[data-collection-drawer-open]');
    for (let i = 0; i < triggers.length; i += 1) {
      if (triggers[i].getAttribute('aria-controls') === drawer.id) {
        return triggers[i].closest('[data-collection]');
      }
    }
    return null;
  }

  function restoreDrawerToSection(section) {
    if (!section) return;

    const drawer = getDrawer(section);
    const layout = section.querySelector('.sp-collection__layout');
    const results = section.querySelector('.sp-collection__results');
    if (!drawer || !layout) return;

    if (drawer.parentElement !== layout) {
      layout.insertBefore(drawer, results || layout.firstChild);
    }
  }

  function portalDrawerToBody(section) {
    const drawer = getDrawer(section);
    if (!drawer) return;
    if (drawer.parentElement !== document.body) document.body.appendChild(drawer);
  }

  function prepareSection(section) {
    if (!section) return;
    section.setAttribute('data-collection-enhanced', '');

    const drawer = getDrawer(section);
    if (!drawer) return;

    const trigger = getTrigger(section);
    const panel = drawer.querySelector('[data-collection-drawer-panel]');
    if (panel) panel.tabIndex = -1;

    if (desktop.matches) {
      // Desktop needs the filter <aside> to remain the first column of the
      // collection grid. Removing it causes the results to auto-place into
      // the 190-220px sidebar track.
      restoreDrawerToSection(section);
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (panel) {
        panel.removeAttribute('role');
        panel.removeAttribute('aria-modal');
      }
      document.documentElement.classList.remove('collection-scroll-lock');
      document.body.classList.remove('collection-scroll-lock');
      return;
    }

    // Only mobile/tablet uses the body portal. This prevents sticky/transformed
    // storefront ancestors from clipping the full-screen drawer.
    portalDrawerToBody(section);
    drawer.setAttribute('aria-hidden', drawer.classList.contains('is-open') ? 'false' : 'true');
  }

  function closeDrawer(section, returnFocus) {
    if (!section) return;

    const drawer = getDrawer(section);
    const trigger = getTrigger(section);
    const panel = drawer ? drawer.querySelector('[data-collection-drawer-panel]') : null;

    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', desktop.matches ? 'false' : 'true');
    }
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (panel) {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }

    document.documentElement.classList.remove('collection-scroll-lock');
    document.body.classList.remove('collection-scroll-lock');

    if (desktop.matches) restoreDrawerToSection(section);
    if (returnFocus && trigger) trigger.focus();
    if (activeSection === section) activeSection = null;
  }

  function openDrawer(section) {
    if (!section || desktop.matches) return;

    prepareSection(section);

    const drawer = getDrawer(section);
    const trigger = getTrigger(section);
    const panel = drawer ? drawer.querySelector('[data-collection-drawer-panel]') : null;

    if (!drawer || !trigger || !panel) return;

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    document.documentElement.classList.add('collection-scroll-lock');
    document.body.classList.add('collection-scroll-lock');
    activeSection = section;

    window.requestAnimationFrame(function () {
      panel.focus();
    });
  }

  function navigateTo(url) {
    window.location.assign(url.toString());
  }

  function submitFilters(form) {
    if (!form) return;

    const destination = new URL(form.action || window.location.href, window.location.origin);
    const params = new URLSearchParams();
    const formData = new FormData(form);

    formData.forEach(function (rawValue, name) {
      const value = String(rawValue).trim();
      if (!name || !value) return;
      params.append(name, value);
    });

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

  function prepareAll(scope) {
    if (!scope) return;

    if (scope.matches && scope.matches('[data-collection]')) {
      prepareSection(scope);
    }

    if (scope.querySelectorAll) {
      const sections = scope.querySelectorAll('[data-collection]');
      for (let i = 0; i < sections.length; i += 1) prepareSection(sections[i]);
    }
  }

  document.addEventListener('click', function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const open = target.closest('[data-collection-drawer-open]');
    if (open) {
      event.preventDefault();
      openDrawer(open.closest('[data-collection]'));
      return;
    }

    const close = target.closest('[data-collection-drawer-close], [data-collection-drawer-backdrop]');
    if (close) {
      event.preventDefault();
      const drawer = close.closest('[data-collection-drawer]');
      closeDrawer(getSectionForDrawer(drawer), true);
    }
  });

  document.addEventListener('submit', function (event) {
    const form = event.target;
    if (!form || !form.closest || !form.closest('[data-collection-drawer-panel]')) return;

    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Applying…';
    }
    submitFilters(form);
  });

  document.addEventListener('change', function (event) {
    const select = event.target;
    if (!select || !select.matches || !select.matches('[data-collection-sort-select]')) return;

    select.disabled = true;
    select.setAttribute('aria-busy', 'true');
    submitSort(select);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && activeSection) closeDrawer(activeSection, true);
  });

  function handleBreakpointChange(event) {
    if (event.matches && activeSection) closeDrawer(activeSection, false);
    prepareAll(document);
  }

  if (desktop.addEventListener) {
    desktop.addEventListener('change', handleBreakpointChange);
  } else if (desktop.addListener) {
    desktop.addListener(handleBreakpointChange);
  }

  document.addEventListener('shopify:section:load', function (event) {
    prepareAll(event.target);
  });

  function start() {
    prepareAll(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
