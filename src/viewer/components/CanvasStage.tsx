import React, { useRef, useState, useEffect } from 'react';
import { useSimulator } from '../hooks/useSimulator';
import { DeviceFrame } from './DeviceFrame';
import { MultiDeviceStage } from './MultiDeviceStage';
import { isMobileOrTablet } from '../utils/safeArea';

export const CanvasStage: React.FC = () => {
  const {
    currentDevice,
    multiDevices,
    layoutMode,
    orientation,
    zoom,
    fitToScreen,
    showFrame,
  } = useSimulator();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate auto-fit scale so the canvas is always perfectly sized & centered in viewport
  useEffect(() => {
    if (!fitToScreen) {
      setScale(zoom);
      return;
    }

    const calculateFit = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Available canvas area leaving margin for right dock and screen edges
      const availableWidth = canvas.clientWidth - 110;
      const availableHeight = canvas.clientHeight - 70;

      if (layoutMode === 'multi') {
        // Multi-device dimensions (Mobile + Desktop + Tablet side-by-side)
        const mobileW = multiDevices.mobile.width + 24;
        const desktopW = multiDevices.desktop.width + 32;
        const tabletW = multiDevices.tablet.width + 28;

        const maxH = Math.max(
          multiDevices.mobile.height,
          multiDevices.desktop.height,
          multiDevices.tablet.height
        ) + 100;

        const totalW = mobileW + desktopW + tabletW + 36 * 2 + 64;
        const totalH = maxH;

        const scaleX = availableWidth / totalW;
        const scaleY = availableHeight / totalH;
        const bestScale = Math.min(scaleX, scaleY, 1.0);
        setScale(Math.max(0.18, Number(bestScale.toFixed(2))));
        return;
      }

      // Single device dimensions
      const isMobile = isMobileOrTablet(currentDevice);
      const isLandscape = orientation === 'landscape' && isMobile;
      const framePadding = showFrame ? 32 : 8;
      const devWidth = (isLandscape ? currentDevice.height : currentDevice.width) + framePadding;
      const devHeight = (isLandscape ? currentDevice.width : currentDevice.height) + framePadding;

      const scaleX = availableWidth / devWidth;
      const scaleY = availableHeight / devHeight;
      const bestScale = Math.min(scaleX, scaleY, 1.0); // Never exceed 100% on auto-fit

      setScale(Math.max(0.25, Number(bestScale.toFixed(2))));
    };

    calculateFit();
    window.addEventListener('resize', calculateFit);
    return () => window.removeEventListener('resize', calculateFit);
  }, [
    fitToScreen,
    zoom,
    orientation,
    currentDevice,
    multiDevices,
    layoutMode,
    showFrame,
  ]);

  return (
    <main
      ref={canvasRef}
      className="relative flex-1 w-full h-screen bg-[#1f1f1f] canvas-grid flex items-center justify-center overflow-hidden select-none"
    >
      {/* Center Viewport Stage */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto inline-flex items-center justify-center"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {layoutMode === 'single' ? <DeviceFrame /> : <MultiDeviceStage />}
        </div>
      </div>
    </main>
  );
};
