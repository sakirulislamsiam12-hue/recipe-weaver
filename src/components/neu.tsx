import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, Ref } from "react";

/** Flat card: 1px border, no shadow. */
export function NeuCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-4", className)}
      {...props}
    />
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function NeuButton({
  className,
  variant = "default",
  size = "md",
  ...props
}: BtnProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium transition-opacity duration-150 active:opacity-80 disabled:opacity-60",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "w-full px-6 py-3 text-sm",
        variant === "default" && "border border-border bg-card text-foreground",
        variant === "accent" && "bg-primary text-primary-foreground",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function NeuChip({
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Bottom-border-only input. */
export function NeuInput({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full border-0 border-b border-border bg-transparent px-1 py-2 text-sm text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
