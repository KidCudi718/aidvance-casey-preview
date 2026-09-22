import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "AI Assessment · Aidvance",
  description:
    "A $999 AI assessment: about 90 minutes inside the business, then a written automation roadmap.",
};

const DELIVERABLES = [
  {
    index: "01",
    title: "What could improve",
    body: "Where time, attention, leads, or information are getting lost.",
  },
  {
    index: "02",
    title: "What is not worth automating",
    body: "The work a new tool would complicate, or that should stay as it is.",
  },
  {
    index: "03",
    title: "What to do first",
    body: "A priority order, so the first change is the one that matters.",
  },
  {
    index: "04",
    title: "Tools and capabilities you may already have",
    body: "What is already in the business, before anyone buys something new.",
  },
  {
    index: "05",
    title: "What needs implementation",
    body: "The pieces that need a specialist to put in place.",
  },
  {
    index: "06",
    title: "What should stay human",
    body: "The judgment, the relationships, and the exceptions that should not be automated.",
  },
] as const;

const STEPS = [
  {
    index: "01",
    title: "Discovery call",
    body: "About 90 minutes inside the business, on how the work actually moves.",
  },
  {
    index: "02",
    title: "Analysis",
    body: "We separate what could improve from what is not worth automating.",
  },
  {
    index: "03",
    title: "Written Assessment",
    body: "The roadmap: what first, what to leave alone, what to implement, what stays human.",
  },
  {
    index: "04",
    title: "Walkthrough",
    body: "We go through the findings together. The document stays with you.",
  },
] as const;

export default function AiAssessmentPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">AI Assessment · $999</p>
      <h1 className="m-title">A written roadmap.</h1>
      <p className="m-lead">
        About 90 minutes inside the business, then a written AI and automation roadmap. $999.
      </p>

      <div className="m-cta m-cta-early">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
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

      <ol className="m-grid m-flow">
        {STEPS.map((step) => (
          <li key={step.index} className="m-card">
            <span className="m-index">{step.index}</span>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>

      <p className="m-aside">No obligation to implement anything with us.</p>

      <div className="m-cta">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
        <BookDave />
      </div>
    </main>
  );
}
