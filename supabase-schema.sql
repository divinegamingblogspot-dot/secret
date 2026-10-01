-- NIHARIKA WEBSITE BACKEND — run this later in the Supabase SQL editor
-- This file is intentionally separate from the public website.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Niharika',
  instagram_url text default '',
  bio text default '',
  hero_line text default 'Her space. Her style. Her moments.',
  avatar_path text,
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  slot_key text not null default '',
  title text not null default '',
  caption text default '',
  media_type text not null default 'image' check (media_type in ('image','video')),
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_public_order_idx on public.media (is_published, sort_order, created_at desc);
create index if not exists media_owner_idx on public.media (owner_id);
create index if not exists media_slot_idx on public.media (slot_key, is_published);

alter table public.profiles enable row level security;
alter table public.media enable row level security;

create policy "public can read published media" on public.media for select to anon, authenticated
using (is_published = true);

create policy "owner can read own media" on public.media for select to authenticated
using (auth.uid() = owner_id);

create policy "owner can insert own media" on public.media for insert to authenticated
with check (auth.uid() = owner_id);

create policy "owner can update own media" on public.media for update to authenticated
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner can delete own media" on public.media for delete to authenticated
using (auth.uid() = owner_id);

create policy "public can read profile" on public.profiles for select to anon, authenticated
using (true);

create policy "owner can insert profile" on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "owner can update profile" on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

-- Storage bucket should be created in the Dashboard as: pia-media
-- Then add Storage policies restricting insert/update/delete to authenticated users
-- whose folder prefix matches auth.uid().


-- Run once after the table exists if you are upgrading an older schema:
alter table public.media add column if not exists slot_key text not null default '';

-- Storage: create a public bucket named pia-media in Dashboard > Storage.
-- Authenticated owners are the only users allowed to write/delete their own folder.
create policy "authenticated owners can upload Niharika media" on storage.objects
for insert to authenticated
with check (bucket_id = 'pia-media' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "authenticated owners can update Niharika media" on storage.objects
for update to authenticated
using (bucket_id = 'pia-media' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'pia-media' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "authenticated owners can delete Niharika media" on storage.objects
for delete to authenticated
using (bucket_id = 'pia-media' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Data API table grants: RLS controls rows, these grants allow the API roles to access the tables.
grant select on public.media to anon, authenticated;
grant insert, update, delete on public.media to authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
