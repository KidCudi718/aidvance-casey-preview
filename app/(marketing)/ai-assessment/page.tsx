import type { Metadata } from "next";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "AI Assessment · Aidvance",
  description:
    "About 90 minutes inside the business, then a written AI and automation roadmap.",
};

const ROADMAP = [
  {
    when: "Immediate",
    body: "The first change. The one that matters now.",
  },
  {
    when: "Next",
    body: "What follows once that change is in place.",
  },
  {
    when: "Later",
    body: "What a specialist implements, and what stays with a person.",
  },
] as const;

export default function AiAssessmentPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">AI Assessment</p>
      <h1 className="m-title">A written roadmap for the business.</h1>
      <p className="m-lead">
        About 90 minutes inside the business, then a written AI and automation roadmap you can
        hold.
      </p>

      <figure className="roadmap">
        <figcaption>Sample of the roadmap</figcaption>
        <ol>
          {ROADMAP.map((step, index) => (
            <li key={step.when}>
              <span className="roadmap-n">{index + 1}</span>
              <span className="roadmap-when">{step.when}</span>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </figure>

      <section className="m-guide" aria-labelledby="how-heading">
        <h2 id="how-heading">How it goes</h2>
        <ol>
          <li>
            <h3>The call</h3>
            <p>
              About 90 minutes. We sit inside the business and follow how the work actually moves:
              the handoffs, the inbox, the desk, the load.
            </p>
          </li>
          <li>
            <h3>What you get in writing</h3>
            <p>
              A roadmap in plain English. What could improve. What is not worth automating. What to
              do first. Tools and capabilities you may already have. What needs a specialist. What
              should stay human. The shape is the one above: Immediate, then Next, then Later.
            </p>
          </li>
          <li>
            <h3>The walkthrough</h3>
            <p>
              We go through the findings with you, in that order. You leave with the document.
            </p>
          </li>
        </ol>
      </section>

      <div className="m-cta">
        <BookDave />
      </div>
    </main>
  );
}
