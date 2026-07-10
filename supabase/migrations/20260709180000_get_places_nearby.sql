-- Nearby places query using PostGIS spatial index on places.location
create or replace function public.get_places_nearby(
  lat double precision,
  lng double precision,
  radius_meters double precision,
  guide_id uuid default null
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
  lat double precision,
  lng double precision,
  distance_meters double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with query_point as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as geom
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
    st_y(p.location::geometry) as lat,
    st_x(p.location::geometry) as lng,
    st_distance(p.location, query_point.geom) as distance_meters
  from public.places p
  cross join query_point
  where p.location is not null
    and st_dwithin(p.location, query_point.geom, radius_meters)
    and (get_places_nearby.guide_id is null or p.guide_id = get_places_nearby.guide_id)
  order by distance_meters asc;
$$;

grant execute on function public.get_places_nearby(
  double precision,
  double precision,
  double precision,
  uuid
) to anon, authenticated;
