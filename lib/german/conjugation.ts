// Conjugation tables generated from the three forms stored per verb
// ("nimmt teil, nahm teil, hat teilgenommen") — pure, tested in conjugation.test.ts.

import type { GermanWord } from '@/types';
import { needsLinkingE, separablePrefix, stripPrep, verbStem, weakPreterite } from './verbs.ts';

export type Tense = 'present' | 'preterite' | 'perfect';
export const TENSES: Tense[] = ['present', 'preterite', 'perfect'];
export const TENSE_LABELS: Record<Tense, string> = { present: 'Présent', preterite: 'Prétérit', perfect: 'Parfait' };

export const PERSONS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'] as const;
const ACC = ['mich', 'dich', 'sich', 'uns', 'euch', 'sich'];
const DAT = ['mir', 'dir', 'sich', 'uns', 'euch', 'sich'];
const HABEN = ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'];
const SEIN = ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'];

/** Reflexive verbs whose pronoun is dative (ich leiste mir …). */
const DATIVE_REFLEXIVE = new Set(['sich leisten']);
/** Only used in the 3rd person (es handelt sich um …, das wirkt sich auf … aus). */
const IMPERSONAL = new Set(['sich handeln um', 'sich auswirken']);

export type Table = Record<Tense, string[]>;

interface Parts {
  base: string;             // infinitive without particle: nehmen
  particle: string | null;  // teil
  reflexive: string[] | null;
  present3: string;         // nimmt
  preterite3: string;       // nahm
  aux: 'hat' | 'ist';
  participle: string;       // teilgenommen
}

function parts(word: GermanWord): Parts | null {
  if (word.pos !== 'verb' || !word.forms || IMPERSONAL.has(word.lemma)) return null;
  const lemma = stripPrep(word.lemma);
  const isReflexive = lemma.startsWith('sich ');
  const inf = lemma.replace(/^sich /, '');
  if (inf.includes(' ')) return null; // locutions: zuständig sein, Angst haben…

  const [pres, pret, perf] = word.forms.split(',').map((f) => f.trim().split(' '));
  if (!pres || !pret || !perf) return null;
  const aux = perf[0];
  if (aux !== 'hat' && aux !== 'ist') return null;

  const particle = separablePrefix(word);
  return {
    base: particle ? inf.slice(particle.length) : inf,
    particle,
    reflexive: isReflexive ? (DATIVE_REFLEXIVE.has(lemma) ? DAT : ACC) : null,
    present3: pres[0],
    preterite3: pret[0],
    aux,
    participle: perf[perf.length - 1],
  };
}

function presentForms(p: Parts): string[] {
  const stem = verbStem(p.base);
  const ich = stem.endsWith('el') ? `${stem.slice(0, -2)}le` : `${stem}e`;
  // du: from the er-form, so stem changes carry over (nimmt → nimmst, hält → hältst, lädt → lädst)
  let du: string;
  if (stem.endsWith('t') && !p.present3.endsWith('et')) du = `${p.present3}st`;
  else {
    const s = p.present3.slice(0, -1);
    du = s + (/[sßzx]$/.test(s) ? 't' : 'st');
  }
  const ihr = stem + (needsLinkingE(stem) ? 'et' : 't');
  return [ich, du, p.present3, p.base, ihr, p.base];
}

function preteriteForms(p: Parts): string[] {
  const v = p.preterite3;
  if (v.endsWith('te')) return [v, `${v}st`, v, `${v}n`, `${v}t`, `${v}n`];
  return [
    v,
    v + (/[dtsßz]$/.test(v) ? 'est' : 'st'),
    v,
    `${v}en`,
    v + (/[dt]$/.test(v) ? 'et' : 't'),
    `${v}en`,
  ];
}

/** "nimmst" + reflexive + particle → "nimmst teil", "ruhst dich aus". */
function finite(p: Parts, verb: string, person: number): string {
  return [verb, p.reflexive?.[person], p.particle].filter(Boolean).join(' ');
}

export function conjugate(word: GermanWord): Table | null {
  const p = parts(word);
  if (!p) return null;
  const aux = p.aux === 'hat' ? HABEN : SEIN;
  return {
    present: presentForms(p).map((v, i) => finite(p, v, i)),
    preterite: preteriteForms(p).map((v, i) => finite(p, v, i)),
    perfect: aux.map((a, i) => [a, p.reflexive?.[i], p.participle].filter(Boolean).join(' ')),
  };
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

export interface ConjQuestion {
  wordId: string;
  tense: Tense;
  person: number;
  answer: string;
  options: string[];
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 4 choices. Traps first: the form a learner would "regularise"
 * (nehmst, nahmte → nehmte, wrong auxiliary), then other persons of the same tense.
 */
export function buildConjQuestion(
  word: GermanWord, tense: Tense, person: number, rand: () => number = Math.random,
): ConjQuestion | null {
  const p = parts(word);
  const table = conjugate(word);
  if (!p || !table) return null;
  const answer = table[tense][person];

  const traps: string[] = [];
  const stem = verbStem(p.base);
  if (tense === 'present' && (person === 1 || person === 2)) {
    const regular = person === 1 ? stem + (/[sßzx]$/.test(stem) ? 't' : needsLinkingE(stem) ? 'est' : 'st') : stem + (needsLinkingE(stem) ? 'et' : 't');
    traps.push(finite(p, regular, person));
  }
  if (tense === 'preterite' && !p.preterite3.endsWith('te')) {
    const weak = weakPreterite(p.base);
    traps.push(finite(p, [weak, `${weak}st`, weak, `${weak}n`, `${weak}t`, `${weak}n`][person], person));
  }
  if (tense === 'perfect') {
    const other = p.aux === 'hat' ? SEIN : HABEN;
    traps.push([other[person], p.reflexive?.[person], p.participle].filter(Boolean).join(' '));
  }
  const persons = shuffled(table[tense].filter((_, i) => i !== person), rand);
  const distractors = [...new Set([...traps, ...persons])].filter((o) => o !== answer).slice(0, 3);

  return { wordId: word.id, tense, person, answer, options: shuffled([answer, ...distractors], rand) };
}
