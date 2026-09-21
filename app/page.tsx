"use client";

import { useMemo, useState } from "react";
import CaseyPanel from "./CaseyPanel";

const PAINS = [
  { id: "faq", label: "I answer the same questions every day", tip: "Same questions forever — answer them once, put the answers where they work while you sleep." },
  { id: "quotes", label: "Quotes and estimates eat my nights", tip: "If quoting is after dinner, the judgment stays yours; the typing doesn’t have to." },
  { id: "retype", label: "I type the same info into three places", tip: "Retyping is the boring win. Forty minutes a day adds up fast." },
  { id: "chase", label: "Half my week is chasing people", tip: "Chasing people is usually a booking link + one reminder — often not an AI project." },
  { id: "bottleneck", label: "Everything has to come through me", tip: "If everything needs you, write the path down before you buy a tool." },
  { id: "train", label: "New people only learn by watching me", tip: "If you explain it to every new hire, that explanation is a document you haven’t written." },
  { id: "afterhours", label: "Calls pile up after hours", tip: "After-hours noise wants routing and templates more than a chatbot personality." },
  { id: "leads", label: "Leads come in and go cold", tip: "Cold leads need a next step in writing — speed beats clever AI." },
  { id: "other", label: "Something else", tip: "If it’s not on the list, it’s probably specific to your shop — worth a real look." },
];

export default function Home() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tips = useMemo(
    () => PAINS.filter((p) => selected.has(p.id)),
    [selected]
  );

  const painLabels = tips.map((p) => p.label);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <>
      <div className="banner">
        <strong>PREVIEW ONLY</strong> — real talkable Casey · not production · not connected to live aidvance.xyz
      </div>
      <header>
        <a href="#top" aria-label="Aidvance home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Aidvance Consultancy" />
        </a>
        <nav>
          <a className="hide-sm" href="#picker">
            Start here
          </a>
          <a className="btn" href="#meet" style={{ padding: "10px 14px" }}>
            Book a meeting
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="casey">
            <p className="eyebrow">Casey · AI guide · ~2 minutes</p>
            <h1>Tell her your week. She’ll tell you if AI is worth it.</h1>
            <p className="lede">
              No pitch deck. No jargon. She’ll say when AI helps — and when it doesn’t.
            </p>
            <CaseyPanel pains={painLabels} />
            <p className="disclosure">
              Casey is an AI assistant for Aidvance — not a person. She says that up front. Your mic
              stays in the browser; speech goes to our model to reply, then she talks back.
            </p>
          </div>
          <aside className="side">
            <p className="eyebrow">What happens next</p>
            <h2>Two minutes with Casey. Then a yes or no on meeting Dave.</h2>
            <p>
              If she’s useful, you book a short call. If AI isn’t the move for your shop, she says so —
              and you don’t waste a meeting.
            </p>
            <a className="btn btn--ghost" href="#picker">
              Or tap what’s eating your week ↓
            </a>
          </aside>
        </section>

        <section className="section" id="picker">
          <p className="eyebrow">Optional · feeds the memo + Casey</p>
          <h2>What’s eating your week?</h2>
          <p className="sub">
            Tap everything that applies. The memo updates live. Casey will use these when you talk.
          </p>
          <div className="grid">
            {PAINS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`cell${selected.has(p.id) ? " is-on" : ""}`}
                onClick={() => toggle(p.id)}
              >
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="t">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="memo" aria-live="polite">
            <p className="eyebrow">Live memo</p>
            {tips.length === 0 ? (
              <p className="empty">
                Pick what’s eating your week. We’ll tell you straight — including when AI isn’t the
                answer.
              </p>
            ) : (
              <>
                <ol>
                  {tips.map((p, i) => (
                    <li key={p.id} style={{ animationDelay: `${i * 40}ms` }}>
                      <span className="num">{String(i + 1).padStart(2, "0")}</span>
                      <span>{p.tip}</span>
                    </li>
                  ))}
                </ol>
                <div className="actions">
                  <a className="btn" href="#top">
                    Talk to Casey about this
                  </a>
                  <a className="btn btn--ghost" href="#meet">
                    Skip to meet Dave
                  </a>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="cta" id="meet">
          <p className="eyebrow">The only ask</p>
          <h2>If Casey helped, meet Dave.</h2>
          <p>
            One working conversation about your shop — not a sales theater. Preview button opens
            mail for now.
          </p>
          <a
            className="btn"
            href="mailto:david.choukroun2@gmail.com?subject=Aidvance%20meeting%20from%20Casey%20preview"
          >
            Yes — book a meeting with Dave
          </a>
          <a className="btn btn--ghost" href="#top">
            Talk to Casey again
          </a>
        </section>
      </main>

      <footer>© 2026 Aidvance Consultancy · New York · Preview — not production</footer>
    </>
  );
}
