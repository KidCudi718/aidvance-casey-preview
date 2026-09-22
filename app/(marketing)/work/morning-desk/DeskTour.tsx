"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const TOUR_KEY = "aidvance-morning-desk-tour";

type Step = {
  title: string;
  body: string;
  pick: (doc: Document) => HTMLElement | null;
};

const STEPS: Step[] = [
  {
    title: "What Morning Desk is",
    body: "Morning Desk is a sales dashboard built on your email inbox.",
    pick: (doc) => el(doc.querySelector(".mhtitle")),
  },
  {
    title: "Waiting on you",
    body: "These people wrote last. You have not answered yet. Oldest first.",
    pick: (doc) => sectionOf(doc.querySelector("#waiting")),
  },
  {
    title: "All, Buyers, Inside",
    body: "Use these toggles to see everyone, just buyers, or the people inside.",
    pick: (doc) => el(doc.querySelector(".tabs")),
  },
  {
    title: "On tap today",
    body: "Today is what is already on the desk: calls and follow-ups for this day.",
    pick: (doc) => sectionOf(doc.querySelector("#today")),
  },
  {
    title: "Talk to your inbox",
    body: "Ask the inbox a question. The answer points at the emails it came from. This sample is not a live mailbox.",
    pick: (doc) => sectionOf(doc.querySelector("#askform")),
  },
  {
    title: "Your week",
    body: "Your week at a glance, including how many accounts you touched.",
    pick: (doc) => sectionOf(doc.querySelector("#stats")),
  },
  {
    title: "You said you’d do this",
    body: "Promises pulled from mail you already sent. Check one off when it is done.",
    pick: (doc) => sectionOf(doc.querySelector("#promises")),
  },
  {
    title: "Gabe at school",
    body: "A personal calendar sits on the same desk, so life does not get missed while you work the inbox.",
    pick: (doc) => el(doc.querySelector(".panel.gabe")),
  },
  {
    title: "Gone quiet",
    body: "These conversations have gone quiet. Write a check-in, or start a draft. You still decide what sends.",
    pick: (doc) => sectionOf(doc.querySelector("#quiet")),
  },
  {
    title: "New business",
    body: "New business is already in the mail. Find me more takes another pass through this sample inbox.",
    pick: (doc) => sectionOf(doc.querySelector("#newbiz")),
  },
  {
    title: "Today’s read",
    body: "Today’s read is one pattern in the mailbox. Show me something else and it cuts the same mail a different way.",
    pick: (doc) => el(doc.querySelector(".insight")),
  },
  {
    title: "Done",
    body: "Keep clicking around. Nothing sends for real.",
    pick: (doc) => el(doc.querySelector(".mhtitle")),
  },
];

const TOUR_CSS = `
.aidv-mark{
  position:fixed; z-index:32;
  width:28px; height:28px; padding:0; margin:0;
  border-radius:50%; border:2px solid #fff; background:#C8201B; color:#fff;
  font-family:"IBM Plex Mono",ui-monospace,monospace;
  font-size:13px; font-weight:500; line-height:1; cursor:pointer;
  box-shadow:0 1px 4px rgba(0,0,0,.35);
  pointer-events:auto;
}
.aidv-mark.is-on{
  width:32px; height:32px; background:#9d120f;
  box-shadow:0 0 0 3px rgba(200,32,27,.35);
}
#aidv-card{
  position:fixed; z-index:33;
  width:min(340px, calc(100vw - 24px));
  padding:14px 14px 12px;
  background:#141414; color:#f4f4f2;
  border:1px solid rgba(244,244,242,.28); border-radius:8px;
  box-shadow:0 10px 28px rgba(0,0,0,.28);
  font-family:"Jost",system-ui,sans-serif;
  font-size:15px; line-height:1.45;
  pointer-events:auto;
}
#aidv-card[hidden]{display:none !important}
.aidv-kicker{
  margin:0 0 6px;
  font-family:"IBM Plex Mono",ui-monospace,monospace;
  font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  color:rgba(244,244,242,.62);
}
.aidv-title{
  margin:0 0 6px;
  font-family:"Newsreader",Georgia,serif;
  font-size:1.35rem; font-weight:400; letter-spacing:-.02em; line-height:1.15;
}
.aidv-body{margin:0; color:rgba(244,244,242,.9)}
.aidv-actions{display:flex; flex-wrap:wrap; gap:8px; margin-top:12px}
.aidv-actions button{
  font-family:"IBM Plex Mono",ui-monospace,monospace;
  font-size:11px; letter-spacing:.12em; text-transform:uppercase;
  min-height:40px; padding:0 12px; border-radius:3px; cursor:pointer;
}
.aidv-next{background:#f4f4f2; color:#111; border:1px solid #f4f4f2}
.aidv-back,.aidv-skip{background:transparent; color:#f4f4f2; border:1px solid rgba(244,244,242,.45)}
.aidv-back:disabled{opacity:.35; cursor:default}
`;

function el(node: Element | null): HTMLElement | null {
  // Iframe nodes are not instanceof this window's HTMLElement.
  if (node === null || node.nodeType !== 1) return null;
  return node as HTMLElement;
}

function sectionOf(node: Element | null): HTMLElement | null {
  return el(node?.closest("section") ?? null);
}

function remembered(): boolean {
  try {
    return window.localStorage.getItem(TOUR_KEY) !== null;
  } catch {
    return false;
  }
}

function remember(value: "done" | "skipped") {
  try {
    window.localStorage.setItem(TOUR_KEY, value);
  } catch {
    /* private mode can block storage; the tour still closes */
  }
}

function forget() {
  try {
    window.localStorage.removeItem(TOUR_KEY);
  } catch {
    /* ignore */
  }
}

type TourHandle = {
  start: () => void;
  stop: () => void;
};

function attachTour(frame: HTMLIFrameElement): TourHandle {
  const doc = frame.contentDocument;
  const view = frame.contentWindow;
  if (!doc || !view || !doc.head || !doc.body) {
    return { start() {}, stop() {} };
  }
  const win = view;

  doc.getElementById("aidv-tour-style")?.remove();
  doc.getElementById("aidv-card")?.remove();
  doc.querySelectorAll(".aidv-mark").forEach((node) => node.remove());

  const style = doc.createElement("style");
  style.id = "aidv-tour-style";
  style.textContent = TOUR_CSS;
  doc.head.appendChild(style);

  const card = doc.createElement("aside");
  card.id = "aidv-card";
  card.hidden = true;
  card.setAttribute("role", "region");
  card.setAttribute("aria-label", "Morning Desk tour");
  const kicker = doc.createElement("p");
  kicker.className = "aidv-kicker";
  const title = doc.createElement("p");
  title.className = "aidv-title";
  const body = doc.createElement("p");
  body.className = "aidv-body";
  const actions = doc.createElement("div");
  actions.className = "aidv-actions";
  const back = doc.createElement("button");
  back.type = "button";
  back.className = "aidv-back";
  back.textContent = "Back";
  const next = doc.createElement("button");
  next.type = "button";
  next.className = "aidv-next";
  next.textContent = "Next";
  const skip = doc.createElement("button");
  skip.type = "button";
  skip.className = "aidv-skip";
  skip.textContent = "Skip";
  actions.append(back, next, skip);
  card.append(kicker, title, body, actions);
  doc.body.appendChild(card);

  const hosts: HTMLElement[] = [];
  const marks: HTMLButtonElement[] = [];
  const shifts: number[] = [];
  const used = new Map<HTMLElement, number>();

  STEPS.forEach((step, index) => {
    const host = step.pick(doc);
    if (!host) return;
    const shift = used.get(host) ?? 0;
    used.set(host, shift + 1);
    const mark = doc.createElement("button");
    mark.type = "button";
    mark.className = "aidv-mark";
    mark.textContent = String(index + 1);
    mark.hidden = true;
    mark.dataset.aidvStep = String(index + 1);
    mark.setAttribute("aria-label", `Tour step ${index + 1}: ${step.title}`);
    mark.addEventListener("click", (event) => {
      event.stopPropagation();
      show(index);
    });
    doc.body.appendChild(mark);
    hosts.push(host);
    marks.push(mark);
    shifts.push(shift);
  });

  let index = 0;
  let open = false;
  let placeFrame = 0;

  const place = () => {
    if (!open) return;
    const narrow = win.innerWidth < 720;
    marks.forEach((mark, markIndex) => {
      const host = hosts[markIndex];
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const size = mark.classList.contains("is-on") ? 32 : 28;
      const shift = shifts[markIndex] ?? 0;
      let left = rect.left + 12 + shift * (size + 8);
      let top = rect.top - 8;
      if (left + size > win.innerWidth - 8) left = Math.max(8, win.innerWidth - size - 8);
      if (left < 8) left = 8;
      mark.style.left = `${left}px`;
      mark.style.top = `${top}px`;
    });

    if (narrow) {
      card.style.top = "auto";
      card.style.left = "12px";
      card.style.right = "12px";
      card.style.bottom = "12px";
      card.style.width = "auto";
      return;
    }

    const host = hosts[index];
    if (!host) return;
    card.style.right = "auto";
    card.style.bottom = "auto";
    card.style.width = "min(340px, calc(100vw - 24px))";
    const rect = host.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const width = box.width || 340;
    const height = box.height || 180;
    let left = rect.left;
    let top = rect.bottom + 12;
    if (top + height > win.innerHeight - 12) top = rect.top - height - 12;
    if (top < 12) top = 12;
    if (left + width > win.innerWidth - 12) left = win.innerWidth - width - 12;
    if (left < 12) left = 12;
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  };

  const schedulePlace = () => {
    win.cancelAnimationFrame(placeFrame);
    placeFrame = win.requestAnimationFrame(place);
  };

  function hide() {
    open = false;
    card.hidden = true;
    marks.forEach((mark) => {
      mark.hidden = true;
      mark.classList.remove("is-on");
    });
  }

  function show(nextIndex: number) {
    const host = hosts[nextIndex];
    const step = STEPS[nextIndex];
    if (!host || !step) return;
    open = true;
    index = nextIndex;
    card.hidden = false;
    kicker.textContent = `${nextIndex + 1} of ${STEPS.length}`;
    title.textContent = step.title;
    body.textContent = step.body;
    back.disabled = nextIndex === 0;
    next.textContent = nextIndex === STEPS.length - 1 ? "Done" : "Next";
    marks.forEach((mark, markIndex) => {
      mark.hidden = false;
      mark.classList.toggle("is-on", markIndex === nextIndex);
    });
    const narrow = win.innerWidth < 720;
    host.style.scrollMarginTop = "24px";
    host.style.scrollMarginBottom = narrow ? "220px" : "28px";
    const reduce = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
    host.scrollIntoView({
      block: narrow ? "start" : "center",
      behavior: reduce ? "auto" : "smooth",
    });
    schedulePlace();
    win.setTimeout(schedulePlace, reduce ? 0 : 360);
  }

  function finish(value: "done" | "skipped") {
    remember(value);
    hide();
  }

  back.addEventListener("click", () => {
    if (index > 0) show(index - 1);
  });
  next.addEventListener("click", () => {
    if (index >= hosts.length - 1) finish("done");
    else show(index + 1);
  });
  skip.addEventListener("click", () => finish("skipped"));
  win.addEventListener("scroll", schedulePlace, { passive: true });
  win.addEventListener("resize", schedulePlace);
  doc.addEventListener("scroll", schedulePlace, { passive: true, capture: true });

  const onKey = (event: KeyboardEvent) => {
    if (!open || event.key !== "Escape") return;
    finish("skipped");
  };
  win.addEventListener("keydown", onKey);

  return {
    start() {
      forget();
      show(0);
    },
    stop() {
      win.cancelAnimationFrame(placeFrame);
      win.removeEventListener("scroll", schedulePlace);
      win.removeEventListener("resize", schedulePlace);
      win.removeEventListener("keydown", onKey);
      doc.removeEventListener("scroll", schedulePlace, true);
      marks.forEach((mark) => mark.remove());
      card.remove();
      style.remove();
    },
  };
}

function deskReady(doc: Document): boolean {
  return Boolean(
    doc.querySelector(".mhtitle") &&
      doc.querySelector("#waiting .row") &&
      doc.querySelector(".tabs") &&
      doc.querySelector("#today") &&
      doc.querySelector("#askform") &&
      doc.querySelector("#stats") &&
      doc.querySelector("#promises") &&
      doc.querySelector(".panel.gabe") &&
      doc.querySelector("#quiet") &&
      doc.querySelector("#newbiz") &&
      doc.querySelector(".insight"),
  );
}

export default function DeskTour() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const tourRef = useRef<TourHandle | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let cancelled = false;
    let generation = 0;

    const boot = () => {
      const doc = frame.contentDocument;
      if (!doc?.querySelector(".mhtitle")) return;
      if (tourRef.current) return;
      const gen = ++generation;
      const wait = window.setInterval(() => {
        const current = frame.contentDocument;
        if (cancelled || gen !== generation || current !== doc) {
          window.clearInterval(wait);
          return;
        }
        if (!deskReady(current)) return;
        window.clearInterval(wait);
        if (tourRef.current) return;
        const tour = attachTour(frame);
        tourRef.current = tour;
        if (!remembered()) tour.start();
      }, 40);
      window.setTimeout(() => window.clearInterval(wait), 4000);
    };

    boot();
    frame.addEventListener("load", boot);
    return () => {
      cancelled = true;
      generation += 1;
      frame.removeEventListener("load", boot);
      tourRef.current?.stop();
      tourRef.current = null;
    };
  }, []);

  return (
    <div className="desk-host">
      <div className="desk-cue">
        <div className="desk-cue-links">
          <Link className="m-textlink" href="/work">
            Back to Work
          </Link>
          <button
            type="button"
            className="desk-replay"
            onClick={() => tourRef.current?.start()}
          >
            Replay tour
          </button>
        </div>
        <p>This is a sample desk. Click around and try it. Nothing sends for real.</p>
      </div>
      <iframe
        ref={frameRef}
        title="Morning Desk, a sales dashboard built on your email inbox"
        src="/work/morning-desk/app/index.html"
      />
    </div>
  );
}
