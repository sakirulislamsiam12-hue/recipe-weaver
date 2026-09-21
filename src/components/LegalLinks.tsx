import { Link } from "@tanstack/react-router";
import { FileText, Shield, Trash2 } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Privacy policy + terms links, reachable from anywhere in the app. */
export function LegalLinks({ className }: { className?: string }) {
  const { lang } = useLang();
  const bn = lang === "bn";

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 text-xs", className)}>
      <Link to="/privacy" className="inline-flex items-center gap-1.5 text-muted-foreground underline">
        <Shield className="h-3.5 w-3.5" />
        {bn ? "প্রাইভেসি পলিসি" : "Privacy Policy"}
      </Link>
      <Link to="/terms" className="inline-flex items-center gap-1.5 text-muted-foreground underline">
        <FileText className="h-3.5 w-3.5" />
        {bn ? "ব্যবহারের শর্তাবলী" : "Terms of Use"}
      </Link>
      <Link
        to="/delete-account"
        className="inline-flex items-center gap-1.5 text-muted-foreground underline"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {bn ? "অ্যাকাউন্ট মুছুন" : "Delete account"}
      </Link>
    </div>
  );
}
