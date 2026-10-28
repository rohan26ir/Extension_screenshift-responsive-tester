import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Watch,
  Plus,
  Tv,
  Store,
  ScanBarcode,
  Search,
} from 'lucide-react';
import { useSimulator } from '../hooks/useSimulator';
import { DeviceSpec } from '../../data/devices';

export const DeviceDrawer: React.FC = () => {
  const {
    devices,
    customDevices,
    currentDevice,
    setDevice,
    isDrawerOpen,
    setIsDrawerOpen,
    addCustomDevice,
  } = useSimulator();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWidth, setCustomWidth] = useState(393);
  const [customHeight, setCustomHeight] = useState(852);
  const [customDpr, setCustomDpr] = useState(3.0);
  const [customCategory, setCustomCategory] = useState<'phone' | 'tablet' | 'laptop' | 'watch' | 'desktop'>('phone');

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close catalog if user clicks outside the drawer
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (drawerRef.current && drawerRef.current.contains(e.target as Node)) {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-dock-drawer-trigger="true"]')) {
        return;
      }
      setIsDrawerOpen(false);
      setShowAddModal(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDrawerOpen, setIsDrawerOpen]);

  // Group devices into sections matching the reference image
  const { phones, tablets, specials, userCustom } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filterFn = (d: DeviceSpec) => {
      if (!query) return true;
      return d.name.toLowerCase().includes(query) || d.category.toLowerCase().includes(query);
    };

    const phonesList = devices.filter(
      (d) => (d.category === 'phone' || d.category === 'foldable') && !customDevices.some((c) => c.id === d.id) && filterFn(d)
    );

    const tabletsList = devices.filter(
      (d) => d.category === 'tablet' && !customDevices.some((c) => c.id === d.id) && filterFn(d)
    );

    const specialsList = devices.filter(
      (d) => (d.category === 'watch' || d.category === 'laptop' || d.category === 'desktop' || d.category === 'special') && !customDevices.some((c) => c.id === d.id) && filterFn(d)
    );

    const customList = customDevices.filter(filterFn);

    return {
      phones: phonesList,
      tablets: tabletsList,
      specials: specialsList,
      userCustom: customList,
    };
  }, [devices, customDevices, searchQuery]);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newDev: DeviceSpec = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      brand: 'Apple',
      category: customCategory,
      width: Number(customWidth) || 393,
      height: Number(customHeight) || 852,
      dpr: Number(customDpr) || 2.0,
      notchType: 'none',
      borderRadius: customCategory === 'watch' ? 40 : customCategory === 'laptop' ? 16 : 28,
      userAgent: navigator.userAgent,
      isPro: true,
      isNew: true,
    };

    addCustomDevice(newDev);
    setShowAddModal(false);
    setCustomName('');
  };

  // Render vector icon for device
  const renderDeviceIcon = (device: DeviceSpec) => {
    switch (device.category) {
      case 'watch':
        return (
          <div className="relative flex flex-col items-center justify-center my-1">
            <div className="w-2.5 h-1.5 bg-zinc-400 rounded-t-sm" />
            <div className="w-6 h-7 rounded-md border-[1.5px] border-zinc-600 bg-zinc-100 flex items-center justify-center shadow-xs">
              <div className="w-3.5 h-4.5 rounded-[3px] bg-zinc-300" />
            </div>
            <div className="w-2.5 h-1.5 bg-zinc-400 rounded-b-sm" />
          </div>
        );
      case 'laptop':
        return (
          <div className="flex flex-col items-center justify-center my-1.5">
            <div className="w-8 h-5 rounded-[2px] border-[1.5px] border-zinc-600 bg-zinc-100 flex items-center justify-center">
              <div className="w-6 h-3 bg-zinc-300 rounded-[1px]" />
            </div>
            <div className="w-10 h-1 bg-zinc-400 rounded-b-sm border-t border-zinc-600" />
          </div>
        );
      case 'desktop':
        return (
          <div className="flex flex-col items-center justify-center my-1">
            <div className="w-9 h-6 rounded-[2px] border-[1.5px] border-zinc-600 bg-zinc-100 flex items-center justify-center">
              <div className="w-7 h-4 bg-zinc-300 rounded-[1px]" />
            </div>
            <div className="w-2 h-1.5 bg-zinc-400" />
            <div className="w-5 h-0.5 bg-zinc-500 rounded-sm" />
          </div>
        );
      case 'tablet':
        return (
          <div className="w-7 h-9 rounded-sm border-[1.5px] border-zinc-600 bg-zinc-100 flex items-center justify-center my-1 shadow-xs">
            <div className="w-5 h-7 rounded-[1px] bg-zinc-300" />
          </div>
        );
      case 'special':
        if (device.id.includes('kiosk')) {
          return <Store className="w-7 h-7 text-zinc-600 my-1" />;
        }
        if (device.id.includes('zebra')) {
          return <ScanBarcode className="w-7 h-7 text-zinc-600 my-1" />;
        }
        return <Monitor className="w-7 h-7 text-zinc-600 my-1" />;
      default:
        // Phone / Foldable
        return (
          <div className="w-5 h-9 rounded-[4px] border-[1.5px] border-zinc-600 bg-zinc-100 flex items-center justify-center my-1 shadow-xs">
            <div className="w-3.5 h-7 rounded-[2px] bg-zinc-300" />
          </div>
        );
    }
  };

  const renderCard = (device: DeviceSpec) => {
    const isSelected = currentDevice.id === device.id;

    return (
      <button
        key={device.id}
        onClick={() => {
          setDevice(device);
          setIsDrawerOpen(false);
        }}
        className={`relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all text-center group bg-white shadow-xs ${
          isSelected
            ? 'border-blue-600 ring-2 ring-blue-500/80 bg-blue-50/30'
            : 'border-zinc-200/90 hover:border-zinc-400 hover:shadow-sm'
        }`}
        style={{ minHeight: '92px' }}
      >
        {/* Badges in top right corner */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
          {device.isPro && (
            <span className="text-[9px] font-bold px-1 py-[0.5px] bg-blue-600 text-white rounded-[2px] leading-tight">
              PRO
            </span>
          )}
          {device.isNew && (
            <span className="text-[9px] font-bold px-1 py-[0.5px] bg-emerald-600 text-white rounded-[2px] leading-tight">
              NEW
            </span>
          )}
        </div>

        {/* Center Vector Icon */}
        <div className="flex-1 flex items-center justify-center w-full pt-1">
          {renderDeviceIcon(device)}
        </div>

        {/* Device Name */}
        <span className="text-[11px] font-medium text-zinc-800 line-clamp-2 w-full px-0.5 leading-tight">
          {device.name}
        </span>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <motion.aside
          ref={drawerRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-[540px] z-50 bg-white border-l border-zinc-200 flex flex-col shadow-2xl select-none"
        >
            {/* Top Close bar */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-zinc-100">
              <div className="relative flex-1 mr-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 40+ devices..."
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Matrix */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar text-zinc-900 bg-white">
              
              {/* VISIBLE DEVICES IN THE TAB SECTION */}
              <div>
                <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase block mb-3">
                  Visible devices in the tab
                </span>
                <div className="flex items-center gap-3">
                  {/* Current Active Device Icon Circle */}
                  <div className="relative w-12 h-12 rounded-full border-2 border-blue-600 bg-blue-50/50 flex items-center justify-center shadow-xs">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>

                  {/* Add New Device Circle */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-12 h-12 rounded-full border border-dashed border-zinc-300 hover:border-blue-500 hover:bg-blue-50/30 flex items-center justify-center text-zinc-500 hover:text-blue-600 transition-all"
                      title="Add Custom Device"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1 py-[1px] bg-emerald-600 text-white rounded-[2px]">
                      NEW
                    </span>
                  </div>
                </div>
              </div>

              {/* PHONES SECTION */}
              <div>
                <div className="grid grid-cols-5 gap-2">
                  {phones.map(renderCard)}
                </div>
              </div>

              {/* TABLETS SECTION */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 mb-2.5">
                  <span className="text-sm">🔲</span>
                  <span>Tablets</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {tablets.map(renderCard)}
                </div>
              </div>

              {/* SPECIALS SECTION */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 mb-2.5">
                  <span className="text-[9px] font-bold px-1 py-[0.5px] bg-emerald-600 text-white rounded-[2px]">
                    NEW
                  </span>
                  <span className="text-sm">⌚</span>
                  <span>Specials</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {specials.map(renderCard)}
                </div>
              </div>

              {/* MY CUSTOM DEVICES SECTION */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 mb-2.5">
                  <span className="text-[9px] font-bold px-1 py-[0.5px] bg-emerald-600 text-white rounded-[2px]">
                    NEW
                  </span>
                  <span className="text-sm">💻</span>
                  <span>My custom devices</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {/* + Button Card */}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="relative flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-zinc-300 hover:border-blue-500 hover:bg-blue-50/20 transition-all text-center group bg-white shadow-xs"
                    style={{ minHeight: '92px' }}
                  >
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[9px] font-bold px-1 py-[0.5px] bg-blue-600 text-white rounded-[2px]">
                        PRO
                      </span>
                    </div>
                    <Plus className="w-6 h-6 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-[10px] font-medium text-zinc-500 mt-2">Add Device</span>
                  </button>

                  {userCustom.map(renderCard)}
                </div>
              </div>

              {/* Add Custom Device Overlay (Inside drawer only, doesn't affect main screen) */}
              <AnimatePresence>
                {showAddModal && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 z-30 bg-white p-6 flex flex-col justify-between overflow-y-auto text-zinc-800"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
                        <h3 className="text-base font-bold text-zinc-900">Add Custom Device</h3>
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form id="custom-device-form" onSubmit={handleCreateCustom} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Device Name</label>
                          <input
                            type="text"
                            required
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="e.g. Surface Laptop 5"
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Width (px)</label>
                            <input
                              type="number"
                              required
                              value={customWidth}
                              onChange={(e) => setCustomWidth(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Height (px)</label>
                            <input
                              type="number"
                              required
                              value={customHeight}
                              onChange={(e) => setCustomHeight(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">DPR / Scale</label>
                            <input
                              type="number"
                              step="0.5"
                              required
                              value={customDpr}
                              onChange={(e) => setCustomDpr(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Category</label>
                            <select
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value as any)}
                              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-blue-500 bg-white"
                            >
                              <option value="phone">Phone</option>
                              <option value="tablet">Tablet</option>
                              <option value="laptop">Laptop</option>
                              <option value="watch">Watch</option>
                              <option value="desktop">Desktop</option>
                            </select>
                          </div>
                        </div>
                      </form>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        form="custom-device-form"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                      >
                        Save & Select Device
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.aside>
      )}
    </AnimatePresence>
  );
};
