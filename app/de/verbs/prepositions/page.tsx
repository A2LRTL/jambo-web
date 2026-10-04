import { getDeck } from '@/lib/german/deck';
import { parsePrep } from '@/lib/german/verbs';
import PrepDrill from '@/components/german/PrepDrill';

export default function GermanPrepDrillPage() {
  return <PrepDrill verbs={getDeck().filter((w) => w.pos === 'verb' && parsePrep(w.governs))} />;
}
