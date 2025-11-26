import type { ClientBanner } from "@/types/client-banners";

/**
 * Utility functions for handling banner media types
 */

export function getBannerMediaId(banner: ClientBanner): string | undefined {
  // Support both new 'media' field and legacy 'image' field
  return banner.media || banner.image;
}

export function getBannerMediaType(banner: ClientBanner): "image" | "video" {
  // If type is explicitly set, use it
  if (banner.type) {
    return banner.type;
  }

  // For legacy banners, default to 'image' if they have an image field
  if (banner.image) {
    return "image";
  }

  // Default fallback
  return "image";
}

export function isBannerMediaAvailable(banner: ClientBanner): boolean {
  return !!(banner.media || banner.image);
}
