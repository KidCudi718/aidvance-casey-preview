"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

type Turn = { role: "user" | "assistant"; text: string; at: number };

const BARS = 28;
const SAMPLE_RATE = 24000;
/** RMS above this while she is talking = you barged in (client-side, faster than server VAD) */
const BARGE_RMS = 0.035;

const LABELS: Record<State, string> = {
  idle: "Press once. Talk like a person.",
  connecting: "Connecting Casey…",
  listening: "Listening…",
  thinking: "…",
  speaking: "Talk over her anytime",
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

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]!));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function pcm16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function rms(input: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) sum += input[i]! * input[i]!;
  return Math.sqrt(sum / Math.max(1, input.length));
}

export default function CaseyPanel() {
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState(
    "Casey is ready. Cut her off anytime."
  );
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.18));
  const [offerMeet, setOfferMeet] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const stateRef = useRef<State>("idle");
  const activeRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);
  const nextPlayRef = useRef(0);
  const caseyTextRef = useRef("");
  const userTextRef = useRef("");
  const assistantTurnsRef = useRef(0);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const turnsRef = useRef<Turn[]>([]);
  const bargeLockRef = useRef(0);
  const openerGateRef = useRef(0);
  const startedAtRef = useRef(0);

  stateRef.current = state;

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
    const turns = turnsRef.current.slice();
    if (!turns.length) return;
    try {
      await fetch("/api/voice/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turns,
          meta: {
            ms: Date.now() - (startedAtRef.current || Date.now()),
            assistant_turns: assistantTurnsRef.current,
          },
        }),
        keepalive: true,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const stopWave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setLevels(Array(BARS).fill(0.18));
  }, []);

  const flushPlayback = useCallback(() => {
    for (const src of playingSourcesRef.current) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    playingSourcesRef.current.clear();
    nextPlayRef.current = 0;
    stopWave();
  }, [stopWave]);

  const hangup = useCallback(() => {
    const wasActive = activeRef.current;
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    flushPlayback();
    try {
      wsRef.current?.close();
    } catch {
      /* ignore */
    }
    wsRef.current = null;
    try {
      processorRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void micCtxRef.current?.close();
    micCtxRef.current = null;
    void playCtxRef.current?.close();
    playCtxRef.current = null;
    analyserRef.current = null;
    if (wasActive) void flushLog();
  }, [flushPlayback, flushLog]);

  useEffect(() => () => hangup(), [hangup]);

  const playPcmChunk = useCallback(
    (pcm: Int16Array) => {
      let ctx = playCtxRef.current;
      if (!ctx || ctx.state === "closed") {
        ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
        playCtxRef.current = ctx;
      }
      if (ctx.state === "suspended") void ctx.resume();

      const float = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) float[i] = (pcm[i] ?? 0) / 32768;
      const buffer = ctx.createBuffer(1, float.length, SAMPLE_RATE);
      buffer.copyToChannel(float, 0);

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      const now = ctx.currentTime;
      const startAt = Math.max(now, nextPlayRef.current);
      src.start(startAt);
      nextPlayRef.current = startAt + buffer.duration;
      playingSourcesRef.current.add(src);
      src.onended = () => {
        playingSourcesRef.current.delete(src);
        if (
          playCtxRef.current &&
          playCtxRef.current.currentTime >= nextPlayRef.current - 0.08
        ) {
          if (stateRef.current === "speaking") {
            setState("listening");
            stopWave();
          }
        }
      };

      if (stateRef.current !== "speaking") setState("speaking");

      cancelAnimationFrame(rafRef.current);
      const tick = () => {
        if (!activeRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
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
    },
    [stopWave]
  );

  const bargeIn = useCallback(() => {
    const now = Date.now();
    if (now - bargeLockRef.current < 120) return;
    bargeLockRef.current = now;

    // Kill local audio immediately — don't wait for the server
    flushPlayback();
    setState("listening");
    setTranscript("Listening…");

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      for (const msg of [
        { type: "response.cancel" },
        { type: "output_audio_buffer.clear" },
      ]) {
        try {
          ws.send(JSON.stringify(msg));
        } catch {
          /* ignore */
        }
      }
    }
    if (caseyTextRef.current) {
      pushTurn("assistant", caseyTextRef.current + " —");
      caseyTextRef.current = "";
    }
  }, [flushPlayback, pushTurn]);

  const onServerEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = String(event.type || "");

      if (type === "error") {
        const err = event.error as { message?: string } | undefined;
        const msg = err?.message || "luna";
        setErrMsg(msg);
        setTranscript(msg);
        setState("error");
        return;
      }

      if (type === "input_audio_buffer.speech_started") {
        // You started talking — she stops. No exceptions while audio is up.
        if (
          stateRef.current === "speaking" ||
          stateRef.current === "thinking" ||
          playingSourcesRef.current.size > 0
        ) {
          bargeIn();
        } else {
          setState("listening");
          setTranscript("Listening…");
        }
      }
      if (type === "input_audio_buffer.speech_stopped") {
        setState("thinking");
        caseyTextRef.current = "";
      }

      if (
        type === "conversation.item.input_audio_transcription.completed" ||
        type === "conversation.item.input_audio_transcription.updated"
      ) {
        const t = String(event.transcript || "");
        if (t) {
          userTextRef.current = t;
          pushTurn("user", t);
          setTranscript(`You: ${t}`);
        }
      }

      if (
        type === "response.output_audio_transcript.delta" ||
        type === "response.audio_transcript.delta"
      ) {
        const d = String(event.delta || "");
        if (d) {
          caseyTextRef.current += d;
          setTranscript(`Casey: ${caseyTextRef.current}`);
        }
      }
      if (
        type === "response.output_audio_transcript.done" ||
        type === "response.audio_transcript.done"
      ) {
        const t = String(event.transcript || caseyTextRef.current || "");
        if (t) {
          caseyTextRef.current = t;
          pushTurn("assistant", t);
          setTranscript(`Casey: ${t}`);
        }
      }

      if (
        type === "response.output_audio.delta" ||
        type === "response.audio.delta"
      ) {
        const delta = String(event.delta || event.audio || "");
        if (!delta) return;
        // After barge-in, ignore leftover assistant audio for a full second
        if (Date.now() - bargeLockRef.current < 1000) return;
        playPcmChunk(base64ToInt16(delta));
      }

      if (type === "response.done") {
        assistantTurnsRef.current += 1;
        if (caseyTextRef.current) pushTurn("assistant", caseyTextRef.current);
        // Opener finished — now accept mic + barge-in
        openerGateRef.current = Date.now();
        if (stateRef.current !== "error") {
          setState("listening");
          if (!caseyTextRef.current) setTranscript("Listening… go ahead.");
        }
        if (assistantTurnsRef.current >= 3) setOfferMeet(true);
      }
    },
    [bargeIn, playPcmChunk, pushTurn]
  );

  const startCall = useCallback(async () => {
    if (activeRef.current) {
      hangup();
      setState("idle");
      setTranscript("Call ended.");
      return;
    }

    setErrMsg("");
    setOfferMeet(false);
    caseyTextRef.current = "";
    userTextRef.current = "";
    assistantTurnsRef.current = 0;
    turnsRef.current = [];
    startedAtRef.current = Date.now();
    setState("connecting");
    setTranscript("Connecting Casey…");
    activeRef.current = true;

    try {
      const sessionRes = await fetch("/api/voice/session", { method: "POST" });
      if (!sessionRes.ok) throw new Error("Could not start voice session");
      const session = await sessionRes.json();
      const token = session.token as string;
      const instructions = session.instructions as string;
      const opener =
        (session.opener as string) || "luna";

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const micCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      micCtxRef.current = micCtx;
      if (micCtx.state === "suspended") await micCtx.resume();

      const playCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      playCtxRef.current = playCtx;
      if (playCtx.state === "suspended") await playCtx.resume();
      nextPlayRef.current = 0;

      const ws = new WebSocket(
        "wss://api.x.ai/v1/realtime?model=grok-voice-latest",
        [`xai-client-secret.${token}`]
      );
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(
          () => reject(new Error("Voice connect timeout")),
          15000
        );
        ws.onopen = () => {
          window.clearTimeout(timer);
          resolve();
        };
        ws.onerror = () => {
          window.clearTimeout(timer);
          reject(new Error("Voice socket failed"));
        };
      });

      if (!activeRef.current) {
        hangup();
        return;
      }

      ws.send(
        JSON.stringify({
          type: "session.update",
          session: {
            voice: (session.voice as string) || "luna",
            instructions,
            turn_detection: {
              type: "server_vad",
              threshold: 0.4,
              prefix_padding_ms: 350,
              silence_duration_ms: 1200,
            },
            input_audio_transcription: { model: "whisper-1" },
            audio: {
              input: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
              output: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
            },
          },
        })
      );

      ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "force_message",
            role: "assistant",
            interruptible: true,
            content: [{ type: "output_text", text: opener }],
          },
        })
      );
      pushTurn("assistant", opener);

      ws.onmessage = (ev) => {
        if (typeof ev.data !== "string") return;
        try {
          onServerEvent(JSON.parse(ev.data) as Record<string, unknown>);
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        if (activeRef.current) {
          activeRef.current = false;
          hangup();
          setState("idle");
          setTranscript("Call ended.");
        }
      };

      const source = micCtx.createMediaStreamSource(stream);
      const analyser = micCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const processor = micCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      const mute = micCtx.createGain();
      mute.gain.value = 0;
      processor.connect(mute);
      mute.connect(micCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!activeRef.current || ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const gateOpen = Date.now() >= openerGateRef.current;

        // Hold mic off during opener so server VAD doesn't cancel her first line
        if (!gateOpen) return;

        // Instant local interrupt as soon as your voice rises over hers
        if (
          (stateRef.current === "speaking" ||
            stateRef.current === "thinking" ||
            playingSourcesRef.current.size > 0) &&
          rms(input) > BARGE_RMS
        ) {
          bargeIn();
        }

        const pcm = floatTo16BitPCM(input);
        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: pcm16ToBase64(pcm),
          })
        );

        if (stateRef.current === "listening") {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          setLevels(
            Array.from({ length: BARS }, (_, i) => {
              const v = data[Math.floor((i / BARS) * data.length)] ?? 0;
              return 0.12 + (v / 255) * 0.88;
            })
          );
        }
      };

      // Stay quiet until Casey's opener starts — flipping to "listening" early
      // was dropping her first audio deltas.
      setState("thinking");
      setTranscript("Casey is about to talk…");
      openerGateRef.current = Date.now() + 4000;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start Casey";
      setErrMsg(msg);
      setTranscript(msg);
      activeRef.current = false;
      hangup();
      setState("error");
    }
  }, [bargeIn, hangup, onServerEvent, pushTurn]);

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
      <button
        type="button"
        className="talk"
        onClick={startCall}
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
        Grok Voice · luna · cut her off · we keep a private transcript for tuning
      </p>
    </div>
  );
}
