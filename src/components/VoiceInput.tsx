import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Mic, MicOff } from "lucide-react";

import { BottomSheet } from "./BottomSheet";
import { NeuButton } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { parseBulk } from "@/lib/search";

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/** Bangla + English speech-to-text ingredient capture with live captions. */
export function VoiceInput({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (names: string[]) => void;
}) {
  const { bi: lang } = useLang();
  const recRef = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const rec = getRecognition();
    if (!rec) {
      setSupported(false);
      return;
    }
    rec.lang = lang === "bn" ? "bn-BD" : "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res?.[0]?.transcript ?? "";
        if (res?.isFinal) setFinalText((prev) => `${prev} ${text}`.trim());
        else live += text;
      }
      setInterim(live);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    haptic("select");
    rec.start();
  }, [lang]);

  useEffect(() => {
    if (open) {
      setFinalText("");
      setInterim("");
      setSupported(Boolean(getRecognition()));
      start();
    }
    return stop;
  }, [open, start, stop]);

  const parsed = parseBulk(`${finalText} ${interim}`.replace(/\s+/g, " ").trim());

  const confirm = () => {
    stop();
    if (parsed.length) onConfirm(parsed);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      title={lang === "bn" ? "বলে বলে উপকরণ যোগ করুন" : "Say your ingredients"}
      onClose={() => {
        stop();
        onClose();
      }}
    >
      {!supported ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          {lang === "bn"
            ? "এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়।"
            : "Voice input isn't supported in this browser."}
        </p>
      ) : (
        <>
          <div className="flex flex-col items-center py-4">
            <button
              onClick={() => (listening ? stop() : start())}
              aria-label={listening ? "stop listening" : "start listening"}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-accent text-accent-foreground ${
                listening ? "mic-pulse" : "neu-raised neu-press"
              }`}
            >
              {listening ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              {listening
                ? lang === "bn"
                  ? "শুনছি… কমা দিয়ে বলুন"
                  : "Listening… separate items with a pause"
                : lang === "bn"
                  ? "শুরু করতে ট্যাপ করুন"
                  : "Tap to start"}
            </p>
          </div>

          <div className="neu-inset min-h-16 rounded-lg px-4 py-3 text-sm">
            {finalText || interim ? (
              <p>
                {finalText} <span className="text-muted-foreground">{interim}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {lang === "bn" ? "আপনার কথা এখানে দেখাবে…" : "Your words appear here…"}
              </p>
            )}
          </div>

          {parsed.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {parsed.map((p) => (
                <span key={p} className="neu-raised pop-in rounded-lg px-3 py-2 text-xs font-medium">
                  {p}
                </span>
              ))}
            </div>
          )}

          <NeuButton
            variant="accent"
            size="lg"
            className="mt-5 w-full"
            onClick={confirm}
            disabled={parsed.length === 0}
          >
            <Check className="h-4 w-4" />
            {lang === "bn" ? `${parsed.length}টি যোগ করুন` : `Add ${parsed.length} item(s)`}
          </NeuButton>
        </>
      )}
    </BottomSheet>
  );
}
