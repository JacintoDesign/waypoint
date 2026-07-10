export type PlaceLocation = {
  lat: number;
  lng: number;
};

export type Place = {
  id: string;
  guideId: string;
  name: string;
  address: string | null;
  notes: string | null;
  rating: number | null;
  category: string | null;
  sortOrder: number;
  location: PlaceLocation;
};

export type PlaceWithDistance = Place & {
  distanceMeters: number;
};

export type NearbyPlacesRow = {
  id: string;
  guide_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  rating: number | null;
  category: string | null;
  sort_order: number;
  lat: number;
  lng: number;
  distance_meters: number;
};
