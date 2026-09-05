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

  function updateCenteredCard(track) {
    if (!track) return -1;
    var cards = Array.prototype.slice.call(track.querySelectorAll('.brand-showcase-card'));
    if (!cards.length) return -1;
    var trackCenter = track.scrollLeft + (track.clientWidth / 2);
    var centeredIndex = 0;
    var closestDistance = Infinity;
    cards.forEach(function (card, index) {
      var cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      var distance = Math.abs(cardCenter - trackCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        centeredIndex = index;
      }
    });
    cards.forEach(function (card, index) {
      card.classList.toggle('is-centered', index === centeredIndex);
    });
    return centeredIndex;
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
        var cards = Array.prototype.slice.call(track.querySelectorAll('.brand-showcase-card'));
        if (!cards.length) return;
        var currentIndex = updateCenteredCard(track);
        var targetIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
        var target = cards[targetIndex];
        var targetLeft = target.offsetLeft + (target.offsetWidth / 2) - (track.clientWidth / 2);
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollTo({ left: targetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      if (previous) previous.addEventListener('click', function () { scroll(-1); });
      if (next) next.addEventListener('click', function () { scroll(1); });
      if (track) track.addEventListener('scroll', function () {
        window.requestAnimationFrame(function () {
          updateArrows(panel);
          updateCenteredCard(track);
        });
      }, { passive: true });
      updateCenteredCard(track);
    });
    window.requestAnimationFrame(function () {
      section.querySelectorAll('[data-brand-showcase-panel]').forEach(updateArrows);
    });
  }

  window.theme = window.theme || {};
  if (window.theme.onSectionLoad) window.theme.onSectionLoad('[data-brand-showcase]', initShowcase);
  else document.querySelectorAll('[data-brand-showcase]').forEach(initShowcase);
})();
