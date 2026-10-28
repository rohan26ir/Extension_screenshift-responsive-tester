/**
 * Universal storage helper that abstracts chrome.storage.local and window.localStorage.
 * Enables seamless functionality in both extension contexts and standalone Vite dev servers.
 */

export const storage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(key);
        if (result[key] !== undefined) {
          return result[key] as T;
        }
        return defaultValue;
      }
      
      const item = localStorage.getItem(`screenshift_${key}`);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
      return defaultValue;
    } catch (err) {
      console.warn(`[ScreenShift Storage] Error getting key "${key}":`, err);
      return defaultValue;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [key]: value });
        return;
      }

      localStorage.setItem(`screenshift_${key}`, JSON.stringify(value));
    } catch (err) {
      console.warn(`[ScreenShift Storage] Error setting key "${key}":`, err);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(key);
        return;
      }

      localStorage.removeItem(`screenshift_${key}`);
    } catch (err) {
      console.warn(`[ScreenShift Storage] Error removing key "${key}":`, err);
    }
  },
};
