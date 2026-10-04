import { getDeck } from '@/lib/german/deck';
import WordList from '@/components/german/WordList';

export default function GermanWordsPage() {
  return <WordList deck={getDeck()} />;
}
