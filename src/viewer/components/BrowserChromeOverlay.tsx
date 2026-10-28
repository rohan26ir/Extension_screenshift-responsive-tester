import React from 'react';
import {
  Lock,
  RotateCcw,
  Share,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export type BrowserChromeType =
  | 'none'
  | 'safari-mobile'
  | 'chrome-mobile'
  | 'desktop-chrome'
  | 'desktop-safari';

interface BrowserChromeOverlayProps {
  type: BrowserChromeType;
  url: string;
  isDark?: boolean;
  onReload?: () => void;
  isMobile?: boolean;
}

export const BrowserChromeOverlay: React.FC<BrowserChromeOverlayProps> = ({
  type,
  url,
  isDark = true,
  onReload,
  isMobile = true,
}) => {
  if (type === 'none') return null;

  // Strict Device Scoping:
  // - Mobile & Tablet viewports can ONLY display mobile chrome overlays (Safari Mobile or Chrome Mobile)
  // - Desktop viewports can ONLY display desktop chrome overlays (Desktop Chrome or Desktop Safari)
  if (isMobile && (type === 'desktop-chrome' || type === 'desktop-safari')) {
    return null;
  }
  if (!isMobile && (type === 'safari-mobile' || type === 'chrome-mobile')) {
    return null;
  }

  let displayUrl = 'react.dev';
  try {
    const parsed = new URL(url);
    displayUrl = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    displayUrl = url.replace(/^https?:\/\//, '') || 'react.dev';
  }

  // 1. Mobile Safari Floating Bottom Address Bar (Mobile/Tablet Only)
  if (type === 'safari-mobile' && isMobile) {
    return (
      <div className="pointer-events-auto absolute bottom-4 left-3 right-3 z-30 flex items-center justify-between px-3 py-2 rounded-2xl bg-zinc-900/85 backdrop-blur-xl border border-white/10 shadow-2xl text-zinc-200 select-none transition-all">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700">
            AA
          </span>
        </div>

        <div className="flex items-center gap-1.5 max-w-[190px] truncate text-xs font-normal text-zinc-100">
          <Lock className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="truncate">{displayUrl}</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <button
            type="button"
            onClick={onReload}
            className="hover:text-white transition-colors"
            title="Reload page"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <Share className="w-3.5 h-3.5 hover:text-white transition-colors cursor-pointer" />
        </div>
      </div>
    );
  }

  // 2. Mobile Chrome Top Address Bar (Mobile/Tablet Only)
  if (type === 'chrome-mobile' && isMobile) {
    return (
      <div className="pointer-events-auto relative w-full px-3 py-2 bg-[#202124] border-b border-[#303134] flex items-center gap-2 select-none z-30 text-zinc-200">
        <div className="flex-1 flex items-center gap-2 bg-[#303134] px-3 py-1.5 rounded-full text-xs text-zinc-100">
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate flex-1 font-sans text-xs">{displayUrl}</span>
          <button
            type="button"
            onClick={onReload}
            className="text-zinc-400 hover:text-zinc-200"
            title="Reload"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Tab Count Badge */}
        <div className="w-5 h-5 rounded-md border border-zinc-500 flex items-center justify-center text-[10px] font-bold text-zinc-300">
          1
        </div>

        {/* 3-Dot Overflow Menu */}
        <MoreVertical className="w-4 h-4 text-zinc-400" />
      </div>
    );
  }

  // 3. Desktop Chrome Window Header (Desktop Only)
  if (type === 'desktop-chrome' && !isMobile) {
    return (
      <div className="pointer-events-auto relative w-full bg-[#202124] border-b border-[#3c4043] select-none z-30 text-zinc-300">
        {/* Top Tab Bar & Window Traffic Lights */}
        <div className="flex items-center px-3 pt-2 pb-1.5 gap-2">
          {/* Traffic Light Buttons */}
          <div className="flex items-center gap-1.5 pr-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
          </div>

          {/* Active Tab */}
          <div className="flex items-center gap-2 bg-[#323639] px-3 py-1 rounded-t-lg border-t border-x border-[#3c4043] max-w-[200px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-xs text-zinc-200 truncate">{displayUrl}</span>
          </div>
          <Plus className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
        </div>

        {/* Omnibox & Navigation Bar */}
        <div className="flex items-center gap-2 px-3 pb-2 pt-0.5">
          <div className="flex items-center gap-1 text-zinc-400">
            <ChevronLeft className="w-4 h-4 opacity-50" />
            <ChevronRight className="w-4 h-4 opacity-50" />
            <button
              type="button"
              onClick={onReload}
              className="p-1 hover:bg-zinc-700 rounded transition-colors"
              title="Reload"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-2 bg-[#1f1f1f] border border-[#3c4043] px-3 py-1 rounded-full text-xs text-zinc-200">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span className="truncate flex-1 font-mono text-[11px]">{displayUrl}</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Desktop Safari Header (Desktop Only)
  if (type === 'desktop-safari' && !isMobile) {
    return (
      <div className="pointer-events-auto relative w-full bg-[#2a2a2c] border-b border-black/40 px-3 py-2 flex items-center justify-between select-none z-30 text-zinc-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>

        <div className="flex items-center justify-center gap-1.5 px-4 py-1 rounded-lg bg-[#1e1e20] border border-white/5 text-xs text-zinc-200 max-w-[340px] w-full shadow-inner">
          <Lock className="w-3 h-3 text-zinc-400" />
          <span className="truncate font-sans text-xs">{displayUrl}</span>
          <button
            type="button"
            onClick={onReload}
            className="ml-auto text-zinc-400 hover:text-white"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Share className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
          <Plus className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
        </div>
      </div>
    );
  }

  return null;
};
