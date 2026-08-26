(() => {
  const MAX_PHOTOS = 12;
  const MAX_FILE_BYTES = 20 * 1024 * 1024;

  const initPortal = (portal) => {
    const form = portal.querySelector('#SellerPortalForm');
    if (!form || portal.dataset.sellerReady === 'true') return;
    portal.dataset.sellerReady = 'true';

    const steps = [...portal.querySelectorAll('[data-seller-step]')];
    const navButtons = [...portal.querySelectorAll('[data-seller-step-nav]')];
    const nextButton = portal.querySelector('[data-seller-next]');
    const backButton = portal.querySelector('[data-seller-back]');
    const submitButton = portal.querySelector('[data-seller-submit]');
    const photoInput = portal.querySelector('[data-seller-photos]');
    const photoGrid = portal.querySelector('[data-photo-grid]');
    const photoNote = portal.querySelector('[data-photo-note]');
    const review = portal.querySelector('[data-seller-review]');
    const uploadStatus = portal.querySelector('[data-upload-status]');
    const photoUrlsField = portal.querySelector('[data-photo-urls]');
    const intakeVariantId = portal.dataset.intakeVariantId;
    const photoRelayReady = portal.dataset.photoRelayReady === 'true' && Boolean(intakeVariantId);

    let currentStep = 0;
    let selectedFiles = [];
    let uploading = false;
    let lastDirection = 1;

    const escapeHtml = (value = '') => String(value)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

    const getFieldValue = (name) => {
      const fields = [...portal.querySelectorAll(`[data-field="${name}"]`)];
      const radio = fields.find((field) => field.type === 'radio');
      if (radio) return fields.find((field) => field.checked)?.value || '';
      return fields[0]?.value?.trim() || '';
    };

    const syncHiddenFields = () => {
      portal.querySelectorAll('[data-summary-field]').forEach((field) => {
        field.value = getFieldValue(field.dataset.summaryField);
      });
    };

    const validateStep = (stepIndex) => {
      const step = steps[stepIndex];
      if (!step) return true;
      const required = [...step.querySelectorAll('[required]')];
      for (const field of required) {
        if (field.type === 'radio') {
          const group = [...step.querySelectorAll(`[name="${field.name}"]`)];
          if (!group.some((item) => item.checked)) {
            field.focus();
            return false;
          }
          continue;
        }
        if (!field.checkValidity()) {
          field.reportValidity();
          return false;
        }
      }
      if (stepIndex === 1 && selectedFiles.length < 1) {
        photoNote.textContent = 'Add at least one product photo before continuing.';
        photoInput?.focus();
        return false;
      }
      return true;
    };

    const renderStep = () => {
      let activeStep = null;
      steps.forEach((step, index) => {
        const active = index === currentStep;
        step.classList.toggle('is-active', active);
        step.hidden = !active;
        if (active) activeStep = step;
      });
      navButtons.forEach((button, index) => {
        button.classList.toggle('is-active', index === currentStep);
        button.classList.toggle('is-complete', index < currentStep);
      });
      backButton.hidden = currentStep === 0;
      nextButton.hidden = currentStep === steps.length - 1;
      submitButton.hidden = currentStep !== steps.length - 1;
      if (currentStep === steps.length - 1) renderReview();
      window.SoleParadiseMotion?.animateSellerStep?.(activeStep, lastDirection);
      portal.querySelector('.seller-portal__shell')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const rebuildInputFiles = () => {
      if (!photoInput || !window.DataTransfer) return;
      const transfer = new DataTransfer();
      selectedFiles.forEach((file) => transfer.items.add(file));
      photoInput.files = transfer.files;
    };

    const renderPhotos = () => {
      photoGrid.innerHTML = '';
      selectedFiles.forEach((file, index) => {
        const card = document.createElement('article');
        card.className = 'seller-portal__photo';
        card.draggable = true;
        card.dataset.photoIndex = index;
        const url = URL.createObjectURL(file);
        card.innerHTML = `<div class="seller-portal__photo-image"><img src="${url}" alt="Selected product photo ${index + 1}"></div><div class="seller-portal__photo-bar"><span>${String(index + 1).padStart(2, '0')}</span><div><button type="button" data-photo-move="up" aria-label="Move photo ${index + 1} earlier">←</button><button type="button" data-photo-move="down" aria-label="Move photo ${index + 1} later">→</button><button type="button" data-photo-remove aria-label="Remove photo ${index + 1}">×</button></div></div>`;
        card.querySelector('img').addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
        photoGrid.appendChild(card);
      });
      if (window.gsap && selectedFiles.length) {
        window.gsap.from(photoGrid.children, { opacity: 0, y: 12, duration: .35, stagger: .04, ease: 'power2.out' });
      }
      photoNote.textContent = `${selectedFiles.length} / ${MAX_PHOTOS} photos selected`;
      rebuildInputFiles();
    };

    const isImageFile = (file) => {
      if (file.type?.startsWith('image/')) return true;
      return /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name || '');
    };

    const addFiles = (files) => {
      const incoming = [...files];
      const existing = new Set(selectedFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
      const valid = [];
      let rejectedType = 0;
      let rejectedSize = 0;
      let duplicates = 0;

      incoming.forEach((file) => {
        if (!isImageFile(file)) {
          rejectedType += 1;
          return;
        }
        if (file.size > MAX_FILE_BYTES) {
          rejectedSize += 1;
          return;
        }
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (existing.has(key)) {
          duplicates += 1;
          return;
        }
        existing.add(key);
        valid.push(file);
      });

      const room = Math.max(0, MAX_PHOTOS - selectedFiles.length);
      const accepted = valid.slice(0, room);
      selectedFiles.push(...accepted);
      renderPhotos();

      const messages = [];
      if (valid.length > room) messages.push(`${valid.length - room} over the ${MAX_PHOTOS}-photo limit`);
      if (rejectedSize) messages.push(`${rejectedSize} over 20 MB`);
      if (rejectedType) messages.push(`${rejectedType} unsupported file type`);
      if (duplicates) messages.push(`${duplicates} duplicate`);
      if (messages.length) photoNote.textContent = `${selectedFiles.length} / ${MAX_PHOTOS} selected · Skipped ${messages.join(', ')}.`;
    };

    const renderReview = () => {
      syncHiddenFields();
      const rows = [
        ['Intent', getFieldValue('submission_type')],
        ['Brand', getFieldValue('brand')],
        ['Piece', getFieldValue('item')],
        ['Size', getFieldValue('size') || 'Not provided'],
        ['Condition', getFieldValue('condition')],
        ['Photos', `${selectedFiles.length} selected${photoRelayReady ? '' : ' · demo preview'}`]
      ];
      review.innerHTML = `<p class="sp-kicker">Review</p><div class="seller-portal__review-grid">${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>`;
    };

    const uploadPhotosToShopify = async () => {
      if (!selectedFiles.length || !photoRelayReady) return [];
      const data = new FormData();
      data.append('id', intakeVariantId);
      data.append('quantity', '1');
      data.append('properties[_Seller intake]', 'Sell to Paradise');
      selectedFiles.forEach((file, index) => data.append(`properties[Photo ${String(index + 1).padStart(2, '0')}]`, file, file.name));

      const root = window.Shopify?.routes?.root || '/';
      const response = await fetch(`${root}cart/add.js`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      });
      if (!response.ok) throw new Error('We could not upload the photos to Shopify. Please try again.');

      const item = await response.json();
      const urls = Object.entries(item.properties || {})
        .filter(([key]) => key.startsWith('Photo '))
        .map(([key, value]) => `${key}: ${value}`);

      if (item.key) {
        fetch(`${root}cart/change.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ id: item.key, quantity: 0 })
        }).catch(() => {});
      }

      if (!urls.length) throw new Error('Shopify accepted the upload, but no photo links were returned. Please try again.');
      return urls;
    };

    nextButton?.addEventListener('click', () => {
      if (!validateStep(currentStep)) return;
      syncHiddenFields();
      lastDirection = 1;
      currentStep = Math.min(currentStep + 1, steps.length - 1);
      renderStep();
    });

    backButton?.addEventListener('click', () => {
      lastDirection = -1;
      currentStep = Math.max(currentStep - 1, 0);
      renderStep();
    });

    navButtons.forEach((button, index) => button.addEventListener('click', () => {
      if (index > currentStep) return;
      lastDirection = index < currentStep ? -1 : 1;
      currentStep = index;
      renderStep();
    }));

    photoInput?.addEventListener('change', (event) => addFiles(event.target.files || []));

    const dropzone = portal.querySelector('.seller-portal__dropzone');
    ['dragenter', 'dragover'].forEach((eventName) => dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragging');
    }));
    ['dragleave', 'drop'].forEach((eventName) => dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragging');
    }));
    dropzone?.addEventListener('drop', (event) => addFiles(event.dataTransfer?.files || []));

    photoGrid?.addEventListener('click', (event) => {
      const card = event.target.closest('[data-photo-index]');
      if (!card) return;
      const index = Number(card.dataset.photoIndex);
      if (event.target.closest('[data-photo-remove]')) selectedFiles.splice(index, 1);
      if (event.target.closest('[data-photo-move="up"]') && index > 0) [selectedFiles[index - 1], selectedFiles[index]] = [selectedFiles[index], selectedFiles[index - 1]];
      if (event.target.closest('[data-photo-move="down"]') && index < selectedFiles.length - 1) [selectedFiles[index + 1], selectedFiles[index]] = [selectedFiles[index], selectedFiles[index + 1]];
      renderPhotos();
    });

    let draggedIndex = null;
    photoGrid?.addEventListener('dragstart', (event) => {
      const card = event.target.closest('[data-photo-index]');
      if (!card) return;
      draggedIndex = Number(card.dataset.photoIndex);
      card.classList.add('is-dragging');
    });
    photoGrid?.addEventListener('dragover', (event) => event.preventDefault());
    photoGrid?.addEventListener('drop', (event) => {
      event.preventDefault();
      const target = event.target.closest('[data-photo-index]');
      if (target && draggedIndex !== null) {
        const targetIndex = Number(target.dataset.photoIndex);
        const [moved] = selectedFiles.splice(draggedIndex, 1);
        selectedFiles.splice(targetIndex, 0, moved);
        renderPhotos();
      }
      draggedIndex = null;
    });

    form.addEventListener('submit', async (event) => {
      if (uploading) {
        event.preventDefault();
        return;
      }
      if (!validateStep(currentStep)) {
        event.preventDefault();
        return;
      }
      syncHiddenFields();
      event.preventDefault();
      uploading = true;
      submitButton.disabled = true;

      if (!photoRelayReady) {
        photoUrlsField.value = `Demo mode: ${selectedFiles.length} product photo(s) were selected and previewed in-browser. Shopify photo relay is not configured on this theme instance yet.`;
        uploadStatus.textContent = 'Demo mode: sending piece details. Photo relay will activate when the intake product is assigned.';
        HTMLFormElement.prototype.submit.call(form);
        return;
      }

      uploadStatus.textContent = 'Uploading your photos securely through Shopify…';
      try {
        const urls = await uploadPhotosToShopify();
        photoUrlsField.value = urls.join('\n');
        uploadStatus.textContent = 'Photos uploaded. Sending your submission…';
        HTMLFormElement.prototype.submit.call(form);
      } catch (error) {
        uploadStatus.textContent = error.message || 'Something went wrong. Your submission was not sent.';
        submitButton.disabled = false;
        uploading = false;
      }
    });

    renderStep();
  };

  const initPortals = (scope = document) => {
    if (scope.matches?.('[data-seller-portal]')) initPortal(scope);
    scope.querySelectorAll?.('[data-seller-portal]').forEach(initPortal);
  };

  initPortals();
  document.addEventListener('shopify:section:load', (event) => initPortals(event.target));
})();
