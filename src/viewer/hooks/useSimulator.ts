import { create } from 'zustand';
import { DEVICES, DeviceSpec } from '../../data/devices';
import { storage } from '../../utils/storage';
import { isMobileOrTablet, RotationAngle } from '../utils/safeArea';
import { BrowserChromeType } from '../components/BrowserChromeOverlay';

export type Orientation = 'portrait' | 'landscape';
export type ChassisColor =
  | 'natural-titanium'
  | 'space-black'
  | 'silver'
  | 'starlight'
  | 'midnight'
  | 'rose-gold'
  | 'blue'
  | 'titanium'
  | 'gold'
  | 'pink';

export type StatusBarStyle = 'dark' | 'light';
export type LayoutMode = 'single' | 'multi';
export type DeviceSlotType = 'mobile' | 'desktop' | 'tablet';

export interface MultiDeviceSlots {
  mobile: DeviceSpec;
  desktop: DeviceSpec;
  tablet: DeviceSpec;
}

interface SimulatorState {
  // Device selection (Single View)
  currentDevice: DeviceSpec;
  devices: DeviceSpec[];
  customDevices: DeviceSpec[];
  favorites: string[];

  // Multi-Device Workspace: Left (mobile), Center (desktop), Right (tablet)
  layoutMode: LayoutMode;
  multiDevices: MultiDeviceSlots;
  slotOrder: DeviceSlotType[];
  syncScroll: boolean;
  
  // Display & Canvas settings
  orientation: Orientation;
  rotationAngle: RotationAngle;
  zoom: number;
  fitToScreen: boolean;
  showFrame: boolean;
  touchMode: boolean;
  statusBarVisible: boolean;
  statusBarStyle: StatusBarStyle;
  chassisColor: ChassisColor;
  browserChrome: BrowserChromeType;
  isDrawerOpen: boolean;

  // Webview navigation & shared routing
  url: string;
  inputUrl: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  iframeKey: number;

  // Filter & Search states
  searchQuery: string;
  brandFilter: 'all' | 'Apple' | 'Android';
  categoryFilter: 'all' | 'phone' | 'tablet' | 'foldable';

  // Actions
  setDevice: (device: DeviceSpec) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleLayoutMode: () => void;
  setMultiDevice: (slot: DeviceSlotType, device: DeviceSpec) => void;
  swapSlots: (index1: number, index2: number) => void;
  moveSlot: (fromIndex: number, toIndex: number) => void;
  toggleSyncScroll: () => void;
  setBrowserChrome: (chrome: BrowserChromeType) => void;

  toggleOrientation: () => void;
  setRotationAngle: (angle: RotationAngle) => void;
  setZoom: (zoom: number) => void;
  toggleFitToScreen: () => void;
  toggleFrame: () => void;
  toggleTouchMode: () => void;
  toggleStatusBar: () => void;
  toggleStatusBarStyle: () => void;
  setStatusBarStyle: (style: StatusBarStyle) => void;
  setChassisColor: (color: ChassisColor) => void;
  toggleDrawer: () => void;
  setIsDrawerOpen: (open: boolean) => void;
  
  // Navigation & Shared Routing actions
  setUrl: (url: string) => void;
  setInputUrl: (url: string) => void;
  submitUrl: (url?: string) => void;
  syncRoute: (newUrl: string) => void;
  reloadIframe: () => void;
  navigateBack: () => void;
  navigateForward: () => void;
  setIsLoading: (loading: boolean) => void;

  // Filters & Favorites
  setSearchQuery: (query: string) => void;
  setBrandFilter: (brand: 'all' | 'Apple' | 'Android') => void;
  setCategoryFilter: (category: 'all' | 'phone' | 'tablet' | 'foldable') => void;
  toggleFavorite: (deviceId: string) => void;
  addCustomDevice: (device: DeviceSpec) => void;

  // Initialization
  initializeState: () => Promise<void>;
}

// Default devices for slots: Left: Mobile, Center: Desktop, Right: Tablet
const defaultMobile = DEVICES.find((d) => d.id === 'iphone-15-pro') || DEVICES[0];
const defaultDesktop = DEVICES.find((d) => d.id === 'macbook-air') || DEVICES[2];
const defaultTablet = DEVICES.find((d) => d.id === 'ipad-pro-11') || DEVICES[1];

function getInitialUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get('url');
    if (queryUrl) {
      return queryUrl;
    }
  } catch {
    // ignore
  }
  return 'https://react.dev';
}

const initialUrl = getInitialUrl();

export const useSimulator = create<SimulatorState>((set, get) => ({
  currentDevice: defaultMobile,
  devices: DEVICES,
  customDevices: [],
  favorites: ['iphone-15-pro', 'galaxy-s24-ultra', 'pixel-10-pro', 'ipad-pro-11', 'macbook-air'],

  // Multi-Device Workspace: Left (mobile), Center (desktop), Right (tablet)
  layoutMode: 'single',
  slotOrder: ['mobile', 'desktop', 'tablet'],
  multiDevices: {
    mobile: defaultMobile,
    desktop: defaultDesktop,
    tablet: defaultTablet,
  },
  syncScroll: true,

  // Display & Canvas defaults
  orientation: 'portrait',
  rotationAngle: 0,
  zoom: 1,
  fitToScreen: true,
  showFrame: true,
  touchMode: true,
  statusBarVisible: true,
  statusBarStyle: 'dark',
  chassisColor: 'natural-titanium',
  browserChrome: 'none',
  isDrawerOpen: false,

  url: initialUrl,
  inputUrl: initialUrl,
  history: [initialUrl],
  historyIndex: 0,
  isLoading: false,
  iframeKey: 0,

  searchQuery: '',
  brandFilter: 'all',
  categoryFilter: 'all',

  setDevice: (device) => {
    const isMobile = isMobileOrTablet(device);
    set({
      currentDevice: device,
      ...(isMobile
        ? {}
        : {
            orientation: 'portrait',
            rotationAngle: 0,
          }),
    });
    storage.set('last_device_id', device.id);
  },

  setLayoutMode: (mode) => {
    set({ layoutMode: mode });
    storage.set('screenshift_layout_mode', mode);
  },

  toggleLayoutMode: () => {
    set((state) => {
      const nextMode = state.layoutMode === 'single' ? 'multi' : 'single';
      storage.set('screenshift_layout_mode', nextMode);
      return { layoutMode: nextMode };
    });
  },

  setMultiDevice: (slot, device) => {
    set((state) => {
      const updated = { ...state.multiDevices, [slot]: device };
      storage.set(`screenshift_multi_${slot}`, device.id);
      return { multiDevices: updated };
    });
  },

  swapSlots: (index1, index2) => {
    set((state) => {
      const order = [...state.slotOrder];
      if (index1 < 0 || index1 >= order.length || index2 < 0 || index2 >= order.length) {
        return state;
      }
      const temp = order[index1];
      order[index1] = order[index2];
      order[index2] = temp;
      storage.set('screenshift_slot_order', order);
      return { slotOrder: order };
    });
  },

  moveSlot: (fromIndex, toIndex) => {
    set((state) => {
      const order = [...state.slotOrder];
      if (fromIndex < 0 || fromIndex >= order.length || toIndex < 0 || toIndex >= order.length) {
        return state;
      }
      const [item] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, item);
      storage.set('screenshift_slot_order', order);
      return { slotOrder: order };
    });
  },

  toggleSyncScroll: () => {
    set((state) => {
      const next = !state.syncScroll;
      storage.set('screenshift_sync_scroll', next);
      return { syncScroll: next };
    });
  },

  setBrowserChrome: (chrome) => {
    set({ browserChrome: chrome });
    storage.set('screenshift_browser_chrome', chrome);
  },

  toggleOrientation: () => {
    const { layoutMode, currentDevice, rotationAngle } = get();
    // Rotation is strictly disabled in 3-Device Split View and for non-mobile/tablet devices
    if (layoutMode === 'multi' || !isMobileOrTablet(currentDevice)) return;

    // Unidirectional Left-Only Rotation: 0° (Portrait) <-> 270° (Landscape-Left)
    const nextAngle: RotationAngle = rotationAngle === 0 ? 270 : 0;
    const nextOrientation: Orientation = nextAngle === 270 ? 'landscape' : 'portrait';

    set({
      rotationAngle: nextAngle,
      orientation: nextOrientation,
    });
  },

  setRotationAngle: (angle) => {
    const { layoutMode, currentDevice } = get();
    if (layoutMode === 'multi' || !isMobileOrTablet(currentDevice)) return;

    set({
      rotationAngle: angle,
      orientation: angle === 0 ? 'portrait' : 'landscape',
    });
  },

  setZoom: (zoom) => {
    const clamped = Math.min(Math.max(zoom, 0.25), 2.5);
    set({ zoom: clamped, fitToScreen: false });
  },

  toggleFitToScreen: () => {
    set((state) => ({ fitToScreen: !state.fitToScreen }));
  },

  toggleFrame: () => {
    set((state) => ({ showFrame: !state.showFrame }));
  },

  toggleTouchMode: () => {
    set((state) => {
      const nextVal = !state.touchMode;
      storage.set('screenshift_touchMode', nextVal);
      try {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((ifr) => {
          ifr.contentWindow?.postMessage({ type: 'SCREENSHIFT_TOUCH_MODE', enabled: nextVal }, '*');
        });
      } catch {
        // ignore
      }
      return { touchMode: nextVal };
    });
  },

  toggleStatusBar: () => {
    set((state) => ({ statusBarVisible: !state.statusBarVisible }));
  },

  toggleStatusBarStyle: () => {
    set((state) => {
      const nextStyle = state.statusBarStyle === 'dark' ? 'light' : 'dark';
      storage.set('status_bar_style', nextStyle);
      return { statusBarStyle: nextStyle };
    });
  },

  setStatusBarStyle: (style) => {
    set({ statusBarStyle: style });
    storage.set('status_bar_style', style);
  },

  setChassisColor: (color) => {
    set({ chassisColor: color });
    storage.set('chassis_color', color);
  },

  toggleDrawer: () => {
    set((state) => ({ isDrawerOpen: !state.isDrawerOpen }));
  },

  setIsDrawerOpen: (open) => {
    set({ isDrawerOpen: open });
  },

  setUrl: (newUrl) => {
    set({ url: newUrl, inputUrl: newUrl });
  },

  setInputUrl: (val) => {
    set({ inputUrl: val });
  },

  // Synchronized route change originating from inside an iframe
  syncRoute: (newUrl) => {
    const cleanUrl = newUrl.trim();
    if (!cleanUrl || cleanUrl === get().url) return;

    const { history, historyIndex } = get();
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(cleanUrl);

    set({
      url: cleanUrl,
      inputUrl: cleanUrl,
      history: updatedHistory,
      historyIndex: updatedHistory.length - 1,
    });

    storage.set('last_url', cleanUrl);

    // Broadcast synchronization to all other iframes
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((ifr) => {
        ifr.contentWindow?.postMessage(
          { type: 'SCREENSHIFT_SYNC_ROUTE', url: cleanUrl },
          '*'
        );
      });
    } catch {
      // ignore
    }
  },

  submitUrl: (targetUrl) => {
    let rawUrl = (targetUrl || get().inputUrl).trim();
    if (!rawUrl) return;

    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      if (rawUrl.startsWith('localhost') || rawUrl.startsWith('127.0.0.1')) {
        rawUrl = `http://${rawUrl}`;
      } else {
        rawUrl = `https://${rawUrl}`;
      }
    }

    const { history, historyIndex } = get();
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(rawUrl);

    set({
      url: rawUrl,
      inputUrl: rawUrl,
      history: updatedHistory,
      historyIndex: updatedHistory.length - 1,
      iframeKey: Date.now(),
      isLoading: true,
    });

    storage.set('last_url', rawUrl);
  },

  reloadIframe: () => {
    set({
      iframeKey: Date.now(),
      isLoading: true,
    });
  },

  navigateBack: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevUrl = history[prevIndex];
      set({
        historyIndex: prevIndex,
        url: prevUrl,
        inputUrl: prevUrl,
        iframeKey: Date.now(),
        isLoading: true,
      });
      storage.set('last_url', prevUrl);
    }
  },

  navigateForward: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextUrl = history[nextIndex];
      set({
        historyIndex: nextIndex,
        url: nextUrl,
        inputUrl: nextUrl,
        iframeKey: Date.now(),
        isLoading: true,
      });
      storage.set('last_url', nextUrl);
    }
  },

  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setBrandFilter: (brand) => {
    set({ brandFilter: brand });
  },

  setCategoryFilter: (category) => {
    set({ categoryFilter: category });
  },

  toggleFavorite: (deviceId) => {
    set((state) => {
      const exists = state.favorites.includes(deviceId);
      const newFavs = exists
        ? state.favorites.filter((id) => id !== deviceId)
        : [...state.favorites, deviceId];
      storage.set('favorites', newFavs);
      return { favorites: newFavs };
    });
  },

  addCustomDevice: (newDevice) => {
    set((state) => {
      const updatedCustom = [...state.customDevices, newDevice];
      const updatedDevices = [...state.devices, newDevice];
      storage.set('custom_devices', updatedCustom);
      return {
        customDevices: updatedCustom,
        devices: updatedDevices,
        currentDevice: newDevice,
      };
    });
  },

  initializeState: async () => {
    const savedCustom = await storage.get<DeviceSpec[] | null>('custom_devices', null);
    if (savedCustom && Array.isArray(savedCustom)) {
      set({
        customDevices: savedCustom,
        devices: [...DEVICES, ...savedCustom],
      });
    }

    const savedDeviceId = await storage.get<string | null>('last_device_id', null);
    if (savedDeviceId) {
      const found = DEVICES.find((d) => d.id === savedDeviceId);
      if (found) {
        set({ currentDevice: found });
      }
    }

    // Load multi-device slots
    const savedMobileId = await storage.get<string | null>('screenshift_multi_mobile', null);
    const savedDesktopId = await storage.get<string | null>('screenshift_multi_desktop', null);
    const savedTabletId = await storage.get<string | null>('screenshift_multi_tablet', null);

    set((state) => ({
      multiDevices: {
        mobile: (savedMobileId && DEVICES.find((d) => d.id === savedMobileId)) || state.multiDevices.mobile,
        desktop: (savedDesktopId && DEVICES.find((d) => d.id === savedDesktopId)) || state.multiDevices.desktop,
        tablet: (savedTabletId && DEVICES.find((d) => d.id === savedTabletId)) || state.multiDevices.tablet,
      },
    }));

    const savedSlotOrder = await storage.get<DeviceSlotType[] | null>('screenshift_slot_order', null);
    if (savedSlotOrder && Array.isArray(savedSlotOrder) && savedSlotOrder.length === 3) {
      set({ slotOrder: savedSlotOrder });
    }

    const savedLayout = await storage.get<LayoutMode | null>('screenshift_layout_mode', null);
    if (savedLayout) set({ layoutMode: savedLayout });

    const savedSyncScroll = await storage.get<boolean | null>('screenshift_sync_scroll', null);
    if (savedSyncScroll !== null) set({ syncScroll: savedSyncScroll });

    const savedChrome = await storage.get<BrowserChromeType | null>('screenshift_browser_chrome', null);
    if (savedChrome) set({ browserChrome: savedChrome });

    const savedFavs = await storage.get<string[] | null>('favorites', null);
    if (savedFavs && Array.isArray(savedFavs)) {
      set({ favorites: savedFavs });
    }

    const savedChassis = await storage.get<ChassisColor | null>('chassis_color', null);
    if (savedChassis) {
      set({ chassisColor: savedChassis });
    }

    const savedTouch = await storage.get<boolean | null>('screenshift_touchMode', null);
    if (savedTouch !== null) {
      set({ touchMode: savedTouch });
    }

    const savedStatusStyle = await storage.get<StatusBarStyle | null>('status_bar_style', null);
    if (savedStatusStyle) {
      set({ statusBarStyle: savedStatusStyle });
    }

    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get('url');
    if (!queryUrl) {
      const savedUrl = await storage.get<string | null>('last_url', null);
      if (savedUrl) {
        set({
          url: savedUrl,
          inputUrl: savedUrl,
          history: [savedUrl],
        });
      }
    }
  },
}));
