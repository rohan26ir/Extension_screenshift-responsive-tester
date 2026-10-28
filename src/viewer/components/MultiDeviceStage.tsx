import React from 'react';
import { useSimulator, DeviceSlotType } from '../hooks/useSimulator';
import { DeviceFrame } from './DeviceFrame';
import {
  Smartphone,
  Tablet,
  Laptop,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { DeviceSpec } from '../../data/devices';

export const MultiDeviceStage: React.FC = () => {
  const {
    multiDevices,
    slotOrder,
    swapSlots,
    setDevice,
    setLayoutMode,
  } = useSimulator();

  const getSlotDetails = (slotType: DeviceSlotType): {
    device: DeviceSpec;
    name: string;
    label: string;
    icon: React.ReactNode;
    colorClass: string;
  } => {
    switch (slotType) {
      case 'mobile':
        return {
          device: multiDevices.mobile,
          name: multiDevices.mobile.name,
          label: 'Mobile',
          icon: <Smartphone className="w-3.5 h-3.5 text-blue-400" />,
          colorClass: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
        };
      case 'desktop':
        return {
          device: multiDevices.desktop,
          name: multiDevices.desktop.name,
          label: 'Desktop (PC)',
          icon: <Laptop className="w-3.5 h-3.5 text-purple-400" />,
          colorClass: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
        };
      case 'tablet':
        return {
          device: multiDevices.tablet,
          name: multiDevices.tablet.name,
          label: 'Tablet',
          icon: <Tablet className="w-3.5 h-3.5 text-emerald-400" />,
          colorClass: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
        };
    }
  };

  const positionLabels = ['Left', 'Center', 'Right'];

  return (
    <div
      id="multi-device-workspace-composite"
      className="relative inline-flex items-end justify-center p-8 transition-all duration-300 select-none gap-9"
    >
      {slotOrder.map((slotType, index) => {
        const details = getSlotDetails(slotType);
        const canMoveLeft = index > 0;
        const canMoveRight = index < slotOrder.length - 1;

        return (
          <div
            key={slotType}
            className="flex flex-col items-center gap-3 transition-all duration-300"
          >
            {/* Inline Slot Header with Dynamic Position Swapping Controls */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 text-xs font-medium shadow-xl backdrop-blur-md">
              {/* Move Left Button */}
              <button
                type="button"
                disabled={!canMoveLeft}
                onClick={() => swapSlots(index, index - 1)}
                className={`p-1 rounded-full transition-colors ${
                  canMoveLeft
                    ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
                    : 'opacity-25 cursor-not-allowed text-zinc-600'
                }`}
                title={canMoveLeft ? `Swap left with ${slotOrder[index - 1]}` : 'Leftmost position'}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Slot Position Tag & Device Info */}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${details.colorClass}`}>
                {positionLabels[index]}: {details.label}
              </span>

              <div className="flex items-center gap-1.5 pl-0.5">
                {details.icon}
                <span className="font-semibold text-white text-xs max-w-[140px] truncate">
                  {details.name}
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">
                  {details.device.width} × {details.device.height}
                </span>
              </div>

              {/* Focus Single View Button */}
              <button
                type="button"
                onClick={() => {
                  setDevice(details.device);
                  setLayoutMode('single');
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
                title={`Focus ${details.name} in single view`}
              >
                <Maximize2 className="w-3 h-3" />
              </button>

              {/* Move Right Button */}
              <button
                type="button"
                disabled={!canMoveRight}
                onClick={() => swapSlots(index, index + 1)}
                className={`p-1 rounded-full transition-colors ${
                  canMoveRight
                    ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
                    : 'opacity-25 cursor-not-allowed text-zinc-600'
                }`}
                title={canMoveRight ? `Swap right with ${slotOrder[index + 1]}` : 'Rightmost position'}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulated Device Frame */}
            <DeviceFrame
              device={details.device}
              frameId={`multi-slot-${slotType}`}
              isMultiView
            />
          </div>
        );
      })}
    </div>
  );
};
