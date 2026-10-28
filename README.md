# ScreenShift - Mobile Simulator & Responsive Tester

> Preview websites across 40+ realistic mobile and tablet viewports with native safe areas, left rotation, and zero data tracking.
>
> 🌐 **Official Website:** [https://screenshift.vercel.app/](https://screenshift.vercel.app/)

---

[![Official Website](https://img.shields.io/badge/Official%20Site-screenshift.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://screenshift.vercel.app/)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Extension%20Ready-059669?style=for-the-badge&logo=googlechrome&logoColor=white)](https://screenshift.vercel.app/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3%20Compliant-d97706?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Safe Browsing](https://img.shields.io/badge/Enhanced%20Safe%20Browsing-Strict%20Zero%20Data-10b981?style=for-the-badge&logo=shield&logoColor=white)](https://screenshift.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.0-0284c7?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-8b5cf6?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](LICENSE)

---

## 📑 Table of Contents
- [1. Overview](#1-overview)
- [2. Key Features](#2-key-features)
  - [A. Multi-Device Workspace (3-Device Split View)](#a-multi-device-workspace-3-device-split-view)
  - [B. Left-Only Rotation & Native Safe-Area Simulation](#b-left-only-rotation--native-safe-area-simulation)
  - [C. Device-Scoped Browser Chrome Overlays](#c-device-scoped-browser-chrome-overlays)
  - [D. Studio Capture & Single-Page White PDF Export Engine](#d-studio-capture--single-page-white-pdf-export-engine)
  - [E. Touch Emulation & Gesture Support](#e-touch-emulation--gesture-support)
  - [F. Localhost & Header Modification Engine](#f-localhost--header-modification-engine)
- [3. Security & Privacy Commitment](#3-security--privacy-commitment)
- [4. Architecture & Tech Stack](#4-architecture--tech-stack)
- [5. Installation & Local Development](#5-installation--local-development)
  - [Prerequisites](#prerequisites)
  - [Build Instructions](#build-instructions)
  - [Loading Unpacked Extension in Chrome](#loading-unpacked-extension-in-chrome)
- [6. How to Use ScreenShift](#6-how-to-use-screenshift)
- [7. Support & Bug Reporting](#7-support--bug-reporting)

---

## 1. Overview

**ScreenShift** is a Google Chrome Extension built strictly on **Manifest V3** for frontend developers, QA automation engineers, product designers, and web agencies. It bridges the gap between browser devtools and physical device testing by allowing you to preview, interact with, and capture any live public URL or local development server (`http://localhost:*`, `http://127.0.0.1:*`) within photorealistic device hardware viewports.

Unlike conventional responsive mode toolbars, ScreenShift renders real-world hardware finishes (Space Black, Natural Titanium, Silver, Starlight), accurate physical bezels, camera notches, dynamic status bars, and operating system safe-area insets (`env(safe-area-inset-*)`). It features a synchronized **3-Device Split View** (Phone + Desktop + Tablet side-by-side) with reorderable slots, bi-directional routing synchronization, and a zero-dependency **Single-Page White PDF Export Engine**.

Discover more interactive demos and releases on the [ScreenShift Official Website](https://screenshift.vercel.app/).

---

## 2. Key Features

### A. Multi-Device Workspace (3-Device Split View)
- **Concurrent 3-Device Viewport**: Test your web application across **Phone**, **Desktop (PC)**, and **Tablet** simultaneously side-by-side on an infinite scalable canvas.
- **Dynamic Slot Reordering**: Reorder and swap device positions (Left, Center, Right) inline directly in the workspace header using intuitive swap controls without interrupting your active browsing session.
- **Bi-Directional Route Synchronization**: When you navigate, click internal links, change SPA routes (`pushState` / `replaceState`), reload, or trigger browser history navigation in **any** of the three frames, all three viewports automatically update in lockstep to the exact same URL.
- **Split-View Guardrails**: Disables rotation in 3-device view to maintain a consistent comparison layout across standard device form factors.

### B. Left-Only Rotation & Native Safe-Area Simulation
- **Unidirectional Rotation (`0°` portrait ↔ `270°` landscape-left)**: Matches physical smartphone and tablet ergonomics where counter-clockwise landscape rotation places the camera notch on the left edge.
- **Device-Category Scoping**: Rotation controls and dynamic safe-area calculations apply strictly to Mobile and Tablet presets. Desktop, Laptop, and TV viewports remain anchored to standard zero-inset desktop layouts.
- **Dynamic Safe-Area Inset Recalculation**:
  - **Portrait Mode**: Top inset active (status bar, dynamic island, or camera cutout), Bottom inset active (home indicator pill), Left & Right insets `0px`.
  - **Landscape Mode**: Top inset collapses to `0px`, Bottom inset active (home bar), Left inset dynamically adopts the camera cutout width (`env(safe-area-inset-left)`), Right inset `0px`.

### C. Device-Scoped Browser Chrome Overlays
ScreenShift enforces authentic browser top-bars tailored strictly to the device family:
- **Smartphones**: Mobile Safari (iOS rounded URL bar, reload icon, tab switcher) or Mobile Chrome (Android Material address pill, SSL padlock, overflow menu).
- **Tablets**: iPadOS Safari (horizontal tab strip with active website favicon and split view buttons) or Android Chrome Tablet (multi-tab bar).
- **Desktops & Laptops**: Desktop Chrome (integrated window controls, omnibox, extensions puzzle piece, reload and navigation arrows) or Desktop Safari (traffic light window controls, centered unified pill).
- **Clean Mode (None)**: Instantly strip all browser chrome overlays to maximize screen real estate.

### D. Studio Capture & Single-Page White PDF Export Engine
- **Quick-Capture Selector Popover**: Streamlined 2x2 grid accessible via the camera action icon:
  1. **Isolated Mockup**: High-resolution device frame + screen content on a transparent background.
  2. **Viewport Only**: Clean web content capture without chassis or bezels.
  3. **Full-Page Scroll**: Glitch-free top-to-bottom page stitching that automatically hides sticky/fixed headers to eliminate seam duplication and settles lazy-loaded imagery.
  4. **Mockup on Canvas**: Device frame centered on a customizable studio backdrop with live color picker and padding sliders.
- **Single-Page White PDF Export**:
  - Automatically renders on a pure, solid white background (`#FFFFFF` / `1 1 1 rg`), completely stripping dark studio backdrops, UI panels, and canvas checkers so exported documents are 100% print-ready.
  - Features standardized page presets: **A4 (Default: 210 × 297 mm)**, **US Letter (8.5 × 11 in)**, **US Legal (8.5 × 14 in)**, and **A3 (297 × 420 mm)**.
  - Proportional single-page fit algorithm scales content to fit cleanly onto exactly **1 page** with zero overflow onto page 2.
- **Multi-Format Export**: One-click downloads for **PNG**, **WebP**, **JPEG**, and **PDF**, plus direct **Copy to Clipboard**.

### E. Touch Emulation & Gesture Support
- Injects a zero-overhead touch emulation content script converting mouse interactions into standard W3C `touchstart`, `touchmove`, and `touchend` events.
- Simulates realistic touch radiuses and provides an optional visual touch cursor indicator.

### F. Localhost & Header Modification Engine
- Uses Chrome's `declarativeNetRequest` API scoped exclusively to subframes (`RESOURCE_TYPE_SUB_FRAME`) to strip `X-Frame-Options` and `Content-Security-Policy: frame-ancestors` headers.
- Allows testing of local dev servers (`localhost:3000`, `localhost:5173`, `127.0.0.1:8080`) and third-party production sites directly within the simulator.

---

## 3. Security & Privacy Commitment

ScreenShift is engineered to meet the highest security requirements for **Google Chrome Web Store** distribution and **Enhanced Safe Browsing** compliance:

| Policy | ScreenShift Implementation |
|---|---|
| **Zero Data Collection** | Absolutely **no analytics, cookies, identifiers, or tracking scripts**. Your URLs and inputs never leave your computer. |
| **100% Local Execution** | All rendering, viewport simulation, touch translation, and PDF compilation take place locally inside your browser runtime. |
| **Strict Content Security Policy** | Enforces `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }` with zero remote code execution (`eval()`, `new Function()`, or CDN scripts). |
| **Zero-Dependency PDF Engine** | Built-in ISO 32000-1 binary PDF stream builder that runs entirely offline with zero third-party cloud conversion services. |
| **Least-Privilege Permissions** | Scoped strictly to `activeTab` (for viewport injection), `storage` (for local settings persistence), and `declarativeNetRequest` (for local subframe embedding). |

---

## 4. Architecture & Tech Stack

```text
ScreenShift/
├── manifest.json              # Extension Manifest V3 configuration & CSP
├── package.json               # Node dependencies & build scripts
├── tsconfig.json              # Strict TypeScript configuration
├── vite.config.ts             # Vite + CRXJS plugin configuration
├── tailwind.config.js         # Tailwind CSS styling configuration
├── icons/                     # Extension branding icons (16px, 48px, 128px)
├── src/
│   ├── background/
│   │   ├── serviceWorker.ts   # MV3 background worker, tab capture & URL management
│   │   └── rules.ts           # DeclarativeNetRequest header modification rules
│   ├── content/
│   │   └── touchSimulator.ts  # Injected touch emulation & route sync listener
│   ├── data/
│   │   └── devices.ts         # Specifications for 40+ mobile, tablet, and desktop viewports
│   ├── viewer/
│   │   ├── index.html         # Simulator viewer container
│   │   ├── main.tsx           # React root mounting point
│   │   ├── App.tsx            # Main state coordinator & keyboard shortcuts
│   │   ├── components/
│   │   │   ├── ActionDock.tsx             # Floating right-hand action dock & popovers
│   │   │   ├── BrowserChromeOverlay.tsx   # Device-scoped browser address bars
│   │   │   ├── CanvasStage.tsx            # Zoomable/pannable stage container
│   │   │   ├── CapturePreviewModal.tsx    # Fullscreen capture preview & format selectors
│   │   │   ├── DeviceDrawer.tsx           # Categorized device matrix drawer
│   │   │   ├── DeviceFrame.tsx            # Photorealistic chassis, notch, & safe-area renderer
│   │   │   ├── MultiDeviceStage.tsx       # 3-Device synchronized split view
│   │   │   ├── StatusBar.tsx              # Native iOS & Android status bars
│   │   │   └── TouchLayer.tsx             # Pointer-to-touch interaction layer
│   │   ├── hooks/
│   │   │   ├── useScreenshot.ts           # Screenshot capture store (PNG/WebP/JPEG/PDF)
│   │   │   └── useSimulator.ts            # Viewport, orientation, & device state store
│   │   ├── styles/
│   │   │   └── bezels.css                 # Hardware chassis & border-radius CSS
│   │   └── utils/
│   │       ├── pdfExport.ts               # Standalone ISO 32000-1 PDF generator
│   │       └── storage.ts                 # chrome.storage.local persistence wrapper
```

- **Core Technologies**: [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/), [Tailwind CSS 3.4](https://tailwindcss.com/), [Vite 5.4](https://vitejs.dev/)
- **Extension Architecture**: [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) for fast HMR and Manifest V3 compilation
- **State Coordination**: [Zustand 5](https://github.com/pmndrs/zustand) with local storage sync
- **Icons & UI**: [Lucide React](https://lucide.dev/), [Framer Motion 12](https://www.framer.com/motion/)

---

## 5. Installation & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (v9.0.0 or higher)
- Google Chrome or any Chromium browser (Edge, Brave, Arc, Opera)

### Build Instructions

1. Clone the project repository:
   ```bash
   git clone https://github.com/your-username/ScreenShift-projects.git
   cd ScreenShift-projects/ScreenShift
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the production extension package:
   ```bash
   npm run build
   ```
   This compiles all TypeScript files, bundles the React application with Vite, and produces the production-ready extension package in `ScreenShift/dist`.

4. (Optional) Run development mode with Hot Module Replacement:
   ```bash
   npm run dev
   ```

### Loading Unpacked Extension in Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch located in the top-right corner.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the **`ScreenShift`** directory (or `ScreenShift/dist` folder).
5. The **ScreenShift** icon will appear in your Chrome toolbar. Pin it to your browser bar for quick 1-click access!

---

## 6. How to Use ScreenShift

1. **Activate Simulator**: Open any web page or local development site (e.g. `http://localhost:3000`) and click the ScreenShift icon in the Chrome extension bar.
2. **Switch Devices**: Open the **Device Drawer** from the action dock to select between iPhones, iPads, Android smartphones, foldables, or desktop screens.
3. **Toggle 3-Device View**: Click the **Multi-Device** icon in the dock to view Phone, Desktop, and Tablet concurrently. Use the swap arrows on each slot header to reorder viewports.
4. **Rotate Screen**: Click the **Orientation** button on mobile or tablet frames to rotate to landscape with dynamic safe areas.
5. **Simulate Touch**: Click and drag within any mobile frame to trigger native touch gestures and scrolling.
6. **Capture & Export**: Click the **Camera** icon, choose your preferred capture mode (Isolated, Viewport, Full-Page, or Studio Canvas), and click **Generate a capture**. In the preview modal, choose **PDF (A4 / Letter / Legal / A3)**, **PNG**, **WebP**, or **JPEG** to download instant print-ready assets.

---

## 7. Support & Bug Reporting

For questions, feature suggestions, bug reports, and updates:
- 🌐 **Official Website:** [https://screenshift.vercel.app/](https://screenshift.vercel.app/)
- 📖 **Documentation & Guides:** [https://screenshift.vercel.app/](https://screenshift.vercel.app/)
- 🐛 **Issue Tracker:** Submit bug reports and feature requests via GitHub Issues.

---

### License
This project is open-source software licensed under the [MIT License](LICENSE).
