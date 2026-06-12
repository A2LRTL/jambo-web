import { supabase } from './supabase';

export async function saveReport(
  term: string,
  translation: string,
  lessonId: string,
): Promise<void> {
  const profile =
    typeof window !== 'undefined'
      ? (localStorage.getItem('jambo_profile') ?? null)
      : null;

  const { error } = await supabase.from('reports').insert({
    term,
    translation,
    lesson_id: lessonId,
    profile: profile === 'guest' ? null : profile,
  });

  if (error) {
    console.error('saveReport:', error.message);
    throw error;
  }
}
