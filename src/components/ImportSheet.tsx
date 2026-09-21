import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link2, Loader2 } from "lucide-react";

import { BottomSheet } from "./BottomSheet";
import { NeuButton, NeuInput } from "./neu";
import { importRecipeFromUrl } from "@/lib/import.functions";
import type { Recipe } from "@/lib/ai.functions";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

/** Recipe import from any public URL — blog, Instagram/Reel, YouTube, TikTok. */
export function ImportSheet({
  open,
  onClose,
  pantry,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  pantry: string[];
  onImported: (recipe: Recipe) => void;
}) {
  const { bi: lang } = useLang();
  const run = useServerFn(importRecipeFromUrl);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!url.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const recipe = await run({ data: { url: url.trim(), lang, pantry } });
      haptic("success");
      onImported(recipe);
      setUrl("");
      onClose();
    } catch {
      haptic("warn");
      setError(
        lang === "bn"
          ? "এই লিংক থেকে রেসিপি পড়া যায়নি। অন্য একটি পাবলিক লিংক দিন।"
          : "Couldn't read a recipe from that link. Try another public link.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={lang === "bn" ? "লিংক থেকে রেসিপি" : "Import from a link"}
    >
      <p className="mb-4 text-xs text-muted-foreground">
        {lang === "bn"
          ? "ব্লগ, ইনস্টাগ্রাম রিল, ইউটিউব বা টিকটক লিংক পেস্ট করুন — আমরা সেটিকে ধাপে ধাপে রেসিপিতে সাজিয়ে দেব।"
          : "Paste a blog, Instagram Reel, YouTube or TikTok link — we'll turn it into a step-by-step recipe."}
      </p>
      <div className="flex items-center gap-2">
        <NeuInput
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder="https://instagram.com/reel/…"
          inputMode="url"
        />
      </div>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      <NeuButton variant="accent" size="lg" className="mt-5" onClick={submit} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        {busy
          ? lang === "bn"
            ? "পড়া হচ্ছে…"
            : "Reading…"
          : lang === "bn"
            ? "রেসিপি আনুন"
            : "Import recipe"}
      </NeuButton>
    </BottomSheet>
  );
}
