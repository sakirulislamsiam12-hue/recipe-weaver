import { lazy, Suspense } from "react";
import { ChefHat } from "lucide-react";

import animation from "./onboarding-lottie.json";

const Lottie = lazy(async () => ({ default: (await import("lottie-react")).Lottie }));

/** 6. Lottie animated illustration for the onboarding steps. */
export function OnboardingLottie({ icon }: { icon?: React.ReactNode }) {
  return (
    <div className="relative mx-auto mb-4 flex h-32 w-32 items-center justify-center">
      <Suspense fallback={<div className="h-32 w-32" />}>
        <Lottie src={animation} loop autoplay className="h-32 w-32" />
      </Suspense>
      <span className="absolute flex h-12 w-12 items-center justify-center rounded-lg text-accent">
        {icon ?? <ChefHat className="h-7 w-7" />}
      </span>
    </div>
  );
}
