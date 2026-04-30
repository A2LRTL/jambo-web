import { notFound } from 'next/navigation';
import { PHRASE_TOPIC_LABELS } from '@/lib/phrase-registry';
import { getPhraseExercises } from '@/lib/exercises';
import PhraseExerciseClient from '@/components/PhraseExerciseClient';

export default async function PhrasesPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!(topic in PHRASE_TOPIC_LABELS)) notFound();

  const exercises = getPhraseExercises(topic);
  if (exercises.length === 0) notFound();

  return (
    <PhraseExerciseClient
      topic={topic}
      title={PHRASE_TOPIC_LABELS[topic]}
      exercises={exercises}
    />
  );
}
