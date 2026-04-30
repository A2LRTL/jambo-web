// Metadata only — no vocab JSON import, safe to use in client components.

export const CATEGORY_LABELS: Record<string, string> = {
  body_parts:     'Corps humain',
  family:         'Famille',
  food:           'Nourriture',
  fruits:         'Fruits',
  drinks:         'Boissons',
  clothing:       'Vêtements',
  household:      'Maison',
  numbers:        'Nombres',
  time:           'Temps',
  days_months:    'Jours & mois',
  health:         'Santé',
  trading:        'Commerce',
  politics:       'Politique',
  army:           'Armée',
  pets:           'Animaux (maison)',
  wild_animals:   'Animaux sauvages',
  animals_general:'Animaux',
  transport:      'Transport',
  occupations:    'Métiers',
};

export const KIRUNDI_CATEGORIES = Object.keys(CATEGORY_LABELS);

export const SWAHILI_LESSONS = [
  { id: 'lesson-1', title: 'Salutations de base', count: 5 },
];
