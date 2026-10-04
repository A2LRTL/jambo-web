'use client';

import { useRouter } from 'next/navigation';

export default function GermanHeader({ kicker, title, back = '/de', right }: {
  kicker: string;
  title: string;
  back?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 pt-6 pb-4">
      <button type="button" onClick={() => router.push(back)} aria-label="Retour"
        className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none">
        ←
      </button>
      <div className="flex-1">
        <p className="text-xs text-muted uppercase tracking-wider">{kicker}</p>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
      </div>
      {right}
    </div>
  );
}
