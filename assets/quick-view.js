(() => {
  'use strict';

  const root = document.querySelector('[data-quick-view]');
  if (!root) return;

  const panel = root.querySelector('[data-quick-view-panel]');
  const backdrop = root.querySelector('.sp-quick-view__backdrop');
  const content = root.querySelector('[data-quick-view-content]');
  const loading = root.querySelector('[data-quick-view-loading]');
  const errorState = root.querySelector('[data-quick-view-error]');
  const image = root.querySelector('[data-quick-view-image]');
  const thumbs = root.querySelector('[data-quick-view-thumbs]');
  const imageIndex = root.querySelector('[data-quick-view-image-index]');
  const vendor = root.querySelector('[data-quick-view-vendor]');
  const title = root.querySelector('[data-quick-view-title]');
  const price = root.querySelector('[data-quick-view-price]');
  const archiveBlock = root.querySelector('[data-quick-view-archive-block]');
  const archiveId = root.querySelector('[data-quick-view-archive-id]');
  const archiveMeta = root.querySelector('[data-quick-view-meta]');
  const variantsWrap = root.querySelector('[data-quick-view-variants]');
  const variantOptions = root.querySelector('[data-quick-view-variant-options]');
  const variantSelect = root.querySelector('[data-quick-view-variant-select]');
  const selectedVariantLabel = root.querySelector('[data-quick-view-selected-variant]');
  const addButton = root.querySelector('[data-quick-view-add]');
  const status = root.querySelector('[data-quick-view-status]');
  const bagLink = root.querySelector('[data-quick-view-bag-link]');
  const fullLink = root.querySelector('[data-quick-view-full-link]');
  const errorLink = root.querySelector('[data-quick-view-error-link]');

  let previousFocus = null;
  let currentProduct = null;
  let currentImages = [];
  let currentImageIndex = 0;
  let selectedVariantId = null;
  let addedVariantId = null;
  let activeRequest = 0;
  let requestController = null;

  const productCache = new Map();
  const productPrefetches = new Map();
  const isMobile = () => window.matchMedia('(max-width: 749px)').matches;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shopRoot = () => window.Shopify?.routes?.root || '/';

  const money = (cents) => {
    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      }).format((Number(cents) || 0) / 100);
    } catch (_) {
      return `$${((Number(cents) || 0) / 100).toFixed(2)}`;
    }
  };

  const normalizeImageUrl = (value = '') => String(value).split('?')[0].replace(/^https?:/, '');

  const updateHeaderCart = (cart) => {
    const cartTrigger = document.querySelector('[data-header-cart-trigger]');
    if (!cartTrigger || !cart) return;

    let count = cartTrigger.querySelector('[data-header-cart-count]');
    if (!count) {
      count = document.createElement('span');
      count.className = 'site-header__cart-count';
      count.dataset.headerCartCount = '';
      count.setAttribute('aria-hidden', 'true');
      cartTrigger.appendChild(count);
    }
    count.textContent = String(cart.item_count || 0);

    const hiddenLabel = cartTrigger.querySelector('.visually-hidden');
    if (hiddenLabel) hiddenLabel.textContent = cart.item_count === 1 ? 'Bag, 1 item' : `Bag, ${cart.item_count || 0} items`;
  };

  const fetchCart = async () => {
    const response = await fetch(`${shopRoot()}cart.js`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Cart refresh failed');
    return response.json();
  };

  const cacheProduct = (productUrl, product) => {
    product.url = productUrl;
    productCache.set(productUrl, product);
    return product;
  };

  const prefetchProduct = (productUrl) => {
    if (!productUrl || productCache.has(productUrl) || productPrefetches.has(productUrl)) return;
    const request = fetch(`${productUrl}.js`, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('Product prefetch failed');
        return response.json();
      })
      .then((product) => cacheProduct(productUrl, product))
      .catch(() => null)
      .finally(() => productPrefetches.delete(productUrl));
    productPrefetches.set(productUrl, request);
  };

  const loadProduct = async (productUrl, signal) => {
    if (productCache.has(productUrl)) return productCache.get(productUrl);
    if (productPrefetches.has(productUrl)) {
      const prefetched = await productPrefetches.get(productUrl);
      if (prefetched) return prefetched;
    }

    const response = await fetch(`${productUrl}.js`, {
      headers: { Accept: 'application/json' },
      signal
    });
    if (!response.ok) throw new Error('Product request failed');
    return cacheProduct(productUrl, await response.json());
  };

  const setLoading = () => {
    loading.hidden = false;
    content.hidden = true;
    errorState.hidden = true;
    status.textContent = '';
    bagLink.hidden = true;
    selectedVariantId = null;
    addedVariantId = null;
  };

  const finishClose = () => {
    root.hidden = true;
    document.documentElement.classList.remove('quick-view-scroll-lock');
    panel?.removeAttribute('style');
    backdrop?.removeAttribute('style');
    previousFocus?.focus?.();
  };

  const close = () => {
    activeRequest += 1;
    requestController?.abort();
    requestController = null;

    if (!reduceMotion() && window.gsap && panel) {
      window.gsap.killTweensOf([panel, backdrop].filter(Boolean));
      const panelVars = isMobile() ? { yPercent: 100 } : { xPercent: 100 };
      window.gsap.to(panel, { ...panelVars, duration: .28, ease: 'power2.in', onComplete: finishClose });
      if (backdrop) window.gsap.to(backdrop, { opacity: 0, duration: .18, ease: 'power2.in' });
    } else {
      finishClose();
    }
  };

  const openShell = () => {
    root.hidden = false;
    document.documentElement.classList.add('quick-view-scroll-lock');
    panel?.scrollTo?.({ top: 0 });
    panel?.focus();

    if (!reduceMotion() && window.gsap && panel) {
      window.gsap.killTweensOf([panel, backdrop].filter(Boolean));
      const fromVars = isMobile() ? { yPercent: 100 } : { xPercent: 100 };
      const toVars = isMobile() ? { yPercent: 0 } : { xPercent: 0 };
      window.gsap.fromTo(panel, fromVars, { ...toVars, duration: .36, ease: 'power3.out' });
      if (backdrop) window.gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: .2, ease: 'power2.out' });
    }
  };

  const setActiveImage = (index) => {
    if (!currentImages.length) return;
    const boundedIndex = Math.max(0, Math.min(index, currentImages.length - 1));
    const selected = currentImages[boundedIndex];
    currentImageIndex = boundedIndex;
    image.src = selected.src || selected;
    image.alt = `${currentProduct?.title || 'Product'} — image ${boundedIndex + 1}`;
    imageIndex.textContent = `${String(boundedIndex + 1).padStart(2, '0')} / ${String(currentImages.length).padStart(2, '0')}`;
    [...thumbs.children].forEach((button, i) => {
      button.classList.toggle('is-active', i === boundedIndex);
      button.setAttribute('aria-pressed', i === boundedIndex ? 'true' : 'false');
    });
  };

  const renderImages = (images = []) => {
    thumbs.innerHTML = '';
    currentImages = images.slice(0, 6);
    currentImageIndex = 0;

    if (!currentImages.length) {
      image.removeAttribute('src');
      image.alt = '';
      imageIndex.textContent = '00 / 00';
      return;
    }

    currentImages.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sp-quick-view__thumb';
      button.setAttribute('aria-label', `View image ${index + 1}`);
      button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
      const img = document.createElement('img');
      img.src = entry.src || entry;
      img.alt = '';
      button.appendChild(img);
      button.addEventListener('click', () => setActiveImage(index));
      thumbs.appendChild(button);
    });
    setActiveImage(0);
  };

  const getSelectedVariant = () => currentProduct?.variants?.find((item) => String(item.id) === String(selectedVariantId));

  const syncVariantButtons = () => {
    [...variantOptions.children].forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.variantId) === String(selectedVariantId) ? 'true' : 'false');
    });
  };

  const syncVariantState = () => {
    const variant = getSelectedVariant();
    syncVariantButtons();

    if (!variant) {
      if (currentProduct?.price != null) price.textContent = money(currentProduct.price);
      selectedVariantLabel.textContent = '';
      addButton.disabled = true;
      addButton.textContent = variantsWrap.hidden ? 'Unavailable' : 'Choose a size';
      return;
    }

    variantSelect.value = String(variant.id);
    price.textContent = money(variant.price);
    selectedVariantLabel.textContent = variant.title === 'Default Title' ? '' : variant.title;

    const wasAdded = String(addedVariantId) === String(variant.id);
    addButton.disabled = !variant.available || wasAdded;
    addButton.textContent = !variant.available ? 'Sold out' : (wasAdded ? 'Added ✓' : `Add — ${money(variant.price)}`);

    const variantImage = variant.featured_image?.src || variant.featured_image;
    if (variantImage && currentImages.length) {
      const normalizedVariant = normalizeImageUrl(variantImage);
      const matchIndex = currentImages.findIndex((entry) => normalizeImageUrl(entry.src || entry) === normalizedVariant);
      if (matchIndex >= 0 && matchIndex !== currentImageIndex) setActiveImage(matchIndex);
    }
  };

  const renderVariants = (variants = []) => {
    variantSelect.innerHTML = '';
    variantOptions.innerHTML = '';
    selectedVariantId = null;

    const meaningful = variants.length > 1 || (variants.length === 1 && variants[0].title !== 'Default Title');
    variantsWrap.hidden = !meaningful;

    variants.forEach((variant) => {
      const option = document.createElement('option');
      option.value = variant.id;
      option.textContent = variant.title;
      option.disabled = !variant.available;
      variantSelect.appendChild(option);

      if (meaningful) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sp-quick-view__variant-option';
        button.dataset.variantId = String(variant.id);
        button.textContent = variant.title;
        button.disabled = !variant.available;
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `${variant.title}${variant.available ? '' : ', sold out'}`);
        button.addEventListener('click', () => {
          selectedVariantId = variant.id;
          status.textContent = '';
          bagLink.hidden = true;
          syncVariantState();
        });
        variantOptions.appendChild(button);
      }
    });

    if (!meaningful && variants[0]) selectedVariantId = variants[0].id;
    syncVariantState();
  };

  const renderArchiveMeta = (trigger) => {
    const values = [trigger.dataset.size, trigger.dataset.condition, trigger.dataset.itemState].filter(Boolean);
    archiveMeta.replaceChildren();

    if (trigger.dataset.archive === 'true' || values.length) {
      archiveBlock.hidden = false;
      archiveId.textContent = trigger.dataset.archiveId || '1 of 1';
      values.forEach((value) => {
        const span = document.createElement('span');
        span.textContent = value;
        archiveMeta.appendChild(span);
      });
    } else {
      archiveBlock.hidden = true;
    }
  };

  const renderProduct = (product, trigger) => {
    currentProduct = product;
    selectedVariantId = null;
    addedVariantId = null;
    bagLink.hidden = true;
    status.textContent = '';
    vendor.textContent = product.vendor || '';
    title.textContent = product.title || 'Untitled piece';
    fullLink.href = product.url || trigger.dataset.productUrl || '#';
    errorLink.href = fullLink.href;

    renderImages(product.images || []);
    renderVariants(product.variants || []);
    renderArchiveMeta(trigger);

    loading.hidden = true;
    errorState.hidden = true;
    content.hidden = false;

    if (window.gsap && !reduceMotion()) {
      window.gsap.from([root.querySelector('.sp-quick-view__media'), root.querySelector('.sp-quick-view__details')].filter(Boolean), {
        opacity: 0,
        y: 10,
        duration: .34,
        stagger: .045,
        ease: 'power3.out'
      });
    }
  };

  const open = async (trigger) => {
    previousFocus = trigger;
    activeRequest += 1;
    const requestId = activeRequest;
    requestController?.abort();
    requestController = new AbortController();

    setLoading();
    openShell();

    const productUrl = trigger.dataset.productUrl;
    if (!productUrl) return;

    try {
      const product = await loadProduct(productUrl, requestController.signal);
      if (requestId !== activeRequest || root.hidden) return;
      renderProduct(product, trigger);
    } catch (error) {
      if (error.name === 'AbortError' || requestId !== activeRequest) return;
      loading.hidden = true;
      content.hidden = true;
      errorState.hidden = false;
      errorLink.href = productUrl;
    }
  };

  document.addEventListener('pointerover', (event) => {
    const trigger = event.target.closest?.('[data-quick-view-trigger]');
    if (trigger) prefetchProduct(trigger.dataset.productUrl);
  });

  document.addEventListener('focusin', (event) => {
    const trigger = event.target.closest?.('[data-quick-view-trigger]');
    if (trigger) prefetchProduct(trigger.dataset.productUrl);
  });

  document.addEventListener('touchstart', (event) => {
    const trigger = event.target.closest?.('[data-quick-view-trigger]');
    if (trigger) prefetchProduct(trigger.dataset.productUrl);
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-quick-view-trigger]');
    if (trigger) {
      event.preventDefault();
      open(trigger);
      return;
    }
    if (event.target.closest('[data-quick-view-close]')) close();
  });

  addButton?.addEventListener('click', async () => {
    const variant = getSelectedVariant();
    if (!variant || !variant.available || addButton.disabled) return;

    addButton.disabled = true;
    addButton.textContent = 'Adding…';
    status.textContent = '';

    try {
      const response = await fetch(`${shopRoot()}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: Number(variant.id), quantity: 1 })
      });
      if (!response.ok) throw new Error('Cart add failed');

      addedVariantId = variant.id;
      const cart = await fetchCart();
      updateHeaderCart(cart);
      addButton.textContent = 'Added ✓';
      addButton.disabled = true;
      status.textContent = 'Added to your bag.';
      bagLink.hidden = false;
      document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { cart } }));
    } catch (_) {
      status.textContent = 'Could not add this piece. Try the product page.';
      addedVariantId = null;
      syncVariantState();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (root.hidden) return;
    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'Tab' && panel) {
      const focusable = [...panel.querySelectorAll('a[href],button:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();
