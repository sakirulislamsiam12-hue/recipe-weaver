/**
 * `pantry_purchase` records.
 *
 * Guest-first: rows live in localStorage with exactly the column shape of the
 * `pantry_purchase` table (see supabase/migrations), so signed-in sync can be
 * turned on later without changing any caller.
 */

import { useCallback, useSyncExternalStore } from "react";

import { getExpectedExpiryDate, toISODate, type StorageType } from "@/lib/expiry-db";

export type Unit = "কেজি" | "গ্রাম" | "পিস" | "কাপ" | "লিটার";

export const UNITS: Unit[] = ["কেজি", "গ্রাম", "পিস", "কাপ", "লিটার"];

export const USAGE_OPTIONS = ["এই সপ্তাহে", "এই মাসে", "আগামী দুই সপ্তাহ"] as const;

export type PantryPurchase = {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  unit: Unit;
  purchase_price: number;
  /** yyyy-mm-dd */
  purchase_date: string;
  storage_type: StorageType;
  expected_usage: string | null;
  /** yyyy-mm-dd, derived from storage_type + item_name */
  expected_expiry_date: string;
  created_at: string;
};

export type NewPurchase = Omit<PantryPurchase, "id" | "created_at" | "expected_expiry_date">;

const KEY = "sp-pantry-purchases";

const listeners = new Set<() => void>();
let cache: PantryPurchase[] | null = null;

function read(): PantryPurchase[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as PantryPurchase[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function loadPurchases(): PantryPurchase[] {
  if (cache === null) cache = read();
  return cache;
}

function commit(next: PantryPurchase[]) {
  cache = next;
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  for (const l of listeners) l();
}

export function addPurchase(input: NewPurchase): PantryPurchase {
  const row: PantryPurchase = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    expected_expiry_date: getExpectedExpiryDate(
      input.item_name,
      input.storage_type,
      input.purchase_date,
    ),
    ...input,
  };
  commit([row, ...loadPurchases()]);
  void pushToCloud(row);
  return row;
}

export function removePurchase(id: string) {
  commit(loadPurchases().filter((p) => p.id !== id));
  void deleteFromCloud(id);
}

/** Cloud sync — best-effort; guests keep working entirely offline. */
async function pushToCloud(row: PantryPurchase) {
  if (!isCloudUser(row.user_id)) return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("pantry_purchase")
      .insert({
        user_id: row.user_id,
        item_name: row.item_name,
        quantity: row.quantity,
        unit: row.unit,
        purchase_price: row.purchase_price,
        purchase_date: row.purchase_date,
        storage_type: row.storage_type,
        expected_usage: row.expected_usage,
        expected_expiry_date: row.expected_expiry_date,
      })
      .select("id")
      .maybeSingle();
    if (data?.id) {
      commit(loadPurchases().map((p) => (p.id === row.id ? { ...p, id: data.id } : p)));
    }
  } catch {
    /* offline / signed out — local copy is the source of truth */
  }
}

async function deleteFromCloud(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.from("pantry_purchase").delete().eq("id", id);
  } catch {
    /* ignore */
  }
}

function isCloudUser(userId: string) {
  return /^[0-9a-f-]{36}$/i.test(userId);
}

/** Pull the signed-in user's rows and merge them with any local guest rows. */
export async function syncPurchasesFromCloud(userId: string) {
  if (!isCloudUser(userId)) return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("pantry_purchase")
      .select("*")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false });
    if (error || !data) return;

    const remote = data as unknown as PantryPurchase[];
    const remoteIds = new Set(remote.map((r) => r.id));
    const localOnly = loadPurchases().filter((p) => !remoteIds.has(p.id));

    // upload guest rows that were created before sign-in
    for (const p of localOnly) {
      if (p.user_id === userId) continue;
      const owned = { ...p, user_id: userId };
      commit(loadPurchases().map((x) => (x.id === p.id ? owned : x)));
      await pushToCloud(owned);
    }

    const merged = [...remote, ...loadPurchases().filter((p) => !remoteIds.has(p.id))];
    const seen = new Set<string>();
    commit(
      merged
        .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
        .sort((a, b) => (a.purchase_date < b.purchase_date ? 1 : -1)),
    );
  } catch {
    /* ignore */
  }
}

const EMPTY: PantryPurchase[] = [];

/** Reactive access to the purchase list. */
export function usePantryPurchases() {
  const purchases = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => loadPurchases(),
    () => EMPTY,
  );

  return {
    purchases,
    addPurchase: useCallback((p: NewPurchase) => addPurchase(p), []),
    removePurchase: useCallback((id: string) => removePurchase(id), []),
  };
}


export function daysUntil(isoDate: string, from = new Date()) {
  const target = new Date(`${isoDate}T00:00:00`).getTime();
  const base = new Date(`${toISODate(from)}T00:00:00`).getTime();
  return Math.round((target - base) / 86_400_000);
}

export type ExpiryTone = "safe" | "warn" | "danger";

/** green >7 days, yellow 3-7, red <3 */
export function expiryTone(daysLeft: number): ExpiryTone {
  if (daysLeft > 7) return "safe";
  if (daysLeft >= 3) return "warn";
  return "danger";
}
