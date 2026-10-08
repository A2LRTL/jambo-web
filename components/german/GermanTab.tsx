'use client';

import { useRouter } from 'next/navigation';
import { isDue, KNOWN_BOX, QUEUED_BOX } from '@/lib/german/srs';
import { useGermanProgress } from '@/lib/german/progress';

/** Summary card shown in the home page's 🇩🇪 tab — the full dashboard lives at /de. */
export default function GermanTab({ profile }: { profile: string }) {
  const router = useRouter();
  const progress = useGermanProgress(profile);
  if (!progress) return null;

  const entries = Object.values(progress);
  const now = new Date();
  const due = entries.filter((p) => isDue(p, now)).length;
  const known = entries.filter((p) => p.box >= KNOWN_BOX).length;
  const learning = entries.filter((p) => p.box !== QUEUED_BOX && p.box < KNOWN_BOX).length;
  const started = entries.length > 0;

  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
      <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Vocabulaire A2 → B2</p>
      <p className="font-bold text-ink text-lg leading-snug mb-1">
        {!started ? 'Commence par trier tes premiers mots' : due > 0 ? `${due} mots à réviser` : 'Tout est à jour ✓'}
      </p>
      {started && <p className="text-sm text-muted mb-4">{known} connus · {learning} en cours</p>}
      <button type="button" onClick={() => router.push('/de')}
        className={`w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-dark active:scale-[0.98] transition-all ${started ? '' : 'mt-3'}`}>
        Ouvrir →
      </button>
    </div>
  );
}
