import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Phone, Star, Store } from "lucide-react";
import { toast } from "sonner";

import { BottomSheet } from "@/components/BottomSheet";
import { NeuButton, NeuCard } from "@/components/neu";
import { haptic } from "@/lib/haptics";
import { useLang } from "@/lib/i18n";
import {
  findNearbyMarkets,
  priceTier,
  type RankedMarket,
} from "@/lib/markets-db";
import { describeLocation, geocodeArea } from "@/lib/markets.functions";

type Step = "location" | "list";
type DistanceFilter = "all" | "1" | "2" | "5";
type PriceFilter = "all" | "সাশ্রয়ী" | "মধ্যম" | "প্রিমিয়াম";

export function NearbyMarketFinder({
  ingredients,
  className = "",
}: {
  ingredients: string[];
  className?: string;
}) {
  const { bi: lang } = useLang();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("location");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [place, setPlace] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState<RankedMarket[]>([]);
  const [selected, setSelected] = useState<RankedMarket | null>(null);
  const [manual, setManual] = useState("");

  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [openOnly, setOpenOnly] = useState(false);

  // Ask for the precise position as soon as the sheet opens.
  useEffect(() => {
    if (!open || coords || typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(point);
        setLocating(false);
        void describeLocation({ data: point })
          .then((label) => label && setPlace(label))
          .catch(() => undefined);
      },
      () => {
        setLocating(false);
        setLocError(true);
      },
      // A recent fix is good enough for shops a few hundred metres away, and it
      // returns instantly instead of waiting on a fresh GPS lock.
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },

    );
  }, [open, coords]);

  const search = useCallback(
    async (lat: number, lng: number) => {
      setLoading(true);
      try {
        const found = await findNearbyMarkets(lat, lng, ingredients, 2);
        setMarkets(found);
        setStep("list");
        if (found.length === 0) {
          toast.info(
            lang === "bn"
              ? "আশেপাশে কোনো দোকান পাওয়া যায়নি"
              : "No markets found nearby",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [ingredients, lang],
  );

  const approve = () => {
    haptic("select");
    if (!coords) {
      toast.error(
        lang === "bn"
          ? "অবস্থান পাওয়া যায়নি — লোকেশন চালু করুন বা এলাকার নাম লিখুন"
          : "No location yet — turn on location or type your area",
      );
      return;
    }
    void search(coords.lat, coords.lng);
  };

  const useManual = async () => {
    const q = manual.trim();
    if (!q) {
      toast.error(lang === "bn" ? "এলাকার নাম লিখুন" : "Enter an area name");
      return;
    }
    setLoading(true);
    try {
      const hit = await geocodeArea({ data: { query: q } });
      if (!hit) {
        toast.error(lang === "bn" ? "এলাকাটি খুঁজে পাইনি" : "Could not find that area");
        return;
      }
      setPlace(hit.label);
      setCoords({ lat: hit.lat, lng: hit.lng });
      await search(hit.lat, hit.lng);
    } catch {
      toast.error(lang === "bn" ? "ম্যাপ থেকে তথ্য আনা যায়নি" : "Map lookup failed");
    } finally {
      setLoading(false);
    }
  };


  const visible = markets
    .filter((m) => {
      if (distanceFilter === "1") return m.distanceKm < 1;
      if (distanceFilter === "2") return m.distanceKm >= 1 && m.distanceKm < 2;
      if (distanceFilter === "5") return m.distanceKm >= 2 && m.distanceKm < 5;
      return true;
    })
    .filter((m) => priceFilter === "all" || priceTier(m.avg_price_index) === priceFilter)
    .filter((m) => !openOnly || m.openNow);

  const close = () => {
    setOpen(false);
    setSelected(null);
    setStep(coords ? "list" : "location");
  };

  return (
    <>
      <NeuButton
        variant="default"
        className={className}
        onClick={() => {
          haptic("select");
          setOpen(true);
        }}
      >
        <Store className="h-4 w-4" />
        {lang === "bn" ? "বাজার থেকে কিনে আনুন" : "Buy from a nearby market"}
      </NeuButton>

      <BottomSheet
        open={open}
        onClose={close}
        title={lang === "bn" ? "কাছাকাছি বাজার" : "Nearby markets"}
      >
        {step === "location" ? (
          <div>
            <p className="text-sm font-medium">
              {lang === "bn"
                ? "আপনার কাছাকাছি বাজার খুঁজছি..."
                : "Looking for markets near you..."}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              📍 {lang === "bn" ? "আপনার অবস্থান" : "Your location"}:{" "}
              {locating
                ? lang === "bn"
                  ? "খুঁজছি..."
                  : "Locating..."
                : place ||
                  (locError
                    ? lang === "bn"
                      ? "পাওয়া যায়নি — লোকেশন চালু করুন"
                      : "Unavailable — turn on location"
                    : coords
                      ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                      : "—")}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <NeuButton
                variant="accent"
                size="lg"
                onClick={approve}
                disabled={loading || locating || !coords}
              >
                {loading || locating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                অনুমোদন করুন
              </NeuButton>
              <div className="flex gap-2">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder={lang === "bn" ? "এলাকা / শহর" : "Area / city"}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
                />
                <NeuButton onClick={() => void useManual()} disabled={loading}>
                  ম্যানুয়াল প্রবেশ
                </NeuButton>
              </div>
            </div>
          </div>

        ) : (
          <div>
            <h3 className="text-sm font-bold">
              {lang === "bn"
                ? `আপনার কাছাকাছি দোকান (${visible.length}টি পাওয়া গেছে)`
                : `Markets near you (${visible.length} found)`}
            </h3>

            {/* Filters */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value as DistanceFilter)}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
                aria-label={lang === "bn" ? "দূরত্ব" : "Distance"}
              >
                <option value="all">{lang === "bn" ? "সব দূরত্ব" : "Any distance"}</option>
                <option value="1">&lt;1 km</option>
                <option value="2">1-2 km</option>
                <option value="5">2-5 km</option>
              </select>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
                aria-label={lang === "bn" ? "দাম" : "Price"}
              >
                <option value="all">{lang === "bn" ? "সব দাম" : "Any price"}</option>
                <option value="সাশ্রয়ী">সাশ্রয়ী</option>
                <option value="মধ্যম">মধ্যম</option>
                <option value="প্রিমিয়াম">প্রিমিয়াম</option>
              </select>
              <button
                type="button"
                onClick={() => setOpenOnly((v) => !v)}
                aria-pressed={openOnly}
                className={`rounded-lg border px-2 py-1.5 text-xs ${
                  openOnly
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                খোলা আছে এখনই
              </button>
            </div>

            {loading && (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {lang === "bn" ? "খুঁজছি..." : "Searching..."}
              </p>
            )}

            {!loading && visible.length === 0 && (
              <p className="mt-6 text-sm text-muted-foreground">
                {lang === "bn"
                  ? "এই ফিল্টারে কোনো দোকান নেই।"
                  : "No markets match these filters."}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {visible.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    haptic("select");
                    setSelected(m);
                  }}
                  className="text-left active:opacity-80"
                >
                  <NeuCard>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">
                        {i + 1}. {m.name}
                      </p>
                      {m.cheapest && (
                        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                          সবচেয়ে সাশ্রয়ী
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      📍 {m.distanceKm.toFixed(1)} km দূরে
                    </p>
                    {m.address && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{m.address}</p>
                    )}
                    {m.reviews > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        ⭐ {m.rating.toFixed(1)}/5 ({m.reviews} reviews)
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.specialties.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {m.phone ? `${m.phone} · ` : ""}
                      {m.opens && m.closes ? `${m.opens}–${m.closes} ` : ""}
                      {m.openNow ? (
                        <span className="text-primary">
                          {lang === "bn" ? "খোলা" : "Open"}
                        </span>
                      ) : (
                        <span>{lang === "bn" ? "বন্ধ" : "Closed"}</span>
                      )}
                    </p>
                  </NeuCard>
                </button>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Details modal */}
      <BottomSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
      >
        {selected && (
          <div>
            <p className="text-sm text-muted-foreground">{selected.address}</p>
            <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
              <a
                href={
                  coords
                    ? `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${selected.lat},${selected.lng}&travelmode=walking`
                    : `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}&travelmode=walking`
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 underline-offset-2 hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" /> {selected.distanceKm.toFixed(1)} km দূরে
              </a>
              {selected.reviews > 0 && (
                <span className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5" /> {selected.rating.toFixed(1)}/5 (
                  {selected.reviews} reviews)
                </span>
              )}

              {selected.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {selected.phone}
                </span>
              )}
              <span>
                {selected.opens && selected.closes
                  ? `${selected.opens}–${selected.closes} · `
                  : ""}
                {priceTier(selected.avg_price_index)}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground active:opacity-80"
                >
                  <Phone className="h-4 w-4" /> কল করুন
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium active:opacity-80"
              >
                <MapPin className="h-4 w-4" /> ম্যাপে দেখুন
              </a>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
