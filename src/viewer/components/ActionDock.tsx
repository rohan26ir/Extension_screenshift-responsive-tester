import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  RotateCw,
  Frame,
  Pointer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Camera,
  RotateCcw,
  Palette,
  Eye,
  EyeOff,
  XCircle,
  Columns3,
  Monitor,
  Sparkles,
  Check,
  Loader2,
  Layers,
  X,
} from 'lucide-react';
import { useSimulator, ChassisColor } from '../hooks/useSimulator';
import { isMobileOrTablet } from '../utils/safeArea';
import { BrowserChromeType } from './BrowserChromeOverlay';
import { useScreenshot, CaptureMode } from '../hooks/useScreenshot';

export const ActionDock: React.FC = () => {
  const {
    currentDevice,
    orientation,
    rotationAngle,
    toggleOrientation,
    layoutMode,
    toggleLayoutMode,
    zoom,
    setZoom,
    fitToScreen,
    toggleFitToScreen,
    showFrame,
    toggleFrame,
    touchMode,
    toggleTouchMode,
    statusBarVisible,
    toggleStatusBar,
    chassisColor,
    setChassisColor,
    browserChrome,
    setBrowserChrome,
    toggleDrawer,
    isDrawerOpen,
    reloadIframe,
    url,
  } = useSimulator();

  const {
    isCapturing,
    generateCapture,
    canvasBg,
    setCanvasBg,
    canvasPadding,
    setCanvasPadding,
  } = useScreenshot();

  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showChromeMenu, setShowChromeMenu] = useState(false);
  const [showCapturePopover, setShowCapturePopover] = useState(false);
  const [selectedCaptureMode, setSelectedCaptureMode] = useState<CaptureMode>('mockup');

  const colorMenuRef = useRef<HTMLDivElement>(null);
  const chromeMenuRef = useRef<HTMLDivElement>(null);
  const capturePopoverRef = useRef<HTMLDivElement>(null);

  // Close flyouts & popovers when clicking outside
  useEffect(() => {
    if (!showColorMenu && !showChromeMenu && !showCapturePopover) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;

      if (
        showColorMenu &&
        colorMenuRef.current &&
        !colorMenuRef.current.contains(target as Node) &&
        !target?.closest?.('[data-color-trigger="true"]')
      ) {
        setShowColorMenu(false);
      }

      if (
        showChromeMenu &&
        chromeMenuRef.current &&
        !chromeMenuRef.current.contains(target as Node) &&
        !target?.closest?.('[data-chrome-trigger="true"]')
      ) {
        setShowChromeMenu(false);
      }

      if (
        showCapturePopover &&
        capturePopoverRef.current &&
        !capturePopoverRef.current.contains(target as Node) &&
        !target?.closest?.('[data-capture-trigger="true"]')
      ) {
        setShowCapturePopover(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showColorMenu, showChromeMenu, showCapturePopover]);

  // Exit simulator and return tab to normal site
  const handleExitSimulator = () => {
    const targetUrl = url || 'https://react.dev';
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'EXIT_SIMULATOR', url: targetUrl }, (res) => {
        if (!res || !res.success) {
          window.location.href = targetUrl;
        }
      });
    } else {
      window.location.href = targetUrl;
    }
  };

  // Authentic Flagship Finishes
  const colors: { id: ChassisColor; label: string; colorClass: string }[] = [
    { id: 'natural-titanium', label: 'Natural Titanium', colorClass: 'bg-[#5c5d61] border-[#717277]' },
    { id: 'space-black', label: 'Space Black', colorClass: 'bg-[#121215] border-[#27272a]' },
    { id: 'silver', label: 'Silver', colorClass: 'bg-[#e2e2e8] border-white' },
    { id: 'starlight', label: 'Starlight', colorClass: 'bg-[#ede7dc] border-[#ded7cb]' },
    { id: 'midnight', label: 'Midnight', colorClass: 'bg-[#1f2024] border-[#38393d]' },
    { id: 'rose-gold', label: 'Rose Gold', colorClass: 'bg-[#f3cdc4] border-[#e2a89c]' },
    { id: 'blue', label: 'Sierra Blue', colorClass: 'bg-[#bfd8ed] border-[#94b9da]' },
  ];

  const isMobile = isMobileOrTablet(currentDevice);

  // Strictly Scoped Browser Chrome Options:
  // - Desktop Profile: Exclusively Desktop chrome (Chrome/Safari)
  // - Mobile/Tablet Profile: Exclusively Mobile chrome (Safari/Chrome)
  const browserChromeOptions: { id: BrowserChromeType; label: string }[] = isMobile
    ? [
        { id: 'none', label: 'Clean (No UI)' },
        { id: 'safari-mobile', label: 'Mobile Safari' },
        { id: 'chrome-mobile', label: 'Chrome Mobile' },
      ]
    : [
        { id: 'none', label: 'Clean (No UI)' },
        { id: 'desktop-chrome', label: 'Desktop Chrome' },
        { id: 'desktop-safari', label: 'Desktop Safari' },
      ];

  // Rotation Constraints:
  // - Single-Device View: Mobile & Tablet allowed left-only rotation (0° to 270°). Desktop locked.
  // - 3-Device Split View: Completely DISABLE rotation for all devices to maintain fixed alignment.
  const isRotationDisabled = layoutMode === 'multi' || !isMobile;

  // Handle Capture Generation from Selector Popover
  const handleGenerateCapture = async () => {
    setShowCapturePopover(false);
    await generateCapture(selectedCaptureMode, currentDevice, layoutMode === 'multi', {
      canvasBg,
      canvasPadding,
    });
  };

  return (
    <aside className="fixed right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 select-none">
      {/* Main Floating Tool Dock */}
      <div className="flex flex-col items-center bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-2 shadow-2xl shadow-black/60 gap-1.5 text-zinc-300">
        
        {/* Multi-Device Workspace Toggle (Mobile + Desktop + Tablet) */}
        <button
          type="button"
          onClick={toggleLayoutMode}
          className={`relative group p-2.5 rounded-xl transition-all ${
            layoutMode === 'multi'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/50'
              : 'hover:bg-zinc-800 hover:text-white text-zinc-300'
          }`}
          title={
            layoutMode === 'multi'
              ? 'Switch to Single Device View'
              : 'Switch to 3-Device Split View (Mobile + Desktop + Tablet)'
          }
        >
          <Columns3 className="w-5 h-5" />
          <span className="dock-tooltip">
            {layoutMode === 'multi' ? 'Single Device View' : '3-Device Split View'}
          </span>
        </button>

        {/* Device Matrix Drawer Toggle */}
        <button
          type="button"
          onClick={toggleDrawer}
          data-dock-drawer-trigger="true"
          className={`relative group p-2.5 rounded-xl transition-all ${
            isDrawerOpen
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'hover:bg-zinc-800 hover:text-white text-zinc-300'
          }`}
          title="Open Device Catalog"
        >
          <Smartphone className="w-5 h-5" />
          <span className="dock-tooltip">Devices & Catalog</span>
        </button>

        <div className="w-6 h-[1px] bg-zinc-800 my-1" />

        {/* Unidirectional Left-Only Rotation Toggle (Disabled in 3-Device Split View & Desktop) */}
        <button
          type="button"
          onClick={toggleOrientation}
          disabled={isRotationDisabled}
          className={`relative group p-2.5 rounded-xl transition-all ${
            isRotationDisabled
              ? 'opacity-25 cursor-not-allowed text-zinc-600 hover:bg-transparent'
              : 'hover:bg-zinc-800 hover:text-white text-zinc-300'
          }`}
          title={
            layoutMode === 'multi'
              ? 'Rotation disabled in 3-Device Split View'
              : !isMobile
              ? `Rotation disabled for ${currentDevice.category}`
              : rotationAngle === 0
              ? 'Rotate Left (270°)'
              : 'Rotate Portrait (0°)'
          }
        >
          <RotateCw
            className={`w-5 h-5 transition-transform duration-300 ${
              rotationAngle === 270 && !isRotationDisabled ? '-rotate-90 text-blue-400' : ''
            }`}
          />
          <span className="dock-tooltip">
            {layoutMode === 'multi'
              ? 'Rotation disabled in Split View'
              : !isMobile
              ? `Rotation disabled (${currentDevice.category})`
              : rotationAngle === 0
              ? 'Rotate Left (270°)'
              : 'Rotate Portrait (0°)'}
          </span>
        </button>

        {/* Realistic Frame / Minimal Toggle */}
        <button
          type="button"
          onClick={toggleFrame}
          className={`relative group p-2.5 rounded-xl transition-all ${
            showFrame ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'bg-zinc-800 text-blue-400'
          }`}
          title="Toggle Device Frame"
        >
          <Frame className="w-5 h-5" />
          <span className="dock-tooltip">{showFrame ? 'Hide Frame Bezel' : 'Show Frame Bezel'}</span>
        </button>

        {/* Simulated Browser Chrome Toggle (Scoped to Device Type) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowChromeMenu(!showChromeMenu);
              setShowColorMenu(false);
              setShowCapturePopover(false);
            }}
            data-chrome-trigger="true"
            className={`relative group p-2.5 rounded-xl transition-all ${
              browserChrome !== 'none'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'hover:bg-zinc-800 hover:text-white text-zinc-400'
            }`}
            title="Browser Chrome Interface"
          >
            <Monitor className="w-5 h-5" />
            <span className="dock-tooltip">Browser Interface</span>
          </button>

          {showChromeMenu && (
            <div
              ref={chromeMenuRef}
              className="absolute right-12 top-0 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-44 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-800">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {isMobile ? 'Mobile Overlays' : 'Desktop Overlays'}
                </span>
              </div>
              {browserChromeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setBrowserChrome(opt.id);
                    setShowChromeMenu(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    browserChrome === opt.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {browserChrome === opt.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chassis Color / Finish Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorMenu(!showColorMenu);
              setShowChromeMenu(false);
              setShowCapturePopover(false);
            }}
            data-color-trigger="true"
            className="relative group p-2.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all"
            title="Chassis Finish"
          >
            <Palette className="w-5 h-5" />
            <span className="dock-tooltip">Hardware Finish</span>
          </button>

          {showColorMenu && (
            <div
              ref={colorMenuRef}
              className="absolute right-12 top-0 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5 w-40 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center gap-1.5 px-2 py-1 border-b border-zinc-800">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Hardware Finishes
                </span>
              </div>
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setChassisColor(c.id);
                    setShowColorMenu(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    chassisColor === c.id
                      ? 'bg-zinc-800 text-white ring-1 ring-zinc-700'
                      : 'hover:bg-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border shadow-inner ${c.colorClass}`} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Touch Mode Emulation */}
        <button
          type="button"
          onClick={toggleTouchMode}
          className={`relative group p-2.5 rounded-xl transition-all ${
            touchMode
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/20'
              : 'hover:bg-zinc-800 hover:text-white text-zinc-400'
          }`}
          title="Simulate Mobile Touch"
        >
          <Pointer className="w-5 h-5" />
          <span className="dock-tooltip">{touchMode ? 'Touch Mode (Active)' : 'Enable Touch Mode'}</span>
        </button>

        {/* Status Bar Visibility Toggle */}
        <button
          type="button"
          onClick={toggleStatusBar}
          className="relative group p-2.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all"
          title="Toggle System Status Bar"
        >
          {statusBarVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-zinc-500" />}
          <span className="dock-tooltip">{statusBarVisible ? 'Hide Status Bar' : 'Show Status Bar'}</span>
        </button>

        <div className="w-6 h-[1px] bg-zinc-800 my-1" />

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => setZoom(zoom + 0.1)}
          className="relative group p-2.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
          <span className="dock-tooltip">Zoom In ({(zoom * 100).toFixed(0)}%)</span>
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => setZoom(zoom - 0.1)}
          className="relative group p-2.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
          <span className="dock-tooltip">Zoom Out</span>
        </button>

        {/* Fit to Screen */}
        <button
          type="button"
          onClick={toggleFitToScreen}
          className={`relative group p-2.5 rounded-xl transition-all ${
            fitToScreen
              ? 'bg-zinc-800 text-blue-400 font-semibold'
              : 'hover:bg-zinc-800 hover:text-white text-zinc-300'
          }`}
          title="Fit Viewport to Screen"
        >
          <Maximize2 className="w-5 h-5" />
          <span className="dock-tooltip">{fitToScreen ? 'Auto-Fit (Active)' : 'Fit to Screen'}</span>
        </button>

        <div className="w-6 h-[1px] bg-zinc-800 my-1" />

        {/* Capture Trigger Button & Dropdown Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCapturePopover(!showCapturePopover);
              setShowColorMenu(false);
              setShowChromeMenu(false);
            }}
            data-capture-trigger="true"
            className={`relative group p-2.5 rounded-xl transition-all ${
              showCapturePopover
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'hover:bg-zinc-800 hover:text-white text-zinc-300'
            }`}
            title="Open Capture Menu"
          >
            {isCapturing ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
            <span className="dock-tooltip">Capture Viewport</span>
          </button>

          {/* Quick-Capture Selector Popover */}
          {showCapturePopover && (
            <div
              ref={capturePopoverRef}
              className="absolute right-14 top-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 w-80 sm:w-[350px] z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-white"
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                    Capture Options
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCapturePopover(false)}
                  className="text-zinc-500 hover:text-white p-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 2x2 Grid of Streamlined Capture Mode Cards (Clean title + icon only) */}
              <div className="grid grid-cols-2 gap-2">
                {/* Card 1: Top-Left - Isolated Mockup */}
                <button
                  type="button"
                  onClick={() => setSelectedCaptureMode('mockup')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedCaptureMode === 'mockup'
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50 text-white'
                      : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className={`w-4 h-4 ${selectedCaptureMode === 'mockup' ? 'text-blue-400' : 'text-zinc-400'}`} />
                    <span className="text-xs font-semibold">Isolated Mockup</span>
                  </div>
                  {selectedCaptureMode === 'mockup' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>

                {/* Card 2: Top-Right - Viewport Only */}
                <button
                  type="button"
                  onClick={() => setSelectedCaptureMode('viewport')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedCaptureMode === 'viewport'
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50 text-white'
                      : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className={`w-4 h-4 ${selectedCaptureMode === 'viewport' ? 'text-blue-400' : 'text-zinc-400'}`} />
                    <span className="text-xs font-semibold">Viewport Only</span>
                  </div>
                  {selectedCaptureMode === 'viewport' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>

                {/* Card 3: Bottom-Left - Full-Page Scroll */}
                <button
                  type="button"
                  onClick={() => setSelectedCaptureMode('fullpage')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedCaptureMode === 'fullpage'
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50 text-white'
                      : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className={`w-4 h-4 ${selectedCaptureMode === 'fullpage' ? 'text-blue-400' : 'text-zinc-400'}`} />
                    <span className="text-xs font-semibold">Full-Page Scroll</span>
                  </div>
                  {selectedCaptureMode === 'fullpage' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>

                {/* Card 4: Bottom-Right - Mockup on Canvas */}
                <button
                  type="button"
                  onClick={() => setSelectedCaptureMode('canvas')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedCaptureMode === 'canvas'
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50 text-white'
                      : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${selectedCaptureMode === 'canvas' ? 'text-blue-400' : 'text-zinc-400'}`} />
                    <span className="text-xs font-semibold">Mockup on Canvas</span>
                  </div>
                  {selectedCaptureMode === 'canvas' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              </div>

              {/* "Mockup on Canvas" Customization Controls */}
              {selectedCaptureMode === 'canvas' && (
                <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-800 text-xs animate-in fade-in duration-150">
                  {/* Canvas Background Color Picker */}
                  <div>
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider">Canvas Background</span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {canvasBg.startsWith('linear-gradient') ? 'Studio Gradient' : canvasBg.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Swatch: Studio White */}
                      <button
                        type="button"
                        onClick={() => setCanvasBg('#ffffff')}
                        className={`w-6 h-6 rounded-md border shadow-sm transition-all ${
                          canvasBg === '#ffffff' ? 'ring-2 ring-blue-500 scale-105 border-white' : 'border-zinc-700 bg-white'
                        }`}
                        style={{ backgroundColor: '#ffffff' }}
                        title="Studio White"
                      />
                      {/* Swatch: Slate Dark */}
                      <button
                        type="button"
                        onClick={() => setCanvasBg('#18181b')}
                        className={`w-6 h-6 rounded-md border shadow-sm transition-all ${
                          canvasBg === '#18181b' ? 'ring-2 ring-blue-500 scale-105 border-zinc-500' : 'border-zinc-700 bg-[#18181b]'
                        }`}
                        style={{ backgroundColor: '#18181b' }}
                        title="Slate Dark"
                      />
                      {/* Swatch: Neutral Gray */}
                      <button
                        type="button"
                        onClick={() => setCanvasBg('#71717a')}
                        className={`w-6 h-6 rounded-md border shadow-sm transition-all ${
                          canvasBg === '#71717a' ? 'ring-2 ring-blue-500 scale-105 border-zinc-400' : 'border-zinc-700 bg-[#71717a]'
                        }`}
                        style={{ backgroundColor: '#71717a' }}
                        title="Neutral Gray"
                      />
                      {/* Swatch: Gradient */}
                      <button
                        type="button"
                        onClick={() => setCanvasBg('linear-gradient(135deg, #1e1e24 0%, #0a0a0c 100%)')}
                        className={`w-6 h-6 rounded-md border shadow-sm transition-all ${
                          canvasBg.startsWith('linear-gradient') ? 'ring-2 ring-blue-500 scale-105 border-zinc-400' : 'border-zinc-700'
                        }`}
                        style={{ background: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)' }}
                        title="Studio Gradient"
                      />
                      {/* Custom Color Input */}
                      <label className="relative w-6 h-6 rounded-md border border-zinc-700 bg-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors ml-auto overflow-hidden shadow-inner">
                        <input
                          type="color"
                          value={canvasBg.startsWith('#') ? canvasBg : '#18181b'}
                          onChange={(e) => setCanvasBg(e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-full h-full rounded"
                          style={{ backgroundColor: canvasBg.startsWith('#') ? canvasBg : '#3b82f6' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Canvas Padding Controls */}
                  <div>
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider">Canvas Padding</span>
                      <span className="font-mono text-[10px] text-zinc-500">{canvasPadding}px</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Compact', value: 28 },
                        { label: 'Standard', value: 56 },
                        { label: 'Wide', value: 84 },
                        { label: '16:9', value: 120 },
                      ].map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setCanvasPadding(p.value)}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-medium border text-center transition-colors ${
                            canvasPadding === p.value
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button: "Generate a capture" */}
              <button
                type="button"
                onClick={handleGenerateCapture}
                disabled={isCapturing}
                className="w-full mt-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating capture...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Generate a capture</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Reload Device Viewport */}
        <button
          type="button"
          onClick={reloadIframe}
          className="relative group p-2.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all"
          title="Reload Preview"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="dock-tooltip">Reload Frame</span>
        </button>

        {/* Exit Simulator */}
        <button
          type="button"
          onClick={handleExitSimulator}
          className="relative group p-2.5 rounded-xl hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-all"
          title="Close ScreenShift (Exit to normal website)"
        >
          <XCircle className="w-5 h-5" />
          <span className="dock-tooltip">Exit ScreenShift</span>
        </button>

      </div>
    </aside>
  );
};
