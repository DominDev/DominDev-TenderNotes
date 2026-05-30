alter table public.profiles enable row level security;
alter table public.observations enable row level security;
alter table public.summary_answers enable row level security;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can read their own observations"
  on public.observations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own observations"
  on public.observations
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own observations"
  on public.observations
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own observations"
  on public.observations
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own summary answers"
  on public.summary_answers
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own summary answers"
  on public.summary_answers
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own summary answers"
  on public.summary_answers
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own summary answers"
  on public.summary_answers
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

