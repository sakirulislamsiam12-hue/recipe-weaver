import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Clock, Search, Sparkles, X } from "lucide-react";

import { NeuButton, NeuCard } from "@/components/neu";
import { CameraCapture } from "@/components/CameraCapture";
import { VoiceInput } from "@/components/VoiceInput";
import { InputFab, type InputMode } from "@/components/InputFab";
import { GuestBadge } from "@/components/GuestBadge";
import { UseItUpCard } from "@/components/UseItUpCard";
import { RecipeListSkeleton } from "@/components/polish/Skeletons";
import { UtilizationBar } from "@/components/polish/UtilizationBar";
import { isRegionalDefault } from "@/lib/matching";
import { isBangladeshRegion } from "@/lib/defaults";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/app-state";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Pantry AI — Cook from what you already have" },
      {
        name: "description",
        content:
          "Add the ingredients in your kitchen and get instant zero-waste recipes in Bangla or English.",
      },
      { property: "og:title", content: "Smart Pantry AI — Cook from what you already have" },
      {
        property: "og:description",
        content: "Instant zero-waste recipes from your pantry, in Bangla or English.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeSection,
});

const seedsBn = ["আলু", "ডিম", "পালং শাক", "পেঁয়াজ", "মুরগি", "টমেটো", "ভাত", "মসুর ডাল"];
const seedsEn = ["Potato", "Egg", "Spinach", "Onion", "Chicken", "Tomato", "Rice", "Lentils"];

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const num = (n: number, lang: "bn" | "en") =>
  lang === "bn" ? String(n).replace(/\d/g, (d) => BN_DIGITS.charAt(+d)) : String(n);

function HomeSection() {
  const { t, bi: lang } = useLang();
  const {
    items,
    add,
    addMany,
    remove,
    pantry,
    prefs,
    recipes,
    almost,
    unlockCount,
    setActive,
    loading,
    error,
    run,
    session,
    setSignInOpen,
  } = useApp();
  const [draft, setDraft] = useState("");
  const [expandedAlmost, setExpandedAlmost] = useState<string | null>(null);
  const [sheet, setSheet] = useState<InputMode | null>(null);

  const submit = (value: string) => {
    if (!value.trim()) return;
    add(value);
    setDraft("");
  };

  const openInput = (mode: InputMode) => {
    if (mode === "text") {
      const el = document.getElementById("pantry-input");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement | null)?.focus();
      return;
    }
    setSheet(mode);
  };

  const visible = items.filter((i) => !isRegionalDefault(i, prefs.country));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <GuestBadge email={session?.email ?? null} onSignIn={() => setSignInOpen(true)} />
      </div>

      {/* Hero search */}
      <section className="mb-6">
        <h1 className="text-xl font-semibold leading-snug">{t("ingredientsTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("ingredientsHint")}</p>

        <div className="mt-4 flex items-center gap-2 border-b border-border pb-2 focus-within:border-primary">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            id="pantry-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(draft)}
            placeholder={lang === "bn" ? "যেমন: আলু, ডিম" : "e.g. potato, egg"}
            className="w-full min-w-0 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => submit(draft)}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground active:opacity-80"
          >
            {t("add")}
          </button>
        </div>

        {visible.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {visible.map((i) => (
              <span
                key={i}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm"
              >
                {i}
                <button onClick={() => remove(i)} aria-label={`remove ${i}`}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </span>
            ))}
          </div>
        )}

        {isBangladeshRegion(prefs.country) && (
          <p className="mt-3 text-xs text-muted-foreground">
            {lang === "bn"
              ? "লবণ এবং জল বাংলা রেসিপিতে সব সময় আছে বলে ধরে নেওয়া হয়"
              : "Salt and water are always assumed to be available in Bengali recipes"}
          </p>
        )}

        <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("suggestions")}
        </p>
        <div className="flex flex-wrap gap-2">
          {(lang === "bn" ? seedsBn : seedsEn).map((s) => (
            <button
              key={s}
              onClick={() => add(s)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm active:opacity-80"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <UseItUpCard items={pantry} onUse={(name) => add(name)} />

      <div className="mt-6">
        <NeuButton variant="accent" size="lg" onClick={() => void run()} disabled={loading}>
          <Sparkles className="h-4 w-4" />
          {loading ? t("generating") : t("generate")}
        </NeuButton>
      </div>

      {error && <p className="mt-4 text-center text-sm text-destructive">{t("errorGeneric")}</p>}

      {loading && <RecipeListSkeleton />}

      {!loading && (recipes.length > 0 || almost.length > 0) && (
        <div className="mt-6 rounded-lg border border-border px-4 py-3 text-sm leading-relaxed">
          <p className="font-medium">
            {lang === "bn"
              ? `আপনার কাছে থাকা উপাদান দিয়ে ${num(recipes.length, lang)} টি রেসিপি তৈরি করতে পারবেন`
              : `You can cook ${num(recipes.length, lang)} recipe${recipes.length === 1 ? "" : "s"} with what you have`}
          </p>
          {unlockCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "bn"
                ? `আরও কিছু উপাদান নিয়ে আসলে ${num(unlockCount, lang)} টি আরও রেসিপি আনলক হবে`
                : `Buying a few more ingredients would unlock ${num(unlockCount, lang)} more recipe${unlockCount === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold">{t("recipes")}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {recipes.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  haptic("tap");
                  setActive(r);
                }}
                className="flex h-full flex-col rounded-lg border border-border bg-card p-4 text-left transition-transform duration-150 active:scale-[0.99]"
              >
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{r.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.subtitle}</p>
                <span className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {r.timeMinutes} {t("minutes")}
                </span>
                <div className="mt-auto pt-3">
                  <UtilizationBar value={r.utilization} label={t("utilization")} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {!loading && almost.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 text-base font-semibold">
            {lang === "bn" ? "প্রায় তৈরি" : "Almost ready"}
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            {lang === "bn"
              ? "এক-দুটি উপাদান কিনলেই এগুলো রাঁধা যাবে"
              : "One or two ingredients away from cookable"}
          </p>
          <div className="flex flex-col gap-2">
            {almost.map((a) => {
              const pct = Math.round(a.ratio * 100);
              const open = expandedAlmost === a.recipe.id;
              return (
                <NeuCard key={a.recipe.id}>
                  <div className="flex w-full items-center justify-between gap-4">
                    <button
                      onClick={() => {
                        haptic("tap");
                        setActive(a.recipe);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <h3 className="truncate text-sm font-medium leading-snug">
                        {a.recipe.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lang === "bn"
                          ? `এই রেসিপির জন্য আপনার ${num(pct, lang)}% উপাদান আছে`
                          : `You have ${num(pct, lang)}% of the ingredients for this recipe`}
                      </p>
                      <span className="mt-1 block text-xs font-medium text-primary">
                        {lang === "bn" ? "পুরো রেসিপি দেখুন" : "View full recipe"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        haptic("tap");
                        setExpandedAlmost(open ? null : a.recipe.id);
                      }}
                      className="shrink-0 rounded-lg p-2"
                      aria-expanded={open}
                      aria-label={lang === "bn" ? "যা লাগবে দেখুন" : "Show missing ingredients"}
                    >
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                  {open && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="mb-2 text-xs font-medium">{t("missing")}:</p>
                      <div className="flex flex-wrap gap-2">
                        {a.missing.map((m) => (
                          <span
                            key={m}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </NeuCard>
              );
            })}
          </div>
        </section>
      )}

      {!loading && recipes.length === 0 && almost.length === 0 && !error && (
        <p className="mt-8 text-center text-sm text-muted-foreground">{t("emptyState")}</p>
      )}

      <InputFab onPick={openInput} />
      <CameraCapture open={sheet === "camera"} onClose={() => setSheet(null)} onConfirm={addMany} />
      <VoiceInput open={sheet === "mic"} onClose={() => setSheet(null)} onConfirm={addMany} />
    </>
  );
}
