'use client';

import { useEffect, useState } from 'react';
import { getLeaderboard, type ProfileStats } from '@/lib/scores';
import {
  KIRUNDI_CATEGORIES,
  SWAHILI_CATEGORIES,
  SWAHILI_PHRASE_TOPICS,
} from '@/lib/lesson-registry';
import { PHRASE_TOPICS } from '@/lib/phrase-registry';

const MEDALS = ['🥇', '🥈', '🥉', '4'];

export default function Leaderboard() {
  const [stats, setStats] = useState<ProfileStats[] | null>(null);

  useEffect(() => {
    getLeaderboard().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted text-sm">Chargement…</p>
      </div>
    );
  }

  // Computed from registry — stays accurate as lessons are added/removed
  const totalLessons =
    KIRUNDI_CATEGORIES.length +
    SWAHILI_CATEGORIES.length +
    PHRASE_TOPICS.length +
    SWAHILI_PHRASE_TOPICS.length;

  return (
    <div className="flex flex-col gap-4">
      {stats.map((s, i) => {
        const medal = MEDALS[i];
        const isNumeric = medal === '4';
        const pct = Math.round(s.pct * 100);
        const perfect = pct === 100 && s.lessonsPlayed > 0;

        return (
          <div key={s.profile} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-2xl leading-none ${isNumeric ? 'w-7 text-center text-base font-bold text-muted' : ''}`}>
                {medal}
              </span>
              <div className="flex-1">
                <p className="font-bold text-ink text-lg leading-tight">{s.profile}</p>
                <p className="text-muted text-xs">
                  {s.lessonsPlayed} / {totalLessons} leçons
                  {s.lessonsPlayed > 0 && ` · ${pct}% correct`}
                </p>
              </div>
              {s.lessonsPlayed > 0 && (
                <span className={`text-sm font-bold ${perfect ? 'text-success' : 'text-accent'}`}>
                  {perfect ? '★ Parfait' : `${s.totalBest}/${s.totalPossible}`}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  perfect ? 'bg-success' : s.pct >= 0.8 ? 'bg-accent' : s.pct >= 0.5 ? 'bg-accent/70' : 'bg-muted/40'
                }`}
                style={{ width: s.lessonsPlayed === 0 ? '0%' : `${pct}%` }}
              />
            </div>

            {/* Lesson coverage bar */}
            <div className="h-1.5 rounded-full bg-border overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full bg-ink/20 transition-all duration-500"
                style={{ width: `${Math.round((s.lessonsPlayed / totalLessons) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted">Leçons jouées</p>
              <p className="text-xs text-muted">{Math.round((s.lessonsPlayed / totalLessons) * 100)}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
