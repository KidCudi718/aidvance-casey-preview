"use client";

import { useEffect, type MouseEvent } from "react";

export const DAVE_CALENDLY_URL = "https://calendly.com/aidvancexyz/15min";
export const DAVE_LABEL = "Book a FREE 15 Minute Chat with Dave";

type CalendlyWidget = {
  initPopupWidget: (options: { url: string }) => void;
};

declare global {
  interface Window {
    Calendly?: CalendlyWidget;
  }
}

const WIDGET_SRC = "https://assets.calendly.com/assets/external/widget.js";
const WIDGET_CSS = "https://assets.calendly.com/assets/external/widget.css";

let widgetLoad: Promise<boolean> | null = null;

function loadCalendly(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Calendly?.initPopupWidget) return Promise.resolve(true);
  if (widgetLoad) return widgetLoad;

  widgetLoad = new Promise((resolve) => {
    if (!document.querySelector("link[data-calendly]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = WIDGET_CSS;
      css.dataset.calendly = "true";
      document.head.appendChild(css);
    }

    const finish = (ok: boolean) => resolve(ok);
    const watch = (script: HTMLScriptElement) => {
      if (window.Calendly?.initPopupWidget || script.dataset.ready === "true") {
        finish(Boolean(window.Calendly?.initPopupWidget));
        return;
      }
      script.addEventListener(
        "load",
        () => {
          script.dataset.ready = "true";
          finish(Boolean(window.Calendly?.initPopupWidget));
        },
        { once: true },
      );
      script.addEventListener("error", () => finish(false), { once: true });
    };

    const existing = document.querySelector<HTMLScriptElement>("script[data-calendly]");
    if (existing) {
      watch(existing);
      return;
    }

    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    script.dataset.calendly = "true";
    script.onload = () => {
      script.dataset.ready = "true";
      finish(Boolean(window.Calendly?.initPopupWidget));
    };
    script.onerror = () => finish(false);
    document.body.appendChild(script);
  });

  return widgetLoad;
}

/**
 * Same open path on phone, tablet, laptop, and desktop: Calendly's popup
 * overlay on this page. Never navigate, never target=_blank, never mail.
 * On some phones Calendly also sets document.body position:fixed, which can
 * suspend the call's audio element. Undo that pin when it happens.
 */
function releaseBodyPin() {
  const body = document.body;
  if (body.style.position !== "fixed") return;
  const top = body.style.top;
  const y = top ? -parseInt(top, 10) : window.scrollY;
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.overflow = "";
  body.style.paddingRight = "";
  if (Number.isFinite(y)) window.scrollTo(0, y);
}

export function preloadDaveCalendly() {
  void loadCalendly();
}

function openCalendly(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
  void loadCalendly().then((ready) => {
    if (!ready || !window.Calendly?.initPopupWidget) return;
    window.Calendly.initPopupWidget({ url: DAVE_CALENDLY_URL });
    releaseBodyPin();
    window.setTimeout(releaseBodyPin, 0);
    window.setTimeout(releaseBodyPin, 400);
  });
}

export default function BookDave({ live = false }: { live?: boolean }) {
  useEffect(() => {
    preloadDaveCalendly();
  }, []);

  return (
    <button
      type="button"
      className={live ? "book book--live" : "book"}
      onClick={openCalendly}
    >
      {DAVE_LABEL}
    </button>
  );
}
