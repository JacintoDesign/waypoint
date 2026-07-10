export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlaceRow = {
  id: string;
  guide_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  rating: number | null;
  category: string | null;
  sort_order: number;
  location: unknown;
};

export type PlaceInBoundsRow = {
  id: string;
  guide_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  rating: number | null;
  category: string | null;
  sort_order: number;
  latitude: number;
  longitude: number;
};

export type Database = {
  public: {
    Tables: {
      places: {
        Row: PlaceRow;
        Insert: Omit<PlaceRow, "id"> & { id?: string };
        Update: Partial<PlaceRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_places_in_bounds: {
        Args: {
          p_north: number;
          p_south: number;
          p_east: number;
          p_west: number;
          p_guide_id?: string | null;
        };
        Returns: PlaceInBoundsRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
