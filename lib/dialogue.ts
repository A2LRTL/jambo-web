import vocab from '@/data/kirundi-vocab.json';

interface RawPhrase {
  id: string;
  phrase_kirundi: string;
  translation_en: string;
  translation_fr: string | null;
  topic: string;
  dialogue_id?: string;
  dialogue_order?: number;
}

export interface DialogueLine {
  id: string;
  kirundi: string;
  translation: string;
  /** 'a' = left bubble (Nikiza), 'b' = right bubble (Marc) */
  speaker: 'a' | 'b';
  order: number;
}

export interface Dialogue {
  id: string;
  title: string;
  speakerA: string;
  speakerB: string;
  lines: DialogueLine[];
}

const DIALOGUE_META: Record<string, { title: string; speakerA: string; speakerB: string }> = {
  nikiza_jenny: { title: 'Nikiza rencontre Marc', speakerA: 'Nikiza', speakerB: 'Marc' },
};

export function getDialogue(id: string): Dialogue | null {
  const meta = DIALOGUE_META[id];
  if (!meta) return null;

  const topic = `dialogue_${id}`;
  const raw = (vocab.phrases as RawPhrase[])
    .filter((p) => p.topic === topic && p.dialogue_order != null)
    .sort((a, b) => (a.dialogue_order ?? 0) - (b.dialogue_order ?? 0));

  if (raw.length === 0) return null;

  const lines: DialogueLine[] = raw.map((p) => ({
    id: p.id,
    kirundi: p.phrase_kirundi,
    translation: p.translation_fr ?? p.translation_en,
    speaker: ((p.dialogue_order ?? 1) % 2 === 1 ? 'a' : 'b') as 'a' | 'b',
    order: p.dialogue_order ?? 0,
  }));

  return { id, ...meta, lines };
}

export const ALL_DIALOGUES = Object.keys(DIALOGUE_META);
