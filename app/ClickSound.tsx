"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "aidvance-click-sound";

/** Short soft tick. Peak is already low; playback volume stays under 0.35. */
const CLICK_WAV =
  "data:audio/wav;base64,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";

const CTA = ".talk, .book, .site-cta, .again";

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

function playTick() {
  const node = new Audio(CLICK_WAV);
  node.volume = 0.32;
  void node.play().catch(() => {
    /* A browser can still reject playback. The press itself still works. */
  });
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
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest(CTA);
      if (!control || control.classList.contains("sound-toggle")) return;
      if (control instanceof HTMLButtonElement && control.disabled) return;
      if (soundOff() || reducedMotion()) return;
      playTick();
      buzz();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
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
