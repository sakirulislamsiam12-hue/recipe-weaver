import { useMemo, useRef, useState } from "react";
import { ClipboardPaste, Plus, X } from "lucide-react";

import { NeuButton, NeuInput } from "./neu";
import { useLang } from "@/lib/i18n";
import { groupByCategory, parseBulk, searchIngredients } from "@/lib/search";
import { label, lookupIngredient, type Category } from "@/lib/pantry-data";

const categoryLabels: Record<Category, { bn: string; en: string }> = {
  vegetable: { bn: "সবজি", en: "Vegetables" },
  fruit: { bn: "ফল", en: "Fruit" },
  protein: { bn: "প্রোটিন", en: "Protein" },
  dairy: { bn: "দুগ্ধ", en: "Dairy" },
  grain: { bn: "চাল-ডাল", en: "Grains & pulses" },
  spice: { bn: "মসলা", en: "Spices" },
  condiment: { bn: "সস ও অন্যান্য", en: "Condiments" },
  herb: { bn: "পাতা", en: "Herbs" },
  other: { bn: "অন্যান্য", en: "Other" },
};

export function IngredientInput({
  items,
  onAdd,
  onAddMany,
  onRemove,
}: {
  items: string[];
  onAdd: (name: string) => void;
  onAddMany: (names: string[]) => void;
  onRemove: (name: string) => void;
}) {
  const { bi: lang } = useLang();
  const [draft, setDraft] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    if (draft.trim().length < 1) return [];
    return groupByCategory(searchIngredients(draft, 18));
  }, [draft]);

  const commit = (value: string) => {
    const parts = parseBulk(value);
    if (parts.length > 1) onAddMany(parts);
    else if (parts[0]) onAdd(parts[0]);
    setDraft("");
    inputRef.current?.focus();
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <NeuInput
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(draft);
            if (e.key === "Escape") setDraft("");
          }}
          placeholder={lang === "bn" ? "যেমন: আলু, ডিম" : "e.g. potato, egg"}
          aria-label={lang === "bn" ? "উপকরণ" : "Ingredient"}
        />
        <button
          onClick={() => commit(draft)}
          aria-label={lang === "bn" ? "যোগ করুন" : "Add"}
          className="neu-raised neu-press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {groups.length > 0 && (
        <div className="neu-inset mt-3 max-h-64 overflow-y-auto rounded-lg p-3">
          {groups.map((g) => (
            <div key={g.category} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {categoryLabels[g.category][lang]}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <button
                    key={it.en}
                    onClick={() => commit(label(it, lang))}
                    className="neu-raised neu-press rounded-xl bg-background px-3 py-1.5 text-xs"
                  >
                    {label(it, lang)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((i) => {
            const known = lookupIngredient(i);
            return (
              <span
                key={i}
                className="neu-inset pop-in flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
              >
                {i}
                {known?.staple && <span className="text-[9px] text-muted-foreground">•</span>}
                <button onClick={() => onRemove(i)} aria-label={`remove ${i}`}>
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-3">
        <NeuButton size="sm" variant="ghost" onClick={() => setBulkOpen((v) => !v)}>
          <ClipboardPaste className="h-3.5 w-3.5" />
          {lang === "bn" ? "একসাথে অনেক লিখুন" : "Paste a whole list"}
        </NeuButton>
      </div>

      {bulkOpen && (
        <div className="mt-2">
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={4}
            placeholder={
              lang === "bn" ? "আলু, ডিম, পেঁয়াজ, টমেটো…" : "potato, egg, onion, tomato…"
            }
            className="neu-inset w-full rounded-lg bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <NeuButton
            size="sm"
            className="mt-2"
            onClick={() => {
              const parsed = parseBulk(bulk);
              if (parsed.length) onAddMany(parsed);
              setBulk("");
              setBulkOpen(false);
            }}
          >
            {lang === "bn" ? "সব যোগ করুন" : "Add all"}
          </NeuButton>
        </div>
      )}
    </div>
  );
}
