export type CallVisual =
  | "idle"
  | "requesting_mic"
  | "listening"
  | "thinking"
  | "speaking"
  | "done"
  | "error";

export type MouthPose = {
  /** 0 closed, 1 open vowel. */
  jaw: number;
  /** Wide / sibilant. */
  spread: number;
  /** Rounded “oh”. */
  round: number;
};

export type MouthEnv = {
  jaw: number;
  spread: number;
  round: number;
  peak: number;
  time: Uint8Array;
  freq: Uint8Array;
};

type Pt = { x: number; y: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function follow(cur: number, target: number, attack: number, release: number) {
  const k = target > cur ? attack : release;
  return cur + (target - cur) * k;
}

export function createMouthEnv(): MouthEnv {
  return {
    jaw: 0.06,
    spread: 0.05,
    round: 0.12,
    peak: 0.04,
    time: new Uint8Array(1024),
    freq: new Uint8Array(512),
  };
}

function ensureBuffers(env: MouthEnv, analyser: AnalyserNode) {
  if (env.time.length !== analyser.fftSize) env.time = new Uint8Array(analyser.fftSize);
  if (env.freq.length !== analyser.frequencyBinCount) {
    env.freq = new Uint8Array(analyser.frequencyBinCount);
  }
}

function band(freq: Uint8Array, sampleRate: number, lo: number, hi: number) {
  const nyquist = sampleRate / 2;
  const binHz = nyquist / freq.length;
  let i0 = Math.floor(lo / binHz);
  let i1 = Math.ceil(hi / binHz);
  if (i0 < 0) i0 = 0;
  if (i1 >= freq.length) i1 = freq.length - 1;
  if (i1 < i0) return 0;
  let sum = 0;
  for (let i = i0; i <= i1; i++) sum += freq[i];
  return sum / ((i1 - i0 + 1) * 255);
}

/**
 * Lip envelope. Jaw follows her output level with a fast open and a slightly
 * slower close, so syllables read as a mouth and not a flickering meter.
 * Spread / round come from speech bands (sibilants vs open vowels).
 */
export function stepMouth(
  env: MouthEnv,
  state: CallVisual,
  analyser: AnalyserNode | null,
  now: number,
  reduced: boolean
): MouthPose {
  const t = now / 1000;
  let jawT = 0.05;
  let spreadT = 0.05;
  let roundT = 0.12;
  let attack = 0.18;
  let release = 0.14;

  if (state === "speaking" && analyser && analyser.context.state !== "closed") {
    ensureBuffers(env, analyser);
    analyser.getByteTimeDomainData(env.time);
    analyser.getByteFrequencyData(env.freq);

    let sum = 0;
    for (let i = 0; i < env.time.length; i++) {
      const v = (env.time[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / env.time.length);
    const rate = analyser.context.sampleRate;
    const low = band(env.freq, rate, 160, 450);
    const mid = band(env.freq, rate, 450, 1700);
    const high = band(env.freq, rate, 1800, 5600);

    const speech = Math.max(rms * 2.8, low * 0.55 + mid * 0.95 + high * 0.4);
    const gated = Math.max(0, speech - 0.02);
    // Decay the recent peak quickly enough that the next word can open the mouth again.
    env.peak = Math.max(gated, env.peak * 0.96);
    const norm = env.peak > 0.012 ? clamp(gated / env.peak, 0, 1) : 0;
    jawT = Math.pow(norm, 0.58);

    const mix = low + mid + high + 1e-4;
    const highR = high / mix;
    const lowR = low / mix;
    if (highR > 0.4 && jawT > 0.05) jawT *= 0.64;
    spreadT = jawT < 0.06 ? 0.06 : clamp((highR - 0.22) * 2.5, 0, 1);
    roundT = jawT < 0.06 ? 0.12 : clamp((lowR - 0.32) * 2.5, 0, 1);
    attack = 0.72;
    release = 0.34;
  } else if (state === "listening") {
    // Distinct from speech and from the still idle mouth.
    const pulse = reduced ? 0.09 : 0.05 + (0.5 + 0.5 * Math.sin(t * 2.1)) * 0.18;
    jawT = pulse;
    spreadT = 0.08;
    roundT = 0.16;
    attack = reduced ? 1 : 0.22;
    release = reduced ? 1 : 0.16;
  } else {
    // Idle, mic prompt, thinking, done, error: held still. No false "she's live" motion.
    jawT = state === "thinking" ? 0.02 : 0.045;
    spreadT = 0.04;
    roundT = 0.1;
    attack = 1;
    release = 1;
  }

  env.jaw = follow(env.jaw, jawT, attack, release);
  env.spread = follow(env.spread, spreadT, state === "speaking" ? 0.2 : attack, 0.12);
  env.round = follow(env.round, roundT, state === "speaking" ? 0.16 : attack, 0.1);

  return { jaw: env.jaw, spread: env.spread, round: env.round };
}

function curve(path: Path2D, pts: Pt[], closed: boolean) {
  const n = pts.length;
  if (n < 2) return;
  path.moveTo(pts[0].x, pts[0].y);
  const seg = closed ? n : n - 1;
  for (let i = 0; i < seg; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i % n];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    if (!closed && i === n - 1) break;
    path.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y
    );
  }
  if (closed) path.closePath();
}

/**
 * A close crop of a mouth. Pale lips on a dark room.
 * The opening is inset from the corners so the lips stay sealed at the edges
 * and part from the center — the way a mouth does, not the way a circle grows.
 */
export function drawLips(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pose: MouthPose
) {
  const jaw = clamp(pose.jaw, 0, 1);
  const spread = clamp(pose.spread, 0, 1);
  const round = clamp(pose.round, 0, 1);
  const open = Math.pow(jaw, 0.78);

  ctx.clearRect(0, 0, w, h);

  const xScale = 1 + spread * 0.07 - round * 0.13;
  const half = Math.min(w * 0.4, h * 0.62) * xScale;
  const cx = w * 0.5;
  const cy = h * 0.47;
  const pt = (nx: number, ny: number): Pt => ({ x: cx + nx * half, y: cy + ny * half });

  const cornerDrop = open * 0.018;
  const left = pt(-1, 0.016 + cornerDrop);
  const right = pt(1, 0.016 + cornerDrop);

  const upperSpec: Array<[number, number]> = [
    [-0.84, -0.03],
    [-0.64, -0.08],
    [-0.44, -0.122],
    [-0.26, -0.164],
    [-0.15, -0.196],
    [-0.07, -0.15],
    [0, -0.112],
    [0.07, -0.15],
    [0.15, -0.196],
    [0.26, -0.164],
    [0.44, -0.122],
    [0.64, -0.08],
    [0.84, -0.03],
  ];
  const upperOuter: Pt[] = [left];
  for (const [nx, ny] of upperSpec) {
    const c = Math.pow(1 - Math.min(1, Math.abs(nx)), 1.2);
    upperOuter.push(pt(nx, ny - open * 0.022 * c));
  }
  upperOuter.push(right);

  const lowerSpec: Array<[number, number]> = [
    [0.86, 0.09],
    [0.66, 0.17],
    [0.44, 0.242],
    [0.22, 0.292],
    [0, 0.318],
    [-0.22, 0.292],
    [-0.44, 0.242],
    [-0.66, 0.17],
    [-0.86, 0.09],
  ];
  const lowerOuter: Pt[] = [right];
  for (const [nx, ny] of lowerSpec) {
    const c = Math.pow(1 - Math.min(1, Math.abs(nx)), 0.85);
    const drop = open * (0.045 + 0.3 * c) * (1 - spread * 0.16 + round * 0.08);
    lowerOuter.push(pt(nx, ny + drop));
  }
  lowerOuter.push(left);

  const seam: Pt[] = [left];
  for (let i = 1; i < 16; i++) {
    const nx = -1 + (2 * i) / 16;
    const sag = 0.008 * (1 - nx * nx);
    seam.push(pt(nx, 0.016 + sag + open * 0.01 * (1 - nx * nx)));
  }
  seam.push(right);

  const upperPts = upperOuter.concat(seam.slice(1, -1).reverse());
  const upperPath = new Path2D();
  curve(upperPath, upperPts, true);

  const lowerPts = seam.concat(lowerOuter.slice(1, -1));
  const lowerPath = new Path2D();
  curve(lowerPath, lowerPts, true);

  const apRx = half * (0.15 + open * 0.72) * (1 + spread * 0.1 - round * 0.2);
  const apRyTop = half * open * (0.1 + round * 0.04) * (1 - spread * 0.28);
  const apRyBot = half * open * (0.17 + round * 0.055) * (1 - spread * 0.2);
  const apCy = cy + half * (0.016 + open * 0.018);
  const aperture = new Path2D();
  const openEnough = apRyTop + apRyBot > 0.8;
  if (openEnough) {
    aperture.moveTo(cx - apRx, apCy);
    aperture.quadraticCurveTo(cx, apCy - apRyTop * 2, cx + apRx, apCy);
    aperture.quadraticCurveTo(cx, apCy + apRyBot * 2, cx - apRx, apCy);
    aperture.closePath();
  }

  const lowerGrad = ctx.createLinearGradient(cx, cy, cx, cy + half * (0.36 + open * 0.28));
  lowerGrad.addColorStop(0, "#c2c2bc");
  lowerGrad.addColorStop(0.26, "#f5f5f2");
  lowerGrad.addColorStop(0.52, "#ffffff");
  lowerGrad.addColorStop(1, "#d2d2cc");
  ctx.fillStyle = lowerGrad;
  ctx.fill(lowerPath);

  const upperGrad = ctx.createLinearGradient(cx, cy - half * 0.24, cx, cy + half * 0.03);
  upperGrad.addColorStop(0, "#fbfbf8");
  upperGrad.addColorStop(0.4, "#e3e3de");
  upperGrad.addColorStop(1, "#babab4");
  ctx.fillStyle = upperGrad;
  ctx.fill(upperPath);

  if (open < 0.72) {
    ctx.save();
    ctx.clip(lowerPath);
    const shade = ctx.createLinearGradient(cx, cy - 2, cx, cy + half * 0.09);
    shade.addColorStop(0, `rgba(0,0,0,${0.26 * (1 - open)})`);
    shade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shade;
    ctx.fillRect(cx - half, cy - 4, half * 2, half * 0.18);
    ctx.restore();
  }

  ctx.save();
  ctx.clip(lowerPath);
  const spec = ctx.createRadialGradient(
    cx,
    cy + half * (0.11 + open * 0.16),
    half * 0.02,
    cx,
    cy + half * (0.15 + open * 0.16),
    half * 0.46
  );
  spec.addColorStop(0, "rgba(255,255,255,0.95)");
  spec.addColorStop(0.4, "rgba(255,255,255,0.28)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.fillRect(cx - half, cy, half * 2, half);
  ctx.restore();

  if (openEnough) {
    const cavity = ctx.createLinearGradient(cx, apCy - apRyTop, cx, apCy + apRyBot);
    cavity.addColorStop(0, "#161616");
    cavity.addColorStop(0.42, "#070707");
    cavity.addColorStop(1, "#000000");
    ctx.fillStyle = cavity;
    ctx.fill(aperture);

    if (open > 0.16) {
      ctx.save();
      ctx.clip(aperture);
      const tw = apRx * (0.6 + spread * 0.14);
      const toothTop = apCy - apRyTop * 0.95;
      const toothBot = apCy - apRyTop * 0.16;
      ctx.beginPath();
      ctx.moveTo(cx - tw, toothBot);
      ctx.quadraticCurveTo(cx, toothTop - apRyTop * 0.12, cx + tw, toothBot);
      ctx.quadraticCurveTo(cx, toothBot + apRyTop * 0.2, cx - tw, toothBot);
      ctx.closePath();
      const teeth = ctx.createLinearGradient(cx, toothTop, cx, toothBot);
      teeth.addColorStop(0, "rgba(255,255,255,0.94)");
      teeth.addColorStop(1, "rgba(186,186,182,0.05)");
      ctx.fillStyle = teeth;
      ctx.fill();

      if (open > 0.5) {
        const lw = apRx * 0.46;
        const lt = apCy + apRyBot * 0.4;
        const lb = apCy + apRyBot * 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - lw, lt);
        ctx.quadraticCurveTo(cx, lb, cx + lw, lt);
        ctx.quadraticCurveTo(cx, lt, cx - lw, lt);
        ctx.closePath();
        ctx.fillStyle = "rgba(232,232,228,0.5)";
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = Math.max(1, half * 0.008);
      ctx.stroke(aperture);
    }
  }

  const seamAlpha = clamp(1 - open / 0.11, 0, 1);
  if (seamAlpha > 0.03) {
    ctx.beginPath();
    ctx.moveTo(left.x + half * 0.02, left.y + half * 0.004);
    ctx.quadraticCurveTo(cx, cy + half * 0.03, right.x - half * 0.02, right.y + half * 0.004);
    ctx.strokeStyle = `rgba(30,30,30,${0.55 * seamAlpha})`;
    ctx.lineWidth = Math.max(1.15, half * 0.008);
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

/**
 * Read levels from the agent audio elements Speko appends to document.body.
 * Taps the MediaStream in parallel — playback stays on the element, so
 * unmute / volume / barge-in are untouched.
 */
export function watchAgentAudio(ctx: AudioContext, analyser: AnalyserNode): () => void {
  const tapped = new WeakSet<HTMLMediaElement>();
  const sources: MediaStreamAudioSourceNode[] = [];

  const scan = () => {
    if (ctx.state === "closed") return;
    document.querySelectorAll("audio").forEach((el) => {
      if (tapped.has(el)) return;
      const stream = el.srcObject;
      if (!(stream instanceof MediaStream) || stream.getAudioTracks().length === 0) return;
      try {
        const src = ctx.createMediaStreamSource(stream);
        src.connect(analyser);
        sources.push(src);
        tapped.add(el);
      } catch {
        /* not ready — next scan retries */
      }
    });
  };

  scan();
  const obs = new MutationObserver(scan);
  obs.observe(document.body, { childList: true, subtree: true });
  const timer = window.setInterval(scan, 400);

  return () => {
    obs.disconnect();
    window.clearInterval(timer);
    for (const src of sources) {
      try {
        src.disconnect();
      } catch {
        /* ignore */
      }
    }
  };
}
