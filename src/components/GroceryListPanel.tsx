import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ShoppingCart, Trash2, Plus, RefreshCw } from "lucide-react";

import { NeuButton, NeuCard, NeuInput } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import type { Recipe } from "@/lib/recipe-schema";
import {
  loadGrocery,
  mergeGrocery,
  saveGrocery,
  type GroceryLine,
} from "@/lib/premium-store";

/**
 * 1. Smart grocery list with auto-sync.
 *
 * Additive: reads/writes only the `sp-grocery` store in premium-store.ts and
 * auto-merges the `missing` items of every generated recipe without ever
 * duplicating a line the shopper already has.
 */
export function GroceryListPanel({ recipes }: { recipes: Recipe[] }) {
  const { t, lang } = useLang();
  const [lines, setLines] = useState<GroceryLine[]>([]);
  const [draft, setDraft] = useState("");
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLines(loadGrocery());
  }, []);

  /** Auto-sync: whenever new recipes arrive, pull their missing items in. */
  useEffect(() => {
    if (recipes.length === 0) return;
    const incoming = recipes.flatMap((r) =>
      r.missing.map((m) => ({ name: m.name, aisle: m.aisle, recipe: r.title })),
    );
    if (incoming.length === 0) return;
    setLines((prev) => {
      const next = mergeGrocery(prev, incoming);
      if (next.length !== prev.length) {
        saveGrocery(next);
        setSyncedAt(new Date().toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }));
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes]);

  const commit = (next: GroceryLine[]) => {
    setLines(next);
    saveGrocery(next);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, GroceryLine[]>();
    for (const l of lines) {
      const key = l.aisle || (lang === "bn" ? "অন্যান্য" : "Other");
      map.set(key, [...(map.get(key) ?? []), l]);
    }
    return [...map.entries()];
  }, [lines, lang]);

  const pending = lines.filter((l) => !l.done).length;

  const addManual = () => {
    const name = draft.trim();
    if (!name) return;
    commit(mergeGrocery(lines, [{ name }]));
    setDraft("");
    haptic("tap");
  };

  const copyAll = async () => {
    const text = lines
      .filter((l) => !l.done)
      .map((l) => `• ${l.name}${l.quantity ? ` — ${l.quantity}` : ""}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      haptic("success");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <NeuCard className="mt-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <ShoppingCart className="h-4 w-4 text-accent" />
        {t("grocery")}
      </h2>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        {syncedAt ? `${t("grocerySynced")} · ${syncedAt}` : t("groceryAutoSync")}
      </p>

      <div className="mb-4 flex items-center gap-2">
        <NeuInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addManual()}
          placeholder={t("groceryAddHint")}
        />
        <button
          onClick={addManual}
          aria-label={t("add")}
          className="neu-raised neu-press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {lines.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">{t("groceryEmpty")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {grouped.map(([aisle, group]) => (
              <div key={aisle}>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{aisle}</p>
                <ul className="flex flex-col gap-2">
                  {group.map((l) => (
                    <li key={l.id} className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          haptic("tap");
                          commit(
                            lines.map((x) => (x.id === l.id ? { ...x, done: !x.done } : x)),
                          );
                        }}
                        aria-label={l.name}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                          l.done ? "neu-inset text-accent" : "neu-raised text-muted-foreground"
                        }`}
                      >
                        {l.done && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          l.done ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {l.name}
                        {l.quantity ? (
                          <span className="text-xs text-muted-foreground"> · {l.quantity}</span>
                        ) : null}
                        {l.recipe ? (
                          <span className="block text-[11px] text-muted-foreground">
                            {t("groceryFrom")} {l.recipe}
                          </span>
                        ) : null}
                      </span>
                      <button
                        onClick={() => commit(lines.filter((x) => x.id !== l.id))}
                        aria-label={`remove ${l.name}`}
                        className="text-muted-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {pending} {t("groceryPending")}
            </span>
            <div className="flex gap-2">
              <NeuButton size="sm" onClick={copyAll}>
                <Copy className="h-3.5 w-3.5" /> {copied ? t("copied") : t("copyList")}
              </NeuButton>
              <NeuButton size="sm" onClick={() => commit(lines.filter((l) => !l.done))}>
                <Trash2 className="h-3.5 w-3.5" /> {t("clearDone")}
              </NeuButton>
            </div>
          </div>
        </>
      )}
    </NeuCard>
  );
}
