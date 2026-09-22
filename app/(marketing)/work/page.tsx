import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "Work · Aidvance",
  description:
    "Proof after we listen, judge, and recommend: try Morning Desk, a sales dashboard on the inbox, and a freight assessment that recommended not building.",
};

const DESK = "/work/morning-desk";
const CHIPS = ["Waiting", "Promises", "Quiet", "New business"] as const;

export default function WorkPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">Work</p>
      <h1 className="m-title">Here is the proof.</h1>
      <p className="m-lead">After we listen, judge, and recommend, here is the proof.</p>

      <div className="work-grid">
        <article className="m-card work-card">
          <p className="m-kicker">Something we built</p>
          <h2>Morning Desk</h2>
          <p className="work-sub">A sales dashboard built on your email inbox</p>

          <div className="work-preview">
            <iframe
              title="Preview of Morning Desk"
              src="/work/morning-desk/app/index.html"
              tabIndex={-1}
              aria-hidden="true"
            />
            <Link className="work-preview-hit" href={DESK}>
              Click around the sample desk
            </Link>
          </div>

          <p className="work-line">Waiting, promises, gone quiet, and new business already in the mail.</p>
          <p className="work-try">Try it. Nothing sends for real.</p>

          <ul className="work-chips">
            {CHIPS.map((chip) => (
              <li key={chip}>
                <Link href={DESK}>{chip}</Link>
              </li>
            ))}
          </ul>

          <Link className="talk m-talk work-open" href={DESK}>
            Open Morning Desk — click around
          </Link>
        </article>

        <article className="m-card work-card">
          <p className="m-kicker">Something we told them not to build</p>
          <h2>Freight Brokerage Assessment</h2>
          <p className="work-sub">Diagnose first. Skip the expensive build.</p>
          <p className="work-label">What they assumed</p>
          <p className="work-note">One workflow was the obvious thing to automate.</p>
          <p className="work-label">What we found</p>
          <p className="work-note">The bigger opportunity was elsewhere.</p>
          <p className="work-label">What we said</p>
          <p className="work-note">
            Skip the expensive integration. Start with simpler changes, using tools they already had.
          </p>
        </article>
      </div>

      <div className="m-cta">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
        <BookDave />
      </div>
    </main>
  );
}
