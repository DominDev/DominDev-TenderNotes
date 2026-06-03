create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  birth_month date,
  age_band text not null default '0-2',
  avatar_color text not null default '#2f746f',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint children_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint children_age_band_check check (age_band in ('0-2', '3-5', '6-8', '9-12', '13+'))
);

create table if not exists public.child_members (
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, user_id),
  constraint child_members_role_check check (role in ('owner', 'editor', 'viewer'))
);

create index if not exists children_owner_user_id_idx
  on public.children (owner_user_id);

create index if not exists children_active_owner_idx
  on public.children (owner_user_id, archived_at);

create index if not exists child_members_user_id_idx
  on public.child_members (user_id);

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

create trigger child_members_set_updated_at
  before update on public.child_members
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_child()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.child_members (child_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (child_id, user_id) do update
  set
    role = 'owner',
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_child_created on public.children;

create trigger on_child_created
  after insert on public.children
  for each row execute function public.handle_new_child();

alter table public.children enable row level security;
alter table public.child_members enable row level security;

create policy "Users can read their child memberships"
  on public.child_members
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their children"
  on public.children
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = children.id
        and child_members.user_id = (select auth.uid())
    )
  );

create policy "Users can create owned children"
  on public.children
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_user_id);

create policy "Owners and editors can update children"
  on public.children
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = children.id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  )
  with check (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = children.id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  );

alter table public.observations
  add column if not exists child_id uuid references public.children(id) on delete cascade;

alter table public.summary_answers
  add column if not exists child_id uuid references public.children(id) on delete cascade;

insert into public.children (owner_user_id, display_name, birth_month, age_band, avatar_color)
select
  profiles.id,
  case
    when lower(coalesce(profiles.email, '')) = 'niakniak0803@gmail.com' then 'Mila'
    when lower(coalesce(profiles.email, '')) in ('p.dominiak.pd@gmail.com', 'pawel.dominiak@domindev.com') then 'Wiktoria'
    else 'Dziecko'
  end,
  case
    when lower(coalesce(profiles.email, '')) in ('p.dominiak.pd@gmail.com', 'pawel.dominiak@domindev.com') then date '2024-11-01'
    else null
  end,
  '0-2',
  case
    when lower(coalesce(profiles.email, '')) = 'niakniak0803@gmail.com' then '#4976a8'
    when lower(coalesce(profiles.email, '')) in ('p.dominiak.pd@gmail.com', 'pawel.dominiak@domindev.com') then '#c06f3d'
    else '#2f746f'
  end
from public.profiles profiles
where not exists (
  select 1
  from public.children children
  where children.owner_user_id = profiles.id
);

insert into public.child_members (child_id, user_id, role)
select children.id, children.owner_user_id, 'owner'
from public.children children
where not exists (
  select 1
  from public.child_members child_members
  where child_members.child_id = children.id
    and child_members.user_id = children.owner_user_id
);

update public.observations observations
set child_id = (
  select children.id
  from public.children children
  where children.owner_user_id = observations.user_id
  order by children.created_at, children.id
  limit 1
)
where observations.child_id is null;

update public.summary_answers summary_answers
set child_id = (
  select children.id
  from public.children children
  where children.owner_user_id = summary_answers.user_id
  order by children.created_at, children.id
  limit 1
)
where summary_answers.child_id is null;

alter table public.observations
  alter column child_id set not null;

alter table public.summary_answers
  alter column child_id set not null;

alter table public.observations
  drop constraint if exists observations_user_day_unique;

alter table public.summary_answers
  drop constraint if exists summary_answers_user_question_unique;

alter table public.observations
  add constraint observations_child_day_unique unique (child_id, day_number);

alter table public.summary_answers
  add constraint summary_answers_child_question_unique unique (child_id, question_key);

drop index if exists observations_user_id_day_number_idx;
drop index if exists summary_answers_user_id_question_key_idx;

create index if not exists observations_child_id_day_number_idx
  on public.observations (child_id, day_number);

create index if not exists observations_user_id_child_id_idx
  on public.observations (user_id, child_id);

create index if not exists summary_answers_child_id_question_key_idx
  on public.summary_answers (child_id, question_key);

create index if not exists summary_answers_user_id_child_id_idx
  on public.summary_answers (user_id, child_id);

drop policy if exists "Users can read their own observations" on public.observations;
drop policy if exists "Users can insert their own observations" on public.observations;
drop policy if exists "Users can update their own observations" on public.observations;
drop policy if exists "Users can delete their own observations" on public.observations;

create policy "Members can read child observations"
  on public.observations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = observations.child_id
        and child_members.user_id = (select auth.uid())
    )
  );

create policy "Editors can insert child observations"
  on public.observations
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = observations.child_id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  );

create policy "Editors can update child observations"
  on public.observations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = observations.child_id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = observations.child_id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  );

create policy "Editors can delete child observations"
  on public.observations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = observations.child_id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  );

drop policy if exists "Users can read their own summary answers" on public.summary_answers;
drop policy if exists "Users can insert their own summary answers" on public.summary_answers;
drop policy if exists "Users can update their own summary answers" on public.summary_answers;
drop policy if exists "Users can delete their own summary answers" on public.summary_answers;

create policy "Members can read child summary answers"
  on public.summary_answers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = summary_answers.child_id
        and child_members.user_id = (select auth.uid())
    )
  );

create policy "Editors can insert child summary answers"
  on public.summary_answers
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = summary_answers.child_id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  );

create policy "Editors can update child summary answers"
  on public.summary_answers
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = summary_answers.child_id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = summary_answers.child_id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  );

create policy "Editors can delete child summary answers"
  on public.summary_answers
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.child_members child_members
      where child_members.child_id = summary_answers.child_id
        and child_members.user_id = (select auth.uid())
        and child_members.role in ('owner', 'editor')
    )
  );
