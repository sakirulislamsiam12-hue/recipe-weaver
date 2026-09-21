/**
 * Daily expiry check: notifies once per item per day when an item expires
 * tomorrow (or is already due), linking to recipes that use the item.
 */

import { daysUntil, loadPurchases, type PantryPurchase } from "@/lib/pantry-purchases";
import { toISODate } from "@/lib/expiry-db";

const LOG_KEY = "sp-purchase-expiry-notified";

export function recipeLinkFor(itemName: string) {
  return `/explore?ingredient=${encodeURIComponent(itemName)}`;
}

export function expiryMessage(itemName: string, lang: "bn" | "en" = "bn") {
  return lang === "bn"
    ? `${itemName} আগামীকাল নষ্ট হতে পারে। এটি দিয়ে কী রান্না করতে পারেন?`
    : `${itemName} may spoil tomorrow. What can you cook with it?`;
}

/** Rows whose expected_expiry_date <= today + 1 day. */
export function dueForNotification(purchases: PantryPurchase[], from = new Date()) {
  return purchases.filter((p) => daysUntil(p.expected_expiry_date, from) <= 1);
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  if (Notification.permission !== "default") return Notification.permission;
  return await Notification.requestPermission();
}

function readLog(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Run once a day (called on app start). Returns the notifications sent —
 * the array is also useful for tests and in-app banners when the browser
 * has not granted permission.
 */
export function runDailyExpiryCheck(
  purchases: PantryPurchase[] = loadPurchases(),
  lang: "bn" | "en" = "bn",
): Array<{ item: string; body: string; link: string }> {
  const today = toISODate(new Date());
  const due = dueForNotification(purchases);
  const log = typeof localStorage === "undefined" ? {} : readLog();
  const sent: Array<{ item: string; body: string; link: string }> = [];

  for (const p of due) {
    if (log[p.id] === today) continue;
    const payload = {
      item: p.item_name,
      body: expiryMessage(p.item_name, lang),
      link: recipeLinkFor(p.item_name),
    };
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const n = new Notification(payload.body, { tag: `sp-purchase-${p.id}` });
        n.onclick = () => {
          window.focus();
          window.location.href = payload.link;
        };
      } catch {
        /* ignore */
      }
    }
    log[p.id] = today;
    sent.push(payload);
  }

  if (typeof localStorage !== "undefined") localStorage.setItem(LOG_KEY, JSON.stringify(log));
  return sent;
}
