import { notFound } from 'next/navigation';
import { getDialogue } from '@/lib/dialogue';
import DialogueClient from '@/components/DialogueClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DialoguePage({ params }: Props) {
  const { id } = await params;
  const dialogue = getDialogue(id);
  if (!dialogue) notFound();
  return <DialogueClient dialogue={dialogue} />;
}
