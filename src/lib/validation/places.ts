import { z } from "zod";

export const nearbyPlacesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(50_000),
  guideId: z.string().uuid().optional(),
});

export type NearbyPlacesQuery = z.infer<typeof nearbyPlacesQuerySchema>;
