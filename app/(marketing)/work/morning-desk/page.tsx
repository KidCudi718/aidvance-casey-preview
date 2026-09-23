import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Morning Desk · Aidvance",
  description:
    "A sales dashboard built on your email inbox. Sample data. Click around. Nothing sends for real.",
};

export default function MorningDeskPage() {
  return (
    <div className="desk-host">
      <div className="desk-cue">
        <Link className="m-textlink" href="/work">
          Back to Work
        </Link>
        <p className="desk-intro">Nothing sends for real.</p>
        <div className="desk-actions">
          <a className="m-textlink" href="#desk-demo">
            Open the demo
          </a>
          <Link className="talk m-talk" href="/#casey">
            Talk to Casey
          </Link>
        </div>
      </div>
      <iframe
        id="desk-demo"
        title="Morning Desk, a sales dashboard built on your email inbox"
        src="/work/morning-desk/app/index.html"
      />
    </div>
  );
}
