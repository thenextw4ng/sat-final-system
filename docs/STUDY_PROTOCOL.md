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

1. **Study cards:** review each exact headword, Indonesian meaning, English definition, and source example in the browser app. Mark a word mastered only after recalling it without looking.
2. **Contextual reading:** Vocabulary Day 1 has a built-in original four-paragraph passage that uses all 57 exact target headwords; the app highlights them and checks coverage. For Days 2–8, click **Copy AI practice prompt**. The AI tutor should verify the day's headwords against the matching JSON part, translate each definition into Indonesian, then write a new academic passage in 3–5 connected paragraphs using the target words naturally. It should create exactly five new SAT-style questions about that passage.
3. **Reading quiz:** answer the five new questions using clickable A–D controls. Reveal correctness and an explanation immediately after each selection.
4. **Vocabulary quiz:** finish Set 1 (20), Set 2 (20), Set 3 (10), and the bonus audit (7 or 6). The app provides immediate feedback, Indonesian meaning, English definition, and the source example for the tested word.
5. **Review:** revisit incorrect words and words not yet marked mastered. Mastery progress is separate from quiz accuracy.

The Day 1 Indonesian definition overlay is supplementary learning content; it does not overwrite the extracted source fields. Other vocabulary days currently retain their short Indonesian gloss and English definition until their Indonesian definition overlays are added. The app's source cards are the place to inspect the repository's original vocabulary fields. When generating new examples or contextual reading in ChatGPT, use fresh wording rather than reproducing source passages or long blocks of protected text.

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

Original question IDs, hashes, wording, choices, answer keys, and explanations must remain attached to their source records. Do not invent missing Domain, Skill, or Difficulty tags. Use the browser app for verbatim source-question presentation; ChatGPT should not reproduce large copyrighted question or passage blocks in chat.

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


### Mandatory explanation format for every quiz

All explanations must be in Indonesian, even when the source explanation is in English. For each Question Bank item, use this order: (1) inti soal, (2) skill yang diuji, (3) petunjuk/bukti kunci, (4) langkah penalaran, (5) alasan jawaban benar, (6) analisis opsi A–D satu per satu, (7) jebakan umum, and (8) strategi SAT yang dapat dipakai ulang. Paraphrase source material; do not reproduce the full passage or long source explanation. If a user answers incorrectly, diagnose the reasoning error constructively.

The browser app currently shows the original source explanation in English and offers a button to copy a Question-ID-based prompt for a structured Indonesian explanation in ChatGPT. The prompt points the tutor to the repository record rather than copying the source question into the chat.
