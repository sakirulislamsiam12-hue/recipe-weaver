/**
 * 15. Built-in step-synced cooking timers.
 * Parses durations out of a step's text (English + Bangla numerals/words).
 */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toAscii = (t: string) => t.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  এক: 1,
  দুই: 2,
  তিন: 3,
  চার: 4,
  পাঁচ: 5,
  দশ: 10,
  পনের: 15,
  বিশ: 20,
  ত্রিশ: 30,
};

const MINUTE = /(minute|min|মিনিট)/i;
const HOUR = /(hour|hr|ঘন্টা|ঘণ্টা)/i;
const SECOND = /(second|sec|সেকেন্ড)/i;

/** Longest duration mentioned in a step, in seconds (0 = none found). */
export function stepDurationSeconds(step: string): number {
  const text = toAscii(step);
  let best = 0;
  const re = /(\d+(?:\.\d+)?)\s*(?:-|–|to|থেকে)?\s*(\d+(?:\.\d+)?)?\s*([a-zA-Zঅ-হ]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const unit = m[3] ?? "";
    const n = Number(m[2] ?? m[1]);
    if (!Number.isFinite(n) || n <= 0) continue;
    let secs = 0;
    if (HOUR.test(unit)) secs = n * 3600;
    else if (MINUTE.test(unit)) secs = n * 60;
    else if (SECOND.test(unit)) secs = n;
    if (secs > best) best = secs;
  }
  if (best === 0) {
    for (const [word, n] of Object.entries(WORD_NUMBERS)) {
      const wre = new RegExp(`${word}\\s+([a-zA-Zঅ-হ]+)`, "i");
      const hit = wre.exec(text);
      const unit = hit?.[1] ?? "";
      if (!hit) continue;
      if (HOUR.test(unit)) best = Math.max(best, n * 3600);
      else if (MINUTE.test(unit)) best = Math.max(best, n * 60);
      else if (SECOND.test(unit)) best = Math.max(best, n);
    }
  }
  return Math.min(best, 4 * 3600);
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** Short beep so the timer is noticeable with hands busy. */
export function beep() {
  if (typeof window === "undefined") return;
  const Ctx =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
    setTimeout(() => void ctx.close(), 1400);
  } catch {
    /* ignore */
  }
}
