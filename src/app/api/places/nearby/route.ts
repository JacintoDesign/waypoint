import { NextResponse } from "next/server";
import { getPlacesNearby } from "@/queries/places";
import { nearbyPlacesQuerySchema } from "@/lib/validation/places";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = nearbyPlacesQuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    radius: searchParams.get("radius"),
    guideId: searchParams.get("guideId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { lat, lng, radius, guideId } = parsed.data;

  try {
    const places = await getPlacesNearby({
      lat,
      lng,
      radiusMeters: radius,
      guideId,
    });

    return NextResponse.json({ places });
  } catch (error) {
    console.error("getPlacesNearby failed", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby places" },
      { status: 500 },
    );
  }
}
