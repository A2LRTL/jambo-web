import { notFound } from 'next/navigation';
import { KIRUNDI_CATEGORIES, SWAHILI_CATEGORIES } from '@/lib/lesson-registry';
import { getKirundiVocabItems, getSwahiliVocabItems } from '@/lib/exercises';
import FlashcardClient, { type FlashcardItem } from '@/components/FlashcardClient';

export default async function ReviewPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  let items: FlashcardItem[];
  let title: string;

  if (lang === 'kirundi') {
    title = 'Révision Kirundi';
    items = KIRUNDI_CATEGORIES.flatMap((cat) =>
      getKirundiVocabItems(cat).map((it) => ({ ...it, lessonId: `kirundi-${cat}` })),
    );
  } else if (lang === 'swahili') {
    title = 'Révision Swahili';
    items = SWAHILI_CATEGORIES.flatMap((cat) =>
      getSwahiliVocabItems(cat).map((it) => ({ ...it, lessonId: `swahili-${cat}` })),
    );
  } else {
    notFound();
  }

  return <FlashcardClient title={title} items={items} mode="review" />;
}
