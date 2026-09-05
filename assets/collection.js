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

  function prepareSection(section) {
    if (!section) return;
    section.setAttribute('data-collection-enhanced', '');

    const drawer = getDrawer(section);
    if (!drawer) return;

    const panel = drawer.querySelector('[data-collection-drawer-panel]');
    if (panel) panel.tabIndex = -1;

    drawer.setAttribute('aria-hidden', drawer.classList.contains('is-open') ? 'false' : 'true');

    // Portaling the drawer to <body> prevents transformed/sticky storefront
    // ancestors from clipping or covering it on mobile Safari/Chrome.
    if (drawer.parentElement !== document.body) {
      document.body.appendChild(drawer);
    }
  }

  function closeDrawer(section, returnFocus) {
    if (!section) return;

    const drawer = getDrawer(section);
    const trigger = getTrigger(section);
    const panel = drawer ? drawer.querySelector('[data-collection-drawer-panel]') : null;

    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (panel) {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }

    document.documentElement.classList.remove('collection-scroll-lock');
    document.body.classList.remove('collection-scroll-lock');

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

    // Force the first paint after portaling before focusing the panel.
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

  if (desktop.addEventListener) {
    desktop.addEventListener('change', function (event) {
      if (event.matches && activeSection) closeDrawer(activeSection, false);
    });
  } else if (desktop.addListener) {
    desktop.addListener(function (event) {
      if (event.matches && activeSection) closeDrawer(activeSection, false);
    });
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
