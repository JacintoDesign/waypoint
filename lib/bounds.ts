import { z } from "zod";

/**
 * Map viewport bounds in WGS84 (EPSG:4326).
 * - north / south: latitude in degrees (-90 to 90)
 * - east / west: longitude in degrees (-180 to 180)
 */
export const boundsSchema = z
  .object({
    north: z.coerce.number().min(-90).max(90),
    south: z.coerce.number().min(-90).max(90),
    east: z.coerce.number().min(-180).max(180),
    west: z.coerce.number().min(-180).max(180),
    guideId: z.string().uuid().optional(),
  })
  .refine((bounds) => bounds.north > bounds.south, {
    message: "north must be greater than south",
    path: ["north"],
  })
  .refine((bounds) => bounds.east > bounds.west, {
    message: "east must be greater than west",
    path: ["east"],
  });

export type BoundsParams = z.infer<typeof boundsSchema>;

export function parseBoundsSearchParams(
  searchParams: URLSearchParams,
): { ok: true; data: BoundsParams } | { ok: false; error: string } {
  const guideId = searchParams.get("guideId") ?? undefined;

  const parsed = boundsSchema.safeParse({
    north: searchParams.get("north"),
    south: searchParams.get("south"),
    east: searchParams.get("east"),
    west: searchParams.get("west"),
    guideId,
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return { ok: false, error: message };
  }

  return { ok: true, data: parsed.data };
}
