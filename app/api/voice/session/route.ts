import { NextResponse } from "next/server";
import { CASEY_VOICE_INSTRUCTIONS } from "@/lib/caseyVoicePrompt";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "missing_xai_key", message: "XAI_API_KEY is not set." },
      { status: 503 }
    );
  }

  let pains: string[] = [];
  try {
    const body = await req.json();
    pains = Array.isArray(body?.pains)
      ? body.pains
          .filter((p: unknown) => typeof p === "string" && (p as string).trim())
          .slice(0, 9)
      : [];
  } catch {
    /* empty ok */
  }

  const painNote =
    pains.length > 0
      ? `\n\n# Context\nVisitor already tapped these week-eaters: ${pains.join("; ")}. Use them.`
      : "";

  const r = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expires_after: { seconds: 300 } }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data?.value) {
    console.error("xai client_secrets", r.status, data);
    return NextResponse.json({ error: "token_failed" }, { status: 502 });
  }

  return NextResponse.json({
    token: data.value,
    expires_at: data.expires_at,
    model: "grok-voice-latest",
    voice: "eve",
    instructions: CASEY_VOICE_INSTRUCTIONS + painNote,
  });
}
