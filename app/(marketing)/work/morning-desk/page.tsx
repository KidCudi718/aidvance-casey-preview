import type { Metadata } from "next";
import MorningDeskDemo from "./MorningDeskDemo";

export const metadata: Metadata = {
  title: "Morning Desk · Aidvance",
  description:
    "A sample sales dashboard built on the inbox: replies waiting, promises made, quiet conversations, and new business.",
};

export default function MorningDeskPage() {
  return <MorningDeskDemo />;
}
