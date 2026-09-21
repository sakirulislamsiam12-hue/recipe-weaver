import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Headphones,
  MessageCircle,
  ShoppingBasket,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { Recipe } from "@/lib/ai.functions";
import { useLang } from "@/lib/i18n";
import { NeuButton, NeuCard } from "./neu";
import { AiFeedbackButton } from "./AiFeedbackButton";
import { RecipeChat } from "./RecipeChat";
import { ServingScaler } from "./ServingScaler";
import { AisleRoute } from "./AisleRoute";
import { NearbyMarketFinder } from "./NearbyMarketFinder";
import { VideoTutorial } from "./VideoTutorial";
import { VoiceGuidedCooking } from "./VoiceGuidedCooking";
import { SurpriseRemix } from "./SurpriseRemix";
import { HouseholdPortionSync } from "./HouseholdPortionSync";
import { RateRefineCard } from "./RateRefineCard";
import { SaveOfflineButton } from "./OfflineRecipes";
import { recipeLevel } from "./DifficultyBadge";
import { estimateCost, formatTaka } from "@/lib/cost";
import { scaleQuantity } from "@/lib/scale";
import { haptic } from "@/lib/haptics";
import { CookedButton } from "./polish/CookedButton";
import { StepTimer } from "./StepTimers";

export function RecipeDetail({
  recipe,
  onBack,
  pantry = [],
  onRecipe,
}: {
  recipe: Recipe;
  onBack: () => void;
  pantry?: string[];
  onRecipe?: (r: Recipe) => void;
}) {
  const { t, bi: lang } = useLang();
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const baseServings = recipe.servings || 2;
  const [servings, setServings] = useState(baseServings);
  const factor = servings / baseServings;
  const [doneSteps, setDoneSteps] = useState<number[]>([]);

  const toggleStep = (i: number) => {
    haptic("select");
    setDoneSteps((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };


  const axes = [
    { key: "sour", bn: "টক", en: "Sour" },
    { key: "sweet", bn: "মিষ্টি", en: "Sweet" },
    { key: "umami", bn: "উমামি", en: "Umami" },
    { key: "salty", bn: "নোনতা", en: "Salty" },
    { key: "bitter", bn: "তিতা", en: "Bitter" },
    { key: "spicy", bn: "ঝাল", en: "Spicy" },
  ] as const;

  const data = axes.map((a) => ({
    axis: lang === "bn" ? a.bn : a.en,
    value: recipe.flavor[a.key] ?? 0,
  }));

  const level = recipeLevel(recipe);
  const levelLabel =
    level === "easy" ? t("easyLevel") : level === "medium" ? t("mediumLevel") : t("hardLevel");
  const cost = estimateCost(recipe.ingredients, servings, factor);

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-24 pt-20">
      <NeuButton size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </NeuButton>

      <h1 className="mt-4 text-xl font-semibold leading-snug">{recipe.title}</h1>
      {recipe.subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{recipe.subtitle}</p>
      )}

      {/* Compact header: time · difficulty · cost */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-border border-y border-border text-center">
        <div className="px-2 py-3">
          <p className="text-sm font-medium">
            {recipe.timeMinutes} {t("minutes")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <Clock className="mr-1 inline h-3 w-3" />
            {lang === "bn" ? "সময়" : "Time"}
          </p>
        </div>
        <div className="px-2 py-3">
          <p className="text-sm font-medium">{levelLabel}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("difficulty")}</p>
        </div>
        <div className="px-2 py-3">
          <p className="text-sm font-medium">{formatTaka(cost.total, lang)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("costEstimate")}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <NeuButton size="sm" onClick={() => setVoiceOpen(true)}>
          <Headphones className="h-3.5 w-3.5" /> {t("voiceMode")}
        </NeuButton>
        <SaveOfflineButton recipe={recipe} />
      </div>


      <SurpriseRemix
        recipe={recipe}
        pantry={pantry}
        onRecipe={(next) => onRecipe?.(next)}
      />

      <NeuCard className="mt-5">
        <h2 className="mb-3 text-sm font-bold">{t("ingredients")}</h2>
        <div className="mb-4">
          <ServingScaler servings={servings} onChange={setServings} />
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {recipe.ingredients.map((i) => (
            <li key={i.name} className="flex justify-between gap-3">
              <span>{i.name}</span>
              <span className="text-muted-foreground">
                {scaleQuantity(i.quantity, factor, lang)}
              </span>
            </li>
          ))}
        </ul>
      </NeuCard>

      <HouseholdPortionSync onApply={setServings} />


      {recipe.missing.length > 0 && (
        <NeuCard className="mt-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <ShoppingBasket className="h-4 w-4 text-accent" /> {t("missing")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {recipe.missing.map((m) => (
              <li key={m.name} className="flex justify-between gap-3">
                <span>{m.name}</span>
                <span className="text-xs text-muted-foreground">{m.aisle}</span>
              </li>
            ))}
          </ul>
          <NearbyMarketFinder
            ingredients={recipe.missing.map((m) => m.name)}
            className="mt-4 w-full py-3"
          />
        </NeuCard>
      )}

      <AisleRoute missing={recipe.missing} />

      <NeuCard className="mt-4">
        <h2 className="mb-1 text-sm font-bold">{t("flavor")}</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="var(--muted-foreground)" opacity={0.3} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Radar
                dataKey="value"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      <NeuCard className="mt-4">
        <h2 className="mb-3 text-sm font-bold">{t("steps")}</h2>
        <ol className="flex flex-col gap-4 text-sm">
          {recipe.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="neu-raised flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-accent">
                {i + 1}
              </span>
              <span className="pt-1 leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </NeuCard>

      <VideoTutorial title={recipe.title} />

      <div className="mt-6">
        {chatOpen ? (
          <RecipeChat recipe={recipe} />
        ) : (
          <NeuButton variant="accent" size="lg" onClick={() => setChatOpen(true)}>
            <MessageCircle className="h-4 w-4" /> {t("chatBot")}
          </NeuButton>
        )}
      </div>

      <RateRefineCard recipe={recipe} />

      <div className="mt-6">
        <CookedButton />
      </div>

      <AiFeedbackButton recipeTitle={recipe.title} />

      <VoiceGuidedCooking
        recipe={recipe}
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
      />
    </div>
  );
}
