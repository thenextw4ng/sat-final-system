# SAT Final System

Private, source-first SAT Reading & Writing study workspace.

## Audited partitioning

| Collection | Total | Parts | Distribution |
|---|---:|---:|---|
| Vocabulary | 455 | 8 | Parts 01–07: 57 words; Part 08: 56 |
| Original question bank | 1,234 | 21 | Parts 01–20: 60 questions; Part 21: 34 |

The 10-day / 600-question core plan is Question Parts 01–10. Parts 11–21 preserve the remaining 634 source questions for continuation; none are discarded.

## Actual content files (already committed)

These are the real partition contents, not only indexes or ID ranges:

- `data/vocabulary/part-01.json` … `part-08.json`: complete word entries with Indonesian meanings, English definitions, and example sentences.
- `data/question-markdown/part-01.md` … `part-21.md`: full copied original Markdown question blocks, including text/passages, four choices, answer keys, and explanations.

The quiz interface reads those Markdown question files directly. The last question part contains 34 questions; all other question parts contain 60.

## Build the source data

Put the two source files in `sources/`:
- `SAT_Vocab_455.pdf`
- `01_English_Question_Bank_1234.md`

Install dependencies with `python -m pip install -r requirements.txt`, then run:

```bash
python scripts/build_content.py --vocab sources/SAT_Vocab_455.pdf --questions sources/01_English_Question_Bank_1234.md --out data
```

The importer generates 8 vocabulary JSON files, 21 question JSON files, 21 verbatim Markdown question parts, and audit/partition manifests. It checks IDs 1–455 and 0001–1234, choice count, answer keys, and explanations.

Run the app with `python -m http.server 8000` from the repository root, then open `http://localhost:8000`.

## Source-integrity rules

- Question parts preserve original ID order, hash, question text, choices, key, and explanation.
- No question is generated, paraphrased, or substituted in the original bank.
- Missing Domain/Skill/Difficulty metadata remains null.
- 27 source questions have no explicit `**Prompt:**` marker; the app shows the complete supplied question block without inventing a prompt.
- Keep this repository private unless the source licenses explicitly permit redistribution.
- Browser progress is stored locally in localStorage; no analytics are used.
