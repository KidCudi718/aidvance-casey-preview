"use client";

import { useEffect, useRef } from "react";
import type { CallVisual } from "./lips";

export type PresenceMode = "bars" | "line" | "circle";

const BAR_COUNT = 34;
const LINE_POINTS = 96;
const INK = "#f4f4f2";

/** Rise is the sample itself. Release only knocks down single-frame sparkle. */
const ATTACK = 1;
const RELEASE = 0.4;

function follow(cur: number, target: number) {
  const k = target > cur ? ATTACK : RELEASE;
  return cur + (target - cur) * k;
}

function breathScale(now: number) {
  const phase = (now / 1000) * ((Math.PI * 2) / 5.4);
  return 1.03 + 0.03 * Math.sin(phase);
}

function speechScale(rms: number) {
  const open = Math.min(1, Math.max(0, (rms - 0.004) * 16));
  return 1 + open * 0.26;
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
    let time = new Uint8Array(0);
    let disc = 1;
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

    const readRms = (node: AnalyserNode) => {
      if (time.length !== node.fftSize) time = new Uint8Array(node.fftSize);
      node.getByteTimeDomainData(time);
      let sum = 0;
      for (let i = 0; i < time.length; i++) {
        const v = ((time[i] ?? 128) - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / time.length);
    };

    const pullFreq = (node: AnalyserNode, count: number, into: Float32Array) => {
      if (freq.length !== node.frequencyBinCount) {
        freq = new Uint8Array(node.frequencyBinCount);
      }
      node.getByteFrequencyData(freq);
      const nyquist = node.context.sampleRate / 2;
      const binHz = nyquist / freq.length;
      const i0 = Math.max(0, Math.floor(70 / binHz));
      const i1 = Math.min(freq.length - 1, Math.ceil(4200 / binHz));
      const span = Math.max(1, i1 - i0 + 1);
      for (let i = 0; i < count; i++) {
        const a = i0 + Math.floor((i / count) * span);
        const b = i0 + Math.floor(((i + 1) / count) * span);
        const end = Math.min(freq.length, Math.max(a + 1, b));
        let sum = 0;
        let n = 0;
        for (let k = a; k < end; k++) {
          sum += freq[k] ?? 0;
          n++;
        }
        const v = n ? sum / (n * 255) : 0;
        const target = Math.min(1, Math.pow(v, 0.8));
        into[i] = follow(into[i] ?? 0, target);
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
      const speaking =
        call === "speaking" && !!node && node.context.state !== "closed";

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 1;

      if (visual === "circle") {
        const target = speaking
          ? speechScale(readRms(node as AnalyserNode))
          : reduced
            ? 1
            : breathScale(now);
        disc = follow(disc, target);
        drawCircle(ctx, w, h, disc);
      } else if (visual === "bars") {
        if (speaking && node) pullFreq(node, BAR_COUNT, bars);
        else bars.fill(0.05);
        drawBars(ctx, w, h, bars);
      } else if (speaking && node) {
        pullFreq(node, LINE_POINTS, line);
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

function drawCircle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number
) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = Math.max(8, Math.min(w, h) * 0.24 * scale);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.lineWidth = 1.25;
  ctx.globalAlpha = 0.55;
  ctx.arc(cx, cy, r * 1.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
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
    const amp = Math.max(0, Math.min(1, levels[i] ?? 0));
    const y = mid - amp * h * 0.3;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
