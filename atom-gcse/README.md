# Atom GCSE Maths

A local-first, adaptive GCSE Maths practice app for iPhone — the Atom Learning model
(adaptive ability scores, a guided learning journey, mastery tracking) retargeted from
KS2/11+ to GCSE.

Everything runs on the device. No accounts, no server, no network.

See [PLAN.md](./PLAN.md) for the product and technical plan, including how the adaptive
engine works and what is planned beyond this phase.

## Running it on an iPhone

```bash
npm install
npm start
```

Scan the QR code with the Camera app on an iPhone that has
[Expo Go](https://expo.dev/go) installed. No Mac or Xcode required for development.

## Commands

| Command | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run ios` | Open in an iOS simulator (needs a Mac) |
| `npm test` | Run the adaptive-engine and content tests |
| `npm run typecheck` | Type-check the whole project |

## Layout

```
app/                        expo-router screens
  (tabs)/index.tsx          Today — streak, predicted grade, recommended session
  (tabs)/learn.tsx          Curriculum by strand, with mastery per topic
  (tabs)/progress.tsx       Predicted grade, weak areas, tier & target settings
  practice/[topicId].tsx    Session runner — question, marking, worked solution
  practice/results.tsx      Session summary and where the ability moved

src/
  domain/                   Pure logic, fully unit-tested
    ability.ts              Rasch model: ability updates, mastery, grade prediction
    selection.ts            Question selection and the learning-journey recommender
    marking.ts              Answer checking, numeric parsing, XP
    types.ts                Shared domain types
  content/
    curriculum.ts           Topic graph: 6 strands, 42 topics, prerequisites
    questions/              The bundled question bank
  data/
    db.ts                   SQLite schema and migrations
    repository.ts           All data access
  state/                    React context and the practice-session hook
  ui/                       Theme tokens and shared components
```

The domain layer has no React and no storage imports, which is what makes the engine
directly testable — `npm test` runs it in plain Node.

## Current state

Working end to end: adaptive selection, ability tracking, mastery, streaks, XP,
predicted grades, tier switching and progress reset.

Content is a seed bank of 86 questions across 14 of the 42 topics (grades 2–7). The
remaining 28 appear in the curriculum marked "questions coming soon" — the engine needs roughly
40 questions per topic, spread across grades, to select well.

Known gaps: no timed mock papers yet, maths notation is plain text rather than typeset,
and `npx expo export --platform web` fails because expo-sqlite's web build needs extra
wasm configuration in Metro. iOS bundling is unaffected.
