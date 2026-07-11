import type { GuideRow } from "@/types/guide";
import type { NearbyPlacesRow, PlaceInBoundsRow } from "@/types/place";
import type { PhotoRow } from "@/types/photo";

type UserRow = {
  id: string;
  handle: string;
  display_name: string;
};

type PlaceRow = {
  id: string;
  guide_id: string;
  name: string;
  address: string | null;
  notes: string | null;
  rating: number | null;
  category: string | null;
  sort_order: number;
  location: string | null;
};

export type Database = {
  public: {
    Tables: {
      guides: {
        Row: GuideRow;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          cover_photo_url?: string | null;
          is_public?: boolean;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["guides"]["Insert"]>;
        Relationships: [];
      };
      places: {
        Row: PlaceRow;
        Insert: {
          id?: string;
          guide_id: string;
          name: string;
          address?: string | null;
          notes?: string | null;
          rating?: number | null;
          category?: string | null;
          sort_order?: number;
          location?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["places"]["Insert"]>;
        Relationships: [];
      };
      photos: {
        Row: PhotoRow;
        Insert: {
          id?: string;
          place_id: string;
          storage_path: string;
          caption?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: UserRow;
        Insert: UserRow;
        Update: Partial<Pick<UserRow, "handle" | "display_name">>;
        Relationships: [];
      };
    };
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
