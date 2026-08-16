/**
 * Drives a single practice session: builds the question list, marks each answer, folds
 * it into the topic ability and persists everything.
 *
 * The ability is updated *during* the session, not at the end, so the questions the
 * student sees adapt as they go — that is the point of the whole exercise.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { getTopic } from '@/content/curriculum';
import { questionsForTopic } from '@/content/questions';
import * as repository from '@/data/repository';
import { applyAnswer, gradeToDifficulty, thetaToGrade } from '@/domain/ability';
import { type StudentAnswer, isCorrect, xpForAnswer } from '@/domain/marking';
import { SESSION_LENGTH, buildSession } from '@/domain/selection';
import type { Grade, Question, TopicAbility } from '@/domain/types';

export interface AnsweredQuestion {
  question: Question;
  correct: boolean;
  usedHint: boolean;
}

export interface SessionSummary {
  topicId: string;
  total: number;
  correct: number;
  xpEarned: number;
  gradeBefore: Grade;
  gradeAfter: Grade;
  thetaDelta: number;
  answered: AnsweredQuestion[];
}

export type SessionStatus = 'loading' | 'active' | 'finished' | 'empty';

export function usePracticeSession(topicId: string, targetGrade: Grade) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [ability, setAbility] = useState<TopicAbility | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const startedAt = useRef(Date.now());
  const questionShownAt = useRef(Date.now());
  const openingAbility = useRef<TopicAbility | null>(null);
  const xpEarned = useRef(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const pool = questionsForTopic(topicId);
      const stored = await repository.getAbility(topicId, targetGrade);
      const recentQuestionIds = await repository.getRecentQuestionIds(topicId);

      if (cancelled) return;

      if (pool.length === 0) {
        setStatus('empty');
        return;
      }

      const built = buildSession(pool, stored, {
        recentQuestionIds,
        length: Math.min(SESSION_LENGTH, pool.length),
      });

      openingAbility.current = stored;
      startedAt.current = Date.now();
      questionShownAt.current = Date.now();

      setAbility(stored);
      setQuestions(built);
      setStatus('active');
    })().catch((error) => {
      console.error('Failed to start session', error);
      if (!cancelled) setStatus('empty');
    });

    return () => {
      cancelled = true;
    };
  }, [topicId, targetGrade]);

  const question: Question | null = questions[index] ?? null;

  const revealHint = useCallback(() => setUsedHint(true), []);

  /** Mark the current answer, update ability and persist. Returns whether it was right. */
  const submit = useCallback(
    async (answer: StudentAnswer): Promise<boolean> => {
      if (!question || !ability) return false;

      const correct = isCorrect(question, answer);
      const responseMs = Date.now() - questionShownAt.current;
      const answeredAt = Date.now();

      const updated = applyAnswer(ability, {
        difficulty: gradeToDifficulty(question.grade),
        correct,
        usedHint,
        responseMs,
        answeredAt,
      });

      xpEarned.current += xpForAnswer(question, correct, usedHint);
      setAbility(updated);
      setLastCorrect(correct);
      setAnswered((previous) => [...previous, { question, correct, usedHint }]);

      await repository.saveAbility(updated);
      await repository.saveAttempt({
        questionId: question.id,
        topicId,
        correct,
        responseMs,
        usedHint,
        answeredAt,
        thetaBefore: ability.theta,
        thetaAfter: updated.theta,
      });

      return correct;
    },
    [question, ability, usedHint, topicId],
  );

  /** Move to the next question, or finish the session if this was the last one. */
  const advance = useCallback(async () => {
    const isLast = index >= questions.length - 1;

    if (!isLast) {
      setIndex((previous) => previous + 1);
      setUsedHint(false);
      setLastCorrect(null);
      questionShownAt.current = Date.now();
      return;
    }

    const opening = openingAbility.current;
    const finishedAt = Date.now();
    const correct = answered.filter((entry) => entry.correct).length;

    await repository.saveSession({
      topicId,
      startedAt: startedAt.current,
      finishedAt,
      total: answered.length,
      correct,
      xpEarned: xpEarned.current,
    });
    await repository.recordActivity(xpEarned.current);

    setSummary({
      topicId,
      total: answered.length,
      correct,
      xpEarned: xpEarned.current,
      gradeBefore: thetaToGrade(opening?.theta ?? 0),
      gradeAfter: thetaToGrade(ability?.theta ?? 0),
      thetaDelta: (ability?.theta ?? 0) - (opening?.theta ?? 0),
      answered,
    });
    setStatus('finished');
  }, [index, questions.length, answered, ability, topicId]);

  return {
    status,
    topic: getTopic(topicId),
    question,
    questionNumber: index + 1,
    totalQuestions: questions.length,
    ability,
    usedHint,
    lastCorrect,
    summary,
    revealHint,
    submit,
    advance,
  };
}
