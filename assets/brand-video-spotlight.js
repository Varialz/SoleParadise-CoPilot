(function () {
  'use strict';

  var SELECTOR = '[data-brand-spotlight]';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setSpotlightPosition(section, progress) {
    var clampedProgress = Math.max(0, Math.min(1, progress));
    var isMobile = window.matchMedia('(max-width: 749px)').matches;
    var positionX = isMobile ? 50 : 38 + (clampedProgress * 30);
    var positionY = isMobile ? 34 + (clampedProgress * 18) : 36 + (clampedProgress * 22);
    section.style.setProperty('--sp-spotlight-x', positionX.toFixed(2) + '%');
    section.style.setProperty('--sp-spotlight-y', positionY.toFixed(2) + '%');
  }

  function setActive(section, active) {
    section.classList.toggle('is-spotlit', active);
  }

  function initWithScrollTrigger(section) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    section.brandSpotlightTrigger = window.ScrollTrigger.create({
      trigger: section,
      start: 'top 72%',
      end: 'bottom 28%',
      onToggle: function (self) {
        setActive(section, self.isActive);
      },
      onUpdate: function (self) {
        setSpotlightPosition(section, self.progress);
      }
    });
  }

  function initWithObserver(section) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        setActive(section, entry.isIntersecting && entry.intersectionRatio >= 0.18);
      });
    }, {
      rootMargin: '-12% 0px -12% 0px',
      threshold: [0, 0.18, 0.35, 0.6]
    });
    observer.observe(section);
    section.brandSpotlightObserver = observer;
  }

  function initSpotlight(section) {
    if (!section || section.dataset.brandSpotlightInitialized === 'true') return;
    section.dataset.brandSpotlightInitialized = 'true';
    setSpotlightPosition(section, 0.5);

    if (reduceMotion) return;
    if (window.gsap && window.ScrollTrigger) {
      initWithScrollTrigger(section);
    } else if ('IntersectionObserver' in window) {
      initWithObserver(section);
    }
  }

  function findSpotlights(scope) {
    var sections = [];
    if (scope && scope.matches && scope.matches(SELECTOR)) sections.push(scope);
    if (scope && scope.querySelectorAll) {
      sections = sections.concat(Array.prototype.slice.call(scope.querySelectorAll(SELECTOR)));
    }
    return sections;
  }

  function initScope(scope) {
    findSpotlights(scope || document).forEach(initSpotlight);
  }

  function destroyScope(scope) {
    findSpotlights(scope).forEach(function (section) {
      if (section.brandSpotlightTrigger) section.brandSpotlightTrigger.kill();
      if (section.brandSpotlightObserver) section.brandSpotlightObserver.disconnect();
      section.brandSpotlightTrigger = null;
      section.brandSpotlightObserver = null;
      section.classList.remove('is-spotlit');
      delete section.dataset.brandSpotlightInitialized;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initScope(document); }, { once: true });
  } else {
    initScope(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initScope(event.target);
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });

  document.addEventListener('shopify:section:unload', function (event) {
    destroyScope(event.target);
  });
})();
