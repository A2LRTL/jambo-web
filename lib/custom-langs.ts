// Metadata for the learner's own words — no hooks, safe in server components.

export const CUSTOM_LANGS = {
  kirundi: { label: 'Kirundi',  flag: '🇧🇮', termLabel: 'Kirundi',   placeholder: 'ex. amazi',      speech: null,    back: '/' },
  swahili: { label: 'Swahili',  flag: '🇹🇿', termLabel: 'Kiswahili', placeholder: 'ex. maji',       speech: 'sw-KE', back: '/' },
  english: { label: 'Anglais',  flag: '🇬🇧', termLabel: 'English',   placeholder: 'ex. to look forward to', speech: 'en-GB', back: '/' },
  german:  { label: 'Allemand', flag: '🇩🇪', termLabel: 'Deutsch',   placeholder: 'ex. der Tisch',  speech: 'de-DE', back: '/de' },
  latin:   { label: 'Latin',    flag: '🏛️', termLabel: 'Latin',     placeholder: 'ex. carpe diem', speech: null,    back: '/' },
} as const;

export type CustomLang = keyof typeof CUSTOM_LANGS;

export function isCustomLang(s: string): s is CustomLang {
  return s in CUSTOM_LANGS;
}

/** Lesson id used by the /lesson/[id] routes for a language's own words. */
export const customLessonId = (lang: CustomLang) => `mine-${lang}`;
