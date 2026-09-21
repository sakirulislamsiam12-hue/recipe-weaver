export type Prefs = {
  /* legacy / derived fields consumed by recipe generation */
  country?: string;
  spice?: string;
  salt?: string;
  diet?: string[];
  time?: string;
  onboarded?: boolean;

  /* deep-dive profile */
  cuisines?: string[];
  storage?: string;
  household?: number;
  skill?: string;
  spiceLevel?: number;
  saltLevel?: number;
  allergies?: string;
  healthy?: string;
  budget?: string;
  frequency?: string;
  appliances?: string[];
  living?: string;
};

const KEY = "sp-prefs";

export function loadPrefs(): Prefs {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Prefs;
  } catch {
    return {};
  }
}

export function savePrefs(p: Prefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

/** Slider level (1-10) -> the coarse label the recipe engine understands. */
export function spiceLabel(level?: number): string | undefined {
  if (!level) return undefined;
  if (level <= 2) return "Mild";
  if (level <= 5) return "Medium";
  if (level <= 8) return "Spicy";
  return "Extra spicy";
}

export function saltLabel(level?: number): string | undefined {
  if (!level) return undefined;
  if (level <= 3) return "Low salt";
  if (level <= 7) return "Normal";
  return "High salt";
}
