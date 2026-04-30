'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_LABELS, KIRUNDI_CATEGORIES, SWAHILI_LESSONS } from '@/lib/lesson-registry';
import { PHRASE_TOPIC_LABELS, PHRASE_TOPICS } from '@/lib/phrase-registry';
import { getBestScores, type BestScore } from '@/lib/scores';
import Leaderboard from './Leaderboard';

const PROFILES = [
  { name: 'Shaza',   year: '2007' },
  { name: 'Gisabo',  year: '2000' },
  { name: 'Ruta',    year: '1998' },
  { name: 'Bambara', year: '1995' },
] as const;

type ProfileName = (typeof PROFILES)[number]['name'];
type Lang = 'kirundi' | 'swahili' | 'scores';

const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'kirundi', label: 'Kirundi', flag: '🇧🇮' },
  { id: 'swahili', label: 'Swahili', flag: '🇹🇿' },
  { id: 'scores',  label: 'Scores',  flag: '🏆' },
];

export default function HomeClient() {
  const router = useRouter();
  const [profile, setProfile]     = useState<ProfileName | null>(null);
  const [lang, setLang]           = useState<Lang>('kirundi');
  const [showModal, setShowModal] = useState(false);
  const [bestScores, setBestScores] = useState<Record<string, BestScore>>({});
  const [active, setActive]       = useState<ProfileName | null>(null);
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('jambo_profile') as ProfileName | null;
    if (saved && PROFILES.some((p) => p.name === saved)) setProfile(saved);
  }, []);

  useEffect(() => {
    if (!profile) { setBestScores({}); return; }
    getBestScores(profile).then(setBestScores);
  }, [profile]);

  const openModal = () => { setShowModal(true); setActive(null); setPin(''); setError(false); };
  const closeModal = () => setShowModal(false);

  const handleProfileClick = (name: ProfileName) => {
    setActive(name); setPin(''); setError(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlePinChange = (value: string) => {
    if (!/^\d*$/.test(value) || value.length > 4) return;
    setPin(value); setError(false);
    if (value.length === 4) {
      const found = PROFILES.find((p) => p.name === active);
      if (found?.year === value) {
        setProfile(active);
        localStorage.setItem('jambo_profile', active!);
        setActive(null);
        closeModal();
      } else { setError(true); setPin(''); }
    }
  };

  const handleGuest = () => {
    setProfile(null);
    localStorage.removeItem('jambo_profile');
    closeModal();
  };

  const badge = (id: string) => {
    const s = bestScores[id];
    if (!s) return null;
    const perfect = s.best === s.total;
    return (
      <span className={`text-xs font-bold ${perfect ? 'text-success' : 'text-accent'}`}>
        {perfect ? '★' : `${s.best}/${s.total}`}
      </span>
    );
  };

  return (
    <>
      <main className="max-w-md mx-auto px-6 pt-10 pb-28">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-accent">Jambo</h1>
            <p className="text-muted text-sm mt-1">
              {lang !== 'scores' && <>{LANGS.find((l) => l.id === lang)?.flag} {LANGS.find((l) => l.id === lang)?.label}</>}
              {lang === 'scores' && 'Classement'}
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="mt-1 flex items-center gap-2 py-2 px-3 rounded-full border border-border bg-card text-sm font-semibold text-ink hover:border-accent transition-all"
          >
            <span className="text-base">👤</span>
            {profile ?? 'Invité'}
            <span className="text-muted text-xs">▾</span>
          </button>
        </div>

        {lang === 'kirundi' && (
          <>
            {/* Kirundi vocab */}
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Vocabulaire</p>
            <div className="grid grid-cols-2 gap-3">
              {KIRUNDI_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => router.push(`/lesson/kirundi-${cat}`)}
                  className="py-4 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-ink hover:border-accent transition-all active:scale-[0.97] text-left shadow-sm flex flex-col gap-1"
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  {badge(`kirundi-${cat}`)}
                </button>
              ))}
            </div>

            {/* Phrases */}
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 mt-6">Phrases</p>
            <div className="grid grid-cols-2 gap-3">
              {PHRASE_TOPICS.filter((t) => t !== 'dialogue_nikiza_jenny').map((topic) => (
                <button key={topic} type="button" onClick={() => router.push(`/phrases/${topic}`)}
                  className="py-4 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-ink hover:border-accent transition-all active:scale-[0.97] text-left shadow-sm flex flex-col gap-1"
                >
                  <span>{PHRASE_TOPIC_LABELS[topic]}</span>
                  {badge(`phrases/${topic}`)}
                </button>
              ))}
            </div>
          </>
        )}

        {lang === 'scores' && <Leaderboard />}

        {lang === 'swahili' && (
          <>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Leçons</p>
            {SWAHILI_LESSONS.map(({ id, title, count }) => (
              <button key={id} type="button" onClick={() => router.push(`/lesson/${id}`)}
                className="w-full text-left py-4 px-5 rounded-xl border border-border bg-card hover:border-accent transition-all active:scale-[0.98] mb-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">{title}</p>
                  {badge(id)}
                </div>
                <p className="text-sm text-muted mt-0.5">{count} mots</p>
              </button>
            ))}
          </>
        )}
      </main>

      {/* Language tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-cream border-t border-border">
        <div className="max-w-md mx-auto flex">
          {LANGS.map(({ id, label, flag }) => (
            <button
              key={id}
              type="button"
              onClick={() => setLang(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                lang === id ? 'text-accent' : 'text-muted hover:text-ink'
              }`}
            >
              <span className="text-2xl leading-none">{flag}</span>
              <span className={`text-xs font-semibold ${lang === id ? 'text-accent' : 'text-muted'}`}>{label}</span>
              {lang === id && <span className="absolute bottom-0 w-12 h-0.5 bg-accent rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Profile modal */}
      <div className={`fixed inset-0 z-50 transition-all duration-200 ${showModal ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={closeModal}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${showModal ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className={`absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-cream rounded-t-2xl px-6 pt-5 pb-8 transform transition-transform duration-200 ${showModal ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-ink text-lg">Changer d&apos;utilisateur</h2>
            <button type="button" onClick={closeModal} className="text-muted hover:text-ink p-1">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PROFILES.map(({ name }) => (
              <button key={name} type="button" onClick={() => handleProfileClick(name)}
                className={`py-3 rounded-xl border text-base font-semibold transition-all ${
                  active === name ? 'bg-cream border-accent text-accent' : 'bg-card border-border text-ink hover:border-accent'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {active && (
            <div className="mb-4">
              <p className="text-center text-sm text-muted mb-2">Année de naissance de {active}</p>
              <input ref={inputRef} type="tel" inputMode="numeric" maxLength={4} value={pin}
                onChange={(e) => handlePinChange(e.target.value)} placeholder="_ _ _ _"
                className={`w-full text-center text-2xl font-bold tracking-[0.5em] py-3 rounded-xl border bg-card outline-none transition-all ${error ? 'border-error text-error' : 'border-border text-ink focus:border-accent'}`}
              />
              {error && <p className="text-center text-sm text-error mt-2">Code incorrect</p>}
            </div>
          )}
          <button type="button" onClick={handleGuest}
            className="w-full py-3 rounded-xl border border-border bg-card text-muted text-sm font-medium hover:text-ink transition-colors"
          >
            Continuer comme Invité
          </button>
        </div>
      </div>
    </>
  );
}
