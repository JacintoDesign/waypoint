export type PlaceInBounds = {
  id: string;
  guideId: string;
  name: string;
  address: string | null;
  notes: string | null;
  rating: number | null;
  category: string | null;
  sortOrder: number;
  location: {
    latitude: number;
    longitude: number;
  };
};

export type PlacesInBoundsResponse = {
  places: PlaceInBounds[];
};
