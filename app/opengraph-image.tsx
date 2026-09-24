import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Aidvance. Is AI right for your business?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// public/logo.png is a black wordmark on a white plate. The site inverts it
// in CSS. logo-on-dark.png is that file with the plate removed and the
// wordmark set to the page color (#f4f4f2) so the card matches the site.
const LOGO_WIDTH = 720;
const LOGO_HEIGHT = 158;

function loadAsset(name: string) {
  return readFile(join(process.cwd(), "app/opengraph", name));
}

function toBase64(data: Buffer) {
  return data.toString("base64");
}

export default async function OpenGraphImage() {
  const [logo, newsreader, mono] = await Promise.all([
    loadAsset("logo-on-dark.png"),
    loadAsset("Newsreader-Regular.ttf"),
    loadAsset("IBMPlexMono-Regular.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(ellipse 58% 46% at 50% 42%, #141414 0%, #000000 68%)",
          color: "#f4f4f2",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${toBase64(logo)}`}
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
          />
          <div
            style={{
              marginTop: 42,
              fontFamily: "Newsreader",
              fontSize: 64,
              lineHeight: 1,
              letterSpacing: -1.8,
              color: "#f4f4f2",
            }}
          >
            Is AI right for your business?
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: "IBM Plex Mono",
              fontSize: 18,
              letterSpacing: 4,
              color: "rgba(244, 244, 242, 0.62)",
            }}
          >
            TALK TO CASEY
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: newsreader, style: "normal", weight: 400 },
        { name: "IBM Plex Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}
