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
  const fullLink = root.querySelector('[data-quick-view-full-link]');
  const errorLink = root.querySelector('[data-quick-view-error-link]');

  let previousFocus = null;
  let currentProduct = null;

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

  const setLoading = () => {
    loading.hidden = false;
    content.hidden = true;
    errorState.hidden = true;
    status.textContent = '';
  };

  const close = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => {
      root.hidden = true;
      document.documentElement.classList.remove('quick-view-scroll-lock');
      previousFocus?.focus?.();
    };

    if (!reduceMotion && window.gsap && panel) {
      window.gsap.to(panel, { xPercent: 100, duration: .32, ease: 'power2.in', onComplete: finish });
      window.gsap.to(root.querySelector('.sp-quick-view__backdrop'), { opacity: 0, duration: .22, ease: 'power2.in' });
    } else {
      finish();
    }
  };

  const openShell = () => {
    root.hidden = false;
    document.documentElement.classList.add('quick-view-scroll-lock');
    panel?.focus();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && window.gsap && panel) {
      window.gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: .42, ease: 'power3.out' });
      window.gsap.fromTo(root.querySelector('.sp-quick-view__backdrop'), { opacity: 0 }, { opacity: 1, duration: .26, ease: 'power2.out' });
    }
  };

  const renderImages = (images = []) => {
    thumbs.innerHTML = '';
    if (!images.length) {
      image.removeAttribute('src');
      image.alt = '';
      imageIndex.textContent = '00 / 00';
      return;
    }

    const setActive = (index) => {
      const selected = images[index];
      image.src = selected.src || selected;
      image.alt = currentProduct?.title || 'Product image';
      imageIndex.textContent = `${String(index + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
      [...thumbs.children].forEach((button, i) => button.classList.toggle('is-active', i === index));
    };

    images.slice(0, 6).forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sp-quick-view__thumb';
      button.setAttribute('aria-label', `View image ${index + 1}`);
      const img = document.createElement('img');
      img.src = entry.src || entry;
      img.alt = '';
      button.appendChild(img);
      button.addEventListener('click', () => setActive(index));
      thumbs.appendChild(button);
    });
    setActive(0);
  };

  const syncVariantState = () => {
    const variant = currentProduct?.variants?.find((item) => String(item.id) === String(variantSelect.value));
    if (!variant) return;
    price.textContent = money(variant.price);
    addButton.disabled = !variant.available;
    addButton.textContent = variant.available ? 'Add to bag' : 'Sold out';
  };

  const renderProduct = (product, trigger) => {
    currentProduct = product;
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

    const meta = [trigger.dataset.size, trigger.dataset.condition, trigger.dataset.itemState].filter(Boolean);
    if (trigger.dataset.archive === 'true' || meta.length) {
      archiveBlock.hidden = false;
      archiveId.textContent = trigger.dataset.archiveId || '1 of 1';
      archiveMeta.innerHTML = meta.map((value) => `<span>${String(value).replace(/[<>&]/g, '')}</span>`).join('');
    } else {
      archiveBlock.hidden = true;
      archiveMeta.innerHTML = '';
    }

    loading.hidden = true;
    errorState.hidden = true;
    content.hidden = false;

    if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.gsap.from(content.children, { opacity: 0, y: 12, duration: .45, stagger: .06, ease: 'power3.out' });
    }
  };

  const open = async (trigger) => {
    previousFocus = trigger;
    setLoading();
    openShell();

    const productUrl = trigger.dataset.productUrl;
    if (!productUrl) return;

    try {
      const response = await fetch(`${productUrl}.js`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Product request failed');
      const product = await response.json();
      product.url = productUrl;
      renderProduct(product, trigger);
    } catch (_) {
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

  variantSelect?.addEventListener('change', syncVariantState);

  addButton?.addEventListener('click', async () => {
    if (!variantSelect.value || addButton.disabled) return;
    addButton.disabled = true;
    status.textContent = 'Adding to bag…';
    try {
      const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: Number(variantSelect.value), quantity: 1 })
      });
      if (!response.ok) throw new Error('Cart add failed');
      status.textContent = 'Added to bag.';
      addButton.textContent = 'Added';
      document.dispatchEvent(new CustomEvent('cart:refresh'));
      setTimeout(() => {
        syncVariantState();
      }, 1200);
    } catch (_) {
      status.textContent = 'Could not add this piece. Open the full product page to try again.';
      addButton.disabled = false;
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
