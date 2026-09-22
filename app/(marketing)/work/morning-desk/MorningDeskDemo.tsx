"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ASK_ANSWER,
  MORE_OPPORTUNITIES,
  OPPORTUNITIES,
  PROMISES,
  QUIET,
  WAITING,
  type Opportunity,
  type WaitingItem,
} from "./sampleData";

type Draft = {
  id: string;
  to: string;
  subject: string;
  body: string;
  shortBody: string;
  shortened: boolean;
};

let draftSeq = 0;

export default function MorningDeskDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(OPPORTUNITIES);
  const [foundMore, setFoundMore] = useState(false);
  const [askText, setAskText] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notice, setNotice] = useState("");

  const selected = WAITING.find((item) => item.id === selectedId) ?? null;

  function openThread(item: WaitingItem) {
    setSelectedId(item.id);
    setNotice(`Opened the thread: ${item.subject}.`);
  }

  function askInbox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnswer(ASK_ANSWER);
    setNotice("Answer drawn from the sample inbox.");
  }

  function findMore() {
    if (foundMore) return;
    setOpportunities((current) => [...current, ...MORE_OPPORTUNITIES]);
    setFoundMore(true);
    setNotice("Three more opportunities, already in the inbox.");
  }

  function startDraft() {
    const source = selected ?? WAITING[0];
    draftSeq += 1;
    const next: Draft = {
      id: `draft-${draftSeq}`,
      to: source.draft.to,
      subject: source.draft.subject,
      body: source.draft.full,
      shortBody: source.draft.short,
      shortened: false,
    };
    setDrafts((current) => [next, ...current]);
    setNotice(`Draft started to ${source.draft.to}.`);
  }

  function shortenLatest() {
    const target = drafts.find((draft) => !draft.shortened) ?? drafts[0];
    if (!target) {
      setNotice("Start a draft first.");
      return;
    }
    if (target.shortened) {
      setNotice("That draft is already short.");
      return;
    }
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === target.id ? { ...draft, body: draft.shortBody, shortened: true } : draft,
      ),
    );
    setNotice("Draft shortened.");
  }

  return (
    <main className="m-wrap">
      <p className="desk-back">
        <Link className="m-textlink" href="/work">
          Work
        </Link>
      </p>
      <p className="m-kicker">Morning Desk · sample data</p>
      <h1 className="m-title">Your inbox already knows what needs attention.</h1>
      <p className="m-lead">
        A sales dashboard built on the inbox. Replies waiting, promises made, conversations gone
        quiet, and new business already sitting there. Nothing on this page is live, and nothing
        sends.
      </p>
      <p className="desk-notice" role="status" aria-live="polite">
        {notice}
      </p>

      <div className="desk-grid">
        <section className="m-card desk-panel" aria-labelledby="waiting-heading">
          <header className="desk-head">
            <h2 id="waiting-heading">Waiting on you</h2>
            <span className="m-index">{WAITING.length}</span>
          </header>
          <ul className="desk-list">
            {WAITING.map((item) => {
              const open = item.id === selectedId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={open ? "desk-item is-on" : "desk-item"}
                    aria-expanded={open}
                    aria-controls="thread-detail"
                    onClick={() => openThread(item)}
                  >
                    <span className="desk-who">{item.who}</span>
                    <span className="desk-subject">{item.subject}</span>
                    <span className="desk-meta">{item.age} waiting · {item.preview}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div id="thread-detail" className="desk-thread" hidden={!selected}>
            {selected ? (
              <>
                <p className="m-index">Thread</p>
                <h3>{selected.subject}</h3>
                <p className="desk-meta">
                  {selected.who} · {selected.age} with no reply
                </p>
                <ol className="desk-messages">
                  {selected.thread.map((message) => (
                    <li key={`${message.when}-${message.from}`}>
                      <p className="desk-who">
                        {message.from}
                        <span className="desk-meta"> · {message.when}</span>
                      </p>
                      <p>{message.body}</p>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </div>
        </section>

        <div className="desk-side">
          <section className="m-card desk-panel" aria-labelledby="promises-heading">
            <header className="desk-head">
              <h2 id="promises-heading">Promises you made</h2>
              <span className="m-index">{PROMISES.length}</span>
            </header>
            <ul className="desk-static">
              {PROMISES.map((item) => (
                <li key={item.id}>
                  <p className="desk-who">{item.title}</p>
                  <p className="desk-meta">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="m-card desk-panel" aria-labelledby="quiet-heading">
            <header className="desk-head">
              <h2 id="quiet-heading">Gone quiet</h2>
              <span className="m-index">{QUIET.length}</span>
            </header>
            <ul className="desk-static">
              {QUIET.map((item) => (
                <li key={item.id}>
                  <p className="desk-who">{item.who}</p>
                  <p className="desk-meta">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="m-card desk-panel" aria-labelledby="new-heading">
            <header className="desk-head">
              <h2 id="new-heading">New business</h2>
              <span className="m-index">{opportunities.length}</span>
            </header>
            <ul className="desk-static">
              {opportunities.map((item) => (
                <li key={item.id}>
                  <p className="desk-who">{item.who}</p>
                  <p className="desk-meta">{item.detail}</p>
                </li>
              ))}
            </ul>
            <button type="button" className="desk-btn" onClick={findMore} disabled={foundMore}>
              {foundMore ? "That’s the inbox" : "Find me more"}
            </button>
          </section>
        </div>

        <section className="m-card desk-panel desk-ask" aria-labelledby="ask-heading">
          <header className="desk-head">
            <h2 id="ask-heading">Ask my inbox</h2>
          </header>
          <p className="desk-meta">One read of this sample mailbox. No live model behind it.</p>
          <form className="desk-ask-form" onSubmit={askInbox}>
            <label className="desk-sr" htmlFor="ask-inbox">
              Ask about the sample inbox
            </label>
            <input
              id="ask-inbox"
              value={askText}
              onChange={(event) => setAskText(event.target.value)}
              placeholder="What should I answer first?"
            />
            <button type="submit" className="desk-btn desk-btn-solid">
              Ask
            </button>
          </form>
          {answer ? (
            <p className="desk-answer" role="status">
              {answer}
            </p>
          ) : null}
        </section>

        <section className="m-card desk-panel desk-drafts" aria-labelledby="drafts-heading">
          <header className="desk-head">
            <h2 id="drafts-heading">Draft</h2>
            <span className="m-index">{drafts.length}</span>
          </header>
          <p className="desk-meta">
            {selected
              ? `A reply to ${selected.who}. You still send it yourself.`
              : "Starts from the oldest reply waiting. You still send it yourself."}
          </p>
          <div className="desk-actions">
            <button type="button" className="desk-btn desk-btn-solid" onClick={startDraft}>
              Start a draft
            </button>
            <button
              type="button"
              className="desk-btn"
              onClick={shortenLatest}
              disabled={drafts.length === 0}
            >
              Make it shorter
            </button>
          </div>
          {drafts.length > 0 ? (
            <ul className="desk-draft-list">
              {drafts.map((draft) => (
                <li key={draft.id} className="desk-draft">
                  <p className="desk-who">
                    {draft.shortened ? "Shortened draft" : "Draft"} · {draft.to}
                  </p>
                  <p className="desk-subject">{draft.subject}</p>
                  <p className="desk-body">{draft.body}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </main>
  );
}
