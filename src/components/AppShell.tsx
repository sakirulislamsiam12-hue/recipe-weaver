import { Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar, DesktopTopBar } from "@/components/DesktopNav";
import { AmbientBackground } from "@/components/polish/AmbientBackground";
import { Onboarding } from "@/components/Onboarding";
import { RecipeDetail } from "@/components/RecipeDetail";
import { SignInSheet, GuestModeModal } from "@/components/SignInSheet";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LanguagePickerExpanded } from "@/components/LanguagePickerExpanded";
import { useApp } from "@/lib/app-state";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Shared chrome: desktop sidebar + top navbar, mobile bottom nav. */
export function AppShell() {
  const { lang, ready: langReady, needsLanguageChoice } = useLang();
  const [collapsed, setCollapsed] = useState(false);
  const {
    ready,
    prefs,
    finishOnboarding,
    active,
    setActive,
    items,
    pushRecipe,
    session,
    signInOpen,
    setSignInOpen,
    guestModeOpen,
    setGuestModeOpen,
    setGuestMode,
  } = useApp();

  if (!ready) return <div className="min-h-screen bg-background" />;

  // First launch: no stored choice yet — force the picker before anything else.
  if (langReady && needsLanguageChoice) {
    return (
      <div className="min-h-screen bg-background">
        {/* Confirming inside the picker stores the choice and clears this gate. */}
        <LanguagePickerExpanded open forced onClose={() => {}} />
      </div>
    );
  }

  if (!prefs.onboarded) {
    return (
      <div key={lang} className="text-crossfade min-h-screen bg-background">
        <AmbientBackground />
        <LanguageToggle />
        <Onboarding onDone={finishOnboarding} />
      </div>
    );
  }

  if (active) {
    return (
      <div key={lang} className="text-crossfade min-h-screen bg-background">
        <AmbientBackground />
        <RecipeDetail
          recipe={active}
          onBack={() => setActive(null)}
          pantry={items}
          onRecipe={(r) => {
            pushRecipe(r);
            setActive(r);
          }}
        />
      </div>
    );
  }

  return (
    <div key={lang} className="relative min-h-screen bg-background">
      <AmbientBackground />
      <div className="text-crossfade">
        <LanguageToggle />
        <DesktopSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div
          className={cn(
            "transition-[padding] duration-300 ease-out",
            collapsed ? "md:pl-[76px]" : "md:pl-[250px]",
          )}
        >
          <DesktopTopBar />
          <main className="mx-auto w-full max-w-md px-5 pb-24 pt-20 md:max-w-3xl md:pb-10 md:pt-8">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
      <SignInSheet
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        email={session?.email ?? null}
      />
      <GuestModeModal
        open={guestModeOpen}
        onClose={() => setGuestModeOpen(false)}
        onConfirmGuest={() => setGuestMode(true)}
        onSignIn={() => setSignInOpen(true)}
      />
    </div>
  );
}
