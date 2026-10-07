import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GermanWord } from '@/types';
import { buildConjQuestion, conjugate } from './conjugation.ts';

const verb = (lemma: string, forms: string): GermanWord => ({
  id: lemma, lemma, article: null, plural: null, pos: 'verb', level: 'B1', theme: 't',
  fr: 'f', forms, governs: null, example_de: '', example_fr: '', compound: null,
});

test('strong separable verb: teilnehmen', () => {
  const t = conjugate(verb('teilnehmen', 'nimmt teil, nahm teil, hat teilgenommen'))!;
  assert.deepEqual(t.present, ['nehme teil', 'nimmst teil', 'nimmt teil', 'nehmen teil', 'nehmt teil', 'nehmen teil']);
  assert.deepEqual(t.preterite, ['nahm teil', 'nahmst teil', 'nahm teil', 'nahmen teil', 'nahmt teil', 'nahmen teil']);
  assert.deepEqual(t.perfect, ['habe teilgenommen', 'hast teilgenommen', 'hat teilgenommen', 'haben teilgenommen', 'habt teilgenommen', 'haben teilgenommen']);
});

test('weak verb with linking e: arbeiten', () => {
  const t = conjugate(verb('arbeiten', 'arbeitet, arbeitete, hat gearbeitet'))!;
  assert.deepEqual(t.present, ['arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet', 'arbeiten']);
  assert.deepEqual(t.preterite, ['arbeitete', 'arbeitetest', 'arbeitete', 'arbeiteten', 'arbeitetet', 'arbeiteten']);
});

test('reflexive separable: sich ausruhen', () => {
  const t = conjugate(verb('sich ausruhen', 'ruht sich aus, ruhte sich aus, hat sich ausgeruht'))!;
  assert.equal(t.present[0], 'ruhe mich aus');
  assert.equal(t.present[4], 'ruht euch aus');
  assert.equal(t.perfect[1], 'hast dich ausgeruht');
});

test('dative reflexive: sich leisten', () => {
  assert.equal(conjugate(verb('sich leisten', 'leistet sich, leistete sich, hat sich geleistet'))!.present[0], 'leiste mir');
});

test('stem changes and t/d stems: halten, einladen, vergessen, sterben', () => {
  assert.equal(conjugate(verb('halten von', 'hält, hielt, hat gehalten'))!.present[1], 'hältst');
  assert.equal(conjugate(verb('halten von', 'hält, hielt, hat gehalten'))!.preterite[1], 'hieltest');
  assert.equal(conjugate(verb('einladen', 'lädt ein, lud ein, hat eingeladen'))!.present[1], 'lädst ein');
  assert.equal(conjugate(verb('einladen', 'lädt ein, lud ein, hat eingeladen'))!.present[4], 'ladet ein');
  assert.equal(conjugate(verb('vergessen', 'vergisst, vergaß, hat vergessen'))!.present[1], 'vergisst');
  assert.equal(conjugate(verb('vergessen', 'vergisst, vergaß, hat vergessen'))!.preterite[1], 'vergaßest');
  assert.equal(conjugate(verb('schreien', 'schreit, schrie, hat geschrien'))!.preterite[3], 'schrien');
  assert.equal(conjugate(verb('sterben', 'stirbt, starb, ist gestorben'))!.perfect[3], 'sind gestorben');
});

test('-eln / -ern verbs and tun', () => {
  assert.equal(conjugate(verb('klingeln', 'klingelt, klingelte, hat geklingelt'))!.present[0], 'klingle');
  assert.equal(conjugate(verb('sich ärgern', 'ärgert sich, ärgerte sich, hat sich geärgert'))!.present[0], 'ärgere mich');
  assert.deepEqual(conjugate(verb('wehtun', 'tut weh, tat weh, hat wehgetan'))!.present.slice(0, 2), ['tue weh', 'tust weh']);
});

test('locutions and impersonal verbs are not conjugated', () => {
  assert.equal(conjugate(verb('zuständig sein', 'ist zuständig, war zuständig, ist zuständig gewesen')), null);
  assert.equal(conjugate(verb('sich handeln um', 'handelt sich, handelte sich, hat sich gehandelt')), null);
});

test('quiz traps: regularised stem, weak preterite, wrong auxiliary', () => {
  const nehmen = verb('teilnehmen', 'nimmt teil, nahm teil, hat teilgenommen');
  const present = buildConjQuestion(nehmen, 'present', 1)!;
  assert.equal(present.answer, 'nimmst teil');
  assert.ok(present.options.includes('nehmst teil'));
  assert.equal(new Set(present.options).size, 4);

  assert.ok(buildConjQuestion(nehmen, 'preterite', 0)!.options.includes('nehmte teil'));
  const gehen = verb('ausgehen', 'geht aus, ging aus, ist ausgegangen');
  assert.ok(buildConjQuestion(gehen, 'perfect', 0)!.options.includes('habe ausgegangen'));
});
