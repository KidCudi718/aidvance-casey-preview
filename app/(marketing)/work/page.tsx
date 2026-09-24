import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "Work · Aidvance",
  description: "Have your inbox work for you.",
};

const DESK = "/work/morning-desk";

export default function WorkPage() {
  return (
    <main className="m-wrap m-work">
      <p className="m-kicker">Work</p>
      <h1 className="m-title">Morning Desk</h1>
      <p className="m-lead">Have your inbox work for you.</p>

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

      <div className="m-cta">
        <Link className="talk m-talk" href="/#casey">
          Talk to Casey
        </Link>
        <BookDave />
      </div>
    </main>
  );
}
