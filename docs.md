# ScreenShift - Mobile Simulator & Responsive Tester

## Project Overview
**ScreenShift** is a Google Chrome Extension built on Manifest V3 designed for frontend engineers, QA testers, and UI/UX designers. Preview websites across 40+ realistic mobile and tablet viewports with native safe areas, left rotation, and zero data tracking.

The interface mirrors professional mobile simulation suites: a centered mockup workspace over a dark canvas (`#1f1f1f`), a vertical floating tool dock on the far right, and an expandable slide-over drawer displaying a device matrix.

---

## Technical Stack & Tooling
- **Extension Platform**: Chrome Manifest V3 (Service Worker, Declarative Net Request, Scripting, Tabs API).
- **Build System**: Vite + CRXJS Vite Plugin + TypeScript.
- **Frontend Framework**: React 19 + Tailwind CSS.
- **Animations**: Framer Motion (for device drawer sliding and smooth canvas transitions).
- **Icons**: Lucide React.
- **State Management**: Zustand with persistent syncing via `chrome.storage.local`.
- **Export Engines**: `html2canvas` for composite mockup screenshots and native `chrome.tabs.captureVisibleTab`.

---

## Architecture & File Structure

```text
screenshift/
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── background/
│   │   ├── serviceWorker.ts
│   │   └── rules.ts               // DeclarativeNetRequest CSP/X-Frame-Options removal
│   ├── data/
│   │   └── devices.ts             // Master device presets and screen metrics
│   ├── viewer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── CanvasStage.tsx    // Centered viewport with scaling logic
│   │   │   ├── DeviceFrame.tsx    // Vector/CSS chassis, notch, and bezel renderer
│   │   │   ├── StatusBar.tsx      // iOS/Android system bar overlay
│   │   │   ├── ActionDock.tsx     // Floating right-edge vertical toolbar
│   │   │   ├── DeviceDrawer.tsx   // Expandable device catalog grid
│   │   │   └── TouchLayer.tsx     // Mouse-to-touch conversion & circular cursor
│   │   ├── hooks/
│   │   │   ├── useSimulator.ts
│   │   │   └── useScreenshot.ts
│   │   └── styles/
│   │       └── bezels.css
│   └── utils/
│       └── storage.ts
```

## Manifest Configuration (manifest.json)

```json
{
  "manifest_version": 3,
  "name": "ScreenShift - Mobile Simulator & Responsive Tester",
  "version": "1.0.0",
  "description": "Preview websites across 40+ realistic mobile and tablet viewports with native safe areas, left rotation, and zero data tracking.",
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "scripting",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_title": "Launch ScreenShift"
  },
  "background": {
    "service_worker": "src/background/serviceWorker.ts",
    "type": "module"
  },
  "web_accessible_resources": [
    {
      "resources": [
        "src/viewer/index.html",
        "assets/*"
      ],
      "matches": [
        "<all_urls>"
      ]
    }
  ]
}
```
