-- Expense Splitter cloud foundation. Apply in Supabase SQL Editor after creating the project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  currency_code text not null default 'INR',
  preferences jsonb not null default '{}'::jsonb,
  saved_people text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  created_by uuid not null references auth.users (id) on delete cascade,
  data jsonb not null default '{"people": [], "expenses": [], "payments": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists groups_created_by_updated_at_idx on public.groups (created_by, updated_at desc);
create index if not exists group_members_user_id_idx on public.group_members (user_id, group_id);

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = target_group_id and gm.user_id = auth.uid()
  );
$$;

create or replace function public.add_group_owner_membership()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists groups_add_owner_membership on public.groups;
create trigger groups_add_owner_membership
after insert on public.groups
for each row execute function public.add_group_owner_membership();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_expense_splitter on auth.users;
create trigger on_auth_user_created_expense_splitter
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "groups read as member" on public.groups;
create policy "groups read as member" on public.groups for select to authenticated using (public.is_group_member(id));
drop policy if exists "groups create as owner" on public.groups;
create policy "groups create as owner" on public.groups for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "groups update as member" on public.groups;
create policy "groups update as member" on public.groups for update to authenticated using (public.is_group_member(id)) with check (public.is_group_member(id));
drop policy if exists "groups delete as owner" on public.groups;
create policy "groups delete as owner" on public.groups for delete to authenticated using (created_by = auth.uid());

drop policy if exists "members read in own groups" on public.group_members;
create policy "members read in own groups" on public.group_members for select to authenticated using (public.is_group_member(group_id));
drop policy if exists "owners add members" on public.group_members;
create policy "owners add members" on public.group_members for insert to authenticated with check (
  exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid())
);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert on public.group_members to authenticated;
