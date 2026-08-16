/** Core domain types. Shared by the content bank, the adaptive engine and the UI. */

/** GCSE grades run 1 (lowest) to 9 (highest). 4 is a standard pass, 5 a strong pass. */
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Foundation papers are capped at grade 5; Higher papers run 4-9. */
export type Tier = 'foundation' | 'higher';

/** The six strands of the DfE GCSE Maths subject content. */
export type StrandId =
  | 'number'
  | 'algebra'
  | 'ratio'
  | 'geometry'
  | 'probability'
  | 'statistics';

export interface Strand {
  id: StrandId;
  title: string;
  /** Short parent-facing description of what the strand covers. */
  blurb: string;
  colour: string;
}

export interface Topic {
  id: string;
  strandId: StrandId;
  title: string;
  blurb: string;
  /** Lowest tier this topic is examined on. `higher` topics are hidden from Foundation. */
  tier: Tier;
  /** Topic ids that should be secure before this one is recommended. */
  prerequisites: string[];
  /** Grade a student is aiming to reach on this topic to count it mastered. */
  targetGrade: Grade;
}

export type QuestionKind = 'multiple-choice' | 'numeric';

interface QuestionBase {
  id: string;
  topicId: string;
  /** Difficulty, authored as a GCSE grade and mapped onto the logit scale. */
  grade: Grade;
  /** The question text shown to the student. */
  stem: string;
  /** Nudge shown on request. Using it halves the credit toward ability. */
  hint?: string;
  /** Worked solution, one step per entry, revealed after answering. */
  solution: string[];
  /** Whether a calculator would be allowed for this question in a real paper. */
  calculator: boolean;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  kind: 'multiple-choice';
  options: string[];
  answerIndex: number;
}

export interface NumericQuestion extends QuestionBase {
  kind: 'numeric';
  answer: number;
  /** Absolute tolerance for accepting an answer. Defaults to exact match. */
  tolerance?: number;
  /** Displayed after the input box, e.g. "cm²". */
  unit?: string;
}

export type Question = MultipleChoiceQuestion | NumericQuestion;

/** How well the student has taken hold of a topic. */
export type MasteryLevel = 'not-started' | 'developing' | 'secure' | 'mastered';

/** The engine's running estimate of a student's competence on one topic. */
export interface TopicAbility {
  topicId: string;
  /** Latent ability on the logit scale. 0 == grade 5. */
  theta: number;
  /** Accumulated Fisher information; drives the standard error. */
  information: number;
  attempts: number;
  correct: number;
  /** Epoch ms of the last answered question, or null if never practised. */
  lastPracticedAt: number | null;
}

/** A single answered question, kept for history and progress reporting. */
export interface Attempt {
  id?: number;
  questionId: string;
  topicId: string;
  correct: boolean;
  responseMs: number;
  usedHint: boolean;
  answeredAt: number;
  thetaBefore: number;
  thetaAfter: number;
}

/** One practice session of a fixed number of questions on a single topic. */
export interface Session {
  id?: number;
  topicId: string;
  startedAt: number;
  finishedAt: number | null;
  total: number;
  correct: number;
  xpEarned: number;
}

/** Single-learner profile. There is exactly one row of this in v1. */
export interface Learner {
  tier: Tier;
  targetGrade: Grade;
  xp: number;
  streakDays: number;
  /** ISO date (YYYY-MM-DD) of the last day a question was answered. */
  lastActiveDay: string | null;
}
