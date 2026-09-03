(() => {
  'use strict';

  const controllers = new WeakMap();
  const desktopGallery = window.matchMedia('(min-width: 1000px)');

  function selectedOptionIds(section) {
    return Array.from(section.querySelectorAll('[data-option-value-id]:checked'))
      .sort((a, b) => Number(a.dataset.optionPosition) - Number(b.dataset.optionPosition))
      .map((input) => input.dataset.optionValueId);
  }

  function purchaseParts(section) {
    return {
      container: section.querySelector('[data-product-form-container]'),
      id: section.querySelector('[data-product-variant-id]'),
      submit: section.querySelector('[data-product-submit]'),
      quantity: section.querySelector('[data-product-quantity]'),
      wallet: section.querySelector('[data-product-dynamic-checkout]')
    };
  }

  function lockPurchase(section, busy) {
    const p = purchaseParts(section);
    if (p.id) p.id.disabled = true;
    if (p.submit) p.submit.disabled = true;
    if (p.quantity) p.quantity.disabled = !!busy;
    if (p.wallet) {
      p.wallet.hidden = true;
      p.wallet.setAttribute('aria-hidden', 'true');
    }
    if (p.container) {
      p.container.classList.toggle('is-pending', !!busy);
      p.container.classList.toggle('is-locked', !busy);
      if (busy) p.container.setAttribute('aria-busy', 'true');
      else p.container.removeAttribute('aria-busy');
    }
  }

  function applyServerState(section) {
    const p = purchaseParts(section);
    if (!p.container) return;
    const available = p.container.dataset.variantAvailable === 'true';
    const hasVariant = p.container.dataset.hasVariant === 'true';
    p.container.classList.remove('is-pending', 'is-locked');
    p.container.removeAttribute('aria-busy');
    if (p.id) p.id.disabled = !(available && p.id.value);
    if (p.submit) {
      p.submit.disabled = !available;
      p.submit.textContent = available
        ? p.submit.dataset.labelAdd
        : hasVariant
          ? p.submit.dataset.labelSoldOut
          : p.submit.dataset.labelUnavailable;
    }
    if (p.quantity) p.quantity.disabled = false;
    if (p.wallet) {
      p.wallet.hidden = !available;
      p.wallet.setAttribute('aria-hidden', available ? 'false' : 'true');
    }
  }

  function setError(section, message) {
    const el = section.querySelector('[data-product-error]');
    if (!el) return;
    el.textContent = message || '';
    el.toggleAttribute('hidden', !message);
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setActiveMediaState(section, mediaId) {
    if (!mediaId) return null;
    const targetId = String(mediaId);
    let activeItem = null;
    let activeThumb = null;

    section.querySelectorAll('[data-product-media-item]').forEach((item) => {
      const active = item.dataset.mediaId === targetId;
      item.classList.toggle('is-active', active);
      if (active) activeItem = item;
    });

    section.querySelectorAll('[data-product-gallery-thumb]').forEach((thumb) => {
      const active = thumb.dataset.mediaId === targetId;
      thumb.classList.toggle('is-active', active);
      if (active) {
        thumb.setAttribute('aria-current', 'true');
        activeThumb = thumb;
      } else {
        thumb.removeAttribute('aria-current');
      }
    });

    const gallery = section.querySelector('[data-product-gallery]');
    if (gallery) gallery.dataset.productSelectedMedia = targetId;

    return { item: activeItem, thumb: activeThumb };
  }

  function centerThumbInRail(thumb) {
    if (!thumb) return;
    const rail = thumb.closest('[data-product-gallery-thumbs]');
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;

    const left = thumb.offsetLeft - ((rail.clientWidth - thumb.offsetWidth) / 2);
    rail.scrollTo({
      left: Math.max(0, left),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  function moveTrackToMedia(section, item) {
    if (!item || desktopGallery.matches) return;
    const track = section.querySelector('[data-product-gallery-track]');
    if (!track) return;

    const left = item.offsetLeft - ((track.clientWidth - item.offsetWidth) / 2);
    track.scrollTo({
      left: Math.max(0, left),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  function activateMedia(section, mediaId, navigate = true) {
    const active = setActiveMediaState(section, mediaId);
    if (!active) return;

    if (navigate) moveTrackToMedia(section, active.item);
    centerThumbInRail(active.thumb);
  }

  function syncMediaFromTrack(section) {
    if (desktopGallery.matches) return;
    const track = section.querySelector('[data-product-gallery-track]');
    if (!track) return;

    const items = Array.from(track.querySelectorAll('[data-product-media-item]'));
    if (!items.length) return;

    const trackCenter = track.scrollLeft + (track.clientWidth / 2);
    let closest = items[0];
    let closestDistance = Infinity;

    items.forEach((item) => {
      const itemCenter = item.offsetLeft + (item.offsetWidth / 2);
      const distance = Math.abs(itemCenter - trackCenter);
      if (distance < closestDistance) {
        closest = item;
        closestDistance = distance;
      }
    });

    const gallery = section.querySelector('[data-product-gallery]');
    if (gallery?.dataset.productSelectedMedia === closest.dataset.mediaId) return;
    const active = setActiveMediaState(section, closest.dataset.mediaId);
    centerThumbInRail(active?.thumb);
  }

  function announce(section) {
    const region = section.querySelector('[data-product-live-region]');
    if (!region) return;
    const price = section.querySelector('[data-product-price]');
    const availability = section.querySelector('[data-product-availability]');
    region.textContent = [price, availability]
      .filter(Boolean)
      .map((node) => node.textContent.trim().replace(/\s+/g, ' '))
      .join('. ');
  }

  function replaceFragments(section, doc) {
    const required = [
      '[data-product-variant-picker]',
      '[data-product-form-container]',
      '[data-product-price]',
      '[data-product-availability]'
    ];
    const optional = ['[data-product-sku]', '[data-product-pickup]'];

    if (!required.every((selector) => section.querySelector(selector) && doc.querySelector(selector))) {
      throw new Error('Missing required product fragment');
    }

    [...required, ...optional].forEach((selector) => {
      const current = section.querySelector(selector);
      const incoming = doc.querySelector(selector);
      if (current && incoming) current.replaceWith(incoming);
    });

    applyServerState(section);

    if (window.Shopify?.PaymentButton?.init && section.querySelector('[data-product-dynamic-checkout]')) {
      window.Shopify.PaymentButton.init();
    }

    const incomingGallery = doc.querySelector('[data-product-gallery]');
    if (incomingGallery?.dataset.productSelectedMedia) {
      activateMedia(section, incomingGallery.dataset.productSelectedMedia);
    }

    announce(section);
  }

  function syncUrl(section) {
    const p = purchaseParts(section);
    const url = new URL(window.location.href);
    const validVariant = p.container?.dataset.hasVariant === 'true' && p.id?.value;
    if (validVariant) {
      url.searchParams.set('variant', p.id.value);
      url.searchParams.delete('option_values');
    } else {
      url.searchParams.delete('variant');
      const ids = selectedOptionIds(section);
      if (ids.length) url.searchParams.set('option_values', ids.join(','));
      else url.searchParams.delete('option_values');
    }
    history.replaceState({}, '', url);
  }

  async function updateVariant(section, focusedId) {
    controllers.get(section)?.abort();
    const controller = new AbortController();
    controllers.set(section, controller);
    const quantity = section.querySelector('[data-product-quantity]')?.value;

    setError(section, '');
    lockPurchase(section, true);

    const url = new URL(section.dataset.productUrl, location.origin);
    url.searchParams.set('section_id', section.dataset.sectionId);
    url.searchParams.set('option_values', selectedOptionIds(section).join(','));

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Variant request failed');
      const html = await response.text();
      if (controllers.get(section) !== controller || !document.body.contains(section)) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      replaceFragments(section, doc);
      if (quantity) {
        const nextQuantity = section.querySelector('[data-product-quantity]');
        if (nextQuantity) nextQuantity.value = quantity;
      }
      if (focusedId) section.querySelector(`[data-option-value-id="${CSS.escape(focusedId)}"]`)?.focus();
      syncUrl(section);
      controllers.delete(section);
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (controllers.get(section) !== controller) return;
      controllers.delete(section);
      lockPurchase(section, false);
      setError(section, section.dataset.errorMessage || 'We could not update that selection. Please try again.');
    }
  }

  function init(section) {
    if (section.dataset.productInitialized === 'true') return;
    section.dataset.productInitialized = 'true';
    section.setAttribute('data-product-enhanced', '');

    const fallback = section.querySelector('[data-product-selection-form]');
    fallback?.querySelectorAll('select, button').forEach((control) => { control.disabled = true; });
    applyServerState(section);

    const tabs = Array.from(section.querySelectorAll('[data-product-tab]'));
    const activateTab = (nextTab, moveFocus = false) => {
      if (!nextTab) return;
      const key = nextTab.dataset.productTab;
      tabs.forEach((tab) => {
        const active = tab === nextTab;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
      });
      section.querySelectorAll('[data-product-tab-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.productTabPanel !== key;
      });
      if (moveFocus) nextTab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', (event) => {
        let nextIndex = null;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        activateTab(tabs[nextIndex], true);
      });
    });

    section.addEventListener('change', (event) => {
      const input = event.target.closest('[data-option-value-id]');
      if (!input) return;
      if (input.dataset.productUrl) {
        location.href = input.dataset.productUrl;
        return;
      }
      updateVariant(section, input.dataset.optionValueId);
    });

    section.addEventListener('click', (event) => {
      const thumb = event.target.closest('[data-product-gallery-thumb]');
      if (!thumb) return;
      event.preventDefault();
      activateMedia(section, thumb.dataset.mediaId);
    });

    const galleryTrack = section.querySelector('[data-product-gallery-track]');
    if (galleryTrack) {
      let scrollFrame = null;
      galleryTrack.addEventListener('scroll', () => {
        if (desktopGallery.matches) return;
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = null;
          syncMediaFromTrack(section);
        });
      }, { passive: true });
    }

    section.addEventListener('submit', (event) => {
      const form = event.target.closest('.product-form__form');
      if (!form) return;
      const p = purchaseParts(section);
      const allowed = p.container &&
        !p.container.classList.contains('is-pending') &&
        !p.container.classList.contains('is-locked') &&
        p.container.dataset.variantAvailable === 'true' &&
        p.id && !p.id.disabled && p.id.value &&
        p.submit && !p.submit.disabled;
      if (!allowed) event.preventDefault();
    });
  }

  window.theme = window.theme || {};
  if (window.theme.onSectionLoad) window.theme.onSectionLoad('[data-product-section]', init);
  else document.querySelectorAll('[data-product-section]').forEach(init);
})();
