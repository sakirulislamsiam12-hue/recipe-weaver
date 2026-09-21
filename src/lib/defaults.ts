// Regional pantry defaults: ingredients we auto-assume for a region so the
// user never has to add them by hand.

/** Staples every Bangladeshi kitchen is assumed to have. */
export const DEFAULT_BENGALI_INGREDIENTS = ["লবণ", "জল"] as const;

/** True when the onboarding country answer maps to the Bangladesh region. */
export function isBangladeshRegion(region?: string | null): boolean {
  if (!region) return false;
  return /bangladesh|বাংলাদেশ|^bd$/i.test(region.trim());
}
