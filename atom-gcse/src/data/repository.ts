/**
 * Data access. Everything the UI needs from storage goes through here, so screens never
 * touch SQL and the domain layer stays pure.
 */

import { initialAbility } from '@/domain/ability';
import type { Attempt, Grade, Learner, Tier, TopicAbility } from '@/domain/types';

import { getDatabase } from './db';

interface LearnerRow {
  tier: string;
  target_grade: number;
  xp: number;
  streak_days: number;
  last_active_day: string | null;
}

interface AbilityRow {
  topic_id: string;
  theta: number;
  information: number;
  attempts: number;
  correct: number;
  last_practiced_at: number | null;
}

const toAbility = (row: AbilityRow): TopicAbility => ({
  topicId: row.topic_id,
  theta: row.theta,
  information: row.information,
  attempts: row.attempts,
  correct: row.correct,
  lastPracticedAt: row.last_practiced_at,
});

/** Local calendar day as YYYY-MM-DD, used for streak bookkeeping. */
export function localDay(date: Date = new Date()): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  return Math.round((end - start) / 86_400_000);
}

export async function getLearner(): Promise<Learner> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<LearnerRow>('SELECT * FROM learner WHERE id = 1');

  return {
    tier: (row?.tier as Tier) ?? 'foundation',
    targetGrade: (row?.target_grade as Grade) ?? 5,
    xp: row?.xp ?? 0,
    streakDays: row?.streak_days ?? 0,
    lastActiveDay: row?.last_active_day ?? null,
  };
}

export async function updateLearnerSettings(
  tier: Tier,
  targetGrade: Grade,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE learner SET tier = ?, target_grade = ? WHERE id = 1',
    tier,
    targetGrade,
  );
}

/**
 * Award XP and roll the daily streak forward.
 *
 * Practising twice in one day does not double the streak; missing a day resets it to 1
 * on the next session rather than to 0, since the student is active again.
 */
export async function recordActivity(xpEarned: number): Promise<Learner> {
  const db = await getDatabase();
  const learner = await getLearner();
  const today = localDay();

  let streak = learner.streakDays;
  if (learner.lastActiveDay === null) {
    streak = 1;
  } else if (learner.lastActiveDay !== today) {
    streak = daysBetween(learner.lastActiveDay, today) === 1 ? streak + 1 : 1;
  }

  await db.runAsync(
    'UPDATE learner SET xp = xp + ?, streak_days = ?, last_active_day = ? WHERE id = 1',
    xpEarned,
    streak,
    today,
  );

  return getLearner();
}

export async function getAllAbilities(): Promise<TopicAbility[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AbilityRow>('SELECT * FROM topic_ability');
  return rows.map(toAbility);
}

/** The stored ability for a topic, or a fresh one seeded from the learner's target. */
export async function getAbility(
  topicId: string,
  targetGrade: Grade,
): Promise<TopicAbility> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AbilityRow>(
    'SELECT * FROM topic_ability WHERE topic_id = ?',
    topicId,
  );
  return row ? toAbility(row) : initialAbility(topicId, targetGrade);
}

export async function saveAbility(ability: TopicAbility): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO topic_ability
       (topic_id, theta, information, attempts, correct, last_practiced_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (topic_id) DO UPDATE SET
       theta = excluded.theta,
       information = excluded.information,
       attempts = excluded.attempts,
       correct = excluded.correct,
       last_practiced_at = excluded.last_practiced_at`,
    ability.topicId,
    ability.theta,
    ability.information,
    ability.attempts,
    ability.correct,
    ability.lastPracticedAt,
  );
}

export async function saveAttempt(attempt: Attempt): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO attempts
       (question_id, topic_id, correct, response_ms, used_hint, answered_at,
        theta_before, theta_after)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    attempt.questionId,
    attempt.topicId,
    attempt.correct ? 1 : 0,
    attempt.responseMs,
    attempt.usedHint ? 1 : 0,
    attempt.answeredAt,
    attempt.thetaBefore,
    attempt.thetaAfter,
  );
}

/**
 * Question ids answered recently on a topic, so the selector can avoid repeats.
 */
export async function getRecentQuestionIds(
  topicId: string,
  limit = 20,
): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ question_id: string }>(
    'SELECT question_id FROM attempts WHERE topic_id = ? ORDER BY answered_at DESC LIMIT ?',
    topicId,
    limit,
  );
  return rows.map((row) => row.question_id);
}

export async function saveSession(session: {
  topicId: string;
  startedAt: number;
  finishedAt: number;
  total: number;
  correct: number;
  xpEarned: number;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sessions
       (topic_id, started_at, finished_at, total, correct, xp_earned)
     VALUES (?, ?, ?, ?, ?, ?)`,
    session.topicId,
    session.startedAt,
    session.finishedAt,
    session.total,
    session.correct,
    session.xpEarned,
  );
}

export async function getSessionCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM sessions',
  );
  return row?.count ?? 0;
}

export async function getTotalAttempts(): Promise<{ total: number; correct: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number; correct: number }>(
    'SELECT COUNT(*) AS total, COALESCE(SUM(correct), 0) AS correct FROM attempts',
  );
  return { total: row?.total ?? 0, correct: row?.correct ?? 0 };
}
