import { create } from 'zustand';
import html2canvas from 'html2canvas';
import { DeviceSpec } from '../../data/devices';
import { exportCanvasToPdfBlob, PdfPageSize, PDF_PAGE_PRESETS } from '../utils/pdfExport';

export type CaptureMode = 'mockup' | 'viewport' | 'fullpage' | 'canvas' | 'showcase';
export type ExportImageFormat = 'png' | 'webp' | 'jpeg' | 'pdf';
export type { PdfPageSize };
export { PDF_PAGE_PRESETS };

export interface ExportOptions {
  mode: CaptureMode;
  format?: ExportImageFormat;
  quality?: number;
  canvasBg?: string;
  canvasPadding?: number;
  pdfSize?: PdfPageSize;
}

export interface CaptureResult {
  canvas: HTMLCanvasElement;
  isolatedCanvas?: HTMLCanvasElement;
  dataUrl: string;
  pngBlob: Blob;
  webpBlob: Blob;
  jpegBlob: Blob;
  width: number;
  height: number;
  mode: CaptureMode;
  deviceName: string;
}

export interface ScreenshotStore {
  isCapturing: boolean;
  captureResult: CaptureResult | null;
  isResultModalOpen: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';

  // "Mockup on Canvas" customization options
  canvasBg: string;
  canvasPadding: number;
  setCanvasBg: (bg: string) => void;
  setCanvasPadding: (padding: number) => void;

  // PDF Page Size preset
  selectedPdfSize: PdfPageSize;
  setSelectedPdfSize: (size: PdfPageSize) => void;

  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  openResultModal: (result: CaptureResult) => void;
  closeResultModal: () => void;
  generateCapture: (
    mode: CaptureMode,
    device: DeviceSpec,
    isMulti?: boolean,
    customOptions?: { canvasBg?: string; canvasPadding?: number }
  ) => Promise<CaptureResult | null>;
  downloadCurrentCapture: (format: ExportImageFormat, pdfSize?: PdfPageSize) => Promise<void>;
  copyCurrentCaptureToClipboard: () => Promise<boolean>;
  captureInstant: (device: DeviceSpec, isMulti: boolean) => Promise<boolean>;
}

/**
 * Hide UI elements (dock, touch cursors, active popovers) before screenshot capture
 */
const prepareScreenForCapture = async (options?: { hideBezelArtifacts?: boolean }): Promise<() => void> => {
  const dock = document.querySelector('aside') as HTMLElement | null;
  const origDock = dock ? dock.style.visibility : '';
  if (dock) dock.style.visibility = 'hidden';

  const homeInd = document.querySelector('.home-indicator') as HTMLElement | null;
  const origHomeInd = homeInd ? homeInd.style.display : '';
  if (options?.hideBezelArtifacts && homeInd) {
    homeInd.style.display = 'none';
  }

  const statusBar = document.querySelector('.status-bar') as HTMLElement | null;
  const origStatusBar = statusBar ? statusBar.style.display : '';
  if (options?.hideBezelArtifacts && statusBar) {
    statusBar.style.display = 'none';
  }

  const screenBezel = document.querySelector('.screen-bezel') as HTMLElement | null;
  const origRadius = screenBezel ? screenBezel.style.borderRadius : '';
  const origBg = screenBezel ? screenBezel.style.backgroundColor : '';
  const origBoxShadow = screenBezel ? screenBezel.style.boxShadow : '';

  const chassis = document.querySelector('.device-chassis') as HTMLElement | null;
  const origChassisRadius = chassis ? chassis.style.borderRadius : '';
  const origChassisShadow = chassis ? chassis.style.boxShadow : '';

  if (options?.hideBezelArtifacts) {
    if (screenBezel) {
      screenBezel.style.borderRadius = '0px';
      screenBezel.style.backgroundColor = 'transparent';
      screenBezel.style.boxShadow = 'none';
    }
    if (chassis) {
      chassis.style.borderRadius = '0px';
      chassis.style.boxShadow = 'none';
    }
  }

  // Tell iframe content script to hide touch cursor
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((ifr) => {
    try {
      ifr.contentWindow?.postMessage({ type: 'SCREENSHIFT_HIDE_CURSOR' }, '*');
    } catch {
      // ignore
    }
  });

  // Wait for browser DOM to repaint cleanly
  await new Promise((r) => setTimeout(r, 120));

  return () => {
    if (dock) dock.style.visibility = origDock;
    if (homeInd) homeInd.style.display = origHomeInd;
    if (statusBar) statusBar.style.display = origStatusBar;
    if (screenBezel) {
      screenBezel.style.borderRadius = origRadius;
      screenBezel.style.backgroundColor = origBg;
      screenBezel.style.boxShadow = origBoxShadow;
    }
    if (chassis) {
      chassis.style.borderRadius = origChassisRadius;
      chassis.style.boxShadow = origChassisShadow;
    }
  };
};

/**
 * Captures raw visible tab via native Chrome Tab API
 */
const captureTabImage = async (): Promise<HTMLImageElement | null> => {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    return null;
  }

  const response = await new Promise<{ success: boolean; dataUrl?: string }>((resolve) => {
    chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' }, (res) => {
      resolve(res || { success: false });
    });
  });

  if (!response || !response.success || !response.dataUrl) {
    return null;
  }

  const img = new Image();
  img.src = response.dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  return img;
};

/**
 * Mode 1: Device Mockup (Isolated Transparent PNG)
 */
const captureDeviceMockup = async (
  device: DeviceSpec,
  tabImg: HTMLImageElement
): Promise<HTMLCanvasElement | null> => {
  const chassis = (document.querySelector('.device-chassis') ||
    document.getElementById('device-chassis-stage')) as HTMLElement | null;
  if (!chassis) return null;

  const rect = chassis.getBoundingClientRect();
  const scaleX = tabImg.naturalWidth / window.innerWidth;
  const scaleY = tabImg.naturalHeight / window.innerHeight;

  const padX = 5;
  const padY = 4;

  const cropX = Math.max(0, Math.round((rect.left - padX) * scaleX));
  const cropY = Math.max(0, Math.round((rect.top - padY) * scaleY));
  const cropW = Math.min(tabImg.naturalWidth - cropX, Math.round((rect.width + padX * 2) * scaleX));
  const cropH = Math.min(tabImg.naturalHeight - cropY, Math.round((rect.height + padY * 2) * scaleY));

  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = Math.round(padX * scaleX);
  const cy = Math.round(padY * scaleY);
  const cw = Math.round(rect.width * scaleX);
  const ch = Math.round(rect.height * scaleY);
  const outerRadius = (device.borderRadius + 5) * scaleX;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, outerRadius);

  if (device.category === 'phone' || device.category === 'tablet' || device.category === 'foldable') {
    const btnW = 5 * scaleX;
    if (device.brand === 'Apple') {
      ctx.roundRect(cx - btnW, cy + 90 * scaleY, btnW, 32 * scaleY, [2 * scaleX, 0, 0, 2 * scaleX]);
      ctx.roundRect(cx - btnW, cy + 135 * scaleY, btnW, 52 * scaleY, [2 * scaleX, 0, 0, 2 * scaleX]);
      ctx.roundRect(cx - btnW, cy + 195 * scaleY, btnW, 52 * scaleY, [2 * scaleX, 0, 0, 2 * scaleX]);
      ctx.roundRect(cx + cw, cy + 125 * scaleY, btnW, 75 * scaleY, [0, 2 * scaleX, 2 * scaleX, 0]);
    } else {
      ctx.roundRect(cx + cw, cy + 110 * scaleY, btnW, 68 * scaleY, [0, 2 * scaleX, 2 * scaleX, 0]);
      ctx.roundRect(cx + cw, cy + 195 * scaleY, btnW, 40 * scaleY, [0, 2 * scaleX, 2 * scaleX, 0]);
    }
  }

  if (device.category === 'watch') {
    ctx.rect(cx + (cw - 140 * scaleX) / 2, 0, 140 * scaleX, cy);
    ctx.rect(cx + (cw - 140 * scaleX) / 2, cy + ch, 140 * scaleX, cy);
    ctx.rect(cx + cw, cy + 30 * scaleY, 5 * scaleX, 50 * scaleY);
  }

  if (device.category === 'laptop' || device.category === 'desktop') {
    ctx.rect(0, cy + ch - 10 * scaleY, cropW, 40 * scaleY);
    ctx.rect(cx + (cw - 160 * scaleX) / 2, cy + ch, 160 * scaleX, 60 * scaleY);
  }

  ctx.clip();
  ctx.drawImage(tabImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  ctx.restore();

  return canvas;
};

/**
 * Mode 2: Screen Viewport Only (No Bezel, No Frame)
 */
const captureViewportOnly = async (tabImg: HTMLImageElement): Promise<HTMLCanvasElement | null> => {
  const iframe = (document.querySelector('.screen-bezel iframe') ||
    document.querySelector('iframe')) as HTMLIFrameElement | null;
  if (!iframe) return null;

  const rect = iframe.getBoundingClientRect();
  const scaleX = tabImg.naturalWidth / window.innerWidth;
  const scaleY = tabImg.naturalHeight / window.innerHeight;

  const cropX = Math.round(rect.left * scaleX);
  const cropY = Math.round(rect.top * scaleY);
  const cropW = Math.round(rect.width * scaleX);
  const cropH = Math.round(rect.height * scaleY);

  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(tabImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return canvas;
};

/**
 * Mode 3: Glitch-Free Full Page Scrolling Capture
 * - Zero border-radius (completely unrounded edges)
 * - Freezes fixed/sticky headers/banners to prevent seam duplication
 * - Waits for scroll reflows and lazy-loaded images to settle
 * - Pixel-perfect seamless stitching without overlapping or gaps
 */
const captureFullPage = async (initialTabImg: HTMLImageElement): Promise<HTMLCanvasElement | null> => {
  const iframe = (document.querySelector('.screen-bezel iframe') ||
    document.querySelector('iframe')) as HTMLIFrameElement | null;
  if (!iframe) {
    return captureViewportOnly(initialTabImg);
  }

  const rect = iframe.getBoundingClientRect();
  const scaleX = initialTabImg.naturalWidth / window.innerWidth;
  const scaleY = initialTabImg.naturalHeight / window.innerHeight;

  const cropX = Math.round(rect.left * scaleX);
  const cropY = Math.round(rect.top * scaleY);
  const cropW = Math.round(rect.width * scaleX);
  const cropH = Math.round(rect.height * scaleY);

  // 1. Prepare iframe DOM: Eager load lazy images & identify sticky/fixed elements
  iframe.contentWindow?.postMessage({ type: 'SCREENSHIFT_PREPARE_FULLPAGE' }, '*');
  await new Promise((r) => setTimeout(r, 120));

  const scrollInfoPromise = new Promise<{ scrollHeight: number; clientHeight: number }>((resolve) => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SCREENSHIFT_SCROLL_INFO_RESPONSE') {
        window.removeEventListener('message', handler);
        resolve(e.data);
      }
    };
    window.addEventListener('message', handler);
    iframe.contentWindow?.postMessage({ type: 'SCREENSHIFT_GET_SCROLL_INFO' }, '*');
    setTimeout(() => resolve({ scrollHeight: 0, clientHeight: 0 }), 600);
  });

  const info = await scrollInfoPromise;

  if (!info.scrollHeight || info.scrollHeight <= info.clientHeight + 30) {
    iframe.contentWindow?.postMessage({ type: 'SCREENSHIFT_RESTORE_FULLPAGE' }, '*');
    const singleCanvas = document.createElement('canvas');
    singleCanvas.width = cropW;
    singleCanvas.height = cropH;
    const sctx = singleCanvas.getContext('2d');
    if (sctx) {
      sctx.drawImage(initialTabImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    }
    return singleCanvas;
  }

  const scrollHeight = Math.min(info.scrollHeight, 12000);
  const clientHeight = info.clientHeight;
  const ratio = cropH / clientHeight;
  const totalCanvasH = Math.round(scrollHeight * ratio);

  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = cropW;
  masterCanvas.height = totalCanvasH;
  const mctx = masterCanvas.getContext('2d');
  if (!mctx) return null;

  // Step 0: Draw initial slice at y = 0 (includes the site header)
  mctx.drawImage(initialTabImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // Freeze fixed/sticky elements so they do NOT repeat across subsequent page seams
  iframe.contentWindow?.postMessage({ type: 'SCREENSHIFT_HIDE_FIXED_ELEMENTS' }, '*');
  await new Promise((r) => setTimeout(r, 60));

  // Step through remainder of the document seamlessly
  let currentY = clientHeight;

  while (currentY < scrollHeight) {
    const isLastSlice = currentY + clientHeight >= scrollHeight;
    const scrollTarget = isLastSlice ? scrollHeight - clientHeight : currentY;

    // Scroll iframe to target position
    iframe.contentWindow?.postMessage({ type: 'SCREENSHIFT_SCROLL_TO', top: scrollTarget }, '*');
    await new Promise((r) => setTimeout(r, 180));

    // Capture tab screenshot
    const res = await new Promise<{ success: boolean; dataUrl?: string }>((resolve) => {
      chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' }, (r) => resolve(r || { success: false }));
    });

    if (res?.dataUrl) {
      const tileImg = new Image();
      tileImg.src = res.dataUrl;
      await new Promise<void>((resolve) => {
        tileImg.onload = () => resolve();
        tileImg.onerror = () => resolve();
      });

      if (!isLastSlice) {
        // Standard full slice
        const destY = Math.round(currentY * ratio);
        mctx.drawImage(tileImg, cropX, cropY, cropW, cropH, 0, destY, cropW, cropH);
        currentY += clientHeight;
      } else {
        // Final remainder slice
        const remainder = scrollHeight - currentY;
        const remainderH = Math.round(remainder * ratio);
        const sourceOffsetY = cropY + cropH - remainderH;
        const destY = Math.round(currentY * ratio);

        mctx.drawImage(
          tileImg,
          cropX,
          sourceOffsetY,
          cropW,
          remainderH,
          0,
          destY,
          cropW,
          remainderH
        );
        break;
      }
    } else {
      currentY += clientHeight;
    }
  }

  // Restore iframe DOM state and scroll position
  iframe.contentWindow?.postMessage({ type: 'SCREENSHIFT_RESTORE_FULLPAGE' }, '*');

  return masterCanvas;
};

/**
 * Mode 4: Mockup with Canvas Background & Custom Padding
 */
const captureMockupWithCanvas = async (
  device: DeviceSpec,
  tabImg: HTMLImageElement,
  canvasBg: string = '#18181b',
  canvasPadding: number = 60
): Promise<HTMLCanvasElement | null> => {
  const mockupCanvas = await captureDeviceMockup(device, tabImg);
  if (!mockupCanvas) return null;

  const pad = Math.round(canvasPadding * 2);
  const targetWidth = mockupCanvas.width + pad * 2;
  const targetHeight = mockupCanvas.height + pad * 2;

  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = targetWidth;
  masterCanvas.height = targetHeight;

  const ctx = masterCanvas.getContext('2d');
  if (!ctx) return null;

  // Fill custom canvas background (gradient or solid)
  if (canvasBg.startsWith('linear-gradient')) {
    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    grad.addColorStop(0, '#1e1e24');
    grad.addColorStop(1, '#0a0a0c');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = canvasBg;
  }
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Center mockup with realistic drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  ctx.drawImage(mockupCanvas, pad, pad);
  ctx.restore();

  return masterCanvas;
};

/**
 * Mode 5: Multi-Device Showcase (Phone + Desktop + Tablet Side-by-Side)
 */
const captureMultiDeviceShowcase = async (
  tabImg: HTMLImageElement,
  canvasBg: string = '#18181b',
  canvasPadding: number = 50
): Promise<HTMLCanvasElement | null> => {
  const multiStage = document.getElementById('multi-device-workspace-composite');
  if (!multiStage) {
    const chassis = document.querySelector('.device-chassis') as HTMLElement | null;
    if (!chassis) return null;
    const rect = chassis.getBoundingClientRect();
    const scaleX = tabImg.naturalWidth / window.innerWidth;
    const scaleY = tabImg.naturalHeight / window.innerHeight;

    const cropX = Math.max(0, Math.round(rect.left * scaleX));
    const cropY = Math.max(0, Math.round(rect.top * scaleY));
    const cropW = Math.round(rect.width * scaleX);
    const cropH = Math.round(rect.height * scaleY);

    const c = document.createElement('canvas');
    c.width = cropW;
    c.height = cropH;
    c.getContext('2d')?.drawImage(tabImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return c;
  }

  const rect = multiStage.getBoundingClientRect();
  const scaleX = tabImg.naturalWidth / window.innerWidth;
  const scaleY = tabImg.naturalHeight / window.innerHeight;

  const cropX = Math.max(0, Math.round(rect.left * scaleX));
  const cropY = Math.max(0, Math.round(rect.top * scaleY));
  const cropW = Math.round(rect.width * scaleX);
  const cropH = Math.round(rect.height * scaleY);

  const pad = Math.round(canvasPadding * scaleX);
  const targetW = cropW + pad * 2;
  const targetH = cropH + pad * 2;

  const showcaseCanvas = document.createElement('canvas');
  showcaseCanvas.width = targetW;
  showcaseCanvas.height = targetH;
  const ctx = showcaseCanvas.getContext('2d');
  if (!ctx) return null;

  if (canvasBg.startsWith('linear-gradient')) {
    const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
    grad.addColorStop(0, '#18181b');
    grad.addColorStop(1, '#09090b');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = canvasBg;
  }
  ctx.fillRect(0, 0, targetW, targetH);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 24;
  ctx.drawImage(tabImg, cropX, cropY, cropW, cropH, pad, pad, cropW, cropH);
  ctx.restore();

  return showcaseCanvas;
};

/**
 * Convert canvas to Blob (PNG, WebP, JPEG)
 */
const convertCanvasToBlob = async (
  canvas: HTMLCanvasElement,
  format: 'png' | 'webp' | 'jpeg',
  quality: number = 0.95
): Promise<Blob | null> => {
  if (format === 'jpeg') {
    const jpegCanvas = document.createElement('canvas');
    jpegCanvas.width = canvas.width;
    jpegCanvas.height = canvas.height;
    const jctx = jpegCanvas.getContext('2d');
    if (jctx) {
      jctx.fillStyle = '#ffffff';
      jctx.fillRect(0, 0, canvas.width, canvas.height);
      jctx.drawImage(canvas, 0, 0);
      return new Promise<Blob | null>((resolve) =>
        jpegCanvas.toBlob(resolve, 'image/jpeg', quality)
      );
    }
  }

  const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, quality));
};

export const useScreenshot = create<ScreenshotStore>((set, get) => ({
  isCapturing: false,
  captureResult: null,
  isResultModalOpen: false,
  toastMessage: null,
  toastType: 'info',

  // "Mockup on Canvas" customization options
  canvasBg: '#18181b',
  canvasPadding: 60,

  setCanvasBg: (bg) => set({ canvasBg: bg }),
  setCanvasPadding: (padding) => set({ canvasPadding: padding }),

  // PDF Page Size preset (default A4)
  selectedPdfSize: 'a4',
  setSelectedPdfSize: (size) => set({ selectedPdfSize: size }),

  showToast: (message, type = 'success') => {
    set({ toastMessage: message, toastType: type });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3500);
  },

  openResultModal: (result) => {
    set({ captureResult: result, isResultModalOpen: true });
  },

  closeResultModal: () => {
    set({ isResultModalOpen: false });
  },

  generateCapture: async (mode, device, isMulti = false, customOptions) => {
    set({ isCapturing: true });
    get().showToast('Generating capture...', 'info');

    const hideBezelArtifacts = mode === 'fullpage' || mode === 'viewport';
    const restoreUI = await prepareScreenForCapture({ hideBezelArtifacts });

    const activeBg = customOptions?.canvasBg || get().canvasBg;
    const activePadding = customOptions?.canvasPadding ?? get().canvasPadding;

    try {
      let tabImg = await captureTabImage();

      // Fallback via html2canvas if Chrome runtime capture isn't reachable
      if (!tabImg) {
        const el = (document.querySelector('.device-chassis') ||
          document.getElementById('device-chassis-stage') ||
          document.getElementById('multi-device-workspace-composite')) as HTMLElement;
        if (el) {
          const fallbackCanvas = await html2canvas(el, { scale: 2, backgroundColor: null });
          tabImg = new Image();
          tabImg.src = fallbackCanvas.toDataURL('image/png');
          await new Promise((r) => { tabImg!.onload = r; });
        }
      }

      if (!tabImg) {
        restoreUI();
        get().showToast('Capture error: could not grab tab screenshot.', 'error');
        set({ isCapturing: false });
        return null;
      }

      let resultCanvas: HTMLCanvasElement | null = null;
      let isolatedCanvas: HTMLCanvasElement | null = null;

      if (mode === 'mockup') {
        resultCanvas = isMulti
          ? await captureMultiDeviceShowcase(tabImg, 'transparent', 20)
          : await captureDeviceMockup(device, tabImg);
        isolatedCanvas = resultCanvas;
      } else if (mode === 'viewport') {
        resultCanvas = await captureViewportOnly(tabImg);
        isolatedCanvas = resultCanvas;
      } else if (mode === 'fullpage') {
        resultCanvas = await captureFullPage(tabImg);
        isolatedCanvas = resultCanvas;
      } else if (mode === 'canvas') {
        if (isMulti) {
          isolatedCanvas = await captureMultiDeviceShowcase(tabImg, 'transparent', 20);
          resultCanvas = await captureMultiDeviceShowcase(tabImg, activeBg, activePadding);
        } else {
          isolatedCanvas = await captureDeviceMockup(device, tabImg);
          resultCanvas = await captureMockupWithCanvas(device, tabImg, activeBg, activePadding);
        }
      } else if (mode === 'showcase') {
        isolatedCanvas = await captureMultiDeviceShowcase(tabImg, 'transparent', 20);
        resultCanvas = await captureMultiDeviceShowcase(tabImg, activeBg, activePadding);
      }

      restoreUI();

      if (!resultCanvas) {
        get().showToast('Failed to generate export canvas.', 'error');
        set({ isCapturing: false });
        return null;
      }

      const [pngBlob, webpBlob, jpegBlob] = await Promise.all([
        convertCanvasToBlob(resultCanvas, 'png', 1.0),
        convertCanvasToBlob(resultCanvas, 'webp', 0.95),
        convertCanvasToBlob(resultCanvas, 'jpeg', 0.92),
      ]);

      if (!pngBlob || !webpBlob || !jpegBlob) {
        get().showToast('Failed to encode image data.', 'error');
        set({ isCapturing: false });
        return null;
      }

      const dataUrl = resultCanvas.toDataURL('image/png');
      const result: CaptureResult = {
        canvas: resultCanvas,
        isolatedCanvas: isolatedCanvas || resultCanvas,
        dataUrl,
        pngBlob,
        webpBlob,
        jpegBlob,
        width: resultCanvas.width,
        height: resultCanvas.height,
        mode,
        deviceName: isMulti ? 'Multi-Device Workspace' : device.name,
      };

      set({
        captureResult: result,
        isResultModalOpen: true,
        isCapturing: false,
      });

      return result;
    } catch (err) {
      restoreUI();
      console.error('[ScreenShift] Capture error:', err);
      set({ isCapturing: false });
      get().showToast('Export failed. Please try again.', 'error');
      return null;
    }
  },

  downloadCurrentCapture: async (format: ExportImageFormat, pdfSize?: PdfPageSize) => {
    const { captureResult, showToast } = get();
    if (!captureResult) return;

    let blob: Blob | null = null;
    let ext = format as string;
    const targetPdfSize = pdfSize || get().selectedPdfSize || 'a4';

    if (format === 'pdf') {
      try {
        // Use clean isolated canvas (without dark studio backdrop) for a print-ready pure white PDF export
        const canvasForPdf = captureResult.isolatedCanvas || captureResult.canvas;
        blob = await exportCanvasToPdfBlob(canvasForPdf, targetPdfSize);
        ext = 'pdf';
      } catch (e) {
        console.error('[ScreenShift] PDF export failed:', e);
        showToast('Failed to generate PDF document.', 'error');
        return;
      }
    } else if (format === 'jpeg') {
      blob = captureResult.jpegBlob;
      ext = 'jpg';
    } else if (format === 'webp') {
      blob = captureResult.webpBlob;
      ext = 'webp';
    } else {
      blob = captureResult.pngBlob;
      ext = 'png';
    }

    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedName = captureResult.deviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const suffix = format === 'pdf' ? `-${targetPdfSize}` : '';
    link.download = `screenshift-${sanitizedName}-${captureResult.mode}${suffix}-${Date.now()}.${ext}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const formatLabel = format === 'pdf' ? `PDF (${targetPdfSize.toUpperCase()})` : ext.toUpperCase();
    showToast(`Downloaded .${formatLabel} file!`, 'success');
  },

  copyCurrentCaptureToClipboard: async () => {
    const { captureResult, showToast } = get();
    if (!captureResult) return false;

    try {
      const item = new ClipboardItem({ 'image/png': captureResult.pngBlob });
      await navigator.clipboard.write([item]);
      showToast('Copied high-res image to clipboard!', 'success');
      return true;
    } catch (err) {
      console.error('[ScreenShift] Clipboard copy failed:', err);
      showToast('Right-click preview and select "Copy image".', 'info');
      return false;
    }
  },

  captureInstant: async (device: DeviceSpec, isMulti: boolean) => {
    const result = await get().generateCapture(isMulti ? 'showcase' : 'mockup', device, isMulti);
    return Boolean(result);
  },
}));
