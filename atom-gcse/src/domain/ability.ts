/**
 * The adaptive engine.
 *
 * A one-parameter logistic (Rasch) model: every question has a difficulty and every
 * student a per-topic ability, both on the same logit scale, so the two can be compared
 * directly. See PLAN.md section 4 for the reasoning behind the constants.
 *
 * Everything here is pure — no storage, no React — so it can be unit-tested directly.
 */

import type { Grade, MasteryLevel, TopicAbility } from './types';

/** Logits per grade. Grade 5 sits at 0, so grades 1..9 span -3..+3. */
export const LOGITS_PER_GRADE = 0.75;

/** Learning rate bounds and decay. Early answers move the estimate fast. */
const K_MAX = 0.8;
const K_MIN = 0.15;
const K_TAU = 10;

/** Credit multiplier for a correct answer that needed a hint. */
const HINT_WEIGHT = 0.5;

/** Wrong answers faster than this are treated as slips, not evidence of inability. */
const SLIP_THRESHOLD_MS = 2000;
const SLIP_WEIGHT = 0.25;

/** Ability decays toward the prior at this rate per day away from a topic. */
const DECAY_PER_DAY = 0.004;
const MS_PER_DAY = 86_400_000;

/** Below this standard error we trust the estimate enough to call a topic mastered. */
const CONFIDENT_SE = 0.55;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Difficulty, in logits, of a question authored at the given GCSE grade. */
export function gradeToDifficulty(grade: Grade): number {
  return (grade - 5) * LOGITS_PER_GRADE;
}

/** The GCSE grade a given ability corresponds to. */
export function thetaToGrade(theta: number): Grade {
  const raw = Math.round(5 + theta / LOGITS_PER_GRADE);
  return clamp(raw, 1, 9) as Grade;
}

/** Ability a student targeting a given grade should be seeded with. */
export function gradeToTheta(grade: Grade): number {
  return (grade - 5) * LOGITS_PER_GRADE;
}

/** Probability of a correct answer under the Rasch model. */
export function probabilityCorrect(theta: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-(theta - difficulty)));
}

/** Learning rate after `attempts` answers. Decays from K_MAX toward K_MIN. */
export function learningRate(attempts: number): number {
  return K_MIN + (K_MAX - K_MIN) * Math.exp(-attempts / K_TAU);
}

/** Standard error of the ability estimate. Falls as evidence accumulates. */
export function standardError(information: number): number {
  if (information <= 0) return Infinity;
  return 1 / Math.sqrt(information);
}

/** A fresh, unpractised topic seeded from the student's overall target. */
export function initialAbility(topicId: string, targetGrade: Grade): TopicAbility {
  return {
    topicId,
    // Start a little below target: the first session should feel achievable.
    theta: gradeToTheta(targetGrade) - LOGITS_PER_GRADE,
    information: 0,
    attempts: 0,
    correct: 0,
    lastPracticedAt: null,
  };
}

export interface AnswerEvidence {
  difficulty: number;
  correct: boolean;
  usedHint: boolean;
  responseMs: number;
  answeredAt: number;
}

/**
 * Fold one answered question into a topic ability.
 *
 * The update is proportional to the surprise: an expected correct answer barely moves
 * the estimate, an unexpected one moves it a lot.
 */
export function applyAnswer(
  ability: TopicAbility,
  evidence: AnswerEvidence,
): TopicAbility {
  const { difficulty, correct, usedHint, responseMs, answeredAt } = evidence;

  const expected = probabilityCorrect(ability.theta, difficulty);
  const outcome = correct ? 1 : 0;

  let weight = 1;
  if (correct && usedHint) weight *= HINT_WEIGHT;
  if (!correct && responseMs < SLIP_THRESHOLD_MS) weight *= SLIP_WEIGHT;

  const k = learningRate(ability.attempts);
  const theta = ability.theta + k * weight * (outcome - expected);

  return {
    ...ability,
    theta,
    // Fisher information for the Rasch model, discounted by the same weight.
    information: ability.information + expected * (1 - expected) * weight,
    attempts: ability.attempts + 1,
    correct: ability.correct + (correct ? 1 : 0),
    lastPracticedAt: answeredAt,
  };
}

/**
 * Ability adjusted for time away from the topic.
 *
 * Knowledge fades, so a topic passed once months ago should not stay green. The estimate
 * decays toward the prior (0 == grade 5) rather than toward zero competence.
 */
export function decayedTheta(ability: TopicAbility, now: number): number {
  if (ability.lastPracticedAt === null) return ability.theta;
  const days = Math.max(0, (now - ability.lastPracticedAt) / MS_PER_DAY);
  const retention = Math.exp(-DECAY_PER_DAY * days);
  return ability.theta * retention;
}

/**
 * Where the student stands on a topic.
 *
 * Mastery requires both clearing the target grade and enough evidence to trust the
 * estimate — a lucky run of three answers is not mastery.
 */
export function masteryLevel(
  ability: TopicAbility,
  targetGrade: Grade,
  now: number = Date.now(),
): MasteryLevel {
  if (ability.attempts === 0) return 'not-started';

  const theta = decayedTheta(ability, now);
  const target = gradeToTheta(targetGrade);
  const se = standardError(ability.information);

  if (theta >= target && se <= CONFIDENT_SE) return 'mastered';
  // Within one grade of target, or at target but not yet confident.
  if (theta >= target - LOGITS_PER_GRADE) return 'secure';
  return 'developing';
}

/** 0..1 progress toward mastering a topic, for progress bars. */
export function masteryProgress(
  ability: TopicAbility,
  targetGrade: Grade,
  now: number = Date.now(),
): number {
  if (ability.attempts === 0) return 0;

  const theta = decayedTheta(ability, now);
  const target = gradeToTheta(targetGrade);
  // Measure from two grades below target up to target.
  const floor = target - 2 * LOGITS_PER_GRADE;
  const reach = clamp((theta - floor) / (target - floor), 0, 1);

  // Hold progress back until the estimate is trustworthy.
  const confidence = clamp(1 / (1 + standardError(ability.information)), 0, 1);
  return clamp(reach * (0.5 + 0.5 * confidence), 0, 1);
}

/**
 * How badly a topic needs revisiting, for ordering the review queue.
 * Higher is more urgent. Combines distance from target with time since practice.
 */
export function reviewPriority(
  ability: TopicAbility,
  targetGrade: Grade,
  now: number = Date.now(),
): number {
  if (ability.attempts === 0) return 0.5;
  const gap = Math.max(0, gradeToTheta(targetGrade) - decayedTheta(ability, now));
  const daysSince =
    ability.lastPracticedAt === null
      ? 0
      : (now - ability.lastPracticedAt) / MS_PER_DAY;
  return gap + Math.min(daysSince / 30, 1);
}

/**
 * Overall predicted grade across topics, weighted by how much evidence each carries.
 * Untouched topics contribute nothing rather than dragging the average down.
 */
export function predictedGrade(
  abilities: TopicAbility[],
  fallback: Grade,
  now: number = Date.now(),
): Grade {
  const practised = abilities.filter((a) => a.attempts > 0);
  if (practised.length === 0) return fallback;

  let weightSum = 0;
  let thetaSum = 0;
  for (const ability of practised) {
    const weight = Math.min(ability.attempts, 20);
    weightSum += weight;
    thetaSum += decayedTheta(ability, now) * weight;
  }
  return thetaToGrade(thetaSum / weightSum);
}
