import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BottomSheet } from "./BottomSheet";
import { NeuButton } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

const ITEM_H = 44;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function Wheel({
  values,
  value,
  onChange,
  format,
  label,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to the selected value when the sheet opens / value changes externally.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, values.indexOf(value));
    el.scrollTo({ top: idx * ITEM_H });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const snap = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.min(values.length - 1, Math.max(0, idx));
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    const picked = values[clamped];
    if (picked !== undefined && picked !== value) {
      haptic("select");
      onChange(picked);
    }
  };

  return (
    <div className="relative flex-1">
      <p className="mb-1 text-center text-[11px] font-semibold text-muted-foreground">{label}</p>
      <div className="relative h-[220px] overflow-hidden">
        {/* terracotta center band */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1 right-1 top-1/2 -translate-y-1/2 rounded-xl bg-accent/10 ring-1 ring-accent/30"
          style={{ height: ITEM_H }}
        />
        <div
          ref={ref}
          onScroll={() => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(snap, 90);
          }}
          className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingTop: (220 - ITEM_H) / 2, paddingBottom: (220 - ITEM_H) / 2 }}
        >
          {values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                onChange(v);
                ref.current?.scrollTo({ top: values.indexOf(v) * ITEM_H, behavior: "smooth" });
              }}
              className={`flex w-full snap-center items-center justify-center font-bold tabular-nums transition-colors ${
                v === value ? "text-accent" : "text-muted-foreground"
              }`}
              style={{ height: ITEM_H, fontSize: v === value ? 22 : 16 }}
            >
              {format(v)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Neumorphic hour/minute bottom-sheet picker. Hour 00–23, minutes 00/15/30/45. */
export function NeumorphicTimePicker({
  open,
  hour,
  minute,
  onConfirm,
  onClose,
}: {
  open: boolean;
  hour: number;
  minute: number;
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);

  useEffect(() => {
    if (open) {
      setH(hour);
      setM(minute);
    }
  }, [open, hour, minute]);

  const pad = (n: number) => String(n).padStart(2, "0");

  const confirm = () => {
    haptic("tap");
    onConfirm(h, m);
    onClose();
    toast.success(
      lang === "bn" ? `সময় সেট হয়েছে: ${pad(h)}:${pad(m)}` : `Time set: ${pad(h)}:${pad(m)}`,
    );
  };

  return (
    <BottomSheet open={open} title={lang === "bn" ? "সময় বেছে নিন" : "Pick a time"} onClose={onClose}>
      <div className="flex gap-3">
        <Wheel values={HOURS} value={h} onChange={setH} format={pad} label={lang === "bn" ? "ঘণ্টা" : "Hour"} />
        <Wheel values={MINUTES} value={m} onChange={setM} format={pad} label={lang === "bn" ? "মিনিট" : "Minute"} />
      </div>
      <NeuButton variant="accent" className="mt-4 w-full" onClick={confirm}>
        {t("confirmSelection")}
      </NeuButton>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full text-center text-sm font-semibold text-muted-foreground"
      >
        {t("cancel")}
      </button>
    </BottomSheet>
  );
}
