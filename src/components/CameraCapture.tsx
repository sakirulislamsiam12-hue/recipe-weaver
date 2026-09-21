import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Check, Images, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";

import { BottomSheet } from "./BottomSheet";
import { NeuButton } from "./neu";
import { detectIngredients, type DetectedItem } from "@/lib/ai.functions";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

const freshnessLabel = {
  fresh: { bn: "তাজা", en: "Fresh" },
  "use-soon": { bn: "দ্রুত ব্যবহার করুন", en: "Use soon" },
  spoiled: { bn: "নষ্ট", en: "Spoiled" },
} as const;

const freshnessTone = {
  fresh: "text-emerald-600",
  "use-soon": "text-amber-600",
  spoiled: "text-destructive",
} as const;

const angleHints = {
  bn: ["ফ্রিজের ভেতর", "তাক / শেলফ", "কাউন্টার বা ঝুড়ি"],
  en: ["Inside the fridge", "Pantry shelf", "Counter or basket"],
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** Multi-angle camera + gallery ingredient vision input with freshness detection. */
export function CameraCapture({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (names: string[]) => void;
}) {
  const { bi: lang } = useLang();
  const detect = useServerFn(detectIngredients);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError] = useState(false);
  const [shots, setShots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<DetectedItem[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamError(false);
    } catch {
      setCamError(true);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    void start();
    return stop;
  }, [open, start, stop]);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1024 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    haptic("select");
    setShots((s) => [...s, canvas.toDataURL("image/jpeg", 0.82)].slice(0, 4));
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 4)) urls.push(await fileToDataUrl(file));
    setShots((s) => [...s, ...urls].slice(0, 4));
  };

  const analyse = async () => {
    if (!shots.length || busy) return;
    setBusy(true);
    setError(false);
    try {
      const results = await Promise.all(
        shots.map((image) => detect({ data: { lang, image } }).catch(() => [] as DetectedItem[])),
      );
      const merged = new Map<string, DetectedItem>();
      for (const found of results.flat()) {
        const key = found.name.trim().toLowerCase();
        const prev = merged.get(key);
        if (!prev || found.confidence > prev.confidence) merged.set(key, found);
      }
      const list = [...merged.values()];
      if (!list.length) setError(true);
      setItems(list);
      setPicked(
        Object.fromEntries(list.map((i) => [i.name, i.freshness !== "spoiled"] as const)) as Record<
          string,
          boolean
        >,
      );
      haptic("success");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    const names = items.filter((i) => picked[i.name]).map((i) => i.name);
    if (names.length) onConfirm(names);
    setShots([]);
    setItems([]);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      title={lang === "bn" ? "ক্যামেরা দিয়ে উপকরণ যোগ করুন" : "Scan ingredients with camera"}
      onClose={onClose}
    >
      <p className="mb-3 text-xs text-muted-foreground">
        {lang === "bn"
          ? "একাধিক অ্যাঙ্গেল থেকে ছবি তুলুন — এআই উপকরণ ও সতেজতা শনাক্ত করবে।"
          : "Capture a few angles — the AI reads each ingredient and its freshness."}
      </p>

      <div className="neu-inset relative overflow-hidden rounded-lg bg-muted/40">
        {camError ? (
          <div className="flex h-52 flex-col items-center justify-center gap-2 px-6 text-center">
            <Camera className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "ক্যামেরা পাওয়া যায়নি — গ্যালারি থেকে ছবি বেছে নিন।"
                : "Camera unavailable — pick photos from your gallery instead."}
            </p>
          </div>
        ) : (
          <video ref={videoRef} playsInline muted className="h-52 w-full object-cover" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-semibold">
          {angleHints[lang][Math.min(shots.length, 2)]}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={shoot}
          disabled={camError}
          aria-label={lang === "bn" ? "ছবি তুলুন" : "Capture"}
          className="neu-raised neu-press flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-accent-foreground disabled:opacity-40"
        >
          <Camera className="h-4 w-4" />
          {lang === "bn" ? "ছবি তুলুন" : "Capture"}
        </button>
        <label className="neu-raised neu-press flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold">
          <Images className="h-4 w-4" />
          {lang === "bn" ? "গ্যালারি" : "Gallery"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void pickFiles(e.target.files)}
          />
        </label>
      </div>

      {shots.length > 0 && (
        <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {shots.map((src, i) => (
              <div key={i} className="pop-in relative shrink-0">
                <img
                  src={src}
                  alt={`shot ${i + 1}`}
                  className="neu-raised h-20 w-20 rounded-lg object-cover"
                />
                <button
                  onClick={() => setShots((s) => s.filter((_, j) => j !== i))}
                  aria-label="remove shot"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
          <NeuButton variant="accent" size="lg" className="mt-3 w-full" onClick={analyse}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy
              ? lang === "bn"
                ? "শনাক্ত করা হচ্ছে…"
                : "Detecting…"
              : lang === "bn"
                ? "উপকরণ শনাক্ত করুন"
                : "Detect ingredients"}
          </NeuButton>
        </>
      )}

      {error && (
        <p className="mt-3 text-center text-xs text-destructive">
          {lang === "bn"
            ? "কোনো উপকরণ শনাক্ত করা যায়নি। আবার চেষ্টা করুন।"
            : "No ingredients detected. Try another angle."}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">
              {lang === "bn" ? "শনাক্ত হয়েছে" : "Detected"} ({items.length})
            </h3>
            <button
              onClick={() => void analyse()}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3" /> {lang === "bn" ? "আবার" : "Redo"}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  haptic("tap");
                  setPicked((p) => ({ ...p, [item.name]: !p[item.name] }));
                }}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left ${
                  picked[item.name] ? "neu-inset" : "neu-raised"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    picked[item.name] ? "bg-accent text-accent-foreground" : "bg-muted"
                  }`}
                >
                  {picked[item.name] && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{item.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {item.quantity || "—"} · {Math.round(item.confidence * 100)}%
                  </span>
                </span>
                <span className={`text-[11px] font-semibold ${freshnessTone[item.freshness]}`}>
                  {freshnessLabel[item.freshness][lang]}
                </span>
              </button>
            ))}
          </div>
          <NeuButton variant="accent" size="lg" className="mt-4 w-full" onClick={confirm}>
            <Check className="h-4 w-4" />
            {lang === "bn" ? "প্যান্ট্রিতে যোগ করুন" : "Add to pantry"}
          </NeuButton>
        </div>
      )}
    </BottomSheet>
  );
}
