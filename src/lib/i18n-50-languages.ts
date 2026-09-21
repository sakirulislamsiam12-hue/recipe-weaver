/**
 * Registry of every language the app can render in, plus a trie-based
 * incremental search index used by the language picker.
 */

export type Region = "South Asian" | "European" | "East Asian" | "African" | "Other";

export type LanguageMeta = {
  /** Display name: native + English in parentheses. */
  name: string;
  /** Native endonym only. */
  nativeName: string;
  /** English name, used for latin-script searching. */
  englishName: string;
  region: Region;
  /** Right-to-left script. */
  rtl?: boolean;
};

const LANGUAGE_TABLE = {
  bn: { name: "বাংলা (Bengali)", nativeName: "বাংলা", englishName: "Bengali", region: "South Asian" },
  en: { name: "English", nativeName: "English", englishName: "English", region: "European" },
  hi: { name: "हिन्दी (Hindi)", nativeName: "हिन्दी", englishName: "Hindi", region: "South Asian" },
  es: { name: "Español (Spanish)", nativeName: "Español", englishName: "Spanish", region: "European" },
  fr: { name: "Français (French)", nativeName: "Français", englishName: "French", region: "European" },
  de: { name: "Deutsch (German)", nativeName: "Deutsch", englishName: "German", region: "European" },
  pt: { name: "Português (Portuguese)", nativeName: "Português", englishName: "Portuguese", region: "European" },
  it: { name: "Italiano (Italian)", nativeName: "Italiano", englishName: "Italian", region: "European" },
  nl: { name: "Nederlands (Dutch)", nativeName: "Nederlands", englishName: "Dutch", region: "European" },
  ru: { name: "Русский (Russian)", nativeName: "Русский", englishName: "Russian", region: "European" },
  ar: { name: "العربية (Arabic)", nativeName: "العربية", englishName: "Arabic", region: "Other", rtl: true },
  "zh-Hans": {
    name: "简体中文 (Chinese Simplified)",
    nativeName: "简体中文",
    englishName: "Chinese Simplified",
    region: "East Asian",
  },
  "zh-Hant": {
    name: "繁體中文 (Chinese Traditional)",
    nativeName: "繁體中文",
    englishName: "Chinese Traditional",
    region: "East Asian",
  },
  ja: { name: "日本語 (Japanese)", nativeName: "日本語", englishName: "Japanese", region: "East Asian" },
  ko: { name: "한국어 (Korean)", nativeName: "한국어", englishName: "Korean", region: "East Asian" },
  th: { name: "ไทย (Thai)", nativeName: "ไทย", englishName: "Thai", region: "East Asian" },
  vi: { name: "Tiếng Việt (Vietnamese)", nativeName: "Tiếng Việt", englishName: "Vietnamese", region: "East Asian" },
  id: { name: "Bahasa Indonesia (Indonesian)", nativeName: "Bahasa Indonesia", englishName: "Indonesian", region: "East Asian" },
  tl: { name: "Tagalog (Filipino)", nativeName: "Tagalog", englishName: "Tagalog", region: "East Asian" },
  tr: { name: "Türkçe (Turkish)", nativeName: "Türkçe", englishName: "Turkish", region: "Other" },
  el: { name: "Ελληνικά (Greek)", nativeName: "Ελληνικά", englishName: "Greek", region: "European" },
  sv: { name: "Svenska (Swedish)", nativeName: "Svenska", englishName: "Swedish", region: "European" },
  no: { name: "Norsk (Norwegian)", nativeName: "Norsk", englishName: "Norwegian", region: "European" },
  da: { name: "Dansk (Danish)", nativeName: "Dansk", englishName: "Danish", region: "European" },
  fi: { name: "Suomi (Finnish)", nativeName: "Suomi", englishName: "Finnish", region: "European" },
  pl: { name: "Polski (Polish)", nativeName: "Polski", englishName: "Polish", region: "European" },
  cs: { name: "Čeština (Czech)", nativeName: "Čeština", englishName: "Czech", region: "European" },
  hu: { name: "Magyar (Hungarian)", nativeName: "Magyar", englishName: "Hungarian", region: "European" },
  ro: { name: "Română (Romanian)", nativeName: "Română", englishName: "Romanian", region: "European" },
  bg: { name: "Български (Bulgarian)", nativeName: "Български", englishName: "Bulgarian", region: "European" },
  hr: { name: "Hrvatski (Croatian)", nativeName: "Hrvatski", englishName: "Croatian", region: "European" },
  sr: { name: "Српски (Serbian)", nativeName: "Српски", englishName: "Serbian", region: "European" },
  sl: { name: "Slovenščina (Slovene)", nativeName: "Slovenščina", englishName: "Slovene", region: "European" },
  ur: { name: "اردو (Urdu)", nativeName: "اردو", englishName: "Urdu", region: "South Asian", rtl: true },
  pa: { name: "ਪੰਜਾਬੀ (Punjabi)", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi", region: "South Asian" },
  gu: { name: "ગુજરાતી (Gujarati)", nativeName: "ગુજરાતી", englishName: "Gujarati", region: "South Asian" },
  mr: { name: "मराठी (Marathi)", nativeName: "मराठी", englishName: "Marathi", region: "South Asian" },
  ta: { name: "தமிழ் (Tamil)", nativeName: "தமிழ்", englishName: "Tamil", region: "South Asian" },
  te: { name: "తెలుగు (Telugu)", nativeName: "తెలుగు", englishName: "Telugu", region: "South Asian" },
  kn: { name: "ಕನ್ನಡ (Kannada)", nativeName: "ಕನ್ನಡ", englishName: "Kannada", region: "South Asian" },
  ml: { name: "മലയാളം (Malayalam)", nativeName: "മലയാളം", englishName: "Malayalam", region: "South Asian" },
  or: { name: "ଓଡ଼ିଆ (Odia)", nativeName: "ଓଡ଼ିଆ", englishName: "Odia", region: "South Asian" },
  as: { name: "অসমীয়া (Assamese)", nativeName: "অসমীয়া", englishName: "Assamese", region: "South Asian" },
  my: { name: "မြန်မာ (Burmese)", nativeName: "မြန်မာ", englishName: "Burmese", region: "East Asian" },
  km: { name: "ខ្មែរ (Khmer)", nativeName: "ខ្មែរ", englishName: "Khmer", region: "East Asian" },
  lo: { name: "ລາວ (Lao)", nativeName: "ລາວ", englishName: "Lao", region: "East Asian" },
  am: { name: "አማርኛ (Amharic)", nativeName: "አማርኛ", englishName: "Amharic", region: "African" },
  sw: { name: "Kiswahili (Swahili)", nativeName: "Kiswahili", englishName: "Swahili", region: "African" },
  yo: { name: "Yorùbá (Yoruba)", nativeName: "Yorùbá", englishName: "Yoruba", region: "African" },
  ha: { name: "Hausa", nativeName: "Hausa", englishName: "Hausa", region: "African" },
} as const satisfies Record<string, LanguageMeta>;

export type LanguageCode = keyof typeof LANGUAGE_TABLE;

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageMeta> = LANGUAGE_TABLE;

export const LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[];

export const DEFAULT_LANGUAGE: LanguageCode = "bn";

export const REGION_ORDER: Region[] = [
  "South Asian",
  "European",
  "East Asian",
  "African",
  "Other",
];

export const REGION_LABELS: Record<Region, { bn: string; en: string }> = {
  "South Asian": { bn: "দক্ষিণ এশীয়", en: "South Asian" },
  European: { bn: "ইউরোপীয়", en: "European" },
  "East Asian": { bn: "পূর্ব ও দক্ষিণ-পূর্ব এশীয়", en: "East & Southeast Asian" },
  African: { bn: "আফ্রিকান", en: "African" },
  Other: { bn: "অন্যান্য", en: "Other" },
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && value in SUPPORTED_LANGUAGES;
}

/** Languages sorted alphabetically by their English name. */
export const LANGUAGES_ALPHABETICAL: LanguageCode[] = [...LANGUAGE_CODES].sort((a, b) =>
  SUPPORTED_LANGUAGES[a].englishName.localeCompare(SUPPORTED_LANGUAGES[b].englishName),
);

/* ------------------------------------------------------------------ */
/* Trie-based incremental search                                       */
/* ------------------------------------------------------------------ */

type TrieNode = {
  children: Map<string, TrieNode>;
  /** Codes whose indexed term starts with the path to this node. */
  codes: Set<LanguageCode>;
};

function newNode(): TrieNode {
  return { children: new Map(), codes: new Set() };
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

function insert(root: TrieNode, term: string, code: LanguageCode) {
  const key = normalize(term);
  if (!key) return;
  let node = root;
  node.codes.add(code);
  for (const ch of key) {
    let next = node.children.get(ch);
    if (!next) {
      next = newNode();
      node.children.set(ch, next);
    }
    node = next;
    node.codes.add(code);
  }
}

function buildTrie(): TrieNode {
  const root = newNode();
  for (const code of LANGUAGE_CODES) {
    const meta = SUPPORTED_LANGUAGES[code];
    const terms = [
      code,
      meta.englishName,
      meta.nativeName,
      meta.name,
      // index each word separately so "chinese simplified" matches "simplified"
      ...meta.englishName.split(/\s+/),
      ...meta.nativeName.split(/\s+/),
    ];
    for (const term of terms) insert(root, term, code);
  }
  return root;
}

const TRIE = buildTrie();

/**
 * Prefix search over language codes, native names and English names.
 * Returns codes in alphabetical (English name) order.
 */
export function searchLanguages(query: string): LanguageCode[] {
  const key = normalize(query);
  if (!key) return LANGUAGES_ALPHABETICAL;
  let node: TrieNode | undefined = TRIE;
  for (const ch of key) {
    node = node.children.get(ch);
    if (!node) return [];
  }
  const found = node.codes;
  return LANGUAGES_ALPHABETICAL.filter((c) => found.has(c));
}

/** Best-effort match of the device locale onto a supported language. */
export function detectDeviceLanguage(): LanguageCode | null {
  if (typeof navigator === "undefined") return null;
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of locales) {
    if (!raw) continue;
    const tag = raw.trim();
    if (isLanguageCode(tag)) return tag;
    const lower = tag.toLowerCase();
    if (lower.startsWith("zh")) {
      return /hant|tw|hk|mo/.test(lower) ? "zh-Hant" : "zh-Hans";
    }
    const base = lower.split(/[-_]/)[0];
    if (isLanguageCode(base)) return base;
    if (base === "fil") return "tl";
    if (base === "nb" || base === "nn") return "no";
  }
  return null;
}
