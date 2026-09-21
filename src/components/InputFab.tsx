import { useState } from "react";
import { Camera, Keyboard, Mic, Plus, X } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

export type InputMode = "camera" | "mic" | "text";

const order: InputMode[] = ["camera", "mic", "text"];

const icons = { camera: Camera, mic: Mic, text: Keyboard };

const labels = {
  camera: { bn: "ক্যামেরা", en: "Camera" },
  mic: { bn: "ভয়েস", en: "Voice" },
  text: { bn: "টাইপ", en: "Type" },
} as const;

/** Sticky ingredient-input FAB: one terracotta button, simple expand list. */
export function InputFab({ onPick }: { onPick: (mode: InputMode) => void }) {
  const { bi: lang } = useLang();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6">
      {expanded &&
        order.map((m) => {
          const MIcon = icons[m];
          return (
            <button
              key={m}
              onClick={() => {
                haptic("select");
                setExpanded(false);
                onPick(m);
              }}
              className="pop-in flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground active:opacity-80"
            >
              <MIcon className="h-4 w-4 text-muted-foreground" />
              {labels[m][lang]}
            </button>
          );
        })}

      <button
        onClick={() => {
          haptic("tap");
          setExpanded((e) => !e);
        }}
        aria-label={lang === "bn" ? "উপাদান যোগ করুন" : "Add ingredients"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 active:scale-95"
      >
        {expanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
