import { useEffect, useRef, useState } from "react";

/** 15. Ingredient utilization bar — eased count-up, never an instant jump. */
export function UtilizationBar({ value, label }: { value: number; label?: string }) {
  const target = Math.max(0, Math.min(100, value));
  const [shown, setShown] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const duration = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return (
    <div>
      {label && (
        <p className="mb-1.5 text-xs text-muted-foreground">
          {label} {Math.round(shown)}%
        </p>
      )}
      <div className="neu-inset h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${shown}%` }}
          role="progressbar"
          aria-valuenow={Math.round(shown)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
