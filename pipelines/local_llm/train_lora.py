#!/usr/bin/env python3
"""LoRA fine-tune stub. Install unsloth in a venv on a NVIDIA box, then run.

Does not download data to Plethora. You pass --data JSONL locally.
Each line: {"prompt": "...", "response": "..."}
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--data", type=Path, required=True)
    p.add_argument("--out", type=Path, default=Path("./lora-out"))
    p.add_argument("--base", default="unsloth/llama-3.2-3b-instruct")
    args = p.parse_args()

    if not args.data.exists():
        print("missing jsonl", file=sys.stderr)
        return 1
    n = sum(1 for _ in args.data.open(encoding="utf-8") if _.strip())
    print(f"{n} examples in {args.data}")
    print("Install: pip install unsloth")
    print("Then adapt this script's training loop, or use Unsloth's official notebooks.")
    print("Target output dir:", args.out)
    print("Base:", args.base)
    try:
        rows = [json.loads(l) for l in args.data.read_text(encoding="utf-8").splitlines() if l.strip()]
        if rows and not {"prompt", "response"} <= set(rows[0]):
            print("expected keys prompt + response", file=sys.stderr)
            return 2
    except json.JSONDecodeError as e:
        print(e, file=sys.stderr)
        return 2
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "README.txt").write_text(
        "Drop your Unsloth trainer here. Plethora only scaffolds the dataset check.\n",
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
