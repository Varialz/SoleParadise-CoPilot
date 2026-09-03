(() => {
  'use strict';

  if (window.SoleParadiseQuickViewV3) return;
  window.SoleParadiseQuickViewV3 = true;

  const root = document.querySelector('[data-quick-view]');
  if (!root) return;

  const panel = root.querySelector('[data-quick-view-panel]');
  const content = root.querySelector('[data-quick-view-content]');
  if (!panel || !content) return;

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
  const backdrop = root.querySelector('.sp-quick-view__backdrop');

  root.querySelectorAll('[data-quick-view-loading],[data-quick-view-error]').forEach((node) => node.remove());

  let previousFocus = null;
  let activeRequest = 0;
  let currentProduct = null;
  let currentImages = [];
  let currentImageIndex = 0;
  let addedVariantId = null;

  const productCache = new Map();
  const pendingProducts = new Map();
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shopRoot = () => window.Shopify?.routes?.root || '/';

  const normalizeProductPath = (value) => {
    const url = new URL(value, window.location.origin);
    url.hash = '';
    url.search = '';
    return url.pathname.replace(/\.js$/, '').replace(/\/$/, '');
  };

  const productEndpoint = (value) => `${normalizeProductPath(value)}.js`;

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

  const fetchProduct = (productUrl) => {
    const key = normalizeProductPath(productUrl);
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
        product.url = key;
        productCache.set(key, product);
        return product;
      })
      .finally(() => pendingProducts.delete(key));

    pendingProducts.set(key, request);
    return request;
  };

  const getPreview = (trigger) => {
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

  const renderArchiveMeta = (trigger) => {
    if (!archiveBlock || !archiveMeta) return;
    const values = [trigger.dataset.size, trigger.dataset.condition, trigger.dataset.itemState].filter(Boolean);
    archiveMeta.replaceChildren();

    const suppliedId = trigger.dataset.archiveId || '';
    if (!suppliedId && !values.length) {
      archiveBlock.hidden = true;
      if (archiveId) {
        archiveId.hidden = true;
        archiveId.textContent = '';
      }
      return;
    }

    archiveBlock.hidden = false;
    if (archiveId) {
      archiveId.hidden = !suppliedId;
      archiveId.textContent = suppliedId;
    }

    values.forEach((value) => {
      const span = document.createElement('span');
      span.textContent = value;
      archiveMeta.appendChild(span);
    });
  };

  const openShell = () => {
    content.hidden = false;
    root.hidden = false;
    panel.scrollTop = 0;
    document.documentElement.classList.add('quick-view-scroll-lock');

    if (!reduceMotion() && window.gsap) {
      window.gsap.killTweensOf(panel);
      window.gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: .32, ease: 'power3.out' });
      if (backdrop) window.gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: .2, ease: 'power2.out' });
    }

    window.requestAnimationFrame(() => panel.focus());
  };

  const finishClose = () => {
    root.hidden = true;
    document.documentElement.classList.remove('quick-view-scroll-lock');
    previousFocus?.focus?.();
  };

  const close = () => {
    activeRequest += 1;
    if (!reduceMotion() && window.gsap) {
      window.gsap.killTweensOf(panel);
      window.gsap.to(panel, { xPercent: 100, duration: .24, ease: 'power2.in', onComplete: finishClose });
      if (backdrop) window.gsap.to(backdrop, { opacity: 0, duration: .18, ease: 'power2.in' });
      return;
    }
    finishClose();
  };

  const renderPreview = (trigger, productUrl) => {
    const preview = getPreview(trigger);
    currentProduct = null;
    currentImages = [];
    currentImageIndex = 0;
    addedVariantId = null;

    thumbs?.replaceChildren();
    variantSelect?.replaceChildren();
    if (variantsWrap) variantsWrap.hidden = true;
    if (bagLink) bagLink.hidden = true;
    if (status) status.textContent = '';
    if (addButton) {
      addButton.disabled = true;
      addButton.textContent = 'Add to bag';
    }

    if (vendor) vendor.textContent = preview.vendor;
    if (title) title.textContent = preview.title;
    if (price) price.textContent = preview.price;
    if (fullLink) fullLink.href = productUrl;

    if (image) {
      if (preview.image) {
        image.src = preview.image;
        image.alt = preview.title;
      } else {
        image.removeAttribute('src');
        image.alt = '';
      }
    }

    renderArchiveMeta(trigger);
    content.hidden = false;
  };

  const setActiveImage = (index) => {
    if (!image || !currentImages.length) return;
    const nextIndex = Math.max(0, Math.min(index, currentImages.length - 1));
    const selected = currentImages[nextIndex];
    currentImageIndex = nextIndex;
    image.src = selected.src || selected;
    image.alt = `${currentProduct?.title || title?.textContent || 'Product'} — image ${nextIndex + 1}`;
    if (thumbs) [...thumbs.children].forEach((button, i) => button.classList.toggle('is-active', i === nextIndex));
  };

  const renderImages = (images = []) => {
    if (!thumbs || !image || !images.length) return;
    thumbs.replaceChildren();
    currentImages = images.slice(0, 8);
    currentImageIndex = 0;

    currentImages.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sp-quick-view__thumb';
      button.setAttribute('aria-label', `View image ${index + 1}`);

      const thumbImage = document.createElement('img');
      thumbImage.src = entry.src || entry;
      thumbImage.alt = '';
      button.appendChild(thumbImage);
      button.addEventListener('click', () => setActiveImage(index));
      thumbs.appendChild(button);
    });

    setActiveImage(0);
  };

  const selectedVariant = () => currentProduct?.variants?.find((variant) => String(variant.id) === String(variantSelect?.value));

  const syncVariantState = () => {
    const variant = selectedVariant();
    if (!variant) return;

    if (price) price.textContent = money(variant.price);
    if (addButton) {
      const wasAdded = String(addedVariantId) === String(variant.id);
      addButton.disabled = !variant.available || wasAdded;
      addButton.textContent = !variant.available ? 'Sold out' : (wasAdded ? 'Added to bag' : 'Add to bag');
    }

    const variantImage = variant.featured_image?.src || variant.featured_image;
    if (variantImage && currentImages.length) {
      const cleanVariant = String(variantImage).split('?')[0].replace(/^https?:/, '');
      const matchIndex = currentImages.findIndex((entry) => String(entry.src || entry).split('?')[0].replace(/^https?:/, '') === cleanVariant);
      if (matchIndex >= 0 && matchIndex !== currentImageIndex) setActiveImage(matchIndex);
    }
  };

  const renderProduct = (product, trigger) => {
    currentProduct = product;
    addedVariantId = null;
    if (vendor) vendor.textContent = product.vendor || vendor.textContent || '';
    if (title) title.textContent = product.title || title.textContent || 'Product';
    if (fullLink) fullLink.href = product.url || trigger.dataset.productUrl || '#';
    if (bagLink) bagLink.hidden = true;
    if (status) status.textContent = '';

    if (product.images?.length) renderImages(product.images);

    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variantSelect) {
      variantSelect.replaceChildren();
      variants.forEach((variant) => {
        const option = document.createElement('option');
        option.value = variant.id;
        option.textContent = `${variant.title}${variant.available ? '' : ' — Sold out'}`;
        option.disabled = !variant.available;
        variantSelect.appendChild(option);
      });

      const firstAvailable = variants.find((variant) => variant.available) || variants[0];
      if (firstAvailable) variantSelect.value = String(firstAvailable.id);
      if (variantsWrap) variantsWrap.hidden = variants.length <= 1 || (variants.length === 1 && variants[0].title === 'Default Title');
      if (firstAvailable) syncVariantState();
    }

    renderArchiveMeta(trigger);
    content.hidden = false;
  };

  const open = async (trigger) => {
    const productUrl = trigger.dataset.productUrl;
    if (!productUrl) return;

    previousFocus = trigger;
    activeRequest += 1;
    const requestId = activeRequest;
    const key = normalizeProductPath(productUrl);

    renderPreview(trigger, productUrl);
    openShell();

    const cached = productCache.get(key);
    if (cached) {
      renderProduct(cached, trigger);
      return;
    }

    try {
      const product = await fetchProduct(productUrl);
      if (requestId !== activeRequest || root.hidden) return;
      renderProduct(product, trigger);
    } catch (_) {
      if (requestId !== activeRequest || root.hidden) return;
      if (status) status.textContent = 'View the full piece to choose options.';
      if (addButton) addButton.disabled = true;
    }
  };

  const prefetch = (trigger) => {
    const productUrl = trigger?.dataset?.productUrl;
    if (!productUrl) return;
    const key = normalizeProductPath(productUrl);
    if (productCache.has(key) || pendingProducts.has(key)) return;
    fetchProduct(productUrl).catch(() => {});
  };

  document.addEventListener('pointerover', (event) => {
    const trigger = event.target.closest?.('[data-quick-view-trigger]');
    if (trigger) prefetch(trigger);
  });

  document.addEventListener('focusin', (event) => {
    const trigger = event.target.closest?.('[data-quick-view-trigger]');
    if (trigger) prefetch(trigger);
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-quick-view-trigger]');
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      open(trigger);
      return;
    }

    if (event.target.closest?.('[data-quick-view-close]')) {
      event.preventDefault();
      close();
    }
  });

  variantSelect?.addEventListener('change', () => {
    if (status) status.textContent = '';
    if (bagLink) bagLink.hidden = true;
    syncVariantState();
  });

  addButton?.addEventListener('click', async () => {
    const variant = selectedVariant();
    if (!variant || addButton.disabled) return;

    addButton.disabled = true;
    if (status) status.textContent = 'Adding to bag…';

    try {
      const response = await fetch(`${shopRoot()}cart/add.js`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: Number(variant.id), quantity: 1 })
      });
      if (!response.ok) throw new Error('Cart add failed');

      addedVariantId = variant.id;
      addButton.textContent = 'Added to bag';
      addButton.disabled = true;
      if (status) status.textContent = 'Bag updated.';
      if (bagLink) bagLink.hidden = false;
      document.dispatchEvent(new CustomEvent('cart:refresh'));
    } catch (_) {
      addedVariantId = null;
      if (status) status.textContent = 'Could not add this piece. Open the full product page to try again.';
      syncVariantState();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (root.hidden) return;
    if (event.key === 'Escape') close();
  });
})();
