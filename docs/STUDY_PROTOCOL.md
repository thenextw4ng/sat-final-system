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
2. **Contextual reading:** every Vocabulary Day 1–8 has a built-in original four-paragraph passage. Days 1–7 use all 57 exact target headwords; Day 8 uses all 56. The app highlights each target word and checks the passage's coverage and target-list alignment against the matching vocabulary JSON part.
3. **Reading quiz:** click **Copy AI comprehension quiz prompt** and send it to ChatGPT. The tutor reads the built-in passage for the selected day, generates exactly five original SAT-style questions, verifies each answer key against that passage, and presents an interactive A–D quiz with Indonesian explanations. These are GENERATED PRACTICE, separate from the original 1,234-question bank.
4. **Vocabulary quiz:** finish Set 1 (20), Set 2 (20), Set 3 (10), and the bonus audit (7 or 6). The app provides immediate feedback, Indonesian meaning, English definition, and the source example for the tested word.
5. **Review:** revisit incorrect words and words not yet marked mastered. Mastery progress is separate from quiz accuracy.

The Day 1 Indonesian definition overlay is supplementary learning content; it does not overwrite the extracted source fields. Other vocabulary days currently retain their short Indonesian gloss and English definition until their Indonesian definition overlays are added. The app's source cards are the place to inspect the repository's original vocabulary fields. When generating new examples and comprehension questions in ChatGPT, use fresh wording. The built-in contextual passages are repository-owned original learning content; do not replace them with unrelated passages.

## Track B — Original SAT question bank: 21 mixed days / 1,234 questions

The daily assignment is canonical in `data/question-day-map.json`. Use that file to determine the exact Question IDs and set membership for the selected day. Do not assume Question Bank Day N corresponds to `question-markdown/part-NN.md`.

- Days 1–20: 60 questions per day, split into Set 1 (20), Set 2 (20), and Set 3 (20).
- Day 21: 34 questions, split into Set 1 (20) and Set 2 (14).
- Every day and every set mixes all four domains as evenly as the source inventory permits.
- All 1,234 original IDs appear exactly once across the 21 days. IDs, hashes, wording, answer choices, answer keys, explanations, and metadata remain attached to the original records.

### Source-file resolution

The `data/question-markdown/part-01.md` … `part-21.md` files remain the canonical source archive, contiguous by Question ID. They are no longer daily assignments. For a Question ID `n`, its source file is `data/question-markdown/part-NN.md`, where `NN = floor((n - 1) / 60) + 1` (two-digit padded). Use the day map's `question_ids` or `sets[].question_ids` to retrieve the assigned records from their source parts, preserving the order specified by the map.

### Domain-inventory limitation

The available bank contains:
- Information and Ideas: 423 questions (34.3%)
- Craft and Structure: 269 questions (21.8%)
- Expression of Ideas: 281 questions (22.8%)
- Standard English Conventions: 261 questions (21.1%)

The College Board's approximate Reading & Writing domain weights are 26%, 28%, 20%, and 26%, respectively. The source bank has too few Craft and Structure and Standard English Conventions questions to reproduce those exact proportions while using only the existing 1,234 questions. The daily sets are therefore balanced to the available source inventory; do not label them as exact official-weighted simulations.

### Question session sequence

1. Select a Question Bank Day.
2. The app loads `data/question-day-map.json`, then retrieves the original records from the source parts needed for that day.
3. Answer each question by clicking A, B, C, or D.
4. The app immediately marks the answer correct/incorrect and reveals the source answer and explanation.
5. Continue through the 20-question sets. On Day 21, the final set contains 14 questions.
6. Review incorrect items by their exact source Question ID. Use the ID when asking ChatGPT for conceptual analysis.

Original question IDs and hashes are immutable identifiers. Do not invent missing Domain, Skill, or Difficulty tags. The browser app is the source-faithful interface for displaying and answering the original question text and choices. ChatGPT should focus on teaching, error analysis, and original analogous practice rather than reproducing large copyrighted source blocks.
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


## Original question-bank answer-key audit

The 1,234 repository answer-key letters were compared against the attached master file `Pasted text.txt` (English Question Bank — 1,234 Questions). All Question IDs 0001–1234 were present, with 0 missing keys and 0 mismatches. See `docs/QUESTION-KEY-AUDIT.md` and `data/question-bank-key-audit.json`. This audit does not certify rights to redistribute the question text.
