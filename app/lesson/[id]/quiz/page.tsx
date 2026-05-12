import { notFound } from 'next/navigation';
import type { Lesson } from '@/types';
import ExerciseClient from '@/components/ExerciseClient';
import lesson1 from '@/data/lesson-1.json';
import { generateKirundiLesson, generateSwahiliLesson, reverseLesson } from '@/lib/exercises';

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;

  let lesson: Lesson | null = null;
  if (id === 'lesson-1') lesson = lesson1 as Lesson;
  else if (id.startsWith('kirundi-')) lesson = generateKirundiLesson(id.slice('kirundi-'.length));
  else if (id.startsWith('swahili-')) lesson = generateSwahiliLesson(id.slice('swahili-'.length));

  if (!lesson) notFound();
  if (mode === 'reverse') lesson = reverseLesson(lesson);

  return <ExerciseClient lesson={lesson} lessonId={id} />;
}
