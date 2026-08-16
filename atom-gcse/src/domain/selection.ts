/**
 * Question selection.
 *
 * Learning is fastest in the "desirable difficulty" band — hard enough to demand
 * thought, easy enough to succeed most of the time. We aim each question at a 75%
 * success probability given the student's current ability.
 */

import { gradeToDifficulty, probabilityCorrect } from './ability';
import type { Question, Topic, TopicAbility } from './types';

/** Success rate we aim each question at. */
export const TARGET_SUCCESS = 0.75;

/** Questions per practice session. */
export const SESSION_LENGTH = 10;

/** How much a recently-seen question is penalised in the ranking. */
const REPEAT_PENALTY = 4;

/** Randomness in the ranking, so two sessions at the same ability differ. */
const JITTER = 0.35;

/**
 * Difficulty that gives the target success probability at this ability.
 * Inverting the Rasch model: d = θ - ln(p / (1 - p)).
 */
export function targetDifficulty(theta: number, success = TARGET_SUCCESS): number {
  return theta - Math.log(success / (1 - success));
}

export interface SelectionOptions {
  /** Question ids answered recently; deprioritised but still usable if the pool is thin. */
  recentQuestionIds?: string[];
  /** Question ids already used in the session being built; never reused. */
  excludeIds?: string[];
  /** Override the success rate, e.g. an easier opener or a harder closer. */
  success?: number;
  /** Injectable for deterministic tests. */
  random?: () => number;
}

/**
 * Pick the single best next question, or null if the pool is exhausted.
 * Ranks by distance from the target difficulty, then penalties and jitter.
 */
export function selectNextQuestion(
  pool: Question[],
  ability: TopicAbility,
  options: SelectionOptions = {},
): Question | null {
  const {
    recentQuestionIds = [],
    excludeIds = [],
    success = TARGET_SUCCESS,
    random = Math.random,
  } = options;

  const excluded = new Set(excludeIds);
  const recent = new Set(recentQuestionIds);
  const candidates = pool.filter((q) => !excluded.has(q.id));
  if (candidates.length === 0) return null;

  const target = targetDifficulty(ability.theta, success);

  let best: Question | null = null;
  let bestScore = Infinity;

  for (const question of candidates) {
    const distance = Math.abs(gradeToDifficulty(question.grade) - target);
    const penalty = recent.has(question.id) ? REPEAT_PENALTY : 0;
    const score = distance + penalty + random() * JITTER;
    if (score < bestScore) {
      bestScore = score;
      best = question;
    }
  }

  return best;
}

/**
 * Build a full session.
 *
 * The shape is deliberate: an easier opener so the student starts with a win, a steady
 * adaptive middle, and a stretch question at the end.
 */
export function buildSession(
  pool: Question[],
  ability: TopicAbility,
  options: SelectionOptions & { length?: number } = {},
): Question[] {
  const { length = SESSION_LENGTH, ...selectionOptions } = options;
  const chosen: Question[] = [];
  const used: string[] = [...(selectionOptions.excludeIds ?? [])];

  for (let i = 0; i < length; i++) {
    const success =
      i === 0 ? 0.85 : i === length - 1 ? 0.6 : (selectionOptions.success ?? TARGET_SUCCESS);

    const question = selectNextQuestion(pool, ability, {
      ...selectionOptions,
      excludeIds: used,
      success,
    });
    if (!question) break;

    chosen.push(question);
    used.push(question.id);
  }

  return chosen;
}

/**
 * The next topic the student should work on.
 *
 * Walks the curriculum in order and returns the first topic whose prerequisites are all
 * at least secure but which is not yet mastered — Atom's "learning journey" in one pass.
 */
export function recommendTopic(
  topics: Topic[],
  abilities: Map<string, TopicAbility>,
  isMastered: (topic: Topic) => boolean,
  isSecure: (topic: Topic) => boolean,
): Topic | null {
  const byId = new Map(topics.map((t) => [t.id, t]));

  const ready = (topic: Topic) =>
    topic.prerequisites.every((id) => {
      const prerequisite = byId.get(id);
      // A prerequisite outside the current tier cannot block progress.
      return !prerequisite || isSecure(prerequisite);
    });

  // Prefer an unlocked topic that is started but unfinished, so work gets completed.
  const unlocked = topics.filter((t) => ready(t) && !isMastered(t));
  const inProgress = unlocked.find((t) => (abilities.get(t.id)?.attempts ?? 0) > 0);
  return inProgress ?? unlocked[0] ?? null;
}

/** Expected success rate on a question, for showing difficulty in the UI. */
export function expectedSuccess(question: Question, ability: TopicAbility): number {
  return probabilityCorrect(ability.theta, gradeToDifficulty(question.grade));
}
