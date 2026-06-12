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
