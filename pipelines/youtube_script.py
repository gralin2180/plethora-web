#!/usr/bin/env python3
"""Download subs (or Whisper) for a public video URL and print plain text."""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd), file=sys.stderr)
    subprocess.check_call(cmd)


def main() -> int:
    p = argparse.ArgumentParser(description="URL → transcript text")
    p.add_argument("url")
    p.add_argument("--lang", default="en")
    p.add_argument("--whisper", action="store_true", help="Force faster-whisper on downloaded audio")
    args = p.parse_args()

    with tempfile.TemporaryDirectory(prefix="plethora-yt-") as tmp:
        work = Path(tmp)
        if not args.whisper:
            try:
                run(
                    [
                        "yt-dlp",
                        "--write-auto-sub",
                        "--write-sub",
                        "--sub-langs",
                        f"{args.lang},en.*",
                        "--skip-download",
                        "--convert-subs",
                        "srt",
                        "-o",
                        str(work / "vid"),
                        args.url,
                    ]
                )
                srts = list(work.glob("*.srt"))
                if srts:
                    text = srts[0].read_text(encoding="utf-8", errors="replace")
                    lines = []
                    for line in text.splitlines():
                        if line.strip().isdigit() or "-->" in line or not line.strip():
                            continue
                        lines.append(line.strip())
                    print("\n".join(lines))
                    return 0
            except subprocess.CalledProcessError:
                print("No subs via yt-dlp; try --whisper", file=sys.stderr)

        audio = work / "audio.mp3"
        run(["yt-dlp", "-x", "--audio-format", "mp3", "-o", str(audio), args.url])
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            print("pip install faster-whisper", file=sys.stderr)
            return 2
        model = WhisperModel("medium", device="cuda", compute_type="float16")
        segs, _ = model.transcribe(str(audio))
        for s in segs:
            print(s.text.strip())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
