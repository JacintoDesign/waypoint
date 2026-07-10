import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NearbyPlacesRow, PlaceWithDistance } from "@/types/place";

export type GetPlacesNearbyParams = {
  lat: number;
  lng: number;
  radiusMeters: number;
  guideId?: string;
};

function mapRowToPlaceWithDistance(row: NearbyPlacesRow): PlaceWithDistance {
  return {
    id: row.id,
    guideId: row.guide_id,
    name: row.name,
    address: row.address,
    notes: row.notes,
    rating: row.rating,
    category: row.category,
    sortOrder: row.sort_order,
    location: {
      lat: row.lat,
      lng: row.lng,
    },
    distanceMeters: row.distance_meters,
  };
}

export async function getPlacesNearby(
  params: GetPlacesNearbyParams,
): Promise<PlaceWithDistance[]> {
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

  return (data ?? []).map(mapRowToPlaceWithDistance);
}
