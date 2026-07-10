import { createSupabaseClient } from "@/lib/supabase/server";
import type { BoundsParams } from "@/lib/bounds";
import type { PlaceInBounds } from "@/types/place";
import type { PlaceInBoundsRow } from "@/types/database";

export type GetPlacesInBoundsParams = BoundsParams;

function mapRowToPlace(row: PlaceInBoundsRow): PlaceInBounds {
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
      latitude: row.latitude,
      longitude: row.longitude,
    },
  };
}

export async function getPlacesInBounds(
  params: GetPlacesInBoundsParams,
): Promise<PlaceInBounds[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.rpc("get_places_in_bounds", {
    p_north: params.north,
    p_south: params.south,
    p_east: params.east,
    p_west: params.west,
    p_guide_id: params.guideId ?? null,
  });

  if (error) {
    throw new Error(`Failed to fetch places in bounds: ${error.message}`);
  }

  return (data ?? []).map(mapRowToPlace);
}
