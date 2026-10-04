// Verb helpers — pure functions (tested with `node --test lib/german/verbs.test.ts`).

import type { GermanWord } from '@/types';

export type Case = 'Akk' | 'Dat';

const TWO_WAY  = ['an', 'auf', 'in', 'über', 'unter', 'vor'];
const DAT_ONLY = ['aus', 'bei', 'mit', 'nach', 'von', 'zu'];
const AKK_ONLY = ['für', 'um', 'gegen'];
const ALL_PREPS = [...TWO_WAY, ...DAT_ONLY, ...AKK_ONLY];

/** Cases a preposition can take after a verb. */
export function casesFor(prep: string): Case[] {
  if (TWO_WAY.includes(prep)) return ['Akk', 'Dat'];
  return DAT_ONLY.includes(prep) ? ['Dat'] : ['Akk'];
}

// ── Construction parsing ──────────────────────────────────────────────────────

export interface PrepConstruction {
  preps: string[];  // usually one; "an / unter + Dat" gives two accepted answers
  kase: Case;
}

const PREP = `(?:${ALL_PREPS.join('|')})`;
const PREP_RE = new RegExp(`(?<!\\p{L})(${PREP}(?:\\s*/\\s*${PREP})*)\\s*\\+\\s*(Akk|Dat)`, 'u');

/** "sich bei jdm. für + Akk ~" → { preps: ['für'], kase: 'Akk' }; null when there is no "prep + case". */
export function parsePrep(governs: string | null): PrepConstruction | null {
  const m = governs?.match(PREP_RE);
  if (!m) return null;
  return { preps: m[1].split('/').map((p) => p.trim()), kase: m[2] as Case };
}

const label = (prep: string, kase: Case) => `${prep} + ${kase}`;

// ── Verb classification ───────────────────────────────────────────────────────

/** "halten von" → "halten", "sich freuen auf" → "sich freuen". */
export function stripPrep(lemma: string): string {
  const tokens = lemma.split(' ');
  while (tokens.length > 1 && ALL_PREPS.includes(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(' ');
}

/** The infinitive itself: "sich Sorgen machen" → "machen", "zuständig sein" → "sein". */
function infinitive(lemma: string): string {
  const tokens = stripPrep(lemma).split(' ');
  return tokens[tokens.length - 1];
}

function separablePrefix(word: GermanWord): string | null {
  const present = (word.forms ?? '').split(',')[0].trim().split(' ');
  const last = present[present.length - 1];
  const inf = infinitive(word.lemma);
  return present.length > 1 && last !== 'sich' && last === last.toLowerCase() && inf.startsWith(last) && inf !== last
    ? last
    : null;
}

/** Regular (weak) preterite of an infinitive: machen → machte, arbeiten → arbeitete. */
export function weakPreterite(inf: string): string {
  const stem = inf.endsWith('en') ? inf.slice(0, -2) : inf.slice(0, -1);
  // -t/-d stems (arbeitete) and consonant + m/n (atmete, öffnete, rechnete) — but not lernte, wohnte, träumte
  const needsE = /[dt]$/.test(stem) || /(?:[^aeiouyäöülrmnh]|[^aeiouyäöü]h)[mn]$/.test(stem);
  return stem + (needsE ? 'ete' : 'te');
}

export interface VerbKind {
  reflexive: boolean;
  separable: boolean;
  irregular: boolean;
  prep: PrepConstruction | null;
}

export function verbKind(word: GermanWord): VerbKind {
  const prefix = separablePrefix(word);
  const inf = infinitive(word.lemma);
  const base = prefix ? inf.slice(prefix.length) : inf;
  const preterite = (word.forms ?? '').split(',')[1]?.trim().split(' ')[0] ?? '';
  return {
    reflexive: word.lemma.startsWith('sich ') || / sich( |$)/.test((word.forms ?? '').split(',')[0]),
    separable: prefix !== null,
    irregular: preterite !== '' && preterite !== weakPreterite(base),
    prep: parsePrep(word.governs),
  };
}

// ── Preposition quiz ──────────────────────────────────────────────────────────

export interface PrepQuestion {
  wordId: string;
  prompt: string;     // "sich interessieren ___"
  answer: string;     // "für + Akk"
  options: string[];  // 4 shuffled choices, answer included
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
 * Builds a 4-choice question. Distractors favour the classic traps:
 * the right preposition with the wrong case, then other prepositions.
 */
export function buildPrepQuestion(word: GermanWord, rand: () => number = Math.random): PrepQuestion | null {
  const c = parsePrep(word.governs);
  if (!c) return null;
  const correct = new Set(c.preps.map((p) => label(p, c.kase)));
  const answer = label(c.preps[0], c.kase);

  // Any other preposition named in the construction ("sich mit jdm. über + Akk") is also right — never offer it
  const named = new Set((word.governs ?? '').split(/[\s/.]+/).filter((t) => ALL_PREPS.includes(t)));
  const sameprepWrongCase = c.preps.flatMap((p) => casesFor(p).map((k) => label(p, k))).filter((o) => !correct.has(o));
  const others = shuffled(
    ALL_PREPS.filter((p) => !named.has(p)).flatMap((p) => casesFor(p).map((k) => label(p, k))),
    rand,
  );
  const distractors = [...new Set([...shuffled(sameprepWrongCase, rand).slice(0, 1), ...others])].slice(0, 3);

  return {
    wordId: word.id,
    prompt: `${stripPrep(word.lemma)} ___`,
    answer,
    options: shuffled([answer, ...distractors], rand),
  };
}

// ── Highlighting ──────────────────────────────────────────────────────────────

const CONTRACTIONS: Record<string, string[]> = {
  an: ['am', 'ans'], auf: ['aufs'], in: ['im', 'ins'], von: ['vom'], zu: ['zum', 'zur'],
  bei: ['beim'], über: ['übers'], um: ['ums'], für: ['fürs'],
};

/** Splits a sentence into parts, flagging the preposition (and its contractions). */
export function highlightPrep(sentence: string, preps: string[]): { text: string; hit: boolean }[] {
  const forms = new Set(preps.flatMap((p) => [p, ...(CONTRACTIONS[p] ?? [])]));
  return sentence.split(/(\p{L}+)/u).filter(Boolean).map((text) => ({ text, hit: forms.has(text.toLowerCase()) }));
}
