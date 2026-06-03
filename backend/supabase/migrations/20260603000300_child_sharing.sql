alter table public.child_members
  add column if not exists member_email text,
  add column if not exists member_display_name text;

update public.child_members child_members
set
  member_email = coalesce(child_members.member_email, profiles.email),
  member_display_name = coalesce(child_members.member_display_name, profiles.display_name)
from public.profiles profiles
where profiles.id = child_members.user_id;

create table if not exists public.child_invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  email text not null,
  role text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint child_invitations_email_not_blank check (length(trim(email)) > 0),
  constraint child_invitations_role_check check (role in ('editor', 'viewer')),
  constraint child_invitations_status_check check (status in ('pending', 'accepted', 'declined', 'canceled'))
);

create index if not exists child_invitations_child_id_idx
  on public.child_invitations (child_id);

create index if not exists child_invitations_email_status_idx
  on public.child_invitations (email, status);

create unique index if not exists child_invitations_pending_unique
  on public.child_invitations (child_id, email)
  where status = 'pending';

drop trigger if exists child_invitations_set_updated_at on public.child_invitations;

create trigger child_invitations_set_updated_at
  before update on public.child_invitations
  for each row execute function public.set_updated_at();

create or replace function public.normalize_child_invitation()
returns trigger
language plpgsql
as $$
begin
  new.email = lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists child_invitations_normalize on public.child_invitations;

create trigger child_invitations_normalize
  before insert or update on public.child_invitations
  for each row execute function public.normalize_child_invitation();

create or replace function public.has_child_role(p_child_id uuid, p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.child_members child_members
    where child_members.child_id = p_child_id
      and child_members.user_id = (select auth.uid())
      and (p_roles is null or child_members.role = any(p_roles))
  );
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce((select auth.jwt() ->> 'email'), ''));
$$;

create or replace function public.handle_new_child()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_profile record;
begin
  select profiles.email, profiles.display_name
  into owner_profile
  from public.profiles profiles
  where profiles.id = new.owner_user_id;

  insert into public.child_members (child_id, user_id, role, member_email, member_display_name)
  values (new.id, new.owner_user_id, 'owner', owner_profile.email, owner_profile.display_name)
  on conflict (child_id, user_id) do update
  set
    role = 'owner',
    member_email = coalesce(excluded.member_email, public.child_members.member_email),
    member_display_name = coalesce(excluded.member_display_name, public.child_members.member_display_name),
    updated_at = now();

  return new;
end;
$$;

alter table public.child_invitations enable row level security;

drop policy if exists "Users can read their child memberships" on public.child_members;

create policy "Members can read child memberships"
  on public.child_members
  for select
  to authenticated
  using (public.has_child_role(child_id, null));

drop policy if exists "Owners can update child memberships" on public.child_members;

create policy "Owners can update child memberships"
  on public.child_members
  for update
  to authenticated
  using (public.has_child_role(child_id, array['owner']))
  with check (public.has_child_role(child_id, array['owner']));

drop policy if exists "Owners can delete child memberships" on public.child_members;

create policy "Owners can delete child memberships"
  on public.child_members
  for delete
  to authenticated
  using (public.has_child_role(child_id, array['owner']));

drop policy if exists "Owners can read child invitations" on public.child_invitations;

create policy "Owners can read child invitations"
  on public.child_invitations
  for select
  to authenticated
  using (
    public.has_child_role(child_id, array['owner'])
    or (status = 'pending' and email = public.current_user_email())
  );

drop policy if exists "Owners can create child invitations" on public.child_invitations;

create policy "Owners can create child invitations"
  on public.child_invitations
  for insert
  to authenticated
  with check (
    invited_by = (select auth.uid())
    and public.has_child_role(child_id, array['owner'])
  );

drop policy if exists "Owners can update child invitations" on public.child_invitations;

create policy "Owners can update child invitations"
  on public.child_invitations
  for update
  to authenticated
  using (public.has_child_role(child_id, array['owner']))
  with check (public.has_child_role(child_id, array['owner']));

drop policy if exists "Users can read their children" on public.children;

create policy "Users can read their children"
  on public.children
  for select
  to authenticated
  using (
    public.has_child_role(id, null)
    or exists (
      select 1
      from public.child_invitations child_invitations
      where child_invitations.child_id = children.id
        and child_invitations.email = public.current_user_email()
        and child_invitations.status = 'pending'
    )
  );

create or replace function public.invite_child_member(p_child_id uuid, p_email text, p_role text)
returns public.child_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  existing_user_id uuid;
  invitation public.child_invitations;
begin
  normalized_email := lower(trim(p_email));

  if not public.has_child_role(p_child_id, array['owner']) then
    raise exception 'Only child owners can invite caregivers.';
  end if;

  if p_role not in ('editor', 'viewer') then
    raise exception 'Invalid caregiver role.';
  end if;

  if normalized_email = '' or normalized_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid invitation email.';
  end if;

  select profiles.id
  into existing_user_id
  from public.profiles profiles
  where lower(profiles.email) = normalized_email
  limit 1;

  if existing_user_id is not null and exists (
    select 1
    from public.child_members child_members
    where child_members.child_id = p_child_id
      and child_members.user_id = existing_user_id
  ) then
    raise exception 'This user already has access to the child profile.';
  end if;

  update public.child_invitations
  set
    role = p_role,
    invited_by = (select auth.uid()),
    updated_at = now()
  where child_id = p_child_id
    and email = normalized_email
    and status = 'pending'
  returning * into invitation;

  if invitation.id is null then
    insert into public.child_invitations (child_id, email, role, invited_by)
    values (p_child_id, normalized_email, p_role, (select auth.uid()))
    returning * into invitation;
  end if;

  return invitation;
end;
$$;

create or replace function public.accept_child_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.child_invitations;
  profile public.profiles;
begin
  select *
  into invitation
  from public.child_invitations
  where id = p_invitation_id
    and status = 'pending'
    and email = public.current_user_email();

  if invitation.id is null then
    raise exception 'Invitation not found.';
  end if;

  select *
  into profile
  from public.profiles
  where id = (select auth.uid());

  insert into public.child_members (child_id, user_id, role, member_email, member_display_name)
  values (invitation.child_id, (select auth.uid()), invitation.role, profile.email, profile.display_name)
  on conflict (child_id, user_id) do update
  set
    role = excluded.role,
    member_email = coalesce(excluded.member_email, public.child_members.member_email),
    member_display_name = coalesce(excluded.member_display_name, public.child_members.member_display_name),
    updated_at = now();

  update public.child_invitations
  set
    status = 'accepted',
    responded_at = now(),
    updated_at = now()
  where id = invitation.id;

  return invitation.child_id;
end;
$$;

create or replace function public.decline_child_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.child_invitations;
begin
  update public.child_invitations
  set
    status = 'declined',
    responded_at = now(),
    updated_at = now()
  where id = p_invitation_id
    and status = 'pending'
    and email = public.current_user_email()
  returning * into invitation;

  if invitation.id is null then
    raise exception 'Invitation not found.';
  end if;

  return invitation.child_id;
end;
$$;

create or replace function public.cancel_child_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.child_invitations;
begin
  select *
  into invitation
  from public.child_invitations
  where id = p_invitation_id
    and status = 'pending';

  if invitation.id is null then
    raise exception 'Invitation not found.';
  end if;

  if not public.has_child_role(invitation.child_id, array['owner']) then
    raise exception 'Only child owners can cancel invitations.';
  end if;

  update public.child_invitations
  set
    status = 'canceled',
    responded_at = now(),
    updated_at = now()
  where id = invitation.id;

  return invitation.child_id;
end;
$$;

create or replace function public.update_child_member_role(p_child_id uuid, p_user_id uuid, p_role text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_child_role(p_child_id, array['owner']) then
    raise exception 'Only child owners can change caregiver roles.';
  end if;

  if p_role not in ('editor', 'viewer') then
    raise exception 'Invalid caregiver role.';
  end if;

  update public.child_members
  set
    role = p_role,
    updated_at = now()
  where child_id = p_child_id
    and user_id = p_user_id
    and role <> 'owner';

  if not found then
    raise exception 'Caregiver not found or cannot change owner role.';
  end if;

  return p_child_id;
end;
$$;

create or replace function public.remove_child_member(p_child_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_child_role(p_child_id, array['owner']) then
    raise exception 'Only child owners can remove caregivers.';
  end if;

  delete from public.child_members
  where child_id = p_child_id
    and user_id = p_user_id
    and role <> 'owner';

  if not found then
    raise exception 'Caregiver not found or cannot remove owner.';
  end if;

  return p_child_id;
end;
$$;

grant execute on function public.invite_child_member(uuid, text, text) to authenticated;
grant execute on function public.accept_child_invitation(uuid) to authenticated;
grant execute on function public.decline_child_invitation(uuid) to authenticated;
grant execute on function public.cancel_child_invitation(uuid) to authenticated;
grant execute on function public.update_child_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_child_member(uuid, uuid) to authenticated;
grant execute on function public.has_child_role(uuid, text[]) to authenticated;
grant execute on function public.current_user_email() to authenticated;
