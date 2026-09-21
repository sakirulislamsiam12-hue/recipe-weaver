import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Standalone shell for the legal pages (privacy policy, terms).
 * Rendered outside the normal app chrome so the pages stay reachable
 * without onboarding, language choice or sign-in — a Play Store
 * requirement for the privacy policy URL.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground active:opacity-80"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">{title}</h1>
            <p className="text-[11px] text-muted-foreground">{updated}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-16 text-sm leading-relaxed">
        {children}
      </main>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-sm font-bold">{heading}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}
