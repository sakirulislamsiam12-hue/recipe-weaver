/**
 * 2. Voice-guided hands-free cooking: text-to-speech + a thin wrapper around
 * the Web Speech recognition API for "next" / "repeat" / "back" commands.
 * Everything degrades silently when the browser lacks support.
 */

export const ttsSupported = () =>
  typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";

export function speak(text: string, lang: "bn" | "en", onEnd?: () => void) {
  if (!ttsSupported() || !text.trim()) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "bn" ? "bn-BD" : "en-US";
    utter.rate = 0.95;
    if (onEnd) {
      utter.onend = () => onEnd();
      utter.onerror = () => onEnd();
    }
    window.speechSynthesis.speak(utter);
  } catch {
    onEnd?.();
  }
}

export function stopSpeaking() {
  if (!ttsSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export type VoiceCommand = "next" | "back" | "repeat" | "stop" | "timer";

const COMMANDS: Array<[VoiceCommand, RegExp]> = [
  ["next", /(next|continue|forward|পরের|পরবর্তী|এগোও)/i],
  ["back", /(back|previous|আগের|পিছনে)/i],
  ["repeat", /(repeat|again|বলুন|আবার)/i],
  ["timer", /(timer|টাইমার|সময়)/i],
  ["stop", /(stop|exit|quit|থাম|বন্ধ)/i],
];

export function matchCommand(transcript: string): VoiceCommand | null {
  for (const [cmd, re] of COMMANDS) if (re.test(transcript)) return cmd;
  return null;
}

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const recognitionSupported = () => recognitionCtor() !== null;

/** Starts continuous command listening; returns a stop function (or null). */
export function listenForCommands(
  lang: "bn" | "en",
  onCommand: (cmd: VoiceCommand, transcript: string) => void,
) {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  let stopped = false;
  const rec = new Ctor();
  rec.lang = lang === "bn" ? "bn-BD" : "en-US";
  rec.continuous = true;
  rec.interimResults = false;
  rec.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    const transcript = last?.[0]?.transcript ?? "";
    const cmd = matchCommand(transcript);
    if (cmd) onCommand(cmd, transcript);
  };
  rec.onerror = () => {};
  rec.onend = () => {
    if (!stopped) {
      try {
        rec.start();
      } catch {
        /* ignore */
      }
    }
  };
  try {
    rec.start();
  } catch {
    return null;
  }
  return () => {
    stopped = true;
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  };
}

/** 11. Kitchen mode: keep the screen awake while cooking. */
export async function requestWakeLock() {
  const nav = navigator as Navigator & {
    wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
  };
  if (!nav.wakeLock) return null;
  try {
    return await nav.wakeLock.request("screen");
  } catch {
    return null;
  }
}

/**
 * Free-form dictation for the AI voice conversation: captures a whole spoken
 * sentence (not just fixed commands) and reports the final transcript.
 * Returns a stop function, or null when the browser has no recognition API.
 */
export function listenForSpeech(
  lang: "bn" | "en",
  handlers: {
    onPartial?: (text: string) => void;
    onFinal: (text: string) => void;
    onEnd?: () => void;
  },
) {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor() as RecognitionLike & {
    interimResults: boolean;
    onresult:
      | ((event: {
          results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
        }) => void)
      | null;
  };
  rec.lang = lang === "bn" ? "bn-BD" : "en-US";
  rec.continuous = false;
  rec.interimResults = true;
  let done = false;
  rec.onresult = (event) => {
    const last = event.results[event.results.length - 1] as
      | (ArrayLike<{ transcript: string }> & { isFinal?: boolean })
      | undefined;
    const transcript = last?.[0]?.transcript ?? "";
    if (last?.isFinal) {
      done = true;
      if (transcript.trim()) handlers.onFinal(transcript.trim());
    } else {
      handlers.onPartial?.(transcript);
    }
  };
  rec.onerror = () => {};
  rec.onend = () => {
    handlers.onEnd?.();
    if (!done) handlers.onFinal("");
  };
  try {
    rec.start();
  } catch {
    return null;
  }
  return () => {
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  };
}
