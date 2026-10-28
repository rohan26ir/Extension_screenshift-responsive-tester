import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Copy,
  PenTool,
  Check,
  Bug,
  FileText,
} from 'lucide-react';
import {
  useScreenshot,
  ExportImageFormat,
  PdfPageSize,
  PDF_PAGE_PRESETS,
} from '../hooks/useScreenshot';

export const CapturePreviewModal: React.FC = () => {
  const {
    isResultModalOpen,
    captureResult,
    closeResultModal,
    downloadCurrentCapture,
    copyCurrentCaptureToClipboard,
    selectedPdfSize,
    setSelectedPdfSize,
    showToast,
  } = useScreenshot();

  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportImageFormat | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isResultModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeResultModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResultModalOpen, closeResultModal]);

  if (!isResultModalOpen || !captureResult) {
    return null;
  }

  const handleCopy = async () => {
    const success = await copyCurrentCaptureToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (format: ExportImageFormat) => {
    setDownloadingFormat(format);
    await downloadCurrentCapture(format, selectedPdfSize);
    setDownloadingFormat(null);
  };

  const handleAnnotate = () => {
    showToast('Annotate & Markup tools are coming soon with ScreenShift Pro!', 'info');
  };

  const isFullPage = captureResult.mode === 'fullpage';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeResultModal();
      }}
    >
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-6xl h-[88vh] bg-[#141416] border border-zinc-800/90 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden select-none">
        
        {/* Top-Right Dismiss Button */}
        <button
          type="button"
          onClick={closeResultModal}
          className="absolute top-4 right-4 z-20 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-700/50 backdrop-blur-md transition-all shadow-md"
          title="Close modal (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Canvas Area: High-resolution live preview & pixel dimensions only */}
        <div className="relative flex-1 h-[50%] md:h-full bg-[#0d0d10] flex items-center justify-center p-6 sm:p-10 overflow-hidden select-none">
          {/* Studio Canvas Background (Subtle transparency checkerboard & radial glow) */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#3f3f46 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-blue-900/10 via-transparent to-purple-900/10" />

          {/* High-Resolution Live Image Preview with Zero-Radius on Full-Page */}
          <div className="relative z-10 max-w-full max-h-full flex items-center justify-center overflow-auto">
            <img
              src={captureResult.dataUrl}
              alt="High-resolution capture preview"
              className={`max-w-full max-h-[calc(88vh-130px)] object-contain shadow-2xl ring-1 ring-white/10 ${
                isFullPage ? 'rounded-none' : 'rounded-xl'
              }`}
              style={{
                borderRadius: isFullPage ? '0px' : undefined,
              }}
            />
          </div>

          {/* Real-time Dimensions Floating Pill (Clean pixel dimensions only, no style tag) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/85 border border-zinc-700/80 backdrop-blur-md text-zinc-300 font-mono text-xs shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">
              Dimensions: {captureResult.width} px × {captureResult.height} px
            </span>
          </div>
        </div>

        {/* Right Control Panel (Uncluttered text & compact action buttons) */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 bg-[#17171b] border-t md:border-t-0 md:border-l border-zinc-800/90 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header with Intact "Screenshot" & "HIGH-RES" badge */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Screenshot</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  High-Res
                </span>
              </h2>
            </div>

            {/* Target Device Info */}
            <div className="mt-3.5 px-3 py-2 rounded-xl bg-zinc-900/70 border border-zinc-800 flex justify-between items-center text-xs">
              <span className="text-zinc-400">Target Device:</span>
              <span className="text-white font-medium truncate max-w-[190px]">
                {captureResult.deviceName}
              </span>
            </div>

            {/* Action Buttons Section */}
            <div className="mt-4 flex flex-col gap-2.5">
              {/* 1. Download PNG Button */}
              <button
                type="button"
                onClick={() => handleDownload('png')}
                disabled={downloadingFormat !== null}
                className="group flex items-center gap-3 p-2 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-500/50 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0 transition-transform group-hover:scale-105 group-active:scale-95">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between flex-1 pr-1">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                    Download PNG
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">.png</span>
                </div>
              </button>

              {/* 2. Download WEBP Button */}
              <button
                type="button"
                onClick={() => handleDownload('webp')}
                disabled={downloadingFormat !== null}
                className="group flex items-center gap-3 p-2 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-500/50 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0 transition-transform group-hover:scale-105 group-active:scale-95">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between flex-1 pr-1">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                    Download WEBP
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">.webp</span>
                </div>
              </button>

              {/* 3. Download JPEG Button (0.92 Quality) */}
              <button
                type="button"
                onClick={() => handleDownload('jpeg')}
                disabled={downloadingFormat !== null}
                className="group flex items-center gap-3 p-2 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-500/50 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0 transition-transform group-hover:scale-105 group-active:scale-95">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between flex-1 pr-1">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                    Download JPEG
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">.jpg</span>
                </div>
              </button>

              {/* Standardized PDF Page Size Presets (A4 Default + US Letter, US Legal, A3) */}
              <div className="pt-1.5 pb-0.5">
                <div className="flex items-center justify-between text-zinc-400 mb-1 px-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider">PDF Page Format</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {PDF_PAGE_PRESETS[selectedPdfSize].dimensionsMm}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  {(['a4', 'letter', 'legal', 'a3'] as PdfPageSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedPdfSize(size)}
                      className={`py-1 px-1 rounded-lg text-[10px] font-semibold transition-all text-center ${
                        selectedPdfSize === size
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                      }`}
                    >
                      {size === 'a4'
                        ? 'A4'
                        : size === 'letter'
                        ? 'Letter'
                        : size === 'legal'
                        ? 'Legal'
                        : 'A3'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Download PDF Button */}
              <button
                type="button"
                onClick={() => handleDownload('pdf')}
                disabled={downloadingFormat !== null}
                className="group flex items-center gap-3 p-2 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-500/50 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0 transition-transform group-hover:scale-105 group-active:scale-95">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between flex-1 pr-1">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                    Download PDF ({selectedPdfSize.toUpperCase()})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">.pdf</span>
                </div>
              </button>

              {/* 5. Copy to Clipboard Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="group flex items-center gap-3 p-2 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-105 group-active:scale-95">
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs font-semibold text-white">
                  {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                </span>
              </button>

              {/* 6. Annotate & Edit Button (Pro Badge Indicator) */}
              <button
                type="button"
                onClick={handleAnnotate}
                className="group flex items-center gap-3 p-2 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/50 border border-zinc-800/70 hover:border-purple-500/40 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-105">
                  <PenTool className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between flex-1 pr-1">
                  <span className="text-xs font-semibold text-zinc-200">
                    Annotate & Edit
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 text-zinc-950 shadow-sm">
                    PRO
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Bug Report / Improvement Link */}
          <div className="pt-4 border-t border-zinc-800/80 mt-4 text-center">
            <a
              href="https://screenshift.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-blue-400 transition-colors"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Report a bug, suggest an improvement</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CapturePreviewModal;
