/** Spending summaries derived from `pantry_purchase` rows. */

import { daysUntil, type PantryPurchase } from "@/lib/pantry-purchases";

/** Total ৳ spent on purchases made in the last 30 days by this user. */
export function getMonthlyCost(userPantry: PantryPurchase[], userId: string): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffMs = cutoff.getTime();

  return userPantry
    .filter((p) => p.user_id === userId)
    .filter((p) => new Date(`${p.purchase_date}T00:00:00`).getTime() >= cutoffMs)
    .reduce((sum, p) => sum + (Number.isFinite(p.purchase_price) ? p.purchase_price : 0), 0);
}

export type PantrySummary = {
  monthlyCost: number;
  atRiskCount: number;
  soonest: PantryPurchase | null;
};

/** Cost + spoilage-risk summary for the pantry header card. */
export function getPantrySummary(userPantry: PantryPurchase[], userId: string): PantrySummary {
  const mine = userPantry.filter((p) => p.user_id === userId);
  const sorted = [...mine].sort((a, b) =>
    a.expected_expiry_date.localeCompare(b.expected_expiry_date),
  );

  return {
    monthlyCost: getMonthlyCost(userPantry, userId),
    atRiskCount: mine.filter((p) => daysUntil(p.expected_expiry_date) <= 3).length,
    soonest: sorted[0] ?? null,
  };
}

export function formatTaka(amount: number) {
  return `৳${Math.round(amount).toLocaleString("bn-BD")}`;
}
