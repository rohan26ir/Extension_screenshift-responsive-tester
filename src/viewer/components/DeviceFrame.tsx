import React, { useRef, useEffect } from 'react';
import { useSimulator } from '../hooks/useSimulator';
import { StatusBar } from './StatusBar';
import { TouchLayer } from './TouchLayer';
import { BrowserChromeOverlay, BrowserChromeType } from './BrowserChromeOverlay';
import { Loader2 } from 'lucide-react';
import { isMobileOrTablet, calculateSafeAreaInsets } from '../utils/safeArea';
import { DeviceSpec } from '../../data/devices';

interface DeviceFrameProps {
  device?: DeviceSpec;
  frameId?: string;
  isMultiView?: boolean;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  device: propDevice,
  frameId = 'single-frame',
  isMultiView = false,
}) => {
  const {
    currentDevice: storeDevice,
    orientation,
    rotationAngle,
    showFrame,
    chassisColor,
    browserChrome,
    syncScroll,
    url,
    iframeKey,
    isLoading,
    setIsLoading,
    statusBarVisible,
    statusBarStyle,
    touchMode,
    reloadIframe,
  } = useSimulator();

  const currentDevice = propDevice || storeDevice;
  const containerRef = useRef<HTMLDivElement>(null);

  const isMobile = isMobileOrTablet(currentDevice);
  // Unidirectional Left-Only Rotation: Only applies to mobile and tablet viewports in single view (disabled in 3-device split view)
  const isLandscape = !isMultiView && orientation === 'landscape' && isMobile;
  const isWatch = currentDevice.category === 'watch';
  const isLaptop = currentDevice.category === 'laptop';
  const isDesktop = currentDevice.category === 'desktop';
  const isPhoneOrTablet = isMobile;

  const isApple = currentDevice.brand === 'Apple';
  const isHomeButtonDevice = currentDevice.notchType === 'home-button';

  // Strict Device Scoping for Browser Chrome Overlay
  const effectiveChrome: BrowserChromeType = (() => {
    if (browserChrome === 'none') return 'none';
    if (isMobile) {
      return browserChrome === 'safari-mobile' || browserChrome === 'chrome-mobile'
        ? browserChrome
        : 'none';
    } else {
      return browserChrome === 'desktop-chrome' || browserChrome === 'desktop-safari'
        ? browserChrome
        : 'none';
    }
  })();

  // Dynamic 4-edge safe-area insets calculation (strictly left-only in landscape, locked in multi-view)
  const safeAreaInsets = calculateSafeAreaInsets(
    currentDevice,
    !isMultiView && isMobile ? orientation : 'portrait',
    !isMultiView && isMobile ? rotationAngle : 0
  );

  const screenWidth = isLandscape ? currentDevice.height : currentDevice.width;
  const screenHeight = isLandscape ? currentDevice.width : currentDevice.height;

  // Frame padding around the screen based on device type
  const bezelPadding = showFrame
    ? isLaptop
      ? 14
      : isDesktop
      ? 16
      : isWatch
      ? 12
      : isHomeButtonDevice
      ? 10
      : 7
    : 0;

  const outerWidth = screenWidth + bezelPadding * 2;
  const outerHeight = screenHeight + bezelPadding * 2;
  const outerRadius = showFrame ? currentDevice.borderRadius + 5 : 0;
  const screenRadius = showFrame ? currentDevice.borderRadius : 0;

  // Reactively broadcast safe-area insets and rotation angle to the framed page
  useEffect(() => {
    try {
      const ifr = containerRef.current?.querySelector('iframe');
      ifr?.contentWindow?.postMessage(
        {
          type: 'SCREENSHIFT_SAFE_AREA_UPDATE',
          insets: safeAreaInsets,
          rotationAngle: isMobile ? rotationAngle : 0,
          orientation: isMobile ? orientation : 'portrait',
        },
        '*'
      );
    } catch {
      // ignore
    }
  }, [safeAreaInsets, rotationAngle, orientation, isMobile]);

  // Synchronized scroll listener across multi-device frames
  useEffect(() => {
    if (!syncScroll) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SCREENSHIFT_SCROLL_PERCENTAGE') {
        const ratio = e.data.ratio;
        const allIframes = document.querySelectorAll('iframe');
        const myIframe = containerRef.current?.querySelector('iframe');

        allIframes.forEach((ifr) => {
          if (ifr !== myIframe) {
            ifr.contentWindow?.postMessage(
              { type: 'SCREENSHIFT_MIRROR_SCROLL', ratio },
              '*'
            );
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [syncScroll]);

  return (
    <div
      id={`device-stage-${frameId}`}
      data-device-frame="true"
      data-device-id={currentDevice.id}
      className={`relative inline-flex items-center justify-center w-max transition-all duration-300 ease-out ${
        isMultiView ? 'shadow-2xl' : ''
      }`}
    >
      {/* Outer Chassis Frame */}
      <div
        className={`device-chassis relative select-none ${
          showFrame ? `chassis-${chassisColor}` : 'chassis-minimal'
        }`}
        style={{
          width: `${outerWidth}px`,
          height: `${outerHeight}px`,
          borderRadius: `${outerRadius}px`,
          padding: `${bezelPadding}px`,
        }}
      >
        {/* Apple Watch Lugs & Digital Crown */}
        {showFrame && isWatch && (
          <>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[140px] h-4 bg-zinc-800 rounded-t-lg border-t border-zinc-700 shadow-md" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[140px] h-4 bg-zinc-800 rounded-b-lg border-b border-zinc-700 shadow-md" />
            <div
              className="absolute -right-3 top-12 w-3 h-8 bg-zinc-700 rounded-r-md border border-zinc-500 shadow-sm flex items-center justify-center"
              title="Digital Crown"
            >
              <div className="w-1.5 h-3 rounded-full bg-red-600/80" />
            </div>
            <div
              className="absolute -right-2 top-24 w-2 h-7 bg-zinc-600 rounded-r-xs border border-zinc-500 shadow-sm"
              title="Side Button"
            />
          </>
        )}

        {/* Laptop Bottom Base & Webcam */}
        {showFrame && isLaptop && (
          <>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-950" />
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[104%] h-4 bg-gradient-to-b from-zinc-700 to-zinc-800 border-t border-zinc-500 rounded-b-lg flex items-center justify-center shadow-2xl">
              <div className="w-20 h-1 bg-zinc-900 rounded-full" />
            </div>
          </>
        )}

        {/* Desktop / iMac Stand & Chin */}
        {showFrame && isDesktop && (
          <>
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-950 border border-zinc-700" />
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-0">
              <div className="w-16 h-14 bg-gradient-to-b from-zinc-600 to-zinc-700 border-x border-zinc-500 shadow-md" />
              <div className="w-48 h-2.5 bg-zinc-500 border-t border-zinc-400 rounded-sm shadow-xl" />
            </div>
          </>
        )}

        {/* Hardware physical buttons & antenna lines for Phones & Tablets */}
        {showFrame && isPhoneOrTablet && (
          <>
            {/* Bezel Speaker Earpiece Slit (Left edge in landscape-left, Top in portrait) */}
            {!isHomeButtonDevice && (
              <div
                className={`absolute z-30 pointer-events-none bg-[#1a1a1c] border border-white/10 rounded-full shadow-sm ${
                  isLandscape
                    ? 'left-[3px] top-1/2 -translate-y-1/2 w-[3px] h-[48px]'
                    : 'top-[3px] left-1/2 -translate-x-1/2 w-[48px] h-[3px]'
                }`}
                title="Earpiece Speaker"
              />
            )}

            {/* Antenna Seams (Portrait) */}
            {!isLandscape && (
              <>
                <div className="antenna-line-left-top" />
                <div className="antenna-line-left-bottom" />
                <div className="antenna-line-right-top" />
                <div className="antenna-line-right-bottom" />
              </>
            )}

            {/* Apple Hardware Buttons */}
            {isApple ? (
              isLandscape ? (
                <>
                  {/* Landscape-Left: Power Button on Top, Volume & Action on Bottom */}
                  <div
                    className="absolute -top-[5px] left-[140px] w-[65px] h-[4px] rounded-t-sm bg-gradient-to-t from-zinc-700 to-zinc-600 border-t border-x border-zinc-500 shadow-sm"
                    title="Power / Lock Button"
                  />
                  <div
                    className="absolute -bottom-[5px] left-[105px] w-[28px] h-[4px] rounded-b-sm bg-gradient-to-b from-zinc-700 to-zinc-600 border-b border-x border-zinc-500 shadow-sm"
                    title="Action / Mute Switch"
                  />
                  <div
                    className="absolute -bottom-[5px] left-[145px] w-[46px] h-[4px] rounded-b-sm bg-gradient-to-b from-zinc-700 to-zinc-600 border-b border-x border-zinc-500 shadow-sm"
                    title="Volume Up"
                  />
                  <div
                    className="absolute -bottom-[5px] left-[200px] w-[46px] h-[4px] rounded-b-sm bg-gradient-to-b from-zinc-700 to-zinc-600 border-b border-x border-zinc-500 shadow-sm"
                    title="Volume Down"
                  />
                </>
              ) : (
                <>
                  <div className="hardware-button-left-1" title="Action / Mute Switch" />
                  <div className="hardware-button-left-2" title="Volume Up" />
                  <div className="hardware-button-left-3" title="Volume Down" />
                  <div className="hardware-button-right" title="Power / Lock" />
                </>
              )
            ) : (
              /* Android Hardware Buttons */
              isLandscape ? (
                <>
                  <div
                    className="absolute -top-[5px] left-[130px] w-[55px] h-[4px] rounded-t-sm bg-gradient-to-t from-zinc-700 to-zinc-600 border-t border-x border-zinc-500 shadow-sm"
                    title="Volume Rocker"
                  />
                  <div
                    className="absolute -top-[5px] left-[195px] w-[36px] h-[4px] rounded-t-sm bg-gradient-to-t from-zinc-700 to-zinc-600 border-t border-x border-zinc-500 shadow-sm"
                    title="Power Button"
                  />
                </>
              ) : (
                <>
                  <div className="hardware-button-android-volume" title="Volume Up / Down Rocker" />
                  <div className="hardware-button-android-power" title="Power Button" />
                </>
              )
            )}
          </>
        )}

        {/* Inner Screen Display */}
        <div
          ref={containerRef}
          className={`screen-bezel relative w-full h-full flex ${
            isLandscape && isHomeButtonDevice ? 'flex-row' : 'flex-col'
          } overflow-hidden ${
            showFrame ? 'bg-black shadow-inner' : 'bg-white shadow-none'
          }`}
          style={{
            borderRadius: `${screenRadius}px`,
          }}
        >
          {/* Classic iPhone Forehead in Portrait */}
          {showFrame && isHomeButtonDevice && !isLandscape && (
            <div className="w-full h-[50px] bg-black relative flex items-center justify-center shrink-0 z-40">
              <div className="w-12 h-1 bg-zinc-800 rounded-full border border-zinc-700/50" />
              <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800 absolute left-1/2 -translate-x-1/2 -ml-12" />
            </div>
          )}

          {/* Classic iPhone Forehead in Landscape-Left */}
          {showFrame && isHomeButtonDevice && isLandscape && (
            <div className="w-[50px] h-full bg-black relative flex flex-col items-center justify-center shrink-0 z-40 border-r border-zinc-900">
              <div className="w-1 h-12 bg-zinc-800 rounded-full border border-zinc-700/50" />
              <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800 absolute top-1/2 -translate-y-1/2 -mt-12" />
            </div>
          )}

          {/* MacBook Pro 16 Top Camera Notch */}
          {showFrame && isLaptop && currentDevice.notchType === 'notch' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[84px] h-[16px] bg-black rounded-b-md flex items-center justify-center gap-1.5 z-40">
              <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-950" />
              </div>
              <div className="w-1 h-1 rounded-full bg-green-500/80 animate-pulse" />
            </div>
          )}

          {/* Top Status Bar: Portrait only (in landscape, top inset collapses to 0px) */}
          {showFrame && statusBarVisible && !isLandscape && (isPhoneOrTablet || isWatch) && (
            <StatusBar
              notchType={currentDevice.notchType}
              brand={currentDevice.brand}
              orientation={orientation}
            />
          )}

          {/* Optional Top Browser Chrome (Chrome Mobile, Desktop Chrome, Desktop Safari) */}
          {(effectiveChrome === 'chrome-mobile' ||
            effectiveChrome === 'desktop-chrome' ||
            effectiveChrome === 'desktop-safari') && (
            <BrowserChromeOverlay
              type={effectiveChrome}
              url={url}
              isDark={statusBarStyle === 'dark'}
              onReload={reloadIframe}
              isMobile={isMobile}
            />
          )}

          {/* Webpage Viewport Container with Dynamic 4-Edge Insets */}
          <div
            className={`relative flex-1 w-full h-full overflow-hidden bg-white ${
              touchMode ? 'cursor-pointer' : ''
            }`}
            style={{
              paddingTop: `${isLandscape ? safeAreaInsets.top : 0}px`,
              paddingBottom: `${safeAreaInsets.bottom}px`,
              paddingLeft: `${safeAreaInsets.left}px`,
              paddingRight: `${safeAreaInsets.right}px`,
              boxSizing: 'border-box',
              transition: 'padding 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              ...({
                '--safe-area-inset-top': `${safeAreaInsets.top}px`,
                '--safe-area-inset-right': `${safeAreaInsets.right}px`,
                '--safe-area-inset-bottom': `${safeAreaInsets.bottom}px`,
                '--safe-area-inset-left': `${safeAreaInsets.left}px`,
              } as React.CSSProperties),
            }}
          >
            <iframe
              key={`${iframeKey}-${frameId}`}
              src={url}
              title={`${currentDevice.name}-${frameId}`}
              className={`w-full h-full border-0 outline-none block m-0 p-0 bg-white no-scrollbar ${
                touchMode ? 'cursor-pointer' : ''
              }`}
              scrolling="yes"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              onLoad={() => {
                setIsLoading(false);
                try {
                  const ifr = containerRef.current?.querySelector('iframe');
                  ifr?.contentWindow?.postMessage(
                    { type: 'SCREENSHIFT_TOUCH_MODE', enabled: touchMode },
                    '*'
                  );
                  ifr?.contentWindow?.postMessage(
                    {
                      type: 'SCREENSHIFT_SAFE_AREA_UPDATE',
                      insets: safeAreaInsets,
                      rotationAngle: isMobile ? rotationAngle : 0,
                      orientation: isMobile ? orientation : 'portrait',
                    },
                    '*'
                  );
                } catch {
                  // ignore
                }
              }}
            />

            {/* Optional Mobile Safari Floating Bottom Bar */}
            {effectiveChrome === 'safari-mobile' && (
              <BrowserChromeOverlay
                type="safari-mobile"
                url={url}
                isDark={statusBarStyle === 'dark'}
                onReload={reloadIframe}
                isMobile={isMobile}
              />
            )}

            {/* Loading Indicator Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/75 backdrop-blur-sm text-white">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-xs font-medium text-zinc-300 tracking-wide">
                  Loading {currentDevice.name}...
                </p>
              </div>
            )}

            {/* Mouse-to-Touch Simulation Layer */}
            <TouchLayer containerRef={containerRef} />
          </div>

          {/* Landscape-Left Camera Cutout (Strictly on Left Edge) */}
          {showFrame && isLandscape && isPhoneOrTablet && !isHomeButtonDevice && (
            <>
              {/* 1. Android Waterdrop Notch on Left Edge */}
              {currentDevice.notchType === 'notch' && !isApple && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center">
                  <svg
                    width="22"
                    height="32"
                    viewBox="0 0 22 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="block drop-shadow-sm"
                  >
                    <path
                      d="M0 0C0 6 3.5 8.5 8 10C13 11.5 21 13 21 16C21 19 13 20.5 8 22C3.5 23.5 0 26 0 32V0Z"
                      fill="#000000"
                    />
                    <circle cx="10" cy="16" r="4.5" fill="#0a0f1d" stroke="#1e293b" strokeWidth="0.8" />
                    <circle cx="10" cy="16" r="2.8" fill="#04060a" />
                    <circle cx="9" cy="15" r="1" fill="#38bdf8" opacity="0.6" />
                  </svg>
                </div>
              )}

              {/* 2. Apple Wide Notch on Left Edge */}
              {currentDevice.notchType === 'notch' && isApple && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center">
                  <div className="w-[28px] h-[180px] bg-black rounded-r-2xl flex flex-col items-center justify-center gap-2 shadow-md">
                    <div className="w-[3px] h-[44px] bg-zinc-800 rounded-full" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0d131f] border border-[#1b263b] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-cyan-400/40" />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Apple Compact Notch on Left Edge */}
              {currentDevice.notchType === 'compact-notch' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center">
                  <div className="w-[26px] h-[140px] bg-black rounded-r-2xl flex flex-col items-center justify-center gap-2 shadow-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#080d1a] border border-[#1b263b] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-cyan-400/40" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#121214]" />
                  </div>
                </div>
              )}

              {/* 4. Apple Dynamic Island on Left Edge */}
              {currentDevice.notchType === 'island' && (
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-40 pointer-events-auto cursor-pointer transition-all duration-300 ease-out bg-black rounded-[20px] shadow-lg flex flex-col items-center justify-between py-3 px-1.5 w-[28px] h-[100px]"
                  title="Dynamic Island"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1c2738] border border-white/10" />
                  <div className="w-2 h-2 rounded-full bg-[#08080a]" />
                </div>
              )}

              {/* 5. Android Centered Punch Hole on Left Edge */}
              {currentDevice.notchType === 'punch-hole' && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-black border-[1.5px] border-[#111827] shadow-sm z-40 flex items-center justify-center pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0a1128]" />
                </div>
              )}

              {/* 6. Android Corner Punch Hole on Left Edge */}
              {currentDevice.notchType === 'punch-hole-left' && (
                <div className="absolute left-3 top-7 w-3.5 h-3.5 rounded-full bg-black border-[1.5px] border-[#111827] shadow-sm z-40 flex items-center justify-center pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0a1128]" />
                </div>
              )}
            </>
          )}

          {/* Classic iPhone Bottom Chin in Portrait */}
          {showFrame && isHomeButtonDevice && !isLandscape && (
            <div className="w-full h-[56px] bg-black relative flex items-center justify-center shrink-0 z-40">
              <div className="w-12 h-12 rounded-full border-2 border-zinc-600/70 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-inner flex items-center justify-center">
                <div className="w-11 h-11 rounded-full border border-zinc-700/50" />
              </div>
            </div>
          )}

          {/* Classic iPhone Right Chin in Landscape-Left */}
          {showFrame && isHomeButtonDevice && isLandscape && (
            <div className="w-[56px] h-full bg-black relative flex items-center justify-center shrink-0 z-40 border-l border-zinc-900">
              <div className="w-12 h-12 rounded-full border-2 border-zinc-600/70 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-inner flex items-center justify-center">
                <div className="w-11 h-11 rounded-full border border-zinc-700/50" />
              </div>
            </div>
          )}

          {/* Bottom Home Indicator Bar (Portrait & Landscape-Left) */}
          {showFrame && statusBarVisible && isPhoneOrTablet && !isHomeButtonDevice && (
            <div
              className={`home-indicator ${
                statusBarStyle === 'dark' ? 'home-indicator-dark' : 'home-indicator-light'
              } ${isLandscape ? 'w-[180px] bottom-1' : 'w-[134px] bottom-2'}`}
            />
          )}

          {/* Glass glare reflection overlay */}
          {showFrame && (
            <div
              className="pointer-events-none absolute inset-0 z-30 opacity-20 bg-gradient-to-tr from-transparent via-white/5 to-white/10"
              style={{ borderRadius: `${screenRadius}px` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
