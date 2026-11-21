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

    # Validate the new mixed-domain day map separately from the immutable source archive.
    day_map_path = DATA / "question-day-map.json"
    if not day_map_path.exists():
        errors.append("data/question-day-map.json is missing")
    else:
        day_map = json.loads(day_map_path.read_text(encoding="utf-8"))
        day_entries = day_map.get("days", [])
        if len(day_entries) != 21:
            errors.append(f"Expected 21 mixed question days; found {len(day_entries)}")
        domain_ranges = day_map.get("source_domain_ranges", [])
        domain_totals = {d["key"]: 0 for d in domain_ranges}
        mapped_ids: list[int] = []
        for expected_day, entry in enumerate(day_entries, start=1):
            day_no = entry.get("day")
            expected_count = 34 if expected_day == 21 else 60
            expected_sets = [20, 14] if expected_day == 21 else [20, 20, 20]
            ids = entry.get("question_ids", [])
            sets = entry.get("sets", [])
            if day_no != expected_day:
                errors.append(f"Mixed day order mismatch: expected Day {expected_day}, found {day_no}")
            if entry.get("count") != expected_count or len(ids) != expected_count:
                errors.append(f"Mixed Day {expected_day}: expected {expected_count} IDs, found {len(ids)}")
            set_ids = [qid for block in sets for qid in block.get("question_ids", [])]
            if ids != set_ids:
                errors.append(f"Mixed Day {expected_day}: question_ids do not match flattened set order")
            if [block.get("count") for block in sets] != expected_sets:
                errors.append(f"Mixed Day {expected_day}: expected set counts {expected_sets}")
            if len(ids) != len(set(ids)):
                errors.append(f"Mixed Day {expected_day}: duplicate Question IDs")
            mapped_ids.extend(ids)

            actual_day_counts = {d["key"]: 0 for d in domain_ranges}
            for qid in ids:
                if not isinstance(qid, int) or qid < 1 or qid > 1234:
                    errors.append(f"Mixed Day {expected_day}: invalid Question ID {qid}")
                    continue
                matching = [d for d in domain_ranges if d["start"] <= qid <= d["end"]]
                if len(matching) != 1:
                    errors.append(f"Question #{qid:04d}: expected exactly one source-domain range")
                    continue
                key = matching[0]["key"]
                actual_day_counts[key] += 1
                domain_totals[key] += 1
            if entry.get("domain_counts") != actual_day_counts:
                errors.append(f"Mixed Day {expected_day}: domain_counts do not match assigned IDs")
            for set_no, block in enumerate(sets, start=1):
                block_counts = {d["key"]: 0 for d in domain_ranges}
                for qid in block.get("question_ids", []):
                    for d in domain_ranges:
                        if d["start"] <= qid <= d["end"]:
                            block_counts[d["key"]] += 1
                            break
                if block.get("domain_counts") != block_counts:
                    errors.append(f"Mixed Day {expected_day} Set {set_no}: domain_counts do not match assigned IDs")
        if sorted(mapped_ids) != list(range(1, 1235)):
            errors.append("Mixed day map must assign every Question ID 0001–1234 exactly once")
        for d in domain_ranges:
            if domain_totals.get(d["key"]) != d["count"]:
                errors.append(f"Mixed day map: {d['label']} total does not match source inventory")

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
