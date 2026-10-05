'use client';

import { useRouter } from 'next/navigation';

/** Summary card shown in the home page's 🏛️ tab — the list and drills live at /la. */
export default function LatinTab() {
  const router = useRouter();
  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
      <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Culture générale</p>
      <p className="font-bold text-ink text-lg leading-snug mb-1">Expressions latines</p>
      <p className="text-sm text-muted mb-4">sine qua non, a fortiori, mutatis mutandis…</p>
      <div className="grid grid-cols-2 gap-3 mb-2">
        {([['courant', 'Courantes'], ['soutenu', 'Soutenues']] as const).map(([level, label]) => (
          <button key={level} type="button" onClick={() => router.push(`/la/quiz/${level}`)}
            className="py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-dark active:scale-[0.98] transition-all">
            {label} →
          </button>
        ))}
      </div>
      <button type="button" onClick={() => router.push('/la')}
        className="w-full py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent active:scale-[0.98] transition-all">
        Voir toutes les expressions
      </button>
    </div>
  );
}
