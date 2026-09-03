(() => {
  'use strict';

  const root = document.querySelector('[data-quick-view]');
  if (!root) return;

  // Remove any legacy loading/error takeover markup that may still be present
  // in a cached or partially-synced theme document. Quick View always opens
  // on real product content now.
  root.querySelectorAll('[data-quick-view-loading],[data-quick-view-error]').forEach((node) => node.remove());

  const panel = root.querySelector('[data-quick-view-panel]');
  const content = root.querySelector('[data-quick-view-content]');
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

  if (!panel || !content || !image || !thumbs || !vendor || !title || !price || !archiveBlock || !archiveId || !archiveMeta || !variantsWrap || !variantSelect || !addButton || !status || !bagLink || !fullLink) return;

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

  const normalizeProductUrl = (value) => {
    const url = new URL(value, window.location.origin);
    url.hash = '';
    return `${url.pathname}${url.search}`;
  };

  const productEndpoint = (productUrl) => {
    const url = new URL(productUrl, window.location.origin);
    const pathname = url.pathname.replace(/\.js$/, '').replace(/\/$/, '');
    return `${pathname}.js`;
  };

  const fetchProduct = (productUrl) => {
    const key = normalizeProductUrl(productUrl).split('?')[0];
    if (productCache.has(key)) return Promise.resolve(productCache.get(key));
    if (pendingProducts.has(key)) return pendingProducts.get(key);

    const request = fetch(productEndpoint(productUrl), {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Product request failed: ${response.status}`);
        return response.json();
      })
      .then((product) => {
        product.url = normalizeProductUrl(productUrl).split('?')[0];
        productCache.set(key, product);
        return product;
      })
      .finally(() => pendingProducts.delete(key));

    pendingProducts.set(key, request);
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
    const response = await fetch(`${shopRoot()}cart.js`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
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
    if (!reduceMotion && window.gsap) {
      window.gsap.killTweensOf(panel);
      window.gsap.to(panel, { xPercent: 100, duration: .3, ease: 'power2.in', onComplete: finishClose });
      window.gsap.to(root.querySelector('.sp-quick-view__backdrop'), { opacity: 0, duration: .2, ease: 'power2.in' });
    } else {
      finishClose();
    }
  };

  const openShell = () => {
    // Content is intentionally made visible before the drawer opens. There is
    // no loading/interstitial state in Quick View anymore.
    content.hidden = false;
    root.hidden = false;
    document.documentElement.classList.add('quick-view-scroll-lock');
    panel.scrollTop = 0;
    panel.focus();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && window.gsap) {
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
    image.alt = `${currentProduct?.title || title.textContent || 'Product'} — image ${boundedIndex + 1}`;
    [...thumbs.children].forEach((button, i) => button.classList.toggle('is-active', i === boundedIndex));
  };

  const renderImages = (images = []) => {
    thumbs.replaceChildren();
    currentImages = images.slice(0, 6);
    currentImageIndex = 0;

    if (!currentImages.length) return;

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

  const getPreviewData = (trigger) => {
    const card = trigger.closest('.product-card, .sp-feed-tile');
    const cardImage = card?.querySelector('.product-card__image--primary, .sp-feed-tile__image');
    const cardVendor = card?.querySelector('.product-card__vendor, .sp-feed-tile__vendor');
    const cardTitle = card?.querySelector('.product-card__title, .sp-feed-tile__meta h3');
    const cardPrice = card?.querySelector('.price__current, .sp-feed-tile__price .price__current, .sp-feed-tile__price');

    return {
      image: trigger.dataset.previewImage || cardImage?.currentSrc || cardImage?.src || '',
      vendor: trigger.dataset.previewVendor || cardVendor?.textContent?.trim() || '',
      title: trigger.dataset.previewTitle || cardTitle?.textContent?.trim() || trigger.getAttribute('aria-label')?.replace(/^Quick view\s+/i, '') || 'Product',
      price: trigger.dataset.previewPrice || cardPrice?.textContent?.trim() || ''
    };
  };

  const renderPreview = (trigger, productUrl) => {
    const preview = getPreviewData(trigger);

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

    vendor.textContent = preview.vendor;
    title.textContent = preview.title;
    price.textContent = preview.price;

    if (preview.image) {
      image.src = preview.image;
      image.alt = preview.title;
    } else {
      image.removeAttribute('src');
      image.alt = '';
    }

    fullLink.href = productUrl;
    renderArchiveMeta(trigger);
    content.hidden = false;
  };

  const renderProduct = (product, trigger) => {
    currentProduct = product;
    addedVariantId = null;
    bagLink.hidden = true;
    status.textContent = '';
    vendor.textContent = product.vendor || vendor.textContent || '';
    title.textContent = product.title || title.textContent || 'Untitled piece';
    fullLink.href = product.url || trigger.dataset.productUrl || '#';

    if (product.images?.length) renderImages(product.images);

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

    if (firstAvailable) syncVariantState();
    else {
      addButton.disabled = true;
      addButton.textContent = 'Unavailable';
    }

    renderArchiveMeta(trigger);
    content.hidden = false;
  };

  const open = async (trigger) => {
    previousFocus = trigger;
    activeRequest += 1;
    const requestId = activeRequest;
    const productUrl = trigger.dataset.productUrl;
    if (!productUrl) return;

    const key = normalizeProductUrl(productUrl).split('?')[0];
    const cachedProduct = productCache.get(key);

    if (cachedProduct) {
      renderProduct(cachedProduct, trigger);
      openShell();
      return;
    }

    // Show the actual clicked product first. Hydration is an enhancement, not
    // a gate to opening the drawer.
    renderPreview(trigger, productUrl);
    openShell();

    try {
      const product = await fetchProduct(productUrl);
      if (requestId !== activeRequest || root.hidden) return;
      renderProduct(product, trigger);
    } catch (_) {
      if (requestId !== activeRequest || root.hidden) return;
      // Keep the product preview visible. Never replace it with an error page.
      addButton.disabled = true;
      status.textContent = 'View the full piece to choose options.';
    }
  };

  const prefetch = (trigger) => {
    const productUrl = trigger?.dataset?.productUrl;
    if (!productUrl) return;
    const key = normalizeProductUrl(productUrl).split('?')[0];
    if (productCache.has(key) || pendingProducts.has(key)) return;
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

  variantSelect.addEventListener('change', () => {
    status.textContent = '';
    bagLink.hidden = true;
    syncVariantState();
  });

  addButton.addEventListener('click', async () => {
    if (!variantSelect.value || addButton.disabled) return;

    const variantId = Number(variantSelect.value);
    addButton.disabled = true;
    status.textContent = 'Adding to bag…';

    try {
      const response = await fetch(`${shopRoot()}cart/add.js`, {
        method: 'POST',
        credentials: 'same-origin',
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

    if (event.key === 'Tab') {
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
