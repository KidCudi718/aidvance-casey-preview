import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · Aidvance",
  description:
    "Aidvance Consultancy helps small business owners figure out where AI actually saves them time or money, and where it doesn't. Before you spend a dollar on a tool.",
};

const BEFORE = [
  [
    "Why not just ask ChatGPT myself?",
    "You can, and for some things you should. The hard part isn't the tool. It's knowing which of the fifty things in your week are worth handing to it, and which ones will create more work than they save. That's what we find.",
  ],
  [
    "What happens on the free call?",
    "Fifteen minutes. You describe how your week goes, and you get an honest answer on whether an assessment would help. If it wouldn't, we'll tell you.",
  ],
  [
    "Do you work with businesses like mine?",
    "If you run a service business with a small team (a practice, a trade, a firm, a shop), yes. If you're not sure, the free call is how to find out.",
  ],
  [
    "How much is the assessment?",
    "A fixed fee, agreed in writing before anything starts. You'll get the number on the call. No hourly billing, no surprises.",
  ],
] as const;

const ASSESSMENT = [
  [
    "How much of my time does it take?",
    "The 90-minute assessment, then the review call. We do everything in between.",
  ],
  [
    "What do I actually get?",
    "A plan built around your goals, specific to your business, not a generic AI checklist. And a review call where we go through all of it together, so you understand every recommendation and can ask anything.",
  ],
  [
    "How long until I have it?",
    "We're back with you on the review call within five business days of the assessment.",
  ],
  [
    "What if you find AI isn't worth it for me?",
    "Then that's what the plan says. Plenty of problems are really a process nobody owns, or software you're already paying for. Knowing that saves you money too.",
  ],
] as const;

const TRUST = [
  [
    "Are you going to sell me software?",
    "No. We don't sell tools. We tell you what's worth using for your business, and what isn't.",
  ],
  [
    "Is my business information kept private?",
    "Yes. What you share stays between you and us and is only used to build your plan.",
  ],
  [
    "Is AI going to replace my staff?",
    "That's your call, not ours. For some owners the goal is taking busywork off a stretched team. For others it's running leaner. We start with what you want and show you what's realistic.",
  ],
] as const;

const AFTER = [
  [
    "What happens after the review call?",
    "The plan is yours to act on, with us, with someone else, or on your own. Nothing more is required. But when your next AI question comes up, you'll have someone who already knows your business.",
  ],
  [
    "I've tried AI tools before and they didn't stick. Is this different?",
    "Usually the tool wasn't the problem. It was aimed at the wrong job. We start with the job.",
  ],
  [
    "Is Casey a real person?",
    "No. Casey is an AI that answers questions and can book your call. She'll always tell you so if you ask.",
  ],
] as const;

function Questions({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div className="about-group">
      <h3>{title}</h3>
      {items.map(([q, a]) => (
        <div key={q} className="about-qa">
          <h4>{q}</h4>
          <p>{a}</p>
        </div>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="m-wrap m-about">
      <p className="m-kicker">ABOUT</p>
      <h1 className="m-title">One person. No software to sell you.</h1>
      <p className="m-lead">
        Aidvance Consultancy helps small business owners figure out where AI actually saves them
        time or money, and where it doesn&apos;t. Before you spend a dollar on a tool.
      </p>

      <section className="m-case" aria-labelledby="who-heading">
        <h2 className="m-kicker" id="who-heading">
          WHO IT&apos;S FOR
        </h2>
        <p className="m-copy">
          Owners of small service businesses (practices, trades, firms, shops) who are doing real
          work, feel stretched, and keep hearing they &quot;should be using AI&quot; without anyone
          telling them where.
        </p>
      </section>

      <section className="m-case" aria-labelledby="starts-heading">
        <h2 className="m-kicker" id="starts-heading">
          IT STARTS WITH WHERE YOU WANT TO GO
        </h2>
        <p className="m-copy">Before we talk about AI, we talk about you.</p>
        <p className="m-copy">Where are you now? How the work actually moves through your week.</p>
        <p className="m-copy">
          Where do you want to be? More customers. Fewer hours. A real vacation with your family.
          Lower overhead. Whatever matters most to you.
        </p>
        <p className="m-copy">
          What&apos;s in the way? The calls that don&apos;t get returned, the paperwork that eats
          your nights, the jobs that fall through the cracks.
        </p>
        <p className="m-copy">Then we look at whether AI can close that gap, and exactly where.</p>
      </section>

      <section className="m-case" aria-labelledby="behind-heading">
        <h2 className="m-kicker" id="behind-heading">
          WHO&apos;S BEHIND IT
        </h2>
        <p className="m-copy">Aidvance Consultancy is run by David Choukroun.</p>
        <p className="m-copy">
          David spent almost a decade selling online advertising to small and medium-sized service
          businesses. That meant thousands of conversations with owners about their phones, their
          calendars, their front desks and their busiest days. He knows what a small business week
          actually looks like, because he spent years inside it with them.
        </p>
        <p className="m-copy">
          That&apos;s still the job. Aidvance Consultancy isn&apos;t a software company. The advice
          is the product.
        </p>
      </section>

      <section className="m-case" aria-labelledby="how-heading">
        <h2 className="m-kicker" id="how-heading">
          HOW IT WORKS
        </h2>
        <ol className="about-steps">
          <li>
            <h3>1. Start with a conversation.</h3>
            <p>Talk to Casey on the homepage, or book a free 15-minute call.</p>
          </li>
          <li>
            <h3>2. The AI Assessment.</h3>
            <p>
              A 90-minute sit-down. We look at where your business is today, where you want it to
              be, and what&apos;s standing between the two. You talk, we handle everything after
              that.
            </p>
          </li>
          <li>
            <h3>3. The review call.</h3>
            <p>
              Within five business days, we get back together and walk through everything we found:
              what to fix first, what to leave alone, and what isn&apos;t worth automating. You
              don&apos;t just get an email. You get the conversation.
            </p>
          </li>
          <li>
            <h3>4. From there, it&apos;s your call.</h3>
            <p>
              Act on the plan with us, with someone else, or on your own. Either way, you now have
              someone who knows your business and knows AI, whenever a new question comes up.
            </p>
          </li>
        </ol>
      </section>

      <section className="m-case" aria-labelledby="questions-heading">
        <h2 className="m-kicker" id="questions-heading">
          QUESTIONS
        </h2>
        <Questions title="BEFORE YOU BOOK" items={BEFORE} />
        <Questions title="THE ASSESSMENT ITSELF" items={ASSESSMENT} />
        <Questions title="TRUST" items={TRUST} />
        <Questions title="AFTER" items={AFTER} />
      </section>

      <div className="about-book">
        <a className="book" href="https://calendly.com/aidvancexyz/15min">
          Book a free 15-minute call
        </a>
      </div>
    </main>
  );
}
