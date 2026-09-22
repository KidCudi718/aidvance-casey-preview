import type { Metadata } from "next";
import DeskTour from "./DeskTour";

export const metadata: Metadata = {
  title: "Morning Desk · Aidvance",
  description:
    "A sales dashboard built on your email inbox. Sample data. Click around. Nothing sends for real.",
};

export default function MorningDeskPage() {
  return <DeskTour />;
}
