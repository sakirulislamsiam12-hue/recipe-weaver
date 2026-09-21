import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";

import { NeuCard, NeuInput } from "@/components/neu";
import { searchIngredients } from "@/lib/search";
import {
  searchRecipeLibrary,
  type LibraryRow,
} from "@/lib/recipe-library-search.functions";
import { libraryRowToRecipe } from "@/lib/library-recipe";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/app-state";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Recipes — Smart Pantry AI" },
      {
        name: "description",
        content:
          "Search the full recipe library by name or ingredient and browse thousands of authentic Bangladeshi dishes.",
      },
      { property: "og:title", content: "Explore Recipes — Smart Pantry AI" },
      {
        property: "og:description",
        content: "Search thousands of authentic Bangladeshi recipes by name or ingredient.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExploreSection,
});

/** Chips are keyword filters applied by the database search. */
const CHIPS = [
  { id: "all", term: "", bn: "সব", en: "All" },
  { id: "veg", term: "সবজি", bn: "সবজি", en: "Veg" },
  { id: "rice", term: "ভাত", bn: "ভাত/পোলাও", en: "Rice" },
  { id: "fish", term: "মাছ", bn: "মাছ", en: "Fish" },
  { id: "chicken", term: "মুরগি", bn: "মুরগি", en: "Chicken" },
  { id: "meat", term: "গরু", bn: "গরু/খাসি", en: "Meat" },
  { id: "dessert", term: "পিঠা", bn: "পিঠা/মিষ্টি", en: "Sweet" },
] as const;

const PAGE = 30;

function ExploreSection() {
  const { bi: lang } = useLang();
  const { items, add, openRecipe } = useApp();
  const search = useServerFn(searchRecipeLibrary);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [chip, setChip] = useState<string>("all");
  const [pages, setPages] = useState(1);
  const [rows, setRows] = useState<LibraryRow[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPages(1);
    setRows([]);
  }, [debounced, chip]);

  const term = useMemo(() => {
    const chipTerm = CHIPS.find((c) => c.id === chip)?.term ?? "";
    return debounced || chipTerm;
  }, [debounced, chip]);

  const result = useQuery({
    queryKey: ["recipe-library", term, pages],
    queryFn: () =>
      search({ data: { query: term, cuisine: "bengali", offset: (pages - 1) * PAGE, limit: PAGE } }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!result.data) return;
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...result.data!.rows.filter((r) => !seen.has(r.id))];
    });
  }, [result.data]);

  const total = result.data?.total ?? 0;
  const hasMore = rows.length < total;

  const suggestions = useMemo(
    () => (query.trim().length > 0 ? searchIngredients(query, 8) : []),
    [query],
  );

  return (
    <>
      <h1 className="mb-1 text-lg font-bold">{lang === "bn" ? "খুঁজে দেখুন" : "Explore"}</h1>
      <p className="mb-4 text-xs text-muted-foreground">
        {total > 0
          ? lang === "bn"
            ? `${total.toLocaleString("bn-BD")} টি রেসিপি`
            : `${total.toLocaleString()} recipes`
          : lang === "bn"
            ? "উপাদান সার্চ করুন অথবা রেসিপি ব্রাউজ করুন"
            : "Search ingredients or browse recipes"}
      </p>

      <NeuCard>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-accent" />
          <NeuInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "bn" ? "রেসিপি বা উপাদান" : "Recipe or ingredient"}
          />
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground">
              {lang === "bn" ? "প্যান্ট্রিতে যোগ করুন" : "Add to pantry"}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const name = lang === "bn" ? s.item.bn : s.item.en;
                const already = items.includes(name);
                return (
                  <button
                    key={s.item.en}
                    onClick={() => {
                      haptic("select");
                      add(name);
                    }}
                    className={cn(
                      "neu-raised neu-press flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
                      already && "text-accent",
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => setChip(c.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200",
                chip === c.id ? "neu-inset text-accent" : "neu-raised text-muted-foreground",
              )}
            >
              {lang === "bn" ? c.bn : c.en}
            </button>
          ))}
        </div>
      </NeuCard>

      <div className="mt-5 flex flex-col gap-3 md:grid md:grid-cols-2">
        {rows.map((row) => (
          <button
            key={row.id}
            onClick={() => {
              haptic("tap");
              openRecipe(libraryRowToRecipe(row, items));
            }}
            className="text-left"
          >
            <NeuCard className="neu-depth h-full">
              <h3 className="text-sm font-bold leading-snug">{row.name}</h3>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                {row.ingredients.replace(/\s*\n\s*/g, ", ").slice(0, 140)}
              </p>
            </NeuCard>
          </button>
        ))}
      </div>

      {result.isFetching && (
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      )}

      {hasMore && !result.isFetching && (
        <button
          onClick={() => setPages((p) => p + 1)}
          className="neu-raised neu-press mt-6 w-full rounded-xl px-4 py-3 text-xs font-semibold"
        >
          {lang === "bn" ? "আরও দেখুন" : "Load more"}
        </button>
      )}

      {!result.isFetching && rows.length === 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {lang === "bn" ? "কিছু পাওয়া যায়নি" : "Nothing found"}
        </p>
      )}

      {result.isError && (
        <p className="mt-4 text-center text-xs text-destructive">
          {lang === "bn" ? "রেসিপি লোড করা যায়নি" : "Could not load recipes"}
        </p>
      )}
    </>
  );
}
