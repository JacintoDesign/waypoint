export type PhotoRow = {
  id: string;
  place_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
};

export type SignedPlacePhoto = {
  id: string;
  placeId: string;
  caption: string | null;
  sortOrder: number;
  url: string;
  expiresAt: number;
};

export type SignedPhotoResponse = {
  url: string;
  expiresAt: number;
};
