import { Link, useRouterState } from "@tanstack/react-router";
import { ChefHat, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { NAV_ITEMS } from "@/lib/nav";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/polish/ThemeToggle";

function useActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
}

/** Desktop-only left sidebar: 250px expanded, collapsible to an icon rail. */
export function DesktopSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { lang, t } = useLang();
  const isActive = useActive();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-sidebar transition-[width] duration-300 ease-out md:flex",
        collapsed ? "w-[76px]" : "w-[250px]",
      )}
    >
      <div className="flex h-15 items-center gap-3 px-4">
        <div className="neu-raised flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-accent">
          <ChefHat className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-bold text-sidebar-foreground">{t("appName")}</span>
        )}
      </div>

      <nav aria-label="Sidebar" className="flex flex-1 flex-col gap-2 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const activeItem = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all duration-300",
                activeItem
                  ? "neu-inset text-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="truncate">{lang === "bn" ? item.bn : item.en}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="m-3 flex items-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4" />
            <span>{lang === "bn" ? "সংকুচিত করুন" : "Collapse"}</span>
          </>
        )}
      </button>
    </aside>
  );
}

/** Desktop-only top navbar, 60px tall. */
export function DesktopTopBar() {
  const { bi: lang } = useLang();
  const isActive = useActive();
  const current = NAV_ITEMS.find((i) => isActive(i.to)) ?? NAV_ITEMS[0]!;

  return (
    <header className="sticky top-0 z-30 hidden h-15 items-center justify-between gap-4 border-b border-border bg-background px-6 md:flex">
      <h2 className="truncate text-sm font-bold">{lang === "bn" ? current.bn : current.en}</h2>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
