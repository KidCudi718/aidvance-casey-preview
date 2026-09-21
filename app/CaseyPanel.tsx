"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

const BARS = 28;
const SAMPLE_RATE = 24000;

const LABELS: Record<State, string> = {
  idle: "Press once. Talk normally.",
  connecting: "Connecting Casey…",
  listening: "Listening… go ahead.",
  thinking: "Casey is thinking…",
  speaking: "Casey is talking",
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

export default function CaseyPanel({ pains }: { pains: string[] }) {
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState("Casey is ready when you are.");
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.18));
  const [offerMeet, setOfferMeet] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const stateRef = useRef<State>("idle");
  const painsRef = useRef(pains);
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

  painsRef.current = pains;
  stateRef.current = state;

  const stopWave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setLevels(Array(BARS).fill(0.18));
  }, []);

  const hangup = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
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
    nextPlayRef.current = 0;
    stopWave();
  }, [stopWave]);

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

      src.onended = () => {
        if (
          playCtxRef.current &&
          playCtxRef.current.currentTime >= nextPlayRef.current - 0.08
        ) {
          if (stateRef.current === "speaking") {
            setState("listening");
            setOfferMeet(true);
            stopWave();
          }
        }
      };
    },
    [stopWave]
  );

  const onServerEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = String(event.type || "");

      if (type === "error") {
        const err = event.error as { message?: string } | undefined;
        const msg = err?.message || "Voice error";
        setErrMsg(msg);
        setTranscript(msg);
        setState("error");
        return;
      }

      if (type === "input_audio_buffer.speech_started") {
        setState("listening");
        setTranscript("Listening…");
      }
      if (type === "input_audio_buffer.speech_stopped") {
        setState("thinking");
        setTranscript("Casey is thinking…");
        caseyTextRef.current = "";
      }

      if (
        type === "conversation.item.input_audio_transcription.completed" ||
        type === "conversation.item.input_audio_transcription.updated"
      ) {
        const t = String(event.transcript || "");
        if (t) setTranscript(`You: ${t}`);
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
        if (t) setTranscript(`Casey: ${t}`);
      }

      if (
        type === "response.output_audio.delta" ||
        type === "response.audio.delta"
      ) {
        const delta = String(event.delta || event.audio || "");
        if (delta) playPcmChunk(base64ToInt16(delta));
      }

      if (type === "response.done") {
        setOfferMeet(true);
      }
    },
    [playPcmChunk]
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
    setState("connecting");
    setTranscript("Connecting Casey…");
    activeRef.current = true;

    try {
      const sessionRes = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pains: painsRef.current }),
      });
      if (!sessionRes.ok) throw new Error("Could not start voice session");
      const session = await sessionRes.json();
      const token = session.token as string;
      const instructions = session.instructions as string;

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
            voice: "eve",
            instructions,
            turn_detection: { type: "server_vad" },
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
            content: [
              {
                type: "output_text",
                text: "Hey — I'm Casey, Aidvance's AI guide. What's eating your week?",
              },
            ],
          },
        })
      );

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

      const processor = micCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      const mute = micCtx.createGain();
      mute.gain.value = 0;
      processor.connect(mute);
      mute.connect(micCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!activeRef.current || ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
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

      setState("listening");
      setTranscript("Listening… go ahead.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start Casey";
      setErrMsg(msg);
      setTranscript(msg);
      activeRef.current = false;
      hangup();
      setState("error");
    }
  }, [hangup, onServerEvent]);

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
          Book a short working meeting with Dave →
        </a>
      ) : null}
      <p className="hint">
        Real Grok Voice · eve · mic stays in your browser · preview only
      </p>
    </div>
  );
}
