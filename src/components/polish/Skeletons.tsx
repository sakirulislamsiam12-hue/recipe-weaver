import { cn } from "@/lib/utils";

/** 2. Shimmer skeleton primitives — no blank screens anywhere in the flow. */
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("neu-inset shimmer rounded-lg bg-background", className)}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="neu-raised rounded-lg bg-background p-5">
      <SkeletonBlock className="h-4 w-3/5" />
      <SkeletonBlock className="mt-2.5 h-3 w-4/5" />
      <div className="mt-4 flex gap-2">
        <SkeletonBlock className="h-7 w-24 rounded-lg" />
        <SkeletonBlock className="h-7 w-20 rounded-lg" />
      </div>
      <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
    </div>
  );
}

export function RecipeListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-7 flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return <SkeletonBlock className="h-44 w-full rounded-lg" />;
}
