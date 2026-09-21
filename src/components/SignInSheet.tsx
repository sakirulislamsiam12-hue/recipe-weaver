import { useState } from "react";
import { Loader2, LogIn, LogOut, Mail, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { BottomSheet } from "./BottomSheet";
import { NeuButton, NeuInput } from "./neu";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { signInWithGoogle } from "@/lib/auth";

function GoogleMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.18 15.23 0 12 0A12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

function GoogleSignInButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        haptic("tap");
        await signInWithGoogle();
        setBusy(false);
      }}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-accent disabled:opacity-60"
      style={{ height: 48, borderRadius: 8, borderWidth: 1 }}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
      </span>
      <span className="flex-1 text-center">{label}</span>
      <span className="h-6 w-6 shrink-0" aria-hidden="true" />
    </button>
  );
}

const GUEST_MODE_KEY = "sp-guest-mode";

export function isGuestModeActive() {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(GUEST_MODE_KEY) === "true";
}

export function setGuestModeActive(active: boolean) {
  if (typeof localStorage === "undefined") return;
  if (active) localStorage.setItem(GUEST_MODE_KEY, "true");
  else localStorage.removeItem(GUEST_MODE_KEY);
}

/**
 * Minimal sign-in sheet — only needed to publish/rate community recipes.
 * Everything else in the app keeps working in guest mode.
 */
export function SignInSheet({
  open,
  onClose,
  email,
}: {
  open: boolean;
  onClose: () => void;
  email?: string | null;
}) {
  const { bi: lang } = useLang();
  const [mailInput, setMailInput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const run = async (kind: "in" | "up") => {
    if (busy || !mailInput.trim() || password.length < 6) return;
    setBusy(true);
    setNote("");
    const creds = { email: mailInput.trim(), password };
    const { error } =
      kind === "in"
        ? await supabase.auth.signInWithPassword(creds)
        : await supabase.auth.signUp({
            ...creds,
            options: { emailRedirectTo: window.location.origin },
          });
    setBusy(false);
    if (error) {
      haptic("warn");
      setNote(error.message);
      return;
    }
    haptic("success");
    setPassword("");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={lang === "bn" ? "সাইন ইন" : "Sign in"}>
      {email ? (
        <div>
          <p className="mb-4 text-sm">
            {lang === "bn" ? "সাইন ইন করা আছে:" : "Signed in as"} <b>{email}</b>
          </p>
          <NeuButton
            size="lg"
            onClick={async () => {
              await supabase.auth.signOut();
              haptic("tap");
              onClose();
            }}
          >
            <LogOut className="h-4 w-4" />
            {lang === "bn" ? "সাইন আউট" : "Sign out"}
          </NeuButton>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            {lang === "bn"
              ? "রেসিপি পাবলিশ বা রেটিং দিতে চাইলেই সাইন ইন দরকার — বাকি সব গেস্ট মোডেই চলবে।"
              : "Sign in only to publish or rate community recipes — everything else works in guest mode."}
          </p>

          <GoogleSignInButton
            label={lang === "bn" ? "Google দিয়ে চালিয়ে যান" : "Continue with Google"}
          />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              {lang === "bn" ? "অথবা" : "or"}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <NeuInput
            value={mailInput}
            onChange={(e) => setMailInput(e.target.value)}
            placeholder={lang === "bn" ? "ইমেইল" : "Email"}
            inputMode="email"
            autoComplete="email"
          />
          <NeuInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder={lang === "bn" ? "পাসওয়ার্ড (৬+ অক্ষর)" : "Password (6+ characters)"}
            autoComplete="current-password"
          />
          {note && <p className="text-xs text-destructive">{note}</p>}
          <div className="flex gap-2">
            <NeuButton
              variant="accent"
              className="flex-1"
              onClick={() => run("in")}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {lang === "bn" ? "সাইন ইন" : "Sign in"}
            </NeuButton>
            <NeuButton className="flex-1" onClick={() => run("up")} disabled={busy}>
              <Mail className="h-4 w-4" />
              {lang === "bn" ? "অ্যাকাউন্ট খুলুন" : "Sign up"}
            </NeuButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

/**
 * Full-screen guest-mode modal: appears at eye level, no scrolling, no dark blur.
 * User must choose to continue as guest or close and sign in later.
 */
export function GuestModeModal({
  open,
  onClose,
  onConfirmGuest,
  onSignIn,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmGuest?: () => void;
  onSignIn?: () => void;
}) {
  const { bi: lang } = useLang();
  const navigate = useNavigate();

  if (!open) return null;

  const close = () => {
    haptic("tap");
    onClose();
  };

  const continueAsGuest = () => {
    haptic("success");
    setGuestModeActive(true);
    onConfirmGuest?.();
    onClose();
    navigate({ to: "/" });
  };

  const signIn = () => {
    haptic("tap");
    onClose();
    onSignIn?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/10 p-4">
      <div className="guest-modal-up w-[90%] max-w-md rounded-xl border border-border bg-background p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">{lang === "bn" ? "অতিথি মোড" : "Guest mode"}</h2>
          <button
            onClick={close}
            aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-foreground">
          {lang === "bn"
            ? "গেস্ট মোড-এ আপনি সব ফিচার ব্যবহার করতে পারবেন, কিন্তু ডেটা সংরক্ষিত থাকবে না।"
            : "You can use every feature in guest mode, but your data will not be saved."}
        </p>

        <div className="flex flex-col gap-3">
          <NeuButton variant="accent" size="lg" className="w-full" onClick={signIn}>
            <LogIn className="h-4 w-4" />
            {lang === "bn" ? "সাইন ইন করুন" : "Sign in"}
          </NeuButton>
          <NeuButton variant="default" size="lg" className="w-full" onClick={continueAsGuest}>
            {lang === "bn" ? "চালিয়ে যান (অতিথি মোড)" : "Continue (guest mode)"}
          </NeuButton>
        </div>
      </div>
    </div>
  );
}
