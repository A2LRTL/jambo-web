import { notFound } from 'next/navigation';
import type { Lesson } from '@/types';
import ExerciseClient from '@/components/ExerciseClient';
import lesson1 from '@/data/lesson-1.json';
import { generateKirundiLesson } from '@/lib/exercises';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let lesson: Lesson | null = null;

  if (id === 'lesson-1') {
    lesson = lesson1 as Lesson;
  } else if (id.startsWith('kirundi-')) {
    lesson = generateKirundiLesson(id.slice('kirundi-'.length));
  }

  if (!lesson) notFound();
  return <ExerciseClient lesson={lesson} />;
}
