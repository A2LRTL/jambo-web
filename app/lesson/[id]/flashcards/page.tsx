import { notFound } from 'next/navigation';
import { CATEGORY_LABELS } from '@/lib/lesson-registry';
import { getKirundiVocabItems } from '@/lib/exercises';
import FlashcardClient from '@/components/FlashcardClient';
import lesson1 from '@/data/lesson-1.json';

export default async function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === 'lesson-1') {
    const items = lesson1.exercises.map((ex) => ({
      term: ex.prompt,
      translation: ex.correctAnswer,
    }));
    return <FlashcardClient lessonId={id} title="Salutations de base" items={items} />;
  }

  if (id.startsWith('kirundi-')) {
    const category = id.slice('kirundi-'.length);
    if (!(category in CATEGORY_LABELS)) notFound();
    const items = getKirundiVocabItems(category);
    return <FlashcardClient lessonId={id} title={CATEGORY_LABELS[category]} items={items} />;
  }

  notFound();
}
