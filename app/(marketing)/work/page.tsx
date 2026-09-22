import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "Work · Aidvance",
  description: "Sammy’s Morning Desk, and how Aidvance looked at Ultimate Logistics.",
};

const DEMO = "https://morning-desk-demo-daves-projects-9a958cf9.vercel.app/";

export default function WorkPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">Work</p>
      <h1 className="m-title">Proof you can open.</h1>
      <p className="m-lead">Two engagements. Short on purpose.</p>

      <article className="m-case">
        <header className="m-case-head">
          <p className="m-index">01</p>
          <div>
            <h2>Sammy’s Morning Desk</h2>
            <p className="m-for">
              For a sales rep at a large licensing company in Manhattan.
            </p>
          </div>
        </header>

        <div className="m-show">
          <figure className="m-frame">
            <figcaption className="m-frame-bar">
              <span>Live demo · sample data</span>
              <a href={DEMO} target="_blank" rel="noopener noreferrer">
                Open live demo
              </a>
            </figcaption>
            <iframe
              title="Sammy’s Morning Desk, live demo with sample data"
              src={DEMO}
              loading="eager"
            />
          </figure>

          <div className="m-grid m-facts m-facts-side">
            <section className="m-card">
              <h3>Problem</h3>
              <p>
                The selling starts after the inbox. Buyers waiting on a reply. Promises already
                written in sent mail. Accounts quiet for weeks. New business already in the mailbox.
              </p>
            </section>
            <section className="m-card">
              <h3>Built</h3>
              <p>
                A morning desk. Unanswered mail, oldest first, with the email the answer belongs to.
                Promises pulled from his own sent mail. Quiet accounts. Drafts he still sends himself.
              </p>
            </section>
            <section className="m-card">
              <h3>Changed</h3>
              <p>
                The morning opens on that list. The demo is the proof. People, orders, and prices on
                it are sample data.
              </p>
            </section>
          </div>
        </div>
      </article>

      <article className="m-case">
        <header className="m-case-head">
          <p className="m-index">02</p>
          <div>
            <h2>Ultimate Logistics</h2>
            <p className="m-for">
              For Joe, VP. Freight brokerage, mostly LTL. A small team, on the order of $8 million.
            </p>
          </div>
        </header>

        <div className="m-grid m-facts">
          <section className="m-card">
            <h3>The day</h3>
            <p>
              A quote comes in. A truck gets found. The paperwork follows. Someone still has to know
              where the freight is.
            </p>
          </section>
          <section className="m-card">
            <h3>The question</h3>
            <p>Where AI belongs in that day, and where it should stay out of the way.</p>
          </section>
          <section className="m-card">
            <h3>The read</h3>
            <p>
              An assessment. What to do first. What to leave alone. A walkthrough with Joe. Judgment,
              in his operation — that is the proof.
            </p>
          </section>
        </div>

        <div className="m-cta">
          <BookDave />
          <Link className="m-textlink" href="/#casey">
            Talk to Casey
          </Link>
        </div>
      </article>
    </main>
  );
}
