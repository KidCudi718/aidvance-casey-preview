"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceConversation } from "@spekoai/client";
import {
  CASEY_OPENER,
  CASEY_VOICE_INSTRUCTIONS,
} from "../lib/caseyVoicePrompt";

type State =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

const BARS = 28;

const LABELS: Record<State, string> = {
  idle: "Press once. Just talk.",
  connecting: "Connecting Casey (bar preview)…",
  listening: "Listening…",
  thinking: "…",
  speaking: "Casey is talking — interrupt anytime",
  error: "Something went sideways.",
};

const BTN: Record<State, string> = {
  idle: "Talk to Casey",
  connecting: "Connecting…",
  listening: "End call",
  thinking: "End call",
  speaking: "End call",
  error: "Try again",
};

type Turn = { role: "user" | "assistant"; text: string; at: number };

export default function CaseyPanel() {
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState(
    'Bar-personality preview · same Speko voice · opens with "Hey." · production untouched.'
  );
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.18));
  const [offerMeet, setOfferMeet] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [needsUnmute, setNeedsUnmute] = useState(false);

  const stateRef = useRef<State>("idle");
  const activeRef = useRef(false);
  const convRef = useRef<VoiceConversation | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const rafRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  stateRef.current = state;

  const stopWave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setLevels(Array(BARS).fill(0.18));
  }, []);

  const pushTurn = useCallback((role: "user" | "assistant", text: string) => {
    const t = text.trim();
    if (!t) return;
    const last = turnsRef.current[turnsRef.current.length - 1];
    if (last && last.role === role) {
      last.text = t;
      last.at = Date.now();
      return;
    }
    turnsRef.current.push({ role, text: t, at: Date.now() });
  }, []);

  const flushLog = useCallback(async () => {
    if (!turnsRef.current.length) return;
    try {
      await fetch("/api/voice/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turns: turnsRef.current,
          meta: { provider: "speko", personality: "bar" },
        }),
        keepalive: true,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const hangup = useCallback(async () => {
    const was = activeRef.current;
    activeRef.current = false;
    stopWave();
    setNeedsUnmute(false);
    const conv = convRef.current;
    convRef.current = null;
    try {
      await conv?.endSession();
    } catch {
      /* ignore */
    }
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (was) void flushLog();
  }, [flushLog, stopWave]);

  useEffect(
    () => () => {
      void hangup();
    },
    [hangup]
  );

  const startMicWave = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;
      const tick = () => {
        if (!activeRef.current || !analyserRef.current) return;
        if (stateRef.current === "listening") {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          setLevels(
            Array.from({ length: BARS }, (_, i) => {
              const v = data[Math.floor((i / BARS) * data.length)] ?? 0;
              return 0.12 + (v / 255) * 0.88;
            })
          );
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      /* Speko also requests mic; wave is optional */
    }
  }, []);

  const startCall = useCallback(async () => {
    if (activeRef.current) {
      await hangup();
      setState("idle");
      setTranscript("Call ended.");
      return;
    }

    setErrMsg("");
    setOfferMeet(false);
    setNeedsUnmute(false);
    turnsRef.current = [];
    setState("connecting");
    setTranscript("Connecting bar Casey (Speko + session overrides)…");
    activeRef.current = true;

    try {
      const sessionRes = await fetch("/api/voice/session", { method: "POST" });
      if (sessionRes.status === 429) {
        throw new Error(
          "Casey is busy on another call. Wait a minute and try again."
        );
      }
      if (!sessionRes.ok) throw new Error("Could not start Casey session");
      const session = await sessionRes.json();
      const transportToken =
        session.transportToken || session.conversationToken;
      const transportUrl = session.transportUrl || session.livekitUrl;
      if (!transportToken || !transportUrl) {
        throw new Error("Incomplete Speko session");
      }

      const conv = await VoiceConversation.create({
        transportToken,
        transportUrl,
        overrides: {
          agent: {
            prompt: CASEY_VOICE_INSTRUCTIONS,
            firstMessage: CASEY_OPENER,
          },
        },
        onConnect: () => {
          setState("listening");
          setTranscript('Connected — she should open with "Hey."');
        },
        onDisconnect: () => {
          if (activeRef.current) {
            activeRef.current = false;
            void hangup();
            setState("idle");
            setTranscript("Call ended.");
          }
        },
        onModeChange: (mode) => {
          if (mode === "listening") setState("listening");
          if (mode === "speaking") setState("speaking");
        },
        onTranscript: (messages) => {
          const last = messages[messages.length - 1];
          if (!last?.text) return;
          const isUser = last.source === "user";
          setTranscript(`${isUser ? "You" : "Casey"}: ${last.text}`);
          if (last.isFinal) {
            pushTurn(isUser ? "user" : "assistant", last.text);
            if (
              !isUser &&
              messages.filter((m) => m.source === "agent" && m.isFinal)
                .length >= 3
            ) {
              setOfferMeet(true);
            }
          }
        },
        onError: (err) => {
          const message =
            err instanceof Error ? err.message : "Speko voice error";
          setErrMsg(message);
          setTranscript(message);
          setState("error");
          activeRef.current = false;
          void hangup();
        },
        onAudioPlaybackBlocked: () => {
          setNeedsUnmute(true);
        },
      });

      convRef.current = conv;
      await startMicWave();
      setState("listening");
      setTranscript("Listening… go ahead.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start Casey";
      setErrMsg(msg);
      setTranscript(msg);
      activeRef.current = false;
      await hangup();
      setState("error");
    }
  }, [hangup, pushTurn, startMicWave]);

  const unmute = useCallback(async () => {
    try {
      await convRef.current?.startAudioPlayback();
      setNeedsUnmute(false);
    } catch {
      /* ignore */
    }
  }, []);

  const busy = state === "connecting";

  return (
    <div className={`panel state-${state}`}>
      <div className="wave" aria-hidden>
        {levels.map((h, i) => (
          <span key={i} style={{ ["--h" as string]: h }} />
        ))}
      </div>
      <p className="status">{LABELS[state]}</p>
      <p className="transcript">{transcript}</p>
      {errMsg && state === "error" ? <p className="err">{errMsg}</p> : null}
      {needsUnmute ? (
        <button type="button" className="talk" onClick={() => void unmute()}>
          Tap to unmute Casey
        </button>
      ) : null}
      <button
        type="button"
        className="talk"
        onClick={() => void startCall()}
        disabled={busy}
        aria-pressed={state !== "idle" && state !== "error"}
      >
        {BTN[state]}
      </button>
      {offerMeet ? (
        <a className="meet" href="#meet">
          If that helped — book Dave →
        </a>
      ) : null}
      <p className="hint">
        Bar-personality preview · same Speko voice · production / live agent
        untouched
      </p>
    </div>
  );
}
