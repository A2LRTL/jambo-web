import { notFound } from 'next/navigation';
import { getExpressions, LEVELS, type LevelFilter } from '@/lib/latin/deck';
import LatinDrill from '@/components/latin/LatinDrill';

export function generateStaticParams() {
  return LEVELS.map((level) => ({ level }));
}

export default async function LatinQuizPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  if (!(LEVELS as readonly string[]).includes(level)) notFound();
  return <LatinDrill expressions={getExpressions(level as LevelFilter)} lessonId={level === 'all' ? null : `la-${level}`} />;
}
