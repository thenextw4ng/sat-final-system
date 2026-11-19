(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const KEYS = {
    mastered: "sat-final-system:vocab-mastered:v1",
    vocabDay: (day) => `sat-final-system:vocab-day:${day}:v2`,
    questionDay: (day) => `sat-final-system:question-day:${day}:v2`,
  };
  const state = {
    vocab: null,
    questions: null,
    vocabReviewQueue: [],
    indonesianDefinitions: {},
    readingPassage: null,
    vocabDay: 1,
    questionDay: 1,
    vocabIndex: 0,
    vocabAnswers: {},
    vocabFinished: false,
    questionIndex: 0,
    questionAnswers: {},
    questionFinished: false,
    vocabMode: "cards",
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      $("headerStatus").textContent = "Browser storage unavailable";
    }
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function button(text, className, handler) {
    const element = node("button", className || "button", text);
    element.type = "button";
    element.addEventListener("click", handler);
    return element;
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Cannot load ${path} (HTTP ${response.status})`);
    return response.json();
  }

  async function loadText(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Cannot load ${path} (HTTP ${response.status})`);
    return response.text();
  }

  function showError(target, error) {
    target.replaceChildren(node("div", "error", `${error.message}. Check that the repository data files are present and run the app through a local web server.`));
  }

  function selectModule(name) {
    document.querySelectorAll(".tab[data-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
    $("vocabPanel").classList.toggle("hidden", name !== "vocab");
    $("quizPanel").classList.toggle("hidden", name !== "quiz");
  }

  document.querySelectorAll(".tab[data-tab]").forEach((tab) => tab.addEventListener("click", () => selectModule(tab.dataset.tab)));

  for (let day = 1; day <= 8; day += 1) {
    const count = day === 8 ? 56 : 57;
    $("vocabDay").add(new Option(`Day ${day} · ${count} words`, day));
  }
  for (let day = 1; day <= 21; day += 1) {
    const count = day === 21 ? 34 : 60;
    $("questionDay").add(new Option(`Day ${day} · ${count} questions`, day));
  }

  function masteredIds() {
    return new Set(read(KEYS.mastered, []));
  }

  function updateVocabProgress() {
    const mastered = masteredIds();
    $("vocabProgress").textContent = `${mastered.size} / 455 mastered`;
    if (!state.vocab) return;
    const saved = read(KEYS.vocabDay(state.vocabDay), { answers: {}, index: 0, finished: false });
    const done = Object.keys(saved.answers || {}).length;
    $("vocabQuizProgress").textContent = `${done} / ${state.vocab.count} quiz answers saved`;
  }

  function showVocabCards() {
    state.vocabMode = "cards";
    $("vocabCardsArea").classList.remove("hidden");
    $("vocabQuizArea").classList.add("hidden");
    $("vocabCardsButton").classList.add("active-mode");
    $("vocabQuizButton").classList.remove("active-mode");
  }

  function showVocabQuiz() {
    state.vocabMode = "quiz";
    $("vocabCardsArea").classList.add("hidden");
    $("vocabQuizArea").classList.remove("hidden");
    $("vocabCardsButton").classList.remove("active-mode");
    $("vocabQuizButton").classList.add("active-mode");
    renderVocabQuestion();
  }

  function appendHighlightedText(parent, text, words) {
    const pattern = new RegExp("\\b(" + words.join("|") + ")\\b", "gi");
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      parent.append(document.createTextNode(text.slice(cursor, match.index)));
      parent.append(node("mark", "target-word", match[0]));
      cursor = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  }
  async function renderReadingPassage(day) {
    const area = $("readingPassageArea");
    area.replaceChildren();
    area.classList.add("hidden");
    state.readingPassage = null;
    if (day !== 1) return;
    try {
      const passage = await loadJson("data/reading-passages/day-01.json");
      state.readingPassage = passage;
      const fullText = passage.paragraphs.join(" ");
      const found = passage.target_words.filter((word) => new RegExp("\\b" + word + "\\b", "i").test(fullText));
      const missing = passage.target_words.filter((word) => !found.includes(word));
      const card = node("article", "reading-card");
      const header = node("div", "reading-heading");
      header.append(
        node("div", "eyebrow", "DAY 1 · CONTEXTUAL READING"),
        node("h3", "", passage.title),
        node("p", "subtle", passage.subtitle)
      );
      const body = node("div", "reading-body");
      passage.paragraphs.forEach((paragraph) => {
        const p = node("p");
        appendHighlightedText(p, paragraph, passage.target_words);
        body.append(p);
      });
      const audit = node("div", `passage-audit ${missing.length ? "audit-warning" : "audit-success"}`,
        missing.length
          ? `Vocabulary coverage: ${found.length}/${passage.target_words.length}. Missing: ${missing.join(", ")}`
          : `Vocabulary coverage verified: all ${found.length}/${passage.target_words.length} exact target words appear in the passage. Highlighted words are the Day 1 list.`
      );
      card.append(header, body, audit);
      area.append(card);
      area.classList.remove("hidden");
    } catch (error) {
      area.replaceChildren(node("div", "error", `Reading passage unavailable: ${error.message}`));
      area.classList.remove("hidden");
    }
  }

  function renderVocabCards() {
    const mastered = masteredIds();
    const grid = $("vocabGrid");
    grid.replaceChildren();
    state.vocab.words.forEach((word) => {
      const card = node("article", "word-card");
      const top = node("div", "word-top");
      const details = node("div", "word-detail");
      const actions = node("div", "word-actions");
      top.append(node("div", "word", word.word), node("span", "pos", word.part_of_speech || ""));
      details.hidden = true;
      details.append(
        node("div", "meaning", `Arti ringkas (Indonesia): ${word.meaning_id}`),
        node("div", "definition", `Definition (English): ${word.definition_en}`),
        node("div", "definition-id", `Definisi (Indonesia): ${state.indonesianDefinitions[word.id] || "Terjemahan definisi bahasa Indonesia belum tersedia untuk hari ini."}`),
        node("div", "example", word.example)
      );
      const reveal = button("Reveal meaning + example", "reveal", () => {
        details.hidden = !details.hidden;
        reveal.textContent = details.hidden ? "Reveal meaning + example" : "Hide details";
      });
      const label = node("label", "mastered");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "mastered-toggle";
      checkbox.checked = mastered.has(word.id);
      checkbox.addEventListener("change", () => {
        const all = masteredIds();
        checkbox.checked ? all.add(word.id) : all.delete(word.id);
        write(KEYS.mastered, [...all]);
        updateVocabProgress();
      });
      label.append(checkbox, document.createTextNode("I can recall this"));
      actions.append(reveal, label);
      card.append(top, details, actions);
      grid.append(card);
    });
    updateVocabProgress();
  }

  function vocabRounds(count) {
    const lengths = [20, 20, 10];
    const rounds = [];
    let cursor = 0;
    lengths.forEach((length, index) => {
      if (cursor >= count) return;
      const end = Math.min(cursor + length, count);
      rounds.push({ name: `Set ${index + 1}`, start: cursor, end, count: end - cursor });
      cursor = end;
    });
    if (cursor < count) rounds.push({ name: "Bonus audit", start: cursor, end: count, count: count - cursor });
    return rounds;
  }

  function currentVocabRound(index) {
    return vocabRounds(state.vocab.count).find((round) => index >= round.start && index < round.end) || null;
  }

  function makeVocabOptions(target, targetIndex) {
    const words = state.vocab.words;
    const offsets = [0, 11, 23, 37, 49, 7, 17, 31, 43, 53];
    const selected = [target];
    const seenMeanings = new Set([target.meaning_id]);
    for (const offset of offsets.slice(1)) {
      const candidate = words[(targetIndex + offset) % words.length];
      if (!seenMeanings.has(candidate.meaning_id)) {
        selected.push(candidate);
        seenMeanings.add(candidate.meaning_id);
      }
      if (selected.length === 4) break;
    }
    for (const candidate of words) {
      if (selected.length === 4) break;
      if (!seenMeanings.has(candidate.meaning_id)) {
        selected.push(candidate);
        seenMeanings.add(candidate.meaning_id);
      }
    }
    const shift = (target.id * 7 + state.vocabDay * 3) % 4;
    const distractors = selected.slice(1);
    const options = [selected[0], ...distractors];
    const rotated = options.map((_, index) => options[(index + shift) % options.length]);
    return rotated.map((entry, index) => ({ letter: "ABCD"[index], text: entry.meaning_id, id: entry.id }));
  }

  function saveVocab() {
    write(KEYS.vocabDay(state.vocabDay), {
      answers: state.vocabAnswers,
      index: state.vocabIndex,
      finished: state.vocabFinished,
    });
    updateVocabProgress();
  }

  function renderVocabQuestion() {
    const area = $("vocabQuizArea");
    area.replaceChildren();
    if (!state.vocab) return;
    if (state.vocabFinished) {
      renderVocabReview();
      return;
    }
    if (state.vocabIndex >= state.vocab.words.length) {
      state.vocabFinished = true;
      saveVocab();
      renderVocabReview();
      return;
    }

    const index = state.vocabIndex;
    const word = state.vocab.words[index];
    const round = currentVocabRound(index);
    const options = makeVocabOptions(word, index);
    const chosen = state.vocabAnswers[word.id] || null;
    const correctChoice = options.find((option) => option.id === word.id);
    const correct = chosen === correctChoice?.letter;
    const card = node("article", "quiz-card");
    const meta = node("div", "quiz-meta");
    meta.append(
      node("span", "", `VOCAB ID #${String(word.id).padStart(3, "0")} · ${round.name.toUpperCase()}`),
      node("span", "", `${index + 1} / ${state.vocab.count}`)
    );
    card.append(meta, node("div", "subtle", `${round.count} questions in this block · ${index - round.start + 1} / ${round.count}`));
    card.append(node("h3", "vocab-question-word", word.word));
    card.append(node("p", "prompt", "Choose the closest Indonesian meaning."));

    const choices = node("div", "choices");
    options.forEach((option) => {
      const choice = button(`${option.letter}.  ${option.text}`, "choice-button", () => {
        if (state.vocabAnswers[word.id]) return;
        state.vocabAnswers[word.id] = option.letter;
        saveVocab();
        renderVocabQuestion();
      });
      if (chosen) {
        choice.disabled = true;
        if (option.id === word.id) choice.classList.add("choice-correct");
        else if (option.letter === chosen) choice.classList.add("choice-incorrect");
      }
      choices.append(choice);
    });
    card.append(choices);

    if (chosen) {
      const feedback = node("div", `feedback ${correct ? "feedback-correct" : "feedback-incorrect"}`);
      feedback.append(
        node("strong", "", correct ? "Correct!" : `Not quite. Correct answer: ${correctChoice.letter}.`),
        node("p", "meaning", `Arti ringkas (Indonesia): ${word.meaning_id}`),
        node("p", "definition", `Definition (English): ${word.definition_en}`),
        node("p", "definition-id", `Definisi (Indonesia): ${state.indonesianDefinitions[word.id] || "Terjemahan definisi bahasa Indonesia belum tersedia untuk hari ini."}`),
        node("p", "example", word.example)
      );
      card.append(feedback);
    } else {
      card.append(node("p", "subtle", "The meaning, definition, and source example appear immediately after you choose."));
    }

    const nav = node("div", "quiz-nav");
    const previous = button("← Previous", "button ghost", () => {
      if (state.vocabIndex > 0) {
        state.vocabIndex -= 1;
        saveVocab();
        renderVocabQuestion();
      }
    });
    previous.disabled = index === 0;
    const next = button(index === state.vocab.words.length - 1 ? "Finish vocabulary day" : "Next word →", "button primary", () => {
      if (!state.vocabAnswers[word.id]) return;
      state.vocabIndex += 1;
      if (state.vocabIndex >= state.vocab.words.length) state.vocabFinished = true;
      saveVocab();
      renderVocabQuestion();
    });
    next.disabled = !chosen;
    nav.append(previous, next);
    card.append(nav);
    area.append(card);
    updateVocabProgress();
  }

  function renderVocabReview() {
    const area = $("vocabQuizArea");
    area.replaceChildren();
    const total = state.vocab.words.length;
    const answered = Object.keys(state.vocabAnswers).length;
    const score = state.vocab.words.reduce((sum, word, index) => {
      const correct = makeVocabOptions(word, index).find((option) => option.id === word.id);
      return sum + (state.vocabAnswers[word.id] === correct?.letter ? 1 : 0);
    }, 0);
    const summary = node("div", "quiz-card");
    summary.append(
      node("div", "eyebrow", `VOCAB DAY ${state.vocabDay} COMPLETE`),
      node("h2", "", `${score} / ${total} correct`),
      node("p", "subtle", `${answered} answers recorded. Vocabulary mastery checkboxes are tracked separately.`),
      button("Retake this vocabulary day", "button ghost", () => {
        if (!confirm("Clear this day's quiz answers and start again?")) return;
        state.vocabAnswers = {};
        state.vocabIndex = 0;
        state.vocabFinished = false;
        saveVocab();
        renderVocabQuestion();
      })
    );
    const rounds = vocabRounds(total);
    const roundSummary = node("div", "round-summary");
    rounds.forEach((round) => {
      const countCorrect = state.vocab.words.slice(round.start, round.end).reduce((sum, word, offset) => {
        const idx = round.start + offset;
        const correct = makeVocabOptions(word, idx).find((option) => option.id === word.id);
        return sum + (state.vocabAnswers[word.id] === correct?.letter ? 1 : 0);
      }, 0);
      roundSummary.append(node("span", "round-chip", `${round.name}: ${countCorrect}/${round.count}`));
    });
    summary.append(roundSummary);
    area.append(summary);
    updateVocabProgress();
  }

  async function loadVocabDay(day) {
    state.vocabDay = day;
    $("vocabDay").value = day;
    $("vocabGrid").replaceChildren(node("div", "loading", "Loading vocabulary…"));
    try {
      state.vocab = await loadJson(`data/vocabulary/part-${String(day).padStart(2, "0")}.json`);
      const definitionData = await loadJson(`data/vocabulary/indonesian-definitions/part-${String(day).padStart(2, "0")}.json`).catch(() => ({ definitions: {} }));
      state.indonesianDefinitions = definitionData.definitions || {};
      await renderReadingPassage(day);
      const saved = read(KEYS.vocabDay(day), { answers: {}, index: 0, finished: false });
      state.vocabAnswers = saved.answers || {};
      state.vocabIndex = Math.min(saved.index || 0, Math.max(0, state.vocab.count - 1));
      state.vocabFinished = !!saved.finished;
      $("vocabRange").textContent = `Source IDs #${state.vocab.start_id}–${state.vocab.end_id} · ${state.vocab.count} words`;
      const flagged = state.vocabReviewQueue.filter((item) => item.id >= state.vocab.start_id && item.id <= state.vocab.end_id);
      const notice = $("vocabQualityNotice");
      notice.replaceChildren();
      notice.classList.toggle("hidden", flagged.length === 0);
      if (flagged.length) notice.textContent = `Source-quality review required for vocabulary IDs: ${flagged.map((item) => item.id).join(", ")}. Compare these records with the original licensed PDF; do not guess corrections.`;
      $("vocabDayHeading").textContent = `Vocabulary Day ${day}`;
      renderVocabCards();
      if (state.vocabMode === "quiz") renderVocabQuestion();
    } catch (error) {
      showError($("vocabGrid"), error);
    }
  }

  function buildReadingPrompt() {
    const words = state.vocab.words.map((item) => item.word).join(", ");
    return [
      "Act as my SAT Reading and Writing vocabulary tutor.",
      `Use Vocabulary Day ${state.vocabDay} from thenextw4ng/sat-final-system as the source of the target-word list.`,
      `The exact target words for this day are: ${words}.`,
      "First, verify the target list against data/vocabulary/part-XX.json in the repository. Do not add, omit, or substitute headwords.",
      "Create one coherent original academic reading passage in 3–5 connected paragraphs (about 550–800 words) that uses every target word naturally. Do not force awkward usage; if a word genuinely cannot fit, identify it and explain why.",
      "Then create exactly five original Digital SAT Reading and Writing-style multiple-choice questions about the passage. Use varied skills: words in context, central idea, inference, textual evidence, and author purpose/structure.",
      "For every target word, also provide a clear, natural Indonesian definition that explains the concept, not only a one-word synonym. Keep the English definition and Indonesian explanation side by side.",
      "For every question, provide four plausible choices, one correct answer, and a structured explanation entirely in Indonesian: (1) inti yang ditanyakan, (2) bukti/petunjuk kunci, (3) langkah penalaran, (4) alasan jawaban benar, (5) alasan setiap distractor salah, and (6) strategi mengenali pola serupa. Keep the passage and question in English. Do not copy a published SAT passage or question.",
      "Render the five questions as a genuinely interactive multiple-choice quiz with clickable A–D options and immediate right/wrong feedback, correct answer, and explanation after each selection.",
      "After the reading quiz, run the vocabulary quiz in blocks of 20, 20, 10, then the remaining 7 words (6 on Day 8). Explain the tested word's Indonesian meaning and usage after each answer.",
      "Use Indonesian for teaching and explanations, but keep the passage and questions in English. Keep vocabulary progress separate from the original question-bank progress."
    ].join("\n\n");
  }

  async function copyReadingPrompt() {
    if (!state.vocab) return;
    try {
      await navigator.clipboard.writeText(buildReadingPrompt());
      $("headerStatus").textContent = `Reading prompt copied · Vocab Day ${state.vocabDay}`;
    } catch (_) {
      $("readingPromptPreview").textContent = buildReadingPrompt();
      $("readingPromptPreview").classList.remove("hidden");
      $("headerStatus").textContent = "Clipboard unavailable; prompt shown below";
    }
  }

  function parseQuestionMarkdown(markdown, day) {
    const headers = [...markdown.matchAll(/^## Question (\d{4}) — `([0-9a-f]+)`[ \t]*$/gm)];
    if (!headers.length) throw new Error("No original question headers found in this day file");
    const questions = headers.map((header, index) => {
      const raw = markdown.slice(header.index, index + 1 < headers.length ? headers[index + 1].index : markdown.length);
      const metadata = raw.match(/^Domain: (.+?) · Skill: (.+?) · Difficulty: (.+?)\s*$/m);
      const questionBlock = raw.match(/### Question\s*\n([\s\S]*?)(?=\n### Answer choices)/);
      if (!questionBlock) throw new Error(`Question ${header[1]} has no question block`);
      let questionText = questionBlock[1].trim();
      let prompt = "";
      if (questionText.includes("**Prompt:**")) {
        const chunks = questionText.split("**Prompt:**");
        questionText = chunks[0].trim();
        prompt = chunks.slice(1).join("**Prompt:**").trim();
      }
      const choicesBlock = raw.match(/### Answer choices\s*\n([\s\S]*?)(?=\n\*\*Correct answer:)/);
      const choices = choicesBlock
        ? [...choicesBlock[1].matchAll(/^- \*\*([A-D])\.\*\*\s*(.*?)\s*$/gm)].map((match) => ({ letter: match[1], text: match[2].trim() }))
        : [];
      const answer = raw.match(/\*\*Correct answer: ([A-D])\*\*/);
      const explanation = raw.match(/### Explanation\s*\n([\s\S]*)$/);
      if (choices.length !== 4 || !answer || !explanation) throw new Error(`Question ${header[1]} failed structural integrity check`);
      return {
        id: Number(header[1]), hash: header[2],
        domain: metadata ? metadata[1] : null,
        skill: metadata ? metadata[2] : null,
        difficulty: metadata ? metadata[3] : null,
        question_text: questionText, prompt, choices,
        correct_answer: answer[1], explanation: explanation[1].trim()
      };
    });
    return {
      day, total_days: 21, start_id: questions[0].id,
      end_id: questions[questions.length - 1].id, count: questions.length, questions
    };
  }

  function saveQuestions() {
    write(KEYS.questionDay(state.questionDay), {
      answers: state.questionAnswers,
      index: state.questionIndex,
      finished: state.questionFinished,
    });
    updateQuestionProgress();
  }

  function questionScore() {
    if (!state.questions) return 0;
    return state.questions.questions.reduce((sum, question) => sum + (state.questionAnswers[question.id] === question.correct_answer ? 1 : 0), 0);
  }

  function updateQuestionProgress() {
    if (!state.questions) return;
    const answered = Object.keys(state.questionAnswers).filter((id) => state.questionAnswers[id]).length;
    $("quizProgress").textContent = `${answered} / ${state.questions.count} answered${state.questionFinished ? ` · ${questionScore()} correct` : ""}`;
  }

  function finishQuestionDay() {
    state.questionFinished = true;
    saveQuestions();
    renderQuestionReview();
  }

  function buildQuestionExplanationPrompt(question) {
    const id = String(question.id).padStart(4, "0");
    const part = String(state.questionDay).padStart(2, "0");
    return [
      "BAHAS SOAL #" + id,
      "Repository sumber: https://github.com/thenextw4ng/sat-final-system",
      "File sumber: data/question-markdown/part-" + part + ".md",
      "Cari dan verifikasi Question ID #" + id + " beserta hash-nya di file tersebut. Gunakan record itu sebagai sumber; jangan menebak jika file atau record tidak dapat diakses.",
      "Jelaskan seluruh pembahasan dalam bahasa Indonesia yang sederhana, runtut, dan mendalam. Pertahankan istilah SAT/English yang penting dalam tanda kurung lalu jelaskan artinya.",
      "Jangan menyalin ulang soal atau passage. Parafrase bukti yang relevan dengan kata-katamu sendiri.",
      "Gunakan struktur wajib berikut:",
      "1. INTI SOAL — apa tepatnya yang diminta?",
      "2. KONSEP / SKILL — jelaskan skill yang diuji. Jika metadata tidak tersedia, nyatakan bahwa metadata sumber tidak tersedia dan klasifikasikan secara hati-hati.",
      "3. BUKTI KUNCI — tunjukkan bagian informasi, hubungan, data, atau aturan grammar yang menentukan jawaban; parafrase, jangan salin panjang.",
      "4. LANGKAH PENALARAN — uraikan proses berpikir secara berurutan, dari petunjuk sampai kesimpulan.",
      "5. JAWABAN BENAR — jelaskan mengapa opsi yang benar paling tepat.",
      "6. ANALISIS SEMUA OPSI — bahas A, B, C, dan D satu per satu: mengapa benar atau mengapa tidak tepat. Jangan hanya mengatakan 'tidak didukung'.",
      "7. JEBakan / KESALAHAN UMUM — jelaskan daya tarik distractor dan miskonsepsi yang harus dihindari.",
      "8. STRATEGI SAT — berikan cara mengenali pola soal serupa dan langkah efisien untuk mengerjakannya.",
      "Jawaban saya: " + (state.questionAnswers[question.id] || "belum dijawab"),
      "Jangan mengarang bukti yang tidak ada. Bila ada grafik, tabel, atau teks yang tidak dapat dibaca dari record, jelaskan keterbatasannya."
    ].join("\n\n");
  }

  async function copyQuestionExplanationPrompt(question) {
    const prompt = buildQuestionExplanationPrompt(question);
    try {
      await navigator.clipboard.writeText(prompt);
      $("headerStatus").textContent = "Prompt pembahasan Indonesia disalin · Question #" + String(question.id).padStart(4, "0");
    } catch (_) {
      const preview = $("questionPromptPreview");
      preview.textContent = prompt;
      preview.classList.remove("hidden");
      $("headerStatus").textContent = "Clipboard tidak tersedia; prompt ditampilkan di bawah";
    }
  }

  function renderQuestion() {
    const area = $("quizArea");
    area.replaceChildren();
    if (!state.questions) return;
    if (state.questionFinished) {
      renderQuestionReview();
      return;
    }
    const question = state.questions.questions[state.questionIndex];
    if (!question) return finishQuestionDay();
    const chosen = state.questionAnswers[question.id] || null;
    const correct = chosen === question.correct_answer;
    const setNumber = Math.floor(state.questionIndex / 20) + 1;
    const setStart = Math.floor(state.questionIndex / 20) * 20;
    const setCount = Math.min(20, state.questions.count - setStart);
    const card = node("article", "quiz-card");
    const meta = node("div", "quiz-meta");
    meta.append(
      node("span", "", `QUESTION ID #${String(question.id).padStart(4, "0")} · SET ${setNumber}`),
      node("span", "", `${state.questionIndex + 1} / ${state.questions.count}`)
    );
    card.append(meta, node("div", "subtle", `Set contains ${setCount} questions · ${state.questionIndex - setStart + 1} / ${setCount}`));
    card.append(node("div", "subtle", [question.domain, question.skill, question.difficulty].filter(Boolean).join(" · ") || "Source metadata not supplied for this item"));
    card.append(node("div", "passage", question.question_text));
    if (question.prompt) card.append(node("div", "prompt", question.prompt));
    const choices = node("div", "choices");
    question.choices.forEach((choice) => {
      const option = button(`${choice.letter}.  ${choice.text}`, "choice-button", () => {
        if (state.questionAnswers[question.id]) return;
        state.questionAnswers[question.id] = choice.letter;
        saveQuestions();
        renderQuestion();
      });
      if (chosen) {
        option.disabled = true;
        if (choice.letter === question.correct_answer) option.classList.add("choice-correct");
        else if (choice.letter === chosen) option.classList.add("choice-incorrect");
      }
      choices.append(option);
    });
    card.append(choices);
    if (chosen) {
      const feedback = node("div", `feedback ${correct ? "feedback-correct" : "feedback-incorrect"}`);
      feedback.append(
        node("strong", "", correct ? "Benar!" : `Belum tepat. Jawaban benar: ${question.correct_answer}.`),
        node("div", "explanation-label", "Penjelasan sumber (bahasa Inggris)"),
        node("p", "source-explanation", question.explanation),
        node("div", "explanation-guidance", "Ingin memahami alasan jawabannya dalam bahasa Indonesia? Salin prompt di bawah, lalu kirim ke ChatGPT. Tutor akan mengambil record berdasarkan Question ID dan membahasnya dengan format terstruktur.")
      );
      feedback.append(button("Salin prompt pembahasan Indonesia", "button primary explanation-copy", () => copyQuestionExplanationPrompt(question)));
      card.append(feedback);
    } else {
      card.append(node("p", "subtle", "Choose A–D. The answer and source explanation appear immediately after your selection."));
    }
    const navigation = node("div", "quiz-nav");
    const previous = button("← Previous", "button ghost", () => {
      state.questionIndex = Math.max(0, state.questionIndex - 1);
      saveQuestions();
      renderQuestion();
    });
    previous.disabled = state.questionIndex === 0;
    const next = button(state.questionIndex === state.questions.count - 1 ? "Finish day" : "Next question →", "button primary", () => {
      if (!state.questionAnswers[question.id]) return;
      if (state.questionIndex === state.questions.count - 1) return finishQuestionDay();
      state.questionIndex += 1;
      saveQuestions();
      renderQuestion();
    });
    next.disabled = !chosen;
    navigation.append(previous, next);
    card.append(navigation);
    area.append(card);
    updateQuestionProgress();
  }

  function renderQuestionReview() {
    const area = $("quizArea");
    area.replaceChildren();
    const score = questionScore();
    const answered = Object.keys(state.questionAnswers).length;
    const summary = node("div", "quiz-card");
    summary.append(
      node("div", "eyebrow", `QUESTION BANK DAY ${state.questionDay} COMPLETE`),
      node("h2", "", `${score} / ${state.questions.count} correct`),
      node("p", "subtle", `${answered} answers recorded. Original Question IDs remain unchanged.`),
      button("Retake this day", "button ghost", () => {
        if (!confirm("Clear this day's saved answers and retake it?")) return;
        state.questionAnswers = {};
        state.questionIndex = 0;
        state.questionFinished = false;
        saveQuestions();
        renderQuestion();
      })
    );
    const roundChips = node("div", "round-summary");
    for (let start = 0, round = 1; start < state.questions.count; start += 20, round += 1) {
      const items = state.questions.questions.slice(start, start + 20);
      const correct = items.reduce((sum, question) => sum + (state.questionAnswers[question.id] === question.correct_answer ? 1 : 0), 0);
      roundChips.append(node("span", "round-chip", `Set ${round}: ${correct}/${items.length}`));
    }
    summary.append(roundChips);
    area.append(summary);
    const list = node("div", "review-list");
    state.questions.questions.forEach((question) => {
      const chosen = state.questionAnswers[question.id] || "—";
      const isCorrect = chosen === question.correct_answer;
      const item = node("article", `review-item ${isCorrect ? "correct" : "incorrect"}`);
      const details = document.createElement("details");
      details.append(
        node("summary", "", `#${String(question.id).padStart(4, "0")} · Your answer: ${chosen} · Correct: ${question.correct_answer} · ${isCorrect ? "Correct" : "Review"}`),
        node("p", "", question.question_text)
      );
      if (question.prompt) details.append(node("p", "", question.prompt));
      question.choices.forEach((choice) => details.append(node("p", "", `${choice.letter}. ${choice.text}`)));
      details.append(node("p", "explanation", question.explanation));
      item.append(details);
      list.append(item);
    });
    area.append(list);
    updateQuestionProgress();
  }

  async function loadQuestionDay(day) {
    state.questionDay = day;
    $("questionDay").value = day;
    $("quizArea").replaceChildren(node("div", "loading", "Loading original question bank…"));
    try {
      const markdown = await loadText(`data/question-markdown/part-${String(day).padStart(2, "0")}.md`);
      state.questions = parseQuestionMarkdown(markdown, day);
      const legacy = read(`sat-final-system:quiz:${day}:v1`, { answers: {}, finished: false });
      const saved = read(KEYS.questionDay(day), { answers: legacy.answers || {}, index: 0, finished: !!legacy.finished });
      state.questionAnswers = saved.answers || {};
      state.questionIndex = Math.min(saved.index || 0, Math.max(0, state.questions.count - 1));
      state.questionFinished = !!saved.finished;
      $("questionRange").textContent = `Original IDs #${state.questions.start_id}–${state.questions.end_id} · ${state.questions.count} questions`;
      $("questionDayHeading").textContent = `Question Bank Day ${day}`;
      renderQuestion();
    } catch (error) {
      showError($("quizArea"), error);
    }
  }

  $("vocabDay").addEventListener("change", (event) => loadVocabDay(Number(event.target.value)));
  $("questionDay").addEventListener("change", (event) => loadQuestionDay(Number(event.target.value)));
  $("vocabCardsButton").addEventListener("click", showVocabCards);
  $("vocabQuizButton").addEventListener("click", showVocabQuiz);
  $("copyReadingPrompt").addEventListener("click", copyReadingPrompt);
  $("resetVocab").addEventListener("click", () => {
    if (!state.vocab || !confirm("Clear mastered status for this vocabulary day?")) return;
    const ids = new Set(state.vocab.words.map((word) => word.id));
    write(KEYS.mastered, [...masteredIds()].filter((id) => !ids.has(id)));
    renderVocabCards();
  });
  $("resetQuestionDay").addEventListener("click", () => {
    if (!state.questions || !confirm("Clear saved answers for this question-bank day?")) return;
    state.questionAnswers = {};
    state.questionIndex = 0;
    state.questionFinished = false;
    saveQuestions();
    renderQuestion();
  });

  loadJson("data/vocabulary-review-queue.json").then((queue) => {
    state.vocabReviewQueue = Array.isArray(queue.items) ? queue.items : [];
    if (state.vocab) loadVocabDay(state.vocabDay);
  }).catch(() => { state.vocabReviewQueue = []; });
  loadVocabDay(1);
  loadQuestionDay(1);
})();
