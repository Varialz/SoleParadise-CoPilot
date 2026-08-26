window.theme = window.theme || {};
window.theme.onSectionLoad = function onSectionLoad(selector, init) {
  document.querySelectorAll(selector).forEach(init);
  document.addEventListener('shopify:section:load', (event) => {
    const target = event.target;
    if (target.matches(selector)) {
      init(target);
    } else {
      target.querySelectorAll(selector).forEach(init);
    }
  });
};
