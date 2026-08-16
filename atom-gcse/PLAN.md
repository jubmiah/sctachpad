# Atom GCSE Maths — Product & Technical Plan

A local-first, adaptive GCSE Maths practice app for iPhone, modelled on
[Atom Learning](https://atomlearning.com)'s adaptive engine but retargeted from
KS2/11+ to GCSE (Years 10–11, ages 14–16).

---

## 1. What we are copying from Atom Learning

Atom is an *adaptive* learning platform: rather than serving a fixed worksheet, it
continuously estimates what a student can do and picks the next question to sit just
beyond their current ability. The features that matter, and how each maps to this app:

| Atom feature | What it does | Our v1 equivalent |
|---|---|---|
| **Ability score** per subject/topic | A single number tracking competence, updated after every question | Per-topic latent ability `θ`, surfaced as a **predicted GCSE grade (1–9)** |
| **Adaptive question selection** | Serves questions at ~70–80% success rate | Rasch-model selection targeting a **75% success probability** |
| **Learning journey** | Guided sequence through the curriculum | Topic graph with **prerequisites**; next-topic recommender |
| **Practice mode** | Free topic practice | Practice sessions of 10 questions per topic |
| **Mock tests** | Timed, non-adaptive assessments | Phase 2: timed Paper 1/2/3 mocks (calc & non-calc) |
| **Video lessons / help** | Teaching content when stuck | Hints + step-by-step worked solutions per question |
| **Gamification** | Points, badges, leaderboards | XP, daily streak, topic mastery badges (no leaderboard — single user) |
| **Parent/teacher dashboard** | Weekly reports, weak-area flags | Deferred to Phase 3 (student-only v1) |

**Deliberately not copied:** leaderboards and inter-student comparison (single-learner
app), and Atom's proprietary content. All questions here are original, written against
the published GCSE subject content.

---

## 2. Scope

**v1 (this plan):** one student, no login, no server, GCSE Maths only, Foundation +
Higher tiers, offline-first.

**Non-goals for v1:** other subjects, accounts/sync, parent dashboard, timed mocks,
handwriting or equation-editor input, past-paper import.

---

## 3. Stack

| Concern | Choice | Why |
|---|---|---|
| App | **React Native + Expo (SDK 57), TypeScript** | Runs on a real iPhone via Expo Go with no Mac/Xcode; ejects to a native build later |
| Navigation | **expo-router** | File-based routes, typed, tabs out of the box |
| Storage | **expo-sqlite** | Relational progress data, on-device, offline, fast |
| Content | **TypeScript modules bundled in the app** | Question bank ships with the binary; no network needed |
| State | React Context + hooks | The dataset is small; Redux would be overhead |
| Tests | `node --test` + `tsx` | The adaptive engine is pure TypeScript and must be unit-tested |

Everything runs on-device. No backend, no accounts, no telemetry.

---

## 4. The adaptive engine

This is the heart of the app, and the part worth getting right.

### 4.1 Model

We use a **one-parameter logistic (Rasch) model**. Each question has a difficulty `d`
and each student a per-topic ability `θ`, both on the same logit scale. The probability
the student answers correctly is:

```
P(correct) = 1 / (1 + e^-(θ - d))
```

When `θ = d`, the student has a 50% chance. Ability and difficulty being on one scale is
what makes selection and grade prediction fall out cleanly.

### 4.2 Grade ↔ logit mapping

Questions are authored with a **GCSE grade (1–9)**, which is how maths teachers actually
think about difficulty. We map linearly onto the logit scale, anchored so that grade 5
(a "strong pass") sits at `θ = 0`:

```
d = (grade - 5) × 0.75      →  grade 1 = -3.0,  grade 9 = +3.0
grade = round(5 + θ / 0.75)
```

### 4.3 Updating ability

After each answer we nudge `θ` toward the evidence, by the size of the surprise:

```
θ' = θ + K(n) × (outcome - P(correct))
```

`outcome` is 1 or 0. A correct answer on an easy question barely moves `θ` (it was
expected); a correct answer on a hard one moves it a lot.

`K(n)` is the learning rate, decaying as evidence accumulates so early answers move the
estimate fast and later ones refine it:

```
K(n) = K_MIN + (K_MAX - K_MIN) × e^(-n / TAU)      K_MAX = 0.8, K_MIN = 0.15, TAU = 10
```

Two adjustments on top:
- **Hint used** → a correct answer counts as partial evidence (half weight); it should not
  earn full credit toward mastery.
- **Implausibly fast wrong answers** (< 2s) are treated as slips and down-weighted, so a
  misclick doesn't tank a topic score.

### 4.4 Confidence

We accumulate Fisher information `I = Σ p(1-p)` and report a standard error
`SE = 1/√I`. This drives two things: mastery cannot be claimed while `SE` is high, and
the UI can show "still working this out" versus a confident predicted grade.

### 4.5 Question selection

Learning is fastest in the "desirable difficulty" band — hard enough to require thought,
easy enough to succeed most of the time. Targeting a 75% success rate:

```
d_target = θ - ln(0.75 / 0.25) = θ - 1.10
```

The selector scores every unseen question in the topic by closeness to `d_target`,
penalises recently-seen items, and adds slight jitter so sessions aren't identical. A
session is 10 questions with a deliberate easy opener (confidence) and a stretch item at
the end.

### 4.6 Mastery and the learning journey

Each topic resolves to one of: `not-started` → `developing` → `secure` → `mastered`.
A topic is **mastered** when `θ` clears the topic's target grade *and* `SE` is low enough
to trust it. Topics declare **prerequisites**, so the recommender walks the graph and
suggests the first topic whose prerequisites are secure but which is not yet mastered —
this is the "learning journey".

### 4.7 Forgetting

Ability decays gently toward the prior with time since last practice, which pushes stale
topics back up the review queue rather than letting a topic passed once stay green
forever.

---

## 5. Data model

```
topics            static  id, strand, title, tier, targetGrade, prerequisites[]
questions         static  id, topicId, grade, kind, stem, answer, hint, solution[]
topic_ability     sqlite  topicId, theta, information, attempts, correct, lastPracticedAt
attempts          sqlite  questionId, topicId, correct, responseMs, usedHint, answeredAt, thetaBefore/After
sessions          sqlite  id, topicId, startedAt, finishedAt, total, correct, xpEarned
learner           sqlite  singleton: tier, targetGrade, xp, streakDays, lastActiveDay
```

Static content is bundled TypeScript (type-checked, diffable in git). Only learner
progress lives in SQLite.

---

## 6. Screens

| Route | Purpose |
|---|---|
| `(tabs)/index` | **Today** — streak, XP, predicted grade, recommended next session |
| `(tabs)/learn` | **Learn** — curriculum by strand, mastery state per topic |
| `(tabs)/progress` | **Progress** — predicted grade, per-strand breakdown, weak areas |
| `practice/[topicId]` | **Session runner** — question, answer, instant feedback, worked solution |
| `practice/results` | **Results** — score, ability movement, what to do next |

---

## 7. Curriculum coverage

Six strands, following the DfE GCSE Maths subject content (shared across AQA/Edexcel/OCR):

1. **Number** — integers, fractions, decimals, percentages, indices, surds, standard form
2. **Algebra** — notation, expanding/factorising, equations, sequences, graphs, inequalities
3. **Ratio, proportion & rates of change** — ratio, scale, compound measures, growth/decay
4. **Geometry & measures** — angles, Pythagoras, trigonometry, circles, area/volume, vectors
5. **Probability** — single/combined events, trees, Venn diagrams
6. **Statistics** — averages, charts, scatter graphs, cumulative frequency

Topics are tagged `foundation` or `higher` so the app only serves what the student's tier
requires.

---

## 8. Roadmap

**Phase 1 — Foundations (this commit)**
Project scaffold, adaptive engine + tests, curriculum graph, seed question bank, SQLite
persistence, all five screens working end to end.

**Phase 2 — Content & depth**
Grow the bank to ~40 questions per topic (the engine needs range to select across),
worked-solution rendering with proper maths notation, timed mock papers, calculator/
non-calculator split.

**Phase 3 — Retention & reporting**
Spaced-repetition review queue, weekly progress summary, parent view, export.

**Phase 4 — Polish & ship**
Icon and splash, accessibility pass, EAS build, TestFlight.

---

## 9. Known risks

- **Content volume is the real cost.** The engine is a weekend; a credible question bank
  is the actual project. Authoring needs to be batched by topic and grade band.
- **Maths notation.** Fractions, surds and indices in plain strings will hit a ceiling
  fast; Phase 2 needs KaTeX-style rendering.
- **Answer entry.** Numeric + multiple choice covers a lot but not "show your working"
  questions, which are a large share of real GCSE marks.
- **Cold-start.** A new student has no data; v1 seeds `θ` from a self-declared target
  grade and lets the first session correct it quickly via the high early `K`.
