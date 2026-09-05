/** Sole Paradise header + navigation */
(function () {
  'use strict';

  var OPEN_CLASS = 'is-open';
  var SCROLL_LOCK_CLASS = 'header-scroll-lock';
  var activeHeader = null;
  var desktopMql = window.matchMedia('(min-width: 1000px)');
  var scrollTicking = false;

  function isConnected(el) {
    return !!el && document.body.contains(el);
  }

  function isRendered(el) {
    return el.offsetParent !== null;
  }

  function getFocusable(container) {
    var candidates = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(candidates, isRendered);
  }

  function trapFocus(container, event) {
    var focusable = getFocusable(container);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function clearStaleActiveHeader() {
    if (activeHeader && !isConnected(activeHeader)) {
      document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
      activeHeader = null;
    }
  }

  function animateMenu(panel) {
    window.SoleParadiseMotion?.animateMenu?.(panel);
  }

  function syncOverlayHeaders() {
    var scrolled = window.scrollY > 18;
    document.querySelectorAll('[data-header-overlay]').forEach(function (header) {
      header.classList.toggle('is-scrolled', scrolled);
    });
    scrollTicking = false;
  }

  function requestOverlaySync() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(syncOverlayHeaders);
  }

  function syncMenuOpenClass(header) {
    if (!header || !header.hasAttribute('data-header-overlay')) return;
    var openToggle = header.querySelector('.header-nav-desktop [data-header-submenu-toggle][aria-expanded="true"]');
    header.classList.toggle('has-menu-open', !!openToggle);
  }

  function setSubmenuState(toggle, open) {
    var panelId = toggle.getAttribute('aria-controls');
    var panel = panelId ? document.getElementById(panelId) : null;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) {
      panel.classList.toggle(OPEN_CLASS, open);
      if (open) animateMenu(panel);
    }
    var label = toggle.querySelector('[data-header-submenu-label]');
    if (label) label.textContent = open ? toggle.dataset.labelOpen : toggle.dataset.labelClosed;
    syncMenuOpenClass(toggle.closest('[data-header]'));
  }

  function closeAllSubmenus(header, exceptToggle) {
    var toggles = header.querySelectorAll('[data-header-submenu-toggle]');
    for (var i = 0; i < toggles.length; i += 1) {
      if (toggles[i] !== exceptToggle) setSubmenuState(toggles[i], false);
    }
  }

  function closeOpenDesktopSubmenu() {
    var openToggle = document.querySelector('.header-nav-desktop [data-header-submenu-toggle][aria-expanded="true"]');
    if (openToggle) setSubmenuState(openToggle, false);
    return openToggle;
  }

  function toggleSubmenu(toggle, header) {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    var isDesktopToggle = !!toggle.closest('.header-nav-desktop__item');
    if (isDesktopToggle && !expanded) closeAllSubmenus(header, toggle);
    setSubmenuState(toggle, !expanded);
  }

  function getDrawerPanel(header) {
    var drawer = header && header.querySelector('[data-header-drawer]');
    return drawer && drawer.querySelector('[data-header-drawer-panel]');
  }

  function getActiveExplorer(header) {
    var panel = getDrawerPanel(header);
    return panel && panel.querySelector('[data-header-explorer].is-active');
  }

  function setExplorerState(header, name, options) {
    options = options || {};
    var panel = getDrawerPanel(header);
    if (!panel) return false;

    var mainView = panel.querySelector('[data-header-drawer-view="main"]');
    var explorers = panel.querySelectorAll('[data-header-explorer]');
    var target = name ? panel.querySelector('[data-header-explorer="' + name + '"]') : null;

    if (name && !target) return false;

    if (name) {
      if (options.opener) panel._spExplorerOpener = options.opener;
      panel.classList.add('has-explorer-open');
      panel.dataset.activeExplorer = name;
      if (mainView) {
        mainView.classList.remove('is-active');
        mainView.classList.add('is-background');
        mainView.setAttribute('aria-hidden', 'true');
      }
      for (var i = 0; i < explorers.length; i += 1) {
        var active = explorers[i] === target;
        explorers[i].classList.toggle('is-active', active);
        explorers[i].setAttribute('aria-hidden', active ? 'false' : 'true');
      }
      target.scrollTop = 0;
      window.requestAnimationFrame(function () {
        var focusTarget = target.querySelector('[data-explorer-initial-focus], [data-header-explorer-back]');
        if (focusTarget) focusTarget.focus();
      });
      return true;
    }

    panel.classList.remove('has-explorer-open');
    panel.removeAttribute('data-active-explorer');
    if (mainView) {
      mainView.classList.remove('is-background');
      mainView.classList.add('is-active');
      mainView.setAttribute('aria-hidden', 'false');
    }
    for (var j = 0; j < explorers.length; j += 1) {
      explorers[j].classList.remove('is-active');
      explorers[j].setAttribute('aria-hidden', 'true');
    }

    var opener = panel._spExplorerOpener;
    panel._spExplorerOpener = null;
    if (options.returnFocus && isConnected(opener)) {
      window.requestAnimationFrame(function () { opener.focus(); });
    }
    return true;
  }

  function closeExplorer(header, returnFocus) {
    if (!getActiveExplorer(header)) return false;
    setExplorerState(header, '', { returnFocus: !!returnFocus });
    return true;
  }

  function initCategoryExplorer(explorer) {
    if (!explorer || explorer.dataset.categoryExplorerInitialized === 'true') return;
    explorer.dataset.categoryExplorerInitialized = 'true';

    var links = explorer.querySelectorAll('[data-category-explorer-link]');
    var icons = explorer.querySelectorAll('[data-category-preview-icon]');
    var copies = explorer.querySelectorAll('[data-category-preview-copy]');
    var index = explorer.querySelector('.header-category-explorer__preview-index');

    function activate(target, label) {
      if (!target) return;
      for (var i = 0; i < icons.length; i += 1) {
        icons[i].classList.toggle('is-active', icons[i].getAttribute('data-category-preview-icon') === target);
      }
      for (var j = 0; j < copies.length; j += 1) {
        copies[j].classList.toggle('is-active', copies[j].getAttribute('data-category-preview-copy') === target);
      }
      if (index && label) index.textContent = label;
    }

    for (var k = 0; k < links.length; k += 1) {
      (function (link) {
        var target = link.getAttribute('data-category-preview-target');
        var label = link.getAttribute('data-category-index');
        link.addEventListener('mouseenter', function () { activate(target, label); });
        link.addEventListener('focus', function () { activate(target, label); });
        link.addEventListener('pointerdown', function () { activate(target, label); }, { passive: true });
      })(links[k]);
    }
  }

  function initDesignerExplorer(explorer) {
    if (!explorer || explorer.dataset.designerExplorerInitialized === 'true') return;
    explorer.dataset.designerExplorerInitialized = 'true';

    var search = explorer.querySelector('[data-designer-search]');
    var clear = explorer.querySelector('[data-designer-search-clear]');
    var letterButtons = explorer.querySelectorAll('[data-designer-letter]');
    var entries = explorer.querySelectorAll('[data-designer-entry]');
    var groupLabels = explorer.querySelectorAll('[data-designer-group-label]');
    var status = explorer.querySelector('[data-designer-status]');
    var empty = explorer.querySelector('[data-designer-empty]');
    var activeLetter = 'all';
    var availableLetters = {};

    for (var i = 0; i < entries.length; i += 1) {
      availableLetters[entries[i].getAttribute('data-designer-letter')] = true;
    }

    for (var j = 0; j < letterButtons.length; j += 1) {
      var buttonLetter = letterButtons[j].getAttribute('data-designer-letter');
      if (buttonLetter !== 'all' && !availableLetters[buttonLetter]) letterButtons[j].disabled = true;
    }

    function applyDesignerFilters() {
      var query = search ? String(search.value || '').trim().toLowerCase() : '';
      var shown = 0;
      var visibleByLetter = {};

      for (var entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
        var entry = entries[entryIndex];
        var entryName = entry.getAttribute('data-designer-name') || '';
        var entryLetter = entry.getAttribute('data-designer-letter') || '#';
        var matchesQuery = !query || entryName.indexOf(query) !== -1;
        var matchesLetter = activeLetter === 'all' || entryLetter === activeLetter;
        var visible = matchesQuery && matchesLetter;
        entry.hidden = !visible;
        if (visible) {
          shown += 1;
          visibleByLetter[entryLetter] = true;
        }
      }

      for (var labelIndex = 0; labelIndex < groupLabels.length; labelIndex += 1) {
        var groupLetter = groupLabels[labelIndex].getAttribute('data-designer-group-label');
        groupLabels[labelIndex].hidden = !visibleByLetter[groupLetter];
      }

      for (var buttonIndex = 0; buttonIndex < letterButtons.length; buttonIndex += 1) {
        var currentButtonLetter = letterButtons[buttonIndex].getAttribute('data-designer-letter');
        var active = currentButtonLetter === activeLetter;
        letterButtons[buttonIndex].classList.toggle('is-active', active);
        letterButtons[buttonIndex].setAttribute('aria-pressed', active ? 'true' : 'false');
      }

      if (status) status.textContent = 'Showing ' + shown + (shown === 1 ? ' designer' : ' designers');
      if (empty) empty.hidden = shown !== 0;
      if (clear) clear.hidden = !query;
    }

    if (search) search.addEventListener('input', applyDesignerFilters);
    if (clear) {
      clear.addEventListener('click', function () {
        if (!search) return;
        search.value = '';
        activeLetter = 'all';
        applyDesignerFilters();
        search.focus();
      });
    }

    for (var k = 0; k < letterButtons.length; k += 1) {
      (function (button) {
        button.addEventListener('click', function () {
          if (button.disabled) return;
          activeLetter = button.getAttribute('data-designer-letter') || 'all';
          applyDesignerFilters();
        });
      })(letterButtons[k]);
    }

    applyDesignerFilters();
  }

  function initExplorers(header) {
    var openers = header.querySelectorAll('[data-header-explorer-open]');
    for (var i = 0; i < openers.length; i += 1) {
      (function (opener) {
        opener.addEventListener('click', function () {
          var name = opener.getAttribute('data-header-explorer-open');
          setExplorerState(header, name, { opener: opener });
        });
      })(openers[i]);
    }

    var backs = header.querySelectorAll('[data-header-explorer-back]');
    for (var j = 0; j < backs.length; j += 1) {
      backs[j].addEventListener('click', function () { closeExplorer(header, true); });
    }

    initCategoryExplorer(header.querySelector('[data-header-explorer="categories"]'));
    initDesignerExplorer(header.querySelector('[data-header-explorer="designers"]'));
  }

  function teardownDrawer(header, options) {
    options = options || {};
    var drawer = header.querySelector('[data-header-drawer]');
    var trigger = header.querySelector('[data-header-drawer-open]');
    var panel = drawer && drawer.querySelector('[data-header-drawer-panel]');
    closeExplorer(header, false);
    if (drawer) drawer.classList.remove(OPEN_CLASS);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (panel) {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }
    document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
    if (activeHeader === header) activeHeader = null;
    if (options.returnFocus && trigger) trigger.focus();
  }

  function openDrawer(header) {
    var drawer = header.querySelector('[data-header-drawer]');
    var trigger = header.querySelector('[data-header-drawer-open]');
    var panel = drawer && drawer.querySelector('[data-header-drawer-panel]');
    if (!drawer || !trigger) return;
    drawer.classList.add(OPEN_CLASS);
    trigger.setAttribute('aria-expanded', 'true');
    if (panel) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
    }
    document.documentElement.classList.add(SCROLL_LOCK_CLASS);
    activeHeader = header;
    var closeButton = drawer.querySelector('[data-header-drawer-close]');
    (closeButton || panel).focus();
  }

  function closeDrawer(header) {
    var drawer = header.querySelector('[data-header-drawer]');
    if (!drawer || !drawer.classList.contains(OPEN_CLASS)) return;
    teardownDrawer(header, { returnFocus: true });
  }

  function initHeader(header) {
    if (header.dataset.headerInitialized === 'true') return;
    header.dataset.headerInitialized = 'true';
    clearStaleActiveHeader();

    var openTrigger = header.querySelector('[data-header-drawer-open]');
    var closeTrigger = header.querySelector('[data-header-drawer-close]');
    var backdrop = header.querySelector('[data-header-drawer-backdrop]');

    if (openTrigger) openTrigger.addEventListener('click', function () { openDrawer(header); });
    if (closeTrigger) closeTrigger.addEventListener('click', function () { closeDrawer(header); });
    if (backdrop) backdrop.addEventListener('click', function () { closeDrawer(header); });

    var toggles = header.querySelectorAll('[data-header-submenu-toggle]');
    for (var i = 0; i < toggles.length; i += 1) {
      (function (toggle) {
        toggle.addEventListener('click', function () { toggleSubmenu(toggle, header); });
      })(toggles[i]);
    }

    initExplorers(header);
    requestOverlaySync();
  }

  var documentListenersBound = false;
  function bindDocumentListeners() {
    if (documentListenersBound) return;
    documentListenersBound = true;

    window.addEventListener('scroll', requestOverlaySync, { passive: true });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      clearStaleActiveHeader();
      var openDrawerEl = document.querySelector('[data-header-drawer].is-open');
      if (openDrawerEl) {
        var header = openDrawerEl.closest('[data-header]');
        if (header && closeExplorer(header, true)) return;
        if (header) closeDrawer(header);
        return;
      }
      var openToggle = closeOpenDesktopSubmenu();
      if (openToggle) openToggle.focus();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      clearStaleActiveHeader();
      if (!activeHeader) return;
      var drawer = activeHeader.querySelector('[data-header-drawer].is-open');
      if (drawer) trapFocus(drawer, event);
    });

    document.addEventListener('focusin', function (event) {
      clearStaleActiveHeader();
      if (activeHeader) {
        var drawer = activeHeader.querySelector('[data-header-drawer].is-open');
        if (drawer && !drawer.contains(event.target)) {
          var focusable = getFocusable(drawer);
          if (focusable.length) focusable[0].focus();
        }
      }
      var openToggle = document.querySelector('.header-nav-desktop [data-header-submenu-toggle][aria-expanded="true"]');
      if (openToggle) {
        var item = openToggle.closest('.header-nav-desktop__item');
        if (item && !item.contains(event.target)) setSubmenuState(openToggle, false);
      }
    });

    document.addEventListener('click', function (event) {
      var openToggle = document.querySelector('.header-nav-desktop [data-header-submenu-toggle][aria-expanded="true"]');
      if (!openToggle) return;
      var item = openToggle.closest('.header-nav-desktop__item');
      if (item && !item.contains(event.target)) setSubmenuState(openToggle, false);
    });

    function handleBreakpointChange(event) {
      clearStaleActiveHeader();
      if (event.matches) {
        if (activeHeader) teardownDrawer(activeHeader, { returnFocus: false });
      } else {
        closeOpenDesktopSubmenu();
      }
    }

    if (desktopMql.addEventListener) desktopMql.addEventListener('change', handleBreakpointChange);
    else if (desktopMql.addListener) desktopMql.addListener(handleBreakpointChange);

    document.addEventListener('shopify:section:unload', function (event) {
      if (activeHeader && event.target && event.target.contains(activeHeader)) {
        document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
        activeHeader = null;
      }
    });
  }

  window.theme = window.theme || {};
  if (window.theme.onSectionLoad) window.theme.onSectionLoad('[data-header]', initHeader);
  else document.querySelectorAll('[data-header]').forEach(initHeader);

  bindDocumentListeners();
  requestOverlaySync();
})();
