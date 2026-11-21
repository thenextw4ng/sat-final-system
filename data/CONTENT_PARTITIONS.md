# Actual source content partitions

All files here contain the full content copied from the uploaded source, not only ID ranges.

- `vocabulary/part-01.json` through `part-08.json`: actual words, parts of speech, Indonesian meanings, English definitions, and examples.
- `question-markdown/part-01.md` through `part-21.md`: canonical full source question blocks, answer choices, answer keys, and explanations. These remain contiguous by original Question ID and are **source archive parts, not daily assignments**.
- `question-day-map.json`: assigns every original Question ID exactly once to one of 21 daily mixed-domain practice days and to a 20-question set (Day 21 has 20 + 14).

The browser quiz reads the day map, then loads only the source parts needed for the selected day. Original wording, hashes, choices, answer keys, and explanations are preserved.

Vocabulary counts: 57, 57, 57, 57, 57, 57, 57, 56.
Source question-part counts: 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 34.
Mixed daily question counts: 60 × 20 days, then 34 on Day 21.
