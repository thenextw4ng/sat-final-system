# SAT Final System

Source-first SAT Reading & Writing study workspace with two independent study tracks.

## Study tracks

| Track | Days | Total | Daily distribution |
|---|---:|---:|---|
| Vocabulary | 8 | 455 words | Days 1–7: 57 words; Day 8: 56 words |
| Original question bank | 21 | 1,234 questions | Days 1–20: 60 questions; Day 21: 34 questions |

The day number is independent between tracks. For example, Vocabulary Day 3 and Question Bank Day 8 can be studied in any order.

### Vocabulary track

Each day maps directly to the matching vocabulary data part. The browser app includes source vocabulary cards, meaning/definition/example reveal, a mastery checklist, and an interactive multiple-choice quiz. The quiz is divided into 20 + 20 + 10 questions, followed by a short bonus block containing the remaining 7 words (6 on Day 8), so every word is tested.

All eight vocabulary days now include an original contextual reading passage directly in the app. Each passage has four paragraphs and uses every exact target headword for that day (57 words on Days 1–7; 56 on Day 8); the app highlights the target words and checks both word-list alignment and passage coverage. The Day 1 Indonesian definition overlay provides expanded explanations alongside its short Indonesian gloss and English definition. Use **Copy AI comprehension quiz prompt** to create five new SAT-style questions based on that day's built-in passage. Those questions are labelled generated practice and must never be inserted into the original question bank.

### Original question-bank track

Each day maps directly to the matching question Markdown part. Days 1–20 contain 60 source questions each, shown in three sets of 20. Day 21 contains 34 questions, shown as 20 + 14. The interface preserves the original Question ID, hash, question block, answer choices, key, explanation, and available metadata. Clicking A–D immediately reveals correctness and the source explanation. Use **Salin prompt pembahasan Indonesia** to ask ChatGPT for a structured Indonesian analysis based on the exact Question ID. Progress and the last position are saved per day.

## Run locally

From the repository root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## ChatGPT activation prompt

Use [`docs/MASTER_AI_TUTOR_PROMPT.md`](docs/MASTER_AI_TUTOR_PROMPT.md) as the master instruction. Commands:

- `VOCAB DAY 1` … `VOCAB DAY 8`
- `SOAL DAY 1` … `SOAL DAY 21`
- `BAHAS SOAL #NNNN` for a structured Indonesian explanation of one exact Question ID

The two tracks keep independent progress. For exact source question presentation, use the browser app, which loads the repository files directly. ChatGPT should focus on teaching, original passage generation, error analysis, and review rather than reproducing large copyrighted source blocks in chat.

## Source files and integrity

- `data/vocabulary/part-01.json` … `part-08.json`: source vocabulary records.
- `data/vocabulary-markdown/part-01.md` … `part-08.md`: readable vocabulary source views.
- `data/question-markdown/part-01.md` … `part-21.md`: original question parts.
- `data/partition-manifest.json`: canonical partition map.
- `data/vocabulary-review-queue.json`: vocabulary records requiring manual comparison against the original licensed PDF before being treated as clean.

The importer can rebuild the data after the original source files are placed in `sources/`:

```bash
python -m pip install -r requirements.txt
python scripts/build_content.py --vocab sources/SAT_Vocab_455.pdf --questions sources/01_English_Question_Bank_1234.md --out data
```

This repository is currently public. Verify that every source license explicitly permits public redistribution before sharing it; a personal-use license may not be sufficient. A license for personal study does not necessarily grant permission to publish or redistribute source files.

## Progress and privacy

Progress is stored in this browser's `localStorage`; it is not synced between devices and no analytics are sent. Vocabulary mastery, vocabulary quizzes, and question-bank answers use separate storage keys.


### Answer-key audit

All 1,234 repository `Correct answer` letters were compared with the attached master MD for Question IDs 0001–1234: **1,234 matched, 0 missing, 0 mismatched**. See [Question Key Audit](docs/QUESTION-KEY-AUDIT.md). The original question-bank files were not modified by the audit.
