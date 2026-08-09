import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Best-effort YouTube caption fetch for public videos.
 * Falls back gracefully when captions are disabled.
 */

type Cue = { start: number; duration: number; text: string };

function parseXmlCaptions(xml: string): Cue[] {
  const cues: Cue[] = [];
  // classic timedtext format
  const re =
    /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const text = decodeEntities(m[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (!text) continue;
    cues.push({
      start: Number(m[1]),
      duration: Number(m[2]),
      text,
    });
  }
  if (cues.length) return cues;

  // json3 events sometimes returned
  try {
    const j = JSON.parse(xml) as {
      events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }[];
    };
    if (j.events) {
      for (const ev of j.events) {
        const text = (ev.segs || [])
          .map((s) => s.utf8 || "")
          .join("")
          .replace(/\n/g, " ")
          .trim();
        if (!text || text === "\n") continue;
        cues.push({
          start: (ev.tStartMs || 0) / 1000,
          duration: (ev.dDurationMs || 2000) / 1000,
          text,
        });
      }
    }
  } catch {
    /* not json */
  }
  return cues;
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ");
}

function cuesToSrt(cues: Cue[]): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const ts = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
  };
  return cues
    .map((c, i) => {
      const end = c.start + (c.duration || 2);
      return `${i + 1}\n${ts(c.start)} --> ${ts(end)}\n${c.text}\n`;
    })
    .join("\n");
}

function extractPlayerCaptions(html: string): {
  title?: string;
  tracks: { baseUrl: string; languageCode: string; kind?: string; name?: string }[];
} {
  const title =
    html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/)?.[1] ||
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(" - YouTube", "");

  const tracks: { baseUrl: string; languageCode: string; kind?: string; name?: string }[] = [];

  // captionTracks array fragment
  const capIdx = html.indexOf('"captionTracks"');
  if (capIdx !== -1) {
    const slice = html.slice(capIdx, capIdx + 12000);
    const baseUrls = [...slice.matchAll(/"baseUrl":"(https:[^"]+)"/g)];
    const langs = [...slice.matchAll(/"languageCode":"([^"]+)"/g)];
    for (let i = 0; i < baseUrls.length; i++) {
      const baseUrl = baseUrls[i][1].replace(/\\u0026/g, "&").replace(/\\"/g, '"');
      tracks.push({
        baseUrl,
        languageCode: langs[i]?.[1] || "und",
      });
    }
  }

  return { title, tracks };
}

export async function POST(req: Request) {
  let body: { videoId?: string; lang?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoId = (body.videoId || "").trim();
  if (!/^[\w-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
  }
  const prefer = (body.lang || "en").toLowerCase();

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const page = await fetch(watchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    const html = await page.text();
    const { title, tracks } = extractPlayerCaptions(html);

    if (!tracks.length) {
      return NextResponse.json(
        {
          error:
            "No public caption tracks found. Use yt-dlp auto-subs or local Whisper (commands on the tool page).",
          title,
        },
        { status: 404 }
      );
    }

    const sorted = [...tracks].sort((a, b) => {
      const score = (t: { languageCode: string }) => {
        const l = t.languageCode.toLowerCase();
        if (l === prefer) return 0;
        if (l.startsWith(prefer.split("-")[0])) return 1;
        if (l.startsWith("en")) return 2;
        return 3;
      };
      return score(a) - score(b);
    });

    let lastErr = "Could not download captions";
    for (const track of sorted.slice(0, 4)) {
      try {
        const url = track.baseUrl.includes("fmt=")
          ? track.baseUrl
          : `${track.baseUrl}&fmt=srv3`;
        const capRes = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        if (!capRes.ok) {
          lastErr = `Caption HTTP ${capRes.status}`;
          continue;
        }
        const raw = await capRes.text();
        const cues = parseXmlCaptions(raw);
        if (!cues.length) {
          lastErr = "Empty caption track";
          continue;
        }
        const plain = cues.map((c) => c.text).join("\n");
        return NextResponse.json({
          videoId,
          title,
          language: track.languageCode,
          source: "youtube-public-captions",
          note: "Fetched existing public captions. For no-caption videos use Whisper locally (free, GPU optional).",
          cues,
          plain,
          srt: cuesToSrt(cues),
        });
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "fetch failed";
      }
    }

    return NextResponse.json({ error: lastErr, title }, { status: 502 });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "YouTube blocked the caption request. Use the local yt-dlp / Whisper commands on this page.",
      },
      { status: 502 }
    );
  }
}
