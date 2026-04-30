import { supabase } from './supabase';

export interface BestScore {
  best: number;
  total: number;
  attempts: number;
}

export async function saveScore(
  profile: string,
  lessonId: string,
  score: number,
  total: number,
): Promise<void> {
  const { error } = await supabase
    .from('scores')
    .insert({ profile, lesson_id: lessonId, score, total });
  if (error) console.error('saveScore:', error.message);
}

export async function getBestScores(
  profile: string,
): Promise<Record<string, BestScore>> {
  const { data, error } = await supabase
    .from('scores')
    .select('lesson_id, score, total')
    .eq('profile', profile);

  if (error || !data) return {};

  const result: Record<string, BestScore> = {};
  for (const row of data) {
    const cur = result[row.lesson_id];
    if (!cur) {
      result[row.lesson_id] = { best: row.score, total: row.total, attempts: 1 };
    } else {
      cur.attempts++;
      if (row.score > cur.best) { cur.best = row.score; cur.total = row.total; }
    }
  }
  return result;
}
