import { notFound } from 'next/navigation';
import { CATEGORY_LABELS, SWAHILI_CATEGORY_LABELS } from '@/lib/lesson-registry';
import { getKirundiVocabItems, getSwahiliVocabItems } from '@/lib/exercises';
import FlashcardClient from '@/components/FlashcardClient';
import { MyFlashcards } from '@/components/mine/MyPractice';
import { isCustomLang } from '@/lib/custom-langs';
import lesson1 from '@/data/lesson-1.json';

export default async function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // The learner's own words live on the device, so these pages render client-side
  if (id.startsWith('mine-')) {
    const lang = id.slice('mine-'.length);
    if (!isCustomLang(lang)) notFound();
    return <MyFlashcards lang={lang} />;
  }

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

  if (id.startsWith('swahili-')) {
    const category = id.slice('swahili-'.length);
    if (!(category in SWAHILI_CATEGORY_LABELS)) notFound();
    const items = getSwahiliVocabItems(category);
    return <FlashcardClient lessonId={id} title={SWAHILI_CATEGORY_LABELS[category]} items={items} />;
  }

  notFound();
}
