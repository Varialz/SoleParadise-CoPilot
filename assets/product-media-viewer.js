(() => {
  'use strict';

  const initialized = new WeakSet();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function initGallery(gallery) {
    if (!gallery || initialized.has(gallery)) return;
    initialized.add(gallery);

    const viewer = gallery.querySelector('[data-product-media-viewer]');
    const dialog = viewer?.querySelector('[data-product-media-viewer-dialog]');
    const stage = viewer?.querySelector('[data-product-media-viewer-stage]');
    const image = viewer?.querySelector('[data-product-media-viewer-image]');
    const counter = viewer?.querySelector('[data-product-media-viewer-counter]');
    const resetButton = viewer?.querySelector('[data-product-media-viewer-reset]');
    const prevButton = viewer?.querySelector('[data-product-media-viewer-prev]');
    const nextButton = viewer?.querySelector('[data-product-media-viewer-next]');
    const expandButtons = Array.from(gallery.querySelectorAll('[data-product-media-expand]'));

    if (!viewer || !dialog || !stage || !image || !counter || !resetButton || !expandButtons.length) return;

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
      image.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
      resetButton.textContent = `${Math.round(zoom * 100)}%`;
      stage.classList.toggle('is-zoomed', zoom > 1);
      if (zoom === 1) {
        panX = 0;
        panY = 0;
      }
    };

    const setZoom = (nextZoom) => {
      zoom = clamp(nextZoom, 1, 4);
      if (zoom === 1) {
        panX = 0;
        panY = 0;
      }
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

    viewer.querySelectorAll('[data-product-media-viewer-close]').forEach((button) => {
      button.addEventListener('click', close);
    });

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
