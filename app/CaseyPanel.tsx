"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State = "idle" | "listening" | "thinking" | "speaking" | "error";
type ChatMsg = { role: "user" | "assistant"; content: string };

const BARS = 28;

type Recog = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: { results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const LABELS: Record<State, string> = {
  idle: "Press once. Talk normally.",
  listening: "Listening… go ahead.",
  thinking: "Casey is thinking…",
  speaking: "Casey is talking",
  error: "Something went sideways.",
};

const BTN: Record<State, string> = {
  idle: "Talk to Casey",
  listening: "I'm done talking",
  thinking: "Thinking…",
  speaking: "Stop",
  error: "Try again",
};

export default function CaseyPanel({ pains }: { pains: string[] }) {
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState(
    "Casey is ready when you are."
  );
  const [mutedHint, setMutedHint] = useState(true);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.18));
  const [typed, setTyped] = useState("");
  const [showType, setShowType] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [offerMeet, setOfferMeet] = useState(false);

  const recogRef = useRef<Recog | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef<State>("idle");
  const painsRef = useRef(pains);
  painsRef.current = pains;
  stateRef.current = state;

  const stopMic = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setLevels(Array(BARS).fill(0.18));
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopSpeech = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setLevels(Array(BARS).fill(0.18));
  }, []);

  const speak = useCallback(
    async (text: string) => {
      stopSpeech();
      setState("speaking");
      try {
        const r = await fetch("/api/casey/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!r.ok) throw new Error("tts");
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        // Honest waveform from real audio
        const ctx = audioCtxRef.current || new AudioContext();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();
        const src = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (stateRef.current !== "speaking") return;
          analyser.getByteFrequencyData(data);
          setLevels(
            Array.from({ length: BARS }, (_, i) => {
              const v = data[Math.floor((i / BARS) * data.length)] ?? 0;
              return 0.12 + (v / 255) * 0.88;
            })
          );
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        audio.onended = () => {
          URL.revokeObjectURL(url);
          stopSpeech();
          setState("idle");
          setOfferMeet(true);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          stopSpeech();
          setState("idle");
          setOfferMeet(true);
        };
        await audio.play();
      } catch {
        // Last-resort browser voice only if neural TTS fails
        stopSpeech();
        const u = new SpeechSynthesisUtterance(text);
        u.onend = () => {
          setState("idle");
          setOfferMeet(true);
        };
        setState("speaking");
        window.speechSynthesis.speak(u);
      }
    },
    [stopSpeech]
  );

  const askCasey = useCallback(
    async (userText: string) => {
      const next: ChatMsg[] = [...messages, { role: "user", content: userText }];
      setMessages(next);
      setState("thinking");
      setMutedHint(false);
      setTranscript(userText);

      try {
        const r = await fetch("/api/casey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, pains: painsRef.current }),
        });
        const data = await r.json();
        const reply = data.reply || "Try that once more.";
        setMessages([...next, { role: "assistant", content: reply }]);
        setTranscript(reply);
        speak(reply);
      } catch {
        setState("error");
        setTranscript("Casey could not reach the server. Type a message or try again.");
        setShowType(true);
      }
    },
    [messages, speak]
  );

  const startListening = useCallback(async () => {
    window.speechSynthesis.cancel();
    const w = window as unknown as { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setShowType(true);
      setState("error");
      setTranscript("This browser has no voice input. Type what you would say.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (stateRef.current !== "listening") return;
        analyser.getByteFrequencyData(data);
        setLevels(
          Array.from({ length: BARS }, (_, i) => {
            const v = data[Math.floor((i / BARS) * data.length)] ?? 0;
            return 0.12 + (v / 255) * 0.88;
          })
        );
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setShowType(true);
      setState("error");
      setTranscript("No microphone — type instead. Same Casey.");
      return;
    }

    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = "en-US";
    recogRef.current = recog;
    setState("listening");
    setMutedHint(false);
    setTranscript("Listening…");

    let finalText = "";
    recog.onresult = (ev) => {
      let interim = "";
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((finalText || interim || "Listening…").trim());
    };
    recog.onerror = (ev) => {
      stopMic();
      if (ev.error === "not-allowed") {
        setShowType(true);
        setState("error");
        setTranscript("Mic blocked. Type below — same answers.");
      } else {
        setState("idle");
      }
    };
    recog.onend = () => {
      stopMic();
      const text = finalText.trim();
      if (text) askCasey(text);
      else if (stateRef.current === "listening") setState("idle");
    };
    recog.start();
  }, [askCasey, stopMic]);

  const stopListening = useCallback(() => {
    try {
      recogRef.current?.stop();
    } catch {}
    stopMic();
  }, [stopMic]);

  const onTalk = () => {
    if (state === "idle" || state === "error") startListening();
    else if (state === "listening") stopListening();
    else if (state === "speaking") {
      window.speechSynthesis.cancel();
      stopSpeech();
      setState("idle");
    }
  };

  const onTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = typed.trim();
    if (!t || state === "thinking" || state === "speaking") return;
    setTyped("");
    askCasey(t);
  };

  useEffect(() => {
    // preload voices
    window.speechSynthesis?.getVoices();
    return () => {
      window.speechSynthesis?.cancel();
      stopSpeech();
      stopMic();
      try {
        recogRef.current?.stop();
      } catch {}
    };
  }, [stopMic, stopSpeech]);

  const active = state !== "idle" && state !== "error";

  return (
    <div className={`panel${active ? " is-active" : ""}`}>
      <p className="eyebrow">
        {state === "idle" ? "Idle" : state === "listening" ? "Listening" : state === "thinking" ? "Thinking" : state === "speaking" ? "Casey speaking" : "Needs a hand"}
      </p>
      <div className="wave" aria-hidden="true">
        {levels.map((h, i) => (
          <div
            key={i}
            className="bar"
            style={{ height: `${Math.round(h * 100)}%`, opacity: state === "idle" ? 0.22 : 0.9 }}
          />
        ))}
      </div>
      <p className="state-label">{LABELS[state]}</p>
      <p className="transcript">
        {mutedHint ? <span className="muted">{transcript}</span> : transcript}
      </p>
      <button
        type="button"
        className={`btn${state === "listening" ? " is-listening" : ""}${state === "speaking" ? " is-speaking" : ""}`}
        onClick={onTalk}
        disabled={state === "thinking"}
      >
        <span className="dot" aria-hidden="true" />
        {BTN[state]}
      </button>
      {(showType || state === "error") && (
        <form className="type-row" onSubmit={onTypeSubmit}>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type what you'd tell Casey…"
            aria-label="Type to Casey"
          />
          <button type="submit" className="btn" disabled={!typed.trim()}>
            Send
          </button>
        </form>
      )}
      {offerMeet && (
        <a className="btn btn--ghost" href="#meet">
          Yes — book a meeting with Dave ↓
        </a>
      )}
    </div>
  );
}
