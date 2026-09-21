import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("VOICE_LOG", JSON.stringify({
      at: new Date().toISOString(),
      turns: Array.isArray(body?.turns) ? body.turns.slice(0, 80) : [],
      meta: body?.meta || {},
    }));
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
