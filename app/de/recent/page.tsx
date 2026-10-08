import { getDeck } from '@/lib/german/deck';
import RecentWords from '@/components/german/RecentWords';

export default function GermanRecentPage() {
  return <RecentWords deck={getDeck()} />;
}
