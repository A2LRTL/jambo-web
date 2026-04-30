import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dir, '../data/kirundi-vocab.json');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  'https://fugsjhakenoiqdsgbqzf.supabase.co',
  'sb_publishable_lxO8wgBQg6ghTX3aktm05w_98rv0-tw',
);

async function translateBatch(terms) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Translate these English terms to French. Return ONLY a JSON array of strings, same order, no explanation.
Input: ${JSON.stringify(terms)}`,
    }],
  });
  const text = msg.content[0].text.trim();
  const json = text.match(/\[[\s\S]*\]/)?.[0];
  if (!json) throw new Error('No JSON array in response: ' + text);
  return JSON.parse(json);
}

async function run() {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  const BATCH = 50;

  // ── Vocabulary ────────────────────────────────────────────────────────────
  const vocab = data.vocabulary_items;
  const needVocab = vocab.filter(v => !v.translation_fr && v.translation_en);
  console.log(`Translating ${needVocab.length} vocab items in batches of ${BATCH}…`);

  for (let i = 0; i < needVocab.length; i += BATCH) {
    const batch = needVocab.slice(i, i + BATCH);
    const terms = batch.map(v => v.translation_en);
    process.stdout.write(`  vocab ${i + 1}–${Math.min(i + BATCH, needVocab.length)}… `);
    const translations = await translateBatch(terms);
    batch.forEach((item, j) => { item.translation_fr = translations[j]; });
    console.log('✓');
  }

  // ── Phrases ───────────────────────────────────────────────────────────────
  const phrases = data.phrases;
  const needPhrases = phrases.filter(p => !p.translation_fr && p.translation_en);
  console.log(`\nTranslating ${needPhrases.length} phrases…`);

  for (let i = 0; i < needPhrases.length; i += BATCH) {
    const batch = needPhrases.slice(i, i + BATCH);
    const terms = batch.map(p => p.translation_en);
    process.stdout.write(`  phrases ${i + 1}–${Math.min(i + BATCH, needPhrases.length)}… `);
    const translations = await translateBatch(terms);
    batch.forEach((item, j) => { item.translation_fr = translations[j]; });
    console.log('✓');
  }

  // ── Save JSON ─────────────────────────────────────────────────────────────
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log('\n✓ JSON updated');

  // ── Update Supabase ───────────────────────────────────────────────────────
  console.log('\nPushing to Supabase…');

  // Add column if missing — silently ignore error if already exists
  const vocabUpdates = vocab.filter(v => v.translation_fr).map(v => ({
    id: v.id, translation_fr: v.translation_fr,
  }));
  for (let i = 0; i < vocabUpdates.length; i += 100) {
    const chunk = vocabUpdates.slice(i, i + 100);
    const { error } = await supabase.from('vocabulary_items').upsert(chunk, { onConflict: 'id' });
    if (error) console.error('vocab upsert error:', error.message);
    else process.stdout.write('.');
  }

  const phraseUpdates = phrases.filter(p => p.translation_fr).map(p => ({
    id: p.id, translation_fr: p.translation_fr,
  }));
  for (let i = 0; i < phraseUpdates.length; i += 100) {
    const chunk = phraseUpdates.slice(i, i + 100);
    const { error } = await supabase.from('phrases').upsert(chunk, { onConflict: 'id' });
    if (error) console.error('phrases upsert error:', error.message);
    else process.stdout.write('.');
  }

  console.log('\n✓ Supabase updated');
  console.log('\nDone! All translations complete.');
}

run().catch(err => { console.error(err); process.exit(1); });
