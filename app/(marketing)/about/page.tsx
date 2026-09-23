import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "About · Aidvance",
  description: "Who Aidvance works with, how an engagement goes, and how to reach Dave.",
};

const HOW = [
  "Talk to Casey or book a free 15 with Dave.",
  "If there’s a fit, AI Assessment.",
  "A clear map. Implementation is separate, and optional.",
] as const;

const FAQ = [
  {
    q: "Is Casey a person?",
    a: "No. Casey is Aidvance’s AI business concierge.",
  },
  {
    q: "Is it free to talk?",
    a: "Yes. Talking to Casey is free.",
  },
  {
    q: "What is an AI Assessment?",
    a: "A clear map, recommendations, easy wins, and bigger bets — including what not to do.",
  },
  {
    q: "Do we have to build something?",
    a: "No. We build only if you want that, after the assessment.",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="m-wrap m-about">
      <h1 className="m-kicker">About</h1>

      <section className="m-case" aria-labelledby="who-heading">
        <h2 className="m-kicker" id="who-heading">
          Who
        </h2>
        <p className="m-copy">
          Owner-led service and operations businesses that already have real work moving — and want
          clearer judgment before they spend on AI.
        </p>
      </section>

      <section className="m-case" aria-labelledby="dave-heading">
        <h2 className="m-kicker" id="dave-heading">
          Dave
        </h2>
        <p className="m-copy">Aidvance is run by Dave Choukroun.</p>
      </section>

      <section className="m-case" aria-labelledby="how-heading">
        <h2 className="m-kicker" id="how-heading">
          How
        </h2>
        <ol className="m-grid m-steps">
          {HOW.map((step, index) => (
            <li key={step} className="m-card">
              <span className="m-index">{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="m-case" aria-labelledby="facts-heading">
        <h2 className="m-kicker" id="facts-heading">
          Facts
        </h2>
        <ul className="m-grid m-facts">
          <li className="m-card">
            <h3>Company</h3>
            <p>Aidvance</p>
          </li>
          <li className="m-card">
            <h3>Site</h3>
            <p>aidvance.xyz</p>
          </li>
          <li className="m-card">
            <h3>Contact</h3>
            <p>
              <a href="mailto:david.choukroun2@gmail.com">david.choukroun2@gmail.com</a>
              {" · "}
              <a href="tel:+17188690404">(718) 869-0404</a>
            </p>
          </li>
        </ul>
      </section>

      <section className="m-case" aria-labelledby="faq-heading">
        <h2 className="m-kicker" id="faq-heading">
          FAQ
        </h2>
        <ul className="m-grid m-deliver">
          {FAQ.map((item) => (
            <li key={item.q} className="m-card">
              <h2>{item.q}</h2>
              <p>{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="m-cta">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
        <BookDave />
      </div>
    </main>
  );
}
