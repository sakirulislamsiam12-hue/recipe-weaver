import { UserRound } from "lucide-react";

import { useApp } from "@/lib/app-state";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

/** Guest-mode badge: makes it explicit that no account is needed. */
export function GuestBadge({ email, onSignIn }: { email?: string | null; onSignIn: () => void }) {
  const { bi: lang } = useLang();
  const { setGuestModeOpen } = useApp();
  const signedIn = Boolean(email);

  const handleClick = () => {
    haptic("tap");
    if (signedIn) {
      onSignIn();
    } else {
      setGuestModeOpen(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="neu-raised neu-press flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold"
    >
      <UserRound className="h-3.5 w-3.5 text-accent" />
      {signedIn
        ? email
        : lang === "bn"
          ? "গেস্ট মোড · অ্যাকাউন্ট লাগবে না"
          : "Guest mode · no account needed"}
    </button>
  );
}
