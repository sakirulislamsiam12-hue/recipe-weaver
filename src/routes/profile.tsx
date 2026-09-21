import { createFileRoute } from "@tanstack/react-router";
import { Globe, SlidersHorizontal, User } from "lucide-react";
import { useState } from "react";

import { NeuButton, NeuCard } from "@/components/neu";
import { GuestBadge } from "@/components/GuestBadge";
import { StreakBadges } from "@/components/StreakBadges";
import { OfflineRecipes } from "@/components/OfflineRecipes";
import { ThemeToggle } from "@/components/polish/ThemeToggle";
import { LanguagePickerExpanded } from "@/components/LanguagePickerExpanded";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n-50-languages";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/app-state";
import { formatTaka, getPantrySummary } from "@/lib/cost-summary";
import { usePantryPurchases } from "@/lib/pantry-purchases";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Smart Pantry AI" },
      {
        name: "description",
        content:
          "Manage your cooking preferences, streaks, saved offline recipes and kitchen settings.",
      },
      { property: "og:title", content: "Your Profile — Smart Pantry AI" },
      {
        property: "og:description",
        content: "Cooking preferences, streaks, offline recipes and settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfileSection,
});

function ProfileSection() {
  const { t, lang } = useLang();
  const { prefs, setPrefs, session, setSignInOpen, openRecipe } = useApp();
  const { purchases } = usePantryPurchases();
  const [langOpen, setLangOpen] = useState(false);
  const summary = getPantrySummary(purchases, session?.id ?? "guest");

  return (
    <>
      <h1 className="mb-1 text-lg font-bold">{lang === "bn" ? "প্রোফাইল" : "Profile"}</h1>
      <p className="mb-4 text-xs text-muted-foreground">
        {lang === "bn" ? "আপনার পছন্দ ও সেটিংস" : "Your preferences and settings"}
      </p>

      <NeuCard className="shadow-sm">
        <div className="flex items-center gap-3">
          <span className="neu-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-accent">
            <User className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">
              {session?.email ?? (lang === "bn" ? "গেস্ট ব্যবহারকারী" : "Guest user")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {prefs.country ?? (lang === "bn" ? "অঞ্চল সেট করা হয়নি" : "No region set")}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <button
          onClick={() => setLangOpen(true)}
          className="mt-4 flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left active:opacity-80"
        >
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{t("selectLanguage")}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {SUPPORTED_LANGUAGES[lang].name}
            </span>
          </span>
        </button>
        <LanguagePickerExpanded open={langOpen} onClose={() => setLangOpen(false)} />

        <div className="mt-4">
          <GuestBadge email={session?.email ?? null} onSignIn={() => setSignInOpen(true)} />
        </div>
        <NeuButton
          size="lg"
          className="mt-4"
          onClick={() => setPrefs({ ...prefs, onboarded: false })}
        >
          <SlidersHorizontal className="h-4 w-4" /> {t("editPrefs")}
        </NeuButton>
      </NeuCard>

      <NeuCard className="mt-4 shadow-sm">
        <p className="text-sm font-bold">
          {lang === "bn" ? "এই মাস খরচ: " : "This month: "}
          {formatTaka(summary.monthlyCost)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {lang === "bn"
            ? `নষ্ট হওয়ার ঝুঁকি: ${summary.atRiskCount} আইটেম`
            : `At spoilage risk: ${summary.atRiskCount} items`}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {lang === "bn" ? "সবচেয়ে দ্রুত নষ্ট: " : "Spoils soonest: "}
          {summary.soonest?.item_name ?? "—"}
        </p>
      </NeuCard>

      <StreakBadges />
      <OfflineRecipes onOpen={openRecipe} />
    </>
  );
}
