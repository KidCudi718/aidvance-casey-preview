import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What We Do · Aidvance",
  description:
    "We start with the business: how the work moves, what is worth automating, and what to do first.",
};

export default function WhatWeDoPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">What we do</p>
      <h1 className="m-title">We don’t start with AI.</h1>
      <p className="m-lead">
        We start with the business. We show how the work moves, find where time, attention, leads,
        and information get lost, and say what is worth automating, what isn’t, and what comes
        first.
      </p>

      <ol className="m-grid m-steps">
        <li className="m-card">
          <span className="m-index">01</span>
          <h2>Listen</h2>
          <p>How the work actually moves. The handoffs, the inbox, the desk, the load.</p>
        </li>
        <li className="m-card">
          <span className="m-index">02</span>
          <h2>Judge</h2>
          <p>
            Where time, attention, leads, and information get lost. What is worth automating. What
            is not.
          </p>
        </li>
        <li className="m-card">
          <span className="m-index">03</span>
          <h2>Recommend</h2>
          <p>What to fix first. What to leave alone. What needs a specialist to implement.</p>
          <Link className="m-textlink" href="/work">
            See how this played out in real work →
          </Link>
        </li>
      </ol>

      <p className="m-aside">
        A business may think it needs a new AI tool. We may find that the real issue is a process
        nobody owns, software they already pay for, or something that should not be automated at
        all.
      </p>

      <div className="m-after">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
      </div>
    </main>
  );
}
