/**
 * Web Speech API wrapper. The browser's speech service does the conversion;
 * in Chrome that means Google. The UI shows this once before first use.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

type SpeechCtor = new () => SpeechRecognitionLike;

function ctor(): SpeechCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return ctor() !== null;
}

export type SpeechLang = 'hi-IN' | 'en-IN';

export interface SpeechSession {
  stop(): void;
}

export interface SpeechCallbacks {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (code: string) => void;
  onEnd?: () => void;
}

export function startDictation(lang: SpeechLang, callbacks: SpeechCallbacks): SpeechSession | null {
  const Ctor = ctor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = '';

  recognition.onresult = (event: unknown) => {
    const e = event as {
      resultIndex: number;
      results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
    };
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i]!;
      if (result.isFinal) finalText += result[0].transcript;
      else interim += result[0].transcript;
    }
    if (interim) callbacks.onInterim?.(finalText + interim);
  };

  recognition.onerror = (event: unknown) => {
    const code = (event as { error?: string }).error ?? 'speech_error';
    callbacks.onError?.(code);
  };

  recognition.onend = () => {
    callbacks.onFinal(finalText.trim());
    callbacks.onEnd?.();
  };

  try {
    recognition.start();
  } catch {
    return null;
  }

  return { stop: () => recognition.stop() };
}
