/** Tiny haptics helper — no-ops silently on devices without a vibrator. */
type Pattern = "tap" | "select" | "success" | "warn";

const patterns: Record<Pattern, number | number[]> = {
  tap: 10,
  select: 18,
  success: [14, 40, 24],
  warn: [30, 60, 30],
};

export function haptic(pattern: Pattern = "tap") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    /* ignore */
  }
}
