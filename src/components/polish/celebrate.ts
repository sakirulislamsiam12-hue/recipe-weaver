import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** 9. Confetti burst used when a recipe is marked "cooked". */
export function celebrateCooked() {
  haptic("success");
  if (reduced()) return;
  const shared = {
    spread: 78,
    startVelocity: 34,
    ticks: 160,
    zIndex: 90,
    colors: ["#e8a33d", "#f2c879", "#78c091", "#ffffff"],
    disableForReducedMotion: true,
  };
  void confetti({ ...shared, particleCount: 60, origin: { x: 0.5, y: 0.62 } });
  window.setTimeout(() => {
    void confetti({ ...shared, particleCount: 34, origin: { x: 0.3, y: 0.6 } });
    void confetti({ ...shared, particleCount: 34, origin: { x: 0.7, y: 0.6 } });
  }, 130);
}
