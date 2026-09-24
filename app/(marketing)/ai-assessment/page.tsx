import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "AI Assessment · Aidvance",
  description:
    "Ninety minutes inside the business, then a clear picture of where AI belongs, where it doesn’t, and what to do first.",
};

const STEPS = [
  {
    n: "01",
    title: "We get inside the business",
    body: "We walk through the real operation. Leads, email, follow-up, handoffs, repeated work, bottlenecks, and the things that still depend on someone remembering.",
  },
  {
    n: "02",
    title: "We do the analysis",
    body: "We break down what you showed us, identify the real friction, and determine what actually deserves AI, automation, an agent, or nothing at all.",
  },
] as const;

const GAINS = [
  {
    title: "Clear Map",
    body: "Where the friction is and what matters most.",
  },
  {
    title: "Specific Recommendations",
    body: "What should change and what type of solution fits.",
  },
  {
    title: "Easy Wins",
    body: "Simple fixes your team can implement now.",
  },
  {
    title: "Bigger Opportunities",
    body: "Anything that needs a real build, clearly scoped before you decide.",
  },
] as const;

function AssessCta() {
  return (
    <>
      <div className="m-cta">
        <BookDave />
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
      </div>
      <p className="m-note">
        Start with the free 15-minute fit call. If there is nothing worth assessing, we’ll know
        quickly.
      </p>
    </>
  );
}

export default function AiAssessmentPage() {
  return (
    <main className="m-wrap m-assess">
      <p className="m-kicker">AI Assessment</p>
      <h1 className="m-title">What actually is an AI Assessment?</h1>
      <p className="m-lead">
        We spend 90 minutes learning how your business actually works, then show you where AI
        belongs, where it doesn’t, and what to do first.
      </p>

      <AssessCta />
      <p className="m-copy">No generic AI playbook. This is built around your actual business.</p>

      <section className="m-case" aria-labelledby="how-heading">
        <h2 className="m-kicker" id="how-heading">
          How it works
        </h2>
        <ol className="m-grid m-deliver">
          {STEPS.map((step) => (
            <li key={step.n} className="m-card">
              <span className="m-index">{step.n}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="m-case" aria-labelledby="get-heading">
        <h2 className="m-kicker" id="get-heading">
          What you get
        </h2>
        <ul className="m-grid m-deliver">
          {GAINS.map((item) => (
            <li key={item.title} className="m-card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <AssessCta />
    </main>
  );
}
