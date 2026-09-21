import { useState } from "react";
import { RotateCw } from "lucide-react";

import { haptic } from "@/lib/haptics";

/** 18. Card-flip reveal used for the "missing 1 ingredient" suggestion. */
export function FlipCard({
  front,
  back,
  className,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`flip-scene ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => {
          haptic("tap");
          setFlipped((f) => !f);
        }}
        aria-expanded={flipped}
        className="relative block w-full text-left"
      >
        <div
          className="flip-inner relative"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div className={`flip-face ${flipped ? "pointer-events-none" : ""}`}>{front}</div>
          <div
            className="flip-face absolute inset-0"
            style={{ transform: "rotateY(180deg)" }}
            aria-hidden={!flipped}
          >
            {back}
          </div>
        </div>
        <span className="absolute right-4 top-4 text-muted-foreground">
          <RotateCw className={`h-3.5 w-3.5 transition-transform ${flipped ? "rotate-180" : ""}`} />
        </span>
      </button>
    </div>
  );
}
