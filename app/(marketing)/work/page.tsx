import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "Work · Aidvance",
  description:
    "Morning Desk, a sales dashboard built on the inbox, and a freight brokerage assessment that recommended not building an expensive integration.",
};

const DEMO = "https://morning-desk-demo-daves-projects-9a958cf9.vercel.app/";

const LABELS = ["Waiting on you", "Promises you made", "Gone quiet", "New business"] as const;

export default function WorkPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">Work</p>
      <h1 className="m-title">Two examples.</h1>
      <p className="m-lead">One we built. One we recommended not building.</p>

      <article className="m-case">
        <header className="m-case-head">
          <p className="m-index">01</p>
          <div>
            <h2>Morning Desk</h2>
            <p className="m-for">A sales dashboard built on the inbox.</p>
          </div>
        </header>

        <p className="m-headline">Your inbox already knows what needs attention.</p>
        <p className="m-copy">
          It turns email into a simple sales view: replies waiting, promises made, conversations
          going quiet, and new opportunities already sitting there.
        </p>
        <ul className="m-labels">
          {LABELS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <p className="m-demo">
          <a className="m-textlink" href={DEMO} target="_blank" rel="noopener noreferrer">
            Explore the demo
          </a>
        </p>
      </article>

      <article className="m-case">
        <header className="m-case-head">
          <p className="m-index">02</p>
          <div>
            <h2>Freight Brokerage Assessment</h2>
            <p className="m-for">A recommendation not to build.</p>
          </div>
        </header>

        <div className="m-card m-story">
          <h3>What we found</h3>
          <p>
            They assumed one workflow was the obvious automation target. After mapping the business,
            the bigger opportunity was elsewhere.
          </p>
          <h3>What we recommended</h3>
          <p>
            We recommended against the expensive integration they thought they needed. Simpler
            changes came first, using tools they already had.
          </p>
          <h3>Why it matters</h3>
          <p>We diagnose before we prescribe.</p>
        </div>
      </article>

      <div className="m-cta">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
        <BookDave />
      </div>
    </main>
  );
}
