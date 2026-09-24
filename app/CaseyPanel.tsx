"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceConversation } from "@spekoai/client";
import Link from "next/link";
import BookDave, { preloadDaveCalendly } from "./BookDave";
import PresenceVisual, { type PresenceMode } from "./PresenceVisual";
import SiteHeader from "./SiteHeader";
import { watchAgentAudio, type CallVisual } from "./lips";

type State = CallVisual;

const STATUS: Record<State, string> = {
  idle: "",
  requesting_mic: "Allow microphone…",
  listening: "Listening…",
  thinking: "",
  speaking: "Casey is talking…",
  done: "That’s the conversation.",
  error: "",
};

const BTN: Record<State, string> = {
  idle: "Talk to Casey",
  requesting_mic: "Allow microphone…",
  listening: "End",
  thinking: "End",
  speaking: "End",
  done: "Talk again",
  error: "Try again",
};

type Turn = { role: "user" | "assistant"; text: string; at: number };

export default function CaseyPanel() {
  const [state, setState] = useState<State>("idle");
  const [presence, setPresence] = useState<PresenceMode>("bars");
  const [caption, setCaption] = useState("");
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

  useEffect(() => {
    preloadDaveCalendly();
  }, []);

  useEffect(
    () => () => {
      void hangup();
    },
    [hangup]
  );

  const startCall = useCallback(async () => {
    if (activeRef.current) {
      if (stateRef.current === "requesting_mic") return;
      await hangup();
      setState("done");
      return;
    }

    setErrMsg("");
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

    const ctx = new AudioContext({ latencyHint: "interactive" });
    audioCtxRef.current = ctx;
    try {
      await ctx.resume();
    } catch {
      /* unmute path resumes again */
    }
    const node = ctx.createAnalyser();
    // 512 samples ≈ 10ms at 48kHz — one frame, not a trailing window.
    node.fftSize = 512;
    node.smoothingTimeConstant = 0;
    node.minDecibels = -85;
    node.maxDecibels = -25;
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
  }, [hangup, pushTurn]);

  const unmute = useCallback(async () => {
    try {
      await audioCtxRef.current?.resume();
      await convRef.current?.startAudioPlayback();
      setNeedsUnmute(false);
    } catch {
      /* ignore */
    }
  }, []);

  const busy = state === "requesting_mic";

  return (
    <main
      id="casey"
      className={live ? "room room--live" : state === "idle" ? "room room--idle" : "room"}
      data-state={state}
    >
      <header className="top">
        <SiteHeader variant="room" />
      </header>

      <div className="stage">
        <div className="presence">
          {state === "idle" ? (
            <h1 className="heart">Is AI right for your business?</h1>
          ) : null}
          <div className="viz-switch" role="group" aria-label="Presence style">
            <button
              type="button"
              className={presence === "bars" ? "is-on" : ""}
              aria-pressed={presence === "bars"}
              onClick={() => setPresence("bars")}
            >
              Bars
            </button>
            <span aria-hidden="true">|</span>
            <button
              type="button"
              className={presence === "line" ? "is-on" : ""}
              aria-pressed={presence === "line"}
              onClick={() => setPresence("line")}
            >
              Line
            </button>
            <span aria-hidden="true">|</span>
            <button
              type="button"
              className={presence === "circle" ? "is-on" : ""}
              aria-pressed={presence === "circle"}
              onClick={() => setPresence("circle")}
            >
              Circle
            </button>
          </div>
          <PresenceVisual state={state} analyser={analyser} mode={presence} />
        </div>
      </div>

      <div className="dock">
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
        ) : state === "done" ? (
          <BookDave />
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

        {live ? <BookDave live /> : null}

        {state === "done" ? (
          <button type="button" className="again" onClick={() => void startCall()}>
            Talk again
          </button>
        ) : null}

        {needsUnmute ? (
          <button type="button" className="quiet" onClick={() => void startCall()}>
            End
          </button>
        ) : null}

        {state === "idle" ? (
          <div className="home-under">
            <p className="home-frame">Casey is Aidvance’s AI business concierge.</p>
            <p className="home-proof">
              <span>See what this looks like in practice</span>
              <span aria-hidden="true">·</span>
              <Link className="m-textlink" href="/work/morning-desk">
                Morning Desk
              </Link>
              <span aria-hidden="true">·</span>
              <Link className="m-textlink" href="/ai-assessment">
                AI Assessment
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
