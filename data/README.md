# Data directory

## Committed full content

- `vocabulary-markdown/part-01.md` … `part-08.md`: full, readable vocabulary lists.
- `vocabulary/part-01.json` … `part-08.json`: structured full vocabulary records (word, part of speech, Indonesian meaning, English definition, example).
- `question-markdown/part-01.md` … `part-21.md`: complete copied source questions with passages/prompts, A–D choices, correct answers, and explanations.

The browser application reads `question-day-map.json` to assemble each mixed daily set from the original-ID source parts. The Markdown question files remain readable, complete source archives and are not daily assignments. Source part counts: questions 20×60 plus 34; mixed daily counts: 20×60 plus 34.

The importer can regenerate these partitions from the two source files in `sources/`.
