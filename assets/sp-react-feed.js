import React, { useEffect, useMemo, useRef, useState } from 'https://esm.sh/react@19.1.1';
import { createRoot } from 'https://esm.sh/react-dom@19.1.1/client';

const h = React.createElement;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mountedFeedRoots = new WeakMap();

function ArrowIcon({ direction = 1 }) {
  return h(
    'svg',
    { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' },
    h('path', { d: direction > 0 ? 'M5 12h14M14 7l5 5-5 5' : 'M19 12H5m5-5-5 5 5 5' })
  );
}

function FeedCard({ product, index, active, onQuickView, onActivate }) {
  const [pointer, setPointer] = useState({ x: 0, y: 0, inside: false });
  const wide = index % 4 === 0;
  const imageTransform = pointer.inside
    ? `translate3d(${pointer.x * 4}px, ${pointer.y * 4}px, 0) scale(1.045)`
    : 'translate3d(0,0,0) scale(1.015)';

  const onPointerMove = (event) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
    const y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
    setPointer({ x, y, inside: true });
  };

  const sourceLabel = product.sourceLabel || product.archiveId || String(index + 1).padStart(2, '0');

  return h(
    'article',
    {
      className: [
        'sp-feed-card group relative snap-start select-none transition-opacity duration-500',
        wide ? 'min-w-[78vw] sm:min-w-[52vw] md:min-w-[36vw] xl:min-w-[26vw]' : 'min-w-[64vw] sm:min-w-[44vw] md:min-w-[29vw] xl:min-w-[20vw]',
        active ? 'opacity-100' : 'opacity-75 hover:opacity-100'
      ].join(' '),
      'data-active': active ? 'true' : 'false',
      onFocus: onActivate,
      onMouseEnter: onActivate
    },
    h(
      'div',
      {
        className: 'relative overflow-hidden bg-[#f3f3ef] aspect-[4/5] cursor-pointer',
        onPointerMove,
        onPointerLeave: () => setPointer({ x: 0, y: 0, inside: false })
      },
      h('img', {
        ref: (node) => node?.setAttribute('draggable', 'false'),
        src: product.image,
        alt: product.alt || product.title,
        loading: index < 2 ? 'eager' : 'lazy',
        className: 'absolute inset-0 h-full w-full object-cover will-change-transform transition-[transform,filter] duration-700 ease-out',
        style: { transform: imageTransform }
      }),
      h('div', { className: 'pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100' }),
      h('span', { className: 'absolute left-3 top-3 inline-flex items-center bg-[#07111b]/90 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm' }, sourceLabel),
      h(
        'div',
        { className: 'absolute inset-x-0 bottom-0 translate-y-2 p-4 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100' },
        h('p', { className: 'text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b9d8ff]' }, product.vendor || 'Sole Paradise'),
        h('h3', { className: 'mt-1 max-w-[24ch] text-[13px] font-medium leading-tight' }, product.title),
        h(
          'div',
          { className: 'mt-3 flex items-center gap-2' },
          h('button', { type: 'button', onClick: (event) => { event.preventDefault(); event.stopPropagation(); onQuickView(product); }, className: 'inline-flex min-h-9 items-center justify-center bg-white px-3 text-[8px] font-bold uppercase tracking-[0.1em] text-[#07111b] transition hover:bg-[#1769d2] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white' }, 'Quick view'),
          h('a', { href: product.url, className: 'inline-flex min-h-9 items-center justify-center border border-white/40 px-3 text-[8px] font-bold uppercase tracking-[0.1em] text-white transition hover:border-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white' }, 'View piece')
        )
      )
    ),
    h(
      'div',
      { className: 'mt-2 flex items-start justify-between gap-3' },
      h(
        'div',
        { className: 'min-w-0' },
        h('p', { className: 'truncate text-[9px] font-bold uppercase tracking-[0.1em] text-[#1769d2]' }, product.vendor || 'Sole Paradise'),
        h('p', { className: 'mt-1 truncate text-[11px] font-medium text-[#11151a]' }, product.title),
        h('div', { className: 'mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[8px] uppercase tracking-[0.08em] text-[#7b8188]' }, product.size ? h('span', null, product.size) : null, product.condition ? h('span', null, product.condition) : null, product.itemState ? h('span', null, product.itemState) : null)
      ),
      h('span', { className: 'shrink-0 text-[11px] font-semibold text-[#11151a]' }, product.price)
    )
  );
}

function FeedIsland({ products, onQuickView }) {
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const drag = useRef({ active: false, x: 0, left: 0, moved: false });
  const [activeIndex, setActiveIndex] = useState(0);
  const totalLabel = useMemo(() => String(products.length).padStart(2, '0'), [products.length]);
  const activeLabel = String(activeIndex + 1).padStart(2, '0');

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        setActiveIndex(Number(visible.target.dataset.index || 0));
      },
      { root: rail, threshold: [0.35, 0.55, 0.75] }
    );
    cardRefs.current.filter(Boolean).forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [products.length]);

  useEffect(() => {
    const rail = railRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!rail || reduceMotion) return undefined;

    let ctx = null;
    const runEntranceMotion = () => {
      if (ctx || !rail.isConnected || !window.gsap || !window.ScrollTrigger) return;
      window.gsap.registerPlugin?.(window.ScrollTrigger);
      ctx = window.gsap.context(() => {
        window.gsap.from(cardRefs.current.filter(Boolean), {
          opacity: 0,
          y: 26,
          duration: 0.72,
          stagger: 0.055,
          ease: 'power3.out',
          scrollTrigger: { trigger: rail, start: 'top 88%', once: true }
        });
      }, rail);
    };

    runEntranceMotion();
    if (!ctx) window.addEventListener('load', runEntranceMotion, { once: true });

    return () => {
      window.removeEventListener('load', runEntranceMotion);
      ctx?.revert?.();
    };
  }, [products.length]);

  const scrollByPage = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({ left: rail.clientWidth * 0.76 * direction, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;
    drag.current = { active: true, x: event.clientX, left: rail.scrollLeft, moved: false };
    rail.setPointerCapture?.(event.pointerId);
    rail.classList.add('is-dragging');
  };

  const onPointerMove = (event) => {
    const rail = railRef.current;
    if (!rail || !drag.current.active) return;
    const delta = event.clientX - drag.current.x;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    rail.scrollLeft = drag.current.left - delta;
  };

  const endDrag = (event) => {
    const rail = railRef.current;
    if (!rail) return;
    drag.current.active = false;
    rail.releasePointerCapture?.(event.pointerId);
    rail.classList.remove('is-dragging');
  };

  const onClickCapture = (event) => {
    if (!drag.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current.moved = false;
  };

  return h(
    'div',
    { className: 'relative isolate overflow-hidden' },
    h(
      'div',
      { className: 'mb-4 flex items-end justify-between gap-4' },
      h('p', { className: 'font-mono text-[9px] uppercase tracking-[0.14em] text-[#7b8188]' }, h('span', { className: 'text-[#1769d2]' }, activeLabel), ' / ', totalLabel, ' · current rotation'),
      h(
        'div',
        { className: 'hidden gap-2 sm:flex' },
        h('button', { type: 'button', onClick: () => scrollByPage(-1), className: 'inline-flex size-10 items-center justify-center border border-[#dfe4ea] bg-white text-[#07111b] transition hover:border-[#07111b] hover:bg-[#07111b] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1769d2]', 'aria-label': 'Previous pieces' }, h(ArrowIcon, { direction: -1 })),
        h('button', { type: 'button', onClick: () => scrollByPage(1), className: 'inline-flex size-10 items-center justify-center border border-[#dfe4ea] bg-white text-[#07111b] transition hover:border-[#07111b] hover:bg-[#07111b] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1769d2]', 'aria-label': 'Next pieces' }, h(ArrowIcon, { direction: 1 }))
      )
    ),
    h(
      'div',
      {
        ref: railRef,
        className: 'sp-feed-rail flex cursor-grab snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-3 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        onPointerDown,
        onPointerMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
        onClickCapture
      },
      products.map((product, index) => h('div', { key: `${product.url}-${index}`, ref: (node) => { cardRefs.current[index] = node; }, 'data-index': index, className: 'contents' }, h(FeedCard, { product, index, active: activeIndex === index, onActivate: () => setActiveIndex(index), onQuickView })))
    )
  );
}

function unmountFeed(host) {
  if (!host) return;
  const root = mountedFeedRoots.get(host);
  if (root) {
    root.unmount();
    mountedFeedRoots.delete(host);
  }
  const section = host.closest?.('[data-sp-feed]');
  const fallback = section?.querySelector('[data-sp-feed-fallback]');
  host.removeAttribute('data-react-mounted');
  host.hidden = true;
  if (section) section.removeAttribute('data-react-feed-mounted');
  fallback?.removeAttribute('aria-hidden');
}

function mountFeed(host) {
  if (!host || host.dataset.reactMounted === 'true') return;
  const dataNode = host.querySelector('[data-sp-react-feed-data]');
  if (!dataNode) return;

  let payload;
  try { payload = JSON.parse(dataNode.textContent || '{}'); } catch (_) { return; }
  const products = Array.isArray(payload.products) ? payload.products.filter((product) => product?.url && product?.image) : [];
  if (!products.length) return;

  const section = host.closest('[data-sp-feed]');
  const fallback = section?.querySelector('[data-sp-feed-fallback]');
  const shadow = host.attachShadow({ mode: 'open' });
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = host.dataset.styleUrl;
  const mountNode = document.createElement('div');
  mountNode.className = 'sp-react-feed-root';
  shadow.append(stylesheet, mountNode);

  const openQuickView = (product) => {
    const triggers = [...(section?.querySelectorAll('[data-quick-view-trigger]') || [])];
    const trigger = triggers.find((candidate) => candidate.dataset.productUrl === product.url);
    if (trigger) { trigger.click(); return; }
    window.location.assign(product.url);
  };

  const activate = () => {
    if (!host.isConnected || host.dataset.reactMounted === 'true') return;
    const root = createRoot(mountNode);
    mountedFeedRoots.set(host, root);
    root.render(h(FeedIsland, { products, onQuickView: openQuickView }));
    host.hidden = false;
    host.dataset.reactMounted = 'true';
    if (section) section.dataset.reactFeedMounted = 'true';
    if (fallback) fallback.setAttribute('aria-hidden', 'true');
  };

  stylesheet.addEventListener('load', activate, { once: true });
  stylesheet.addEventListener('error', () => {
    unmountFeed(host);
    shadow.replaceChildren();
  }, { once: true });
  if (stylesheet.sheet) activate();
}

function mountAllFeeds(scope = document) {
  if (scope.matches?.('[data-sp-react-feed]')) mountFeed(scope);
  scope.querySelectorAll?.('[data-sp-react-feed]').forEach(mountFeed);
}

function unmountAllFeeds(scope = document) {
  if (scope.matches?.('[data-sp-react-feed]')) unmountFeed(scope);
  scope.querySelectorAll?.('[data-sp-react-feed]').forEach(unmountFeed);
}

mountAllFeeds();
document.addEventListener('shopify:section:load', (event) => mountAllFeeds(event.target));
document.addEventListener('shopify:section:unload', (event) => unmountAllFeeds(event.target));
