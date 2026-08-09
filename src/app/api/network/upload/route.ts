import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 2 * 1024 * 1024;

/** Sink body for upload speed test — discard after counting. */
export async function POST(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) {
    return NextResponse.json({ bytes: 0 });
  }

  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value?.byteLength ?? 0;
      if (total > MAX) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        return NextResponse.json({ error: "Payload too large", bytes: total }, { status: 413 });
      }
    }
  } catch {
    return NextResponse.json({ error: "Upload aborted", bytes: total }, { status: 400 });
  }

  return NextResponse.json({ ok: true, bytes: total });
}
