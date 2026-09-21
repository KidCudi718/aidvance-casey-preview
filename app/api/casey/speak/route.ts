import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let text = "";
  try {
    const body = await req.json();
    text = String(body?.text || "").trim().slice(0, 1200);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  if (!text) return new Response("empty", { status: 400 });

  try {
    const tts = new MsEdgeTTS();
    // AvaNeural = warm, natural US female — not the browser robot
    await tts.setMetadata(
      "en-US-AvaNeural",
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
    );
    const { audioStream } = await tts.toStream(text);
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buf = Buffer.concat(chunks);
    return new Response(buf, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("tts failed", e);
    return Response.json({ error: "tts_failed" }, { status: 502 });
  }
}
