(() => {
  'use strict';

  const initialized = new WeakSet();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function largestImageSource(img) {
    if (!img) return '';
    const candidates = String(img.getAttribute('srcset') || '')
      .split(',')
      .map((entry) => {
        const parts = entry.trim().split(/\s+/);
        const descriptor = parts[1] || '0w';
        const score = Number.parseFloat(descriptor) || 0;
        return { src: parts[0] || '', score };
      })
      .filter((entry) => entry.src)
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.src || img.currentSrc || img.src || '';
  }

  function buildViewer(gallery) {
    let viewer = gallery.querySelector('[data-product-media-viewer]');
    if (viewer) return viewer;

    viewer = document.createElement('div');
    viewer.className = 'product-media-viewer';
    viewer.dataset.productMediaViewer = '';
    viewer.hidden = true;
    viewer.setAttribute('aria-hidden', 'true');
    viewer.innerHTML = `
      <button class="product-media-viewer__backdrop" type="button" data-product-media-viewer-close aria-label="Close full-screen image viewer"></button>
      <div class="product-media-viewer__dialog" data-product-media-viewer-dialog role="dialog" aria-modal="true" aria-label="Full-screen product image viewer" tabindex="-1">
        <div class="product-media-viewer__toolbar">
          <span class="product-media-viewer__counter" data-product-media-viewer-counter>1 / 1</span>
          <div class="product-media-viewer__controls">
            <button class="product-media-viewer__control" type="button" data-product-media-viewer-zoom-out aria-label="Zoom out">&minus;</button>
            <button class="product-media-viewer__control product-media-viewer__reset" type="button" data-product-media-viewer-reset aria-label="Reset zoom">100%</button>
            <button class="product-media-viewer__control" type="button" data-product-media-viewer-zoom-in aria-label="Zoom in">+</button>
            <button class="product-media-viewer__close" type="button" data-product-media-viewer-close aria-label="Close full-screen image viewer">&times;</button>
          </div>
        </div>
        <div class="product-media-viewer__stage" data-product-media-viewer-stage>
          <img class="product-media-viewer__image" data-product-media-viewer-image src="" alt="" draggable="false">
        </div>
        <button class="product-media-viewer__nav product-media-viewer__prev" type="button" data-product-media-viewer-prev aria-label="Previous product image">&#8592;</button>
        <button class="product-media-viewer__nav product-media-viewer__next" type="button" data-product-media-viewer-next aria-label="Next product image">&#8594;</button>
        <p class="product-media-viewer__hint">Zoom with + / &minus; or your scroll wheel. Drag the image when zoomed.</p>
      </div>`;
    gallery.appendChild(viewer);
    return viewer;
  }

  function ensureExpandButtons(gallery) {
    const items = Array.from(gallery.querySelectorAll('[data-product-media-item]'));

    items.forEach((item, itemIndex) => {
      if (item.dataset.mediaType && item.dataset.mediaType !== 'image') return;
      const img = item.querySelector('.product-media__image, img');
      if (!img) return;

      let button = item.querySelector('[data-product-media-expand]');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'product-gallery__expand';
        button.dataset.productMediaExpand = '';
        button.textContent = 'Expand';
        item.appendChild(button);
      }

      button.classList.remove('no-js-hidden');
      button.dataset.mediaId = item.dataset.mediaId || String(itemIndex);
      button.dataset.fullImage = button.dataset.fullImage || largestImageSource(img);
      button.dataset.fullAlt = button.dataset.fullAlt || img.alt || 'Product image';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-label', `Open full-size product image ${itemIndex + 1}`);
    });

    return Array.from(gallery.querySelectorAll('[data-product-media-expand]'))
      .filter((button) => button.dataset.fullImage);
  }

  function initGallery(gallery) {
    if (!gallery || initialized.has(gallery)) return;

    const expandButtons = ensureExpandButtons(gallery);
    if (!expandButtons.length) return;

    const viewer = buildViewer(gallery);
    const dialog = viewer.querySelector('[data-product-media-viewer-dialog]');
    const stage = viewer.querySelector('[data-product-media-viewer-stage]');
    const image = viewer.querySelector('[data-product-media-viewer-image]');
    const counter = viewer.querySelector('[data-product-media-viewer-counter]');
    const resetButton = viewer.querySelector('[data-product-media-viewer-reset]');
    const prevButton = viewer.querySelector('[data-product-media-viewer-prev]');
    const nextButton = viewer.querySelector('[data-product-media-viewer-next]');

    if (!dialog || !stage || !image || !counter || !resetButton) return;
    initialized.add(gallery);

    const slides = expandButtons.map((button) => ({
      mediaId: button.dataset.mediaId || '',
      src: button.dataset.fullImage || '',
      alt: button.dataset.fullAlt || 'Product image'
    })).filter((slide) => slide.src);

    if (!slides.length) return;
    document.body.appendChild(viewer);

    let index = 0;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginX = 0;
    let dragOriginY = 0;
    let previousFocus = null;

    const applyTransform = () => {
      if (zoom === 1) {
        panX = 0;
        panY = 0;
      }
      image.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
      resetButton.textContent = `${Math.round(zoom * 100)}%`;
      stage.classList.toggle('is-zoomed', zoom > 1);
    };

    const setZoom = (nextZoom) => {
      zoom = clamp(nextZoom, 1, 4);
      applyTransform();
    };

    const renderSlide = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      const slide = slides[index];
      image.src = slide.src;
      image.alt = slide.alt;
      counter.textContent = `${index + 1} / ${slides.length}`;
      prevButton?.toggleAttribute('disabled', slides.length <= 1);
      nextButton?.toggleAttribute('disabled', slides.length <= 1);
      setZoom(1);
    };

    const close = () => {
      viewer.hidden = true;
      viewer.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('product-media-viewer-open');
      document.body.classList.remove('product-media-viewer-open');
      image.removeAttribute('src');
      image.style.transform = '';
      dragging = false;
      stage.classList.remove('is-dragging', 'is-zoomed');
      previousFocus?.focus?.();
    };

    const open = (button) => {
      const slideIndex = slides.findIndex((slide) => slide.mediaId === button.dataset.mediaId);
      index = slideIndex >= 0 ? slideIndex : 0;
      previousFocus = button;
      viewer.hidden = false;
      viewer.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('product-media-viewer-open');
      document.body.classList.add('product-media-viewer-open');
      renderSlide(index);
      requestAnimationFrame(() => dialog.focus());
    };

    expandButtons.forEach((button) => button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      open(button);
    }));

    viewer.querySelectorAll('[data-product-media-viewer-close]').forEach((button) => button.addEventListener('click', close));
    viewer.querySelector('[data-product-media-viewer-zoom-in]')?.addEventListener('click', () => setZoom(zoom + .5));
    viewer.querySelector('[data-product-media-viewer-zoom-out]')?.addEventListener('click', () => setZoom(zoom - .5));
    resetButton.addEventListener('click', () => setZoom(1));
    prevButton?.addEventListener('click', () => renderSlide(index - 1));
    nextButton?.addEventListener('click', () => renderSlide(index + 1));

    stage.addEventListener('dblclick', () => setZoom(zoom > 1 ? 1 : 2));
    stage.addEventListener('wheel', (event) => {
      if (viewer.hidden) return;
      event.preventDefault();
      setZoom(zoom + (event.deltaY < 0 ? .25 : -.25));
    }, { passive: false });

    stage.addEventListener('pointerdown', (event) => {
      if (zoom <= 1 || event.button > 0) return;
      dragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragOriginX = panX;
      dragOriginY = panY;
      stage.classList.add('is-dragging');
      stage.setPointerCapture?.(event.pointerId);
    });

    stage.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      panX = dragOriginX + (event.clientX - dragStartX);
      panY = dragOriginY + (event.clientY - dragStartY);
      applyTransform();
    });

    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      stage.releasePointerCapture?.(event.pointerId);
    };

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        renderSlide(index - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        renderSlide(index + 1);
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setZoom(zoom + .5);
      } else if (event.key === '-') {
        event.preventDefault();
        setZoom(zoom - .5);
      } else if (event.key === '0') {
        event.preventDefault();
        setZoom(1);
      }
    });
  }

  function init(scope = document) {
    if (scope.matches?.('[data-product-gallery]')) initGallery(scope);
    scope.querySelectorAll?.('[data-product-gallery]').forEach(initGallery);
  }

  init();
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
