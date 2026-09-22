import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What We Do · Aidvance",
  description: "Aidvance starts with how the business actually runs.",
};

export default function WhatWeDoPage() {
  return (
    <main className="m-wrap">
      <p className="m-kicker">What we do</p>
      <h1 className="m-title">The business, first.</h1>
      <p className="m-lead">
        Is AI right for your business? That question comes before any tool. The evidence is the week
        in front of us.
      </p>

      <ol className="m-grid m-steps">
        <li className="m-card">
          <span className="m-index">01</span>
          <h2>Listen</h2>
          <p>
            How the work moves. The inbox. The desk. The load. The part that falls over when one
            person steps away.
          </p>
        </li>
        <li className="m-card">
          <span className="m-index">02</span>
          <h2>Judge</h2>
          <p>
            Where AI earns a place. Where it should stay out. What to do first. What to leave alone.
          </p>
        </li>
        <li className="m-card">
          <span className="m-index">03</span>
          <h2>Then build</h2>
          <p>
            A morning desk, when the desk is the answer. A written assessment, when the answer is a
            clear read and nothing installed yet.
          </p>
        </li>
      </ol>

      <div className="m-doors">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
        <Link className="m-textlink" href="/work">
          See the work
        </Link>
      </div>
    </main>
  );
}
