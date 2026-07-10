import { NextResponse } from "next/server";
import { parseBoundsSearchParams } from "@/lib/bounds";
import { getPlacesInBounds } from "@/queries/places";
import type { PlacesInBoundsResponse } from "@/types/place";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = parseBoundsSearchParams(searchParams);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const places = await getPlacesInBounds(parsed.data);
    const body: PlacesInBoundsResponse = { places };
    return NextResponse.json(body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch places";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
