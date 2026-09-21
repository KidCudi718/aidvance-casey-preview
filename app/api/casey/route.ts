import { NextRequest, NextResponse } from "next/server";
import { CASEY_SYSTEM } from "@/lib/caseyPrompt";

export const runtime = "nodejs";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: NextRequest) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error: "offline",
        reply: "Casey is offline on this preview — the API key is not set.",
      },
      { status: 503 }
    );
  }

  let body: { messages?: Msg[]; pains?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const pains = (body.pains || []).filter(Boolean);
  const painNote =
    pains.length > 0
      ? `\n\nVisitor already tapped these week-eaters: ${pains.join("; ")}.`
      : "";

  const messages: Msg[] = [
    { role: "system", content: CASEY_SYSTEM + painNote },
    ...(body.messages || []).slice(-8),
  ];

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://aidvance.xyz",
      "X-Title": "Aidvance Casey Preview",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages,
      max_tokens: 120,
      temperature: 0.6,
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    console.error("openrouter", r.status, t.slice(0, 300));
    return NextResponse.json(
      {
        error: "upstream",
        reply: "Casey hit a snag. Try once more, or use the list below.",
      },
      { status: 502 }
    );
  }

  const data = await r.json();
  const reply =
    data?.choices?.[0]?.message?.content?.trim() ||
    "I didn't catch that. Tell me what eats your week.";

  return NextResponse.json({ reply });
}
