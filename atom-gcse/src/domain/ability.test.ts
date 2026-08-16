import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyAnswer,
  decayedTheta,
  gradeToDifficulty,
  initialAbility,
  learningRate,
  masteryLevel,
  predictedGrade,
  probabilityCorrect,
  standardError,
  thetaToGrade,
} from './ability';
import type { TopicAbility } from './types';

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

const evidence = (overrides: Partial<Parameters<typeof applyAnswer>[1]> = {}) => ({
  difficulty: 0,
  correct: true,
  usedHint: false,
  responseMs: 15_000,
  answeredAt: NOW,
  ...overrides,
});

describe('grade / logit mapping', () => {
  it('anchors grade 5 at zero and spans -3..+3', () => {
    assert.equal(gradeToDifficulty(5), 0);
    assert.equal(gradeToDifficulty(1), -3);
    assert.equal(gradeToDifficulty(9), 3);
  });

  it('round-trips through thetaToGrade', () => {
    for (let grade = 1; grade <= 9; grade++) {
      assert.equal(thetaToGrade(gradeToDifficulty(grade as 1)), grade);
    }
  });

  it('clamps abilities beyond the grade range', () => {
    assert.equal(thetaToGrade(-99), 1);
    assert.equal(thetaToGrade(99), 9);
  });
});

describe('probabilityCorrect', () => {
  it('is a coin flip when ability matches difficulty', () => {
    assert.equal(probabilityCorrect(0, 0), 0.5);
    assert.equal(probabilityCorrect(1.5, 1.5), 0.5);
  });

  it('rises with ability and falls with difficulty', () => {
    assert.ok(probabilityCorrect(2, 0) > 0.85);
    assert.ok(probabilityCorrect(-2, 0) < 0.15);
  });
});

describe('learningRate', () => {
  it('decays with accumulated attempts', () => {
    assert.ok(learningRate(0) > learningRate(10));
    assert.ok(learningRate(10) > learningRate(100));
  });

  it('never falls below the floor', () => {
    assert.ok(learningRate(10_000) >= 0.15);
  });
});

describe('applyAnswer', () => {
  it('raises ability on a correct answer and lowers it on a wrong one', () => {
    const start = initialAbility('t', 5);
    assert.ok(applyAnswer(start, evidence({ correct: true })).theta > start.theta);
    assert.ok(applyAnswer(start, evidence({ correct: false })).theta < start.theta);
  });

  it('moves more for a surprising result than an expected one', () => {
    const base: TopicAbility = { ...initialAbility('t', 5), theta: 2 };
    // Correct on a very hard question is surprising; on a very easy one it is not.
    const surprising = applyAnswer(base, evidence({ difficulty: 3 })).theta - base.theta;
    const expected = applyAnswer(base, evidence({ difficulty: -3 })).theta - base.theta;
    assert.ok(surprising > expected);
  });

  it('gives half credit when a hint was used', () => {
    const base = initialAbility('t', 5);
    const unaided = applyAnswer(base, evidence()).theta - base.theta;
    const hinted = applyAnswer(base, evidence({ usedHint: true })).theta - base.theta;
    assert.ok(Math.abs(hinted - unaided / 2) < 1e-9);
  });

  it('discounts an implausibly fast wrong answer as a slip', () => {
    const base = initialAbility('t', 5);
    const considered =
      base.theta - applyAnswer(base, evidence({ correct: false })).theta;
    const slip =
      base.theta -
      applyAnswer(base, evidence({ correct: false, responseMs: 400 })).theta;
    assert.ok(slip < considered);
  });

  it('accumulates counts and information', () => {
    let ability = initialAbility('t', 5);
    ability = applyAnswer(ability, evidence({ correct: true }));
    ability = applyAnswer(ability, evidence({ correct: false }));

    assert.equal(ability.attempts, 2);
    assert.equal(ability.correct, 1);
    assert.ok(ability.information > 0);
    assert.equal(ability.lastPracticedAt, NOW);
  });

  it('converges toward the ability that generated the answers', () => {
    // Simulate a student who is genuinely at grade 7 against grade-5 questions.
    let ability = initialAbility('t', 4);
    const trueTheta = gradeToDifficulty(7);
    let seed = 1;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let i = 0; i < 300; i++) {
      const difficulty = gradeToDifficulty(5);
      const correct = random() < probabilityCorrect(trueTheta, difficulty);
      ability = applyAnswer(ability, evidence({ difficulty, correct }));
    }

    assert.ok(
      Math.abs(ability.theta - trueTheta) < 1.0,
      `expected theta near ${trueTheta}, got ${ability.theta}`,
    );
  });
});

describe('standardError', () => {
  it('is infinite with no evidence and shrinks as evidence arrives', () => {
    assert.equal(standardError(0), Infinity);
    assert.ok(standardError(4) < standardError(1));
  });
});

describe('decayedTheta', () => {
  it('is unchanged for a topic never practised', () => {
    const ability = initialAbility('t', 7);
    assert.equal(decayedTheta(ability, NOW), ability.theta);
  });

  it('pulls ability back toward the prior over time', () => {
    const ability: TopicAbility = {
      ...initialAbility('t', 5),
      theta: 2,
      lastPracticedAt: NOW - 90 * DAY,
    };
    const decayed = decayedTheta(ability, NOW);
    assert.ok(decayed < 2 && decayed > 0);
  });
});

describe('masteryLevel', () => {
  it('reports not-started before any attempt', () => {
    assert.equal(masteryLevel(initialAbility('t', 5), 5, NOW), 'not-started');
  });

  it('withholds mastery while the estimate is still uncertain', () => {
    const lucky: TopicAbility = {
      ...initialAbility('t', 5),
      theta: 3,
      information: 0.4,
      attempts: 2,
      correct: 2,
      lastPracticedAt: NOW,
    };
    assert.equal(masteryLevel(lucky, 5, NOW), 'secure');
  });

  it('awards mastery once ability clears target with enough evidence', () => {
    const solid: TopicAbility = {
      ...initialAbility('t', 5),
      theta: 1.2,
      information: 12,
      attempts: 40,
      correct: 33,
      lastPracticedAt: NOW,
    };
    assert.equal(masteryLevel(solid, 5, NOW), 'mastered');
  });

  it('reports developing when well short of target', () => {
    const weak: TopicAbility = {
      ...initialAbility('t', 7),
      theta: -2,
      information: 8,
      attempts: 20,
      correct: 4,
      lastPracticedAt: NOW,
    };
    assert.equal(masteryLevel(weak, 7, NOW), 'developing');
  });
});

describe('predictedGrade', () => {
  it('falls back to the target when nothing has been practised', () => {
    assert.equal(predictedGrade([initialAbility('t', 6)], 6, NOW), 6);
  });

  it('ignores untouched topics rather than averaging them in', () => {
    const practised: TopicAbility = {
      ...initialAbility('a', 5),
      theta: gradeToDifficulty(8),
      information: 10,
      attempts: 30,
      correct: 25,
      lastPracticedAt: NOW,
    };
    assert.equal(predictedGrade([practised, initialAbility('b', 5)], 5, NOW), 8);
  });

  it('weights topics with more evidence more heavily', () => {
    const heavy: TopicAbility = {
      ...initialAbility('a', 5),
      theta: gradeToDifficulty(8),
      attempts: 40,
      information: 10,
      correct: 30,
      lastPracticedAt: NOW,
    };
    const light: TopicAbility = {
      ...initialAbility('b', 5),
      theta: gradeToDifficulty(4),
      attempts: 2,
      information: 0.5,
      correct: 0,
      lastPracticedAt: NOW,
    };
    assert.ok(predictedGrade([heavy, light], 5, NOW) >= 7);
  });
});
