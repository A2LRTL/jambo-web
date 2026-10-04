'use client';

import { useEffect, useRef } from 'react';
import { saveScore } from '@/lib/scores';
import { markPracticed } from './NotificationSetup';

interface Props {
  lessonId: string;
  score: number;
  total: number;
  /** Unique id of the quiz attempt (from the URL) — prevents re-saving on page reload. */
  attemptId?: string;
}

const SAVED_KEY = 'ubuntu_saved_attempts';
const MAX_SAVED = 50;

/** Returns true if this attempt was already saved; otherwise records it. */
function alreadySaved(key: string): boolean {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const saved: string[] = raw ? JSON.parse(raw) : [];
    if (saved.includes(key)) return true;
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved, key].slice(-MAX_SAVED)));
  } catch { /* ignore */ }
  return false;
}

export default function ScoreSaver({ lessonId, score, total, attemptId }: Props) {
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    const profile = localStorage.getItem('jambo_profile');
    if (!profile) return;
    if (attemptId && alreadySaved(`${lessonId}:${attemptId}`)) return;
    // Guests practise without recording scores
    if (profile !== 'guest') saveScore(profile, lessonId, score, total);
    markPracticed();
  }, [lessonId, score, total, attemptId]);

  return null;
}
