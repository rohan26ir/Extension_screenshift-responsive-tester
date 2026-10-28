import React, { useState, useEffect } from 'react';
import { Wifi, Disc3 } from 'lucide-react';
import { useSimulator } from '../hooks/useSimulator';

interface StatusBarProps {
  notchType: 'notch' | 'compact-notch' | 'island' | 'punch-hole' | 'punch-hole-left' | 'home-button' | 'none';
  brand: 'Apple' | 'Android';
  orientation: 'portrait' | 'landscape';
}

export const StatusBar: React.FC<StatusBarProps> = ({ notchType, brand, orientation }) => {
  const { statusBarVisible, statusBarStyle, toggleStatusBarStyle } = useSimulator();
  const [timeStr, setTimeStr] = useState('');
  const [islandExpanded, setIslandExpanded] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

      if (brand === 'Apple') {
        const displayHours = hours % 12 || 12;
        setTimeStr(`${displayHours}:${formattedMinutes}`);
      } else {
        const displayHours = hours < 10 ? `0${hours}` : `${hours}`;
        setTimeStr(`${displayHours}:${formattedMinutes}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [brand]);

  if (!statusBarVisible) return null;

  const isLandscape = orientation === 'landscape';
  const isDarkText = statusBarStyle === 'dark';
  const barBg = isDarkText ? 'bg-white' : 'bg-black';
  const textClass = isDarkText
    ? 'text-zinc-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]'
    : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]';

  // Height adapts per hardware type:
  // In landscape: sleek, compact 28px bar across top
  // In portrait:
  // Compact/classic notch: 44px
  // Dynamic Island: 48px
  // Android punch-hole & waterdrop: 32px
  // Classic Home-button: 20px
  const barHeight = isLandscape
    ? notchType === 'home-button'
      ? 'h-[20px]'
      : 'h-[28px]'
    : notchType === 'island'
    ? 'h-[48px]'
    : notchType === 'home-button'
    ? 'h-[20px]'
    : brand === 'Android'
    ? 'h-[32px]'
    : 'h-[44px]';

  return (
    <div
      className={`status-bar relative w-full ${barHeight} ${barBg} z-40 select-none flex items-center justify-between px-6 transition-colors duration-200 m-0 border-0 outline-none`}
    >
      {/* 0. Android Waterdrop / Infinity-V Notch (Galaxy A12, Redmi, Realme) in Portrait */}
      {!isLandscape && brand === 'Android' && notchType === 'notch' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center">
          <svg
            width="32"
            height="22"
            viewBox="0 0 32 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block drop-shadow-sm"
          >
            <path
              d="M0 0C6 0 8.5 3.5 10 8C11.5 13 13 21 16 21C19 21 20.5 13 22 8C23.5 3.5 26 0 32 0H0Z"
              fill="#000000"
            />
            <circle cx="16" cy="10" r="4.5" fill="#0a0f1d" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="16" cy="10" r="2.8" fill="#04060a" />
            <circle cx="15" cy="9" r="1" fill="#38bdf8" opacity="0.6" />
          </svg>
        </div>
      )}

      {/* 1. iPhone 13 Mini / 13 / 14 Compact Notch in Portrait */}
      {!isLandscape && notchType === 'compact-notch' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center">
          <div className="relative">
            <svg
              width="160"
              height="30"
              viewBox="0 0 160 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block"
            >
              <path
                d="M0 0C6 0 9 3 10 9V16C10 23.732 16.268 30 24 30H136C143.732 30 150 23.732 150 16V9C151 3 154 0 160 0H0Z"
                fill="#000000"
              />
            </svg>

            {/* Front Camera Lens with Cyan Optical Sheen */}
            <div className="absolute left-[38px] top-[9px] w-2.5 h-2.5 rounded-full bg-[#080d1a] border border-[#1b263b] flex items-center justify-center shadow-inner">
              <div className="w-1 h-1 rounded-full bg-cyan-400/40" />
            </div>

            {/* TrueDepth Sensor / Face ID Illuminator */}
            <div className="absolute right-[42px] top-[12px] w-1.5 h-1.5 rounded-full bg-[#121214] shadow-inner" />
          </div>
        </div>
      )}

      {/* 2. Apple Classic Wide Notch (iPhone X, 11, 12) in Portrait */}
      {!isLandscape && brand === 'Apple' && notchType === 'notch' && (
        <div className="classic-notch w-[205px]">
          <div className="speaker-slit w-[48px]" />
          <div className="absolute right-7 w-2 h-2 rounded-full bg-[#0d131f] border border-[#1b263b]/70 flex items-center justify-center">
            <div className="w-0.5 h-0.5 rounded-full bg-cyan-400/30" />
          </div>
        </div>
      )}

      {/* 3. Apple Dynamic Island (iPhone 14 Pro, 15, 16) in Portrait */}
      {!isLandscape && notchType === 'island' && (
        <div
          onClick={() => setIslandExpanded(!islandExpanded)}
          className={`dynamic-island pointer-events-auto cursor-pointer transition-all duration-300 ease-out shadow-lg ${
            islandExpanded ? 'w-[200px] h-[38px] bg-black px-4 shadow-2xl' : 'w-[108px]'
          }`}
          title="Click to interact with Dynamic Island"
        >
          {islandExpanded ? (
            <div className="flex items-center justify-between w-full text-white text-[11px] font-medium tracking-tight">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Disc3 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px] text-zinc-300 truncate max-w-[85px]">ScreenShift</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-3 bg-green-500 rounded-sm animate-pulse" />
                <div className="w-1.5 h-4 bg-green-500 rounded-sm animate-pulse delay-75" />
                <div className="w-1.5 h-2 bg-green-500 rounded-sm animate-pulse delay-150" />
              </div>
            </div>
          ) : (
            <>
              <div className="dynamic-island-lens" />
              <div className="dynamic-island-sensor" />
            </>
          )}
        </div>
      )}

      {/* 4. Android Centered Punch Hole in Portrait */}
      {!isLandscape && notchType === 'punch-hole' && (
        <div className="punch-hole" />
      )}

      {/* 5. Android Left-Corner Punch Hole in Portrait */}
      {!isLandscape && notchType === 'punch-hole-left' && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-black border border-zinc-800 shadow-sm z-40 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0a1128]" />
        </div>
      )}

      {/* Left Ear: Time */}
      <div
        onClick={toggleStatusBarStyle}
        className={`pointer-events-auto cursor-pointer flex items-center gap-1.5 transition-colors duration-200 select-none ${
          !isLandscape && notchType === 'punch-hole-left' ? 'pl-7' : 'pl-1'
        } ${textClass}`}
        title="Click to toggle status bar text color (Dark / Light)"
      >
        <span className={`font-semibold tracking-tight leading-none ${brand === 'Apple' ? 'text-[14px] font-sans' : 'text-[13px] font-sans'}`}>
          {timeStr}
        </span>
      </div>

      {/* Right Ear: Signal, Wi-Fi, Battery */}
      <div
        onClick={toggleStatusBarStyle}
        className={`pointer-events-auto cursor-pointer flex items-center gap-2 transition-colors duration-200 select-none pr-1 ${textClass}`}
        title="Click to toggle status bar text color (Dark / Light)"
      >
        {/* Signal Bars */}
        <div className="flex items-end gap-[1.5px] h-3">
          <div className="w-[2.5px] h-1 bg-current rounded-[0.5px]" />
          <div className="w-[2.5px] h-1.5 bg-current rounded-[0.5px]" />
          <div className="w-[2.5px] h-2.5 bg-current rounded-[0.5px]" />
          <div className="w-[2.5px] h-3 bg-current rounded-[0.5px]" />
        </div>

        {/* Wi-Fi Icon */}
        <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />

        {/* Battery Pill */}
        {brand === 'Apple' ? (
          <div className="flex items-center">
            <div className="relative w-[22px] h-[11.5px] rounded-[3.5px] border-[1.5px] border-current p-[1.5px] flex items-center">
              <div className="h-full w-[82%] rounded-[1.5px] bg-current" />
            </div>
            <div className="w-[1.5px] h-[4px] rounded-r-[1px] bg-current opacity-90 -mr-[1px]" />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold tracking-tight">100%</span>
            <div className="relative w-[10px] h-[15px] rounded-[2px] border-[1.5px] border-current p-[1px] flex flex-col justify-end">
              <div className="w-[3px] h-[1.5px] bg-current absolute -top-[2.5px] left-1/2 -translate-x-1/2 rounded-t-[0.5px]" />
              <div className="w-full h-full bg-current rounded-[0.5px]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
