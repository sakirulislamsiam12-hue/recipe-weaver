import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { haptic } from "@/lib/haptics";

/** 14. Elastic swipe-to-dismiss with bounce-back for pantry items. */
export function SwipeToDismiss({
  onDismiss,
  children,
}: {
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const [armed, setArmed] = useState(false);
  const opacity = useTransform(x, [-220, -60, 0], [0.25, 1, 1]);
  const trashOpacity = useTransform(x, [-140, -40, 0], [1, 0.35, 0]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-5">
        <motion.span style={{ opacity: trashOpacity }} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </motion.span>
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.45}
        style={{ x, opacity }}
        onDrag={(_, info) => {
          const next = info.offset.x < -95;
          if (next !== armed) {
            setArmed(next);
            if (next) haptic("select");
          }
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -95 || info.velocity.x < -600) {
            haptic("warn");
            void animate(x, -320, { duration: 0.22, ease: "easeOut" }).finished.then(onDismiss);
          } else {
            // Bounce back with a springy overshoot.
            void animate(x, 0, { type: "spring", stiffness: 520, damping: 24 });
          }
          setArmed(false);
        }}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
