export type ThreadMessage = {
  from: string;
  when: string;
  body: string;
};

export type WaitingItem = {
  id: string;
  who: string;
  subject: string;
  age: string;
  preview: string;
  thread: ThreadMessage[];
  draft: { to: string; subject: string; full: string; short: string };
};

export type Opportunity = {
  id: string;
  who: string;
  detail: string;
};

export const WAITING: WaitingItem[] = [
  {
    id: "spring-window",
    who: "Buyer, regional retailer",
    subject: "Spring delivery window",
    age: "6 days",
    preview: "Asked when the spring assortment ships. No reply yet.",
    thread: [
      {
        from: "Buyer, regional retailer",
        when: "6 days ago",
        body: "Checking in on the spring delivery. Our floor set is the first week of next month. Can you confirm the ship window, and whether the first doors can take a partial?",
      },
      {
        from: "You",
        when: "11 days ago",
        body: "I’ll confirm the warehouse date after QC finishes. You should have it this week.",
      },
    ],
    draft: {
      to: "Buyer, regional retailer",
      subject: "Re: Spring delivery window",
      full: "Thanks for waiting on the ship window.\n\nThe spring assortment leaves the week of the 14th. The first doors can take a partial if you name them by Friday. Tracking goes out the day it ships.\n\nI still owe the revised gift-set pricing I promised. That goes tomorrow morning.",
      short:
        "Spring assortment ships the week of the 14th. Partial available if you name the doors by Friday. Revised gift-set pricing tomorrow morning.",
    },
  },
  {
    id: "revised-pricing",
    who: "Merchandiser, home program",
    subject: "Revised pricing",
    age: "3 days",
    preview: "Asked for the pricing you said you would send.",
    thread: [
      {
        from: "Merchandiser, home program",
        when: "3 days ago",
        body: "Still need the revised pricing on the gift set before I can take it into the review.",
      },
      {
        from: "You",
        when: "8 days ago",
        body: "I’ll send revised pricing by Thursday.",
      },
    ],
    draft: {
      to: "Merchandiser, home program",
      subject: "Re: Revised pricing",
      full: "The revised gift-set pricing you asked for:\n\nThe set holds at the cost we discussed. The holiday sleeve is an option, not a requirement. If the review needs that in writing before Thursday, this is it.\n\nTell me if the sleeve should come off the first order.",
      short:
        "Gift set holds at the cost we discussed. Holiday sleeve is optional, not required. Say if it should come off the first order.",
    },
  },
  {
    id: "samples",
    who: "Planner, store group",
    subject: "Samples",
    age: "1 day",
    preview: "Asked whether the samples reached the right desk.",
    thread: [
      {
        from: "Planner, store group",
        when: "Yesterday",
        body: "Did the samples make it to the right desk? I have not seen them.",
      },
      {
        from: "You",
        when: "12 days ago",
        body: "Samples went out yesterday. I’ll check that they arrived.",
      },
    ],
    draft: {
      to: "Planner, store group",
      subject: "Re: Samples",
      full: "Checking the samples for you.\n\nThey left twelve days ago and were addressed to your desk. If they have not surfaced, I will reship a set tomorrow and send the new tracking in the same thread.\n\nNo decision needed until you have them in hand.",
      short:
        "Samples left twelve days ago, addressed to your desk. If they have not surfaced I will reship tomorrow and send tracking here.",
    },
  },
];

export const PROMISES = [
  {
    id: "pricing-promise",
    title: "Revised pricing on the gift set",
    detail: "Promised for Thursday. Still sitting in sent mail.",
  },
  {
    id: "window-promise",
    title: "Spring ship window",
    detail: "Promised this week. The reply has not gone out.",
  },
  {
    id: "reset-promise",
    title: "A call about the holiday reset",
    detail: "You said you would call. No date is on it yet.",
  },
] as const;

export const QUIET = [
  {
    id: "gift-channel",
    who: "Gift channel",
    detail: "No contact in 52 days. The last note was an order confirmation.",
  },
  {
    id: "cold-weather",
    who: "Cold-weather program",
    detail: "No contact in 61 days. The last note was a line sheet.",
  },
] as const;

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "specialty",
    who: "Specialty doors",
    detail: "They replied to an intro already in the inbox and asked for a line sheet.",
  },
  {
    id: "regional-forward",
    who: "Regional chain",
    detail: "A buyer forwarded your note internally and asked who should take the conversation.",
  },
];

export const MORE_OPPORTUNITIES: Opportunity[] = [
  {
    id: "catalog",
    who: "Catalog buyer",
    detail: "Asked what a first order looks like. The note is still unread.",
  },
  {
    id: "outlet",
    who: "Outlet channel",
    detail: "Requested pricing ranges. Nobody answered.",
  },
  {
    id: "southern",
    who: "New doors, southern region",
    detail: "Introduced by an existing account. No reply from you yet.",
  },
];

export const ASK_ANSWER =
  "Three replies are waiting. The oldest has been sitting six days: a buyer at a regional retailer asked for the spring ship window, and the last word from you was that you would confirm it this week. The home-program merchandiser is still waiting on the revised pricing you promised for Thursday. That promise is in sent mail. Two conversations have gone quiet, and new opportunities are already in the inbox, including a specialty-doors reply and a regional-chain forward.";
