-- ─── Scores ───────────────────────────────────────────────────────────────────
-- Quiz results per named profile (no auth required).
-- Run once in the Supabase SQL editor.

create table if not exists scores (
  id         uuid        primary key default gen_random_uuid(),
  profile    text        not null,
  lesson_id  text        not null,
  score      int         not null,
  total      int         not null,
  created_at timestamptz not null default now()
);

alter table scores enable row level security;
create policy "Public read scores"   on scores for select using (true);
create policy "Public insert scores" on scores for insert with check (true);


-- ─── Reports ─────────────────────────────────────────────────────────────────
-- Translation issue flags from users.
-- Readable only via Supabase dashboard (service role) — no public read policy.

create table if not exists reports (
  id          uuid        primary key default gen_random_uuid(),
  term        text        not null,
  translation text        not null,
  lesson_id   text        not null,
  profile     text,
  created_at  timestamptz not null default now()
);

alter table reports enable row level security;
create policy "Public insert reports" on reports for insert with check (true);


-- ─── German progress ─────────────────────────────────────────────────────────
-- Per-word spaced-repetition state for the German section (lib/german/progress.ts).
-- The app keeps working offline without it; rows are upserted on every review.

create table if not exists de_progress (
  profile    text        not null,
  word_id    text        not null,
  box        int         not null,
  due        timestamptz not null,
  reps       int         not null default 0,
  lapses     int         not null default 0,
  updated_at timestamptz not null default now(),
  primary key (profile, word_id)
);

alter table de_progress enable row level security;
create policy "Public read de_progress"   on de_progress for select using (true);
create policy "Public insert de_progress" on de_progress for insert with check (true);
create policy "Public update de_progress" on de_progress for update using (true) with check (true);
