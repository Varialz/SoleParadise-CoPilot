(() => {
  'use strict';

  const root = document.querySelector('[data-quick-view]');
  if (!root) return;

  const panel = root.querySelector('[data-quick-view-panel]');
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
  let requestController = null;
  let addedVariantId = null;

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

  const setLoading = () => {
    loading.hidden = false;
    content.hidden = true;
    errorState.hidden = true;
    status.textContent = '';
    bagLink.hidden = true;
    addedVariantId = null;
  };

  const finishClose = () => {
    root.hidden = true;
    document.documentElement.classList.remove('quick-view-scroll-lock');
    previousFocus?.focus?.();
  };

  const close = () => {
    activeRequest += 1;
    requestController?.abort();
    requestController = null;

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
    imageIndex.textContent = `${String(boundedIndex + 1).padStart(2, '0')} / ${String(currentImages.length).padStart(2, '0')}`;
    [...thumbs.children].forEach((button, i) => button.classList.toggle('is-active', i === boundedIndex));
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
    addedVariantId = null;
    bagLink.hidden = true;
    vendor.textContent = product.vendor || '';
    title.textContent = product.title || 'Untitled piece';
    fullLink.href = product.url || trigger.dataset.productUrl || '#';
    errorLink.href = fullLink.href;

    renderImages(product.images || []);

    variantSelect.innerHTML = '';
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

    loading.hidden = true;
    errorState.hidden = true;
    content.hidden = false;

    if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.gsap.from(content.children, { opacity: 0, y: 10, duration: .4, stagger: .05, ease: 'power3.out' });
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
      const response = await fetch(`${productUrl}.js`, {
        headers: { Accept: 'application/json' },
        signal: requestController.signal
      });
      if (!response.ok) throw new Error('Product request failed');
      const product = await response.json();
      if (requestId !== activeRequest || root.hidden) return;
      product.url = productUrl;
      renderProduct(product, trigger);
    } catch (error) {
      if (error.name === 'AbortError' || requestId !== activeRequest) return;
      loading.hidden = true;
      content.hidden = true;
      errorState.hidden = false;
      errorLink.href = productUrl;
    }
  };

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
