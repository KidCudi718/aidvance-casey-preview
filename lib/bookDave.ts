export const DAVE_LABEL = "Book a FREE 15 Minute Chat with Dave";

const DAVE_EMAIL = "david.choukroun2@gmail.com";
const DAVE_BODY =
  "Hi Dave,\n\nI'd like to book a FREE 15 minute chat. A time that works for me:\n\n";

function composeHref(base: string, fields: Record<string, string>) {
  const query = Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `${base}?${query}`;
}

/** Same Gmail compose the Casey panel already uses. Marketing pages link here. */
export const DAVE_GMAIL_HREF = composeHref("https://mail.google.com/mail/", {
  view: "cm",
  fs: "1",
  to: DAVE_EMAIL,
  su: DAVE_LABEL,
  body: DAVE_BODY,
});
