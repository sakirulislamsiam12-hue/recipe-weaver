import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { recipeChat, type Recipe } from "@/lib/ai.functions";
import { useLang } from "@/lib/i18n";
import { NeuInput } from "./neu";

type Msg = { role: "user" | "assistant"; content: string };

export function RecipeChat({ recipe }: { recipe: Recipe }) {
  const { t, lang } = useLang();
  const chat = useServerFn(recipeChat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
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
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: t("errorGeneric") }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="neu-raised rounded-lg bg-background p-4">
      <p className="mb-3 text-xs text-muted-foreground">{t("chatHint")}</p>
      <div className="mb-3 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`pop-in max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
              m.role === "user"
                ? "neu-inset self-end text-foreground"
                : "neu-raised self-start bg-background text-foreground"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="neu-raised flex w-16 items-center justify-center gap-1 self-start rounded-lg py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="typing-dot h-1.5 w-1.5 rounded-full bg-accent"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2">
        <NeuInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={lang === "bn" ? "প্রশ্ন লিখুন…" : "Ask a question…"}
        />
        <button
          onClick={send}
          aria-label={t("send")}
          disabled={busy}
          className="neu-raised neu-press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
