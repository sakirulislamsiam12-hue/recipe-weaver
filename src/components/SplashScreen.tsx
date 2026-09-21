import { useEffect, useState } from "react";

import logoMark from "@/assets/logo-mark.png";

const STORAGE_KEY = "ff_splash_shown";
const DURATION_MS = 3200;
const FADE_MS = 400;

/**
 * Full-screen launch splash: logo fade/scale-in, title slide-up,
 * delayed tagline, and a 3-dot loading indicator. Shows once per
 * browser session, then fades out and unmounts.
 */
export function SplashScreen() {
  // Rendered on the server too, so the first paint is the splash and there is
  // no hydration mismatch. The effect hides it instantly when this browser
  // session already saw it.
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (window.sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(false);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    const fadeTimer = window.setTimeout(() => setLeaving(true), DURATION_MS);
    const hideTimer = window.setTimeout(
      () => setVisible(false),
      DURATION_MS + FADE_MS,
    );
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [visible]);


  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Food Fashion loading"
      className={`fixed inset-0 z-[100] flex touch-none select-none flex-col items-center justify-center bg-gradient-to-b from-primary via-primary to-[#A8461F] transition-opacity ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms`, pointerEvents: "auto" }}
    >
      <img
        src={logoMark}
        alt="Food Fashion logo"
        width={232}
        height={185}
        className="splash-logo h-28 w-auto brightness-0 invert"
      />
      <h1 className="splash-title mt-6 text-3xl font-bold tracking-tight text-white">
        Food Fashion
      </h1>
      <p className="splash-tagline mt-2 text-sm font-medium text-white/85">
        রান্নার স্মার্ট সহায়ক
      </p>

      <div className="splash-dots absolute bottom-16 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="splash-dot h-2 w-2 rounded-full bg-white"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
