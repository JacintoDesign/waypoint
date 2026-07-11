import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BoundsParams } from "@/lib/bounds";
import { toGeographyPoint } from "@/lib/geography";
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
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
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

export type CreatePlaceInput = {
  guideId: string;
  name: string;
  address?: string | null;
  notes?: string | null;
  category?: string | null;
  rating?: number | null;
  location: Place["location"];
  sortOrder: number;
};

export type UpdatePlaceInput = {
  placeId: string;
  guideId: string;
  name: string;
  address?: string | null;
  notes?: string | null;
  category?: string | null;
  rating?: number | null;
  location: Place["location"];
};

export async function getPlaceByIdForGuide(
  placeId: string,
  guideId: string,
): Promise<Place | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .select(
      "id, guide_id, name, address, notes, rating, category, sort_order, location",
    )
    .eq("id", placeId)
    .eq("guide_id", guideId)
    .not("location", "is", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as PlaceByGuideRow;
  return mapBasePlaceFields(row, parseEwkbPoint(row.location));
}

export async function createPlace(input: CreatePlaceInput): Promise<Place> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .insert({
      guide_id: input.guideId,
      name: input.name,
      address: input.address ?? null,
      notes: input.notes ?? null,
      category: input.category ?? null,
      rating: input.rating ?? null,
      sort_order: input.sortOrder,
      location: toGeographyPoint(input.location),
    })
    .select(
      "id, guide_id, name, address, notes, rating, category, sort_order, location",
    )
    .single();

  if (error) {
    throw error;
  }

  const row = data as PlaceByGuideRow;
  return mapBasePlaceFields(row, parseEwkbPoint(row.location));
}

export async function updatePlace(input: UpdatePlaceInput): Promise<Place> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("places")
    .update({
      name: input.name,
      address: input.address ?? null,
      notes: input.notes ?? null,
      category: input.category ?? null,
      rating: input.rating ?? null,
      location: toGeographyPoint(input.location),
    })
    .eq("id", input.placeId)
    .eq("guide_id", input.guideId)
    .select(
      "id, guide_id, name, address, notes, rating, category, sort_order, location",
    )
    .single();

  if (error) {
    throw error;
  }

  const row = data as PlaceByGuideRow;
  return mapBasePlaceFields(row, parseEwkbPoint(row.location));
}

export async function updatePlaceAddress(
  placeId: string,
  guideId: string,
  address: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("places")
    .update({ address })
    .eq("id", placeId)
    .eq("guide_id", guideId);

  if (error) {
    throw error;
  }
}

export async function deletePlace(
  placeId: string,
  guideId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("places")
    .delete()
    .eq("id", placeId)
    .eq("guide_id", guideId);

  if (error) {
    throw error;
  }
}

export async function getPlacesInBounds(
  params: GetPlacesInBoundsParams,
): Promise<PlaceInBounds[]> {
  const supabase = await createSupabaseServerClient();
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
