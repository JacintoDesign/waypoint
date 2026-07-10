import type { NearbyPlacesRow, PlaceInBoundsRow } from "@/types/place";

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      get_places_nearby: {
        Args: {
          lat: number;
          lng: number;
          radius_meters: number;
          guide_id?: string | null;
        };
        Returns: NearbyPlacesRow[];
      };
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
      get_places_by_guide_id: {
        Args: {
          p_guide_id: string;
        };
        Returns: PlaceInBoundsRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
