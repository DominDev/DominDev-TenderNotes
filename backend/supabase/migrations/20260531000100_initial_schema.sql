create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 14),
  observation_date date,
  morning_before_nursery smallint check (morning_before_nursery between 0 and 2),
  separation smallint check (separation between 0 and 2),
  nursery_info smallint check (nursery_info between 0 and 2),
  pickup smallint check (pickup between 0 and 2),
  after_nursery_home smallint check (after_nursery_home between 0 and 2),
  play smallint check (play between 0 and 2),
  parent_contact smallint check (parent_contact between 0 and 2),
  sleep smallint check (sleep between 0 and 2),
  food smallint check (food between 0 and 2),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint observations_user_day_unique unique (user_id, day_number)
);

create table if not exists public.summary_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  answer text check (answer in ('tak', 'nie', 'nie_wiem')),
  evidence text not null default '',
  next_step text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint summary_answers_user_question_unique unique (user_id, question_key)
);

create index if not exists observations_user_id_day_number_idx
  on public.observations (user_id, day_number);

create index if not exists summary_answers_user_id_question_key_idx
  on public.summary_answers (user_id, question_key);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger observations_set_updated_at
  before update on public.observations
  for each row execute function public.set_updated_at();

create trigger summary_answers_set_updated_at
  before update on public.summary_answers
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

