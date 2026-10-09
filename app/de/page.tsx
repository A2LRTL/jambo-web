import { getDeck } from '@/lib/german/deck';
import GermanHome from '@/components/german/GermanHome';

export default function GermanPage() {
  return <GermanHome deck={getDeck().map(({ id, level }) => ({ id, level }))} />;
}
