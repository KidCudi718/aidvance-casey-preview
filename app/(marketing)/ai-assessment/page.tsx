import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "AI Assessment · Aidvance",
  description:
    "A written look at where AI fits one business, what to do first, and what to leave alone.",
};

const DELIVERABLES = [
  {
    index: "01",
    title: "How the work moves",
    body: "A plain account of the workflows, the friction, and the places one person is holding together.",
  },
  {
    index: "02",
    title: "Where AI fits",
    body: "Recommendations for this operation, including the places a new tool would add noise.",
  },
  {
    index: "03",
    title: "What comes first",
    body: "A short order. Do this. Leave that. Come back to the rest when the first piece is real.",
  },
  {
    index: "04",
    title: "The walkthrough",
    body: "We sit with the findings together. The recommendations stay with you.",
  },
] as const;

export default function AiAssessmentPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">AI Assessment</p>
      <h1 className="m-title">A clear read of one business.</h1>
      <p className="m-lead">
        You show how the work actually runs. We come back with a written read and a walkthrough:
        where AI fits, where it should stay out, and what to do first.
      </p>

      <div className="m-cta m-cta-early">
        <BookDave />
      </div>

      <ul className="m-grid m-deliver">
        {DELIVERABLES.map((item) => (
          <li key={item.index} className="m-card">
            <span className="m-index">{item.index}</span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>

      <div className="m-split">
        <section className="m-card">
          <span className="m-index">For</span>
          <p className="m-split-copy">
            An owner or operator who will open the real desk, mess included.
          </p>
        </section>
        <section className="m-card">
          <span className="m-index">Not for</span>
          <p className="m-split-copy">
            A search for a software list before anyone has looked at the work.
          </p>
        </section>
      </div>

      <div className="m-cta">
        <BookDave />
        <Link className="m-textlink" href="/#casey">
          Talk to Casey
        </Link>
      </div>
    </main>
  );
}
