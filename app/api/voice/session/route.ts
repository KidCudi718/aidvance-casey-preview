import { NextResponse } from "next/server";
import { CASEY_OPENER } from "../../../../lib/caseyVoicePrompt";

export const runtime = "nodejs";

/**
 * Mint Speko transport for preview Casey.
 * Uses a dedicated bar-preview Speko agent (s2s + marin) — NOT the live aidvance.xyz agent.
 * Speko client "overrides" are a documented no-op; personality lives on the bar agent itself.
 */
export async function POST() {
  const apiKey = process.env.SPEKO_API_KEY;
  // Default is the bar-preview agent (marin s2s). Never fall back to the live web agent.
  const agentId = process.env.SPEKO_AGENT_ID || "agent_5809b0a36bb74006";
  const apiBase = (
    process.env.SPEKO_API_BASE || "https://api.speko.dev/v1"
  ).replace(/\/$/, "");

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "misconfigured",
        message: "SPEKO_API_KEY is not set on this preview.",
      },
      { status: 500 }
    );
  }

  try {
    const r = await fetch(`${apiBase}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Must be s2s to match live Speko Casey voice (marin). Cascade = different voice.
        mode: "s2s",
        agentId,
        ttlSeconds: 900,
      }),
      cache: "no-store",
    });

    const text = await r.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      /* ignore */
    }

    if (!r.ok) {
      console.error("speko session mint failed", r.status, text.slice(0, 300));
      return NextResponse.json(
        {
          error: r.status === 429 ? "busy" : "unavailable",
          message:
            r.status === 429
              ? "Casey is busy right now. Try again in a minute."
              : "Could not start Casey right now.",
        },
        { status: r.status === 429 ? 429 : 502 }
      );
    }

    const transportToken = (data.transportToken || data.conversationToken) as
      | string
      | undefined;
    const transportUrl = (data.transportUrl || data.livekitUrl) as
      | string
      | undefined;

    if (!transportToken || !transportUrl) {
      return NextResponse.json(
        {
          error: "bad_session",
          message: "Speko returned an incomplete session.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      transportToken,
      transportUrl,
      conversationToken: transportToken,
      livekitUrl: transportUrl,
      provider: "speko",
      agentId,
      sessionId: data.sessionId ?? null,
      opener: CASEY_OPENER,
      note: "Bar-preview Speko agent (s2s marin) — live aidvance.xyz Speko agent untouched.",
    });
  } catch (e) {
    console.error("speko session mint error", e);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach Speko." },
      { status: 502 }
    );
  }
}
