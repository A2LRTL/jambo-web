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

export const SWAHILI_CATEGORY_LABELS: Record<string, string> = {
  verbs_actions:   'Actions',
  verbs_comms:     'Communication',
  verbs_move:      'Mouvements',
  verbs_daily:     'Vie quotidienne',
  verbs_emotions:  'Émotions',
  verbs_think:     'Pensée & cognition',
  verbs_social:    'Relations sociales',
};

export const SWAHILI_CATEGORIES = Object.keys(SWAHILI_CATEGORY_LABELS);

export const SWAHILI_PHRASE_TOPIC_LABELS: Record<string, string> = {
  sw_greetings:      'Salutations',
  sw_comms:          'Communication',
  sw_directions:     'Directions',
  sw_food:           'Nourriture',
  sw_shopping:       'Shopping',
  sw_verbs_practice: 'Pratique des verbes',
};

export const SWAHILI_PHRASE_TOPICS = Object.keys(SWAHILI_PHRASE_TOPIC_LABELS);

// Legacy — kept for Swahili lesson-1 fallback
export const SWAHILI_LESSONS = [
  { id: 'lesson-1', title: 'Salutations de base', count: 5 },
];
