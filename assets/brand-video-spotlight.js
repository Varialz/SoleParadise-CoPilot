(function () {
  'use strict';

  var SELECTOR = '[data-brand-spotlight]';
  var PRODUCT_STAGE_SELECTOR = '[data-brand-product-stage]';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function formatIndex(value) {
    return String(value).padStart(2, '0');
  }

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

  function initProductStage(stage) {
    if (!stage || stage.dataset.brandProductStageInitialized === 'true') return;

    var viewport = stage.querySelector('[data-brand-stage-viewport]');
    var cards = Array.prototype.slice.call(stage.querySelectorAll('[data-brand-stage-card]'));
    var previousButton = stage.querySelector('[data-brand-stage-previous]');
    var nextButton = stage.querySelector('[data-brand-stage-next]');
    var counter = stage.querySelector('[data-brand-stage-counter]');

    if (!viewport || !cards.length) return;

    stage.dataset.brandProductStageInitialized = 'true';

    var activeIndex = 0;
    var animationFrame = null;
    var resizeObserver = null;
    var dragging = false;
    var dragMoved = false;
    var dragStartX = 0;
    var dragStartScroll = 0;
    var dragResetTimer = null;

    function updateStage() {
      animationFrame = null;
      var viewportCenter = viewport.scrollLeft + (viewport.clientWidth / 2);
      var distanceUnit = Math.max(viewport.clientWidth * 0.62, 1);
      var nearestIndex = 0;
      var nearestDistance = Infinity;

      cards.forEach(function (card, index) {
        var cardCenter = card.offsetLeft + (card.offsetWidth / 2);
        var normalizedDistance = (cardCenter - viewportCenter) / distanceUnit;
        var absoluteDistance = Math.min(Math.abs(normalizedDistance), 1.45);

        if (absoluteDistance < nearestDistance) {
          nearestDistance = absoluteDistance;
          nearestIndex = index;
        }

        var rotation = reduceMotion ? 0 : clamp(normalizedDistance * -29, -34, 34);
        var translateY = reduceMotion ? 0 : Math.min(absoluteDistance * 14, 16);
        var translateZ = reduceMotion ? 0 : 26 - (absoluteDistance * 104);
        var scale = reduceMotion ? 1 : 1 - Math.min(absoluteDistance * 0.13, 0.17);
        var opacity = 1 - Math.min(absoluteDistance * 0.48, 0.55);

        card.style.setProperty('--sp-stage-rotate', rotation.toFixed(2) + 'deg');
        card.style.setProperty('--sp-stage-y', translateY.toFixed(2) + 'px');
        card.style.setProperty('--sp-stage-z', translateZ.toFixed(2) + 'px');
        card.style.setProperty('--sp-stage-scale', scale.toFixed(3));
        card.style.setProperty('--sp-stage-opacity', opacity.toFixed(3));
        card.style.zIndex = String(50 - Math.round(absoluteDistance * 10));
      });

      activeIndex = nearestIndex;
      cards.forEach(function (card, index) {
        card.classList.toggle('is-active', index === activeIndex);
      });

      if (counter) counter.textContent = formatIndex(activeIndex + 1) + ' / ' + formatIndex(cards.length);
      if (previousButton) previousButton.disabled = activeIndex === 0;
      if (nextButton) nextButton.disabled = activeIndex === cards.length - 1;
      stage.setAttribute('data-active-index', String(activeIndex));
    }

    function queueUpdate() {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(updateStage);
    }

    function scrollToIndex(index, smooth) {
      var nextIndex = clamp(index, 0, cards.length - 1);
      var card = cards[nextIndex];
      var targetLeft = card.offsetLeft - ((viewport.clientWidth - card.offsetWidth) / 2);
      viewport.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: smooth && !reduceMotion ? 'smooth' : 'auto'
      });
    }

    function showPrevious() {
      scrollToIndex(activeIndex - 1, true);
    }

    function showNext() {
      scrollToIndex(activeIndex + 1, true);
    }

    function handleKeydown(event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      } else if (event.key === 'Home') {
        event.preventDefault();
        scrollToIndex(0, true);
      } else if (event.key === 'End') {
        event.preventDefault();
        scrollToIndex(cards.length - 1, true);
      }
    }

    function handlePointerDown(event) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragging = true;
      dragMoved = false;
      dragStartX = event.clientX;
      dragStartScroll = viewport.scrollLeft;
      stage.classList.add('is-dragging');
      if (viewport.setPointerCapture) viewport.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!dragging) return;
      var distance = event.clientX - dragStartX;
      if (Math.abs(distance) > 5) dragMoved = true;
      if (!dragMoved) return;
      viewport.scrollLeft = dragStartScroll - distance;
      queueUpdate();
    }

    function finishPointerDrag() {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      updateStage();

      if (dragMoved) {
        window.setTimeout(function () { scrollToIndex(activeIndex, true); }, 0);
        window.clearTimeout(dragResetTimer);
        dragResetTimer = window.setTimeout(function () { dragMoved = false; }, 100);
      }
    }

    function blockDraggedClick(event) {
      if (!dragMoved) return;
      event.preventDefault();
      event.stopPropagation();
    }

    cards.forEach(function (card, index) {
      card.addEventListener('focus', function () { scrollToIndex(index, true); });
    });

    viewport.addEventListener('scroll', queueUpdate, { passive: true });
    viewport.addEventListener('keydown', handleKeydown);
    viewport.addEventListener('pointerdown', handlePointerDown);
    viewport.addEventListener('pointermove', handlePointerMove);
    viewport.addEventListener('pointerup', finishPointerDrag);
    viewport.addEventListener('pointercancel', finishPointerDrag);
    viewport.addEventListener('click', blockDraggedClick, true);
    if (previousButton) previousButton.addEventListener('click', showPrevious);
    if (nextButton) nextButton.addEventListener('click', showNext);

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(queueUpdate);
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener('resize', queueUpdate);
    }

    stage.brandProductStageDestroy = function () {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(dragResetTimer);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', queueUpdate);
      viewport.removeEventListener('scroll', queueUpdate);
      viewport.removeEventListener('keydown', handleKeydown);
      viewport.removeEventListener('pointerdown', handlePointerDown);
      viewport.removeEventListener('pointermove', handlePointerMove);
      viewport.removeEventListener('pointerup', finishPointerDrag);
      viewport.removeEventListener('pointercancel', finishPointerDrag);
      viewport.removeEventListener('click', blockDraggedClick, true);
      if (previousButton) previousButton.removeEventListener('click', showPrevious);
      if (nextButton) nextButton.removeEventListener('click', showNext);
    };

    window.requestAnimationFrame(function () {
      scrollToIndex(0, false);
      updateStage();
    });
  }

  function findSpotlights(scope) {
    var sections = [];
    if (scope && scope.matches && scope.matches(SELECTOR)) sections.push(scope);
    if (scope && scope.querySelectorAll) {
      sections = sections.concat(Array.prototype.slice.call(scope.querySelectorAll(SELECTOR)));
    }
    return sections;
  }

  function findProductStages(scope) {
    var stages = [];
    if (scope && scope.matches && scope.matches(PRODUCT_STAGE_SELECTOR)) stages.push(scope);
    if (scope && scope.querySelectorAll) {
      stages = stages.concat(Array.prototype.slice.call(scope.querySelectorAll(PRODUCT_STAGE_SELECTOR)));
    }
    return stages;
  }

  function initScope(scope) {
    var root = scope || document;
    findSpotlights(root).forEach(initSpotlight);
    findProductStages(root).forEach(initProductStage);
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

    findProductStages(scope).forEach(function (stage) {
      if (stage.brandProductStageDestroy) stage.brandProductStageDestroy();
      stage.brandProductStageDestroy = null;
      delete stage.dataset.brandProductStageInitialized;
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
