import { getDeck } from '@/lib/german/deck';
import VerbList from '@/components/german/VerbList';

export default function GermanVerbsPage() {
  return <VerbList verbs={getDeck().filter((w) => w.pos === 'verb')} />;
}
