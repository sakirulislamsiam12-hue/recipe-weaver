import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Check, Globe, Search, X } from "lucide-react";

import { NeuButton } from "@/components/neu";
import { useLang } from "@/lib/i18n";
import {
  LANGUAGES_ALPHABETICAL,
  REGION_ORDER,
  REGION_LABELS,
  SUPPORTED_LANGUAGES,
  searchLanguages,
  type LanguageCode,
  type Region,
} from "@/lib/i18n-50-languages";
import { cn } from "@/lib/utils";

/** How many rows are revealed per incremental paint pass. */
const PAGE = 24;

type Props = {
  open: boolean;
  onClose: () => void;
  /** First launch hides the close affordance — a language must be chosen. */
  forced?: boolean;
};

export function LanguagePickerExpanded({ open, onClose, forced = false }: Props) {
  const { lang, setLang, t, bi } = useLang();
  const [draft, setDraft] = useState<LanguageCode>(lang);
  const [query, setQuery] = useState("");
  const [grouped, setGrouped] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const searchRef = useRef<HTMLInputElement>(null);

  // Trie search is cheap, but deferring keeps typing smooth on long lists.
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => searchLanguages(deferredQuery), [deferredQuery]);

  useEffect(() => {
    if (!open) return;
    setDraft(lang);
    setQuery("");
    setLimit(PAGE);
  }, [open, lang]);

  // Reveal rows incrementally so the first paint stays instant.
  useEffect(() => {
    setLimit(PAGE);
  }, [deferredQuery, grouped]);

  useEffect(() => {
    if (!open || limit >= results.length) return;
    const id = requestAnimationFrame(() => setLimit((l) => l + PAGE));
    return () => cancelAnimationFrame(id);
  }, [open, limit, results.length]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !forced) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, forced, onClose]);

  if (!open) return null;

  const visible = results.slice(0, limit);
  const byRegion = REGION_ORDER.map((region) => ({
    region,
    codes: visible.filter((c) => SUPPORTED_LANGUAGES[c].region === region),
  })).filter((g) => g.codes.length > 0);

  const confirm = () => {
    setLang(draft);
    onClose();
  };

  /** Tapping a language applies it right away — no second confirm tap. */
  const pick = (code: LanguageCode) => {
    setDraft(code);
    setLang(code);
    window.setTimeout(() => onClose(), 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("selectLanguage")}
      className="fixed inset-0 z-[100] flex flex-col bg-background"
    >
      {/* Header */}
      <header className="border-b border-border px-5 pb-3 pt-5">
        <div className="mx-auto flex w-full max-w-xl items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Globe className="h-4 w-4 text-primary" />
              ভাষা নির্বাচন করুন
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Select Your Language</p>
          </div>
          {!forced && (
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="rounded-lg border border-border bg-card p-2 text-muted-foreground active:opacity-80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mx-auto mt-3 w-full max-w-xl">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchLanguage")}
              aria-label={t("searchLanguage")}
              autoComplete="off"
              className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label={t("cancel")}
                className="text-muted-foreground active:opacity-70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setGrouped(false)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                !grouped
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {t("allLanguages")}
            </button>
            <button
              onClick={() => setGrouped(true)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                grouped
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {t("groupByRegion")}
            </button>
          </div>
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <div className="mx-auto w-full max-w-xl">
          {results.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>
          ) : grouped ? (
            byRegion.map(({ region, codes }) => (
              <section key={region} className="mb-4">
                <h3 className="sticky top-0 bg-background py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {REGION_LABELS[region as Region][bi]}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {codes.map((code) => (
                    <LanguageRow
                      key={code}
                      code={code}
                      selected={draft === code}
                      onSelect={() => pick(code)}
                    />
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <ul className="flex flex-col gap-1.5">
              {visible.map((code) => (
                <LanguageRow
                  key={code}
                  code={code}
                  selected={draft === code}
                  onSelect={() => pick(code)}
                />
              ))}
            </ul>
          )}

          {limit < results.length && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              {visible.length} / {results.length}
            </p>
          )}
        </div>
      </div>

      {/* Confirm */}
      <footer className="border-t border-border px-5 pb-6 pt-3">
        <div className="mx-auto w-full max-w-xl">
          <NeuButton variant="accent" size="lg" onClick={confirm}>
            নির্বাচন সম্পন্ন · {SUPPORTED_LANGUAGES[draft].nativeName}
          </NeuButton>
        </div>
      </footer>
    </div>
  );
}

function LanguageRow({
  code,
  selected,
  onSelect,
}: {
  code: LanguageCode;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = SUPPORTED_LANGUAGES[code];
  return (
    <li>
      <button
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150",
          selected
            ? "border-primary bg-primary/10"
            : "border-border bg-card active:opacity-80",
        )}
      >
        <span className="min-w-0">
          <span
            dir={meta.rtl ? "rtl" : "ltr"}
            className={cn(
              "block truncate text-sm font-medium",
              selected ? "text-primary" : "text-foreground",
            )}
          >
            {meta.nativeName}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{meta.englishName}</span>
        </span>
        {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
      </button>
    </li>
  );
}

/** Sorted list export kept next to the picker for tests/debug tooling. */
export const ALPHABETICAL_LANGUAGE_CODES = LANGUAGES_ALPHABETICAL;
