(() => {
  'use strict';

  const root = document.querySelector('[data-quick-view]');
  if (!root) return;

  const panel = root.querySelector('[data-quick-view-panel]');
  const content = root.querySelector('[data-quick-view-content]');
  const errorState = root.querySelector('[data-quick-view-error]');
  const image = root.querySelector('[data-quick-view-image]');
  const thumbs = root.querySelector('[data-quick-view-thumbs]');
  const vendor = root.querySelector('[data-quick-view-vendor]');
  const title = root.querySelector('[data-quick-view-title]');
  const price = root.querySelector('[data-quick-view-price]');
  const archiveBlock = root.querySelector('[data-quick-view-archive-block]');
  const archiveId = root.querySelector('[data-quick-view-archive-id]');
  const archiveMeta = root.querySelector('[data-quick-view-meta]');
  const variantsWrap = root.querySelector('[data-quick-view-variants]');
  const variantSelect = root.querySelector('[data-quick-view-variant-select]');
  const addButton = root.querySelector('[data-quick-view-add]');
  const status = root.querySelector('[data-quick-view-status]');
  const bagLink = root.querySelector('[data-quick-view-bag-link]');
  const fullLink = root.querySelector('[data-quick-view-full-link]');
  const errorLink = root.querySelector('[data-quick-view-error-link]');

  let previousFocus = null;
  let currentProduct = null;
  let currentImages = [];
  let currentImageIndex = 0;
  let activeRequest = 0;
  let addedVariantId = null;

  const productCache = new Map();
  const pendingProducts = new Map();

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

  const productEndpoint = (productUrl) => {
    const url = new URL(productUrl, window.location.origin);
    url.pathname = `${url.pathname.replace(/\/$/, '')}.js`;
    url.search = '';
    url.hash = '';
    return url.toString();
  };

  const fetchProduct = (productUrl) => {
    if (productCache.has(productUrl)) return Promise.resolve(productCache.get(productUrl));
    if (pendingProducts.has(productUrl)) return pendingProducts.get(productUrl);

    const request = fetch(productEndpoint(productUrl), {
      headers: { Accept: 'application/json' }
    })
      .then((response) => {
        if (!response.ok) throw new Error('Product request failed');
        return response.json();
      })
      .then((product) => {
        product.url = productUrl;
        productCache.set(productUrl, product);
        return product;
      })
      .finally(() => pendingProducts.delete(productUrl));

    pendingProducts.set(productUrl, request);
    return request;
  };

  const updateHeaderCart = (cart) => {
    const cartTrigger = document.querySelector('[data-header-cart-trigger]');
    if (!cartTrigger || !cart) return;

    let count = cartTrigger.querySelector('[data-header-cart-count]');
    if (cart.item_count > 0) {
      if (!count) {
        count = document.createElement('span');
        count.className = 'site-header__cart-count';
        count.dataset.headerCartCount = '';
        count.setAttribute('aria-hidden', 'true');
        cartTrigger.appendChild(count);
      }
      count.textContent = String(cart.item_count);
    } else {
      count?.remove();
    }

    const hiddenLabel = cartTrigger.querySelector('.visually-hidden');
    if (hiddenLabel) {
      hiddenLabel.textContent = cart.item_count === 1 ? 'Cart, 1 item' : `Cart, ${cart.item_count} items`;
    }
  };

  const fetchCart = async () => {
    const response = await fetch(`${shopRoot()}cart.js`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Cart refresh failed');
    return response.json();
  };

  const finishClose = () => {
    root.hidden = true;
    document.documentElement.classList.remove('quick-view-scroll-lock');
    previousFocus?.focus?.();
  };

  const close = () => {
    activeRequest += 1;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && window.gsap && panel) {
      window.gsap.killTweensOf(panel);
      window.gsap.to(panel, { xPercent: 100, duration: .3, ease: 'power2.in', onComplete: finishClose });
      window.gsap.to(root.querySelector('.sp-quick-view__backdrop'), { opacity: 0, duration: .2, ease: 'power2.in' });
    } else {
      finishClose();
    }
  };

  const openShell = () => {
    root.hidden = false;
    document.documentElement.classList.add('quick-view-scroll-lock');
    if (panel) panel.scrollTop = 0;
    panel?.focus();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && window.gsap && panel) {
      window.gsap.killTweensOf(panel);
      window.gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: .4, ease: 'power3.out' });
      window.gsap.fromTo(root.querySelector('.sp-quick-view__backdrop'), { opacity: 0 }, { opacity: 1, duration: .24, ease: 'power2.out' });
    }
  };

  const setActiveImage = (index) => {
    if (!currentImages.length) return;
    const boundedIndex = Math.max(0, Math.min(index, currentImages.length - 1));
    const selected = currentImages[boundedIndex];
    currentImageIndex = boundedIndex;
    image.src = selected.src || selected;
    image.alt = `${currentProduct?.title || 'Product'} — image ${boundedIndex + 1}`;
    [...thumbs.children].forEach((button, i) => button.classList.toggle('is-active', i === boundedIndex));
  };

  const renderImages = (images = []) => {
    thumbs.replaceChildren();
    currentImages = images.slice(0, 6);
    currentImageIndex = 0;

    if (!currentImages.length) {
      image.removeAttribute('src');
      image.alt = '';
      return;
    }

    currentImages.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sp-quick-view__thumb';
      button.setAttribute('aria-label', `View image ${index + 1}`);

      const img = document.createElement('img');
      img.src = entry.src || entry;
      img.alt = '';
      button.appendChild(img);
      button.addEventListener('click', () => setActiveImage(index));
      thumbs.appendChild(button);
    });

    setActiveImage(0);
  };

  const syncVariantState = () => {
    const variant = currentProduct?.variants?.find((item) => String(item.id) === String(variantSelect.value));
    if (!variant) return;

    price.textContent = money(variant.price);
    const wasAdded = String(addedVariantId) === String(variant.id);
    addButton.disabled = !variant.available || wasAdded;
    addButton.textContent = !variant.available ? 'Sold out' : (wasAdded ? 'Added to bag' : 'Add to bag');

    const variantImage = variant.featured_image?.src || variant.featured_image;
    if (variantImage && currentImages.length) {
      const normalizedVariant = normalizeImageUrl(variantImage);
      const matchIndex = currentImages.findIndex((entry) => normalizeImageUrl(entry.src || entry) === normalizedVariant);
      if (matchIndex >= 0 && matchIndex !== currentImageIndex) setActiveImage(matchIndex);
    }
  };

  const renderArchiveMeta = (trigger) => {
    const values = [trigger.dataset.size, trigger.dataset.condition, trigger.dataset.itemState].filter(Boolean);
    archiveMeta.replaceChildren();

    const suppliedArchiveId = trigger.dataset.archiveId || '';
    if (suppliedArchiveId || values.length) {
      archiveBlock.hidden = false;
      archiveId.hidden = !suppliedArchiveId;
      archiveId.textContent = suppliedArchiveId;
      values.forEach((value) => {
        const span = document.createElement('span');
        span.textContent = value;
        archiveMeta.appendChild(span);
      });
    } else {
      archiveBlock.hidden = true;
      archiveId.hidden = true;
      archiveId.textContent = '';
    }
  };

  const renderPreview = (trigger, productUrl) => {
    const card = trigger.closest('.product-card');
    const cardImage = card?.querySelector('.product-card__image--primary');
    const cardVendor = card?.querySelector('.product-card__vendor');
    const cardTitle = card?.querySelector('.product-card__title');
    const cardPrice = card?.querySelector('.price__current') || card?.querySelector('.price');

    currentProduct = null;
    currentImages = [];
    currentImageIndex = 0;
    addedVariantId = null;

    thumbs.replaceChildren();
    variantSelect.replaceChildren();
    variantsWrap.hidden = true;
    bagLink.hidden = true;
    status.textContent = '';
    addButton.disabled = true;
    addButton.textContent = 'Add to bag';

    vendor.textContent = cardVendor?.textContent?.trim() || '';
    title.textContent = cardTitle?.textContent?.trim() || trigger.getAttribute('aria-label')?.replace(/^Quick view\s+/i, '') || 'Product';
    price.textContent = cardPrice?.textContent?.trim() || '';

    const previewSrc = cardImage?.currentSrc || cardImage?.src || '';
    if (previewSrc) {
      image.src = previewSrc;
      image.alt = title.textContent;
    } else {
      image.removeAttribute('src');
      image.alt = '';
    }

    fullLink.href = productUrl;
    errorLink.href = productUrl;
    renderArchiveMeta(trigger);
    errorState.hidden = true;
    content.hidden = false;
  };

  const renderProduct = (product, trigger) => {
    currentProduct = product;
    addedVariantId = null;
    bagLink.hidden = true;
    status.textContent = '';
    vendor.textContent = product.vendor || '';
    title.textContent = product.title || 'Untitled piece';
    fullLink.href = product.url || trigger.dataset.productUrl || '#';
    errorLink.href = fullLink.href;

    renderImages(product.images || []);

    variantSelect.replaceChildren();
    const variants = product.variants || [];
    variants.forEach((variant) => {
      const option = document.createElement('option');
      option.value = variant.id;
      option.textContent = `${variant.title}${variant.available ? '' : ' — Sold out'}`;
      option.disabled = !variant.available;
      variantSelect.appendChild(option);
    });

    const firstAvailable = variants.find((variant) => variant.available) || variants[0];
    if (firstAvailable) variantSelect.value = String(firstAvailable.id);
    variantsWrap.hidden = variants.length <= 1 || (variants.length === 1 && variants[0].title === 'Default Title');

    syncVariantState();
    renderArchiveMeta(trigger);
    errorState.hidden = true;
    content.hidden = false;
  };

  const open = async (trigger) => {
    previousFocus = trigger;
    activeRequest += 1;
    const requestId = activeRequest;
    const productUrl = trigger.dataset.productUrl;
    if (!productUrl) return;

    const cachedProduct = productCache.get(productUrl);
    if (cachedProduct) {
      renderProduct(cachedProduct, trigger);
      openShell();
      return;
    }

    renderPreview(trigger, productUrl);
    openShell();

    try {
      const product = await fetchProduct(productUrl);
      if (requestId !== activeRequest || root.hidden) return;
      renderProduct(product, trigger);
    } catch (_) {
      if (requestId !== activeRequest || root.hidden) return;
      addButton.disabled = true;
      status.textContent = 'Open the full piece to choose options.';
    }
  };

  const prefetch = (trigger) => {
    const productUrl = trigger?.dataset?.productUrl;
    if (!productUrl || productCache.has(productUrl) || pendingProducts.has(productUrl)) return;
    fetchProduct(productUrl).catch(() => {});
  };

  document.addEventListener('pointerover', (event) => {
    prefetch(event.target.closest?.('[data-quick-view-trigger]'));
  });

  document.addEventListener('focusin', (event) => {
    prefetch(event.target.closest?.('[data-quick-view-trigger]'));
  });

  document.addEventListener('pointerdown', (event) => {
    prefetch(event.target.closest?.('[data-quick-view-trigger]'));
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

  variantSelect?.addEventListener('change', () => {
    status.textContent = '';
    bagLink.hidden = true;
    syncVariantState();
  });

  addButton?.addEventListener('click', async () => {
    if (!variantSelect.value || addButton.disabled) return;

    const variantId = Number(variantSelect.value);
    addButton.disabled = true;
    status.textContent = 'Adding to bag…';

    try {
      const response = await fetch(`${shopRoot()}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      });
      if (!response.ok) throw new Error('Cart add failed');

      addedVariantId = variantId;
      const cart = await fetchCart();
      updateHeaderCart(cart);
      addButton.textContent = 'Added to bag';
      addButton.disabled = true;
      status.textContent = 'Bag updated.';
      bagLink.hidden = false;
      document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { cart } }));
    } catch (_) {
      status.textContent = 'Could not add this piece. Open the full product page to try again.';
      addedVariantId = null;
      syncVariantState();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (root.hidden) return;
    if (event.key === 'Escape') close();

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
