'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addCustomWord, CUSTOM_LANGS, customLessonId, deleteCustomWord, useCustomWords, type CustomLang,
} from '@/lib/custom-words';
import { useProfile } from '@/lib/profile';
import { SpeakButton } from '@/components/german/WordView';

const input = 'w-full px-4 py-3 rounded-xl border border-border bg-card text-ink text-sm placeholder:text-muted focus:outline-none focus:border-accent';

/** A profile's own words for one language: add, list, delete, practise. */
export default function MyWords({ lang }: { lang: CustomLang }) {
  const profile = useProfile();
  if (profile === undefined) return null;
  return <Words profile={profile ?? 'guest'} lang={lang} />;
}

function Words({ profile, lang }: { profile: string; lang: CustomLang }) {
  const router = useRouter();
  const all = useCustomWords(profile);
  const meta = CUSTOM_LANGS[lang];
  const id = customLessonId(lang);

  const [term, setTerm] = useState('');
  const [translation, setTranslation] = useState('');
  const [example, setExample] = useState('');
  const [exampleFr, setExampleFr] = useState('');
  const [withExample, setWithExample] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!all) return null;
  const words = all.filter((w) => w.lang === lang).reverse(); // newest first
  const canAdd = term.trim() !== '' && translation.trim() !== '';

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    addCustomWord(profile, {
      lang,
      term: term.trim(),
      translation: translation.trim(),
      example: example.trim() || undefined,
      exampleFr: exampleFr.trim() || undefined,
    });
    setTerm(''); setTranslation(''); setExample(''); setExampleFr('');
  };

  const remove = (wordId: string) => {
    if (confirmId !== wordId) { setConfirmId(wordId); return; }
    deleteCustomWord(profile, wordId);
    setConfirmId(null);
  };

  return (
    <main className="max-w-md mx-auto px-6 pb-12">
      <div className="flex items-center gap-3 pt-6 pb-4">
        <button type="button" onClick={() => router.push(meta.back)} aria-label="Retour"
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none">
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted uppercase tracking-wider">{meta.flag} {meta.label}</p>
          <h1 className="text-xl font-bold text-ink">Mes mots</h1>
        </div>
        <p className="text-sm text-muted font-medium">{words.length}</p>
      </div>

      {/* Add */}
      <form onSubmit={add} className="p-4 rounded-2xl border border-border bg-card shadow-sm mb-6 flex flex-col gap-2">
        <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Ajouter un mot</p>
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={meta.placeholder}
          aria-label={meta.termLabel} autoCapitalize="none" className={input} />
        <input value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="Traduction en français"
          aria-label="Traduction" className={input} />
        {lang === 'german' && (
          <p className="text-xs text-muted">Pour un nom, mets l&apos;article : « der Tisch ». Le mot entrera dans tes sessions.</p>
        )}
        {withExample ? (
          <>
            <input value={example} onChange={(e) => setExample(e.target.value)} placeholder={`Exemple en ${meta.label.toLowerCase()} (facultatif)`}
              aria-label="Exemple" className={input} />
            <input value={exampleFr} onChange={(e) => setExampleFr(e.target.value)} placeholder="Traduction de l'exemple (facultatif)"
              aria-label="Traduction de l'exemple" className={input} />
          </>
        ) : (
          <button type="button" onClick={() => setWithExample(true)}
            className="self-start text-xs font-semibold text-accent hover:text-accent-dark transition-colors py-1">
            + Ajouter un exemple
          </button>
        )}
        <button type="submit" disabled={!canAdd}
          className="mt-1 w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-dark active:scale-[0.98] transition-all disabled:opacity-40">
          Ajouter
        </button>
      </form>

      {/* Practise */}
      {words.length >= 2 ? (
        <div className="flex flex-col gap-2 mb-6">
          <button type="button" onClick={() => router.push(`/lesson/${id}/flashcards`)}
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base shadow-sm hover:bg-accent-dark transition-all active:scale-[0.98]">
            ✦ Apprendre (flashcards → quiz)
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.push(`/lesson/${id}/quiz`)}
              className="flex-1 py-3 rounded-xl bg-card border border-border text-ink font-semibold text-sm hover:border-accent transition-all active:scale-[0.98]">
              Quiz direct →
            </button>
            <button type="button" onClick={() => router.push(`/lesson/${id}/quiz?mode=reverse`)}
              className="flex-1 py-3 rounded-xl bg-card border border-border text-ink font-semibold text-sm hover:border-accent transition-all active:scale-[0.98]">
              Inversé ⇄
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted text-center mb-6">
          {words.length === 0 ? 'Aucun mot pour l’instant.' : 'Ajoute encore un mot.'} Il en faut 2 pour t&apos;entraîner.
        </p>
      )}

      {/* List */}
      <ul className="flex flex-col gap-2">
        {words.map((w) => (
          <li key={w.id} className="py-3 px-4 rounded-xl bg-card border border-border flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-ink">{w.term}</span>
                <span className="text-muted text-sm text-right">{w.translation}</span>
              </div>
              {w.example && (
                <p className="text-xs text-muted italic mt-1.5 border-t border-border pt-1.5">
                  {w.example}
                  {w.exampleFr && <span className="block not-italic text-muted/70">{w.exampleFr}</span>}
                </p>
              )}
            </div>
            {meta.speech && <SpeakButton text={w.term} lang={meta.speech} />}
            <button type="button" onClick={() => remove(w.id)} onBlur={() => setConfirmId(null)}
              aria-label={confirmId === w.id ? 'Confirmer la suppression' : 'Supprimer'}
              className={`shrink-0 h-9 px-2 rounded-full border text-xs font-semibold transition-all ${
                confirmId === w.id ? 'border-error text-error bg-error-bg' : 'border-border text-muted bg-cream hover:text-error w-9'
              }`}>
              {confirmId === w.id ? 'Supprimer ?' : '✕'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
