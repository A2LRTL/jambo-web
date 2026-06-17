// ── Spaced-repetition engine (SM-2) ─────────────────────────────────────────
// Classic SuperMemo-2 scheduling, adapted for the flashcard deck.
// Each card keeps an ease factor, a running interval (in days) and a due date.
// State is persisted per lesson in localStorage so reviews carry across sessions.

export type Grade = 'again' | 'good' | 'easy';

export interface SrsCard {
  reps: number;     // consecutive successful recalls
  ease: number;     // ease factor (≥ 1.3)
  interval: number; // current interval in days
  due: number;      // epoch ms when the card is next due
  lapses: number;   // times the card was forgotten
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

// Map the three user-facing buttons to SM-2 quality grades (0-5).
const GRADE_Q: Record<Grade, number> = { again: 2, good: 4, easy: 5 };

const clampEase = (e: number) => Math.max(MIN_EASE, e);

export function newCard(now = Date.now()): SrsCard {
  return { reps: 0, ease: DEFAULT_EASE, interval: 0, due: now, lapses: 0 };
}

/** Apply a review grade to a card and return its next scheduling state. */
export function review(prev: SrsCard | undefined, grade: Grade, now = Date.now()): SrsCard {
  const card = prev ?? newCard(now);
  const q = GRADE_Q[grade];

  let { reps, ease, interval, lapses } = card;

  // Update the ease factor with the standard SM-2 formula.
  ease = clampEase(ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    // Forgotten: relearn now, within the same session.
    reps = 0;
    interval = 0;
    lapses += 1;
    return { reps, ease, interval, due: now, lapses };
  }

  reps += 1;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 6;
  else interval = Math.round(interval * ease);

  if (grade === 'easy') interval = Math.max(interval + 1, Math.round(interval * 1.3));

  return { reps, ease, interval, due: now + interval * DAY_MS, lapses };
}

export const isDue = (card: SrsCard, now = Date.now()) => card.due <= now;

/** A card the learner has recalled successfully at least twice (interval ≥ 6d). */
export const isKnown = (card: SrsCard | undefined) => !!card && card.reps >= 2;

// A "leech": a word forgotten so often it needs extra help rather than more drilling.
export const LEECH_THRESHOLD = 4;
export const isLeech = (card: SrsCard | undefined) => !!card && card.lapses >= LEECH_THRESHOLD;

// ── Persistence ─────────────────────────────────────────────────────────────

export type SrsStore = Record<string, SrsCard>;

const storeKey = (lessonId: string) => `jambo_srs_${lessonId}`;

export function loadStore(lessonId: string): SrsStore {
  try {
    const raw = localStorage.getItem(storeKey(lessonId));
    return raw ? (JSON.parse(raw) as SrsStore) : {};
  } catch {
    return {};
  }
}

export function saveCard(lessonId: string, term: string, card: SrsCard): void {
  try {
    const store = loadStore(lessonId);
    store[term] = card;
    localStorage.setItem(storeKey(lessonId), JSON.stringify(store));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function resetStore(lessonId: string): void {
  try {
    localStorage.removeItem(storeKey(lessonId));
  } catch {
    /* ignore */
  }
}

// ── Session queue ────────────────────────────────────────────────────────────

export interface QueuedCard<T> {
  item: T;
  card: SrsCard | undefined; // undefined → brand-new card
  status: 'new' | 'due';
}

export interface QueueOptions<T> {
  now?: number;
  includeFuture?: boolean;        // append cards scheduled for a future day
  includeNew?: boolean;           // include never-seen cards (default true)
  interleaveBy?: (item: T) => string; // spread cards across groups (e.g. category)
}

/**
 * Round-robin a priority-ordered list across groups so consecutive items tend
 * to differ (interleaved practice). Each group keeps its internal order, and a
 * single group is returned unchanged.
 */
function interleave<T>(items: QueuedCard<T>[], keyOf: (item: T) => string): QueuedCard<T>[] {
  const groups = new Map<string, QueuedCard<T>[]>();
  for (const qc of items) {
    const k = keyOf(qc.item);
    const g = groups.get(k);
    if (g) g.push(qc);
    else groups.set(k, [qc]);
  }
  if (groups.size <= 1) return items;

  const lists = [...groups.values()];
  const result: QueuedCard<T>[] = [];
  for (let i = 0; result.length < items.length; i++) {
    for (const list of lists) if (i < list.length) result.push(list[i]);
  }
  return result;
}

/**
 * Build the study order for a session.
 * Due cards come first (most overdue first), then never-seen cards in their
 * original order. `getCard` resolves each item's spaced-repetition state, which
 * may come from a single store or several (e.g. a cross-lesson review).
 */
export function buildQueue<T extends { term: string }>(
  items: T[],
  getCard: (item: T) => SrsCard | undefined,
  { now = Date.now(), includeFuture = false, includeNew = true, interleaveBy }: QueueOptions<T> = {},
): QueuedCard<T>[] {
  let due: QueuedCard<T>[] = [];
  let fresh: QueuedCard<T>[] = [];
  const future: QueuedCard<T>[] = [];

  for (const item of items) {
    const card = getCard(item);
    if (!card) {
      if (includeNew) fresh.push({ item, card: undefined, status: 'new' });
    } else if (isDue(card, now)) {
      due.push({ item, card, status: 'due' });
    } else {
      future.push({ item, card, status: 'due' });
    }
  }

  due.sort((a, b) => (a.card!.due - b.card!.due));
  future.sort((a, b) => (a.card!.due - b.card!.due));

  if (interleaveBy) {
    due = interleave(due, interleaveBy);
    fresh = interleave(fresh, interleaveBy);
  }

  const queue = [...due, ...fresh];
  return includeFuture ? [...queue, ...future] : queue;
}
