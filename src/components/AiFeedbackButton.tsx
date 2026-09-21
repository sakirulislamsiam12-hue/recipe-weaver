import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useLang } from "@/lib/i18n";
import { reportContent } from "@/lib/moderation.functions";

/**
 * Lets anyone flag an AI-generated recipe that is offensive, wrong or unsafe.
 * Google Play's Generative AI policy requires an in-app reporting path for
 * AI output.
 */
export function AiFeedbackButton({ recipeTitle }: { recipeTitle: string }) {
  const { lang } = useLang();
  const bn = lang === "bn";
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await reportContent({
        data: {
          content_type: "ai_output",
          content_id: crypto.randomUUID(),
          reason: "unsafe_food",
          details: `${recipeTitle} — ${details}`.slice(0, 500),
        },
      });
      toast.success(
        bn ? "ধন্যবাদ, রিপোর্ট পাঠানো হয়েছে।" : "Thanks — your report has been sent.",
      );
      setDetails("");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : bn
            ? "রিপোর্ট পাঠানো যায়নি।"
            : "Could not send the report.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 text-center">
      <p className="text-[11px] text-muted-foreground">
        {bn
          ? "এই রেসিপিটি AI দিয়ে তৈরি — রান্নার আগে উপকরণ ও অ্যালার্জি নিজে যাচাই করে নিন।"
          : "This recipe is AI-generated — please check ingredients and allergies yourself before cooking."}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground underline"
      >
        <Flag className="h-3 w-3" />
        {bn ? "সমস্যা রিপোর্ট করুন" : "Report a problem"}
      </button>

      {open && (
        <div className="mx-auto mt-3 max-w-sm rounded-lg border border-border bg-card p-3 text-left">
          <label className="text-xs font-semibold" htmlFor="ai-report-details">
            {bn ? "কী সমস্যা হয়েছে?" : "What is wrong with it?"}
          </label>
          <textarea
            id="ai-report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={400}
            className="mt-1.5 w-full rounded-md border border-border bg-background p-2 text-sm"
            placeholder={
              bn ? "যেমন: অনিরাপদ পরামর্শ, আপত্তিকর লেখা…" : "e.g. unsafe advice, offensive text…"
            }
          />
          <button
            type="button"
            disabled={busy || details.trim().length === 0}
            onClick={() => void send()}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {bn ? "পাঠান" : "Send report"}
          </button>
        </div>
      )}
    </div>
  );
}
