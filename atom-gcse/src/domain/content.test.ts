/**
 * Content integrity checks.
 *
 * The question bank is hand-authored, so these guard the mistakes that are easy to make
 * and hard to spot: duplicate ids, a topic id typo, an answerIndex off the end of the
 * options, a prerequisite pointing at nothing.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { STRANDS, TOPICS, topicsForTier } from '../content/curriculum';
import { QUESTIONS, questionsForTopic } from '../content/questions';

const topicIds = new Set(TOPICS.map((t) => t.id));
const strandIds = new Set(STRANDS.map((s) => s.id));

describe('curriculum', () => {
  it('has unique topic ids', () => {
    assert.equal(topicIds.size, TOPICS.length);
  });

  it('assigns every topic to a real strand', () => {
    for (const topic of TOPICS) {
      assert.ok(strandIds.has(topic.strandId), `${topic.id} -> ${topic.strandId}`);
    }
  });

  it('only references prerequisites that exist', () => {
    for (const topic of TOPICS) {
      for (const prerequisite of topic.prerequisites) {
        assert.ok(topicIds.has(prerequisite), `${topic.id} needs missing ${prerequisite}`);
      }
    }
  });

  it('has no topic depending on itself', () => {
    for (const topic of TOPICS) {
      assert.ok(!topic.prerequisites.includes(topic.id), `${topic.id} depends on itself`);
    }
  });

  it('has no cycles in the prerequisite graph', () => {
    const byId = new Map(TOPICS.map((t) => [t.id, t]));
    const state = new Map<string, 'visiting' | 'done'>();

    const visit = (id: string, trail: string[]) => {
      if (state.get(id) === 'done') return;
      assert.notEqual(state.get(id), 'visiting', `cycle: ${[...trail, id].join(' -> ')}`);
      state.set(id, 'visiting');
      for (const next of byId.get(id)?.prerequisites ?? []) {
        visit(next, [...trail, id]);
      }
      state.set(id, 'done');
    };

    for (const topic of TOPICS) visit(topic.id, []);
  });

  it('never lets a foundation topic depend on a higher-tier one', () => {
    const byId = new Map(TOPICS.map((t) => [t.id, t]));
    for (const topic of TOPICS) {
      if (topic.tier !== 'foundation') continue;
      for (const prerequisite of topic.prerequisites) {
        assert.notEqual(
          byId.get(prerequisite)?.tier,
          'higher',
          `foundation topic ${topic.id} requires higher topic ${prerequisite}`,
        );
      }
    }
  });

  it('gives a foundation student a smaller curriculum than a higher one', () => {
    assert.ok(topicsForTier('foundation').length < topicsForTier('higher').length);
  });

  it('keeps target grades inside the GCSE range', () => {
    for (const topic of TOPICS) {
      assert.ok(topic.targetGrade >= 1 && topic.targetGrade <= 9, topic.id);
    }
  });
});

describe('question bank', () => {
  it('has unique question ids', () => {
    assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  });

  it('attaches every question to a real topic', () => {
    for (const question of QUESTIONS) {
      assert.ok(topicIds.has(question.topicId), `${question.id} -> ${question.topicId}`);
    }
  });

  it('grades every question inside the GCSE range', () => {
    for (const question of QUESTIONS) {
      assert.ok(question.grade >= 1 && question.grade <= 9, question.id);
    }
  });

  it('gives every question a stem and a worked solution', () => {
    for (const question of QUESTIONS) {
      assert.ok(question.stem.trim().length > 0, `${question.id} has an empty stem`);
      assert.ok(question.solution.length > 0, `${question.id} has no solution steps`);
    }
  });

  it('points every multiple-choice answer at a real option', () => {
    for (const question of QUESTIONS) {
      if (question.kind !== 'multiple-choice') continue;
      assert.ok(question.options.length >= 2, `${question.id} needs more options`);
      assert.ok(
        question.answerIndex >= 0 && question.answerIndex < question.options.length,
        `${question.id} answerIndex out of range`,
      );
      assert.equal(
        new Set(question.options).size,
        question.options.length,
        `${question.id} has duplicate options`,
      );
    }
  });

  it('gives every numeric question a finite answer', () => {
    for (const question of QUESTIONS) {
      if (question.kind !== 'numeric') continue;
      assert.ok(Number.isFinite(question.answer), `${question.id} answer is not finite`);
      if (question.tolerance !== undefined) {
        assert.ok(question.tolerance >= 0, `${question.id} has negative tolerance`);
      }
    }
  });

  it('gives every seeded topic a usable spread of difficulty', () => {
    const seeded = [...new Set(QUESTIONS.map((q) => q.topicId))];
    for (const topicId of seeded) {
      const questions = questionsForTopic(topicId);
      assert.ok(questions.length >= 5, `${topicId} has only ${questions.length} questions`);
      const grades = questions.map((q) => q.grade);
      assert.ok(
        Math.max(...grades) - Math.min(...grades) >= 2,
        `${topicId} questions are all the same difficulty`,
      );
    }
  });

  it('covers at least one topic in every strand', () => {
    const seeded = new Set(
      QUESTIONS.map((q) => TOPICS.find((t) => t.id === q.topicId)?.strandId),
    );
    for (const strand of STRANDS) {
      assert.ok(seeded.has(strand.id), `no questions for strand ${strand.id}`);
    }
  });
});
