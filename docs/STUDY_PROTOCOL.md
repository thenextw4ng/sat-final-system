# Study Protocol — Two Independent Tracks

Use two separate counters. Vocabulary Day 1 is not automatically the same study session as Question Bank Day 1.

## Track A — Vocabulary: 8 days / 455 words

| Day | Source IDs | Words | Quiz layout |
|---:|---:|---:|---|
| 1 | 001–057 | 57 | 20 + 20 + 10 + 7 bonus |
| 2 | 058–114 | 57 | 20 + 20 + 10 + 7 bonus |
| 3 | 115–171 | 57 | 20 + 20 + 10 + 7 bonus |
| 4 | 172–228 | 57 | 20 + 20 + 10 + 7 bonus |
| 5 | 229–285 | 57 | 20 + 20 + 10 + 7 bonus |
| 6 | 286–342 | 57 | 20 + 20 + 10 + 7 bonus |
| 7 | 343–399 | 57 | 20 + 20 + 10 + 7 bonus |
| 8 | 400–455 | 56 | 20 + 20 + 10 + 6 bonus |

### Vocabulary session sequence

1. **Study cards:** review each exact headword, Indonesian meaning, English definition, and source example in the private repository app. Mark a word mastered only after recalling it without looking.
2. **Contextual reading:** click **Copy SAT reading-passage prompt**. The AI tutor verifies the day's headwords against the matching JSON part, then writes a new academic passage in 3–5 connected paragraphs using the target words naturally. It creates exactly five new SAT-style questions about that passage.
3. **Reading quiz:** answer the five new questions using clickable A–D controls. Reveal correctness and an explanation immediately after each selection.
4. **Vocabulary quiz:** finish Set 1 (20), Set 2 (20), Set 3 (10), and the bonus audit (7 or 6). The app provides immediate feedback, Indonesian meaning, English definition, and the source example for the tested word.
5. **Review:** revisit incorrect words and words not yet marked mastered. Mastery progress is separate from quiz accuracy.

The app's source cards are the place to inspect the repository's original vocabulary fields. When generating new examples or contextual reading in ChatGPT, use fresh wording rather than reproducing source passages or long blocks of protected text.

## Track B — Original SAT question bank: 21 days / 1,234 questions

- Days 1–20: 60 source questions per day, grouped into Set 1 (20), Set 2 (20), and Set 3 (20).
- Day 21: 34 source questions, grouped into Set 1 (20) and Set 2 (14).
- Daily source IDs are contiguous and recorded in `data/partition-manifest.json`.

### Question session sequence

1. Select a Question Bank Day.
2. Answer each question by clicking A, B, C, or D.
3. The app immediately marks the answer correct/incorrect and reveals the source answer and explanation.
4. Continue through the 20-question sets. On Day 21, the final set contains 14 questions.
5. Review incorrect items by their exact source Question ID. Use the ID when asking ChatGPT for conceptual analysis.

Original question IDs, hashes, wording, choices, answer keys, and explanations must remain attached to their source records. Do not invent missing Domain, Skill, or Difficulty tags. Use the private app for verbatim source-question presentation; ChatGPT should not reproduce large copyrighted question or passage blocks in chat.

## Independent progress

- Vocabulary mastery checklist: global across 455 words.
- Vocabulary quiz answers and position: saved per Vocabulary Day.
- Question-bank answers and position: saved per Question Bank Day.
- Resetting one day must not reset the other track.

Browser progress is local to the current browser/device. Clearing browser storage deletes local progress.

## Source quality review

`data/vocabulary-review-queue.json` lists 19 vocabulary IDs previously flagged for possible extraction artifacts. Verify each against the original licensed PDF before considering the record corrected. Do not guess missing or corrupted text and do not silently rewrite the source record.

## Provenance

The question bank's audit reports 875 questions with complete explicit Domain/Skill/Difficulty metadata and 359 without the complete trio. Missing tags remain absent. Newly generated passages and questions belong to a separate generated-practice workflow and must never be inserted into the original-bank files.
