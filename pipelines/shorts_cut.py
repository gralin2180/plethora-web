#!/usr/bin/env python3
"""Download a public video, cut vertical shorts, optionally burn captions.

Requires: yt-dlp, ffmpeg on PATH.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd), file=sys.stderr)
    subprocess.check_call(cmd)


def load_cuts(path: Path | None, target: int) -> list[dict]:
    if path and path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict) and "cuts" in data:
            data = data["cuts"]
        return list(data)
    return [{"start": 0, "end": target, "hook": "open", "on_screen": ""}]


def ass_tiktok(line: str) -> str:
    safe = line.replace("\\", "\\\\").replace("{", "\\{")
    return (
        "[Script Info]\nPlayResX: 1080\nPlayResY: 1920\n\n"
        "[V4+ Styles]\n"
        "Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,"
        "0,0,0,0,100,100,0,0,1,4,0,2,40,40,220,1\n\n"
        "[Events]\n"
        f"Dialogue: 0,0:00:00.00,0:00:59.00,Default,,0,0,0,,{safe}\n"
    )


def ffmpeg_cut(src: Path, start: float, end: float, out: Path, captions: str, overlay: str) -> None:
    dur = max(0.5, end - start)
    vf = [
        "scale=1080:1920:force_original_aspect_ratio=increase",
        "crop=1080:1920",
    ]
    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        str(start),
        "-i",
        str(src),
        "-t",
        str(dur),
        "-c:a",
        "aac",
        "-b:a",
        "128k",
    ]
    if captions != "none" and overlay:
        ass = out.with_suffix(".ass")
        ass.write_text(ass_tiktok(overlay), encoding="utf-8")
        vf.append(f"ass={ass.as_posix()}")
    cmd.extend(["-vf", ",".join(vf), "-c:v", "libx264", "-preset", "fast", str(out)])
    run(cmd)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--url", required=True)
    p.add_argument("--cuts", type=Path)
    p.add_argument("--target", type=int, default=30)
    p.add_argument("--captions", choices=["none", "tiktok", "karaoke"], default="tiktok")
    p.add_argument("--out", type=Path, default=Path("out"))
    args = p.parse_args()

    cuts = load_cuts(args.cuts, args.target)
    args.out.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="plethora-cut-") as tmp:
        src = Path(tmp) / "src.%(ext)s"
        run(["yt-dlp", "-f", "bv*+ba/b", "-o", str(src), args.url])
        files = list(Path(tmp).glob("src.*"))
        if not files:
            print("download failed", file=sys.stderr)
            return 1
        video = files[0]
        for i, c in enumerate(cuts[:8], 1):
            start = float(c.get("start", 0))
            end = float(c.get("end", start + args.target))
            overlay = str(c.get("on_screen") or c.get("hook") or "")
            dest = args.out / f"short_{i:02d}.mp4"
            style = "none" if args.captions == "karaoke" and not overlay else args.captions
            if args.captions == "karaoke":
                style = "tiktok"  # word-level needs Whisper timestamps; tiktok-style line burn-in
            ffmpeg_cut(video, start, end, dest, style, overlay)
            print(dest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
