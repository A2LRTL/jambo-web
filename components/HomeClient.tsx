'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrimaryButton from './PrimaryButton';

const PROFILES = ['Shaza', 'Gisabo', 'Ruta', 'Bambara'] as const;
type Profile = (typeof PROFILES)[number];

export default function HomeClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<Profile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('jambo_profile') as Profile | null;
    if (saved && (PROFILES as readonly string[]).includes(saved)) setSelected(saved);
  }, []);

  const handleSelect = (profile: Profile) => {
    setSelected(profile);
    localStorage.setItem('jambo_profile', profile);
  };

  return (
    <main className="flex flex-col min-h-dvh px-6 pb-10 pt-16 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-10">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-accent mb-3">Jambo</h1>
          <p className="text-muted text-lg">Apprends le swahili, un mot à la fois.</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 text-center">
            Qui es-tu ?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PROFILES.map((profile) => (
              <button
                key={profile}
                type="button"
                onClick={() => handleSelect(profile)}
                className={`py-4 rounded-xl border text-lg font-semibold transition-all active:scale-[0.97] ${
                  selected === profile
                    ? 'bg-accent text-white border-accent shadow-md'
                    : 'bg-card border-border text-ink hover:border-accent'
                }`}
              >
                {profile}
              </button>
            ))}
          </div>
        </div>
      </div>

      <PrimaryButton
        label="Commencer la leçon 1"
        onClick={() => router.push('/lesson/lesson-1')}
        disabled={!selected}
      />
    </main>
  );
}
