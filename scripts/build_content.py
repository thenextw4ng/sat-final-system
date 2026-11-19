#!/usr/bin/env python3
"""Split the supplied SAT vocabulary PDF and Markdown bank into app-ready files."""
from __future__ import annotations
import argparse, json, re
from pathlib import Path
from typing import Any

def clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def extract_vocabulary(pdf_path: Path) -> list[dict[str, Any]]:
    try:
        import fitz
    except ImportError as exc:
        raise SystemExit("Install dependencies: pip install -r requirements.txt") from exc
    doc = fitz.open(pdf_path)
    found = []
    for page_no, page in enumerate(doc):
        blocks = page.get_text("blocks")
        heads = []
        for b in blocks:
            x, y, _, _, txt = b[:5]
            m = re.search(r"^\s*([A-Za-z][A-Za-z -]*?)\s+(NOUN|VERB|ADJ)\s+#(\d+)\s*", txt.strip())
            if m:
                heads.append({"x": round(x), "y": float(y), "word": m.group(1).strip(),
                              "pos": m.group(2), "id": int(m.group(3)), "page": page_no + 1})
        for h in heads:
            next_y = min((x["y"] for x in heads if x["x"] == h["x"] and x["y"] > h["y"]), default=float("inf"))
            content = []
            for b in blocks:
                x, y, _, _, txt = b[:5]
                if abs(round(x)-h["x"]) <= 1 and h["y"] < y < next_y and txt.strip() and not re.search(r"\b(?:NOUN|VERB|ADJ)\s+#\d+", txt):
                    content.append((y, txt.strip()))
            content.sort()
            if len(content) < 2:
                raise ValueError(f"Could not extract vocabulary #{h['id']} {h['word']}")
            lines = [x.strip() for x in content[0][1].splitlines() if x.strip()]
            found.append({"id": h["id"], "word": h["word"], "part_of_speech": h["pos"],
                          "meaning_id": lines[0] if lines else "",
                          "definition_en": clean(" ".join(lines[1:])),
                          "example": clean(content[1][1]), "source_page": h["page"]})
    found.sort(key=lambda x: x["id"])
    if [x["id"] for x in found] != list(range(1,456)):
        raise ValueError(f"Vocabulary IDs/count invalid: {len(found)} entries")
    if any(not all(x[k] for k in ("word","meaning_id","definition_en","example")) for x in found):
        raise ValueError("One or more vocabulary entries have missing fields")
    return found

def extract_questions(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    marks = list(re.finditer(r"^## Question (\d{4}) — \`([0-9a-f]+)\`\s*$", text, re.M))
    if len(marks) != 1234:
        raise ValueError(f"Expected 1,234 question headers; found {len(marks)}")
    out = []
    for i, m in enumerate(marks):
        raw = text[m.start():(marks[i+1].start() if i+1 < len(marks) else len(text))].rstrip() + "\n"
        meta = re.search(r"^Domain: (.+?) · Skill: (.+?) · Difficulty: (.+?)\s*$", raw, re.M)
        qblock = re.search(r"### Question\s*\n(.*?)(?=\n### Answer choices)", raw, re.S)
        block = qblock.group(1).strip() if qblock else ""
        prompt = ""
        if "**Prompt:**" in block:
            qtext, prompt = block.split("**Prompt:**", 1)
            qtext, prompt = qtext.strip(), prompt.strip()
        else:
            qtext = block
        choices_block = re.search(r"### Answer choices\s*\n(.*?)(?=\n\*\*Correct answer:)", raw, re.S)
        choices = []
        if choices_block:
            choices = [{"letter": a, "text": b.strip()} for a,b in
                       re.findall(r"^- \*\*([A-D])\.\*\*\s*(.*?)\s*$", choices_block.group(1), re.M)]
        answer = re.search(r"\*\*Correct answer: ([A-D])\*\*", raw)
        exp = re.search(r"### Explanation\s*\n(.*)$", raw, re.S)
        if len(choices) != 4 or not answer or not exp:
            raise ValueError(f"Question {m.group(1)} failed structural audit")
        out.append({"id": int(m.group(1)), "hash": m.group(2),
                    "domain": meta.group(1) if meta else None,
                    "skill": meta.group(2) if meta else None,
                    "difficulty": meta.group(3) if meta else None,
                    "question_text": qtext, "prompt": prompt, "choices": choices,
                    "correct_answer": answer.group(1), "explanation": exp.group(1).strip(),
                    "raw_markdown": raw})
    if [q["id"] for q in out] != list(range(1,1235)):
        raise ValueError("Question IDs are not contiguous 0001–1234")
    return out

def dump(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def build(vocab_pdf: Path, question_md: Path, out: Path) -> dict[str, Any]:
    vocab, questions = extract_vocabulary(vocab_pdf), extract_questions(question_md)
    vm, qm = [], []
    for part in range(1,9):
        start, end = (part-1)*57+1, min(part*57,455)
        items = vocab[start-1:end]
        dump(out/"vocabulary"/f"part-{part:02d}.json",
             {"part":part,"total_parts":8,"start_id":start,"end_id":end,"count":len(items),"words":items})
        vm.append({"part":part,"file":f"vocabulary/part-{part:02d}.json","start_id":start,
                   "end_id":end,"count":len(items),"first_word":items[0]["word"],"last_word":items[-1]["word"]})
    for part in range(1,22):
        start, end = (part-1)*60+1, min(part*60,1234)
        items = questions[start-1:end]
        dump(out/"questions"/f"part-{part:02d}.json",
             {"part":part,"total_parts":21,"start_id":start,"end_id":end,"count":len(items),"questions":items})
        (out/"question-markdown").mkdir(parents=True,exist_ok=True)
        (out/"question-markdown"/f"part-{part:02d}.md").write_text(
            "\n".join(q["raw_markdown"].rstrip() for q in items)+"\n",encoding="utf-8")
        qm.append({"part":part,"file":f"questions/part-{part:02d}.json",
                   "verbatim_file":f"question-markdown/part-{part:02d}.md",
                   "start_id":start,"end_id":end,"count":len(items),
                   "first_hash":items[0]["hash"],"last_hash":items[-1]["hash"]})
    manifest={"schema_version":1,"source_files":{"vocabulary":vocab_pdf.name,"questions":question_md.name},
              "vocabulary":{"total":455,"parts":vm},
              "questions":{"total":1234,"items_per_full_part":60,"parts":qm}}
    dump(out/"partition-manifest.json",manifest)
    summary={"vocabulary_count":len(vocab),"vocabulary_parts":[x["count"] for x in vm],
             "question_count":len(questions),"question_parts":[x["count"] for x in qm],
             "questions_with_explicit_metadata":sum(bool(q["domain"] and q["skill"] and q["difficulty"]) for q in questions),
             "questions_without_explicit_metadata":sum(not(q["domain"] and q["skill"] and q["difficulty"]) for q in questions),
             "questions_missing_prompt_tag":sum(not bool(q["prompt"]) for q in questions)}
    dump(out/"audit-summary.json",summary)
    return summary

if __name__ == "__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--vocab",type=Path,required=True)
    ap.add_argument("--questions",type=Path,required=True)
    ap.add_argument("--out",type=Path,default=Path("data"))
    a=ap.parse_args()
    print(json.dumps(build(a.vocab,a.questions,a.out),ensure_ascii=False,indent=2))
