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

let widgetLoad: Promise<void> | null = null;

function loadCalendly(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Calendly?.initPopupWidget) return Promise.resolve();
  if (widgetLoad) return widgetLoad;

  widgetLoad = new Promise((resolve) => {
    if (!document.querySelector("link[data-calendly]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = WIDGET_CSS;
      css.dataset.calendly = "true";
      document.head.appendChild(css);
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-calendly]");
    const finish = () => resolve();
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", finish, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    script.dataset.calendly = "true";
    script.onload = finish;
    script.onerror = finish;
    document.body.appendChild(script);
  });

  return widgetLoad;
}

function openCalendly(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  void loadCalendly().then(() => {
    if (window.Calendly?.initPopupWidget) {
      window.Calendly.initPopupWidget({ url: DAVE_CALENDLY_URL });
      return;
    }
    window.open(DAVE_CALENDLY_URL, "_blank", "noopener,noreferrer");
  });
}

export default function BookDave({ live = false }: { live?: boolean }) {
  useEffect(() => {
    void loadCalendly();
  }, []);

  return (
    <a className={live ? "book book--live" : "book"} href={DAVE_CALENDLY_URL} onClick={openCalendly}>
      {DAVE_LABEL}
    </a>
  );
}
