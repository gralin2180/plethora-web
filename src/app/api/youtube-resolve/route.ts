import { NextResponse } from "next/server";

/**
 * Resolve a YouTube (or other) URL via Cobalt-compatible API for instant download links.
 * Local yt-dlp remains available in the UI for fully offline / private use.
 *
 * Optional env: COBALT_API_URL (default https://api.cobalt.tools/)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = String(body.url ?? "").trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Valid https URL required" }, { status: 400 });
    }
    if (!/youtube\.com|youtu\.be|youtube-nocookie\.com/i.test(url)) {
      return NextResponse.json(
        { error: "Paste a YouTube link. Other sites: use local yt-dlp." },
        { status: 400 }
      );
    }

    const cobalt = (process.env.COBALT_API_URL || "https://api.cobalt.tools/").replace(
      /\/?$/,
      "/"
    );

    const res = await fetch(cobalt, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Cobalt instances often expect a UA; optional API key
        ...(process.env.COBALT_API_KEY
          ? { Authorization: `Api-Key ${process.env.COBALT_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        url,
        // Newer cobalt API fields (ignored by older instances)
        downloadMode: body.audioOnly ? "audio" : "auto",
        videoQuality: body.quality || "1080",
      }),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            typeof data.error === "string"
              ? data.error
              : typeof data.text === "string"
                ? data.text
                : "Resolve service busy — try local yt-dlp.",
          raw: data,
        },
        { status: 502 }
      );
    }

    // Normalize common cobalt shapes
    const status = String(data.status ?? "");
    const links: { label: string; href: string }[] = [];

    if (typeof data.url === "string") {
      links.push({ label: status === "tunnel" ? "Download stream" : "Download", href: data.url });
    }
    if (Array.isArray(data.picker)) {
      for (const p of data.picker as { url?: string; type?: string }[]) {
        if (p.url) links.push({ label: p.type || "Stream", href: p.url });
      }
    }

    return NextResponse.json({
      ok: true,
      status,
      filename: data.filename,
      links,
      notice:
        "Links may expire. Only download media you have rights to. Prefer local yt-dlp for privacy.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not reach resolve service. Use local yt-dlp mode." },
      { status: 502 }
    );
  }
}
