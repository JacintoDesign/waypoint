-- Enable PostGIS before any location columns
create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique,
  display_name text not null
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text,
  cover_photo_url text,
  is_public boolean not null default false,
  slug text not null unique
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides (id) on delete cascade,
  name text not null,
  address text,
  notes text,
  rating smallint check (rating between 1 and 5),
  category text,
  sort_order integer not null default 0,
  location extensions.geography (point, 4326)
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index guides_user_id_idx on public.guides (user_id);
create index places_guide_id_idx on public.places (guide_id);
create index places_location_idx on public.places using gist (location);
create index photos_place_id_idx on public.photos (place_id);

-- ---------------------------------------------------------------------------
-- Slug generation (unique, URL-safe, set on guide creation)
-- ---------------------------------------------------------------------------

create or replace function public.generate_guide_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 0;
begin
  base_slug := lower(regexp_replace(trim(new.title), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');

  if base_slug = '' then
    base_slug := 'guide';
  end if;

  candidate := base_slug;

  while exists (
    select 1
    from public.guides
    where slug = candidate
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

create trigger guides_set_slug
  before insert on public.guides
  for each row
  execute function public.generate_guide_slug();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.guides enable row level security;
alter table public.places enable row level security;
alter table public.photos enable row level security;

-- users: read and write own profile only
create policy "users_select_own"
  on public.users
  for select
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users
  for insert
  with check (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users_delete_own"
  on public.users
  for delete
  using (auth.uid() = id);

-- guides: owner has full access; anyone can read public guides
create policy "guides_select_public_or_own"
  on public.guides
  for select
  using (is_public = true or auth.uid() = user_id);

create policy "guides_insert_own"
  on public.guides
  for insert
  with check (auth.uid() = user_id);

create policy "guides_update_own"
  on public.guides
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "guides_delete_own"
  on public.guides
  for delete
  using (auth.uid() = user_id);

-- places: owner has full access; readable when parent guide is public
create policy "places_select_public_or_own"
  on public.places
  for select
  using (
    exists (
      select 1
      from public.guides g
      where g.id = places.guide_id
        and (g.is_public = true or g.user_id = auth.uid())
    )
  );

create policy "places_insert_own"
  on public.places
  for insert
  with check (
    exists (
      select 1
      from public.guides g
      where g.id = places.guide_id
        and g.user_id = auth.uid()
    )
  );

create policy "places_update_own"
  on public.places
  for update
  using (
    exists (
      select 1
      from public.guides g
      where g.id = places.guide_id
        and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.guides g
      where g.id = places.guide_id
        and g.user_id = auth.uid()
    )
  );

create policy "places_delete_own"
  on public.places
  for delete
  using (
    exists (
      select 1
      from public.guides g
      where g.id = places.guide_id
        and g.user_id = auth.uid()
    )
  );

-- photos: owner has full access; readable when parent guide is public
create policy "photos_select_public_or_own"
  on public.photos
  for select
  using (
    exists (
      select 1
      from public.places p
      join public.guides g on g.id = p.guide_id
      where p.id = photos.place_id
        and (g.is_public = true or g.user_id = auth.uid())
    )
  );

create policy "photos_insert_own"
  on public.photos
  for insert
  with check (
    exists (
      select 1
      from public.places p
      join public.guides g on g.id = p.guide_id
      where p.id = photos.place_id
        and g.user_id = auth.uid()
    )
  );

create policy "photos_update_own"
  on public.photos
  for update
  using (
    exists (
      select 1
      from public.places p
      join public.guides g on g.id = p.guide_id
      where p.id = photos.place_id
        and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.places p
      join public.guides g on g.id = p.guide_id
      where p.id = photos.place_id
        and g.user_id = auth.uid()
    )
  );

create policy "photos_delete_own"
  on public.photos
  for delete
  using (
    exists (
      select 1
      from public.places p
      join public.guides g on g.id = p.guide_id
      where p.id = photos.place_id
        and g.user_id = auth.uid()
    )
  );
