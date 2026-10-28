/**
 * ScreenShift Touch Simulator Content Script
 * Injected into framed web pages to emulate mobile touch interactions:
 * 1. Renders a realistic circular mobile touch cursor that tracks the finger position.
 * 2. Implements drag-to-scroll (swipe gestures) without triggering unwanted text selection.
 * 3. Translates mouse clicks and drags into native Touch events (touchstart, touchmove, touchend).
 * 4. Suppresses click events when a drag-scroll gesture is performed.
 */

(function initTouchSimulator() {
  // Only activate touch emulation when inside an iframe or simulator context
  const isFramed = window.self !== window.top;
  if (!isFramed) {
    return;
  }

  let touchEnabled = true;
  let isPointerDown = false;
  let isMirroringScroll = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let hasDragged = false;
  let cursorEl: HTMLDivElement | null = null;

  // Hide desktop scrollbars on framed pages for an authentic mobile look
  function injectHideScrollbarStyle() {
    const styleId = 'screenshift-hide-scrollbar';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
      }
      * {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
      html, body {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
        overflow-y: auto !important;
      }
    `;
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        (document.head || document.documentElement)?.appendChild(style);
      });
    }
  }

  injectHideScrollbarStyle();

  // Make mouse pointer cursor when touch mode is active
  function updateTouchPointerStyle(enabled: boolean) {
    const styleId = 'screenshift-touch-pointer';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (enabled) {
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          html, body, *, a, button, input, select, textarea, div, p, span {
            cursor: pointer !important;
          }
        `;
        (document.head || document.documentElement)?.appendChild(style);
      }
    } else {
      if (style) {
        style.remove();
      }
    }
  }

  updateTouchPointerStyle(touchEnabled);

  // Injects dynamic CSS environment variables for safe-area insets
  function injectSafeAreaStyles(
    insets: { top: number; right: number; bottom: number; left: number },
    rotationAngle: number = 0
  ) {
    const styleId = 'screenshift-safe-area-env';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      (document.head || document.documentElement)?.appendChild(style);
    }

    style.textContent = `
      :root {
        --safe-area-inset-top: ${insets.top}px !important;
        --safe-area-inset-right: ${insets.right}px !important;
        --safe-area-inset-bottom: ${insets.bottom}px !important;
        --safe-area-inset-left: ${insets.left}px !important;
        --screenshift-safe-area-top: ${insets.top}px !important;
        --screenshift-safe-area-right: ${insets.right}px !important;
        --screenshift-safe-area-bottom: ${insets.bottom}px !important;
        --screenshift-safe-area-left: ${insets.left}px !important;
        --screenshift-rotation: ${rotationAngle}deg !important;
      }
    `;
  }

  // Initialize cursor indicator
  function createTouchCursor() {
    if (cursorEl) return cursorEl;

    cursorEl = document.createElement('div');
    cursorEl.id = 'screenshift-touch-cursor';
    cursorEl.style.position = 'fixed';
    cursorEl.style.pointerEvents = 'none';
    cursorEl.style.zIndex = '2147483647';
    cursorEl.style.width = '36px';
    cursorEl.style.height = '36px';
    cursorEl.style.borderRadius = '50%';
    cursorEl.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
    cursorEl.style.border = '1.5px solid rgba(255, 255, 255, 0.8)';
    cursorEl.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    cursorEl.style.transform = 'translate(-50%, -50%)';
    cursorEl.style.transition = 'transform 0.08s ease, background 0.15s ease, border-color 0.15s ease, opacity 0.2s ease';
    cursorEl.style.display = 'none';
    cursorEl.style.backdropFilter = 'blur(1px)';

    if (document.body) {
      document.body.appendChild(cursorEl);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body?.appendChild(cursorEl!);
      });
    }

    return cursorEl;
  }

  function setCursorActive(active: boolean) {
    if (!cursorEl) return;
    if (active) {
      cursorEl.style.backgroundColor = 'rgba(59, 130, 246, 0.5)';
      cursorEl.style.borderColor = 'rgba(96, 165, 250, 0.95)';
      cursorEl.style.transform = 'translate(-50%, -50%) scale(0.85)';
      cursorEl.style.boxShadow = '0 0 16px rgba(59, 130, 246, 0.6)';
    } else {
      cursorEl.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
      cursorEl.style.borderColor = 'rgba(255, 255, 255, 0.8)';
      cursorEl.style.transform = 'translate(-50%, -50%) scale(1)';
      cursorEl.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    }
  }

  function setCursorPosition(x: number, y: number) {
    if (!cursorEl) createTouchCursor();
    if (!cursorEl) return;

    cursorEl.style.display = touchEnabled ? 'block' : 'none';
    cursorEl.style.left = `${x}px`;
    cursorEl.style.top = `${y}px`;
  }

  // Find scrollable parent or window
  function getScrollTarget(el: HTMLElement | null): Element | Window {
    let curr = el;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      const overflowY = window.getComputedStyle(curr).overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && curr.scrollHeight > curr.clientHeight) {
        return curr;
      }
      curr = curr.parentElement;
    }
    return window;
  }

  // Pointer & Touch Events Simulation
  window.addEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      if (!touchEnabled || e.button !== 0) return;

      isPointerDown = true;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      hasDragged = false;

      setCursorActive(true);
      setCursorPosition(e.clientX, e.clientY);
    },
    { capture: true }
  );

  window.addEventListener(
    'pointermove',
    (e: PointerEvent) => {
      if (!touchEnabled) return;

      setCursorPosition(e.clientX, e.clientY);

      if (isPointerDown) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);

        if (totalDist > 4) {
          hasDragged = true;
        }

        if (hasDragged) {
          // Prevent text selection while dragging
          e.preventDefault();

          // Scroll target or window (Mobile drag-to-scroll: moving finger UP scrolls content DOWN)
          const target = getScrollTarget(e.target as HTMLElement);
          if (target === window) {
            window.scrollBy({ left: -dx, top: -dy, behavior: 'instant' });
          } else {
            (target as Element).scrollBy({ left: -dx, top: -dy, behavior: 'instant' });
          }
        }

        lastX = e.clientX;
        lastY = e.clientY;
      }
    },
    { capture: true }
  );

  window.addEventListener(
    'pointerup',
    (e: PointerEvent) => {
      if (!touchEnabled) return;

      setCursorActive(false);

      if (isPointerDown && hasDragged) {
        // Prevent click trigger after drag-scroll
        const cancelClick = (ev: MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          window.removeEventListener('click', cancelClick, true);
        };
        window.addEventListener('click', cancelClick, true);
      }

      isPointerDown = false;
      hasDragged = false;
    },
    { capture: true }
  );

  window.addEventListener('pointerleave', () => {
    if (cursorEl) {
      cursorEl.style.display = 'none';
    }
    setCursorActive(false);
    isPointerDown = false;
  });

  // Track scroll position to synchronize across multi-device frames
  window.addEventListener(
    'scroll',
    () => {
      if (isMirroringScroll) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(
        doc ? doc.scrollHeight : 0,
        document.body ? document.body.scrollHeight : 0
      ) - window.innerHeight;
      if (maxScroll > 0) {
        const scrollTop = window.scrollY || (doc ? doc.scrollTop : 0) || 0;
        const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));
        window.parent.postMessage({ type: 'SCREENSHIFT_SCROLL_PERCENTAGE', ratio }, '*');
      }
    },
    { passive: true }
  );

  // Synchronized Navigation & Routing across multi-device frames
  let lastNotifiedUrl = window.location.href;
  let isSyncingRoute = false;

  function notifyRouteChange(url: string) {
    if (isSyncingRoute) return;
    try {
      const resolved = new URL(url, window.location.href).href;
      if (resolved === lastNotifiedUrl) return;
      lastNotifiedUrl = resolved;
      window.parent.postMessage({ type: 'SCREENSHIFT_ROUTE_CHANGE', url: resolved }, '*');
    } catch {
      // ignore
    }
  }

  // Intercept anchor clicks
  document.addEventListener(
    'click',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;
      if (anchor && anchor.href && !anchor.href.startsWith('javascript:')) {
        if (anchor.target === '_blank') {
          anchor.target = '_self';
        }
        notifyRouteChange(anchor.href);
      }
    },
    true
  );

  // Monkeypatch history.pushState & history.replaceState for SPA frameworks
  try {
    const origPushState = history.pushState;
    history.pushState = function (...args) {
      const result = origPushState.apply(this, args);
      notifyRouteChange(window.location.href);
      return result;
    };

    const origReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      const result = origReplaceState.apply(this, args);
      notifyRouteChange(window.location.href);
      return result;
    };

    window.addEventListener('popstate', () => {
      notifyRouteChange(window.location.href);
    });

    window.addEventListener('hashchange', () => {
      notifyRouteChange(window.location.href);
    });
  } catch {
    // ignore
  }

  // Check initial setting from chrome.storage if available
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['screenshift_touchMode'], (res) => {
        if (res.screenshift_touchMode !== undefined) {
          touchEnabled = Boolean(res.screenshift_touchMode);
        }
      });

      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.screenshift_touchMode) {
          touchEnabled = Boolean(changes.screenshift_touchMode.newValue);
          updateTouchPointerStyle(touchEnabled);
          if (cursorEl) {
            cursorEl.style.display = touchEnabled ? 'block' : 'none';
          }
        }
      });
    }
  } catch (err) {
    // ignore
  }

  // Listen to direct messages from parent simulator viewer
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SCREENSHIFT_TOUCH_MODE') {
      touchEnabled = Boolean(event.data.enabled);
      updateTouchPointerStyle(touchEnabled);
      if (cursorEl) {
        cursorEl.style.display = touchEnabled ? 'block' : 'none';
      }
    }

    if (event.data.type === 'SCREENSHIFT_SYNC_ROUTE') {
      const targetUrl = event.data.url;
      if (targetUrl) {
        try {
          const currentUrl = window.location.href;
          const targetResolved = new URL(targetUrl, window.location.href).href;
          if (currentUrl !== targetResolved) {
            isSyncingRoute = true;
            lastNotifiedUrl = targetResolved;
            window.location.href = targetResolved;
            setTimeout(() => {
              isSyncingRoute = false;
            }, 1000);
          }
        } catch {
          // ignore
        }
      }
    }

    if (event.data.type === 'SCREENSHIFT_SAFE_AREA_UPDATE') {
      const insets = event.data.insets;
      const rotation = event.data.rotationAngle || 0;
      if (insets) {
        injectSafeAreaStyles(insets, rotation);
      }
    }

    if (event.data.type === 'SCREENSHIFT_MIRROR_SCROLL') {
      const ratio = Number(event.data.ratio) || 0;
      const doc = document.documentElement;
      const maxScroll = Math.max(
        (doc ? doc.scrollHeight : 0),
        (document.body ? document.body.scrollHeight : 0)
      ) - window.innerHeight;
      if (maxScroll > 0) {
        isMirroringScroll = true;
        window.scrollTo({ top: Math.round(ratio * maxScroll), behavior: 'instant' });
        setTimeout(() => {
          isMirroringScroll = false;
        }, 60);
      }
    }

    if (event.data.type === 'SCREENSHIFT_HIDE_CURSOR') {
      if (cursorEl) {
        cursorEl.style.display = 'none';
      }
    }

    if (event.data.type === 'SCREENSHIFT_GET_SCROLL_INFO') {
      const doc = document.documentElement;
      const body = document.body;
      const scrollHeight = Math.max(
        doc ? doc.scrollHeight : 0,
        body ? body.scrollHeight : 0,
        doc ? doc.clientHeight : 0,
        window.innerHeight
      );
      const clientHeight = window.innerHeight;
      const scrollTop = window.scrollY || (doc ? doc.scrollTop : 0) || 0;

      window.parent.postMessage(
        {
          type: 'SCREENSHIFT_SCROLL_INFO_RESPONSE',
          scrollHeight,
          clientHeight,
          scrollTop,
        },
        '*'
      );
    }

    let fixedElementsForFullPage: { el: HTMLElement; origVisibility: string }[] = [];

    if (event.data.type === 'SCREENSHIFT_PREPARE_FULLPAGE') {
      fixedElementsForFullPage = [];
      try {
        const all = document.querySelectorAll('*');
        all.forEach((el) => {
          if (el instanceof HTMLElement && el.id !== 'screenshift-touch-cursor') {
            const pos = window.getComputedStyle(el).position;
            if (pos === 'fixed' || pos === 'sticky') {
              fixedElementsForFullPage.push({ el, origVisibility: el.style.visibility });
            }
          }
        });
        // Force lazy images to eager load for screenshot stitching
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
          img.setAttribute('loading', 'eager');
        });
      } catch {
        // ignore
      }
    }

    if (event.data.type === 'SCREENSHIFT_HIDE_FIXED_ELEMENTS') {
      try {
        fixedElementsForFullPage.forEach((item) => {
          item.el.style.visibility = 'hidden';
        });
      } catch {
        // ignore
      }
    }

    if (event.data.type === 'SCREENSHIFT_RESTORE_FULLPAGE') {
      try {
        fixedElementsForFullPage.forEach((item) => {
          item.el.style.visibility = item.origVisibility;
        });
        fixedElementsForFullPage = [];
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        // ignore
      }
    }

    if (event.data.type === 'SCREENSHIFT_SCROLL_TO') {
      const top = Number(event.data.top) || 0;
      window.scrollTo({ top, left: 0, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
      setTimeout(() => {
        window.parent.postMessage(
          {
            type: 'SCREENSHIFT_SCROLLED_RESPONSE',
            top,
          },
          '*'
        );
      }, 150);
    }
  });

  console.log('[ScreenShift] Touch simulator script initialized in frame.');
})();
