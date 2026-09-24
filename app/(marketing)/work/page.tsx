import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "Work · Aidvance",
  description: "Morning Desk, and a freight brokerage assessment.",
};

const DESK = "/work/morning-desk";

export default function WorkPage() {
  return (
    <main className="m-wrap m-work">
      <p className="m-kicker">Work</p>
      <h1 className="m-title">Morning Desk</h1>
      <p className="m-lead">
        Surfaces who needs a reply, promises you made, conversations going quiet, and new
        opportunities already sitting in email.
      </p>

      <div className="work-preview">
        <iframe
          title="Preview of Morning Desk"
          src="/work/morning-desk/app/index.html?embed=1&preview=1"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      <Link className="talk m-talk work-open" href={DESK}>
        Explore the demo →
      </Link>

      <div className="work-watch">
        <h2 id="watch-heading">Watch how it works</h2>
        <video
          className="work-video"
          controls
          playsInline
          preload="metadata"
          src="/videos/morning-desk.mp4"
          aria-labelledby="watch-heading"
        >
          Your browser can’t play this video.
        </video>
      </div>

      <section className="m-case work-story" aria-labelledby="freight-heading">
        <h2 className="m-kicker" id="freight-heading">
          Freight brokerage assessment
        </h2>
        <h3>What they thought they needed</h3>
        <p>A bigger AI / automation build on top of the existing stack.</p>
        <h3>What we found</h3>
        <p>
          The expensive idea wasn’t the highest-leverage fix. Time and attention were getting lost
          in handoffs and follow-up long before a new system would help.
        </p>
        <h3>What we recommended</h3>
        <p>
          Clearer priorities first. Build only what the workflow actually justifies. Leave the rest
          alone.
        </p>
      </section>

      <div className="m-cta">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
        <BookDave />
      </div>
    </main>
  );
}
