import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-serif",
});

const title = "Casey · Aidvance";
const description =
  "Is AI right for your business? Talk to Casey, Aidvance's AI concierge.";

export const metadata: Metadata = {
  metadataBase: new URL("https://aidvance.xyz"),
  title,
  description,
  // Title, description, and the share image are filled into Open Graph and
  // Twitter from this default plus app/opengraph-image.tsx. Inner pages that
  // set their own title and description keep those.
  openGraph: {
    type: "website",
    url: "https://aidvance.xyz",
    siteName: "Aidvance",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
