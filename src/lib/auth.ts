import { toast } from "sonner";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

function showToast(message: string, kind: "error" | "success" = "error") {
  if (kind === "success") toast.success(message);
  else toast.error(message);
}

/**
 * Start the managed Google OAuth flow.
 * Desktop preview uses a popup, mobile falls back to a full-page redirect.
 * Both land back on /auth/callback where the session is verified.
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
      extraParams: { prompt: "select_account" },
    });

    if (result.error) {
      const raw = String(
        (result.error as { message?: string })?.message ?? result.error,
      ).toLowerCase();
      if (raw.includes("popup")) showToast("পপআপ ব্লক করা আছে");
      else if (raw.includes("network") || raw.includes("fetch"))
        showToast("ইন্টারনেট সংযোগ দরকার");
      else if (raw.includes("no account") || raw.includes("account_not_found"))
        showToast("কোন Google অ্যাকাউন্ট খুঁজে পাওয়া যায়নি");
      else showToast("Google সাইন ইন ব্যর্থ। আবার চেষ্টা করুন।");
      return;
    }

    // Full-page redirect flow — the browser is leaving this page.
    if (result.redirected) return;

    // Popup flow: session is already set, finish here.
    await ensureProfile();
    showToast("স্বাগতম!", "success");
    window.location.assign("/");
  } catch (err) {
    const raw = String((err as Error)?.message ?? err).toLowerCase();
    if (!navigator.onLine || raw.includes("network") || raw.includes("fetch")) {
      showToast("ইন্টারনেট সংযোগ দরকার");
      return;
    }
    if (raw.includes("popup")) {
      showToast("পপআপ ব্লক করা আছে");
      return;
    }
    showToast("Google সাইন ইন ব্যর্থ। আবার চেষ্টা করুন।");
  }
}

/** Verify the session and make sure a profile row exists for the signed-in user. */
export async function ensureProfile(): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;

  const user = data.user;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName: string | null =
    (meta['full_name'] as string) ||
    (meta['name'] as string) ||
    (user.email ? (user.email.split("@")[0] ?? null) : null);

  await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });

  return true;
}
