import { DeviceSpec } from '../../data/devices';
import { Orientation } from '../hooks/useSimulator';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Unidirectional left-only rotation: 0° (Portrait) <-> 270° (Landscape-Left)
export type RotationAngle = 0 | 270;

/**
 * Checks whether a device is a mobile or tablet viewport.
 * Scoped strictly to phones, foldables, and tablets.
 * Excludes desktop, laptop, watch, and special presets.
 */
export function isMobileOrTablet(device: DeviceSpec | null | undefined): boolean {
  if (!device) return false;
  return (
    device.category === 'phone' ||
    device.category === 'tablet' ||
    device.category === 'foldable'
  );
}

/**
 * Calculates native mobile operating system safe-area insets with
 * Unidirectional Left-Only rotation constraint.
 *
 * Rules:
 * 1. Mobile & Tablet in Portrait (0°):
 *    - Top inset: Active (covers status bar, camera notch, or punch-hole)
 *    - Bottom inset: Active (covers home indicator pill / gesture bar)
 *    - Left & Right: 0px
 *
 * 2. Mobile & Tablet in Landscape-Left (270° / -90°):
 *    - Top inset: Collapses to 0px (native Safari / Chrome behavior, eliminating vertical gap)
 *    - Left inset: Dynamically expands to match the notch/cutout dimension on the left edge
 *    - Right inset: 0px
 *    - Bottom inset: Adjusts to the landscape home indicator height (21px iOS / 16px Android)
 *
 * 3. Non-Mobile Devices (Desktop / Laptop / Watch / Special):
 *    - All insets strictly 0px without rotation triggers or notch offsets.
 */
export function calculateSafeAreaInsets(
  device: DeviceSpec,
  orientation: Orientation,
  _rotationAngle: RotationAngle = 0
): SafeAreaInsets {
  // Non-mobile devices maintain standard zero-inset edge behavior
  if (!isMobileOrTablet(device)) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const isLandscape = orientation === 'landscape';
  const isApple = device.brand === 'Apple';
  const isTablet = device.category === 'tablet';

  let portraitTop = 0;
  let portraitBottom = 0;
  let notchDepth = 0;
  let landscapeBottom = 0;

  switch (device.notchType) {
    case 'island':
      // Apple Dynamic Island (iPhone 14 Pro, 15, 16 Pro, etc.)
      portraitTop = 54;
      portraitBottom = 34;
      notchDepth = 54;
      landscapeBottom = 21;
      break;

    case 'compact-notch':
      // Apple Compact Notch (iPhone 13, 13 Mini, 14)
      portraitTop = 47;
      portraitBottom = 34;
      notchDepth = 47;
      landscapeBottom = 21;
      break;

    case 'notch':
      if (isApple) {
        // Apple Classic Wide Notch (iPhone X, XR, 11, 12)
        portraitTop = 44;
        portraitBottom = 34;
        notchDepth = 44;
        landscapeBottom = 21;
      } else {
        // Android Teardrop / Waterdrop (Galaxy A-series, Redmi)
        portraitTop = 32;
        portraitBottom = 24;
        notchDepth = 32;
        landscapeBottom = 16;
      }
      break;

    case 'punch-hole':
    case 'punch-hole-left':
      // Android Centered or Corner Punch-Holes (Galaxy S20-S24, Pixel 5-10)
      portraitTop = 36;
      portraitBottom = 24;
      notchDepth = 36;
      landscapeBottom = 16;
      break;

    case 'home-button':
      // Classic Apple with physical home button (iPhone 5, 8, SE)
      portraitTop = 20;
      portraitBottom = 0;
      notchDepth = 0;
      landscapeBottom = 0;
      break;

    case 'none':
    default:
      if (isTablet) {
        if (isApple) {
          // iPad Pro / Air / Mini
          portraitTop = 24;
          portraitBottom = 20;
          notchDepth = 0;
          landscapeBottom = 20;
        } else {
          // Android Tablets (Galaxy Tab, Surface Duo)
          portraitTop = 24;
          portraitBottom = 16;
          notchDepth = 0;
          landscapeBottom = 16;
        }
      } else {
        portraitTop = 24;
        portraitBottom = 0;
        notchDepth = 0;
        landscapeBottom = 0;
      }
      break;
  }

  // Portrait Mode (0°)
  if (!isLandscape) {
    return {
      top: portraitTop,
      bottom: portraitBottom,
      left: 0,
      right: 0,
    };
  }

  // Landscape-Left Mode (270° / -90°):
  // Physical top (notch/cutout) rests strictly on the LEFT edge.
  // Top inset collapses to 0px, Left expands to notchDepth.
  return {
    top: 0,
    bottom: landscapeBottom,
    left: notchDepth,
    right: 0,
  };
}
