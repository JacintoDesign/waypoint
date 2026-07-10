-- Fetch all places for a guide without a bounding box (avoids antipodal geography errors).

create or replace function public.get_places_by_guide_id(p_guide_id uuid)
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
  where p.guide_id = p_guide_id
    and p.location is not null
  order by p.sort_order, p.name;
$$;

grant execute on function public.get_places_by_guide_id(uuid) to anon, authenticated;
