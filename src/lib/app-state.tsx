import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";

import { generateRecipes, type Recipe } from "@/lib/ai.functions";
import {
  almostReadyRecipes,
  enrichPantryWithDefaults,
  filterRecipesByAvailability,
  matchDbRecipes,
  timePrefToMinutes,
  unlockableCount,
  type Filters,
} from "@/lib/matching";
import { loadPrefs, savePrefs, type Prefs } from "@/lib/prefs";
import {
  loadPantry,
  makeItem,
  notifyExpiring,
  savePantry,
  type PantryItem,
} from "@/lib/pantry-store";
import { supabase } from "@/integrations/supabase/client";
import { toBiLang, useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

export type AlmostMatch = { recipe: Recipe; ratio: number; missing: string[] };
export type Session = { id: string; email: string | null } | null;

type TrackEntry = {
  name: string;
  quantity?: string;
  expiresOn?: string;
  source: PantryItem["source"];
};

type AppState = {
  ready: boolean;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  finishOnboarding: (p: Prefs) => void;
  items: string[];
  setItems: (next: string[]) => void;
  add: (value: string) => void;
  addMany: (values: string[]) => void;
  remove: (value: string) => void;
  pantry: PantryItem[];
  removePantryItem: (id: string) => void;
  trackItems: (entries: TrackEntry[]) => void;
  recipes: Recipe[];
  pushRecipe: (r: Recipe) => void;
  almost: AlmostMatch[];
  unlockCount: number;
  active: Recipe | null;
  setActive: (r: Recipe | null) => void;
  openRecipe: (r: Recipe) => void;
  loading: boolean;
  error: boolean;
  genMs: number | null;
  run: () => Promise<void>;
  session: Session;
  signInOpen: boolean;
  setSignInOpen: (open: boolean) => void;
  guestModeOpen: boolean;
  setGuestModeOpen: (open: boolean) => void;
  guestMode: boolean;
  setGuestMode: (active: boolean) => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  const generate = useServerFn(generateRecipes);

  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({});
  const [items, setItems] = useState<string[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [almost, setAlmost] = useState<AlmostMatch[]>([]);
  const [unlockCount, setUnlockCount] = useState(0);
  const [active, setActive] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [genMs, setGenMs] = useState<number | null>(null);
  const [session, setSession] = useState<Session>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [guestModeOpen, setGuestModeOpen] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setPantry(loadPantry());
    setReady(true);
  }, []);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive && data.session?.user) {
        setSession({ id: data.session.user.id, email: data.session.user.email ?? null });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s?.user ? { id: s.user.id, email: s.user.email ?? null } : null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const trackItems = useCallback(
    (entries: TrackEntry[]) => {
      setPantry((prev) => {
        const next = [...prev];
        for (const e of entries) {
          if (!e.name || next.some((p) => p.name === e.name)) continue;
          next.push(
            makeItem(e.name, {
              source: e.source,
              ...(e.quantity ? { quantity: e.quantity } : {}),
              ...(e.expiresOn ? { expiresOn: e.expiresOn } : {}),
            }),
          );
        }
        savePantry(next);
        notifyExpiring(next, toBiLang(lang));
        return next;
      });
    },
    [lang],
  );

  const add = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return;
      haptic("select");
      setItems((prev) => (prev.includes(v) ? prev : [...prev, v]));
      trackItems([{ name: v, source: "text" }]);
    },
    [trackItems],
  );

  const addMany = useCallback(
    (values: string[]) => {
      setItems((prev) => {
        const next = [...prev];
        for (const value of values) {
          const v = value.trim();
          if (v && !next.includes(v)) next.push(v);
        }
        return next;
      });
      trackItems(
        values.map((v) => ({ name: v.trim(), source: "camera" as const })).filter((v) => v.name),
      );
    },
    [trackItems],
  );

  const remove = useCallback((value: string) => {
    haptic("tap");
    setItems((prev) => prev.filter((x) => x !== value));
  }, []);

  const removePantryItem = useCallback((id: string) => {
    setPantry((prev) => {
      const next = prev.filter((p) => p.id !== id);
      savePantry(next);
      return next;
    });
  }, []);

  const pushRecipe = useCallback((r: Recipe) => {
    setRecipes((prev) => (prev.some((x) => x.id === r.id) ? prev : [r, ...prev]));
  }, []);

  const openRecipe = useCallback(
    (r: Recipe) => {
      pushRecipe(r);
      setActive(r);
    },
    [pushRecipe],
  );

  const finishOnboarding = useCallback((p: Prefs) => {
    savePrefs(p);
    setPrefs(p);
  }, []);

  const updatePrefs = useCallback((p: Prefs) => {
    savePrefs(p);
    setPrefs(p);
  }, []);

  const run = useCallback(async () => {
    if (items.length === 0 || loading) return;
    setLoading(true);
    setError(false);
    setGenMs(null);
    const startedAt = Date.now();

    const filters: Filters = {
      ...(prefs.spice ? { spice: prefs.spice } : {}),
      ...(prefs.diet ? { diet: prefs.diet } : {}),
      ...(prefs.country ? { country: prefs.country } : {}),
      ...(timePrefToMinutes(prefs.time) ? { maxMinutes: timePrefToMinutes(prefs.time)! } : {}),
    };
    const matchPantry = enrichPantryWithDefaults(items, prefs.country);
    const dbMatches = matchDbRecipes(matchPantry, toBiLang(lang), filters, 3).map((m) => m.recipe);

    const partition = (all: Recipe[]) => {
      const available = filterRecipesByAvailability(matchPantry, all);
      const almostReady = almostReadyRecipes(matchPantry, all).filter(
        (a) => !available.some((r) => r.id === a.recipe.id),
      );
      setRecipes(available);
      setAlmost(almostReady);
      setUnlockCount(unlockableCount(matchPantry, all));
    };

    if (dbMatches.length > 0) {
      partition(dbMatches);
      setGenMs(Date.now() - startedAt);
    }

    try {
      const res = await generate({
        data: {
          ingredients: matchPantry,
          lang,
          prefs: {
            ...(prefs.country ? { country: prefs.country } : {}),
            ...(prefs.spice ? { spice: prefs.spice } : {}),
            ...(prefs.salt ? { salt: prefs.salt } : {}),
            ...(prefs.diet ? { diet: prefs.diet } : {}),
            ...(prefs.time ? { time: prefs.time } : {}),
          },
        },
      });
      const titles = new Set(dbMatches.map((r) => r.title.trim()));
      const extra = res.filter((r) => !titles.has(r.title.trim()));
      partition([...dbMatches, ...extra]);
      setGenMs(Date.now() - startedAt);
    } catch {
      if (dbMatches.length < 2) setError(true);
    } finally {
      setLoading(false);
    }
  }, [generate, items, lang, loading, prefs]);

  const value = useMemo<AppState>(
    () => ({
      ready,
      prefs,
      setPrefs: updatePrefs,
      finishOnboarding,
      items,
      setItems,
      add,
      addMany,
      remove,
      pantry,
      removePantryItem,
      trackItems,
      recipes,
      pushRecipe,
      almost,
      unlockCount,
      active,
      setActive,
      openRecipe,
      loading,
      error,
      genMs,
      run,
      session,
      signInOpen,
      setSignInOpen,
      guestModeOpen,
      setGuestModeOpen,
      guestMode,
      setGuestMode,
    }),
    [
      ready,
      prefs,
      updatePrefs,
      finishOnboarding,
      items,
      add,
      addMany,
      remove,
      pantry,
      removePantryItem,
      trackItems,
      recipes,
      pushRecipe,
      almost,
      unlockCount,
      active,
      setActive,
      openRecipe,
      loading,
      error,
      genMs,
      run,
      session,
      signInOpen,
      guestModeOpen,
      guestMode,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}
