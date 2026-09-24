"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "aidvance-click-sound";
/** Kenney Interface Sounds, click_001. CC0. https://kenney.nl/assets/interface-sounds */
const CLICK_URL = "/sounds/mechanical-click.wav";
const CTA = ".talk, .book, .site-cta, .again";

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let loading: Promise<AudioBuffer | null> | null = null;

function soundOff() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  const webkit = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const Ctor = window.AudioContext ?? webkit;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

function loadClick(): Promise<AudioBuffer | null> {
  const c = audioContext();
  if (!c) return Promise.resolve(null);
  if (buffer) return Promise.resolve(buffer);
  if (!loading) {
    loading = fetch(CLICK_URL)
      .then((res) => {
        if (!res.ok) throw new Error("missing click");
        return res.arrayBuffer();
      })
      .then((data) => c.decodeAudioData(data.slice(0)))
      .then((decoded) => {
        buffer = decoded;
        return decoded;
      })
      .catch(() => null);
  }
  return loading;
}

/** Open the audio device during a user gesture. Does not play anything. */
function unlock() {
  const c = audioContext();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  void loadClick();
}

function playClick() {
  const c = audioContext();
  if (!c || !buffer) {
    void loadClick().then((decoded) => {
      if (!decoded) return;
      const live = audioContext();
      if (!live) return;
      void live.resume();
      startBuffer(live, decoded);
    });
    return;
  }
  // resume() and start() both run in this gesture, so the first tap is audible.
  void c.resume();
  startBuffer(c, buffer);
}

function startBuffer(c: AudioContext, buf: AudioBuffer) {
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buf;
  gain.gain.value = 0.48;
  src.connect(gain);
  gain.connect(c.destination);
  try {
    src.start();
  } catch {
    /* The buffer can only start once. A later press creates a new source. */
  }
}

function buzz() {
  try {
    navigator.vibrate?.(10);
  } catch {
    /* No vibration API, or the call was blocked. */
  }
}

export default function ClickSound() {
  useEffect(() => {
    void loadClick();

    const onPointerDown = () => unlock();
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest(CTA);
      if (!control || control.classList.contains("sound-toggle")) return;
      if (control instanceof HTMLButtonElement && control.disabled) return;
      if (soundOff() || reducedMotion()) return;
      playClick();
      buzz();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}

export function SoundToggle() {
  const [off, setOff] = useState(false);

  useEffect(() => {
    setOff(soundOff());
  }, []);

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={!off}
      title={off ? "Click sound is off" : "Click sound is on"}
      onClick={() => {
        const next = !soundOff();
        setOff(next);
        try {
          localStorage.setItem(STORAGE_KEY, next ? "off" : "on");
        } catch {
          /* Private mode can block storage. The toggle still updates this view. */
        }
      }}
    >
      {off ? "Muted" : "Sound"}
    </button>
  );
}
