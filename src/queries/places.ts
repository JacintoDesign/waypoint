import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BoundsParams } from "@/lib/bounds";
import { parseEwkbPoint } from "@/lib/parse-ewkb-point";
import type {
  NearbyPlace,
  NearbyPlacesRow,
  Place,
  PlaceInBounds,
  PlaceInBoundsRow,
} from "@/types/place";

export type GetPlacesNearbyParams = {
  lat: number;
  lng: number;
  radiusMeters: number;
  guideId?: string;
};

export type GetPlacesInBoundsParams = BoundsParams;

type PlaceByGuideRow = {
  id: string;
  guide_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  rating: number | null;
  category: string | null;
  sort_order: number;
  location: string;
};

function mapBasePlaceFields(
  row: Pick<
    NearbyPlacesRow | PlaceInBoundsRow,
    | "id"
    | "guide_id"
    | "name"
    | "address"
    | "notes"
    | "rating"
    | "category"
    | "sort_order"
  >,
  location: Place["location"],
): Place {
  return {
    id: row.id,
    guideId: row.guide_id,
    name: row.name,
    address: row.address,
    notes: row.notes,
    rating: row.rating,
    category: row.category,
    sortOrder: row.sort_order,
    location,
  };
}

function mapRowToNearbyPlace(row: NearbyPlacesRow): NearbyPlace {
  return {
    ...mapBasePlaceFields(row, { lat: row.lat, lng: row.lng }),
    distanceMeters: row.distance_meters,
  };
}

function mapRowToPlaceInBounds(row: PlaceInBoundsRow): PlaceInBounds {
  return mapBasePlaceFields(row, {
    lat: row.latitude,
    lng: row.longitude,
  });
}

export async function getPlacesNearby(
  params: GetPlacesNearbyParams,
): Promise<NearbyPlace[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_places_nearby", {
    lat: params.lat,
    lng: params.lng,
    radius_meters: params.radiusMeters,
    guide_id: params.guideId ?? null,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRowToNearbyPlace);
}

export async function getPlacesByGuideId(guideId: string): Promise<Place[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .select(
      "id, guide_id, name, address, notes, rating, category, sort_order, location",
    )
    .eq("guide_id", guideId)
    .not("location", "is", null)
    .order("sort_order")
    .order("name");

  if (error) {
    throw error;
  }

  return ((data ?? []) as PlaceByGuideRow[]).map((row) =>
    mapBasePlaceFields(row, parseEwkbPoint(row.location)),
  );
}

export async function getPlacesInBounds(
  params: GetPlacesInBoundsParams,
): Promise<PlaceInBounds[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_places_in_bounds", {
    p_north: params.north,
    p_south: params.south,
    p_east: params.east,
    p_west: params.west,
    p_guide_id: params.guideId ?? null,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRowToPlaceInBounds);
}
