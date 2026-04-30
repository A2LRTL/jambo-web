'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrimaryButton from './PrimaryButton';

const PROFILES = [
  { name: 'Shaza',   year: '2007' },
  { name: 'Gisabo',  year: '2000' },
  { name: 'Ruta',    year: '1998' },
  { name: 'Bambara', year: '1995' },
] as const;

type ProfileName = (typeof PROFILES)[number]['name'];

export default function HomeClient() {
  const router = useRouter();
  const [active, setActive]       = useState<ProfileName | null>(null);
  const [confirmed, setConfirmed] = useState<ProfileName | null>(null);
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('jambo_profile') as ProfileName | null;
    if (saved && PROFILES.some((p) => p.name === saved)) setConfirmed(saved);
  }, []);

  const handleProfileClick = (name: ProfileName) => {
    setActive(name);
    setPin('');
    setError(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlePinChange = (value: string) => {
    if (!/^\d*$/.test(value) || value.length > 4) return;
    setPin(value);
    setError(false);

    if (value.length === 4) {
      const profile = PROFILES.find((p) => p.name === active);
      if (profile?.year === value) {
        setConfirmed(active);
        localStorage.setItem('jambo_profile', active!);
        setActive(null);
      } else {
        setError(true);
        setPin('');
      }
    }
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
            {PROFILES.map(({ name }) => {
              const isConfirmed = confirmed === name;
              const isActive    = active === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleProfileClick(name)}
                  className={`py-4 rounded-xl border text-lg font-semibold transition-all active:scale-[0.97] ${
                    isConfirmed
                      ? 'bg-accent text-white border-accent shadow-md'
                      : isActive
                      ? 'bg-cream border-accent text-accent'
                      : 'bg-card border-border text-ink hover:border-accent'
                  }`}
                >
                  {isConfirmed ? `${name} ✓` : name}
                </button>
              );
            })}
          </div>

          {active && (
            <div className="mt-4">
              <p className="text-center text-sm text-muted mb-2">
                Année de naissance de {active}
              </p>
              <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="_ _ _ _"
                className={`w-full text-center text-2xl font-bold tracking-[0.5em] py-3 rounded-xl border bg-card outline-none transition-all ${
                  error
                    ? 'border-error text-error'
                    : 'border-border text-ink focus:border-accent'
                }`}
              />
              {error && (
                <p className="text-center text-sm text-error mt-2">Code incorrect</p>
              )}
            </div>
          )}
        </div>
      </div>

      <PrimaryButton
        label="Commencer la leçon 1"
        onClick={() => router.push('/lesson/lesson-1')}
        disabled={!confirmed}
      />
    </main>
  );
}
