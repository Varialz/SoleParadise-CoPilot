(function () {
  'use strict';

  function setStatus(form, message, isError) {
    var status = form.querySelector('[data-footer-newsletter-status]');
    var input = form.querySelector('input[type="email"]');
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
    status.classList.toggle('field__error', !!isError);
    if (input) input.setAttribute('aria-invalid', isError ? 'true' : 'false');
  }

  function initNewsletter(form) {
    if (form.dataset.newsletterInitialized === 'true') return;
    form.dataset.newsletterInitialized = 'true';
    form.addEventListener('submit', function (event) {
      if (!form.checkValidity()) return;
      event.preventDefault();
      var button = form.querySelector('[data-footer-newsletter-submit]');
      var originalLabel = button ? button.textContent : '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Joining…';
      }
      setStatus(form, '', false);

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin',
        headers: { Accept: 'text/html' }
      }).then(function (response) {
        if (!response.ok) throw new Error('Newsletter request failed');
        var successfulRedirect = response.url.indexOf('customer_posted=true') !== -1;
        return response.text().then(function (html) {
          var rejected = /class=["'][^"']*(errors|form__message--error|field__error)/i.test(html);
          if (!successfulRedirect && rejected) throw new Error('Newsletter request rejected');
          setStatus(form, form.dataset.successMessage || 'Thanks for subscribing.', false);
          form.reset();
        });
      }).catch(function () {
        setStatus(form, form.dataset.errorMessage || 'Please check your email and try again.', true);
      }).finally(function () {
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      });
    });
  }

  window.theme = window.theme || {};
  if (window.theme.onSectionLoad) window.theme.onSectionLoad('[data-footer-newsletter-form]', initNewsletter);
  else document.querySelectorAll('[data-footer-newsletter-form]').forEach(initNewsletter);
})();
