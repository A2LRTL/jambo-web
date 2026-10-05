import { notFound } from 'next/navigation';
import { getVerbs, LEVELS, type LevelFilter } from '@/lib/english/deck';
import EnglishPrepDrill from '@/components/english/EnglishPrepDrill';

export function generateStaticParams() {
  return LEVELS.map((level) => ({ level }));
}

export default async function EnglishPrepDrillPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  if (!(LEVELS as readonly string[]).includes(level)) notFound();
  return <EnglishPrepDrill verbs={getVerbs(level as LevelFilter)} />;
}
