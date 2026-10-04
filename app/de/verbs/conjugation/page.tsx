import { getDeck } from '@/lib/german/deck';
import { conjugate } from '@/lib/german/conjugation';
import ConjDrill from '@/components/german/ConjDrill';

export default function GermanConjugationPage() {
  return <ConjDrill verbs={getDeck().filter((w) => w.pos === 'verb' && conjugate(w))} />;
}
