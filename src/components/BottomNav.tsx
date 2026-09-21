import { Link, useRouterState } from "@tanstack/react-router";

import { NAV_ITEMS } from "@/lib/nav";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * Mobile-only fixed bottom navigation bar.
 * Solid background, 1px top border, no shadow or blur.
 */
export function BottomNav() {
  const { bi: lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid h-full grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to} className="min-w-0">
              <Link
                to={item.to}
                onClick={() => haptic("tap")}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-1 active:opacity-80",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate px-1 text-[11px] font-medium">
                  {lang === "bn" ? item.bn : item.en}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
