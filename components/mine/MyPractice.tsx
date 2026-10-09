'use client';

import { useState } from 'react';
import type { Exercise, Lesson } from '@/types';
import { CUSTOM_LANGS, customLessonId, useCustomWords, type CustomLang, type CustomWord } from '@/lib/custom-words';
import { useProfile } from '@/lib/profile';
import { sample } from '@/lib/utils';
import FlashcardClient from '@/components/FlashcardClient';
import ExerciseClient from '@/components/ExerciseClient';
import MyWords from './MyWords';

/** Loads the profile's words for `lang`; falls back to the word list until there are enough to practise. */
function useWords(lang: CustomLang): CustomWord[] | undefined {
  const profile = useProfile();
  const all = useCustomWords(profile ?? 'guest');
  if (profile === undefined || !all) return undefined;
  return all.filter((w) => w.lang === lang);
}

export function MyFlashcards({ lang }: { lang: CustomLang }) {
  const words = useWords(lang);
  if (!words) return null;
  if (words.length < 2) return <MyWords lang={lang} />;
  return (
    <FlashcardClient lessonId={customLessonId(lang)} title="Mes mots" termLabel={CUSTOM_LANGS[lang].termLabel} canReport={false}
      items={words.map((w) => ({ term: w.term, translation: w.translation, example: w.example, exampleFr: w.exampleFr }))} />
  );
}

export function MyQuiz({ lang, mode }: { lang: CustomLang; mode?: string }) {
  const words = useWords(lang);
  if (!words) return null;
  if (words.length < 2) return <MyWords lang={lang} />;
  return <Quiz lang={lang} words={words} mode={mode} />;
}

/** Up to 10 random words; the wrong answers come from the other words of the same list. */
function buildLesson(lang: CustomLang, words: CustomWord[], reverse: boolean): Lesson {
  const ask = (w: CustomWord) => (reverse ? w.translation : w.term);
  const answer = (w: CustomWord) => (reverse ? w.term : w.translation);
  const exercises: Exercise[] = sample(words, 10).map((w) => ({
    id: w.id,
    type: 'multiple_choice',
    prompt: ask(w),
    correctAnswer: answer(w),
    wrongAnswers: sample([...new Set(words.map(answer))].filter((a) => a !== answer(w)), 3),
  }));
  return { id: customLessonId(lang), language: lang, title: 'Mes mots', exercises };
}

function Quiz({ lang, words, mode }: { lang: CustomLang; words: CustomWord[]; mode?: string }) {
  const [lesson] = useState(() => buildLesson(lang, words, mode === 'reverse'));
  return <ExerciseClient lesson={lesson} lessonId={customLessonId(lang)} mode={mode} />;
}
