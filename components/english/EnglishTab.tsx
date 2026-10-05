'use client';

import { useRouter } from 'next/navigation';

/** Summary card shown in the home page's 🇬🇧 tab — the list and drills live at /en. */
export default function EnglishTab() {
  const router = useRouter();
  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
      <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Niveau B2 → C1</p>
      <p className="font-bold text-ink text-lg leading-snug mb-1">Verbe + préposition</p>
      <p className="text-sm text-muted mb-4">depend on, refrain from, account for…</p>
      <div className="grid grid-cols-2 gap-3 mb-2">
        {(['B2', 'C1'] as const).map((level) => (
          <button key={level} type="button" onClick={() => router.push(`/en/prepositions/${level.toLowerCase()}`)}
            className="py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-dark active:scale-[0.98] transition-all">
            S&apos;entraîner {level} →
          </button>
        ))}
      </div>
      <button type="button" onClick={() => router.push('/en')}
        className="w-full py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent active:scale-[0.98] transition-all">
        Voir la liste des verbes
      </button>
    </div>
  );
}
