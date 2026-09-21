import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Barcode, Check, Loader2, Receipt, Upload } from "lucide-react";

import { BottomSheet } from "./BottomSheet";
import { NeuButton, NeuInput } from "./neu";
import { lookupBarcode, scanReceipt } from "@/lib/import.functions";
import type { ScannedItem } from "@/lib/recipe-schema";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** Barcode / receipt scanning for fast pantry entry. */
export function ReceiptScanSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: ScannedItem[]) => void;
}) {
  const { bi: lang } = useLang();
  const scan = useServerFn(scanReceipt);
  const lookup = useServerFn(lookupBarcode);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"receipt" | "barcode">("receipt");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [code, setCode] = useState("");

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(false);
    try {
      const image = await fileToDataUrl(file);
      const found = await scan({ data: { image, lang, mode } });
      setItems(found);
      setPicked(Object.fromEntries(found.map((i) => [i.name, true])));
      haptic(found.length ? "success" : "warn");
      if (!found.length) setError(true);
    } catch {
      setError(true);
      haptic("warn");
    } finally {
      setBusy(false);
    }
  };

  const runLookup = async () => {
    if (code.trim().length < 6 || busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await lookup({ data: { code: code.trim(), lang } });
      if (res.name) {
        const next = [{ name: res.name, quantity: res.quantity, expiresOn: "" }];
        setItems(next);
        setPicked({ [res.name]: true });
        haptic("success");
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    const chosen = items.filter((i) => picked[i.name]);
    if (chosen.length) onConfirm(chosen);
    setItems([]);
    setPicked({});
    setCode("");
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={lang === "bn" ? "রসিদ / বারকোড স্ক্যান" : "Receipt / barcode scan"}
    >
      <div className="mb-4 flex gap-2">
        {(["receipt", "barcode"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setItems([]);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold ${
              mode === m ? "neu-inset text-accent" : "neu-raised"
            }`}
          >
            {m === "receipt" ? <Receipt className="h-4 w-4" /> : <Barcode className="h-4 w-4" />}
            {m === "receipt"
              ? lang === "bn"
                ? "রসিদ"
                : "Receipt"
              : lang === "bn"
                ? "প্যাকেট / বারকোড"
                : "Label / barcode"}
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      <NeuButton size="lg" onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {lang === "bn" ? "ছবি তুলুন বা আপলোড করুন" : "Take a photo or upload"}
      </NeuButton>

      {mode === "barcode" && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-muted-foreground">
            {lang === "bn" ? "অথবা বারকোড নম্বর লিখুন" : "Or type the barcode number"}
          </p>
          <div className="flex items-center gap-2">
            <NeuInput
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runLookup()}
              placeholder="8901234567890"
              inputMode="numeric"
            />
            <NeuButton size="sm" onClick={runLookup} disabled={busy}>
              {lang === "bn" ? "খুঁজুন" : "Look up"}
            </NeuButton>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-xs text-destructive">
          {lang === "bn"
            ? "কিছু পড়া গেল না। আরও স্পষ্ট ছবি দিন।"
            : "Nothing readable found. Try a clearer photo."}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            {lang === "bn" ? "যা পাওয়া গেছে" : "Found items"}
          </p>
          <div className="flex flex-col gap-2">
            {items.map((i) => (
              <button
                key={i.name}
                onClick={() => setPicked((p) => ({ ...p, [i.name]: !p[i.name] }))}
                className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm ${
                  picked[i.name] ? "neu-inset text-accent" : "neu-raised"
                }`}
              >
                <span className="font-medium">{i.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {i.quantity}
                  {i.expiresOn && <span>· {i.expiresOn}</span>}
                  {picked[i.name] && <Check className="h-4 w-4 text-accent" />}
                </span>
              </button>
            ))}
          </div>
          <NeuButton variant="accent" size="lg" className="mt-4" onClick={confirm}>
            <Check className="h-4 w-4" />
            {lang === "bn" ? "প্যান্ট্রিতে যোগ করুন" : "Add to pantry"}
          </NeuButton>
        </div>
      )}
    </BottomSheet>
  );
}
