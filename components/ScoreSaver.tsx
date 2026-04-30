'use client';

import { useEffect, useRef } from 'react';
import { saveScore } from '@/lib/scores';

interface Props {
  lessonId: string;
  score: number;
  total: number;
}

export default function ScoreSaver({ lessonId, score, total }: Props) {
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    const profile = localStorage.getItem('jambo_profile');
    if (!profile) return;
    saveScore(profile, lessonId, score, total);
  }, [lessonId, score, total]);

  return null;
}
