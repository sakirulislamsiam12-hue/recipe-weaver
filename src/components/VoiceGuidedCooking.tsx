import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, Volume2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { NeuButton } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import {
  listenForSpeech,
  recognitionSupported,
  requestWakeLock,
  speak,
  stopSpeaking,
  ttsSupported,
} from "@/lib/speech";
import { recordActivity } from "@/lib/premium-store";
import { recipeChat } from "@/lib/ai.functions";
import type { Recipe } from "@/lib/recipe-schema";

type Msg = { role: "user" | "assistant"; content: string };
type Phase = "idle" | "listening" | "thinking" | "speaking";

/**
 * Hands-free cooking = a spoken conversation with the recipe assistant.
 * The user talks, the assistant answers out loud, then listening resumes.
 * No typing, no fixed commands.
 */
export function VoiceGuidedCooking({
  recipe,
  open,
  onClose,
}: {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}) {
  const { t, bi: lang } = useLang();
  const chat = useServerFn(recipeChat);
  const [phase, setPhase] = useState<Phase>("idle");
  const [partial, setPartial] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const messagesRef = useRef<Msg[]>([]);
  const stopListenRef = useRef<(() => void) | null>(null);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);
  const activeRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const canListen = recognitionSupported();

  const say = useCallback(
    (text: string, then?: () => void) => {
      setPhase("speaking");
      speak(text, lang, () => {
        if (!activeRef.current) return;
        then?.();
      });
      if (!ttsSupported()) then?.();
    },
    [lang],
  );

  const startListening = useCallback(() => {
    if (!activeRef.current) return;
    setPartial("");
    setPhase("listening");
    const stop = listenForSpeech(lang, {
      onPartial: (txt) => setPartial(txt),
      onFinal: (text) => {
        stopListenRef.current = null;
        if (!activeRef.current) return;
        if (!text) {
          setPhase("idle");
          return;
        }
        setPartial("");
        void ask(text);
      },
    });
    stopListenRef.current = stop;
    if (!stop) setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const ask = useCallback(
    async (text: string) => {
      const next = [...messagesRef.current, { role: "user" as const, content: text }];
      messagesRef.current = next;
      setMessages(next);
      setPhase("thinking");
      haptic("tap");
      let reply = "";
      try {
        const res = await chat({
          data: {
            lang,
            recipe: {
              title: recipe.title,
              timeMinutes: recipe.timeMinutes,
              ingredients: recipe.ingredients,
              steps: recipe.steps,
            },
            messages: next.slice(-20),
          },
        });
        reply = res.reply;
      } catch {
        reply = t("errorGeneric");
      }
      if (!activeRef.current) return;
      const withReply = [...next, { role: "assistant" as const, content: reply }];
      messagesRef.current = withReply;
      setMessages(withReply);
      say(reply, startListening);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, recipe, say, startListening],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partial, phase]);

  useEffect(() => {
    if (!open) return;
    activeRef.current = true;
    messagesRef.current = [];
    setMessages([]);
    setPartial("");
    recordActivity("handsFree");
    void requestWakeLock().then((lock) => {
      wakeRef.current = lock;
    });
    const greeting =
      lang === "bn"
        ? `${recipe.title} রান্না শুরু করি। প্রথম ধাপ: ${recipe.steps[0] ?? ""} হয়ে গেলে বলুন, পরের ধাপ বলে দেব।`
        : `Let's cook ${recipe.title}. First step: ${recipe.steps[0] ?? ""} Tell me when it's done and I'll guide the next step.`;
    const opener: Msg[] = [{ role: "assistant", content: greeting }];
    messagesRef.current = opener;
    setMessages(opener);
    say(greeting, startListening);
    return () => {
      activeRef.current = false;
      stopListenRef.current?.();
      stopListenRef.current = null;
      stopSpeaking();
      void wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const statusText =
    phase === "listening"
      ? t("listening")
      : phase === "thinking"
        ? lang === "bn"
          ? "ভাবছি…"
          : "Thinking…"
        : phase === "speaking"
          ? lang === "bn"
            ? "বলছি…"
            : "Speaking…"
          : lang === "bn"
            ? "কথা বলতে মাইকে চাপুন"
            : "Tap the mic to talk";

  const toggleMic = () => {
    haptic("tap");
    if (phase === "listening") {
      stopListenRef.current?.();
      stopListenRef.current = null;
      setPhase("idle");
      return;
    }
    stopSpeaking();
    startListening();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Volume2 className="h-4 w-4 text-accent" /> {t("voiceMode")}
          </h2>
          <NeuButton
            size="sm"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
          >
            <Square className="h-3.5 w-3.5" /> {t("stopVoice")}
          </NeuButton>
        </div>

        <div className="flex flex-1 flex-col justify-end gap-2 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-base leading-relaxed ${
                m.role === "user"
                  ? "neu-inset ml-auto text-foreground"
                  : "neu-raised bg-background text-foreground"
              }`}
            >
              {m.content}
            </div>
          ))}
          {partial && (
            <div className="neu-inset ml-auto max-w-[85%] rounded-lg px-4 py-2.5 text-base italic text-muted-foreground">
              {partial}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={toggleMic}
            disabled={!canListen || phase === "thinking"}
            aria-label={t("startVoice")}
            className={`neu-raised neu-press flex h-24 w-24 items-center justify-center rounded-full disabled:opacity-60 ${
              phase === "listening" ? "neu-inset text-accent" : "text-foreground"
            }`}
          >
            {phase === "thinking" ? (
              <Loader2 className="h-9 w-9 animate-spin text-accent" />
            ) : (
              <Mic className={`h-9 w-9 ${phase === "listening" ? "animate-pulse" : ""}`} />
            )}
          </button>
          <p className="text-sm text-muted-foreground">
            {canListen ? statusText : t("notSupported")}
          </p>
        </div>
      </div>
    </div>
  );
}
