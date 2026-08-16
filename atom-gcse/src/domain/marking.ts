/** Answer checking and session scoring. */

import type { Question } from './types';

/** Default absolute tolerance for numeric answers, to forgive rounding. */
const DEFAULT_TOLERANCE = 1e-9;

export type StudentAnswer =
  | { kind: 'multiple-choice'; optionIndex: number }
  | { kind: 'numeric'; value: number };

/** Parse free-text numeric input. Accepts "3/4", "1,200" and "12.5". */
export function parseNumericInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '').replace(/\s+/g, '');
  if (cleaned === '') return null;

  const fraction = cleaned.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function isCorrect(question: Question, answer: StudentAnswer): boolean {
  if (question.kind === 'multiple-choice') {
    return (
      answer.kind === 'multiple-choice' && answer.optionIndex === question.answerIndex
    );
  }

  if (answer.kind !== 'numeric') return false;
  const tolerance = question.tolerance ?? DEFAULT_TOLERANCE;
  return Math.abs(answer.value - question.answer) <= tolerance;
}

/** The correct answer as displayable text, for the solution panel. */
export function correctAnswerText(question: Question): string {
  if (question.kind === 'multiple-choice') return question.options[question.answerIndex];
  return question.unit ? `${question.answer} ${question.unit}` : String(question.answer);
}

/**
 * XP for one answered question.
 *
 * Harder questions are worth more, hints cost half, and a wrong answer still earns a
 * little — the point is to keep the student practising, not to punish them.
 */
export function xpForAnswer(
  question: Question,
  correct: boolean,
  usedHint: boolean,
): number {
  if (!correct) return 2;
  const base = 6 + question.grade * 2;
  return Math.round(usedHint ? base / 2 : base);
}
