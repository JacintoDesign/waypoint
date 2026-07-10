-- Bounding-box query for on-screen map places (GiST-friendly).
-- Bounds convention: north/south = latitude, east/west = longitude (EPSG:4326).

create or replace function public.get_places_in_bounds(
  p_north double precision,
  p_south double precision,
  p_east double precision,
  p_west double precision,
  p_guide_id uuid default null
)
returns table (
  id uuid,
  guide_id uuid,
  name text,
  address text,
  notes text,
  rating smallint,
  category text,
  sort_order integer,
  latitude double precision,
  longitude double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with bounds as (
    select ST_MakeEnvelope(p_west, p_south, p_east, p_north, 4326)::extensions.geography as bbox
  )
  select
    p.id,
    p.guide_id,
    p.name,
    p.address,
    p.notes,
    p.rating,
    p.category,
    p.sort_order,
    ST_Y(p.location::geometry) as latitude,
    ST_X(p.location::geometry) as longitude
  from public.places p
  cross join bounds b
  where p.location is not null
    and p.location && b.bbox
    and ST_Intersects(p.location, b.bbox)
    and (p_guide_id is null or p.guide_id = p_guide_id)
  order by p.sort_order, p.name;
$$;

grant execute on function public.get_places_in_bounds(
  double precision,
  double precision,
  double precision,
  double precision,
  uuid
) to anon, authenticated;
