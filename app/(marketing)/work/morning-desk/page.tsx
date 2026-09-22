import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Morning Desk · Aidvance",
  description: "The interactive Morning Desk is being moved onto this site.",
};

export default function MorningDeskPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">Work</p>
      <h1 className="m-title">Morning Desk</h1>
      <p className="m-lead">The interactive desk is being moved onto this site.</p>
      <p className="m-copy">
        It will live on this page when the branded desk is ready. There is no demo to open yet.
      </p>
      <p className="m-demo">
        <Link className="m-textlink" href="/work">
          Back to Work
        </Link>
      </p>
    </main>
  );
}
