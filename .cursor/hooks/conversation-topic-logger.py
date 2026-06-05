#!/usr/bin/env python3
import datetime
import json
from pathlib import Path
import re
import sys
from typing import Any


def flatten_strings(node: Any) -> list[str]:
    out: list[str] = []
    if isinstance(node, str):
        text = node.strip()
        if text:
            out.append(text)
    elif isinstance(node, list):
        for item in node:
            out.extend(flatten_strings(item))
    elif isinstance(node, dict):
        for value in node.values():
            out.extend(flatten_strings(value))
    return out


def pick_text(payload: dict, key_candidates: list[str]) -> str:
    for key in key_candidates:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, (dict, list)):
            strings = flatten_strings(value)
            if strings:
                return " ".join(strings[:2])
    return ""


def summarize(text: str) -> str:
    if not text:
        return "（未捕获到文本）"
    clean = re.sub(r"\s+", " ", text).strip()
    return clean[:120] + ("..." if len(clean) > 120 else "")


def main() -> int:
    try:
        raw = sys.stdin.read().strip()
        payload = json.loads(raw) if raw else {}
    except Exception:
        payload = {}

    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    user_text = pick_text(
        payload,
        [
            "userPrompt",
            "prompt",
            "input",
            "arguments",
            "request",
            "message",
            "conversation",
        ],
    )
    assistant_text = pick_text(
        payload,
        [
            "assistantResponse",
            "response",
            "output",
            "result",
            "finalResponse",
            "content",
            "agent_message",
        ],
    )

    user_summary = summarize(user_text)
    assistant_summary = summarize(assistant_text)

    root = Path.cwd()
    log_dir = root / "对话日志"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"{date_str}.md"

    if not log_file.exists():
        log_file.write_text(f"# {date_str} 对话日志\n\n", encoding="utf-8")

    content = log_file.read_text(encoding="utf-8")
    rounds = re.findall(r"^### 回合 (\d+) \|", content, flags=re.MULTILINE)
    next_round = int(rounds[-1]) + 1 if rounds else 1

    entry = (
        f"### 回合 {next_round} | {time_str}\n"
        f"- **用户**：{user_summary}\n"
        f"- **回复**：{assistant_summary}\n"
        f"---\n"
    )

    with log_file.open("a", encoding="utf-8") as f:
        f.write(entry)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

