"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceConversation } from "@spekoai/client";
import LipPresence from "./LipPresence";
import { watchAgentAudio, type CallVisual } from "./lips";

type State = CallVisual;

const BARS = 27;

const STATUS: Record<State, string> = {
  idle: "",
  requesting_mic: "Allow microphone…",
  listening: "Listening…",
  thinking: "One second…",
  speaking: "Casey is talking…",
  done: "That’s the conversation.",
  error: "",
};

const BTN: Record<State, string> = {
  idle: "Talk to Casey",
  requesting_mic: "Allow microphone…",
  listening: "Stop",
  thinking: "Stop",
  speaking: "Stop",
  done: "Talk again",
  error: "Try again",
};

type Turn = { role: "user" | "assistant"; text: string; at: number };

const MEET_HREF =
  "mailto:david.choukroun2@gmail.com?subject=15%20minutes%20with%20Dave%20from%20Casey%20preview";

function PresenceWave({
  state,
  analyser,
}: {
  state: State;
  analyser: AnalyserNode | null;
}) {
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.18));
  const speaking = state === "speaking" && analyser;

  useEffect(() => {
    if (!speaking || !analyser) return;
    let raf = 0;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (analyser.context.state === "closed") return;
      analyser.getByteFrequencyData(data);
      const span = Math.floor(data.length * 0.42);
      setLevels(
        Array.from({ length: BARS }, (_, i) => {
          const v = data[Math.floor((i / BARS) * span)] ?? 0;
          return 0.14 + (v / 255) * 0.86;
        })
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, analyser]);

  const mode =
    state === "speaking" ? "wave wave--speak" : state === "listening" ? "wave wave--listen" : "wave";

  return (
    <div className={mode} aria-hidden>
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          style={{
            ["--i" as string]: i,
            ["--h" as string]: speaking ? levels[i] : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default function CaseyPanel() {
  const [state, setState] = useState<State>("idle");
  const [caption, setCaption] = useState("");
  const [offerMeet, setOfferMeet] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const stateRef = useRef<State>("idle");
  const activeRef = useRef(false);
  const convRef = useRef<VoiceConversation | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopTapRef = useRef<(() => void) | null>(null);
  const pendingReplyRef = useRef(false);
  const thinkTimerRef = useRef(0);
  const holdTimerRef = useRef(0);
  const offerMeetRef = useRef(false);

  stateRef.current = state;

  const live =
    state === "requesting_mic" ||
    state === "listening" ||
    state === "thinking" ||
    state === "speaking";

  const stopAudioTap = useCallback(() => {
    stopTapRef.current?.();
    stopTapRef.current = null;
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    setAnalyser(null);
    if (ctx && ctx.state !== "closed") void ctx.close();
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

  const flushLog = useCallback(async (turns: Turn[]) => {
    if (!turns.length) return;
    try {
      await fetch("/api/voice/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turns,
          meta: { provider: "speko", personality: "bar" },
        }),
        keepalive: true,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const hangup = useCallback(async () => {
    activeRef.current = false;
    pendingReplyRef.current = false;
    window.clearTimeout(thinkTimerRef.current);
    window.clearTimeout(holdTimerRef.current);
    setNeedsUnmute(false);
    stopAudioTap();
    const turns = turnsRef.current;
    turnsRef.current = [];
    const conv = convRef.current;
    convRef.current = null;
    try {
      await conv?.endSession();
    } catch {
      /* ignore */
    }
    if (turns.length) void flushLog(turns);
  }, [flushLog, stopAudioTap]);

  useEffect(
    () => () => {
      void hangup();
    },
    [hangup]
  );

  const markEarned = useCallback((earned: boolean) => {
    offerMeetRef.current = earned;
    setOfferMeet(earned);
  }, []);

  const startCall = useCallback(async () => {
    if (activeRef.current) {
      if (stateRef.current === "requesting_mic") return;
      await hangup();
      setState("done");
      return;
    }

    setErrMsg("");
    markEarned(false);
    setNeedsUnmute(false);
    setCaption("");
    turnsRef.current = [];
    pendingReplyRef.current = false;
    window.clearTimeout(thinkTimerRef.current);
    window.clearTimeout(holdTimerRef.current);
    setState("requesting_mic");
    activeRef.current = true;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error("This browser can’t use the microphone."), {
          noMic: true,
        });
      }
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((track) => track.stop());
    } catch (e) {
      const noMic =
        e instanceof DOMException ||
        (e instanceof Error && "noMic" in e && Boolean((e as { noMic?: boolean }).noMic));
      setErrMsg(
        noMic
          ? "Casey needs the microphone."
          : e instanceof Error
            ? e.message
            : "Casey needs the microphone."
      );
      activeRef.current = false;
      setState("error");
      return;
    }

    if (!activeRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    void ctx.resume();
    const node = ctx.createAnalyser();
    node.fftSize = 1024;
    node.smoothingTimeConstant = 0.05;
    node.minDecibels = -96;
    node.maxDecibels = -24;
    setAnalyser(node);
    stopTapRef.current = watchAgentAudio(ctx, node);

    try {
      const sessionRes = await fetch("/api/voice/session", { method: "POST" });
      if (sessionRes.status === 429) {
        throw new Error("Casey is busy on another call. Wait a minute and try again.");
      }
      if (!sessionRes.ok) throw new Error("Could not start Casey session");
      const session = await sessionRes.json();
      const transportToken = session.transportToken || session.conversationToken;
      const transportUrl = session.transportUrl || session.livekitUrl;
      if (!transportToken || !transportUrl) {
        throw new Error("Incomplete Speko session");
      }

      const conv = await VoiceConversation.create({
        transportToken,
        transportUrl,
        onConnect: () => {
          setState((s) => (s === "requesting_mic" ? "listening" : s));
        },
        onDisconnect: () => {
          if (!activeRef.current) return;
          void hangup().then(() => {
            setState("done");
          });
        },
        onModeChange: (mode) => {
          if (mode === "speaking") {
            pendingReplyRef.current = false;
            window.clearTimeout(thinkTimerRef.current);
            window.clearTimeout(holdTimerRef.current);
            setState("speaking");
            return;
          }
          if (pendingReplyRef.current) return;
          setState("listening");
        },
        onTranscript: (messages) => {
          const last = messages[messages.length - 1];
          if (!last?.text) return;
          const isUser = last.source === "user";
          if (last.isFinal) {
            pushTurn(isUser ? "user" : "assistant", last.text);
            if (!isUser) setCaption(last.text);
            if (
              !isUser &&
              messages.filter((m) => m.source === "agent" && m.isFinal).length >= 3
            ) {
              markEarned(true);
            }
            if (isUser) {
              pendingReplyRef.current = true;
              window.clearTimeout(thinkTimerRef.current);
              thinkTimerRef.current = window.setTimeout(() => {
                if (pendingReplyRef.current && stateRef.current === "listening") {
                  setState("thinking");
                }
              }, 280);
              window.clearTimeout(holdTimerRef.current);
              holdTimerRef.current = window.setTimeout(() => {
                if (
                  activeRef.current &&
                  pendingReplyRef.current &&
                  stateRef.current === "thinking"
                ) {
                  pendingReplyRef.current = false;
                  setState("listening");
                }
              }, 5000);
            }
          }
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Speko voice error";
          setErrMsg(message);
          setCaption("");
          setState("error");
          activeRef.current = false;
          void hangup();
        },
        onAudioPlaybackBlocked: () => {
          setNeedsUnmute(true);
        },
      });

      if (!activeRef.current) {
        try {
          await conv.endSession();
        } catch {
          /* ignore */
        }
        return;
      }
      convRef.current = conv;
      setState((s) => (s === "requesting_mic" ? "listening" : s));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start Casey";
      setErrMsg(msg);
      activeRef.current = false;
      await hangup();
      setState("error");
    }
  }, [hangup, markEarned, pushTurn]);

  const unmute = useCallback(async () => {
    try {
      await audioCtxRef.current?.resume();
      await convRef.current?.startAudioPlayback();
      setNeedsUnmute(false);
    } catch {
      /* ignore */
    }
  }, []);

  const showDoor = state === "done" && offerMeet;
  const busy = state === "requesting_mic";

  return (
    <main className={live ? "room room--live" : "room"} data-state={state}>
      <header className="top">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Aidvance" />
        </div>
        <p className="mark">Preview</p>
      </header>

      <div className="stage">
        <div className="presence">
          <div className="ring" aria-hidden />
          <LipPresence state={state} analyser={state === "speaking" ? analyser : null} />
          <PresenceWave state={state} analyser={analyser} />
        </div>
      </div>

      <div className="dock">
        {state === "idle" ? <p className="hey">Hey.</p> : null}

        {STATUS[state] ? (
          <p className="status" role="status" aria-live="polite" key={state}>
            {STATUS[state]}
          </p>
        ) : null}

        {caption && state !== "idle" && state !== "error" ? (
          <p className="caption" aria-live="polite">
            {caption}
          </p>
        ) : null}

        {state === "error" ? (
          <div className="callout" role="alert">
            <p>{errMsg || "Something went sideways."}</p>
            <button type="button" className="talk" onClick={() => void startCall()}>
              <span className="talk-label" key="try">
                Try again
              </span>
            </button>
          </div>
        ) : needsUnmute ? (
          <button type="button" className="talk" onClick={() => void unmute()}>
            <span className="talk-label" key="unmute">
              Tap to unmute
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="talk"
            onClick={() => void startCall()}
            disabled={busy}
            aria-pressed={live}
          >
            <span className="talk-label" key={BTN[state]}>
              {BTN[state]}
            </span>
          </button>
        )}

        {needsUnmute ? (
          <button type="button" className="quiet" onClick={() => void startCall()}>
            Stop
          </button>
        ) : null}

        {state === "idle" ? (
          <p className="whisper">Tell her what your week looks like.</p>
        ) : null}

        {showDoor ? (
          <a className="meet" href={MEET_HREF}>
            15 minutes with Dave, if you want it
          </a>
        ) : null}
      </div>
    </main>
  );
}
