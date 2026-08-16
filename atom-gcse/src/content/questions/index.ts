/**
 * The bundled question bank.
 *
 * Content ships inside the app as TypeScript so it is type-checked at build time and
 * reviewable in git. Nothing here is fetched at runtime.
 */

import type { Question } from '@/domain/types';

import { ALGEBRA_QUESTIONS } from './algebra';
import { DATA_QUESTIONS } from './data';
import { GEOMETRY_QUESTIONS } from './geometry';
import { NUMBER_QUESTIONS } from './number';

export const QUESTIONS: Question[] = [
  ...NUMBER_QUESTIONS,
  ...ALGEBRA_QUESTIONS,
  ...GEOMETRY_QUESTIONS,
  ...DATA_QUESTIONS,
];

const BY_TOPIC = QUESTIONS.reduce<Map<string, Question[]>>((map, question) => {
  const existing = map.get(question.topicId);
  if (existing) existing.push(question);
  else map.set(question.topicId, [question]);
  return map;
}, new Map());

/** Every question for a topic, or an empty array if the topic has no content yet. */
export function questionsForTopic(topicId: string): Question[] {
  return BY_TOPIC.get(topicId) ?? [];
}

/** Whether a topic has enough questions to run a session. */
export function hasContent(topicId: string): boolean {
  return questionsForTopic(topicId).length > 0;
}

export function getQuestion(id: string): Question | undefined {
  return QUESTIONS.find((question) => question.id === id);
}
