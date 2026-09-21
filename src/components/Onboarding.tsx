import { useState } from "react";
import { ChefHat, Check, PartyPopper } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { saltLabel, spiceLabel, type Prefs } from "@/lib/prefs";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { haptic } from "@/lib/haptics";
import { NeuButton, NeuCard, NeuChip, NeuInput } from "./neu";
import { OnboardingLottie } from "./polish/OnboardingLottie";

type L = { bn: string; en: string };

type Q =
  | { key: keyof Prefs; label: L; type: "country" }
  | { key: keyof Prefs; label: L; type: "radio" | "multi"; options: L[] }
  | { key: keyof Prefs; label: L; type: "slider"; min: number; max: number; ends: [L, L] }
  | { key: keyof Prefs; label: L; type: "text"; placeholder: L };

const PAGES: Q[][] = [
  [
    {
      key: "country",
      label: { bn: "আপনি কোন দেশে রান্না করছেন?", en: "Which country are you cooking in?" },
      type: "country",
    },
    {
      key: "cuisines",
      label: { bn: "রন্ধনশৈলী পছন্দ", en: "Cuisine preferences" },
      type: "multi",
      options: [
        { bn: "বাঙালি", en: "Bengali" },
        { bn: "ভারতীয়", en: "Indian" },
        { bn: "ইতালিয়ান", en: "Italian" },
        { bn: "জাপানি", en: "Japanese" },
        { bn: "চাইনিজ", en: "Chinese" },
        { bn: "থাই", en: "Thai" },
        { bn: "মধ্যপ্রাচ্যীয়", en: "Middle Eastern" },
        { bn: "মেক্সিকান", en: "Mexican" },
        { bn: "কন্টিনেন্টাল", en: "Continental" },
      ],
    },
    {
      key: "storage",
      label: { bn: "খাদ্য সংরক্ষণ কোথায় করেন?", en: "How do you store food?" },
      type: "radio",
      options: [
        { bn: "ফ্রিজার", en: "Freezer" },
        { bn: "রেফ্রিজারেটর", en: "Refrigerator" },
        { bn: "রান্নাঘরের তাক", en: "Kitchen shelf" },
        { bn: "কোনোটি নয়", en: "None" },
      ],
    },
  ],
  [
    {
      key: "household",
      label: { bn: "পরিবারের সদস্য সংখ্যা", en: "How many people in your household?" },
      type: "slider",
      min: 1,
      max: 10,
      ends: [
        { bn: "১", en: "1" },
        { bn: "১০+", en: "10+" },
      ],
    },
    {
      key: "skill",
      label: { bn: "রান্নায় আপনার দক্ষতা", en: "Your cooking skill" },
      type: "radio",
      options: [
        { bn: "নতুন", en: "Beginner" },
        { bn: "মধ্যম", en: "Intermediate" },
        { bn: "বিশেষজ্ঞ", en: "Expert" },
      ],
    },
    {
      key: "spiceLevel",
      label: { bn: "ঝাল স্তর", en: "Spice level" },
      type: "slider",
      min: 1,
      max: 10,
      ends: [
        { bn: "কম", en: "Mild" },
        { bn: "অতি ঝাল", en: "Fiery" },
      ],
    },
  ],
  [
    {
      key: "saltLevel",
      label: { bn: "নোনতা স্তর", en: "Salt level" },
      type: "slider",
      min: 1,
      max: 10,
      ends: [
        { bn: "কম লবণ", en: "Low salt" },
        { bn: "বেশি লবণ", en: "High salt" },
      ],
    },
    {
      key: "diet",
      label: { bn: "খাদ্যতালিকাগত সীমাবদ্ধতা", en: "Dietary restrictions" },
      type: "multi",
      options: [
        { bn: "ভেগান", en: "Vegan" },
        { bn: "নিরামিষ", en: "Vegetarian" },
        { bn: "হালাল", en: "Halal" },
        { bn: "গ্লুটেন-মুক্ত", en: "Gluten free" },
        { bn: "কোনোটি নয়", en: "None" },
      ],
    },
    {
      key: "allergies",
      label: { bn: "অ্যালার্জি (কমা দিয়ে লিখুন)", en: "Allergies (comma separated)" },
      type: "text",
      placeholder: { bn: "যেমন: বাদাম, চিংড়ি, দুধ", en: "e.g. peanuts, shrimp, milk" },
    },
  ],
  [
    {
      key: "time",
      label: { bn: "রান্নার সময়", en: "Cooking time" },
      type: "radio",
      options: [
        { bn: "১৫ মিনিটের কম", en: "Under 15 min" },
        { bn: "১৫–৩০ মিনিট", en: "15-30 min" },
        { bn: "৩০–৬০ মিনিট", en: "30-60 min" },
        { bn: "৬০+ মিনিট", en: "60+ min" },
      ],
    },
    {
      key: "healthy",
      label: { bn: "স্বাস্থ্যকর খাবার পছন্দ?", en: "Do you prefer healthy food?" },
      type: "radio",
      options: [
        { bn: "হ্যাঁ", en: "Yes" },
        { bn: "না", en: "No" },
        { bn: "মাঝে মাঝে", en: "Sometimes" },
      ],
    },
    {
      key: "budget",
      label: { bn: "বাজেট (প্রতি বেলা)", en: "Budget (per meal)" },
      type: "radio",
      options: [
        { bn: "কম (৳১০০-এর কম)", en: "Low (under 100)" },
        { bn: "মাঝারি (৳১০০–৩০০)", en: "Medium (100-300)" },
        { bn: "বেশি (৳৩০০+)", en: "High (300+)" },
      ],
    },
  ],
  [
    {
      key: "frequency",
      label: { bn: "রান্নার ফ্রিকোয়েন্সি", en: "How often do you cook?" },
      type: "radio",
      options: [
        { bn: "কখনো কখনো", en: "Rarely" },
        { bn: "সপ্তাহে ২–৩ বার", en: "2-3x / week" },
        { bn: "প্রতিদিন", en: "Daily" },
      ],
    },
    {
      key: "appliances",
      label: { bn: "রান্নাঘরের যন্ত্রপাতি", en: "Kitchen appliances" },
      type: "multi",
      options: [
        { bn: "মাইক্রোওয়েভ", en: "Microwave" },
        { bn: "প্রেসার কুকার", en: "Pressure cooker" },
        { bn: "ব্লেন্ডার", en: "Blender" },
        { bn: "ওভেন", en: "Oven" },
        { bn: "এয়ার ফ্রায়ার", en: "Air fryer" },
        { bn: "কোনোটি নয়", en: "None" },
      ],
    },
    {
      key: "living",
      label: { bn: "বাসস্থানের ধরন", en: "Living arrangement" },
      type: "radio",
      options: [
        { bn: "একক পরিবার", en: "Nuclear family" },
        { bn: "যৌথ পরিবার", en: "Extended family" },
        { bn: "হোস্টেল / শেয়ারিং", en: "Hostel / sharing" },
      ],
    },
  ],
];

function Slider({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="neu-glow-focus h-2 w-full cursor-pointer appearance-none rounded-full bg-accent/25 accent-accent outline-none"
    />
  );
}

export function Onboarding({ onDone }: { onDone: (p: Prefs) => void }) {
  const { t, lang } = useLang();
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Prefs>({});
  const [saved, setSaved] = useState(false);
  const questions = PAGES[page]!;
  const label = (l: L) => (lang === "bn" ? l.bn : l.en);

  const set = (key: keyof Prefs, value: unknown) =>
    setAnswers((prev) => ({ ...prev, [key]: value }) as Prefs);

  const toggleMulti = (key: keyof Prefs, value: string) => {
    const list = (answers[key] as string[] | undefined) ?? [];
    set(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const persist = async (p: Prefs) => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from("user_preferences").upsert({
        user_id: data.user.id,
        country: p.country ?? null,
        cuisines: p.cuisines ?? [],
        storage: p.storage ?? null,
        household_size: p.household ?? null,
        skill: p.skill ?? null,
        spice_level: p.spiceLevel ?? null,
        salt_level: p.saltLevel ?? null,
        diet: p.diet ?? [],
        allergies: p.allergies ?? null,
        cook_time: p.time ?? null,
        healthy: p.healthy ?? null,
        budget: p.budget ?? null,
        frequency: p.frequency ?? null,
        appliances: p.appliances ?? [],
        living: p.living ?? null,
        completed: true,
      });
    } catch {
      /* offline / guest — local preferences still apply */
    }
  };

  const finish = () => {
    const final: Prefs = {
      ...answers,
      onboarded: true,
      ...(spiceLabel(answers.spiceLevel) ? { spice: spiceLabel(answers.spiceLevel)! } : {}),
      ...(saltLabel(answers.saltLevel) ? { salt: saltLabel(answers.saltLevel)! } : {}),
    };
    haptic("success");
    setAnswers(final);
    setSaved(true);
    void persist(final);
  };

  const advance = () => {
    haptic("tap");
    if (page === PAGES.length - 1) finish();
    else setPage(page + 1);
  };

  if (saved) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
        <div className="neu-raised neu-glow flex h-20 w-20 items-center justify-center rounded-lg text-accent">
          <PartyPopper className="h-9 w-9" />
        </div>
        <div key={lang} className="lang-fade">
          <h1 className="text-xl font-bold">{t("prefsSaved")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("prefsSavedHint")}</p>
        </div>
        <NeuButton variant="accent" size="lg" onClick={() => onDone(answers)}>
          {t("continueApp")}
        </NeuButton>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-20">
      <div className="mb-4 flex items-center gap-3">
        <div className="neu-raised flex h-12 w-12 items-center justify-center rounded-lg text-accent">
          <ChefHat className="h-6 w-6" />
        </div>
        <div key={lang} className="lang-fade">
          <h1 className="text-lg font-bold leading-tight">{t("appName")}</h1>
          <p className="text-xs text-muted-foreground">{t("onboardingIntro")}</p>
        </div>
      </div>

      {page === 0 && (
        <div className="mb-3 flex justify-center">
          <OnboardingLottie />
        </div>
      )}

      <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {t("stepOf")} {page + 1} {t("ofWord")} {PAGES.length}
        </span>
        <span>{Math.round(((page + 1) / PAGES.length) * 100)}%</span>
      </div>
      <div className="neu-inset mb-5 h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${((page + 1) / PAGES.length) * 100}%` }}
        />
      </div>

      <div key={`${page}-${lang}`} className="lang-fade flex flex-1 flex-col gap-4">
        {questions.map((q) => (
          <NeuCard key={String(q.key)}>
            <h2 className="mb-3 text-sm font-bold">{label(q.label)}</h2>

            {q.type === "country" && (
              <select
                value={(answers.country as string) ?? ""}
                onChange={(e) => set("country", e.target.value)}
                className="neu-inset neu-glow-focus w-full rounded-lg bg-background px-4 py-3 text-sm outline-none"
              >
                <option value="">{lang === "bn" ? "দেশ নির্বাচন করুন" : "Select a country"}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.en}>
                    {lang === "bn" ? c.bn : c.en}
                  </option>
                ))}
              </select>
            )}

            {(q.type === "radio" || q.type === "multi") && (
              <div className={q.type === "multi" ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
                {q.options.map((o) => {
                  const selected =
                    q.type === "multi"
                      ? (((answers[q.key] as string[] | undefined) ?? []).includes(o.en))
                      : answers[q.key] === o.en;
                  return (
                    <NeuChip
                      key={o.en}
                      selected={selected}
                      onClick={() => {
                        haptic("select");
                        if (q.type === "multi") toggleMulti(q.key, o.en);
                        else set(q.key, o.en);
                      }}
                      className={
                        q.type === "multi"
                          ? "px-3 py-2 text-xs"
                          : "flex items-center justify-between"
                      }
                    >
                      <span>{label(o)}</span>
                      {selected && q.type === "radio" && <Check className="h-4 w-4" />}
                    </NeuChip>
                  );
                })}
              </div>
            )}

            {q.type === "slider" && (
              <div>
                <div className="mb-2 text-center text-lg font-bold text-accent">
                  {(answers[q.key] as number | undefined) ?? Math.ceil((q.min + q.max) / 2)}
                  {q.key === "household" ? ` ${t("people")}` : ` / ${q.max}`}
                </div>
                <Slider
                  min={q.min}
                  max={q.max}
                  value={(answers[q.key] as number | undefined) ?? Math.ceil((q.min + q.max) / 2)}
                  onChange={(n) => set(q.key, n)}
                />
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>{label(q.ends[0])}</span>
                  <span>{label(q.ends[1])}</span>
                </div>
              </div>
            )}

            {q.type === "text" && (
              <NeuInput
                value={(answers[q.key] as string | undefined) ?? ""}
                placeholder={label(q.placeholder)}
                onChange={(e) => set(q.key, e.target.value)}
              />
            )}
          </NeuCard>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <NeuButton variant="accent" size="lg" onClick={advance}>
          {page === PAGES.length - 1 ? t("done") : t("next")}
        </NeuButton>
        <div className="flex items-center gap-5 text-xs">
          {page > 0 && (
            <button
              className="text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setPage(page - 1)}
            >
              {t("prev")}
            </button>
          )}
          <button
            className="text-muted-foreground underline-offset-2 hover:underline"
            onClick={advance}
          >
            {t("skip")}
          </button>
          <button
            className="text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => onDone({ onboarded: true })}
          >
            {t("notNow")}
          </button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">{t("notNowHint")}</p>
      </div>
    </div>
  );
}
