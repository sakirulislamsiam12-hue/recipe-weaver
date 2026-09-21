import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Real market lookup through OpenStreetMap (Overpass + Nominatim).
 *
 * No API key or connector is required, so the "buy from a nearby market"
 * flow always gets an answer. Results are real shops with real coordinates,
 * returned closest-first, which fixes the old synthetic directory showing
 * markets that were nowhere near the user.
 */

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const NOMINATIM = "https://nominatim.openstreetmap.org";
const UA = "GroceryGenie/1.0 (nearby market finder)";

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  phone: string;
  openNow: boolean | null;
  priceLevel: string | null;
  types: string[];
};

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/** Food shop tags we accept. Anything else is not a grocery destination. */
const FOOD_SHOPS =
  "supermarket|greengrocer|convenience|butcher|seafood|fishmonger|grocery|general|farm|deli|dairy|cheese|spices|rice|pasta|frozen_food|health_food|bakery|pastry|confectionery|tea|coffee|water|beverages|food";

/** OSM tags -> the shop categories the UI already understands. */
function mapTypes(tags: Record<string, string>): string[] {
  const shop = tags["shop"] ?? "";
  const amenity = tags["amenity"] ?? "";
  const out: string[] = [];
  if (amenity === "marketplace") out.push("market");
  if (shop === "supermarket") out.push("supermarket");
  if (shop === "greengrocer" || shop === "farm") out.push("market", "grocery_store");
  if (shop === "butcher") out.push("butcher_shop");
  if (shop === "seafood" || shop === "fishmonger") out.push("seafood_market");
  if (shop === "convenience") out.push("convenience_store");
  if (shop === "bakery" || shop === "confectionery" || shop === "deli") out.push("food_store");
  if (shop === "grocery" || shop === "general" || shop === "food") out.push("grocery_store");
  if (out.length === 0) out.push("grocery_store");
  return out;
}

/**
 * Businesses that get mis-tagged as convenience/general stores in OSM but sell
 * nothing edible (pipe fittings, electronics, clothes, stationery, ...).
 * A single name/tag hit is enough to drop the place from the results.
 */
const NON_FOOD_PATTERN = new RegExp(
  [
    // English
    "electric",
    "electronic",
    "hardware",
    "sanitary",
    "pipe",
    "fitting",
    "plumb",
    "paint",
    "tiles?",
    "cement",
    "steel",
    "glass",
    "furnitur",
    "mobile",
    "telecom",
    "sim ",
    "computer",
    "laptop",
    "cyber",
    "photocop",
    "printing",
    "\\bpress\\b",
    "stationa?ery",
    "stationery",
    "library",
    "book",
    "cloth",
    "garment",
    "fashion",
    "boutique",
    "tailor",
    "fabric",
    "shoe",
    "cosmetic",
    "beauty",
    "parlou?r",
    "saloon",
    "salon",
    "jewel",
    "gold",
    "optic",
    "pharmac",
    "medic",
    "clinic",
    "diagnostic",
    "hospital",
    "auto",
    "motor",
    "bike",
    "cycle",
    "tyre",
    "tire",
    "petrol",
    "fuel",
    "gas cylinder",
    "bank",
    "insurance",
    "real estate",
    "travel",
    "courier",
    "laundry",
    "toy",
    "gift",
    "sport",
    "hardw",
    "workshop",
    "garage",
    // Bangla
    "ইলেকট্রি",
    "ইলেকট্রনি",
    "হার্ডওয়্যার",
    "স্যানিটারি",
    "পাইপ",
    "রং",
    "টাইলস",
    "সিমেন্ট",
    "ফার্নিচার",
    "মোবাইল",
    "কম্পিউটার",
    "ফটোকপি",
    "প্রেস",
    "স্টেশনারি",
    "লাইব্রেরি",
    "কাপড়",
    "বস্ত্র",
    "গার্মেন্ট",
    "দর্জি",
    "জুতা",
    "কসমেটিক",
    "পার্লার",
    "সেলুন",
    "স্বর্ণ",
    "জুয়েলার",
    "চশমা",
    "ফার্মেসি",
    "ঔষধ",
    "ওষুধ",
    "ক্লিনিক",
    "হাসপাতাল",
    "ডায়াগনস্টিক",
    "গ্যারেজ",
    "মোটর",
    "সাইকেল",
    "ব্যাংক",
    "বীমা",
  ].join("|"),
  "i",
);

function isNonFoodPlace(tags: Record<string, string>): boolean {
  const shop = tags["shop"] ?? "";
  const amenity = tags["amenity"] ?? "";
  // Only marketplaces and explicitly food-ish shops are allowed through.
  if (amenity !== "marketplace" && !new RegExp(`^(${FOOD_SHOPS})$`).test(shop)) return true;
  const haystack = [
    tags["name"],
    tags["name:en"],
    tags["name:bn"],
    tags["brand"],
    tags["operator"],
    tags["description"],
  ]
    .filter(Boolean)
    .join(" ");
  return NON_FOOD_PATTERN.test(haystack);
}

function addressOf(tags: Record<string, string>): string {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:suburb"] ?? tags["addr:neighbourhood"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
  ].filter(Boolean);
  return parts.join(", ");
}

function nameOf(tags: Record<string, string>): string {
  return (
    tags["name:bn"] ??
    tags["name"] ??
    (tags["amenity"] === "marketplace" ? "বাজার" : "মুদি দোকান")
  );
}

function toPlace(el: OsmElement): PlaceResult | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const tags = el.tags ?? {};
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return {
    id: `${el.type}/${el.id}`,
    name: nameOf(tags),
    address: addressOf(tags),
    lat,
    lng,
    rating: 0,
    reviews: 0,
    phone: tags["phone"] ?? tags["contact:phone"] ?? "",
    openNow: null,
    priceLevel: null,
    types: mapTypes(tags),
  };
}

/** Shop values requested from Overpass — food/grocery destinations only. */
const QUERY_SHOPS =
  "supermarket|greengrocer|convenience|butcher|seafood|fishmonger|grocery|farm|food|bakery|pastry|confectionery|deli|dairy|cheese|spices|rice|frozen_food|health_food|tea|coffee|beverages|water";

function overpassQuery(lat: number, lng: number, radiusM: number) {
  const around = `(around:${Math.round(radiusM)},${lat},${lng});`;
  // Nodes only + a single shop regex keeps the query cheap; ways add little for
  // small neighbourhood shops but cost Overpass a lot of time.
  const filters = [
    `node["amenity"="marketplace"]${around}`,
    `node["shop"~"^(${QUERY_SHOPS})$"]${around}`,
    `way["amenity"="marketplace"]${around}`,
  ].join("");
  return `[out:json][timeout:8];(${filters});out center 60;`;
}

/** Race every mirror — the first usable answer wins, slow mirrors are ignored. */
async function overpass(lat: number, lng: number, radiusM: number): Promise<PlaceResult[]> {
  const body = `data=${encodeURIComponent(overpassQuery(lat, lng, radiusM))}`;

  const attempt = async (url: string): Promise<PlaceResult[]> => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
      },
      body,
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`Overpass ${url} failed [${res.status}]`);
    const json = (await res.json()) as { elements?: OsmElement[] };
    return (json.elements ?? [])
      .filter((el) => !isNonFoodPlace(el.tags ?? {}))
      .map(toPlace)
      .filter((p): p is PlaceResult => p !== null);
  };

  try {
    return await Promise.any(OVERPASS_ENDPOINTS.map(attempt));
  } catch (err) {
    console.error("All Overpass mirrors failed", err);
    return [];
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

type NearbyResult = { places: PlaceResult[]; radiusKm: number };

/** Short-lived server cache so repeat searches in an area answer instantly. */
const CACHE_TTL_MS = 10 * 60 * 1000;
const searchCache = new Map<string, { at: number; value: NearbyResult }>();

const nearbyInput = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().min(0.3).max(15).default(2),
});

/**
 * Markets around a precise point, closest first. The radius only widens when
 * nothing real was found, so a shop 300 m away always beats one 10 km away.
 */
export const findMarketsNearby = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => nearbyInput.parse(data))
  .handler(async ({ data }): Promise<NearbyResult> => {
    const cacheId = `${data.lat.toFixed(3)},${data.lng.toFixed(3)},${data.radiusKm}`;
    const hit = searchCache.get(cacheId);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

    // One generous radius covers the usual case; a single wider retry only runs
    // when the neighbourhood really has nothing mapped.
    const steps = [data.radiusKm, data.radiusKm * 4].map((km) =>
      Math.min(Math.max(km, 0.5) * 1000, 20000),
    );

    for (const radiusM of steps) {
      const found = await overpass(data.lat, data.lng, radiusM);
      if (found.length > 0) {
        const sorted = found
          .map((p) => ({ p, d: haversineKm(data.lat, data.lng, p.lat, p.lng) }))
          .sort((a, b) => a.d - b.d)
          .map((x) => x.p)
          .slice(0, 30);
        const value = { places: sorted, radiusKm: radiusM / 1000 };
        searchCache.set(cacheId, { at: Date.now(), value });
        return value;
      }
    }

    return { places: [] as PlaceResult[], radiusKm: steps[steps.length - 1]! / 1000 };
  });

const geocodeInput = z.object({ query: z.string().min(2).max(120) });

/** Turn a typed area name into coordinates so manual entry is accurate too. */
export const geocodeArea = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => geocodeInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=jsonv2&limit=1&q=${encodeURIComponent(data.query)}`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) },
      );
      if (!res.ok) {
        console.error(`Nominatim search failed [${res.status}]`);
        return null;
      }
      const json = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name?: string;
      }>;
      const hit = json[0];
      if (!hit) return null;
      return {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name ?? data.query,
      };
    } catch (err) {
      console.error("Nominatim search errored", err);
      return null;
    }
  });

/** Reverse geocode the GPS fix so the user can confirm where we think they are. */
export const describeLocation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ lat: z.number(), lng: z.number() }).parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const res = await fetch(
        `${NOMINATIM}/reverse?format=jsonv2&zoom=16&lat=${data.lat}&lon=${data.lng}`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) },
      );
      if (!res.ok) {
        console.error(`Nominatim reverse failed [${res.status}]`);
        return null;
      }
      const json = (await res.json()) as { display_name?: string };
      return json.display_name ?? null;
    } catch (err) {
      console.error("Nominatim reverse errored", err);
      return null;
    }
  });
