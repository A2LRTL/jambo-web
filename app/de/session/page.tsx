import { getDeck } from '@/lib/german/deck';
import ReviewSession from '@/components/german/ReviewSession';

export default function GermanSessionPage() {
  return <ReviewSession deck={getDeck()} />;
}
