import { setupFrameRules } from './rules';

// Initialize rules on extension install and browser launch
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[ScreenShift] Service worker installed.');
  await setupFrameRules();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[ScreenShift] Browser startup detected.');
  await setupFrameRules();
});

// Launch ScreenShift viewer directly in the current active tab (or toggle back)
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // If user clicks the action icon while already on ScreenShift, disable and return to normal site
  if (tab.url && tab.url.startsWith(chrome.runtime.getURL('src/viewer/index.html'))) {
    try {
      const parsed = new URL(tab.url);
      const originalUrl = parsed.searchParams.get('url');
      if (originalUrl) {
        await chrome.tabs.update(tab.id, { url: originalUrl });
        return;
      }
    } catch {
      // ignore
    }

    const result = await chrome.storage.local.get(['last_url']);
    if (result.last_url) {
      await chrome.tabs.update(tab.id, { url: result.last_url });
      return;
    }
    return;
  }

  let targetUrl = 'https://react.dev';
  let targetFavicon = tab.favIconUrl || '';
  let targetTitle = tab.title || '';

  if (
    tab.url &&
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('chrome-extension://') &&
    !tab.url.startsWith('edge://') &&
    !tab.url.startsWith('about:')
  ) {
    targetUrl = tab.url;
  }

  const queryParams = new URLSearchParams({
    url: targetUrl,
    favicon: targetFavicon,
    title: targetTitle,
  });

  const viewerUrl = chrome.runtime.getURL(`src/viewer/index.html?${queryParams.toString()}`);

  // Navigate the CURRENT tab directly to ScreenShift viewer
  await chrome.tabs.update(tab.id, { url: viewerUrl });
});

// Helper: Convert array buffer to base64
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Handle inter-extension communications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_TAB') {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.warn('[ScreenShift] captureVisibleTab warning:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'EXIT_SIMULATOR') {
    const targetUrl = message.url || 'https://react.dev';
    const tabId = sender.tab?.id;

    if (tabId) {
      chrome.tabs.update(tabId, { url: targetUrl });
      sendResponse({ success: true });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.update(tabs[0].id, { url: targetUrl });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      });
    }
    return true;
  }

  if (message.type === 'FETCH_FAVICON_DATA_URL') {
    (async () => {
      try {
        const { faviconUrl, siteUrl } = message;
        const urlsToTry: string[] = [];

        if (faviconUrl && !faviconUrl.startsWith('chrome://')) {
          urlsToTry.push(faviconUrl);
        }

        if (siteUrl) {
          try {
            const host = new URL(siteUrl).hostname;
            urlsToTry.push(`https://www.google.com/s2/favicons?domain=${host}&sz=64`);
            urlsToTry.push(`${new URL(siteUrl).origin}/favicon.ico`);
          } catch {
            // ignore
          }
        }

        for (const candidate of urlsToTry) {
          try {
            const res = await fetch(candidate);
            if (res.ok) {
              const mime = res.headers.get('content-type') || 'image/png';
              const arrayBuf = await res.arrayBuffer();
              const base64 = bufferToBase64(arrayBuf);
              const dataUri = `data:${mime};base64,${base64}`;
              sendResponse({ success: true, dataUri });
              return;
            }
          } catch {
            // try next
          }
        }

        // Fallback: Generate SVG letter avatar favicon as Data URL
        if (siteUrl) {
          try {
            const host = new URL(siteUrl).hostname;
            const letter = (host.replace('www.', '')[0] || 'S').toUpperCase();
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#ff4d00"/><text x="32" y="44" font-family="Arial,sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">${letter}</text></svg>`;
            const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
            sendResponse({ success: true, dataUri });
            return;
          } catch {
            // ignore
          }
        }

        sendResponse({ success: false });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
    })();
    return true;
  }

  if (message.type === 'ENSURE_FRAME_RULES') {
    setupFrameRules().then(() => {
      sendResponse({ success: true });
    }).catch((err) => {
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  }
});
