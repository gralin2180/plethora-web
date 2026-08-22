#!/usr/bin/env python3
"""Write an Ollama Modelfile and optionally `ollama create`."""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--name", required=True, help="ollama create name")
    p.add_argument("--from", dest="base", default="llama3.2")
    p.add_argument("--system", default="You are a helpful local assistant.")
    p.add_argument("--temp", type=float, default=0.7)
    p.add_argument("--out", type=Path, default=Path("Modelfile"))
    p.add_argument("--create", action="store_true")
    args = p.parse_args()

    body = (
        f"FROM {args.base}\n"
        f'PARAMETER temperature {args.temp}\n'
        f'SYSTEM """{args.system}"""\n'
    )
    args.out.write_text(body, encoding="utf-8")
    print(f"wrote {args.out}")
    if args.create:
        subprocess.check_call(["ollama", "create", args.name, "-f", str(args.out)])
    else:
        print(f"next: ollama create {args.name} -f {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
