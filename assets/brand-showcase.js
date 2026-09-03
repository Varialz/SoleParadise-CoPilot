(function () {
  'use strict';

  function updateArrows(panel) {
    if (!panel) return;
    var track = panel.querySelector('[data-brand-showcase-track]');
    var previous = panel.querySelector('[data-brand-showcase-previous]');
    var next = panel.querySelector('[data-brand-showcase-next]');
    if (!track) return;
    var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    if (previous) previous.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = maxScroll <= 2 || track.scrollLeft >= maxScroll - 2;
  }

  function activateTab(section, activeTab, focusTab) {
    var tabs = section.querySelectorAll('[data-brand-showcase-tab]');
    var panels = section.querySelectorAll('[data-brand-showcase-panel]');
    var activeId = activeTab.getAttribute('aria-controls');
    tabs.forEach(function (tab) {
      var selected = tab === activeTab;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.setAttribute('tabindex', selected ? '0' : '-1');
    });
    panels.forEach(function (panel) { panel.hidden = panel.id !== activeId; });
    var activePanel = document.getElementById(activeId);
    window.requestAnimationFrame(function () { updateArrows(activePanel); });
    if (focusTab) activeTab.focus();
  }

  function initShowcase(section) {
    if (section.dataset.brandShowcaseInitialized === 'true') return;
    section.dataset.brandShowcaseInitialized = 'true';
    var tabs = Array.prototype.slice.call(section.querySelectorAll('[data-brand-showcase-tab]'));
    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { activateTab(section, tab, false); });
      tab.addEventListener('keydown', function (event) {
        var targetIndex = null;
        if (event.key === 'ArrowRight') targetIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') targetIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') targetIndex = 0;
        if (event.key === 'End') targetIndex = tabs.length - 1;
        if (targetIndex === null) return;
        event.preventDefault();
        activateTab(section, tabs[targetIndex], true);
      });
    });

    section.querySelectorAll('[data-brand-showcase-panel]').forEach(function (panel) {
      var track = panel.querySelector('[data-brand-showcase-track]');
      var previous = panel.querySelector('[data-brand-showcase-previous]');
      var next = panel.querySelector('[data-brand-showcase-next]');
      function scroll(direction) {
        if (!track) return;
        track.scrollBy({ left: Math.max(260, track.clientWidth * 0.86) * direction, behavior: 'smooth' });
      }
      if (previous) previous.addEventListener('click', function () { scroll(-1); });
      if (next) next.addEventListener('click', function () { scroll(1); });
      if (track) track.addEventListener('scroll', function () {
        window.requestAnimationFrame(function () { updateArrows(panel); });
      }, { passive: true });
    });
    window.requestAnimationFrame(function () {
      section.querySelectorAll('[data-brand-showcase-panel]').forEach(updateArrows);
    });
  }

  window.theme = window.theme || {};
  if (window.theme.onSectionLoad) window.theme.onSectionLoad('[data-brand-showcase]', initShowcase);
  else document.querySelectorAll('[data-brand-showcase]').forEach(initShowcase);
})();
