"use client";

import { useEffect, useRef } from "react";
import { createMouthEnv, drawLips, stepMouth, type CallVisual } from "./lips";

export default function LipPresence({
  state,
  analyser,
}: {
  state: CallVisual;
  analyser: AnalyserNode | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const analyserRef = useRef(analyser);
  stateRef.current = state;
  analyserRef.current = analyser;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const env = createMouthEnv();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    const onMQ = () => {
      reduced = mq.matches;
    };
    mq.addEventListener("change", onMQ);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const frame = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const pose = stepMouth(env, stateRef.current, analyserRef.current, now, reduced);
      drawLips(ctx, rect.width, rect.height, pose);
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
    <div className="mouth">
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
