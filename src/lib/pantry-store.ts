/**
 * Guest-first pantry store with expiry tracking.
 *
 * Everything lives in localStorage so the whole app works with no account
 * (guest mode). When the user later signs in the same shape can be mirrored to
 * the pantry_items table without changing callers.
 */

export type Freshness = "fresh" | "use-soon" | "spoiled";

export type PantryItem = {
  id: string;
  name: string;
  quantity?: string;
  freshness: Freshness;
  /** ISO date (yyyy-mm-dd) */
  expiresOn?: string;
  source: "text" | "camera" | "voice" | "receipt" | "barcode" | "import";
  addedAt: string;
};

const KEY = "sp-pantry";
const NOTIFIED_KEY = "sp-expiry-notified";
const GUEST_KEY = "sp-guest";

/** Default shelf life (days) used when a scan gives no explicit date. */
const SHELF_LIFE: Array<[RegExp, number]> = [
  [/(শাক|পালং|লেটুস|herb|spinach|greens|lettuce|coriander|ধনে)/i, 3],
  [/(দুধ|milk|yogurt|দই|cream)/i, 5],
  [/(মাছ|fish|prawn|চিংড়ি|মাংস|meat|chicken|মুরগি|beef|গরু)/i, 2],
  [/(টমেটো|tomato|banana|কলা|berry|mango|আম|আঙ্গুর|grape)/i, 5],
  [/(ডিম|egg)/i, 21],
  [/(আলু|potato|পেঁয়াজ|onion|garlic|রসুন|pumpkin|কুমড়া)/i, 30],
  [/(চাল|rice|ডাল|lentil|আটা|flour|তেল|oil|মসলা|spice|sugar|চিনি|salt|লবণ)/i, 240],
];

export function guessShelfLife(name: string) {
  for (const [re, days] of SHELF_LIFE) if (re.test(name)) return days;
  return 7;
}

export function addDays(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysLeft(expiresOn?: string) {
  if (!expiresOn) return null;
  const diff = new Date(`${expiresOn}T00:00:00`).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function freshnessFromDays(left: number | null): Freshness {
  if (left === null) return "fresh";
  if (left < 0) return "spoiled";
  if (left <= 2) return "use-soon";
  return "fresh";
}

export function loadPantry(): PantryItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as PantryItem[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function savePantry(items: PantryItem[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function makeItem(
  name: string,
  opts: Partial<Omit<PantryItem, "name" | "id" | "addedAt">> = {},
): PantryItem {
  const expiresOn = opts.expiresOn ?? addDays(guessShelfLife(name));
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    freshness: opts.freshness ?? freshnessFromDays(daysLeft(expiresOn)),
    source: opts.source ?? "text",
    addedAt: new Date().toISOString(),
    ...(opts.quantity ? { quantity: opts.quantity } : {}),
    expiresOn,
  };
}

/** Guest mode: a stable local id so streaks/history work without an account. */
export function guestId() {
  if (typeof localStorage === "undefined") return "guest";
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = `guest-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export type ExpiryBuckets = {
  expired: PantryItem[];
  today: PantryItem[];
  soon: PantryItem[];
  later: PantryItem[];
};

export function bucketByExpiry(items: PantryItem[]): ExpiryBuckets {
  const out: ExpiryBuckets = { expired: [], today: [], soon: [], later: [] };
  for (const item of items) {
    const left = daysLeft(item.expiresOn);
    if (left === null) out.later.push(item);
    else if (left < 0) out.expired.push(item);
    else if (left === 0) out.today.push(item);
    else if (left <= 3) out.soon.push(item);
    else out.later.push(item);
  }
  const byDate = (a: PantryItem, b: PantryItem) => (a.expiresOn ?? "").localeCompare(b.expiresOn ?? "");
  out.expired.sort(byDate);
  out.today.sort(byDate);
  out.soon.sort(byDate);
  out.later.sort(byDate);
  return out;
}

export async function requestExpiryPermission() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;
  return (await Notification.requestPermission()) as "granted" | "denied" | "default";
}

/** Fires at most one expiry notification per item per day. */
export function notifyExpiring(items: PantryItem[], lang: "bn" | "en") {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return 0;
  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;
  let log: Record<string, string> = {};
  try {
    log = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "{}") as Record<string, string>;
  } catch {
    log = {};
  }

  for (const item of items) {
    const left = daysLeft(item.expiresOn);
    if (left === null || left > 2) continue;
    if (log[item.id] === today) continue;
    const title =
      lang === "bn" ? `${item.name} দ্রুত ব্যবহার করুন` : `Use up your ${item.name}`;
    const body =
      left < 0
        ? lang === "bn"
          ? "মেয়াদ শেষ হয়ে গেছে — ফেলার আগে দেখে নিন।"
          : "Past its date — check before using."
        : left === 0
          ? lang === "bn"
            ? "আজই শেষ দিন।"
            : "Today is the last day."
          : lang === "bn"
            ? `আর ${left} দিন বাকি।`
            : `${left} day(s) left.`;
    try {
      new Notification(title, { body, tag: `sp-expiry-${item.id}` });
      log[item.id] = today;
      sent++;
    } catch {
      /* ignore */
    }
  }

  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(log));
  return sent;
}
