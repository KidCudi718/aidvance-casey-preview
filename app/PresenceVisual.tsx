"use client";

import { useEffect, useRef } from "react";
import type { CallVisual } from "./lips";

export type PresenceMode = "bars" | "line";

const BAR_COUNT = 34;
const LINE_POINTS = 128;
const INK = "#f4f4f2";

function isLive(state: CallVisual) {
  return state === "listening" || state === "speaking";
}

export default function PresenceVisual({
  state,
  analyser,
  mode,
}: {
  state: CallVisual;
  analyser: AnalyserNode | null;
  mode: PresenceMode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const analyserRef = useRef(analyser);
  const modeRef = useRef(mode);
  stateRef.current = state;
  analyserRef.current = analyser;
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bars = new Float32Array(BAR_COUNT).fill(0.05);
    const line = new Float32Array(LINE_POINTS).fill(0);
    let freq = new Uint8Array(0);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    const onMQ = () => {
      reduced = mq.matches;
    };
    mq.addEventListener("change", onMQ);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const pull = (analyserNode: AnalyserNode, count: number, into: Float32Array, gain: number) => {
      if (freq.length !== analyserNode.frequencyBinCount) {
        freq = new Uint8Array(analyserNode.frequencyBinCount);
      }
      analyserNode.getByteFrequencyData(freq);
      const span = Math.max(1, Math.floor(freq.length * 0.5));
      for (let i = 0; i < count; i++) {
        const idx = Math.min(span - 1, Math.floor((i / count) * span));
        const v = (freq[idx] ?? 0) / 255;
        const target = Math.pow(v, 0.7) * gain;
        const cur = into[i] ?? 0;
        into[i] = cur + (target - cur) * (target > cur ? 0.62 : 0.34);
      }
    };

    let raf = 0;
    const frame = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const visual = modeRef.current;
      const call = stateRef.current;
      const node = analyserRef.current;
      const live = isLive(call) && !reduced;
      const t = now / 1000;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (visual === "bars") {
        if (live && call === "speaking" && node && node.context.state !== "closed") {
          pull(node, BAR_COUNT, bars, 1);
        } else if (live && call === "listening") {
          for (let i = 0; i < BAR_COUNT; i++) {
            const wave = 0.5 + 0.5 * Math.sin(t * 2.15 + i * 0.38);
            const target = 0.06 + wave * 0.28;
            const cur = bars[i] ?? 0;
            bars[i] = cur + (target - cur) * 0.2;
          }
        } else {
          bars.fill(0.05);
        }
        drawBars(ctx, w, h, bars);
      } else if (live && call === "speaking" && node && node.context.state !== "closed") {
        pull(node, LINE_POINTS, line, 1);
        drawLine(ctx, w, h, line);
      } else if (live && call === "listening") {
        for (let i = 0; i < LINE_POINTS; i++) {
          const n = i / (LINE_POINTS - 1);
          line[i] = Math.sin(n * Math.PI * 3 + t * 2.4) * 0.22 * Math.sin(Math.PI * n);
        }
        drawLine(ctx, w, h, line);
      } else {
        line.fill(0);
        drawLine(ctx, w, h, line);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener("change", onMQ);
    };
  }, []);

  return (
    <div className="viz">
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  levels: Float32Array
) {
  const count = levels.length;
  const gap = Math.max(6, w * 0.008);
  const barW = Math.min(5, (w * 0.78 - gap * (count - 1)) / count);
  const total = count * barW + (count - 1) * gap;
  let x = (w - total) / 2;
  const mid = h * 0.5;
  for (let i = 0; i < count; i++) {
    const amp = Math.max(0.04, Math.min(1, levels[i] ?? 0));
    const half = Math.max(1, amp * h * 0.36);
    const y = Math.round(mid - half);
    ctx.fillRect(Math.round(x), y, Math.max(1, barW), Math.round(half * 2));
    x += barW + gap;
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  levels: Float32Array
) {
  const n = levels.length;
  const left = w * 0.08;
  const right = w * 0.92;
  const mid = h * 0.5;
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < n; i++) {
    const x = left + (i / (n - 1)) * (right - left);
    const amp = Math.max(-1, Math.min(1, levels[i] ?? 0));
    const y = mid - amp * h * 0.3;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
