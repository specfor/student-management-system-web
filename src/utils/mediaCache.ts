interface CacheEntry {
  url: string;
  timestamp: number;
  type: "image" | "video";
}

class MediaCache {
  private cache: Map<string, string> = new Map();
  private readonly CACHE_KEY = "bannerMediaCache";
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const entries: Record<string, CacheEntry> = JSON.parse(cached);
        const now = Date.now();

        // Clean up expired entries
        Object.entries(entries).forEach(([key, entry]) => {
          if (now - entry.timestamp < this.CACHE_EXPIRY) {
            // Check if URL is still valid
            this.validateCachedUrl(entry.url).then((isValid) => {
              if (isValid) {
                this.cache.set(key, entry.url);
              } else {
                this.removeFromCache(key);
              }
            });
          } else {
            // Remove expired entry
            this.revokeUrl(entry.url);
          }
        });
      }
    } catch (error) {
      console.warn("Failed to load media cache from localStorage:", error);
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  private saveToLocalStorage() {
    try {
      const entries: Record<string, CacheEntry> = {};
      this.cache.forEach((url, key) => {
        entries[key] = {
          url,
          timestamp: Date.now(),
          type: key.includes("video") ? "video" : "image",
        };
      });
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn("Failed to save media cache to localStorage:", error);
    }
  }

  private async validateCachedUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  private revokeUrl(url: string) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn("Failed to revoke URL:", error);
    }
  }

  getFromCache(key: string): string | null {
    return this.cache.get(key) || null;
  }

  addToCache(key: string, blob: Blob): string {
    // Remove existing entry if it exists
    const existingUrl = this.cache.get(key);
    if (existingUrl) {
      this.revokeUrl(existingUrl);
    }

    // Create new URL and add to cache
    const url = URL.createObjectURL(blob);
    this.cache.set(key, url);
    this.saveToLocalStorage();
    return url;
  }

  removeFromCache(key: string) {
    const url = this.cache.get(key);
    if (url) {
      this.revokeUrl(url);
      this.cache.delete(key);
      this.saveToLocalStorage();
    }
  }

  clearCache() {
    this.cache.forEach((url) => {
      this.revokeUrl(url);
    });
    this.cache.clear();
    localStorage.removeItem(this.CACHE_KEY);
  }

  getCacheKey(bannerId: number, type: "image" | "video", media: string): string {
    return `banner_${bannerId}_${type}_${media}`;
  }
}

export const mediaCache = new MediaCache();
