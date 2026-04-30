import { notFound } from 'next/navigation';
import type { Lesson } from '@/types';
import ExerciseClient from '@/components/ExerciseClient';
import lesson1 from '@/data/lesson-1.json';

const lessons: Record<string, Lesson> = {
  'lesson-1': lesson1 as Lesson,
};

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = lessons[id];
  if (!lesson) notFound();
  return <ExerciseClient lesson={lesson} />;
}
