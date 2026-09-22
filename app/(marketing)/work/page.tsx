import type { Metadata } from "next";
import Link from "next/link";
import BookDave from "../../BookDave";

export const metadata: Metadata = {
  title: "Work · Aidvance",
  description: "Morning Desk is a sales dashboard built on your email inbox.",
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
        </div>

        <Link className="talk m-talk work-open" href={DESK}>
          Open Morning Desk
        </Link>
        <p className="work-try">Nothing sends for real.</p>
      </article>

      <div className="m-cta">
        <BookDave />
      </div>

      <section className="work-watch" aria-labelledby="watch-heading">
        <h2 id="watch-heading">Watch how Morning Desk works</h2>
        <video
          className="work-video"
          controls
          playsInline
          preload="metadata"
          src="/videos/morning-desk.mp4"
        >
          Your browser can’t play this video.
        </video>
      </section>
    </main>
  );
}
