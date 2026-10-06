import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { EnglishVerb } from '@/types';
import data from '../../data/english-verb-preps.json' with { type: 'json' };
import { buildQuestion, gapped, highlight, plain, PREPS } from './preps.ts';

const verb = (over: Partial<EnglishVerb> = {}): EnglishVerb => ({
  id: 'depend-on', pattern: 'depend [on] sth', prep: 'on', level: 'B2', fr: 'dépendre de',
  example_en: 'It all depends [on] the weather.', example_fr: '', ...over,
});

test('gapped / plain / highlight read the bracketed preposition', () => {
  assert.equal(gapped('blame sb [for] sth'), 'blame sb ___ sth');
  assert.equal(plain('blame sb [for] sth'), 'blame sb for sth');
  assert.deepEqual(highlight('Listen [to] me.'), [
    { text: 'Listen ', hit: false }, { text: 'to', hit: true }, { text: ' me.', hit: false },
  ]);
});

test('buildQuestion: 4 distinct options, answer and trap included, no other right answer', () => {
  for (let seed = 0; seed < 50; seed++) {
    const rand = () => ((seed * 9301 + 49297) % 233280) / 233280;
    const q = buildQuestion(verb({ trap: 'of', accept: ['upon'] }), false, rand);
    assert.equal(q.prompt, 'depend ___ sth');
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes('on'));
    assert.ok(q.options.includes('of'));
    assert.ok(!q.options.includes('upon'));
  }
});

test('buildQuestion in sentence mode gaps the example', () => {
  const q = buildQuestion(verb(), true);
  assert.equal(q.prompt, 'It all depends ___ the weather.');
  assert.equal(q.answer, 'on');
});

test('data: every entry is well-formed', () => {
  const ids = new Set<string>();
  for (const v of data.verbs as EnglishVerb[]) {
    assert.ok(!ids.has(v.id), `duplicate id ${v.id}`);
    ids.add(v.id);
    assert.ok(PREPS.includes(v.prep), `${v.id}: unknown prep ${v.prep}`);
    assert.ok(v.pattern.includes(`[${v.prep}]`), `${v.id}: pattern`);
    assert.ok(v.example_en.includes(`[${v.prep}]`), `${v.id}: example`);
    if (v.trap) assert.ok(PREPS.includes(v.trap) && v.trap !== v.prep, `${v.id}: trap`);
    for (const a of v.accept ?? []) assert.notEqual(a, v.prep, `${v.id}: accept`);
  }
});
