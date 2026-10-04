import { getDeck } from '@/lib/german/deck';
import Triage from '@/components/german/Triage';

export default function GermanTriagePage() {
  return <Triage deck={getDeck()} />;
}
