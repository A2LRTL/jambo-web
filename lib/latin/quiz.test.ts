import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { LatinExpression } from '@/types';
import data from '../../data/latin-expressions.json' with { type: 'json' };
import { buildQuestion, gappedExample } from './quiz.ts';

const all = data.expressions as LatinExpression[];

test('buildQuestion: both directions give 4 distinct options with the answer', () => {
  const expr = all.find((e) => e.id === 'sine-qua-non')!;
  const m = buildQuestion(expr, all, 'meaning');
  assert.equal(m.prompt, 'sine qua non');
  assert.equal(m.answer, expr.fr);
  const l = buildQuestion(expr, all, 'latin');
  assert.equal(l.prompt, expr.fr);
  assert.equal(l.answer, 'sine qua non');
  for (const q of [m, l]) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes(q.answer));
  }
});

test('sentence questions gap the expression in its example', () => {
  const expr = all.find((e) => e.id === 'a-priori')!;
  const q = buildQuestion(expr, all, 'sentence');
  assert.equal(q.prompt, '___, le projet semble rentable.');
  assert.equal(q.answer, 'a priori');
  assert.ok(q.options.includes('a priori'));
  for (const e of all) assert.ok(gappedExample(e)?.includes('___'), `no gap for ${e.id}`);
});

test('data: ids, Latin forms and meanings are unique and filled', () => {
  for (const key of ['id', 'latin', 'fr'] as const) {
    const values = all.map((e) => e[key]);
    assert.equal(new Set(values).size, values.length, `duplicate ${key}`);
  }
  for (const e of all) {
    assert.ok(e.literal && e.example && ['courant', 'soutenu'].includes(e.level), e.id);
  }
});
