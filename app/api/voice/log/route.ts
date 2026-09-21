import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Turn = { role: "user" | "assistant"; text: string; at?: number };

export async function POST(req: Request) {
  let body: { turns?: Turn[]; meta?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const turns = Array.isArray(body.turns) ? body.turns.slice(0, 80) : [];
  if (!turns.length) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  const id = new Date().toISOString().replace(/[:.]/g, "-");
  const payload = {
    id,
    saved_at: new Date().toISOString(),
    meta: body.meta || {},
    turns,
  };

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = process.env.GITHUB_LOG_REPO || "KidCudi718/aidvance-casey-preview";
  let github = false;

  if (token) {
    const path = `call-logs/${id}.json`;
    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString(
      "base64"
    );
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `call log ${id}`,
        content,
        branch: "master",
      }),
    });
    github = r.ok;
    if (!r.ok) {
      const err = await r.text();
      console.error("github log failed", r.status, err.slice(0, 300));
    }
  } else {
    console.log("VOICE_LOG", JSON.stringify(payload));
  }

  return NextResponse.json({ ok: true, id, github });
}
