/**
 * 7. Traffic-light nutrition score.
 *
 * A transparent, on-device estimate: the AI already returns a coarse
 * green/yellow/red verdict, but the panel needs per-nutrient traffic lights
 * plus a plain-language reason. Values are heuristic per-serving estimates
 * derived from the ingredient list — labelled as estimates in the UI.
 */

import type { Recipe } from "./recipe-schema";
import { lookupIngredient } from "./pantry-data";

export type Light = "green" | "amber" | "red";

export type NutrientRow = {
  id: "energy" | "fat" | "sugar" | "salt" | "fibre" | "protein";
  bn: string;
  en: string;
  value: number;
  unit: string;
  light: Light;
  /** Higher is better (fibre/protein) instead of lower-is-better. */
  positive?: boolean;
};

export type NutritionReport = {
  overall: Light;
  rows: NutrientRow[];
  noteBn: string;
  noteEn: string;
};

const FATTY = /(oil|তেল|ghee|ঘি|butter|মাখন|cream|ক্রিম|coconut milk|নারকেল দুধ|mayonnaise|cheese|পনির|peanut|বাদাম)/i;
const SUGARY = /(sugar|চিনি|honey|মধু|jaggery|গুড়|condensed|syrup|সিরাপ|chocolate|jam)/i;
const SALTY = /(salt|লবণ|soy sauce|সয়া|fish sauce|শুঁটকি|pickle|আচার|stock cube|bouillon|papad)/i;
const FIBRE = /(lentil|ডাল|bean|শিম|chickpea|ছোলা|spinach|শাক|cabbage|বাঁধাকপি|carrot|গাজর|oat|brown rice|ঢেঁড়স|okra|pumpkin|কুমড়া|guava|পেয়ারা|apple|আপেল)/i;
const PROTEIN = /(chicken|মুরগি|beef|গরু|mutton|খাসি|fish|মাছ|egg|ডিম|prawn|চিংড়ি|lentil|ডাল|paneer|পনির|yogurt|দই|milk|দুধ|tofu|soy|bean|শিম)/i;
const FRIED = /(deep.?fry|ভাজ|fry|ভেজে|ভাজা|bhaja|beresta|crisp)/i;

const grams = (q: string) => {
  const m = /(\d+(?:\.\d+)?)\s*(kg|কেজি|g|গ্রাম|ml|মিলি|l|লিটার|tbsp|চা?\s?চামচ|tsp|cup|কাপ|pcs|টি|টা)?/i.exec(q);
  if (!m) return 60;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return 60;
  const unit = (m[2] ?? "").toLowerCase();
  if (/kg|কেজি|l|লিটার/.test(unit)) return n * 1000;
  if (/tbsp|টেবিল/.test(unit)) return n * 15;
  if (/tsp|চা/.test(unit)) return n * 5;
  if (/cup|কাপ/.test(unit)) return n * 200;
  if (/pcs|টি|টা/.test(unit)) return n * 70;
  return n;
};

function light(value: number, amber: number, red: number, positive = false): Light {
  if (positive) return value >= red ? "green" : value >= amber ? "amber" : "red";
  return value >= red ? "red" : value >= amber ? "amber" : "green";
}

export function scoreNutrition(recipe: Recipe): NutritionReport {
  const servings = Math.max(1, recipe.servings || 2);
  const steps = recipe.steps.join(" ");

  let energy = 0;
  let fat = 0;
  let sugar = 0;
  let salt = 0;
  let fibre = 0;
  let protein = 0;

  for (const ing of recipe.ingredients) {
    const g = grams(ing.quantity || "");
    const name = ing.name;
    const cat = lookupIngredient(name)?.category;

    if (FATTY.test(name)) {
      fat += g * 0.75;
      energy += g * 7;
    } else if (cat === "grain") {
      energy += g * 3.4;
      fibre += g * 0.02;
    } else if (cat === "protein") {
      energy += g * 1.6;
      protein += g * 0.19;
    } else if (cat === "dairy") {
      energy += g * 1.1;
      protein += g * 0.05;
      fat += g * 0.05;
    } else {
      energy += g * 0.35;
    }

    if (SUGARY.test(name)) {
      sugar += g * 0.85;
      energy += g * 3.9;
    }
    if (SALTY.test(name)) salt += Math.min(g, 25) * 0.4;
    if (FIBRE.test(name)) fibre += g * 0.035;
    if (PROTEIN.test(name)) protein += g * 0.14;
  }

  if (FRIED.test(steps)) {
    fat += 12 * servings;
    energy += 110 * servings;
  }

  const per = (n: number) => Math.round((n / servings) * 10) / 10;
  const rows: NutrientRow[] = [
    {
      id: "energy",
      bn: "ক্যালরি",
      en: "Energy",
      value: Math.round(energy / servings),
      unit: "kcal",
      light: light(energy / servings, 550, 800),
    },
    { id: "fat", bn: "চর্বি", en: "Fat", value: per(fat), unit: "g", light: light(fat / servings, 17, 30) },
    { id: "sugar", bn: "চিনি", en: "Sugar", value: per(sugar), unit: "g", light: light(sugar / servings, 12, 25) },
    { id: "salt", bn: "লবণ", en: "Salt", value: per(salt), unit: "g", light: light(salt / servings, 1.5, 2.5) },
    {
      id: "fibre",
      bn: "ফাইবার",
      en: "Fibre",
      value: per(fibre),
      unit: "g",
      light: light(fibre / servings, 3, 6, true),
      positive: true,
    },
    {
      id: "protein",
      bn: "প্রোটিন",
      en: "Protein",
      value: per(protein),
      unit: "g",
      light: light(protein / servings, 10, 18, true),
      positive: true,
    },
  ];

  const reds = rows.filter((r) => r.light === "red").length;
  const ambers = rows.filter((r) => r.light === "amber").length;
  const overall: Light = reds >= 2 ? "red" : reds === 1 || ambers >= 3 ? "amber" : "green";

  const worst = rows.filter((r) => r.light === "red" && !r.positive);
  const weak = rows.filter((r) => r.light === "red" && r.positive);

  const noteEn =
    overall === "green"
      ? "Well balanced — a solid everyday meal."
      : `Watch the ${worst.map((r) => r.en.toLowerCase()).join(" and ") || "richer ingredients"}${
          weak.length ? `; add more ${weak.map((r) => r.en.toLowerCase()).join(" and ")}` : ""
        }.`;
  const noteBn =
    overall === "green"
      ? "ভারসাম্যপূর্ণ — প্রতিদিনের জন্য ভালো।"
      : `${worst.map((r) => r.bn).join(" ও ") || "ভারী উপকরণ"} একটু কমিয়ে নিন${
          weak.length ? `; ${weak.map((r) => r.bn).join(" ও ")} বাড়ান` : ""
        }।`;

  return { overall, rows, noteBn, noteEn };
}

export const lightClass = (l: Light) =>
  l === "green" ? "text-emerald-600" : l === "amber" ? "text-amber-600" : "text-destructive";

export const lightDot = (l: Light) =>
  l === "green" ? "bg-emerald-500" : l === "amber" ? "bg-amber-500" : "bg-destructive";
