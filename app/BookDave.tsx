import { DAVE_GMAIL_HREF, DAVE_LABEL } from "@/lib/bookDave";

export default function BookDave() {
  return (
    <a className="book" href={DAVE_GMAIL_HREF} target="_blank" rel="noopener noreferrer">
      {DAVE_LABEL}
    </a>
  );
}
