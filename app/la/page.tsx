import { getExpressions } from '@/lib/latin/deck';
import LatinList from '@/components/latin/LatinList';

export default function LatinPage() {
  return <LatinList expressions={getExpressions()} />;
}
