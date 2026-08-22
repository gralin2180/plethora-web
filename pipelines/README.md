# Local media pipelines

The hosted site can fetch **public YouTube captions** and run **AI rewrite / cut lists**.
It cannot download arbitrary video or burn captions into an MP4 on Vercel.

Install:

```bash
pip install yt-dlp
# optional: faster-whisper  (when there are no captions)
# ffmpeg must be on PATH  https://ffmpeg.org
```

## YouTube / any URL → transcript or script notes

```bash
python youtube_script.py "https://www.youtube.com/watch?v=VIDEO_ID"
python youtube_script.py URL --whisper   # if no subs
```

## Cut a vertical Short from a URL

1. Copy `cuts.json` from **Tools → Shorts clip generator** (or let the script auto-pick the first N minutes).
2. Run:

```bash
python shorts_cut.py --url URL --cuts cuts.json --target 30 --captions tiktok --out out
```

`--captions` is `none` | `tiktok` | `karaoke`. Karaoke needs a word-level SRT; otherwise it falls back to full-line burn-in.

Respect the source site’s terms. These scripts are for content you are allowed to process.
