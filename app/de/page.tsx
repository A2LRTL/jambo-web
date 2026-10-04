import { getDeck } from '@/lib/german/deck';
import GermanHome from '@/components/german/GermanHome';

export default function GermanPage() {
  return <GermanHome deckIds={getDeck().map((w) => w.id)} />;
}
