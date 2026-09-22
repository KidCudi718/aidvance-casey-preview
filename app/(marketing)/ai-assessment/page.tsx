import type { Metadata } from "next";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "AI Assessment · Aidvance",
  description:
    "Ninety minutes inside the business, then a clear map of where AI belongs, where it doesn’t, and what to do first.",
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

const TILES = [
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

export default function AiAssessmentPage() {
  return (
    <main className="assess">
      <section className="assess-hero">
        <div className="assess-col assess-center">
          <h1>What actually is an AI Assessment?</h1>
          <p>
            We spend 90 minutes learning how your business actually works, then show you where AI
            belongs, where it doesn’t, and what to do first.
          </p>
          <div className="assess-cta">
            <BookDave />
          </div>
          <p className="assess-aside">
            No generic AI playbook. This is built around your actual business.
          </p>
        </div>
      </section>

      <section className="assess-band" aria-labelledby="how-heading">
        <div className="assess-wide">
          <h2 id="how-heading">How it works</h2>
          <ol className="assess-steps">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className="assess-num">{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="assess-plain" aria-labelledby="get-heading">
        <div className="assess-wide">
          <h2 id="get-heading">What you get</h2>
          <ul className="assess-tiles">
            {TILES.map((tile) => (
              <li key={tile.title}>
                <h3>{tile.title}</h3>
                <p>{tile.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="assess-band assess-philosophy" aria-label="What the answer can be">
        <div className="assess-col">
          <p className="assess-statement">
            Sometimes the answer is AI.
            <br />
            Sometimes it’s automation.
            <br />
            Sometimes the smartest move is to leave it alone.
          </p>
          <p className="assess-under">
            The goal is not to sell you more technology. The goal is to show you what is actually
            worth fixing.
          </p>
        </div>
      </section>

      <section className="assess-plain" aria-labelledby="sample-heading">
        <div className="assess-wide">
          <h2 id="sample-heading">This is what clarity looks like.</h2>
          <figure className="assess-mock">
            <figcaption>Sample deliverable</figcaption>
            <div className="assess-doc">
              <div className="assess-doc-bar">
                <span>Finding 01</span>
                <span>Sample</span>
              </div>
              <dl>
                <div>
                  <dt>Finding</dt>
                  <dd>Follow-up lives in one person’s inbox.</dd>
                </div>
                <div>
                  <dt>Why it matters</dt>
                  <dd>Leads go quiet when that person is in a meeting.</dd>
                </div>
                <div>
                  <dt>Recommendation</dt>
                  <dd>A morning view of who is waiting, before anyone asks.</dd>
                </div>
                <div>
                  <dt>Priority</dt>
                  <dd>
                    <span className="assess-priority">Do first</span>
                  </dd>
                </div>
                <div>
                  <dt>What not to do</dt>
                  <dd>Don’t buy a new system to fix a reminder problem.</dd>
                </div>
              </dl>
              <div className="assess-doc-next" aria-hidden="true">
                <div className="assess-doc-bar">
                  <span>Finding 02</span>
                  <span>Sample</span>
                </div>
                <dl>
                  <div>
                    <dt>Finding</dt>
                    <dd>The same status gets typed into three places.</dd>
                  </div>
                  <div>
                    <dt>Why it matters</dt>
                    <dd>The copies drift, and nobody trusts the latest one.</dd>
                  </div>
                </dl>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section className="assess-band assess-close">
        <div className="assess-col">
          <p className="assess-close-line">
            Know where the leaks are before you spend money fixing the wrong ones.
          </p>
          <div className="assess-cta">
            <BookDave />
          </div>
        </div>
      </section>
    </main>
  );
}
