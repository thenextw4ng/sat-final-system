#!/usr/bin/env python3
"""Validate the SAT Final System's vocabulary and question-bank partitions."""
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
HEADER = re.compile(r"^## Question (\d{4}) — `([0-9a-f]+)`\s*$", re.M)
CHOICE = re.compile(r"^- \*\*([A-D])\.\*\*\s+(.+?)\s*$", re.M)
ANSWER = re.compile(r"\*\*Correct answer: ([A-D])\*\*")
EXPLANATION = re.compile(r"### Explanation\s*\n([\s\S]+)$")


def main() -> int:
    errors: list[str] = []
    manifest_path = DATA / "partition-manifest.json"
    if not manifest_path.exists():
        print("ERROR: data/partition-manifest.json is missing")
        return 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    vocab_parts = manifest.get("vocabulary", {}).get("parts", [])
    if len(vocab_parts) != 8:
        errors.append(f"Expected 8 vocabulary days; found {len(vocab_parts)}")
    if [p.get("count") for p in vocab_parts] != [57] * 7 + [56]:
        errors.append("Vocabulary distribution must be 57 × 7, then 56")
    vocab_ids, vocab_words = [], []
    for part in vocab_parts:
        path = DATA / part["file"]
        if not path.exists():
            errors.append(f"Missing {path.relative_to(ROOT)}")
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        words = payload.get("words", [])
        if len(words) != part["count"]:
            errors.append(f"{path.name}: expected {part['count']} words, found {len(words)}")
        for word in words:
            vocab_ids.append(word.get("id"))
            vocab_words.append(str(word.get("word", "")).strip().lower())
            for field in ("word", "meaning_id", "definition_en", "example"):
                if not str(word.get(field, "")).strip():
                    errors.append(f"Vocabulary #{word.get('id')}: missing {field}")
    if vocab_ids != list(range(1, 456)):
        errors.append("Vocabulary IDs must be exactly 1–455 in order")
    if len(set(vocab_words)) != 455:
        errors.append("Vocabulary headwords must be 455 unique values")

    question_parts = manifest.get("questions", {}).get("parts", [])
    if len(question_parts) != 21:
        errors.append(f"Expected 21 question-bank days; found {len(question_parts)}")
    if [p.get("count") for p in question_parts] != [60] * 20 + [34]:
        errors.append("Question distribution must be 60 × 20, then 34")
    question_ids = []
    for part in question_parts:
        path = DATA / part["file"]
        if not path.exists():
            errors.append(f"Missing {path.relative_to(ROOT)}")
            continue
        source = path.read_text(encoding="utf-8")
        headers = list(HEADER.finditer(source))
        if len(headers) != part["count"]:
            errors.append(f"{path.name}: expected {part['count']} questions, found {len(headers)}")
        for i, header in enumerate(headers):
            raw = source[header.start():headers[i + 1].start() if i + 1 < len(headers) else len(source)]
            qid = int(header.group(1))
            question_ids.append(qid)
            choices_block = re.search(r"### Answer choices\s*\n([\s\S]*?)(?=\n\*\*Correct answer:)", raw)
            choices = CHOICE.findall(choices_block.group(1)) if choices_block else []
            if [letter for letter, _ in choices] != ["A", "B", "C", "D"]:
                errors.append(f"Question #{qid:04d}: expected exactly A–D choices")
            if not ANSWER.search(raw):
                errors.append(f"Question #{qid:04d}: missing correct answer")
            if not EXPLANATION.search(raw):
                errors.append(f"Question #{qid:04d}: missing explanation")
    if question_ids != list(range(1, 1235)):
        errors.append("Question IDs must be exactly 0001–1234 in order")

    queue_path = DATA / "vocabulary-review-queue.json"
    if queue_path.exists():
        queue = json.loads(queue_path.read_text(encoding="utf-8"))
        review_ids = [item["id"] for item in queue.get("items", [])]
        if len(review_ids) != len(set(review_ids)):
            errors.append("Vocabulary review queue contains duplicate IDs")
        if any(item_id not in range(1, 456) for item_id in review_ids):
            errors.append("Vocabulary review queue contains an ID outside 1–455")

    if errors:
        print("VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print(json.dumps({
        "status": "ok",
        "vocabulary_days": len(vocab_parts),
        "vocabulary_words": len(vocab_ids),
        "question_days": len(question_parts),
        "questions": len(question_ids),
        "question_day_counts": [p["count"] for p in question_parts],
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
