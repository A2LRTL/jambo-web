import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GermanWord } from '@/types';
import { buildPrepQuestion, buildSentencePrepQuestion, highlightPrep, parsePrep, stripPrep, verbKind, weakPreterite } from './verbs.ts';

const verb = (lemma: string, forms: string, governs: string | null = null): GermanWord => ({
  id: 'x', lemma, article: null, plural: null, pos: 'verb', level: 'B1', theme: 't',
  fr: 'f', forms, governs, example_de: '', example_fr: '',
});

test('parsePrep reads "prep + case", ignores the rest', () => {
  assert.deepEqual(parsePrep('sich auf + Akk ~'), { preps: ['auf'], kase: 'Akk' });
  assert.deepEqual(parsePrep('sich bei jdm. für + Akk ~'), { preps: ['für'], kase: 'Akk' });
  assert.deepEqual(parsePrep('an / unter + Dat ~'), { preps: ['an', 'unter'], kase: 'Dat' });
  assert.deepEqual(parsePrep('es kommt auf + Akk an'), { preps: ['auf'], kase: 'Akk' });
  assert.equal(parsePrep('+ Dat ~'), null);
  assert.equal(parsePrep('sich mit jdm. ~'), null);
  assert.equal(parsePrep(null), null);
});

test('stripPrep removes trailing prepositions only', () => {
  assert.equal(stripPrep('halten von'), 'halten');
  assert.equal(stripPrep('sich freuen auf'), 'sich freuen');
  assert.equal(stripPrep('warten'), 'warten');
});

test('weakPreterite', () => {
  assert.equal(weakPreterite('machen'), 'machte');
  assert.equal(weakPreterite('arbeiten'), 'arbeitete');
  assert.equal(weakPreterite('öffnen'), 'öffnete');
  assert.equal(weakPreterite('lernen'), 'lernte');
  assert.equal(weakPreterite('ändern'), 'änderte');
  assert.equal(weakPreterite('räumen'), 'räumte');
  assert.equal(weakPreterite('verdienen'), 'verdiente');
  assert.equal(weakPreterite('rechnen'), 'rechnete');
  assert.equal(weakPreterite('wohnen'), 'wohnte');
  assert.equal(weakPreterite('atmen'), 'atmete');
});

test('verbKind: reflexive, separable, irregular', () => {
  assert.deepEqual(
    { ...verbKind(verb('sich ausruhen', 'ruht sich aus, ruhte sich aus, hat sich ausgeruht')), prep: null },
    { reflexive: true, separable: true, irregular: false, prep: null },
  );
  const nehmen = verbKind(verb('teilnehmen', 'nimmt teil, nahm teil, hat teilgenommen', 'an + Dat ~'));
  assert.equal(nehmen.separable, true);
  assert.equal(nehmen.irregular, true);
  assert.deepEqual(nehmen.prep, { preps: ['an'], kase: 'Dat' });

  assert.equal(verbKind(verb('denken', 'denkt, dachte, hat gedacht')).irregular, true);
  assert.equal(verbKind(verb('zuständig sein', 'ist zuständig, war zuständig, ist zuständig gewesen')).separable, false);
  assert.equal(verbKind(verb('sich Sorgen machen', 'macht sich Sorgen, machte sich Sorgen, hat sich Sorgen gemacht')).irregular, false);
  assert.equal(verbKind(verb('ankommen auf', 'kommt an, kam an, ist angekommen')).separable, true);
});

test('buildPrepQuestion: 4 distinct options, one right answer, wrong-case trap first', () => {
  const q = buildPrepQuestion(verb('warten', 'wartet, wartete, hat gewartet', 'auf + Akk ~'))!;
  assert.equal(q.prompt, 'warten ___');
  assert.equal(q.answer, 'auf + Akk');
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options).size, 4);
  assert.ok(q.options.includes('auf + Dat'));

  const leiden = buildPrepQuestion(verb('leiden', 'leidet, litt, hat gelitten', 'an / unter + Dat ~'))!;
  assert.ok(!leiden.options.includes('unter + Dat'), 'an alternative right answer is never a distractor');
  for (let i = 0; i < 50; i++) {
    const streiten = buildPrepQuestion(verb('sich streiten', 'streitet sich, stritt sich, hat sich gestritten', 'sich mit jdm. über + Akk ~'))!;
    assert.ok(!streiten.options.some((o) => o.startsWith('mit ')), 'mit is also correct here');
  }
  assert.equal(buildPrepQuestion(verb('vertrauen', 'vertraut, vertraute, hat vertraut', '+ Dat ~')), null);
});

test('highlightPrep flags the preposition and its contractions', () => {
  const hits = (s: string, p: string[]) => highlightPrep(s, p).filter((x) => x.hit).map((x) => x.text);
  assert.deepEqual(hits('Ich warte auf den Bus.', ['auf']), ['auf']);
  assert.deepEqual(hits('Wir gratulieren dir zum Geburtstag!', ['zu']), ['zum']);
  assert.equal(highlightPrep('Ich warte auf den Bus.', ['auf']).map((x) => x.text).join(''), 'Ich warte auf den Bus.');
});

test('buildSentencePrepQuestion gaps the plain preposition, skips contractions and doubles', () => {
  const w = (governs: string, example_de: string): GermanWord => ({ ...verb('warten', 'wartet, wartete, hat gewartet', governs), example_de });
  const q = buildSentencePrepQuestion(w('auf + Akk ~', 'Ich warte auf den Bus.'))!;
  assert.equal(q.prompt, 'Ich warte ___ den Bus.');
  assert.equal(q.answer, 'auf');
  assert.equal(new Set(q.options).size, 4);
  assert.ok(q.options.includes('auf'));
  assert.equal(buildSentencePrepQuestion(w('zu + Dat ~', 'Wir gratulieren dir zum Geburtstag!')), null);
  assert.equal(buildSentencePrepQuestion(w('auf + Akk ~', 'Pass auf die Kinder auf!')), null);
});
