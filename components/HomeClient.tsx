'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_LABELS, KIRUNDI_CATEGORIES, SWAHILI_CATEGORIES, SWAHILI_CATEGORY_LABELS, SWAHILI_PHRASE_TOPICS, SWAHILI_PHRASE_TOPIC_LABELS } from '@/lib/lesson-registry';
import { PHRASE_TOPIC_LABELS, PHRASE_TOPICS } from '@/lib/phrase-registry';
import { getBestScores, type BestScore } from '@/lib/scores';
import Leaderboard from './Leaderboard';

const PROFILES = ['Shaza', 'Gisabo', 'Ruta', 'Bambara'] as const;
type ProfileName = (typeof PROFILES)[number];
type Lang = 'kirundi' | 'swahili' | 'scores';

const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'kirundi', label: 'Kirundi', flag: '🇧🇮' },
  { id: 'swahili', label: 'Swahili', flag: '🇹🇿' },
  { id: 'scores',  label: 'Scores',  flag: '🏆' },
];

// ── Suggestion logic ────────────────────────────────────────────────────────

type SuggestionType = 'new' | 'revision' | 'review';
interface Suggestion { id: string; title: string; path: string; type: SuggestionType; }

const ALL_LESSONS: { id: string; title: string; path: string }[] = [
  ...KIRUNDI_CATEGORIES.map((cat) => ({
    id: `kirundi-${cat}`,
    title: CATEGORY_LABELS[cat],
    path: `/lesson/kirundi-${cat}/flashcards`,
  })),
  ...PHRASE_TOPICS.filter((t) => t !== 'dialogue_nikiza_jenny').map((topic) => ({
    id: `phrases/${topic}`,
    title: PHRASE_TOPIC_LABELS[topic],
    path: `/phrases/${topic}`,
  })),
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSuggestion(scores: Record<string, BestScore>): Suggestion {
  const unplayed   = ALL_LESSONS.filter((l) => !scores[l.id]);
  const toRevise   = ALL_LESSONS.filter((l) => scores[l.id] && scores[l.id].best / scores[l.id].total < 0.8);
  const mastered   = ALL_LESSONS.filter((l) => scores[l.id] && scores[l.id].best / scores[l.id].total >= 0.8);

  let pool: typeof ALL_LESSONS;
  let type: SuggestionType;

  if (unplayed.length > 0 && (toRevise.length === 0 || Math.random() < 0.6)) {
    pool = unplayed; type = 'new';
  } else if (toRevise.length > 0) {
    pool = toRevise; type = 'revision';
  } else {
    pool = mastered.length > 0 ? mastered : ALL_LESSONS; type = 'review';
  }

  return { ...pick(pool), type };
}

const TYPE_LABEL: Record<SuggestionType, string> = {
  new:      '✨ Nouveau',
  revision: '🔄 À réviser',
  review:   '⭐ Pour réviser',
};
const TYPE_COLOR: Record<SuggestionType, string> = {
  new:      'text-success bg-success-bg border-success/30',
  revision: 'text-accent bg-error-bg border-error/30',
  review:   'text-muted bg-border border-border',
};

// ───────────────────────────────────────────────────────────────────────────

export default function HomeClient() {
  const router = useRouter();
  const [profile, setProfile]         = useState<ProfileName | null | 'guest'>('guest');
  const [ready, setReady]             = useState(false);
  const [lang, setLang]               = useState<Lang>('kirundi');
  const [showSwitch, setShowSwitch]   = useState(false);
  const [bestScores, setBestScores]   = useState<Record<string, BestScore>>({});
  const [suggestion, setSuggestion]   = useState<Suggestion | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('jambo_profile');
    if (saved === 'guest') { setProfile('guest'); setReady(true); return; }
    if (saved && (PROFILES as readonly string[]).includes(saved)) {
      setProfile(saved as ProfileName); setReady(true); return;
    }
    setProfile(null); setReady(true);
  }, []);

  useEffect(() => {
    if (!profile || profile === 'guest') { setBestScores({}); return; }
    getBestScores(profile).then((scores) => {
      setBestScores(scores);
      setSuggestion(buildSuggestion(scores));
    });
  }, [profile]);

  const refreshSuggestion = useCallback(() => {
    setSuggestion(buildSuggestion(bestScores));
  }, [bestScores]);

  const selectProfile = (name: ProfileName | 'guest') => {
    setProfile(name);
    localStorage.setItem('jambo_profile', name);
    setShowSwitch(false);
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

  if (!ready) return null;

  // ── Intro screen ────────────────────────────────────────────────────────
  if (profile === null) {
    return (
      <main className="flex flex-col min-h-dvh px-8 pt-16 pb-12 max-w-md mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <h1 className="text-7xl font-bold text-accent">Ubuntu</h1>
          <p className="text-muted text-base">Kirundi &amp; Swahili</p>
          <p className="text-ink font-semibold text-lg mt-6">Qui es-tu ?</p>
        </div>
        <div className="flex flex-col gap-3">
          {PROFILES.map((name) => (
            <button key={name} type="button" onClick={() => selectProfile(name)}
              className="w-full py-4 rounded-2xl border border-border bg-card text-ink text-xl font-bold hover:border-accent active:scale-[0.98] transition-all shadow-sm"
            >
              {name}
            </button>
          ))}
          <button type="button" onClick={() => selectProfile('guest')}
            className="w-full py-3 text-muted text-sm font-medium hover:text-ink transition-colors mt-1"
          >
            Continuer comme Invité
          </button>
        </div>
      </main>
    );
  }

  // ── Main app ─────────────────────────────────────────────────────────────
  return (
    <>
      <main className="max-w-md mx-auto px-6 pt-10 pb-28">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-accent">Ubuntu</h1>
            <p className="text-muted text-sm mt-1">
              {lang !== 'scores' && <>{LANGS.find((l) => l.id === lang)?.flag} {LANGS.find((l) => l.id === lang)?.label}</>}
              {lang === 'scores' && 'Classement'}
            </p>
            <a href="https://wa.me/33611764746" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted hover:text-ink transition-colors"
            >
              <span className="text-sm">💬</span>
              Poser une question à maman
            </a>
          </div>
          <button type="button" onClick={() => setShowSwitch(true)}
            className="mt-1 flex items-center gap-2 py-2 px-3 rounded-full border border-border bg-card text-sm font-semibold text-ink hover:border-accent transition-all"
          >
            <span className="text-base">👤</span>
            {profile === 'guest' ? 'Invité' : profile}
            <span className="text-muted text-xs">▾</span>
          </button>
        </div>

        {lang === 'kirundi' && (
          <>
            {/* Suggestion card */}
            {suggestion && (
              <div className="mb-6 p-4 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Suggestion</p>
                    <p className="font-bold text-ink text-base leading-snug">{suggestion.title}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[suggestion.type]}`}>
                    {TYPE_LABEL[suggestion.type]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={refreshSuggestion}
                    className="p-2 rounded-xl border border-border text-muted hover:text-ink hover:border-accent transition-all text-base"
                    aria-label="Autre suggestion"
                  >
                    🔀
                  </button>
                  <button type="button" onClick={() => router.push(suggestion.path)}
                    className="flex-1 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-dark active:scale-[0.98] transition-all"
                  >
                    Commencer →
                  </button>
                </div>
              </div>
            )}

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

            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 mt-6">Dialogues</p>
            <button type="button" onClick={() => router.push('/dialogue/nikiza_jenny')}
              className="w-full py-4 px-5 rounded-xl border border-border bg-card text-left hover:border-accent transition-all active:scale-[0.97] shadow-sm flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-bold text-ink">Nikiza rencontre Marc</p>
                <p className="text-xs text-muted mt-0.5">15 répliques · Lecture + entraînement</p>
              </div>
              <span className="text-2xl">💬</span>
            </button>
          </>
        )}

        {lang === 'scores' && <Leaderboard />}

        {lang === 'swahili' && (
          <>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Vocabulaire</p>
            <div className="grid grid-cols-2 gap-3">
              {SWAHILI_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => router.push(`/lesson/swahili-${cat}`)}
                  className="py-4 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-ink hover:border-accent transition-all active:scale-[0.97] text-left shadow-sm flex flex-col gap-1"
                >
                  <span>{SWAHILI_CATEGORY_LABELS[cat]}</span>
                  {badge(`swahili-${cat}`)}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 mt-6">Phrases</p>
            <div className="grid grid-cols-2 gap-3">
              {SWAHILI_PHRASE_TOPICS.map((topic) => (
                <button key={topic} type="button" onClick={() => router.push(`/phrases/sw/${topic}`)}
                  className="py-4 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-ink hover:border-accent transition-all active:scale-[0.97] text-left shadow-sm flex flex-col gap-1"
                >
                  <span>{SWAHILI_PHRASE_TOPIC_LABELS[topic]}</span>
                  {badge(`phrases/sw/${topic}`)}
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Language tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-cream border-t border-border">
        <div className="max-w-md mx-auto flex">
          {LANGS.map(({ id, label, flag }) => (
            <button key={id} type="button" onClick={() => setLang(id)}
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

      {/* Switch user bottom sheet */}
      <div className={`fixed inset-0 z-50 transition-all duration-200 ${showSwitch ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => setShowSwitch(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${showSwitch ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className={`absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-cream rounded-t-2xl px-6 pt-5 pb-8 transform transition-transform duration-200 ${showSwitch ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-ink text-lg">Changer d&apos;utilisateur</h2>
            <button type="button" onClick={() => setShowSwitch(false)} className="text-muted hover:text-ink p-1">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {PROFILES.map((name) => (
              <button key={name} type="button" onClick={() => selectProfile(name)}
                className={`py-3 rounded-xl border text-base font-semibold transition-all ${
                  profile === name ? 'border-accent text-accent bg-cream' : 'bg-card border-border text-ink hover:border-accent'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => selectProfile('guest')}
            className="w-full py-3 rounded-xl border border-border bg-card text-muted text-sm font-medium hover:text-ink transition-colors"
          >
            Continuer comme Invité
          </button>
        </div>
      </div>
    </>
  );
}
