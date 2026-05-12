import { supabase } from './supabase';

export interface BestScore {
  best: number;
  total: number;
  attempts: number;
}

// ── Offline queue ─────────────────────────────────────────────────────────────

const QUEUE_KEY = 'ubuntu_score_queue';

interface QueuedScore {
  profile: string;
  lessonId: string;
  score: number;
  total: number;
  ts: number;
}

function enqueue(entry: QueuedScore) {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const q: QueuedScore[] = raw ? JSON.parse(raw) : [];
    q.push(entry);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch { /* ignore */ }
}

async function flushQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const q: QueuedScore[] = JSON.parse(raw);
    if (q.length === 0) return;

    const rows = q.map((e) => ({ profile: e.profile, lesson_id: e.lessonId, score: e.score, total: e.total }));
    const { error } = await supabase.from('scores').insert(rows);
    if (!error) {
      localStorage.removeItem(QUEUE_KEY);
    }
  } catch { /* ignore */ }
}

// Sync queued scores whenever the user comes back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushQueue);
  // Also try on load (in case we're online already)
  flushQueue();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveScore(
  profile: string,
  lessonId: string,
  score: number,
  total: number,
): Promise<void> {
  if (!navigator.onLine) {
    enqueue({ profile, lessonId, score, total, ts: Date.now() });
    return;
  }
  // Try to flush any pending queue first
  await flushQueue();

  const { error } = await supabase
    .from('scores')
    .insert({ profile, lesson_id: lessonId, score, total });
  if (error) {
    // Network failed despite navigator.onLine — enqueue as fallback
    enqueue({ profile, lessonId, score, total, ts: Date.now() });
    console.error('saveScore:', error.message);
  }
}

export interface ProfileStats {
  profile: string;
  lessonsPlayed: number;
  totalBest: number;
  totalPossible: number;
  pct: number;
}

const ALL_PROFILES = ['Shaza', 'Gisabo', 'Ruta', 'Bambara'];

export async function getLeaderboard(): Promise<ProfileStats[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('profile, lesson_id, score, total');

  if (error || !data) return ALL_PROFILES.map((p) => ({ profile: p, lessonsPlayed: 0, totalBest: 0, totalPossible: 0, pct: 0 }));

  const map: Record<string, Record<string, { best: number; total: number }>> = {};
  for (const row of data) {
    if (!map[row.profile]) map[row.profile] = {};
    const cur = map[row.profile][row.lesson_id];
    if (!cur || row.score > cur.best) map[row.profile][row.lesson_id] = { best: row.score, total: row.total };
  }

  const stats: ProfileStats[] = ALL_PROFILES.map((profile) => {
    const lessons = Object.values(map[profile] ?? {});
    const lessonsPlayed = lessons.length;
    const totalBest = lessons.reduce((s, l) => s + l.best, 0);
    const totalPossible = lessons.reduce((s, l) => s + l.total, 0);
    return { profile, lessonsPlayed, totalBest, totalPossible, pct: totalPossible > 0 ? totalBest / totalPossible : 0 };
  });

  return stats.sort((a, b) => b.pct - a.pct || b.lessonsPlayed - a.lessonsPlayed);
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
