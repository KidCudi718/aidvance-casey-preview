"use client";

import CaseyPanel from "./CaseyPanel";

export default function Home() {
  return (
    <>
      <div className="banner">
        <strong>PREVIEW · BAR CONVO v1</strong> — Grok Voice · lux · not production · not live aidvance.xyz
      </div>
      <header>
        <a href="#top" aria-label="Aidvance home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Aidvance Consultancy" />
        </a>
        <nav>
          <a className="btn" href="#meet" style={{ padding: "10px 14px" }}>
            Book a meeting
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero hero--solo">
          <div className="casey">
            <p className="eyebrow">Casey · AI · a real conversation</p>
            <h1>Tell her your week. No survey. No script.</h1>
            <p className="lede">
              She’ll listen, push back when AI isn’t the answer, and only ask for Dave if it actually
              makes sense.
            </p>
            <CaseyPanel />
            <p className="disclosure">
              Casey is AI for Aidvance — she says that once up front. Mic stays in your browser. You can
              interrupt her. Silence is allowed.
            </p>
          </div>
        </section>

        <section className="cta" id="meet">
          <p className="eyebrow">Only if it earned it</p>
          <h2>If the chat helped, meet Dave.</h2>
          <p>
            One working conversation about your shop — not a pitch. Preview button opens mail for now.
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
