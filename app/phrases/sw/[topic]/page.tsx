import { notFound } from 'next/navigation';
import { SWAHILI_PHRASE_TOPIC_LABELS } from '@/lib/lesson-registry';
import { getSwahiliPhraseExercises } from '@/lib/exercises';
import PhraseExerciseClient from '@/components/PhraseExerciseClient';

export default async function SwahiliPhrasesPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!(topic in SWAHILI_PHRASE_TOPIC_LABELS)) notFound();

  const exercises = getSwahiliPhraseExercises(topic);
  if (exercises.length === 0) notFound();

  return (
    <PhraseExerciseClient
      topic={`sw/${topic}`}
      title={SWAHILI_PHRASE_TOPIC_LABELS[topic]}
      exercises={exercises}
    />
  );
}
