import type { NearbyPlacesRow } from "@/types/place";

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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
