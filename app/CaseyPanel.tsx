"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { VoiceConversation } from "@spekoai/client";
import PresenceVisual, { type PresenceMode } from "./PresenceVisual";
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
  listening: "Stop",
  thinking: "Stop",
  speaking: "Stop",
  done: "Talk again",
  error: "Try again",
};

type Turn = { role: "user" | "assistant"; text: string; at: number };

const DAVE_LABEL = "Book a FREE 15 Minute Chat with Dave";
const DAVE_EMAIL = "david.choukroun2@gmail.com";
// Mid-call Book only. Empty sms: URL — no ?body=, so Messages opens with no canned pitch.
const DAVE_SMS_HREF = "sms:+17188690404";
const DAVE_BODY =
  "Hi Dave,\n\nI'd like to book a FREE 15 minute chat. A time that works for me:\n\n";

function composeHref(base: string, fields: Record<string, string>) {
  const query = Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `${base}?${query}`;
}

// mailto does nothing when the browser has no desktop mail handler.
// Gmail compose is a normal https tab. Outlook and mailto stay as options.
const GMAIL_HREF = composeHref("https://mail.google.com/mail/", {
  view: "cm",
  fs: "1",
  to: DAVE_EMAIL,
  su: DAVE_LABEL,
  body: DAVE_BODY,
});

const OUTLOOK_HREF = composeHref("https://outlook.live.com/mail/0/deeplink/compose", {
  to: DAVE_EMAIL,
  subject: DAVE_LABEL,
  body: DAVE_BODY,
});

const MAILTO_HREF = `mailto:${DAVE_EMAIL}?subject=${encodeURIComponent(
  DAVE_LABEL
)}&body=${encodeURIComponent(DAVE_BODY)}`;

function openComposeTab(url: string) {
  try {
    const opened = window.open(url, "_blank");
    if (!opened) return false;
    try {
      if (opened.closed) return false;
      opened.opener = null;
    } catch {
      /* The tab is already cross-origin. It still opened. */
    }
    return true;
  } catch {
    return false;
  }
}

async function writeClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Fall through to the selection path. */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export default function CaseyPanel() {
  const [state, setState] = useState<State>("idle");
  const [presence, setPresence] = useState<PresenceMode>("bars");
  const [caption, setCaption] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mailOptions, setMailOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const stateRef = useRef<State>("idle");
  const activeRef = useRef(false);
  const convRef = useRef<VoiceConversation | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopTapRef = useRef<(() => void) | null>(null);
  const pendingReplyRef = useRef(false);
  const thinkTimerRef = useRef(0);
  const holdTimerRef = useRef(0);
  const copyTimerRef = useRef(0);

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
    setMailOptions(false);
    setCopied(false);
    setCopyFailed(false);
    window.clearTimeout(copyTimerRef.current);
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

  // Opening SMS backgrounds this tab (especially iOS) and the browser suspends
  // Speko playback. Coming back should resume audio. This does not end the call.
  useEffect(() => {
    if (!live) return;

    const resumeAfterReturn = () => {
      if (document.visibilityState === "hidden") return;
      if (!activeRef.current) return;
      void unmute();
    };

    document.addEventListener("visibilitychange", resumeAfterReturn);
    window.addEventListener("focus", resumeAfterReturn);
    return () => {
      document.removeEventListener("visibilitychange", resumeAfterReturn);
      window.removeEventListener("focus", resumeAfterReturn);
    };
  }, [live, unmute]);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  const bookDave = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const modified =
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;
    if (modified) return;
    // A scripted tab is cancellable. If the browser blocks it, leave the
    // anchor's own https navigation in place and show in-page mail options.
    if (openComposeTab(GMAIL_HREF)) {
      event.preventDefault();
      setMailOptions(false);
      return;
    }
    setMailOptions(true);
  }, []);

  const copyDave = useCallback(async () => {
    const ok = await writeClipboard(DAVE_EMAIL);
    setCopied(ok);
    setCopyFailed(!ok);
    window.clearTimeout(copyTimerRef.current);
    if (ok) {
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const busy = state === "requesting_mic";

  return (
    <main
      className={live ? "room room--live" : state === "idle" ? "room room--idle" : "room"}
      data-state={state}
    >
      <header className="top">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Aidvance" />
        </div>
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
          <button type="button" className="talk talk--resume" onClick={() => void unmute()}>
            <span className="talk-label" key="unmute">
              Tap to unmute
            </span>
          </button>
        ) : state === "done" ? (
          <a
            className="book"
            href={GMAIL_HREF}
            target="_blank"
            rel="noopener noreferrer"
            onClick={bookDave}
            aria-expanded={mailOptions}
            aria-controls="dave-mail-options"
          >
            {DAVE_LABEL}
          </a>
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

        {live ? (
          <a className="book book--live" href={DAVE_SMS_HREF}>
            {DAVE_LABEL}
          </a>
        ) : null}

        {state === "done" && mailOptions ? (
          <div
            className="mail-options"
            id="dave-mail-options"
            role="group"
            aria-label="Other ways to email Dave"
          >
            {copyFailed ? <p className="mail-address">{DAVE_EMAIL}</p> : null}
            <button type="button" className="mail-option" onClick={() => void copyDave()}>
              {copied ? "Copied" : "Copy Dave’s email"}
            </button>
            <span className="mail-dot" aria-hidden="true">
              ·
            </span>
            <a className="mail-option" href={GMAIL_HREF} target="_blank" rel="noopener noreferrer">
              Gmail
            </a>
            <span className="mail-dot" aria-hidden="true">
              ·
            </span>
            <a
              className="mail-option"
              href={OUTLOOK_HREF}
              target="_blank"
              rel="noopener noreferrer"
            >
              Outlook
            </a>
            <span className="mail-dot" aria-hidden="true">
              ·
            </span>
            <a className="mail-option" href={MAILTO_HREF}>
              Mail app
            </a>
          </div>
        ) : null}

        {state === "done" ? (
          <button type="button" className="again" onClick={() => void startCall()}>
            Talk again
          </button>
        ) : null}

        {needsUnmute ? (
          <button type="button" className="quiet" onClick={() => void startCall()}>
            Stop
          </button>
        ) : null}

      </div>
    </main>
  );
}
