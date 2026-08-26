(() => {
  const portals = document.querySelectorAll('[data-seller-portal]');
  if (!portals.length) return;

  portals.forEach((portal) => {
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

    let currentStep = 0;
    let selectedFiles = [];
    let uploading = false;

    const escapeHtml = (value = '') => String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

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
        photoInput.focus();
        return false;
      }
      return true;
    };

    const renderStep = () => {
      steps.forEach((step, index) => {
        const active = index === currentStep;
        step.classList.toggle('is-active', active);
        step.hidden = !active;
      });
      navButtons.forEach((button, index) => {
        button.classList.toggle('is-active', index === currentStep);
        button.classList.toggle('is-complete', index < currentStep);
      });
      backButton.hidden = currentStep === 0;
      nextButton.hidden = currentStep === steps.length - 1;
      submitButton.hidden = currentStep !== steps.length - 1;
      if (currentStep === steps.length - 1) renderReview();
      portal.querySelector('.seller-portal__shell')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const rebuildInputFiles = () => {
      if (!window.DataTransfer) return;
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
        card.innerHTML = `
          <div class="seller-portal__photo-image"><img src="${url}" alt="Selected product photo ${index + 1}"></div>
          <div class="seller-portal__photo-bar">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div>
              <button type="button" data-photo-move="up" aria-label="Move photo ${index + 1} earlier">←</button>
              <button type="button" data-photo-move="down" aria-label="Move photo ${index + 1} later">→</button>
              <button type="button" data-photo-remove aria-label="Remove photo ${index + 1}">×</button>
            </div>
          </div>`;
        card.querySelector('img').addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
        photoGrid.appendChild(card);
      });
      photoNote.textContent = `${selectedFiles.length} / 12 photos selected`;
      rebuildInputFiles();
    };

    const addFiles = (files) => {
      const incoming = [...files].filter((file) => file.type.startsWith('image/'));
      const room = Math.max(0, 12 - selectedFiles.length);
      selectedFiles.push(...incoming.slice(0, room));
      renderPhotos();
      if (incoming.length > room) photoNote.textContent = `Maximum 12 photos. ${incoming.length - room} file(s) were not added.`;
    };

    const renderReview = () => {
      syncHiddenFields();
      const rows = [
        ['Intent', getFieldValue('submission_type')],
        ['Brand', getFieldValue('brand')],
        ['Piece', getFieldValue('item')],
        ['Size', getFieldValue('size') || 'Not provided'],
        ['Condition', getFieldValue('condition')],
        ['Photos', `${selectedFiles.length} selected`]
      ];
      review.innerHTML = `<p class="sp-kicker">Review</p><div class="seller-portal__review-grid">${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>`;
    };

    const uploadPhotosToShopify = async () => {
      if (!selectedFiles.length) return [];
      if (!intakeVariantId) throw new Error('Photo intake is not configured yet. Please contact Sole Paradise before submitting.');

      const data = new FormData();
      data.append('id', intakeVariantId);
      data.append('quantity', '1');
      data.append('properties[_Seller intake]', 'Sell to Paradise');
      selectedFiles.forEach((file, index) => {
        data.append(`properties[Photo ${String(index + 1).padStart(2, '0')}]`, file, file.name);
      });

      const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
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
        fetch(`${window.Shopify?.routes?.root || '/'}cart/change.js`, {
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
      currentStep = Math.min(currentStep + 1, steps.length - 1);
      renderStep();
    });

    backButton?.addEventListener('click', () => {
      currentStep = Math.max(currentStep - 1, 0);
      renderStep();
    });

    navButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        if (index > currentStep) return;
        currentStep = index;
        renderStep();
      });
    });

    photoInput?.addEventListener('change', (event) => {
      selectedFiles = [];
      addFiles(event.target.files || []);
    });

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

      if (!selectedFiles.length) return;
      event.preventDefault();
      uploading = true;
      submitButton.disabled = true;
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
  });
})();
