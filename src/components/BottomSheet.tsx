import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/** Simple slide-up sheet: solid background, no blur, 1px border. */
export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 flex flex-col justify-end">
      <button aria-label="close" onClick={onClose} className="absolute inset-0 bg-foreground/40" />
      <div className="sheet-up relative mx-auto max-h-[88vh] w-full overflow-y-auto rounded-t-xl border-t border-border bg-background px-4 pb-8 pt-4 md:mb-6 md:max-w-2xl md:rounded-xl md:border">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="min-w-0 truncate text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
