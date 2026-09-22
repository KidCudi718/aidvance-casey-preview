import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "Work · Aidvance",
  description:
    "Proof after we listen, judge, and recommend: Morning Desk, a sales dashboard built on the inbox, and a freight assessment that recommended not building.",
};

export default function WorkPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">Work</p>
      <h1 className="m-title">Here is the proof.</h1>
      <p className="m-lead">
        After we listen, judge, and recommend, this is what that looks like. One thing we built. One
        thing we told them not to build.
      </p>

      <article className="m-case">
        <header className="m-case-head">
          <p className="m-index">01</p>
          <div>
            <p className="m-kicker">Something we built</p>
            <h2>Morning Desk</h2>
            <p className="m-for">A sales dashboard built on your email inbox</p>
          </div>
        </header>
        <p className="m-copy">
          For a sales desk. Waiting replies, promises made, conversations gone quiet, and new
          business already sitting in the mail.
        </p>
        <p className="m-demo">
          <Link className="talk m-talk" href="/work/morning-desk">
            Open Morning Desk
          </Link>
        </p>
      </article>

      <article className="m-case">
        <header className="m-case-head">
          <p className="m-index">02</p>
          <div>
            <p className="m-kicker">Something we told them not to build</p>
            <h2>Freight Brokerage Assessment</h2>
            <p className="m-for">Diagnose first. Skip the expensive build.</p>
          </div>
        </header>
        <p className="m-copy">
          They assumed one workflow was the thing to automate. After mapping the business, the
          bigger opportunity was elsewhere. We recommended against the expensive integration and
          started with simpler changes, using tools they already had.
        </p>
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
