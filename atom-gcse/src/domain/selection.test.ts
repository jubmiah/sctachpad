import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { gradeToDifficulty, initialAbility, probabilityCorrect } from './ability';
import {
  SESSION_LENGTH,
  buildSession,
  recommendTopic,
  selectNextQuestion,
  targetDifficulty,
} from './selection';
import type { Grade, Question, Topic, TopicAbility } from './types';

/** One question per grade, so selection has the full difficulty range to choose from. */
const pool: Question[] = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Grade[]).map((grade) => ({
  id: `q${grade}`,
  topicId: 't',
  grade,
  kind: 'multiple-choice',
  stem: `Grade ${grade} question`,
  options: ['a', 'b'],
  answerIndex: 0,
  solution: [],
  calculator: false,
}));

/** Deterministic "random" so tests do not flake on jitter. */
const noRandom = () => 0;

const abilityAt = (grade: Grade): TopicAbility => ({
  ...initialAbility('t', 5),
  theta: gradeToDifficulty(grade),
});

describe('targetDifficulty', () => {
  it('sits below ability, since we want the student succeeding most of the time', () => {
    assert.ok(targetDifficulty(0) < 0);
  });

  it('lands on the requested success probability', () => {
    const theta = 1.2;
    const difficulty = targetDifficulty(theta, 0.75);
    assert.ok(Math.abs(probabilityCorrect(theta, difficulty) - 0.75) < 1e-9);
  });
});

describe('selectNextQuestion', () => {
  it('returns null when every question is excluded', () => {
    const chosen = selectNextQuestion(pool, abilityAt(5), {
      excludeIds: pool.map((q) => q.id),
      random: noRandom,
    });
    assert.equal(chosen, null);
  });

  it('picks a question near the target difficulty, not the hardest available', () => {
    const chosen = selectNextQuestion(pool, abilityAt(5), { random: noRandom });
    assert.ok(chosen);
    // Target for a grade-5 student is ~-1.1 logits, i.e. around grade 4.
    assert.equal(chosen!.grade, 4);
  });

  it('serves harder questions to a stronger student', () => {
    const weak = selectNextQuestion(pool, abilityAt(3), { random: noRandom })!;
    const strong = selectNextQuestion(pool, abilityAt(8), { random: noRandom })!;
    assert.ok(strong.grade > weak.grade);
  });

  it('never returns an excluded question', () => {
    const chosen = selectNextQuestion(pool, abilityAt(5), {
      excludeIds: ['q4'],
      random: noRandom,
    });
    assert.notEqual(chosen!.id, 'q4');
  });

  it('avoids recently seen questions when alternatives exist', () => {
    const chosen = selectNextQuestion(pool, abilityAt(5), {
      recentQuestionIds: ['q4'],
      random: noRandom,
    });
    assert.notEqual(chosen!.id, 'q4');
  });
});

describe('buildSession', () => {
  it('produces a full session of distinct questions', () => {
    const session = buildSession(pool, abilityAt(5), { random: noRandom, length: 5 });
    assert.equal(session.length, 5);
    assert.equal(new Set(session.map((q) => q.id)).size, 5);
  });

  it('stops early rather than repeating when the pool is too small', () => {
    const session = buildSession(pool.slice(0, 3), abilityAt(5), {
      random: noRandom,
      length: SESSION_LENGTH,
    });
    assert.equal(session.length, 3);
  });

  it('opens easier than it closes', () => {
    const session = buildSession(pool, abilityAt(6), { random: noRandom, length: 5 });
    assert.ok(session[session.length - 1].grade > session[0].grade);
  });
});

describe('recommendTopic', () => {
  const topics: Topic[] = [
    {
      id: 'basics',
      strandId: 'number',
      title: 'Basics',
      blurb: '',
      tier: 'foundation',
      prerequisites: [],
      targetGrade: 4,
    },
    {
      id: 'next',
      strandId: 'number',
      title: 'Next',
      blurb: '',
      tier: 'foundation',
      prerequisites: ['basics'],
      targetGrade: 5,
    },
  ];

  it('starts at the first topic when nothing is secure', () => {
    const chosen = recommendTopic(
      topics,
      new Map(),
      () => false,
      () => false,
    );
    assert.equal(chosen?.id, 'basics');
  });

  it('will not recommend a topic whose prerequisites are unmet', () => {
    const chosen = recommendTopic(
      topics,
      new Map(),
      (t) => t.id === 'basics',
      () => false,
    );
    assert.equal(chosen, null);
  });

  it('advances once the prerequisite is secure', () => {
    const chosen = recommendTopic(
      topics,
      new Map(),
      (t) => t.id === 'basics',
      (t) => t.id === 'basics',
    );
    assert.equal(chosen?.id, 'next');
  });

  it('prefers finishing a topic already in progress', () => {
    const abilities = new Map<string, TopicAbility>([
      ['next', { ...initialAbility('next', 5), attempts: 4 }],
    ]);
    const chosen = recommendTopic(
      topics,
      abilities,
      () => false,
      () => true,
    );
    assert.equal(chosen?.id, 'next');
  });

  it('returns null when everything is mastered', () => {
    const chosen = recommendTopic(
      topics,
      new Map(),
      () => true,
      () => true,
    );
    assert.equal(chosen, null);
  });
});
