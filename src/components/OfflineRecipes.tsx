import { useEffect, useState } from "react";
import { CloudOff, Trash2, WifiOff, Wifi, Download } from "lucide-react";

import { NeuButton, NeuCard } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import {
  cacheOffline,
  isCachedOffline,
  loadOffline,
  removeOffline,
  type CachedRecipe,
} from "@/lib/premium-store";
import type { Recipe } from "@/lib/recipe-schema";

/** Locale-independent date label so SSR and client markup always match. */
function formatSavedAt(savedAt: string | number) {
  const d = new Date(savedAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** 6a. Small "Save offline" button used inside recipe detail. */
export function SaveOfflineButton({ recipe }: { recipe: Recipe }) {
  const { t } = useLang();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isCachedOffline(recipe.id));
  }, [recipe.id]);

  return (
    <NeuButton
      size="sm"
      onClick={() => {
        haptic("tap");
        if (saved) {
          removeOffline(recipe.id);
          setSaved(false);
        } else {
          cacheOffline(recipe);
          setSaved(true);
        }
      }}
      className={saved ? "text-accent" : ""}
    >
      <Download className="h-3.5 w-3.5" />
      {saved ? t("savedOffline") : t("saveOffline")}
    </NeuButton>
  );
}

/** 6b. Offline library list for the home screen. */
export function OfflineRecipes({ onOpen }: { onOpen?: (r: Recipe) => void }) {
  const { t } = useLang();
  const [list, setList] = useState<CachedRecipe[]>([]);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setList(loadOffline());
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <NeuCard className="mt-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <CloudOff className="h-4 w-4 text-accent" /> {t("offline")}
        </h2>
        <span className="neu-inset flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-muted-foreground">
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? t("online") : t("offlineNow")}
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{t("offlineHint")}</p>

      <ul className="flex flex-col gap-2">
        {list.map((c) => (
          <li key={c.recipe.id} className="flex items-center gap-2">
            <button
              onClick={() => onOpen?.(c.recipe)}
              className="neu-raised neu-press flex-1 rounded-lg px-3 py-2.5 text-left"
            >
              <span className="block text-sm font-semibold leading-snug">{c.recipe.title}</span>
              <span className="text-[11px] text-muted-foreground">
                {c.recipe.timeMinutes} {t("minutes")} ·{" "}
                {formatSavedAt(c.savedAt)}
              </span>
            </button>
            <button
              onClick={() => setList(removeOffline(c.recipe.id))}
              aria-label={`remove ${c.recipe.title}`}
              className="neu-raised neu-press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </NeuCard>
  );
}
