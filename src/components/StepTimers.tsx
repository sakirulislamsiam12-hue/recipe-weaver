import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { beep, formatClock, stepDurationSeconds } from "@/lib/timers";
import { ProgressRing } from "./polish/ProgressRing";

/** 15. Tappable inline timer for a single cooking step. */
export function StepTimer({ step }: { step: string }) {
  const { t } = useLang();
  const total = stepDurationSeconds(step);
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setDone(true);
          beep();
          haptic("success");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running]);

  if (total === 0) return null;

  const reset = () => {
    setRunning(false);
    setDone(false);
    setLeft(total);
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        onClick={() => {
          haptic("tap");
          done ? reset() : setRunning((r) => !r);
        }}
        className={`neu-raised neu-press neu-depth flex items-center gap-1.5 rounded-lg py-1.5 pl-1.5 pr-3 text-[11px] font-semibold ${
          done ? "text-destructive" : running ? "text-accent" : ""
        }`}
      >
        <ProgressRing progress={total ? (total - left) / total : 0}>
          {done ? (
            <RotateCcw className="h-3 w-3" />
          ) : running ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </ProgressRing>
        {done ? t("timerDone") : formatClock(left)}
      </button>
      {!running && !done && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Timer className="h-3 w-3" /> {t("startTimer")}
        </span>
      )}
    </div>
  );
}
