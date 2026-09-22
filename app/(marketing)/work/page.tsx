import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "Work · Aidvance",
  description:
    "Morning Desk is a sales dashboard built on your email inbox. Try the sample. Nothing sends for real.",
};

const DESK = "/work/morning-desk";

export default function WorkPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">Work</p>
      <h1 className="m-title">Morning Desk</h1>
      <p className="work-sub">A sales dashboard built on your email inbox</p>
      <p className="m-lead">Imagine if you could talk to your email — and it could talk back.</p>

      <article className="m-card work-card work-hero">
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

        <p className="work-try">Try it. Don’t worry. Nothing sends for real.</p>

        <Link className="talk m-talk work-open" href={DESK}>
          Open Morning Desk — click around
        </Link>
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
