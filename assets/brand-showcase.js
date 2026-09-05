(function () {
  'use strict';

  var tutorialClaimed = false;
  var tutorialStorageKey = 'spBrowseTutorialSeenV1';
  var progressiveBatchSize = 4;
  var progressiveMaxItems = 20;

  function tutorialSeen() {
    try { return window.sessionStorage.getItem(tutorialStorageKey) === 'true'; }
    catch (error) { return tutorialClaimed; }
  }

  function markTutorialSeen() {
    tutorialClaimed = true;
    try { window.sessionStorage.setItem(tutorialStorageKey, 'true'); }
    catch (error) { /* Storage may be unavailable in privacy mode. */ }
  }

  function setupBrowseTutorial(section) {
    if (section.classList.contains('brand-showcase--progressive')) return;
    var mobile = window.matchMedia('(max-width: 749px)').matches;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!mobile || reduceMotion || tutorialClaimed || tutorialSeen()) return;

    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      if (tutorialClaimed || tutorialSeen()) return;
      markTutorialSeen();
      section.classList.add('is-browse-tutorial');

      var stop = function () {
        section.classList.remove('is-browse-tutorial');
      };
      section.addEventListener('pointerdown', stop, { once: true, passive: true });
      section.addEventListener('keydown', stop, { once: true });
      window.setTimeout(stop, 3400);
    }, { threshold: 0.08, rootMargin: '0px 0px -12% 0px' });

    observer.observe(section);
  }

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

  function isNewArrivalsSection(section) {
    var title = section.querySelector('.brand-showcase__title');
    if (!title) return false;
    return title.textContent.trim().toLowerCase() === 'new arrivals';
  }

  function storefrontRoot() {
    var root = window.Shopify && window.Shopify.routes && window.Shopify.routes.root;
    if (!root) root = '/';
    if (root.charAt(root.length - 1) !== '/') root += '/';
    return root;
  }

  function catalogueUrl() {
    return storefrontRoot() + 'collections/all?sort_by=created-descending';
  }

  function progressiveEndpoint() {
    return storefrontRoot() + 'collections/all/products.json?limit=50&sort_by=created-descending';
  }

  function normalizeHandleFromHref(href) {
    if (!href) return '';
    var match = href.match(/\/products\/([^?#/]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function productIsAvailable(product) {
    var variants = product && Array.isArray(product.variants) ? product.variants : [];
    if (!variants.length) return true;
    return variants.some(function (variant) { return variant.available !== false; });
  }

  function productLooksLikeAccessory(product) {
    var tags = Array.isArray(product.tags) ? product.tags.join(' ') : (product.tags || '');
    var signal = ' ' + [product.product_type || '', product.title || '', tags].join(' ').toLowerCase().replace(/[-_\/]/g, ' ') + ' ';
    return [
      ' accessory ', ' accessories ', ' bag ', ' wallet ', ' belt ', ' jewelry ', ' jewellery ',
      ' necklace ', ' bracelet ', ' ring ', ' pendant ', ' chain ', ' sunglasses ', ' glasses ',
      ' eyewear ', ' keychain ', ' hat ', ' cap ', ' beanie '
    ].some(function (token) { return signal.indexOf(token) !== -1; });
  }

  function looksLikeSizeValue(value) {
    var cleaned = String(value || '').trim().toLowerCase();
    if (!cleaned || cleaned === 'default title') return false;
    if (/^(one size|one-size|os|o\/s)$/.test(cleaned)) return true;
    if (/^(xxxs|xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl|5xl)$/.test(cleaned)) return true;
    if (/^(us|uk|eu)?\s*\d{1,3}(?:\.5)?(?:\s*[-–]\s*\d{1,3}(?:\.5)?)?$/.test(cleaned)) return true;
    if (/^\d{2,3}(?:\s*[-–]\s*\d{2,3})?$/.test(cleaned)) return true;
    return false;
  }

  function getProductSizes(product) {
    var options = Array.isArray(product.options) ? product.options : [];
    var variants = Array.isArray(product.variants) ? product.variants : [];
    var sizePosition = 0;

    options.some(function (option, index) {
      var name = typeof option === 'string' ? option : (option && option.name) || '';
      if (String(name).toLowerCase().indexOf('size') !== -1) {
        sizePosition = option && option.position ? Number(option.position) : index + 1;
        return true;
      }
      return false;
    });

    var seen = {};
    var sizes = [];
    variants.forEach(function (variant) {
      if (variant.available === false) return;
      var value = '';
      if (sizePosition === 1) value = variant.option1;
      if (sizePosition === 2) value = variant.option2;
      if (sizePosition === 3) value = variant.option3;
      value = String(value || '').trim();
      if (!value || value === 'Default Title' || seen[value]) return;
      seen[value] = true;
      sizes.push(value);
    });

    if (!sizes.length && !sizePosition && variants.length) {
      var inferred = variants.filter(function (variant) { return variant.available !== false; }).map(function (variant) {
        return String(variant.title || '').trim();
      }).filter(function (value) { return value && value !== 'Default Title'; });
      if (inferred.length && inferred.every(looksLikeSizeValue)) {
        inferred.forEach(function (value) {
          if (!seen[value]) {
            seen[value] = true;
            sizes.push(value);
          }
        });
      }
    }

    if (!sizes.length && productLooksLikeAccessory(product) && productIsAvailable(product)) sizes.push('OS');
    return sizes;
  }

  function imageSource(product) {
    var image = '';
    if (product && product.featured_image) {
      image = typeof product.featured_image === 'string' ? product.featured_image : product.featured_image.src;
    }
    if (!image && product && Array.isArray(product.images) && product.images.length) {
      var first = product.images[0];
      image = typeof first === 'string' ? first : first.src;
    }
    if (!image) return '';
    return image + (image.indexOf('?') === -1 ? '?' : '&') + 'width=720';
  }

  function productPrice(product) {
    var variants = product && Array.isArray(product.variants) ? product.variants : [];
    var prices = variants.map(function (variant) { return parseFloat(variant.price); }).filter(function (price) { return Number.isFinite(price); });
    var price = prices.length ? Math.min.apply(Math, prices) : parseFloat(product.price);
    if (!Number.isFinite(price)) return '';
    var varies = prices.length > 1 && Math.max.apply(Math, prices) !== Math.min.apply(Math, prices);
    var formatted;
    try {
      formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    } catch (error) {
      formatted = '$' + price.toFixed(2);
    }
    return (varies ? 'From ' : '') + formatted;
  }

  function createProgressiveCard(product) {
    if (!product || !product.handle) return null;

    var article = document.createElement('article');
    article.className = 'brand-showcase-card is-progressive-added';
    article.setAttribute('data-product-handle', product.handle);

    var link = document.createElement('a');
    link.className = 'brand-showcase-card__link';
    link.href = storefrontRoot() + 'products/' + encodeURIComponent(product.handle);

    var media = document.createElement('div');
    media.className = 'brand-showcase-card__media';
    var source = imageSource(product);
    if (source) {
      var img = document.createElement('img');
      img.src = source;
      img.alt = product.title || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);
    }
    link.appendChild(media);

    if (product.vendor) {
      var vendor = document.createElement('p');
      vendor.className = 'brand-showcase-card__vendor';
      vendor.textContent = product.vendor;
      link.appendChild(vendor);
    }

    var title = document.createElement('h3');
    title.className = 'brand-showcase-card__title';
    title.textContent = product.title || '';
    link.appendChild(title);

    var sizes = getProductSizes(product);
    if (sizes.length) {
      var size = document.createElement('p');
      size.className = 'brand-showcase-card__size';
      size.setAttribute('aria-label', 'Available size');
      size.textContent = (sizes.length === 1 ? 'Size ' : 'Sizes ') + sizes.join(' · ');
      link.appendChild(size);
    }

    var formattedPrice = productPrice(product);
    if (formattedPrice) {
      var price = document.createElement('p');
      price.className = 'brand-showcase-card__price';
      price.textContent = formattedPrice;
      link.appendChild(price);
    }

    article.appendChild(link);
    return article;
  }

  function setupProgressiveArrivals(section) {
    if (!isNewArrivalsSection(section)) return;

    var tabs = Array.prototype.slice.call(section.querySelectorAll('[data-brand-showcase-tab]'));
    var allTab = tabs.find(function (tab) { return tab.textContent.trim().toLowerCase() === 'all'; }) || tabs[0];
    if (!allTab) return;

    var panelId = allTab.getAttribute('aria-controls');
    var panel = panelId ? section.querySelector('#' + panelId) : null;
    var track = panel ? panel.querySelector('[data-brand-showcase-track]') : null;
    if (!panel || !track) return;

    section.classList.add('brand-showcase--progressive');
    panel.classList.add('is-progressive-panel');
    track.querySelectorAll('.brand-showcase-card').forEach(function (card) { card.classList.remove('is-centered'); });

    var header = section.querySelector('.brand-showcase__header');
    if (header && !header.querySelector('.brand-showcase__catalogue-link')) {
      var headerLink = document.createElement('a');
      headerLink.className = 'brand-showcase__catalogue-link';
      headerLink.href = catalogueUrl();
      headerLink.textContent = 'Shop full catalogue';
      header.appendChild(headerLink);
    }

    var cta = panel.querySelector('.brand-showcase__cta');
    if (cta) {
      cta.href = catalogueUrl();
      cta.textContent = 'Shop full catalogue';
    }

    if (!window.fetch || !window.IntersectionObserver) return;

    var sentinel = document.createElement('div');
    sentinel.className = 'brand-showcase__progressive-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    track.insertAdjacentElement('afterend', sentinel);

    var knownHandles = {};
    track.querySelectorAll('.brand-showcase-card').forEach(function (card) {
      var handle = card.getAttribute('data-product-handle');
      if (!handle) {
        var link = card.querySelector('a[href*="/products/"]');
        handle = normalizeHandleFromHref(link && link.getAttribute('href'));
      }
      if (handle) knownHandles[handle] = true;
    });

    var state = {
      pool: null,
      cursor: 0,
      loading: false,
      done: track.querySelectorAll('.brand-showcase-card').length >= progressiveMaxItems
    };

    function finish() {
      state.done = true;
      sentinel.hidden = true;
      observer.disconnect();
    }

    function appendBatch() {
      if (!state.pool || state.done) return;
      var appended = 0;
      var currentCount = track.querySelectorAll('.brand-showcase-card').length;

      while (state.cursor < state.pool.length && appended < progressiveBatchSize && currentCount < progressiveMaxItems) {
        var product = state.pool[state.cursor++];
        if (!product || !product.handle || knownHandles[product.handle]) continue;
        var card = createProgressiveCard(product);
        if (!card) continue;
        knownHandles[product.handle] = true;
        track.appendChild(card);
        appended += 1;
        currentCount += 1;
      }

      if (currentCount >= progressiveMaxItems || state.cursor >= state.pool.length) finish();
    }

    function loadNextBatch() {
      if (state.loading || state.done) return;
      if (state.pool) {
        appendBatch();
        return;
      }

      state.loading = true;
      fetch(progressiveEndpoint(), { credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .then(function (response) {
          if (!response.ok) throw new Error('Unable to load more products');
          return response.json();
        })
        .then(function (payload) {
          state.pool = payload && Array.isArray(payload.products) ? payload.products : [];
          appendBatch();
        })
        .catch(function () {
          finish();
        })
        .finally(function () {
          state.loading = false;
        });
    }

    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) loadNextBatch();
    }, { rootMargin: '220px 0px', threshold: 0 });

    if (state.done) finish();
    else observer.observe(sentinel);
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
    setupProgressiveArrivals(section);
    setupBrowseTutorial(section);
  }

  window.theme = window.theme || {};
  if (window.theme.onSectionLoad) window.theme.onSectionLoad('[data-brand-showcase]', initShowcase);
  else document.querySelectorAll('[data-brand-showcase]').forEach(initShowcase);
})();
