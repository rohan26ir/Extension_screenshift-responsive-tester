import React, { useEffect } from 'react';
import { useSimulator } from './hooks/useSimulator';
import { useScreenshot } from './hooks/useScreenshot';
import { CanvasStage } from './components/CanvasStage';
import { ActionDock } from './components/ActionDock';
import { DeviceDrawer } from './components/DeviceDrawer';
import { CapturePreviewModal } from './components/CapturePreviewModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const App: React.FC = () => {
  const {
    initializeState,
    toggleOrientation,
    toggleDrawer,
    layoutMode,
    toggleLayoutMode,
    toggleFrame,
    toggleTouchMode,
    reloadIframe,
    setIsDrawerOpen,
    url,
  } = useSimulator();

  const { toastMessage, toastType } = useScreenshot();

  // Preserve the framed website's favicon and title on the browser tab
  useEffect(() => {
    if (!url) return;

    const params = new URLSearchParams(window.location.search);
    const initialFavicon = params.get('favicon') || '';
    const initialTitle = params.get('title') || '';

    try {
      const parsed = new URL(url);
      if (initialTitle) {
        document.title = initialTitle;
      } else {
        document.title = parsed.hostname;
      }

      // In Chrome extension tabs, external HTTP/HTTPS favicons are blocked.
      // We must set a Base64 data URL to render the website's favicon.
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          {
            type: 'FETCH_FAVICON_DATA_URL',
            faviconUrl: initialFavicon,
            siteUrl: url,
          },
          (response) => {
            if (response && response.success && response.dataUri) {
              let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
              if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
              }
              link.href = response.dataUri;
              link.type = response.dataUri.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png';
            }
          }
        );
      }
    } catch {
      // ignore
    }
  }, [url]);

  useEffect(() => {
    initializeState();

    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input or form
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        toggleDrawer();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleLayoutMode();
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey && layoutMode === 'single') {
          e.preventDefault();
          toggleOrientation();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFrame();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTouchMode();
      } else if (e.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    // Synchronize navigation & routing when route changes inside any framed device
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SCREENSHIFT_ROUTE_CHANGE' && typeof e.data.url === 'string') {
        useSimulator.getState().syncRoute(e.data.url);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, [
    initializeState,
    toggleOrientation,
    toggleDrawer,
    toggleLayoutMode,
    toggleFrame,
    toggleTouchMode,
    setIsDrawerOpen,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1f1f1f] text-white flex">
      {/* Centered Canvas Workspace (Single or Multi-Device) */}
      <CanvasStage />

      {/* Floating Action Dock (Right) */}
      <ActionDock />

      {/* Slide-over Device Matrix Drawer */}
      <DeviceDrawer />

      {/* Fullscreen Capture Result Modal (Preview & Multi-Format Export) */}
      <CapturePreviewModal />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-20 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-xs font-medium text-white animate-bounce-in">
          {toastType === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastType === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toastType === 'info' && <Info className="w-4 h-4 text-blue-400" />}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
