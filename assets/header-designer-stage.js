(() => {
  'use strict';

  function initStage(stage) {
    if (!stage || stage.dataset.designerStageInitialized === 'true') return;
    stage.dataset.designerStageInitialized = 'true';

    const buttons = [...stage.querySelectorAll('[data-designer-stage-brand]')];
    const mediaItems = [...stage.querySelectorAll('[data-designer-stage-media]')];
    const nameTarget = stage.querySelector('[data-designer-stage-name]');
    const productTarget = stage.querySelector('[data-designer-stage-product]');
    const shopTarget = stage.querySelector('[data-designer-stage-shop]');
    const indexTarget = stage.querySelector('[data-designer-stage-index]');
    const watermarkTarget = stage.querySelector('[data-designer-stage-watermark]');

    if (!buttons.length || !mediaItems.length) return;

    function activate(handle) {
      if (!handle) return;
      const media = mediaItems.find((item) => item.getAttribute('data-designer-stage-media') === handle);
      if (!media) return;

      const name = media.getAttribute('data-designer-name') || 'Designer';
      const url = media.getAttribute('data-designer-url') || '#';
      const product = media.getAttribute('data-designer-product') || 'Current inventory';
      const index = String(media.getAttribute('data-designer-index') || '1').padStart(2, '0');
      const total = String(media.getAttribute('data-designer-total') || mediaItems.length).padStart(2, '0');

      mediaItems.forEach((item) => {
        item.classList.toggle('is-active', item === media);
      });

      buttons.forEach((button) => {
        const active = button.getAttribute('data-designer-stage-brand') === handle;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (nameTarget) nameTarget.textContent = name;
      if (productTarget) productTarget.textContent = product;
      if (watermarkTarget) watermarkTarget.textContent = name;
      if (indexTarget) indexTarget.textContent = `${index} / ${total}`;
      if (shopTarget) {
        shopTarget.href = url;
        shopTarget.textContent = `Shop ${name} →`;
        shopTarget.setAttribute('aria-label', `Shop ${name}`);
      }

      stage.setAttribute('data-active-designer', handle);
    }

    buttons.forEach((button) => {
      const handle = button.getAttribute('data-designer-stage-brand');
      button.addEventListener('mouseenter', () => activate(handle));
      button.addEventListener('focus', () => activate(handle));
      button.addEventListener('click', () => activate(handle));
      button.addEventListener('pointerdown', () => activate(handle), { passive: true });
    });

    const initial = mediaItems.find((item) => item.classList.contains('is-active')) || mediaItems[0];
    activate(initial.getAttribute('data-designer-stage-media'));
  }

  function initAll(scope = document) {
    if (scope.matches?.('[data-designer-stage]')) initStage(scope);
    scope.querySelectorAll?.('[data-designer-stage]').forEach(initStage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll(), { once: true });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
