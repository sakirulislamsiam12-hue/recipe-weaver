import { useState } from "react";
import { Globe } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n-50-languages";
import { LanguagePickerExpanded } from "./LanguagePickerExpanded";
import { ThemeToggle } from "./polish/ThemeToggle";

export function LanguageToggle() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
      {/* Theme switch lives here on mobile; the desktop top bar has its own. */}
      <span className="md:hidden">
        <ThemeToggle />
      </span>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("selectLanguage")}
        className="flex h-9 max-w-[9rem] items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground active:opacity-80"
      >
        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{SUPPORTED_LANGUAGES[lang].nativeName}</span>
      </button>
      <LanguagePickerExpanded open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
