import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  correctAnswerText,
  isCorrect,
  parseNumericInput,
  xpForAnswer,
} from './marking';
import type { MultipleChoiceQuestion, NumericQuestion } from './types';

const mcq: MultipleChoiceQuestion = {
  id: 'm1',
  topicId: 't',
  grade: 4,
  kind: 'multiple-choice',
  stem: 'Pick one',
  options: ['wrong', 'right'],
  answerIndex: 1,
  solution: [],
  calculator: false,
};

const numeric: NumericQuestion = {
  id: 'n1',
  topicId: 't',
  grade: 5,
  kind: 'numeric',
  stem: 'Work it out',
  answer: 12.5,
  tolerance: 0.05,
  unit: 'cm',
  solution: [],
  calculator: true,
};

describe('parseNumericInput', () => {
  it('reads plain and decimal numbers', () => {
    assert.equal(parseNumericInput('42'), 42);
    assert.equal(parseNumericInput(' 12.5 '), 12.5);
    assert.equal(parseNumericInput('-7'), -7);
  });

  it('reads fractions and thousands separators', () => {
    assert.equal(parseNumericInput('3/4'), 0.75);
    assert.equal(parseNumericInput('-1/2'), -0.5);
    assert.equal(parseNumericInput('1,200'), 1200);
  });

  it('rejects empty, non-numeric and divide-by-zero input', () => {
    assert.equal(parseNumericInput(''), null);
    assert.equal(parseNumericInput('   '), null);
    assert.equal(parseNumericInput('abc'), null);
    assert.equal(parseNumericInput('1/0'), null);
  });
});

describe('isCorrect', () => {
  it('matches the right multiple-choice option', () => {
    assert.equal(isCorrect(mcq, { kind: 'multiple-choice', optionIndex: 1 }), true);
    assert.equal(isCorrect(mcq, { kind: 'multiple-choice', optionIndex: 0 }), false);
  });

  it('accepts numeric answers inside tolerance and rejects outside', () => {
    assert.equal(isCorrect(numeric, { kind: 'numeric', value: 12.52 }), true);
    assert.equal(isCorrect(numeric, { kind: 'numeric', value: 12.7 }), false);
  });

  it('rejects an answer of the wrong kind', () => {
    assert.equal(isCorrect(numeric, { kind: 'multiple-choice', optionIndex: 0 }), false);
  });
});

describe('correctAnswerText', () => {
  it('renders the winning option for multiple choice', () => {
    assert.equal(correctAnswerText(mcq), 'right');
  });

  it('appends the unit for numeric answers', () => {
    assert.equal(correctAnswerText(numeric), '12.5 cm');
  });
});

describe('xpForAnswer', () => {
  it('pays more for harder questions', () => {
    assert.ok(xpForAnswer(numeric, true, false) > xpForAnswer(mcq, true, false));
  });

  it('halves the reward when a hint was used', () => {
    assert.equal(
      xpForAnswer(mcq, true, true),
      Math.round(xpForAnswer(mcq, true, false) / 2),
    );
  });

  it('still pays something for a wrong answer', () => {
    assert.ok(xpForAnswer(mcq, false, false) > 0);
  });
});
