// Builds data/german-vocab.json from the batch files in this folder.
//
// Usage: node scripts/german/build.mjs
//
// Batch format (one word per line, `|`-separated, `null` or empty = no value):
//   # theme: <theme id>
//   POS|article|lemma|plural|fr|forms|governs|example_de|example_fr
// POS: N noun, V verb, A adjective, D adverb, O other. Optional 10th field: level A2 / B1 / B2 (default B1).
//
// Word ids are derived from the lemma, so progress survives edits and new batches.
// Homonyms get -2, -3… in file order: only ever APPEND homonyms, never insert before one.

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(dir, '../../data/german-vocab.json');

const POS = { N: 'noun', V: 'verb', A: 'adj', D: 'adv', O: 'other' };
const THEMES = ['quotidien', 'logement', 'travail', 'sante', 'administration', 'voyages', 'achats', 'relations', 'medias', 'connecteurs', 'prepositions', 'societe', 'environnement', 'expressions', 'loisirs', 'alimentation', 'etudes', 'communication', 'ville', 'caractere'];

const slug = (s) => s.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const val = (s) => (s === undefined || s.trim() === '' || s.trim() === 'null' ? null : s.trim());

const errors = [];
const words = [];
const ids = new Map();
const seen = new Set();

for (const file of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
  let theme = null;
  readFileSync(join(dir, file), 'utf8').split('\n').forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    if (!line.trim()) return;
    const m = line.match(/^#\s*theme:\s*(\S+)/);
    if (m) {
      theme = m[1];
      if (!THEMES.includes(theme)) errors.push(`${where} unknown theme "${theme}"`);
      return;
    }
    if (line.startsWith('#')) return;

    const f = line.split('|');
    if (f.length < 9 || f.length > 10) { errors.push(`${where} expected 9–10 fields, got ${f.length}`); return; }
    const [p, article, lemma, plural, fr, forms, governs, exDe, exFr, level] = f.map(val);
    const pos = POS[p];

    if (!theme) errors.push(`${where} no theme header before first word`);
    if (!pos) errors.push(`${where} bad POS "${p}"`);
    if (!lemma || !fr || !exDe || !exFr) errors.push(`${where} missing lemma / fr / examples`);
    if (pos === 'noun' && !['der', 'die', 'das'].includes(article)) errors.push(`${where} noun without der/die/das`);
    if (pos !== 'noun' && article) errors.push(`${where} article on a non-noun`);
    if (pos === 'verb' && !forms) errors.push(`${where} verb without forms`);
    if (level && !['A2', 'B1', 'B2'].includes(level)) errors.push(`${where} bad level "${level}"`);

    const key = `${article ?? ''} ${lemma} ${fr}`;
    if (seen.has(key)) errors.push(`${where} duplicate "${lemma}" (${fr})`);
    seen.add(key);

    const base = `de-${slug(lemma ?? '')}`;
    const n = (ids.get(base) ?? 0) + 1;
    ids.set(base, n);

    words.push({
      id: n === 1 ? base : `${base}-${n}`,
      lemma, article, plural, pos, level: level ?? 'B1', theme,
      fr, forms, governs, example_de: exDe, example_fr: exFr,
    });
  });
}

// Compound breakdowns (compounds.list): "lemma|Teil=sens + Teil=sens|mot à mot", matched by lemma
const compounds = new Map();
readFileSync(join(dir, 'compounds.list'), 'utf8').split('\n').forEach((line, i) => {
  const where = `compounds.list:${i + 1}`;
  if (!line.trim() || line.startsWith('#')) return;
  const [lemma, parts, literal] = line.split('|').map((s) => s?.trim());
  if (!lemma || !parts || !literal) { errors.push(`${where} expected lemma|parts|literal`); return; }
  const split = parts.split(' + ').map((p) => {
    const at = p.indexOf('=');
    return at > 0 ? { de: p.slice(0, at).trim(), fr: p.slice(at + 1).trim() } : null;
  });
  if (split.length < 2 || split.includes(null)) { errors.push(`${where} parts must be "Teil=sens + Teil=sens"`); return; }
  if (compounds.has(lemma)) errors.push(`${where} duplicate "${lemma}"`);
  compounds.set(lemma, { parts: split, literal });
});
for (const lemma of compounds.keys()) {
  if (!words.some((w) => w.lemma === lemma)) errors.push(`compounds.list: no word "${lemma}"`);
}
for (const w of words) w.compound = compounds.get(w.lemma) ?? null;

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} error(s) — nothing written.`);
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify({ words }, null, 1) + '\n');
const byTheme = Object.fromEntries(THEMES.map((t) => [t, words.filter((w) => w.theme === t).length]));
console.log(`${words.length} words written to data/german-vocab.json`, byTheme);
