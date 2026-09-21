import { NextResponse } from "next/server";
import {
  CASEY_OPENER,
  CASEY_VOICE_INSTRUCTIONS,
} from "../../../../lib/caseyVoicePrompt";

export const runtime = "nodejs";

/**
 * Mint Speko transport for preview Casey with per-session bar overrides.
 * Production / live Speko agent config is NOT patched — overrides apply to this session only.
 */
export async function POST() {
  const apiKey = process.env.SPEKO_API_KEY;
  const agentId = process.env.SPEKO_AGENT_ID || "agent_881e018fd3a54815";
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
        mode: "cascade",
        agentId,
        ttlSeconds: 900,
        overrides: {
          agent: {
            prompt: CASEY_VOICE_INSTRUCTIONS,
            firstMessage: CASEY_OPENER,
          },
        },
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
      note: "Preview bar overrides on session only — live Speko agent / aidvance.xyz untouched.",
    });
  } catch (e) {
    console.error("speko session mint error", e);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach Speko." },
      { status: 502 }
    );
  }
}
