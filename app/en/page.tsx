import { getVerbs } from '@/lib/english/deck';
import EnglishVerbList from '@/components/english/EnglishVerbList';

export default function EnglishPage() {
  return <EnglishVerbList verbs={getVerbs()} />;
}
